// TigoMeNote · webpush.ts — pagpapadala ng Web Push (RFC 8291 aes128gcm + VAPID RFC 8292)
// Isang trabaho lang: i-encrypt at ipadala ang notification sa browser ng user.
// Walang external library; WebCrypto lang (gumagana sa Deno / Supabase Edge at sa Node 20+).
// Ang VAPID key ay ginagawa ng caller (safety-fast) at naka-save sa table na app_keys.

const te = new TextEncoder();

export function b64u(buf: ArrayBuffer | Uint8Array): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function unb64u(s: string): Uint8Array {
  const t = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource }, key, len * 8));
}

export type Vapid = { publicKey: string; privateJwk: JsonWebKey; subject: string };

// Gumawa ng bagong VAPID key pair (isang beses lang, tapos naka-save)
export async function makeVapid(subject: string): Promise<Vapid> {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const raw = await crypto.subtle.exportKey("raw", kp.publicKey);
  const jwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return { publicKey: b64u(raw), privateJwk: jwk, subject };
}

const jwtCache = new Map<string, { t: string; exp: number }>();
async function vapidAuth(endpoint: string, v: Vapid): Promise<string> {
  const aud = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const hit = jwtCache.get(aud);
  if (hit && hit.exp - now > 600) return `vapid t=${hit.t}, k=${v.publicKey}`;
  const exp = now + 12 * 3600;
  const head = b64u(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(te.encode(JSON.stringify({ aud, exp, sub: v.subject })));
  const key = await crypto.subtle.importKey("jwk", { ...v.privateJwk, key_ops: ["sign"] }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, te.encode(head + "." + body) as BufferSource);
  const t = head + "." + body + "." + b64u(sig);
  jwtCache.set(aud, { t, exp });
  return `vapid t=${t}, k=${v.publicKey}`;
}

// I-encrypt ang payload para sa isang subscription (aes128gcm, isang record)
export async function encrypt(payload: Uint8Array, p256dh: string, auth: string): Promise<Uint8Array> {
  const uaPublic = unb64u(p256dh);
  const authSecret = unb64u(auth);
  const local = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(authSecret, ecdh, concat(te.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, aes, concat(payload, new Uint8Array([2])) as BufferSource));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, ct);
}

export type Sub = { endpoint: string; p256dh: string; auth: string };
// Ibinabalik ang HTTP status (201 = ok; 404/410 = patay na ang subscription, burahin)
export async function sendPush(sub: Sub, data: unknown, v: Vapid, opts: { ttl?: number; urgency?: string } = {}): Promise<number> {
  const body = await encrypt(te.encode(JSON.stringify(data)), sub.p256dh, sub.auth);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(opts.ttl ?? 3600),
      Urgency: opts.urgency ?? "high",
      Authorization: await vapidAuth(sub.endpoint, v),
    },
    body: body as BodyInit,
  });
  await res.body?.cancel();
  return res.status;
}
