// TigoMeNote · sounds-fast (Supabase Edge Function, verify_jwt = off) — Sound Maker: mga sariling gawang tunog ng user
// Isang trabaho lang: i-save, ilista at burahin ang mga "recipe" ng tunog (beat, chords, melody). Walang audio file (sa device tinutugtog).
// Actions (session token): mine, save { id?, recipe }, remove { id }
// Pangalan ng tunog ay dumadaan sa moderation.ts. Hanggang 30 tunog bawat user.
// Kapag ginamit sa post/status: kinukuha ng posts-fast / social-fast ang recipe dito (sound-recipe.ts → resolveSound).
// Files: index.ts + moderation.ts + sound-recipe.ts

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { checkFor, blockMessage, logBlock } from "./moderation.ts";
import { cleanRecipe, USER_SOUND_ID } from "./sound-recipe.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const MAX_SOUNDS = 30;

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
  const { data } = await db.from("sessions").select("expires_at, revoked_at, users(*)").eq("token_hash", await sha256Hex(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  // deno-lint-ignore no-explicit-any
  const u = (data as any).users;
  return u && u.status === "Active" ? u : null;
}
function newId() {
  const a = crypto.getRandomValues(new Uint8Array(8)), c = "abcdefghijklmnopqrstuvwxyz0123456789";
  return "u-" + [...a].map((x) => c[x % 36]).join("");
}

// deno-lint-ignore no-explicit-any
async function mine(_p: any, me: any) {
  const { data } = await db.from("user_sounds").select("id, recipe, updated_at").eq("user_id", me.id).order("updated_at", { ascending: false }).limit(MAX_SOUNDS);
  return reply({ ok: true, list: (data ?? []).map((r) => ({ id: r.id, recipe: r.recipe, at: r.updated_at })) });
}
// deno-lint-ignore no-explicit-any
async function save(p: any, me: any) {
  const r = cleanRecipe(p.recipe);
  if (!r) return fail("Give your sound a name.");
  const v = checkFor(me, r.name as string);
  if (!v.ok && v.level === "block") { await logBlock(db, me.id, v, "sound name"); return fail(blockMessage(v.category), 422, { blocked: true, category: v.category }); }
  r.by = me.username;
  if (p.id) {
    const id = String(p.id);
    if (!USER_SOUND_ID.test(id)) return fail("Sound not found.", 404);
    const { data, error } = await db.from("user_sounds").update({ name: r.name, recipe: { ...r, id }, updated_at: nowIso() }).eq("id", id).eq("user_id", me.id).select("id, recipe, updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return fail("Sound not found.", 404);
    return reply({ ok: true, sound: { id: data.id, recipe: data.recipe, at: data.updated_at } });
  }
  const { count } = await db.from("user_sounds").select("id", { count: "exact", head: true }).eq("user_id", me.id);
  if ((count ?? 0) >= MAX_SOUNDS) return fail(`You can keep up to ${MAX_SOUNDS} sounds. Delete one first.`, 409);
  for (let i = 0; i < 3; i++) {
    const id = newId();
    const { data, error } = await db.from("user_sounds").insert({ id, user_id: me.id, name: r.name, recipe: { ...r, id } }).select("id, recipe, updated_at").single();
    if (!error) return reply({ ok: true, sound: { id: data.id, recipe: data.recipe, at: data.updated_at } });
    if (error.code !== "23505") throw error;
  }
  return fail("Please try again.", 500);
}
// deno-lint-ignore no-explicit-any
async function remove(p: any, me: any) {
  await db.from("user_sounds").delete().eq("id", String(p.id || "")).eq("user_id", me.id);
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
      case "mine":   return await mine(p, me);
      case "save":   return await save(p, me);
      case "remove": return await remove(p, me);
      default:       return fail("Unknown action.");
    }
  } catch (e) {
    console.error("sounds-fast error", e);
    return fail("Server error. Please try again.", 500);
  }
});
