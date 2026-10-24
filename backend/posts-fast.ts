// TigoMeNote · posts-fast (Supabase Edge Function, verify_jwt = off)
// Posts na may offline queue + schedule, at interactions (reactions, comments, bookmark, repost/share).
// Lahat ng action ay kailangan ng session token (x-session-token).
// Actions: createUpload, createPost, myPosts, userPosts, getPost, feed, updatePost, deletePost,
//          react, reactions, comments, addComment, deleteComment, bookmark, bookmarks, share, unrepost, shares,
//          view, pin, liked, reposts, history
// Moderation: caption at comment ay dumadaan sa moderation.ts (block o flag). Nakatago (hidden_at) = may-ari lang ang nakakakita.
// Notifications: reaction, comment, repost at milestone (ilang post na) ay dumadaan sa notify.ts.
// Explore activity (parang Komoot): posts.activity = { type, title, route [[lat,lng,ele]], stats, start_at }; puwedeng walang photo.
// Storage: private bucket "post-media" — signed upload URL (pang-upload) at signed read URL (1 oras).
// Secrets: AUTH_PEPPER (hindi ginagamit dito), SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (automatic).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkText, checkFor, blockMessage, logBlock, autoFlag } from "./moderation.ts";
import { notify, unnotify } from "./notify.ts";

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

const EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];
const MILESTONES = [1, 10, 25, 50, 100, 200, 300, 500, 1000];
const nowIso = () => new Date().toISOString();

// deno-lint-ignore no-explicit-any
async function followingIds(me: any): Promise<string[]> {
  const { data } = await db.from("follows").select("following_id").eq("follower_id", me.id);
  return (data ?? []).map((r) => r.following_id);
}
// Pwede bang makita ni "me" ang post na ito?
// deno-lint-ignore no-explicit-any
async function canSee(post: any, me: any) {
  if (!post || post.deleted_at) return false;
  if (post.user_id === me.id) return true;
  if (post.hidden_at) return false; // nire-review ng admin
  if (new Date(post.publish_at) > new Date()) return false;
  if (post.visibility === "private") return false;
  // Private account (hal. Teen): followers lang ang nakakakita, kahit "public" ang post
  const { data: author } = await db.from("users").select("private_account").eq("id", post.user_id).maybeSingle();
  if (post.visibility === "public" && !author?.private_account) return true;
  const { data } = await db.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", post.user_id).maybeSingle();
  return !!data;
}
// deno-lint-ignore no-explicit-any
async function visiblePost(id: unknown, me: any) {
  const { data } = await db.from("posts").select("*").eq("id", String(id || "")).maybeSingle();
  return (await canSee(data, me)) ? data : null;
}
// deno-lint-ignore no-explicit-any
async function usersById(ids: string[]): Promise<Record<string, any>> {
  if (!ids.length) return {};
  const { data } = await db.from("users").select("id, username, display_name, avatar_url").in("id", [...new Set(ids)]);
  return Object.fromEntries((data ?? []).map((a) => [a.id, a]));
}

