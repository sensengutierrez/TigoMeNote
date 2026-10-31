package __PKG__;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.os.SystemClock;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.RemoteViews;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONObject;

/** TigoMeNote Chat: Messages widget — malaking orasan (TextClock), gumagalaw na si Tigo (ViewFlipper na parang flipbook),
 *  at maliit na speech bubble ng pinakabagong HINDI pa nababasang message ("Claire · haha sige"). Walang bago → "No new messages".
 *  Kinukuha mismo ng widget ang inbox (messages-fast "inbox") gamit ang session token na ibinigay ng app (TMNWidget.setAuth).
 *  Nag-a-update: bawat 15 minuto (AlarmManager), kapag umalis/bumalik sa Chat app, at kapag pinindot ang ↻.
 *  Pindot sa bubble = bukas ang chat na iyon; pindot sa orasan/Tigo = Chats. */
public class MessagesWidget extends AppWidgetProvider {
    public static final String ACTION_REFRESH = "tmn.msgs.refresh";
    static final String PREF = "tmn_widget";
    static final int ROWS = 5;   // ilang chat ang tinatandaan (para mahanap ang may bago)

    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) { schedule(c, true); render(c); fetch(c, goAsync()); }
    @Override public void onEnabled(Context c) { schedule(c, true); render(c); }
    @Override public void onDisabled(Context c) { schedule(c, false); }
    // bawat 15 minuto (hindi ginigising ang phone; sabay sa ibang alarm para tipid sa baterya)
    static void schedule(Context c, boolean on) {
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            PendingIntent pi = PendingIntent.getBroadcast(c, 102, new Intent(c, MessagesWidget.class).setAction(ACTION_REFRESH), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            am.cancel(pi);
            if (on) am.setInexactRepeating(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime() + AlarmManager.INTERVAL_FIFTEEN_MINUTES, AlarmManager.INTERVAL_FIFTEEN_MINUTES, pi);
        } catch (Exception e) { }
    }
    @Override public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        if (ACTION_REFRESH.equals(i.getAction())) { render(c); fetch(c, goAsync()); }
    }

    static void fetch(final Context c, final PendingResult pr) {
        final SharedPreferences sp = c.getSharedPreferences(PREF, 0);
        final String tok = sp.getString("token", ""), url = sp.getString("url", "");
        if (tok.isEmpty() || url.isEmpty()) { if (pr != null) pr.finish(); return; }
        new Thread(() -> {
            try {
                HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
                h.setConnectTimeout(10000); h.setReadTimeout(15000); h.setRequestMethod("POST"); h.setDoOutput(true);
                h.setRequestProperty("Content-Type", "text/plain;charset=UTF-8");
                OutputStream os = h.getOutputStream();
                os.write(new JSONObject().put("action", "inbox").put("token", tok).toString().getBytes("UTF-8")); os.close();
                int code = h.getResponseCode();
                InputStream in = code < 400 ? h.getInputStream() : h.getErrorStream();
                ByteArrayOutputStream bo = new ByteArrayOutputStream(); byte[] b = new byte[8192]; int n;
                while (in != null && (n = in.read(b)) > 0) bo.write(b, 0, n);
                if (in != null) in.close();
                if (code == 401) { sp.edit().putString("chats", "[]").putBoolean("out", true).apply(); }
                else {
                    JSONObject o = new JSONObject(bo.toString("UTF-8"));
                    JSONArray list = o.optJSONArray("list");
                    if (o.optBoolean("ok") && list != null) {
                        JSONArray out = new JSONArray(); int total = 0;
                        for (int k = 0; k < list.length(); k++) {
                            JSONObject x = list.getJSONObject(k);
                            if (!"active".equals(x.optString("status", "active"))) continue;
                            int un = x.optInt("unread", 0); if (un > 0) total++;
                            if (out.length() >= ROWS) continue;
                            String name = x.optString("title", "");
                            if (name.isEmpty() || "null".equals(name)) {
                                JSONArray mem = x.optJSONArray("members"); StringBuilder sb = new StringBuilder();
                                for (int j = 0; mem != null && j < mem.length() && j < 3; j++) {
                                    JSONObject u = mem.getJSONObject(j); String dn = u.optString("display_name", "");
                                    if (dn.isEmpty() || "null".equals(dn)) dn = "@" + u.optString("username", "");
                                    if (sb.length() > 0) sb.append(", "); sb.append(dn);
                                }
                                name = sb.length() > 0 ? sb.toString() : "Chat";
                            }
                            JSONObject last = x.optJSONObject("last");
                            String text = last != null ? last.optString("text", "") : "";
                            String at = last != null && !last.optString("at", "").isEmpty() ? last.optString("at", "") : x.optString("at", "");
                            out.put(new JSONObject().put("id", x.optString("id")).put("name", name).put("text", text).put("at", at).put("unread", un).put("muted", x.optBoolean("muted")));
                        }
                        sp.edit().putString("chats", out.toString()).putInt("total", total).putBoolean("out", false).putLong("synced", System.currentTimeMillis()).apply();
                    }
                }
            } catch (Exception e) { }
            new Handler(Looper.getMainLooper()).post(() -> { render(c); if (pr != null) pr.finish(); });
        }).start();
    }

    static int res(Context c, String name, String type) { return c.getResources().getIdentifier(name, type, c.getPackageName()); }
    static PendingIntent open(Context c, String path, int code) {
        Intent i = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (i == null) i = new Intent();
        i.putExtra("tmn_url", path).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
    static String when(String iso) {
        try {
            SimpleDateFormat p = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US); p.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date d = p.parse(iso.substring(0, 19));
            long age = System.currentTimeMillis() - d.getTime();
            if (age < 60000) return "now";
            SimpleDateFormat day = new SimpleDateFormat("yyyyMMdd", Locale.US);
            if (day.format(d).equals(day.format(new Date()))) return new SimpleDateFormat("h:mm a", Locale.US).format(d);
            if (age < 6L * 86400000) return new SimpleDateFormat("EEE", Locale.US).format(d);
            return new SimpleDateFormat("MMM d", Locale.US).format(d);
        } catch (Exception e) { return ""; }
    }

    static void render(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new ComponentName(c, MessagesWidget.class));
            if (ids == null || ids.length == 0) return;
            SharedPreferences sp = c.getSharedPreferences(PREF, 0);
            JSONArray chats = new JSONArray(sp.getString("chats", "[]"));
            boolean out = sp.getBoolean("out", false) || sp.getString("token", "").isEmpty();
            int total = sp.getInt("total", 0);
            JSONObject hot = null;   // pinakabagong chat na may hindi pa nababasa (hindi naka-mute)
            for (int k = 0; k < chats.length() && hot == null; k++) { JSONObject x = chats.getJSONObject(k); if (x.optInt("unread", 0) > 0 && !x.optBoolean("muted")) hot = x; }
            RemoteViews v = new RemoteViews(c.getPackageName(), res(c, "tmn_widget_msgs", "layout"));
            v.setOnClickPendingIntent(res(c, "tmn_m_head", "id"), open(c, "app/messages.html", 100));
            v.setOnClickPendingIntent(res(c, "tmn_m_tigo", "id"), open(c, "app/messages.html", 103));
            Intent r = new Intent(c, MessagesWidget.class).setAction(ACTION_REFRESH);
            v.setOnClickPendingIntent(res(c, "tmn_m_refresh", "id"), PendingIntent.getBroadcast(c, 101, r, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
            v.setTextViewText(res(c, "tmn_m_total", "id"), total > 99 ? "99+ new" : total + " new");
            v.setViewVisibility(res(c, "tmn_m_total", "id"), !out && total > 0 ? View.VISIBLE : View.GONE);
            // si Tigo: masaya at kumakaway kapag may bagong message
            v.setViewVisibility(res(c, "tmn_m_happy", "id"), hot != null ? View.VISIBLE : View.GONE);
            v.setViewVisibility(res(c, "tmn_m_calm", "id"), hot != null ? View.GONE : View.VISIBLE);
            int from = res(c, "tmn_m_from", "id"), msg = res(c, "tmn_m_msg", "id"), bub = res(c, "tmn_m_bubble", "id");
            if (hot != null) {
                String when = when(hot.optString("at")), txt = hot.optString("text");
                v.setTextViewText(from, hot.optString("name") + (when.isEmpty() ? "" : " · " + when));
                v.setViewVisibility(from, View.VISIBLE);
                v.setTextViewText(msg, txt.isEmpty() ? "New message" : txt);
                v.setTextColor(msg, 0xFF1B1B1F);
                v.setInt(bub, "setBackgroundResource", res(c, "tmn_w_bubble", "drawable"));
                v.setOnClickPendingIntent(bub, open(c, "app/messages.html?c=" + hot.optString("id"), 110));
            } else {
                v.setViewVisibility(from, View.GONE);
                v.setTextViewText(msg, out ? "Sign in to TigoMeNote Chat to see new messages." : "No new messages ✨");
                v.setTextColor(msg, 0xCCFFFFFF);
                v.setInt(bub, "setBackgroundResource", res(c, "tmn_w_bubble_quiet", "drawable"));
                v.setOnClickPendingIntent(bub, open(c, "app/messages.html", 111));
            }
            m.updateAppWidget(ids, v);
        } catch (Exception e) { }
    }
}
