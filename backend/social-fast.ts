// TigoMeNote · social-fast (Supabase Edge Function, verify_jwt = off)
// Follow, people (search / suggestions / profile ng ibang user), at Status/Stories (24 oras).
// Actions: follow, unfollow, people, profile, followList, requests, approveRequest, declineRequest,
//          stories, storyUpload, createStory, viewStory, storyViewers, deleteStory
// Story files: private bucket "post-media", path <user_id>/stories/<file>, signed read URL 1 oras.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkText, checkFor, blockMessage, logBlock, autoFlag } from "./moderation.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const BUCKET = "post-media";
const STORY_HOURS = 24;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 15.5;
const STORIES_PER_DAY = 30;
const READ_URL_SECONDS = 3600;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-session-token, authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
const reply = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (e: string, s = 400, x: Record<string, unknown> = {}) => reply({ ok: false, error: e, ...x }, s);
const nowIso = () => new Date().toISOString();

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
const PUB = "id, username, display_name, avatar_url, banner_url, bio, created_at, private_account";
// deno-lint-ignore no-explicit-any
async function followingIds(me: any): Promise<string[]> {
  const { data } = await db.from("follows").select("following_id").eq("follower_id", me.id);
  return (data ?? []).map((r) => r.following_id);
}
const rand = () => [...crypto.getRandomValues(new Uint8Array(6))].map((x) => x.toString(16).padStart(2, "0")).join("");