// ---------- signed read URLs + author info + interactions ----------
// deno-lint-ignore no-explicit-any
async function hydrate(posts: any[], me: any) {
  if (!posts.length) return [];
  const ids = posts.map((p) => p.id);
  const [{ data: media }, { data: reacts }, { data: comments }, { data: shares }, { data: marks }, { data: fol }] = await Promise.all([
    db.from("post_media").select("*").in("post_id", ids).order("position"),
    db.from("post_reactions").select("post_id, user_id, emoji").in("post_id", ids),
    db.from("post_comments").select("post_id").in("post_id", ids).is("deleted_at", null).is("hidden_at", null),
    db.from("post_shares").select("post_id, user_id, kind").in("post_id", ids),
    db.from("post_bookmarks").select("post_id").in("post_id", ids).eq("user_id", me.id),
    db.from("follows").select("following_id").eq("follower_id", me.id),
  ]);
  const paths = (media ?? []).map((m) => m.path);
  const signed: Record<string, string> = {};
  if (paths.length) {
    const { data } = await db.storage.from(BUCKET).createSignedUrls(paths, READ_URL_SECONDS);
    (data ?? []).forEach((s) => { if (s.signedUrl && s.path) signed[s.path] = s.signedUrl; });
  }
  const byId = await usersById(posts.map((p) => p.user_id));
  const following = new Set((fol ?? []).map((r) => r.following_id));
  const marked = new Set((marks ?? []).map((r) => r.post_id));
  const now = Date.now();
  return posts.map((p) => {
    const rs = (reacts ?? []).filter((r) => r.post_id === p.id);
    const counts: Record<string, number> = {};
    rs.forEach((r) => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
    const sh = (shares ?? []).filter((r) => r.post_id === p.id);
    return {
      id: p.id, client_id: p.client_id, caption: p.caption, visibility: p.visibility,
      publish_at: p.publish_at, created_at: p.created_at, mine: p.user_id === me.id,
      scheduled: new Date(p.publish_at).getTime() > now,
      pinned: !!p.pinned_at, pinned_at: p.pinned_at ?? null, sound: p.sound ?? null, activity: p.activity ?? null,
      hidden: !!p.hidden_at, hidden_reason: p.hidden_at ? p.hidden_reason ?? null : null,
      author: byId[p.user_id] ? { ...byId[p.user_id], following: following.has(p.user_id) } : null,
      media: (media ?? []).filter((m) => m.post_id === p.id).map((m) => ({
        kind: m.kind, url: signed[m.path] ?? null, w: m.w, h: m.h, duration: m.duration, mime: m.mime,
      })),
      stats: {
        views: p.view_count ?? 0,
        reactions: rs.length,
        top: Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3),
        my_reaction: (rs.find((r) => r.user_id === me.id) || {}).emoji ?? null,
        comments: (comments ?? []).filter((c) => c.post_id === p.id).length,
        reposts: sh.filter((r) => r.kind === "repost").length,
        shares: sh.length,
        reposted: sh.some((r) => r.kind === "repost" && r.user_id === me.id),
        bookmarked: marked.has(p.id),
      },
    };
  });
}

// ---------- actions ----------
// deno-lint-ignore no-explicit-any
async function createUpload(p: any, me: any) {
  const clientId = cleanId(p.client_id);
  if (!clientId) return fail("Missing client_id.");
  const files = Array.isArray(p.files) ? p.files : [];
  if (!files.length || files.length > MAX_MEDIA_PER_POST) return fail(`1 to ${MAX_MEDIA_PER_POST} photos/videos per post.`);
  // Caption check bago pa mag-upload ng files
  const v = checkFor(me, p.caption);
  if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "caption"); return fail(blockMessage(v.category), 422, { blocked: true, category: v.category }); }

  // Kung na-post na ito dati (retry), huwag nang ulitin
  const { data: existing } = await db.from("posts").select("id").eq("user_id", me.id).eq("client_id", clientId).maybeSingle();
  if (existing) return reply({ ok: true, already: true, post_id: existing.id });

  let total = 0;
  for (const f of files) {
    const kind = f.kind === "video" ? "video" : "photo";
    const size = Number(f.size) || 0;
    if (kind === "photo" && size > MAX_PHOTO_BYTES) return fail("The photo is too large.", 413);
    if (kind === "video" && size > MAX_VIDEO_BYTES) return fail("The video is too large (max ~12 MB).", 413);
    if (kind === "video" && Number(f.duration) > MAX_VIDEO_SECONDS) return fail("Videos can be up to 15 seconds.", 413);
    total += size;
  }

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count: today } = await db.from("post_media").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", since);
  if ((today ?? 0) + files.length > MEDIA_PER_DAY) return fail(`Up to ${MEDIA_PER_DAY} photos/videos per day.`, 429);

  const { data: used } = await db.from("post_media").select("size");
  const usedBytes = (used ?? []).reduce((a, r) => a + (r.size || 0), 0);
  if (usedBytes + total > STORAGE_CAP_BYTES) return fail("Server storage is full. Please try again later.", 507);

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

