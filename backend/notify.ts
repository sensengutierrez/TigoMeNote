// TigoMeNote · notify.ts — gumawa ng notification (activity) para sa isang user
// Isang trabaho lang: i-save ang notification, tapos sabihan ang notify-fast na i-push ito sa phone.
// Ginagamit ng posts-fast, social-fast at moderation-fast (kasama ang file na ito sa deploy).
// Settings ng user (notif_prefs): off = hindi na ise-save; app = listahan lang; push = listahan + phone.
// Ang pag-push mismo (pause, sleep mode, web push) ay nasa notify-fast.

export type NotifType = "like" | "comment" | "repost" | "follow" | "follow_request" | "follow_accept" | "milestone" | "recap" | "moderation";
export type Notif = {
  to: string | null | undefined;
  actor?: string | null;
  type: NotifType;
  post?: string | null;
  comment?: string | null;
  emoji?: string | null;
  body?: string | null;
  data?: Record<string, unknown> | null;
  // true = isang notification lang bawat (actor, type, post); papalitan ang luma at hindi na ipu-push ulit
  once?: boolean;
};

// Aling setting ang sumasakop sa bawat uri (moderation = laging naka-on)
export const CATEGORY: Record<NotifType, string | null> = {
  like: "likes", comment: "comments", repost: "reposts",
  follow: "follows", follow_request: "follows", follow_accept: "follows",
  milestone: "updates", recap: "updates", moderation: null,
};

// deno-lint-ignore no-explicit-any
type DB = any;

export async function notify(db: DB, n: Notif): Promise<string | null> {
  try {
    if (!n.to || (n.actor && n.to === n.actor)) return null;
    const cat = CATEGORY[n.type];
    if (cat) {
      const { data: pref } = await db.from("notif_prefs").select(cat).eq("user_id", n.to).maybeSingle();
      if (pref && pref[cat] === "off") return null;
    }
    if (n.once) {
      let q = db.from("notifications").select("id").eq("user_id", n.to).eq("type", n.type);
      q = n.actor ? q.eq("actor_id", n.actor) : q.is("actor_id", null);
      q = n.post ? q.eq("post_id", n.post) : q.is("post_id", null);
      const { data: old } = await q.limit(1).maybeSingle();
      if (old) {
        await db.from("notifications").update({ emoji: n.emoji ?? null, created_at: new Date().toISOString(), read_at: null }).eq("id", old.id);
        return old.id; // walang bagong push (iwas spam kapag paulit-ulit na pinindot)
      }
    }
    const { data, error } = await db.from("notifications").insert({
      user_id: n.to, actor_id: n.actor ?? null, type: n.type, post_id: n.post ?? null, comment_id: n.comment ?? null,
      emoji: n.emoji ?? null, body: n.body ? String(n.body).slice(0, 300) : null, data: n.data ?? null,
    }).select("id").single();
    if (error) throw error;
    later(push(data.id));
    return data.id;
  } catch (e) {
    console.error("notify failed", String(e)); // hindi dapat masira ang like/comment dahil dito
    return null;
  }
}

// Tanggalin (hal. inalis ang reaction o ang repost, o kinansela ang follow request)
export async function unnotify(db: DB, n: { to: string | null | undefined; actor: string; type: NotifType; post?: string | null }) {
  if (!n.to) return;
  let q = db.from("notifications").delete().eq("user_id", n.to).eq("actor_id", n.actor).eq("type", n.type);
  q = n.post ? q.eq("post_id", n.post) : q.is("post_id", null);
  await q;
}

// Sabihan ang notify-fast na i-push (service key lang ang tinatanggap doon)
function push(id: string) {
  return fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/notify-fast", {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-key": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" },
    body: JSON.stringify({ action: "push", id }),
  }).then((r) => r.body?.cancel()).catch((e) => console.error("notify push failed", String(e)));
}
// Patakbuhin pagkatapos sumagot ang function (hindi pinapabagal ang like/comment)
function later(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === "function") rt.waitUntil(p);
}
