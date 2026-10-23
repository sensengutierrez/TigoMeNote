// TigoMeNote · posts-fast (Supabase Edge Function, verify_jwt = off)
// Posts na may offline queue + schedule. Lahat ng action ay kailangan ng session token (x-session-token).
// Actions: createUpload, createPost, myPosts, feed, updatePost, deletePost
// Storage: private bucket "post-media" — signed upload URL (pang-upload) at signed read URL (1 oras).
// Secrets: AUTH_PEPPER (hindi ginagamit dito), SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (automatic).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const BUCKET = "post-media";
const MAX_MEDIA_PER_POST = 10;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;     // compressed photo (~300 KB karaniwan)
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;    // compressed 720p na ≤15 s
const MAX_VIDEO_SECONDS = 15.5;
const MEDIA_PER_DAY = 40;                    // bawat user
const STORAGE_CAP_BYTES = 850 * 1024 * 1024; // hihinto ang upload bago mapuno ang 1 GB na libre
const READ_URL_SECONDS = 3600;
const MAX_SCHEDULE_DAYS = 365;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400, x: Record<string, unknown> = {}) => reply({ ok: false, error: e, ...x }, s);

const enc = new TextEncoder();
async function sha256Hex(s: string) {
  const b = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
async function sessionUser(token: string): Promise<any | null> {
  if (!token || token.length < 20) return null;
  const { data } = await db.from("sessions").select("expires_at, revoked_at, users(*)")
    .eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  return u && u.status === "Active" ? u : null;
}

const cleanId = (s: unknown) => String(s ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
const extFor = (mime: string) => mime === "image/webp" ? "webp" : mime === "video/mp4" ? "mp4" : mime === "video/webm" ? "webm" : "jpg";

function parsePublishAt(v: unknown) {
  if (!v) return new Date();
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return null;
  const max = Date.now() + MAX_SCHEDULE_DAYS * 86_400_000;
  return d.getTime() > max ? null : d;
}

// ---------- signed read URLs + author info ----------
// deno-lint-ignore no-explicit-any
async function hydrate(posts: any[], me: any) {
  if (!posts.length) return [];
  const ids = posts.map((p) => p.id);
  const { data: media } = await db.from("post_media").select("*").in("post_id", ids).order("position");
  const paths = (media ?? []).map((m) => m.path);
  // deno-lint-ignore no-explicit-any
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data } = await db.storage.from(BUCKET).createSignedUrls(paths, READ_URL_SECONDS);
    (data ?? []).forEach((s) => { if (s.signedUrl && s.path) signed[s.path] = s.signedUrl; });
  }
  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const { data: authors } = await db.from("users").select("id, username, display_name, avatar_url").in("id", userIds);
  const byId = Object.fromEntries((authors ?? []).map((a) => [a.id, a]));
  const now = Date.now();
  return posts.map((p) => ({
    id: p.id, client_id: p.client_id, caption: p.caption, visibility: p.visibility,
    publish_at: p.publish_at, created_at: p.created_at, mine: p.user_id === me.id,
    scheduled: new Date(p.publish_at).getTime() > now,
    author: byId[p.user_id] ?? null,
    media: (media ?? []).filter((m) => m.post_id === p.id).map((m) => ({
      kind: m.kind, url: signed[m.path] ?? null, w: m.w, h: m.h, duration: m.duration, mime: m.mime,
    })),
  }));
}