// Sound (TigoMeNote Sounds, gawa sa device): id lang at lakas, walang file
// deno-lint-ignore no-explicit-any
function cleanSound(s: any) {
  if (!s || typeof s !== "object") return null;
  const id = String(s.id ?? "");
  if (!/^[a-z0-9-]{2,30}$/.test(id)) return null;
  const n = (v: any, d: number) => { const x = Number(v); return Number.isFinite(x) ? Math.min(1, Math.max(0, Math.round(x * 100) / 100)) : d; };
  const out: Record<string, unknown> = { id, vol: n(s.vol, 0.8) };
  if (s.orig != null) out.orig = n(s.orig, 0.4);
  return out;
}

// Explore activity: nililinis at kinukuwenta ulit ang layo (distance) dito sa server
const ACT_TYPES = ["hike", "walk", "run", "bike", "drive", "other"];
const MAX_ROUTE_POINTS = 1000;
function haversine(a: number[], b: number[]) {
  const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.min(1, Math.sqrt(s)));
}
// deno-lint-ignore no-explicit-any
function cleanActivity(a: any): Record<string, unknown> | null {
  if (!a || typeof a !== "object" || !Array.isArray(a.route)) return null;
  const pts: (number | null)[][] = [];
  for (const r of a.route.slice(0, MAX_ROUTE_POINTS)) {
    if (!Array.isArray(r)) continue;
    const lat = Number(r[0]), lng = Number(r[1]), e = r[2] == null ? NaN : Number(r[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    pts.push([Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5, Number.isFinite(e) ? Math.round(Math.max(-500, Math.min(9000, e))) : null]);
  }
  if (pts.length < 2) return null;
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1] as number[], pts[i] as number[]);
  const s = a.stats && typeof a.stats === "object" ? a.stats : {};
  const n = (v: unknown, max: number) => { const x = Number(v); return v != null && Number.isFinite(x) && x > 0 ? Math.min(max, Math.round(x)) : null; };
  const start = a.start_at ? new Date(String(a.start_at)) : null;
  return {
    type: ACT_TYPES.includes(a.type) ? a.type : "other",
    title: String(a.title ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 80),
    route: pts,
    stats: { dist_m: Math.round(Math.max(d, n(s.dist_m, 5_000_000) ?? 0)), dur_s: n(s.dur_s, 30 * 86400), up_m: n(s.up_m, 30000), down_m: n(s.down_m, 30000) },
    start_at: start && !isNaN(start.getTime()) ? start.toISOString() : null,
  };
}

// deno-lint-ignore no-explicit-any
async function createPost(p: any, me: any) {
  const clientId = cleanId(p.client_id);
  if (!clientId) return fail("Missing client_id.");
  const { data: existing } = await db.from("posts").select("*").eq("user_id", me.id).eq("client_id", clientId).maybeSingle();
  if (existing) return reply({ ok: true, already: true, post: (await hydrate([existing], me))[0] });

  const caption = String(p.caption ?? "").slice(0, 1000);
  const activity = p.activity ? cleanActivity(p.activity) : null;
  if (p.activity && !activity) return fail("The route is invalid. Please choose it again.");
  const v = checkFor(me, activity ? caption + "\n" + String(activity.title) : caption);
  if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "caption"); return fail(blockMessage(v.category), 422, { blocked: true, category: v.category }); }
  const visibility = ["public", "followers", "private"].includes(p.visibility) ? p.visibility : "public";
  const publishAt = parsePublishAt(p.publish_at);
  if (!publishAt) return fail("Invalid schedule date/time.");
  const media = Array.isArray(p.media) ? p.media.slice(0, MAX_MEDIA_PER_POST) : [];
  if (!media.length && !activity) return fail("No photo or video.");
  const sound = cleanSound(p.sound);

  // Siguraduhing sa user na ito ang mga path at nandoon talaga ang files
  const prefix = `${me.id}/${clientId}/`;
  const { data: listed } = media.length ? await db.storage.from(BUCKET).list(`${me.id}/${clientId}`, { limit: 50 }) : { data: [] };
  const present = new Set((listed ?? []).map((o) => prefix + o.name));
  const sizes = Object.fromEntries((listed ?? []).map((o) => [prefix + o.name, (o.metadata && o.metadata.size) || 0]));
  for (const m of media) {
    if (typeof m.path !== "string" || !m.path.startsWith(prefix)) return fail("Invalid file path.", 403);
    if (!present.has(m.path)) return fail("A file hasn't finished uploading. Retrying.", 409, { retry: true });
  }

  const { data: post, error } = await db.from("posts").insert({
    user_id: me.id, client_id: clientId, caption, visibility,
    publish_at: publishAt.toISOString(), taken_at: p.taken_at ? new Date(p.taken_at).toISOString() : null,
    media_count: media.length, sound, activity,
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
  const { error: mErr } = rows.length ? await db.from("post_media").insert(rows) : { error: null };
  if (mErr) { await db.from("posts").delete().eq("id", post.id); throw mErr; }
  if (!v.ok) await autoFlag(db, { type: "post", id: post.id, owner: me.id }, v);
  await milestone(me);
  return reply({ ok: true, post: (await hydrate([post], me))[0] });
}
// "You've shared 50 posts!" (isang beses lang bawat bilang)
// deno-lint-ignore no-explicit-any
async function milestone(me: any) {
  const { count } = await db.from("posts").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("deleted_at", null);
  const n = count ?? 0;
  if (!MILESTONES.includes(n)) return;
  const { count: had } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me.id).eq("type", "milestone").eq("data->>count", String(n));
  if (had) return;
  const body = n === 1 ? "You shared your first post! Welcome to TigoMeNote 🎉" : `You've shared ${n} posts! Take a moment to celebrate 🎉`;
  await notify(db, { to: me.id, type: "milestone", body, data: { count: n } });
}

