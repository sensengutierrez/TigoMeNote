// TigoMeNote · profile-fast (Supabase Edge Function, verify_jwt = off)
// Sariling profile: pangalan, bio, profile photo (avatar) at cover (banner).
// Actions: get, update, imageUpload, setImage, removeImage. Kailangan ng session token (x-session-token).
// Storage: PUBLIC bucket "profile-media" (pang-view ng lahat), pero ang upload ay signed URL galing dito lang.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkText, checkFor, blockMessage, logBlock, autoFlag } from "./moderation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const db = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const BUCKET = "profile-media";
const KINDS = ["avatar", "banner"] as const;
const COL: Record<string, { url: string; path: string }> = {
  avatar: { url: "avatar_url", path: "avatar_path" },
  banner: { url: "banner_url", path: "banner_path" },
};
const MAX_BYTES = 3 * 1024 * 1024;
const UPLOADS_PER_HOUR = 20;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400) => reply({ ok: false, error: e }, s);

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

// deno-lint-ignore no-explicit-any
function publicUser(u: any) {
  return {
    id: u.id, username: u.username, display_name: u.display_name, role: u.role, status: u.status,
    bio: u.bio, avatar_url: u.avatar_url, banner_url: u.banner_url ?? null,
    email: u.email, email_verified: !!u.email_verified_at, created_at: u.created_at,
  };
}
const publicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
const rand = () => [...crypto.getRandomValues(new Uint8Array(6))].map((x) => x.toString(16).padStart(2, "0")).join("");

// deno-lint-ignore no-explicit-any
async function get(_p: any, me: any) {
  const now = new Date().toISOString();
  const [posts, followers, following, likes] = await Promise.all([
    db.from("posts").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("deleted_at", null).lte("publish_at", now),
    db.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", me.id),
    db.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", me.id),
    db.from("post_reactions").select("post_id, posts!inner(user_id)", { count: "exact", head: true }).eq("posts.user_id", me.id),
  ]);
  return reply({ ok: true, user: publicUser(me), counts: { posts: posts.count ?? 0, followers: followers.count ?? 0, following: following.count ?? 0, likes: likes.count ?? 0 } });
}

// deno-lint-ignore no-explicit-any
async function update(p: any, me: any) {
  const ch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (p.display_name !== undefined) {
    const d = String(p.display_name).trim().replace(/\s+/g, " ");
    if (d.length < 1 || d.length > 40) return fail("Name: 1–40 characters.");
    ch.display_name = d;
  }
  if (p.bio !== undefined) {
    const b = String(p.bio).trim().replace(/\n{3,}/g, "\n\n");
    if (b.length > 300) return fail("Bio: up to 300 characters.");
    ch.bio = b;
  }
  const v = checkFor(me, ch.display_name as string, ch.bio as string);
  if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "profile"); return fail(blockMessage(v.category), 422); }
  const { data, error } = await db.from("users").update(ch).eq("id", me.id).select("*").single();
  if (error) throw error;
  if (!v.ok) await autoFlag(db, { type: "user", id: me.id, owner: me.id }, v);
  return reply({ ok: true, user: publicUser(data) });
}

// deno-lint-ignore no-explicit-any
async function imageUpload(p: any, me: any) {
  const kind = String(p.kind);
  if (!KINDS.includes(kind as typeof KINDS[number])) return fail("Invalid image type.");
  if (Number(p.size) > MAX_BYTES) return fail("The image is too large (max 3 MB).", 413);
  // rate limit gamit ang write_action_dedup (isang row bawat upload)
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("write_action_dedup").select("id", { count: "exact", head: true })
    .eq("dedup_key", `profile-img:${me.id}`).gte("created_at", since);
  if ((count ?? 0) >= UPLOADS_PER_HOUR) return fail("Too many changes. Please try again later.", 429);
  const path = `${me.id}/${kind}-${Date.now().toString(36)}${rand()}.jpg`;
  await db.from("write_action_dedup").insert({ dedup_key: `profile-img:${me.id}`, action: "profileImage", user_id: me.id });
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error("signed upload failed");
  return reply({ ok: true, path, url: data.signedUrl });
}

// deno-lint-ignore no-explicit-any
async function setImage(p: any, me: any) {
  const kind = String(p.kind);
  if (!KINDS.includes(kind as typeof KINDS[number])) return fail("Invalid image type.");
  const path = String(p.path ?? "");
  if (!path.startsWith(`${me.id}/${kind}-`) || path.includes("..")) return fail("Invalid file.", 403);
  const name = path.slice(me.id.length + 1);
  const { data: listed } = await db.storage.from(BUCKET).list(me.id, { search: name, limit: 5 });
  if (!(listed ?? []).some((o) => o.name === name)) return fail("The upload hasn't finished. Please try again.", 409);
  const old = me[COL[kind].path];
  const { data, error } = await db.from("users").update({
    [COL[kind].url]: publicUrl(path), [COL[kind].path]: path, updated_at: new Date().toISOString(),
  }).eq("id", me.id).select("*").single();
  if (error) throw error;
  if (old && old !== path) await db.storage.from(BUCKET).remove([old]);
  return reply({ ok: true, user: publicUser(data) });
}

// deno-lint-ignore no-explicit-any
async function removeImage(p: any, me: any) {
  const kind = String(p.kind);
  if (!KINDS.includes(kind as typeof KINDS[number])) return fail("Invalid image type.");
  const old = me[COL[kind].path];
  const { data, error } = await db.from("users").update({
    [COL[kind].url]: null, [COL[kind].path]: null, updated_at: new Date().toISOString(),
  }).eq("id", me.id).select("*").single();
  if (error) throw error;
  if (old) await db.storage.from(BUCKET).remove([old]);
  return reply({ ok: true, user: publicUser(data) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("POST only.", 405);
  try {
    const p = await req.json().catch(() => ({}));
    const me = await sessionUser(String(p.token ?? req.headers.get("x-session-token") ?? ""));
    if (!me) return fail("Session expired. Please sign in again.", 401);
    switch (p.action) {
      case "get":         return await get(p, me);
      case "update":      return await update(p, me);
      case "imageUpload": return await imageUpload(p, me);
      case "setImage":    return await setImage(p, me);
      case "removeImage": return await removeImage(p, me);
      default:            return fail("Unknown action.");
    }
  } catch (e) {
    console.error("profile-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