// ---------- actions ----------
// deno-lint-ignore no-explicit-any
async function createUpload(p: any, me: any) {
  const clientId = cleanId(p.client_id);
  if (!clientId) return fail("Kulang ang client_id.");
  const files = Array.isArray(p.files) ? p.files : [];
  if (!files.length || files.length > MAX_MEDIA_PER_POST) return fail(`1 hanggang ${MAX_MEDIA_PER_POST} photo/video bawat post.`);

  // Kung na-post na ito dati (retry), huwag nang ulitin
  const { data: existing } = await db.from("posts").select("id").eq("user_id", me.id).eq("client_id", clientId).maybeSingle();
  if (existing) return reply({ ok: true, already: true, post_id: existing.id });

  let total = 0;
  for (const f of files) {
    const kind = f.kind === "video" ? "video" : "photo";
    const size = Number(f.size) || 0;
    if (kind === "photo" && size > MAX_PHOTO_BYTES) return fail("Masyadong malaki ang photo.", 413);
    if (kind === "video" && size > MAX_VIDEO_BYTES) return fail("Masyadong malaki ang video (max ~12 MB).", 413);
    if (kind === "video" && Number(f.duration) > MAX_VIDEO_SECONDS) return fail("Hanggang 15 segundo lang ang video.", 413);
    total += size;
  }

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count: today } = await db.from("post_media").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", since);
  if ((today ?? 0) + files.length > MEDIA_PER_DAY) return fail(`Hanggang ${MEDIA_PER_DAY} photo/video bawat araw.`, 429);

  const { data: used } = await db.from("post_media").select("size");
  const usedBytes = (used ?? []).reduce((a, r) => a + (r.size || 0), 0);
  if (usedBytes + total > STORAGE_CAP_BYTES) return fail("Puno na ang storage ng server. Subukan ulit mamaya.", 507);

  const uploads = [];
  for (let i = 0; i < files.length; i++) {
    const mime = String(files[i].mime || "image/jpeg");
    const path = `${me.id}/${clientId}/${i}.${extFor(mime)}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) throw error ?? new Error("signed upload failed");
    uploads.push({ index: i, path, url: data.signedUrl, token: data.token });
  }
  return reply({ ok: true, uploads });
}

// deno-lint-ignore no-explicit-any
async function createPost(p: any, me: any) {
  const clientId = cleanId(p.client_id);
  if (!clientId) return fail("Kulang ang client_id.");
  const { data: existing } = await db.from("posts").select("*").eq("user_id", me.id).eq("client_id", clientId).maybeSingle();
  if (existing) return reply({ ok: true, already: true, post: (await hydrate([existing], me))[0] });

  const caption = String(p.caption ?? "").slice(0, 1000);
  const visibility = ["public", "followers", "private"].includes(p.visibility) ? p.visibility : "public";
  const publishAt = parsePublishAt(p.publish_at);
  if (!publishAt) return fail("Mali ang petsa/oras ng schedule.");
  const media = Array.isArray(p.media) ? p.media.slice(0, MAX_MEDIA_PER_POST) : [];
  if (!media.length) return fail("Walang photo/video.");

  // Siguraduhing sa user na ito ang mga path at nandoon talaga ang files
  const prefix = `${me.id}/${clientId}/`;
  const { data: listed } = await db.storage.from(BUCKET).list(`${me.id}/${clientId}`, { limit: 50 });
  const present = new Set((listed ?? []).map((o) => prefix + o.name));
  const sizes = Object.fromEntries((listed ?? []).map((o) => [prefix + o.name, (o.metadata && o.metadata.size) || 0]));
  for (const m of media) {
    if (typeof m.path !== "string" || !m.path.startsWith(prefix)) return fail("Maling file path.", 403);
    if (!present.has(m.path)) return fail("Hindi pa tapos ang upload ng isang file. Susubukan ulit.", 409, { retry: true });
  }

  const { data: post, error } = await db.from("posts").insert({
    user_id: me.id, client_id: clientId, caption, visibility,
    publish_at: publishAt.toISOString(), taken_at: p.taken_at ? new Date(p.taken_at).toISOString() : null,
    media_count: media.length,
  }).select("*").single();
  if (error) {
    if (error.code === "23505") { // sabay na retry
      const { data: again } = await db.from("posts").select("*").eq("user_id", me.id).eq("client_id", clientId).single();
      return reply({ ok: true, already: true, post: (await hydrate([again], me))[0] });
    }
    throw error;
  }
  const rows = media.map((m: Record<string, unknown>, i: number) => ({
    post_id: post.id, user_id: me.id, kind: m.kind === "video" ? "video" : "photo", path: m.path,
    mime: String(m.mime || "image/jpeg"), size: sizes[m.path as string] || Number(m.size) || 0,
    w: Number(m.w) || null, h: Number(m.h) || null, duration: Number(m.duration) || null, position: i,
  }));
  const { error: mErr } = await db.from("post_media").insert(rows);
  if (mErr) { await db.from("posts").delete().eq("id", post.id); throw mErr; }
  return reply({ ok: true, post: (await hydrate([post], me))[0] });
}

// deno-lint-ignore no-explicit-any
async function myPosts(p: any, me: any) {
  const limit = Math.min(60, Math.max(1, Number(p.limit) || 30));
  let q = db.from("posts").select("*").eq("user_id", me.id).is("deleted_at", null).order("publish_at", { ascending: false }).limit(limit);
  if (p.before) q = q.lt("publish_at", String(p.before));
  const { data } = await q;
  return reply({ ok: true, posts: await hydrate(data ?? [], me) });
}

// deno-lint-ignore no-explicit-any
async function feed(p: any, me: any) {
  const limit = Math.min(60, Math.max(1, Number(p.limit) || 30));
  const now = new Date().toISOString();
  const { data: f } = await db.from("follows").select("following_id").eq("follower_id", me.id);
  const following = (f ?? []).map((r) => r.following_id);
  // public ng lahat + followers-only ng mga fina-follow + sariling posts (lahat ng visibility)
  const ors = ["visibility.eq.public", `user_id.eq.${me.id}`];
  if (following.length) ors.push(`and(visibility.eq.followers,user_id.in.(${following.join(",")}))`);
  let q = db.from("posts").select("*").is("deleted_at", null).lte("publish_at", now)
    .or(ors.join(",")).order("publish_at", { ascending: false }).limit(limit);
  if (p.before) q = q.lt("publish_at", String(p.before));
  const { data } = await q;
  return reply({ ok: true, posts: await hydrate(data ?? [], me) });
}

// deno-lint-ignore no-explicit-any
async function updatePost(p: any, me: any) {
  const { data: post } = await db.from("posts").select("*").eq("id", String(p.id || "")).eq("user_id", me.id).is("deleted_at", null).maybeSingle();
  if (!post) return fail("Hindi makita ang post.", 404);
  const ch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (p.caption !== undefined) ch.caption = String(p.caption).slice(0, 1000);
  if (p.visibility !== undefined) {
    if (!["public", "followers", "private"].includes(p.visibility)) return fail("Maling visibility.");
    ch.visibility = p.visibility;
  }
  if (p.publish_at !== undefined) {
    const d = parsePublishAt(p.publish_at);
    if (!d) return fail("Mali ang petsa/oras ng schedule.");
    ch.publish_at = d.toISOString();
  }
  const { data: upd, error } = await db.from("posts").update(ch).eq("id", post.id).select("*").single();
  if (error) throw error;
  return reply({ ok: true, post: (await hydrate([upd], me))[0] });
}

// deno-lint-ignore no-explicit-any
async function deletePost(p: any, me: any) {
  const { data: post } = await db.from("posts").select("id").eq("id", String(p.id || "")).eq("user_id", me.id).maybeSingle();
  if (!post) return fail("Hindi makita ang post.", 404);
  const { data: media } = await db.from("post_media").select("path").eq("post_id", post.id);
  const paths = (media ?? []).map((m) => m.path);
  if (paths.length) await db.storage.from(BUCKET).remove(paths);
  await db.from("posts").delete().eq("id", post.id);
  return reply({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST lang.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Mag-login ulit.", 401);
    switch (p.action) {
      case "createUpload": return await createUpload(p, me);
      case "createPost":   return await createPost(p, me);
      case "myPosts":      return await myPosts(p, me);
      case "feed":         return await feed(p, me);
      case "updatePost":   return await updatePost(p, me);
      case "deletePost":   return await deletePost(p, me);
      default:             return fail("Unknown action.");
    }
  } catch (e) {
    console.error("posts-fast error", e);
    return fail("Server error. Subukan ulit.", 500);
  }
});