// deno-lint-ignore no-explicit-any
async function myPosts(p: any, me: any) {
  const limit = Math.min(60, Math.max(1, Number(p.limit) || 30));
  let q = db.from("posts").select("*").eq("user_id", me.id).is("deleted_at", null).order("publish_at", { ascending: false }).limit(limit);
  if (p.before) q = q.lt("publish_at", String(p.before));
  const { data } = await q;
  return reply({ ok: true, posts: await hydrate(data ?? [], me) });
}

// Feed: mode "all" = public ng lahat + followers-only ng fina-follow + sarili;
//       mode "following" = posts at reposts ng mga fina-follow mo (at sarili mo)
// deno-lint-ignore no-explicit-any
async function feed(p: any, me: any) {
  const limit = Math.min(40, Math.max(1, Number(p.limit) || 20));
  const before = p.before ? String(p.before) : null;
  const following = await followingIds(me);
  const circle = [me.id, ...following];
  let q = db.from("posts").select("*").is("deleted_at", null).is("hidden_at", null).lte("publish_at", nowIso()).order("publish_at", { ascending: false }).limit(limit);
  if (p.mode === "following") {
    q = q.in("user_id", circle);
  } else {
    const ors = ["visibility.eq.public", `user_id.eq.${me.id}`];
    if (following.length) ors.push(`and(visibility.eq.followers,user_id.in.(${following.join(",")}))`);
    q = q.or(ors.join(","));
  }
  if (before) q = q.lt("publish_at", before);
  const { data: posts } = await q;
  // Reposts ng mga fina-follow mo (public posts lang ang pwedeng i-repost)
  let rq = db.from("post_shares").select("post_id, user_id, created_at").eq("kind", "repost").in("user_id", circle)
    .order("created_at", { ascending: false }).limit(limit);
  if (before) rq = rq.lt("created_at", before);
  const { data: reps } = await rq;
  const items: { post: any; at: string; by?: string }[] = (posts ?? []).map((x) => ({ post: x, at: x.publish_at }));
  const repIds = [...new Set((reps ?? []).map((r) => r.post_id))].filter((id) => !items.some((i) => i.post.id === id));
  if (repIds.length) {
    const { data: rp } = await db.from("posts").select("*").in("id", repIds).is("deleted_at", null).is("hidden_at", null).eq("visibility", "public").lte("publish_at", nowIso());
    for (const r of reps ?? []) {
      const post = (rp ?? []).find((x) => x.id === r.post_id);
      if (post && !items.some((i) => i.post.id === post.id)) items.push({ post, at: r.created_at, by: r.user_id });
    }
  }
  // Tanggalin ang posts ng private accounts na hindi mo fina-follow
  const authorIds = [...new Set(items.map((i) => i.post.user_id))].filter((id) => !circle.includes(id));
  if (authorIds.length) {
    const { data: priv } = await db.from("users").select("id").in("id", authorIds).eq("private_account", true);
    const hide = new Set((priv ?? []).map((u) => u.id));
    for (let i = items.length - 1; i >= 0; i--) if (hide.has(items[i].post.user_id)) items.splice(i, 1);
  }
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  const page = items.slice(0, limit);
  const hyd = await hydrate(page.map((i) => i.post), me);
  const by = await usersById(page.filter((i) => i.by).map((i) => i.by as string));
  const out = hyd.map((h, i) => ({ ...h, feed_at: page[i].at, repost_by: page[i].by ? by[page[i].by as string] ?? null : null }));
  return reply({ ok: true, posts: out, more: items.length >= limit });
}

