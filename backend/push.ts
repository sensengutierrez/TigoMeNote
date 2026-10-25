// TigoMeNote · push.ts — iisang daan ng push: Web Push (browser, webpush.ts) at FCM (Android app, Firebase HTTP v1)
// Gamit:  import { deliver } from "./push.ts";
//   await deliver(db, subs, { type, id, title, body, url }, vapid, { cat: "messages", ttl: 3600, urgency: "high" })
// Saan pupunta (para walang doble):
//   messages → TigoMeNote Chat app; kung wala → TigoMeNote app; kung wala pareho → web
//   social / daily → TigoMeNote app; kung wala → web
//   tigo → Tigo app; kung wala → TigoMeNote app; kung wala → web
//   safety (SOS, invites) → LAHAT ng device (app at web)
// Secret: FCM_SERVICE_ACCOUNT (service account JSON ng Firebase; Supabase → Edge Functions → Secrets). Wala → web lang.
import { sendPush, type Vapid } from "./webpush.ts";

export type Cat = "messages" | "social" | "safety" | "daily" | "tigo";
// deno-lint-ignore no-explicit-any
type Sub = { id: string; user_id: string; kind: string; endpoint: string; p256dh?: string; auth?: string; app?: string | null; fail_count?: number; [k: string]: any };

const ROUTE: Record<Cat, string[] | null> = {
  messages: ["messenger", "tigomenote"],
  social: ["tigomenote"],
  daily: ["tigomenote"],
  tigo: ["tigo", "tigomenote"],
  safety: null,
};
// Android notification channels (ginagawa ng app-mode.js)
const CHANNEL: Record<Cat, string> = { messages: "messages", social: "social", safety: "safety", daily: "reminders", tigo: "tigo" };

// ---------- FCM: access token mula sa service account (JWT RS256) ----------
// deno-lint-ignore no-explicit-any
let SA: any = undefined;
let TOKEN = { value: "", exp: 0 };
function account() {
  if (SA !== undefined) return SA;
  try { SA = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") || "null"); } catch { SA = null; }
  if (SA && (!SA.client_email || !SA.private_key || !SA.project_id)) SA = null;
  return SA;
}
export const fcmReady = () => !!account();
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)));
async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (TOKEN.value && TOKEN.exp - 120 > now) return TOKEN.value;
  const sa = account();
  const pem = String(sa.private_key).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const unsigned = enc({ alg: "RS256", typ: "JWT" }) + "." + enc({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  });
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + unsigned + "." + b64url(sig),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error("fcm token " + r.status);
  TOKEN = { value: j.access_token, exp: now + Number(j.expires_in || 3600) };
  return TOKEN.value;
}
// Ipadala sa isang FCM token. Ibinabalik: "ok" | "gone" (burahin ang sub) | "fail"
export async function sendFcm(token: string, data: Record<string, unknown>, cat: Cat, ttl = 3600): Promise<"ok" | "gone" | "fail"> {
  const sa = account(); if (!sa) return "fail";
  const str: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) if (v != null) str[k] = typeof v === "string" ? v : JSON.stringify(v);
  str.cat = cat;
  const urgent = cat === "safety" || cat === "messages" || data.type === "alarm";
  const body = {
    message: {
      token,
      notification: { title: String(data.title || "TigoMeNote"), body: String(data.body || "") },
      data: str,
      android: {
        priority: urgent ? "HIGH" : "NORMAL",
        ttl: Math.max(0, Math.round(ttl)) + "s",
        notification: {
          channel_id: CHANNEL[cat], icon: "ic_stat_tigo", color: cat === "messages" ? "#2f8dff" : "#ff6b4a",
          tag: String(data.type || "tmn") + "-" + String(data.id || ""), default_sound: true,
          notification_priority: cat === "safety" ? "PRIORITY_MAX" : urgent ? "PRIORITY_HIGH" : "PRIORITY_DEFAULT",
        },
      },
    },
  };
  try {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST", headers: { Authorization: "Bearer " + await accessToken(), "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (r.ok) return "ok";
    const t = await r.text();
    if (r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT.*registration/i.test(t)) return "gone";
    console.error("fcm send", r.status, t.slice(0, 300));
    return "fail";
  } catch (e) { console.error("fcm send", String(e)); return "fail"; }
}

// ---------- iisang daan ----------
// Pinipili kung aling mga device ng bawat user ang padadalhan (tingnan ang ROUTE sa itaas), saka ipinapadala.
// deno-lint-ignore no-explicit-any
export async function deliver(db: any, subs: Sub[], data: Record<string, unknown>, vapid: Vapid | null, opts: { cat: Cat; ttl?: number; urgency?: string }) {
  const ttl = opts.ttl ?? 3600, route = ROUTE[opts.cat];
  const byUser = new Map<string, Sub[]>();
  for (const s of subs || []) { if (!byUser.has(s.user_id)) byUser.set(s.user_id, []); byUser.get(s.user_id)!.push(s); }
  const pick: Sub[] = [];
  for (const list of byUser.values()) {
    const fcm = fcmReady() ? list.filter((s) => s.kind === "fcm") : [];
    const web = list.filter((s) => s.kind === "webpush");
    if (!route) { pick.push(...fcm, ...web); continue; }               // safety: lahat
    let chosen: Sub[] = [];
    for (const app of route) { chosen = fcm.filter((s) => (s.app || "tigomenote") === app); if (chosen.length) break; }
    pick.push(...(chosen.length ? chosen : web));                       // may app → app lang; wala → web
  }
  let sent = 0;
  await Promise.allSettled(pick.map(async (s) => {
    try {
      if (s.kind === "fcm") {
        const r = await Promise.race([sendFcm(s.endpoint, data, opts.cat, ttl), new Promise<"fail">((res) => setTimeout(() => res("fail"), 8000))]);
        if (r === "gone") await db.from("push_subs").delete().eq("id", s.id);
        else if (r === "ok") { sent++; await db.from("push_subs").update({ last_ok_at: new Date().toISOString(), fail_count: 0 }).eq("id", s.id); }
        else await db.from("push_subs").update({ fail_count: (s.fail_count || 0) + 1 }).eq("id", s.id);
        return;
      }
      if (!vapid) return;
      const st = await Promise.race([
        sendPush({ endpoint: s.endpoint, p256dh: s.p256dh!, auth: s.auth! }, data, vapid, { ttl, urgency: opts.urgency ?? "normal" }),
        new Promise<number>((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
      ]);
      if (st === 404 || st === 410) await db.from("push_subs").delete().eq("id", s.id);
      else if (st >= 400) await db.from("push_subs").update({ fail_count: (s.fail_count || 0) + 1 }).eq("id", s.id);
      else { sent++; await db.from("push_subs").update({ last_ok_at: new Date().toISOString(), fail_count: 0 }).eq("id", s.id); }
    } catch (e) { console.error("push failed", String(e)); }
  }));
  return sent;
}