// ---------- follow ----------
// Private account (default sa Teen): magiging "follow request" muna, kailangang i-approve.
// deno-lint-ignore no-explicit-any
async function follow(p: any, me: any) {
  const id = String(p.user_id || "");
  if (!id || id === me.id) return fail("You can't follow yourself.");
  const { data: u } = await db.from("users").select("id, private_account").eq("id", id).eq("status", "Active").maybeSingle();
  if (!u) return fail("User not found.", 404);
  const { data: already } = await db.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", id).maybeSingle();
  if (already) return reply({ ok: true, following: true });
  if (u.private_account) {
    await db.from("follow_requests").upsert({ follower_id: me.id, following_id: id }, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
    return reply({ ok: true, following: false, requested: true });
  }
  const { error } = await db.from("follows").insert({ follower_id: me.id, following_id: id });
  if (error && error.code !== "23505") throw error;
  return reply({ ok: true, following: true });
}
// deno-lint-ignore no-explicit-any
async function unfollow(p: any, me: any) {
  const id = String(p.user_id || "");
  await db.from("follows").delete().eq("follower_id", me.id).eq("following_id", id);
  await db.from("follow_requests").delete().eq("follower_id", me.id).eq("following_id", id);
  return reply({ ok: true, following: false, requested: false });
}
// Para kanino ang requests: sarili, o ang teen na binabantayan (p.for)
// deno-lint-ignore no-explicit-any
async function requestOwner(p: any, me: any): Promise<string | null> {
  if (!p.for || p.for === me.id) return me.id;
  const { data } = await db.from("guardian_links").select("teen_id").eq("guardian_id", me.id).eq("teen_id", String(p.for)).eq("status", "accepted").maybeSingle();
  return data ? data.teen_id : null;
}
// deno-lint-ignore no-explicit-any
async function requests(p: any, me: any) {
  const owner = await requestOwner(p, me);
  if (!owner) return fail("You don't supervise this account.", 403);
  const { data } = await db.from("follow_requests").select("follower_id, created_at").eq("following_id", owner).order("created_at", { ascending: false }).limit(200);
  const ids = (data ?? []).map((r) => r.follower_id);
  const { data: us } = ids.length ? await db.from("users").select(PUB).in("id", ids) : { data: [] };
  return reply({ ok: true, list: ids.map((id) => (us ?? []).find((u) => u.id === id)).filter(Boolean) });
}
// deno-lint-ignore no-explicit-any
async function approveRequest(p: any, me: any) {
  const owner = await requestOwner(p, me);
  if (!owner) return fail("You don't supervise this account.", 403);
  const fid = String(p.user_id || "");
  const { data: r } = await db.from("follow_requests").select("follower_id").eq("follower_id", fid).eq("following_id", owner).maybeSingle();
  if (!r) return fail("Request not found.", 404);
  const { error } = await db.from("follows").insert({ follower_id: fid, following_id: owner });
  if (error && error.code !== "23505") throw error;
  await db.from("follow_requests").delete().eq("follower_id", fid).eq("following_id", owner);
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function declineRequest(p: any, me: any) {
  const owner = await requestOwner(p, me);
  if (!owner) return fail("You don't supervise this account.", 403);
  await db.from("follow_requests").delete().eq("follower_id", String(p.user_id || "")).eq("following_id", owner);
  return reply({ ok: true });
}
async function requestedIds(me: string): Promise<Set<string>> {
  const { data } = await db.from("follow_requests").select("following_id").eq("follower_id", me);
  return new Set((data ?? []).map((r) => r.following_id));
}

// People: search (q) o suggestions (mga hindi mo pa fina-follow)
// deno-lint-ignore no-explicit-any
async function people(p: any, me: any) {
  const [fol, req] = [new Set(await followingIds(me)), await requestedIds(me.id)];
  const term = String(p.q ?? "").trim().replace(/[%,()]/g, "").slice(0, 40);
  let q = db.from("users").select(PUB).eq("status", "Active").neq("id", me.id).order("created_at", { ascending: false }).limit(30);
  if (term) q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
  const { data } = await q;
  let list = (data ?? []).map((u) => ({ ...u, following: fol.has(u.id), requested: req.has(u.id) }));
  if (!term) list = list.filter((u) => !u.following).slice(0, 10);
  return reply({ ok: true, list });
}

// Profile ng ibang user (o sarili) gamit ang username o id
// deno-lint-ignore no-explicit-any
async function profile(p: any, me: any) {
  let q = db.from("users").select(PUB).eq("status", "Active");
  q = p.user_id ? q.eq("id", String(p.user_id)) : q.ilike("username", String(p.username || "").replace(/[%_]/g, ""));
  const { data: u } = await q.maybeSingle();
  if (!u) return fail("User not found.", 404);
  const [posts, followers, following, fme, fback, likes, reqd, incoming] = await Promise.all([
    db.from("posts").select("id", { count: "exact", head: true }).eq("user_id", u.id).is("deleted_at", null).lte("publish_at", nowIso())
      .in("visibility", u.id === me.id ? ["public", "followers", "private"] : ["public", "followers"]),
    db.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", u.id),
    db.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", u.id),
    db.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", u.id).maybeSingle(),
    db.from("follows").select("follower_id").eq("follower_id", u.id).eq("following_id", me.id).maybeSingle(),
    db.from("post_reactions").select("post_id, posts!inner(user_id)", { count: "exact", head: true }).eq("posts.user_id", u.id),
    db.from("follow_requests").select("follower_id").eq("follower_id", me.id).eq("following_id", u.id).maybeSingle(),
    db.from("follow_requests").select("follower_id", { count: "exact", head: true }).eq("following_id", u.id),
  ]);
  return reply({ ok: true, user: { ...u, me: u.id === me.id, following: !!fme.data, follows_you: !!fback.data, requested: !!reqd.data },
    counts: { posts: posts.count ?? 0, followers: followers.count ?? 0, following: following.count ?? 0, likes: likes.count ?? 0, requests: u.id === me.id ? incoming.count ?? 0 : 0 } });
}

// Listahan ng followers / following ng isang user
// deno-lint-ignore no-explicit-any
async function followList(p: any, me: any) {
  const uid = String(p.user_id || me.id);
  const which = p.which === "following" ? "following" : "followers";
  const { data } = which === "followers"
    ? await db.from("follows").select("follower_id, created_at").eq("following_id", uid).order("created_at", { ascending: false }).limit(200)
    : await db.from("follows").select("following_id, created_at").eq("follower_id", uid).order("created_at", { ascending: false }).limit(200);
  // deno-lint-ignore no-explicit-any
  const ids = (data ?? []).map((r: any) => r.follower_id ?? r.following_id);
  if (!ids.length) return reply({ ok: true, list: [] });
  const { data: us } = await db.from("users").select(PUB).in("id", ids);
  const fol = new Set(await followingIds(me));
  const list = ids.map((id) => (us ?? []).find((u) => u.id === id)).filter(Boolean).map((u) => ({ ...u, following: fol.has(u!.id) }));
  return reply({ ok: true, list });
}

// ---------- stories ----------
// Stories ng sarili + mga fina-follow, naka-grupo bawat user. Inuuna ang may hindi pa napapanood.
// deno-lint-ignore no-explicit-any
async function stories(_p: any, me: any) {
  const circle = [me.id, ...(await followingIds(me))];
  const { data: st } = await db.from("stories").select("*").in("user_id", circle).gt("expires_at", nowIso()).order("created_at", { ascending: true });
  const list = (st ?? []).filter((s) => !s.hidden_at || s.user_id === me.id); // nakatago = nire-review
  if (!list.length) return reply({ ok: true, groups: [] });
  const ids = list.map((s) => s.id);
  const [{ data: seen }, { data: us }, signedRes, { data: allViews }] = await Promise.all([
    db.from("story_views").select("story_id").eq("viewer_id", me.id).in("story_id", ids),
    db.from("users").select("id, username, display_name, avatar_url").in("id", [...new Set(list.map((s) => s.user_id))]),
    db.storage.from(BUCKET).createSignedUrls(list.map((s) => s.path), READ_URL_SECONDS),
    db.from("story_views").select("story_id").in("story_id", list.filter((s) => s.user_id === me.id).map((s) => s.id)),
  ]);
  const seenSet = new Set((seen ?? []).map((r) => r.story_id));
  const url: Record<string, string> = {};
  (signedRes.data ?? []).forEach((s) => { if (s.path && s.signedUrl) url[s.path] = s.signedUrl; });
  const groups: Record<string, any> = {};
  for (const s of list) {
    const g = groups[s.user_id] ??= { user: (us ?? []).find((u) => u.id === s.user_id), me: s.user_id === me.id, items: [], unseen: 0 };
    const seenIt = s.user_id === me.id || seenSet.has(s.id);
    if (!seenIt) g.unseen++;
    g.items.push({
      id: s.id, kind: s.kind, url: url[s.path] ?? null, mime: s.mime, w: s.w, h: s.h, duration: s.duration,
      caption: s.caption, at: s.created_at, expires_at: s.expires_at, seen: seenIt,
      views: s.user_id === me.id ? (allViews ?? []).filter((v) => v.story_id === s.id).length : undefined,
    });
  }
  const out = Object.values(groups).sort((a, b) => (a.me ? -1 : b.me ? 1 : (b.unseen > 0 ? 1 : 0) - (a.unseen > 0 ? 1 : 0) ||
    (a.items[a.items.length - 1].at < b.items[b.items.length - 1].at ? 1 : -1)));
  return reply({ ok: true, groups: out });
}

// deno-lint-ignore no-explicit-any
async function storyUpload(p: any, me: any) {
  const kind = p.kind === "video" ? "video" : "photo";
  const size = Number(p.size) || 0;
  if (kind === "photo" && size > MAX_PHOTO_BYTES) return fail("The photo is too large.", 413);
  if (kind === "video" && (size > MAX_VIDEO_BYTES || Number(p.duration) > MAX_VIDEO_SECONDS)) return fail("Video: up to 15 seconds and 12 MB.", 413);
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await db.from("stories").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", since);
  if ((count ?? 0) >= STORIES_PER_DAY) return fail(`Up to ${STORIES_PER_DAY} statuses per day.`, 429);
  const mime = String(p.mime || "image/jpeg");
  const ext = mime === "video/mp4" ? "mp4" : mime === "video/webm" ? "webm" : "jpg";
  const path = `${me.id}/stories/${Date.now().toString(36)}${rand()}.${ext}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error("signed upload failed");
  return reply({ ok: true, path, url: data.signedUrl });
}
// deno-lint-ignore no-explicit-any
async function createStory(p: any, me: any) {
  const path = String(p.path || "");
  if (!path.startsWith(`${me.id}/stories/`) || path.includes("..")) return fail("Invalid file.", 403);
  const name = path.split("/").pop()!;
  const { data: listed } = await db.storage.from(BUCKET).list(`${me.id}/stories`, { search: name, limit: 5 });
  if (!(listed ?? []).some((o) => o.name === name)) return fail("The upload hasn't finished.", 409, { retry: true });
  const kind = p.kind === "video" ? "video" : "photo";
  const v = checkFor(me, p.caption);
  if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "status caption"); return fail(blockMessage(v.category), 422, { blocked: true, category: v.category }); }
  const { data, error } = await db.from("stories").insert({
    user_id: me.id, kind, path, mime: String(p.mime || "image/jpeg"), w: Number(p.w) || null, h: Number(p.h) || null,
    duration: Number(p.duration) || null, caption: String(p.caption ?? "").slice(0, 200),
    expires_at: new Date(Date.now() + STORY_HOURS * 3600_000).toISOString(),
  }).select("id").single();
  if (error) throw error;
  if (!v.ok) await autoFlag(db, { type: "story", id: data.id, owner: me.id }, v);
  // Linisin ang mga expired na sarili (files + rows)
  const { data: old } = await db.from("stories").select("id, path").eq("user_id", me.id).lt("expires_at", nowIso());
  if (old && old.length) {
    await db.storage.from(BUCKET).remove(old.map((o) => o.path));
    await db.from("stories").delete().in("id", old.map((o) => o.id));
  }
  return reply({ ok: true, id: data.id });
}
// deno-lint-ignore no-explicit-any
async function viewStory(p: any, me: any) {
  const { data: s } = await db.from("stories").select("id, user_id").eq("id", String(p.id || "")).maybeSingle();
  if (!s || s.user_id === me.id) return reply({ ok: true });
  await db.from("story_views").upsert({ story_id: s.id, viewer_id: me.id });
  return reply({ ok: true });
}
// deno-lint-ignore no-explicit-any
async function storyViewers(p: any, me: any) {
  const { data: s } = await db.from("stories").select("id, user_id").eq("id", String(p.id || "")).maybeSingle();
  if (!s || s.user_id !== me.id) return fail("Only you can see who viewed your status.", 403);
  const { data } = await db.from("story_views").select("viewer_id, created_at").eq("story_id", s.id).order("created_at", { ascending: false });
  const ids = (data ?? []).map((r) => r.viewer_id);
  const { data: us } = ids.length ? await db.from("users").select("id, username, display_name, avatar_url").in("id", ids) : { data: [] };
  return reply({ ok: true, list: (data ?? []).map((r) => ({ user: (us ?? []).find((u) => u.id === r.viewer_id) ?? null, at: r.created_at })) });
}
// deno-lint-ignore no-explicit-any
async function deleteStory(p: any, me: any) {
  const { data: s } = await db.from("stories").select("id, user_id, path").eq("id", String(p.id || "")).maybeSingle();
  if (!s || s.user_id !== me.id) return fail("Not found.", 404);
  await db.storage.from(BUCKET).remove([s.path]);
  await db.from("stories").delete().eq("id", s.id);
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
      case "follow":       return await follow(p, me);
      case "unfollow":     return await unfollow(p, me);
      case "people":       return await people(p, me);
      case "profile":      return await profile(p, me);
      case "followList":   return await followList(p, me);
      case "requests":     return await requests(p, me);
      case "approveRequest": return await approveRequest(p, me);
      case "declineRequest": return await declineRequest(p, me);
      case "stories":      return await stories(p, me);
      case "storyUpload":  return await storyUpload(p, me);
      case "createStory":  return await createStory(p, me);
      case "viewStory":    return await viewStory(p, me);
      case "storyViewers": return await storyViewers(p, me);
      case "deleteStory":  return await deleteStory(p, me);
      default:             return fail("Unknown action.");
    }
  } catch (e) {
    console.error("social-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