// deno-lint-ignore no-explicit-any
async function userPosts(p: any, me: any) {
  const uid = String(p.user_id || "");
  const limit = Math.min(60, Math.max(1, Number(p.limit) || 30));
  const isMe = uid === me.id;
  let vis = ["public"];
  if (isMe) vis = ["public", "followers", "private"];
  else if ((await followingIds(me)).includes(uid)) vis = ["public", "followers"];
  else {
    const { data: owner } = await db.from("users").select("private_account").eq("id", uid).maybeSingle();
    if (owner?.private_account) return reply({ ok: true, posts: [], private: true });
  }
  let q = db.from("posts").select("*").eq("user_id", uid).is("deleted_at", null).in("visibility", vis)
    .order("publish_at", { ascending: false }).limit(limit);
  if (!isMe) q = q.lte("publish_at", nowIso()).is("hidden_at", null);
  if (p.before) q = q.lt("publish_at", String(p.before));
  const { data } = await q;
  const list = (data ?? []).slice().sort((a, b) => (a.pinned_at ? 1 : 0) === (b.pinned_at ? 1 : 0)
    ? (a.pinned_at && b.pinned_at ? (a.pinned_at < b.pinned_at ? 1 : -1) : 0) : (a.pinned_at ? -1 : 1));
  return reply({ ok: true, posts: await hydrate(list, me) });
}

// ---------- views, pin, at mga tab ng profile ----------
// Bilang ng view: tinatawag ng browser kapag nakita ang post (feed) o binuksan (viewer). Max 30 bawat tawag.
// deno-lint-ignore no-explicit-any
async function view(p: any, me: any) {
  const ids = (Array.isArray(p.ids) ? p.ids : []).map((x: unknown) => String(x)).filter((x: string) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 30);
  if (!ids.length) return reply({ ok: true, added: 0 });
  const { data, error } = await db.rpc("record_post_views", { p_user: me.id, p_posts: ids });
  if (error) throw error;
  return reply({ ok: true, added: data ?? 0 });
}
// I-pin sa profile (hanggang 3)
// deno-lint-ignore no-explicit-any
async function pin(p: any, me: any) {
  const { data: post } = await db.from("posts").select("*").eq("id", String(p.id || "")).eq("user_id", me.id).is("deleted_at", null).maybeSingle();
  if (!post) return fail("Post not found.", 404);
  if (p.on) {
    if (!post.pinned_at) {
      const { count } = await db.from("posts").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("deleted_at", null).not("pinned_at", "is", null);
      if ((count ?? 0) >= 3) return fail("You can pin up to 3 posts. Unpin one first.", 409);
    }
    await db.from("posts").update({ pinned_at: nowIso() }).eq("id", post.id);
  } else {
    await db.from("posts").update({ pinned_at: null }).eq("id", post.id);
  }
  const { data: upd } = await db.from("posts").select("*").eq("id", post.id).single();
  return reply({ ok: true, post: (await hydrate([upd], me))[0] });
}
// deno-lint-ignore no-explicit-any
async function visibleList(ids: string[], me: any) {
  if (!ids.length) return [];
  const { data } = await db.from("posts").select("*").in("id", ids);
  const out = [];
  for (const id of ids) { const x = (data ?? []).find((d) => d.id === id); if (x && await canSee(x, me)) out.push(x); }
  return out;
}
// Mga post na ni-react-an mo (❤️ tab)
// deno-lint-ignore no-explicit-any
async function liked(_p: any, me: any) {
  const { data } = await db.from("post_reactions").select("post_id, created_at").eq("user_id", me.id).order("created_at", { ascending: false }).limit(90);
  return reply({ ok: true, posts: await hydrate(await visibleList((data ?? []).map((r) => r.post_id), me), me) });
}
// Mga ni-repost mo (o ng ibang user kung may user_id)
// deno-lint-ignore no-explicit-any
async function reposts(p: any, me: any) {
  const uid = String(p.user_id || me.id);
  const { data } = await db.from("post_shares").select("post_id, created_at").eq("user_id", uid).eq("kind", "repost").order("created_at", { ascending: false }).limit(90);
  return reply({ ok: true, posts: await hydrate(await visibleList((data ?? []).map((r) => r.post_id), me), me) });
}
// Mga huling nakita mo (History)
// deno-lint-ignore no-explicit-any
async function history(_p: any, me: any) {
  const { data } = await db.from("post_views").select("post_id, viewed_at").eq("user_id", me.id).order("viewed_at", { ascending: false }).limit(90);
  return reply({ ok: true, posts: await hydrate(await visibleList((data ?? []).map((r) => r.post_id), me), me) });
}

