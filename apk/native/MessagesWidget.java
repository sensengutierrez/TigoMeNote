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

/** TigoMeNote Chat: Messages widget — orasan (TextClock), panahon (temperatura, humidity, hangin) at si Tigo na 3D na
 *  sumasabay sa panahon (araw: naka-shades · gabi: tulog · ulap · lamig/hangin: bonnet at scarf, nanginginig ·
 *  ulan: kapote at payong · kidlat: takot), at maliit na speech bubble ng pinakabagong HINDI pa nababasang message.
 *  Kulay ng widget ay ayon sa panahon. Tatlong laki: buo (4×2+), katamtaman (4×1) at maliit (2×2) — puwedeng i-resize.
 *  Panahon: Open-Meteo (walang key); lokasyon mula sa internet (IP), walang GPS permission. Update bawat 30 min.
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
    @Override public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, android.os.Bundle o) { render(c); }
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
        new Thread(() -> {
            weather(sp);
            if (!tok.isEmpty() && !url.isEmpty()) try {
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

    // ---------- panahon ----------
    static String get(String u) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(u).openConnection();
        h.setConnectTimeout(8000); h.setReadTimeout(10000);
        InputStream in = h.getInputStream();
        ByteArrayOutputStream bo = new ByteArrayOutputStream(); byte[] b = new byte[4096]; int n;
        while ((n = in.read(b)) > 0) bo.write(b, 0, n);
        in.close(); return bo.toString("UTF-8");
    }
    /** Kumukuha ng panahon kapag lampas 30 min na (lokasyon mula sa IP, naka-save nang 6 na oras). */
    static void weather(SharedPreferences sp) {
        long now = System.currentTimeMillis();
        if (now - sp.getLong("wx_at", 0) < 30 * 60000L) return;
        try {
            double lat = Double.longBitsToDouble(sp.getLong("loc_lat", 0)), lon = Double.longBitsToDouble(sp.getLong("loc_lon", 0));
            String city = sp.getString("loc_city", "");
            if (now - sp.getLong("loc_at", 0) > 6 * 3600000L || (lat == 0 && lon == 0)) {
                try {
                    JSONObject g = new JSONObject(get("https://get.geojs.io/v1/ip/geo.json"));
                    lat = Double.parseDouble(g.getString("latitude")); lon = Double.parseDouble(g.getString("longitude")); city = g.optString("city", "");
                } catch (Exception e) {
                    JSONObject g = new JSONObject(get("https://ipapi.co/json/"));
                    lat = g.getDouble("latitude"); lon = g.getDouble("longitude"); city = g.optString("city", "");
                }
                sp.edit().putLong("loc_lat", Double.doubleToLongBits(lat)).putLong("loc_lon", Double.doubleToLongBits(lon)).putString("loc_city", city).putLong("loc_at", now).apply();
            }
            JSONObject cur = new JSONObject(get(String.format(Locale.US,
                "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto", lat, lon))).getJSONObject("current");
            sp.edit().putInt("wx_code", cur.optInt("weather_code")).putFloat("wx_temp", (float) cur.optDouble("temperature_2m"))
                .putInt("wx_hum", cur.optInt("relative_humidity_2m")).putFloat("wx_wind", (float) cur.optDouble("wind_speed_10m"))
                .putBoolean("wx_day", cur.optInt("is_day", 1) == 1).putLong("wx_at", now).apply();
        } catch (Exception e) { }
    }
    /** Mood ni Tigo ayon sa panahon: sun · night · cloud · cold · rain · storm */
    static String mood(int code, float temp, float wind, boolean day) {
        if (code >= 95) return "storm";
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
        if ((code >= 71 && code <= 77) || code == 85 || code == 86 || wind >= 30 || temp <= 15) return "cold";
        if (!day) return "night";
        return code <= 1 ? "sun" : "cloud";
    }
    static String label(int code, boolean day) {
        if (code == 0) return day ? "Sunny" : "Clear night";
        if (code == 1) return day ? "Mostly sunny" : "Mostly clear";
        if (code == 2) return "Partly cloudy";
        if (code == 3) return "Cloudy";
        if (code == 45 || code == 48) return "Foggy";
        if (code >= 51 && code <= 57) return "Drizzle";
        if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rainy";
        if ((code >= 71 && code <= 77) || code == 85 || code == 86) return "Snow";
        if (code >= 95) return "Thunderstorm";
        return "";
    }
    static final String[] MOODS = { "sun", "night", "cloud", "cold", "rain", "storm" };
    static int frames(String mood) { return "night".equals(mood) ? 2 : 3; }

    /** Laki ng widget: "l" buo · "m" isang hilera (mababa) · "s" maliit (makitid) */
    static String size(AppWidgetManager m, int id) {
        try {
            android.os.Bundle o = m.getAppWidgetOptions(id);
            int w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 300), h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 180);
            if (w < 230) return "s";
            return h < 150 ? "m" : "l";
        } catch (Exception e) { return "l"; }
    }

    /** Settings → Appearance → Home screen widgets: lakas ng background 0–100% (0 = see-through) → 0–255 */
    static int bgAlpha(Context c) {
        int p = c.getSharedPreferences("tmn_widget", 0).getInt("bg", 100);
        return Math.round(Math.max(0, Math.min(100, p)) * 2.55f);
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
            boolean hasWx = sp.getLong("wx_at", 0) > 0;
            int code = sp.getInt("wx_code", 1); float temp = sp.getFloat("wx_temp", 30), wind = sp.getFloat("wx_wind", 0);
            boolean day = hasWx ? sp.getBoolean("wx_day", true) : true;
            int hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY);
            if (!hasWx) day = hour >= 6 && hour < 18;
            String md = hasWx ? mood(code, temp, wind, day) : (day ? "sun" : "night");
            String city = sp.getString("loc_city", "");
            for (int id : ids) {
                String sz = size(m, id);
                RemoteViews v = new RemoteViews(c.getPackageName(), res(c, "s".equals(sz) ? "tmn_widget_msgs_s" : "m".equals(sz) ? "tmn_widget_msgs_m" : "tmn_widget_msgs", "layout"));
                v.setImageViewResource(res(c, "tmn_m_bg", "id"), res(c, "tmn_wbg_" + md, "drawable"));
                v.setInt(res(c, "tmn_m_bg", "id"), "setImageAlpha", bgAlpha(c));
                // si Tigo (3D) ayon sa panahon — flipbook
                int fl = res(c, "tmn_m_wx", "id");
                v.removeAllViews(fl);
                int n = frames(md);
                int[] order = n == 2 ? new int[] { 1, 1, 2 } : new int[] { 1, 2, 1, 3 };
                for (int f : order) {
                    RemoteViews fr = new RemoteViews(c.getPackageName(), res(c, "tmn_w_frame", "layout"));
                    fr.setImageViewResource(res(c, "tmn_w_frame_img", "id"), res(c, "tmn_wx_" + md + f, "drawable"));
                    v.addView(fl, fr);
                }
                // panahon
                v.setTextViewText(res(c, "tmn_m_temp", "id"), hasWx ? Math.round(temp) + "°" : "—°");
                String lab = hasWx ? label(code, day) : "Weather";
                v.setTextViewText(res(c, "tmn_m_cond", "id"), lab + (city.isEmpty() || "s".equals(sz) ? "" : " · " + city));
                v.setTextViewText(res(c, "tmn_m_hum", "id"), hasWx ? "💧 " + sp.getInt("wx_hum", 0) + "%   🌬 " + Math.round(wind) + " km/h" : "Updating…");
                // mga pindot
                v.setOnClickPendingIntent(res(c, "tmn_m_head", "id"), open(c, "app/messages.html", 100));
                v.setOnClickPendingIntent(res(c, "tmn_m_tigo", "id"), open(c, "app/messages.html", 103));
                Intent r = new Intent(c, MessagesWidget.class).setAction(ACTION_REFRESH);
                v.setOnClickPendingIntent(res(c, "tmn_m_refresh", "id"), PendingIntent.getBroadcast(c, 101, r, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
                v.setTextViewText(res(c, "tmn_m_total", "id"), total > 99 ? "99+ new" : total + " new");
                v.setViewVisibility(res(c, "tmn_m_total", "id"), !out && total > 0 ? View.VISIBLE : View.GONE);
                int from = res(c, "tmn_m_from", "id"), msg = res(c, "tmn_m_msg", "id"), bub = res(c, "tmn_m_bubble", "id");
                boolean big = "l".equals(sz);
                if (hot != null) {
                    String when = when(hot.optString("at")), txt = hot.optString("text");
                    if (txt.isEmpty()) txt = "New message";
                    if (big) {
                        v.setTextViewText(from, hot.optString("name") + (when.isEmpty() ? "" : " · " + when));
                        v.setViewVisibility(from, View.VISIBLE);
                        v.setTextViewText(msg, txt);
                    } else {
                        v.setViewVisibility(from, View.GONE);
                        v.setTextViewText(msg, hot.optString("name") + ": " + txt);
                    }
                    v.setTextColor(msg, 0xFF1B1B1F);
                    v.setInt(bub, "setBackgroundResource", res(c, "tmn_w_bubble", "drawable"));
                    v.setOnClickPendingIntent(bub, open(c, "app/messages.html?c=" + hot.optString("id"), 110));
                } else {
                    v.setViewVisibility(from, View.GONE);
                    v.setTextViewText(msg, out ? "Sign in to see new messages" : "No new messages ✨");
                    v.setTextColor(msg, 0xE6FFFFFF);
                    v.setInt(bub, "setBackgroundResource", res(c, "tmn_w_bubble_quiet", "drawable"));
                    v.setOnClickPendingIntent(bub, open(c, "app/messages.html", 111));
                }
                m.updateAppWidget(id, v);
            }
        } catch (Exception e) { }
    }
}