// deno-lint-ignore no-explicit-any
async function getPost(p: any, me: any) {
  const post = await visiblePost(p.id, me);
  if (!post) return fail("Post not found (deleted or private).", 404);
  return reply({ ok: true, post: (await hydrate([post], me))[0] });
}

// ---------- interactions ----------
// deno-lint-ignore no-explicit-any
async function react(p: any, me: any) {
  const post = await visiblePost(p.post_id, me);
  if (!post) return fail("Post not found.", 404);
  if (p.emoji === null || p.emoji === "") {
    await db.from("post_reactions").delete().eq("post_id", post.id).eq("user_id", me.id);
    await unnotify(db, { to: post.user_id, actor: me.id, type: "like", post: post.id });
  } else {
    if (!EMOJIS.includes(p.emoji)) return fail("Invalid reaction.");
    await db.from("post_reactions").upsert({ post_id: post.id, user_id: me.id, emoji: p.emoji, created_at: nowIso() });
    await notify(db, { to: post.user_id, actor: me.id, type: "like", post: post.id, emoji: p.emoji, once: true });
  }
  return reply({ ok: true, post: (await hydrate([post], me))[0] });
}

// Sino ang nag-react / nag-repost / nag-share
// deno-lint-ignore no-explicit-any
async function reactions(p: any, me: any) {
  const post = await visiblePost(p.post_id, me);
  if (!post) return fail("Post not found.", 404);
  const { data } = await db.from("post_reactions").select("user_id, emoji, created_at").eq("post_id", post.id).order("created_at", { ascending: false }).limit(200);
  const u = await usersById((data ?? []).map((r) => r.user_id));
  return reply({ ok: true, list: (data ?? []).map((r) => ({ user: u[r.user_id] ?? null, emoji: r.emoji, at: r.created_at })) });
}
// deno-lint-ignore no-explicit-any
async function shares(p: any, me: any) {
  const post = await visiblePost(p.post_id, me);
  if (!post) return fail("Post not found.", 404);
  const { data } = await db.from("post_shares").select("user_id, kind, created_at").eq("post_id", post.id).order("created_at", { ascending: false }).limit(200);
  const u = await usersById((data ?? []).map((r) => r.user_id));
  return reply({ ok: true, list: (data ?? []).map((r) => ({ user: u[r.user_id] ?? null, kind: r.kind, at: r.created_at })) });
}

// deno-lint-ignore no-explicit-any
async function comments(p: any, me: any) {
  const post = await visiblePost(p.post_id, me);
  if (!post) return fail("Post not found.", 404);
  let q = db.from("post_comments").select("id, user_id, body, created_at").eq("post_id", post.id).is("deleted_at", null).is("hidden_at", null)
    .order("created_at", { ascending: true }).limit(200);
  if (p.after) q = q.gt("created_at", String(p.after));
  const { data } = await q;
  const u = await usersById((data ?? []).map((r) => r.user_id));
  return reply({ ok: true, list: (data ?? []).map((c) => ({
    id: c.id, body: c.body, at: c.created_at, user: u[c.user_id] ?? null,
    can_delete: c.user_id === me.id || post.user_id === me.id,
  })) });
}
// deno-lint-ignore no-explicit-any
async function addComment(p: any, me: any) {
  const post = await visiblePost(p.post_id, me);
  if (!post) return fail("Post not found.", 404);
  const body = String(p.body ?? "").trim().replace(/\n{3,}/g, "\n\n");
  if (!body || body.length > 500) return fail("Comment: 1–500 characters.");
  const v = checkFor(me, body);
  if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "comment"); return fail(blockMessage(v.category), 422, { blocked: true, category: v.category }); }
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db.from("post_comments").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", since);
  if ((count ?? 0) >= 10) return fail("Slow down a bit 🙂 Try again later.", 429);
  const { data, error } = await db.from("post_comments").insert({ post_id: post.id, user_id: me.id, body }).select("*").single();
  if (error) throw error;
  if (!v.ok) await autoFlag(db, { type: "comment", id: data.id, owner: me.id }, v);
  await notify(db, { to: post.user_id, actor: me.id, type: "comment", post: post.id, comment: data.id, body: body.slice(0, 140) });
  const u = await usersById([me.id]);
  return reply({ ok: true, comment: { id: data.id, body: data.body, at: data.created_at, user: u[me.id], can_delete: true } });
}
// deno-lint-ignore no-explicit-any
async function deleteComment(p: any, me: any) {
  const { data: c } = await db.from("post_comments").select("id, user_id, post_id").eq("id", String(p.id || "")).maybeSingle();
  if (!c) return fail("Comment not found.", 404);
  const { data: post } = await db.from("posts").select("user_id").eq("id", c.post_id).maybeSingle();
  if (c.user_id !== me.id && post?.user_id !== me.id) return fail("You can't delete this.", 403);
  await db.from("post_comments").update({ deleted_at: nowIso() }).eq("id", c.id);
  return reply({ ok: true });
}

// deno-lint-ignore no-explicit-any
async function bookmark(p: any, me: any) {
  const post = await visiblePost(p.post_id, me);
  if (!post) return fail("Post not found.", 404);
  if (p.on) await db.from("post_bookmarks").upsert({ post_id: post.id, user_id: me.id });
  else await db.from("post_bookmarks").delete().eq("post_id", post.id).eq("user_id", me.id);
  return reply({ ok: true, post: (await hydrate([post], me))[0] });
}
// deno-lint-ignore no-explicit-any
async function bookmarks(_p: any, me: any) {
  const { data: m } = await db.from("post_bookmarks").select("post_id, created_at").eq("user_id", me.id).order("created_at", { ascending: false }).limit(100);
  const ids = (m ?? []).map((r) => r.post_id);
  if (!ids.length) return reply({ ok: true, posts: [] });
  const { data } = await db.from("posts").select("*").in("id", ids);
  const ok = [];
  for (const id of ids) { const x = (data ?? []).find((d) => d.id === id); if (x && await canSee(x, me)) ok.push(x); }
  return reply({ ok: true, posts: await hydrate(ok, me) });
}

// kind "repost" (public posts lang) o "link" (record lang na shinare ang link)
// deno-lint-ignore no-explicit-any
async function share(p: any, me: any) {
  const post = await visiblePost(p.post_id, me);
  if (!post) return fail("Post not found.", 404);
  const kind = p.kind === "repost" ? "repost" : "link";
  if (kind === "repost") {
    if (post.visibility !== "public") return fail("Only public posts can be reposted.", 403);
    if (post.user_id === me.id) return fail("This is your own post.");
    const { data: author } = await db.from("users").select("private_account").eq("id", post.user_id).maybeSingle();
    if (author?.private_account) return fail("Posts from private accounts can't be reposted.", 403);
    const { error } = await db.from("post_shares").insert({ post_id: post.id, user_id: me.id, kind });
    if (error && error.code !== "23505") throw error;
    await notify(db, { to: post.user_id, actor: me.id, type: "repost", post: post.id, once: true });
  } else {
    await db.from("post_shares").insert({ post_id: post.id, user_id: me.id, kind });
  }
  return reply({ ok: true, post: (await hydrate([post], me))[0] });
}
// deno-lint-ignore no-explicit-any
async function unrepost(p: any, me: any) {
  await db.from("post_shares").delete().eq("post_id", String(p.post_id || "")).eq("user_id", me.id).eq("kind", "repost");
  const post = await visiblePost(p.post_id, me);
  if (post) await unnotify(db, { to: post.user_id, actor: me.id, type: "repost", post: post.id });
  return reply({ ok: true, post: post ? (await hydrate([post], me))[0] : null });
}

// deno-lint-ignore no-explicit-any
async function updatePost(p: any, me: any) {
  const { data: post } = await db.from("posts").select("*").eq("id", String(p.id || "")).eq("user_id", me.id).is("deleted_at", null).maybeSingle();
  if (!post) return fail("Post not found.", 404);
  const ch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let v: ReturnType<typeof checkText> = { ok: true };
  if (p.caption !== undefined) {
    ch.caption = String(p.caption).slice(0, 1000);
    v = checkFor(me, ch.caption as string);
    if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "caption"); return fail(blockMessage(v.category), 422, { blocked: true, category: v.category }); }
  }
  if (p.visibility !== undefined) {
    if (!["public", "followers", "private"].includes(p.visibility)) return fail("Invalid visibility.");
    ch.visibility = p.visibility;
  }
  if (p.publish_at !== undefined) {
    const d = parsePublishAt(p.publish_at);
    if (!d) return fail("Invalid schedule date/time.");
    ch.publish_at = d.toISOString();
  }
  const { data: upd, error } = await db.from("posts").update(ch).eq("id", post.id).select("*").single();
  if (error) throw error;
  if (!v.ok) await autoFlag(db, { type: "post", id: post.id, owner: me.id }, v);
  return reply({ ok: true, post: (await hydrate([upd], me))[0] });
}

// deno-lint-ignore no-explicit-any
async function deletePost(p: any, me: any) {
  const { data: post } = await db.from("posts").select("id").eq("id", String(p.id || "")).eq("user_id", me.id).maybeSingle();
  if (!post) return fail("Post not found.", 404);
  const { data: media } = await db.from("post_media").select("path").eq("post_id", post.id);
  const paths = (media ?? []).map((m) => m.path);
  if (paths.length) await db.storage.from(BUCKET).remove(paths);
  await db.from("posts").delete().eq("id", post.id);
  return reply({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "createUpload": return await createUpload(p, me);
      case "createPost":   return await createPost(p, me);
      case "myPosts":      return await myPosts(p, me);
      case "feed":         return await feed(p, me);
      case "userPosts":    return await userPosts(p, me);
      case "getPost":      return await getPost(p, me);
      case "react":        return await react(p, me);
      case "reactions":    return await reactions(p, me);
      case "comments":     return await comments(p, me);
      case "addComment":   return await addComment(p, me);
      case "deleteComment":return await deleteComment(p, me);
      case "bookmark":     return await bookmark(p, me);
      case "bookmarks":    return await bookmarks(p, me);
      case "share":        return await share(p, me);
      case "unrepost":     return await unrepost(p, me);
      case "shares":       return await shares(p, me);
      case "view":         return await view(p, me);
      case "pin":          return await pin(p, me);
      case "liked":        return await liked(p, me);
      case "reposts":      return await reposts(p, me);
      case "history":      return await history(p, me);
      case "updatePost":   return await updatePost(p, me);
      case "deletePost":   return await deletePost(p, me);
      default:             return fail("Unknown action.");
    }
  } catch (e) {
    console.error("posts-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
