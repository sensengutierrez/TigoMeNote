package __PKG__;

import android.app.Notification;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.json.JSONArray;
import org.json.JSONObject;

/** TigoMeNote music: playlist (nasa loob ng app), MediaPlayer, notification, lock screen (MediaSession) at widget. */
public final class MusicEngine {
    public static final String CH = "tmn_music";
    public static final int NID = 4711;
    public static final String ACT = "tmn.music.";

    public static final class Track {
        public String id, name, artist, uri; public long dur;
        JSONObject json() {
            try { return new JSONObject().put("id", id).put("name", name).put("artist", artist).put("uri", uri).put("dur", dur); }
            catch (Exception e) { return new JSONObject(); }
        }
    }

    private static MusicEngine I;
    public static synchronized MusicEngine get(Context c) { if (I == null) I = new MusicEngine(c.getApplicationContext()); return I; }

    private final Context ctx;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final List<Track> tracks = new ArrayList<>();
    private MediaPlayer mp;
    private int idx = -1;
    private boolean shuffle = false;
    private String repeat = "all";
    private MediaSessionCompat session;
    private MusicService service;
    private AudioManager am;
    private AudioFocusRequest focusReq;
    private String lastErr = "";   // bakit hindi tumugtog (ipinapakita at nire-report ng music-native.js)

    private MusicEngine(Context c) {
        ctx = c; am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
        load();
    }

    // ---------- playlist ----------
    // Ang mga kanta ay nasa phone: Music/TigoMeNote (MediaStore) — kaya NAKIKITA ng TigoMeNote at Chat ang parehong playlist.
    // Sa loob ng app lang ang order, pangalan at "tinago" (music/prefs.json).
    private final List<String> order = new ArrayList<>();
    private final org.json.JSONObject names = new org.json.JSONObject();
    private final java.util.Set<String> hidden = new java.util.HashSet<>();
    private File dir() { File d = new File(ctx.getFilesDir(), "music"); d.mkdirs(); return d; }
    private File prefsFile() { return new File(dir(), "prefs.json"); }
    private synchronized void load() {
        try {
            File f = prefsFile(); if (!f.exists()) return;
            byte[] b = new byte[(int) f.length()]; try (FileInputStream in = new FileInputStream(f)) { in.read(b); }
            JSONObject o = new JSONObject(new String(b, "UTF-8"));
            shuffle = o.optBoolean("shuffle", false); repeat = o.optString("repeat", "all");
            JSONArray a = o.optJSONArray("order"); for (int i = 0; a != null && i < a.length(); i++) order.add(a.getString(i));
            a = o.optJSONArray("hidden"); for (int i = 0; a != null && i < a.length(); i++) hidden.add(a.getString(i));
            JSONObject n = o.optJSONObject("names"); if (n != null) { java.util.Iterator<String> k = n.keys(); while (k.hasNext()) { String key = k.next(); names.put(key, n.getString(key)); } }
        } catch (Exception e) { }
    }
    private synchronized void save() {
        try {
            JSONArray oa = new JSONArray(); for (Track t : tracks) oa.put(t.id);
            JSONArray ha = new JSONArray(); for (String h : hidden) ha.put(h);
            JSONObject o = new JSONObject().put("order", oa).put("hidden", ha).put("names", names).put("shuffle", shuffle).put("repeat", repeat);
            try (FileOutputStream out = new FileOutputStream(prefsFile())) { out.write(o.toString().getBytes("UTF-8")); }
        } catch (Exception e) { }
    }
    /** Basahin ulit ang Music/TigoMeNote (kasama ang idinagdag ng ibang TigoMeNote app, kung may permiso). */
    public synchronized void sync() {
        String curId = idx >= 0 && idx < tracks.size() ? tracks.get(idx).id : null;
        List<Track> found = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= 29) {
            android.net.Uri base = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            String[] cols = { android.provider.MediaStore.Audio.Media._ID, android.provider.MediaStore.Audio.Media.TITLE, android.provider.MediaStore.Audio.Media.ARTIST,
                android.provider.MediaStore.Audio.Media.DURATION, android.provider.MediaStore.Audio.Media.DISPLAY_NAME, android.provider.MediaStore.Audio.Media.DATE_ADDED };
            try (android.database.Cursor c = ctx.getContentResolver().query(base, cols, android.provider.MediaStore.MediaColumns.RELATIVE_PATH + " LIKE ?", new String[] { "Music/TigoMeNote%" }, android.provider.MediaStore.Audio.Media.DATE_ADDED + " ASC")) {
                while (c != null && c.moveToNext()) {
                    Track t = new Track(); long id = c.getLong(0);
                    t.id = "a" + id; t.uri = android.content.ContentUris.withAppendedId(base, id).toString();
                    String title = c.getString(1), disp = c.getString(4);
                    t.name = title != null && !title.trim().isEmpty() ? title.trim() : (disp != null ? disp.replaceAll("\\.[A-Za-z0-9]{2,5}$", "") : "Song");
                    String ar = c.getString(2); t.artist = ar == null || ar.equals("<unknown>") ? "" : ar.trim();
                    t.dur = c.getLong(3) / 1000;
                    if (hidden.contains(t.id)) continue;
                    String rn = names.optString(t.id, ""); if (!rn.isEmpty()) t.name = rn;
                    found.add(t);
                }
            } catch (Exception e) { }
        }
        // order: ayon sa naka-save, ang bago ay sa dulo
        List<Track> sorted = new ArrayList<>();
        for (String id : order) for (Track t : found) if (t.id.equals(id)) { sorted.add(t); break; }
        for (Track t : found) if (!sorted.contains(t)) sorted.add(t);
        tracks.clear(); tracks.addAll(sorted);
        idx = -1; if (curId != null) for (int i = 0; i < tracks.size(); i++) if (tracks.get(i).id.equals(curId)) idx = i;
        if (idx < 0 && mp != null) stopPlayer();
    }
    public synchronized JSONArray listJson() { sync(); JSONArray a = new JSONArray(); for (Track t : tracks) a.put(t.json()); return a; }
    public synchronized void remove(String id) {
        int i = indexOf(id); if (i < 0) return;
        Track t = tracks.get(i);
        boolean cur = i == idx;
        if (cur) { stopPlayer(); idx = -1; }
        // buburahin ang file kung kaya (sariling file); kung hindi (galing sa ibang app) itatago na lang dito
        try { if (ctx.getContentResolver().delete(android.net.Uri.parse(t.uri), null, null) <= 0) hidden.add(id); } catch (Exception e) { hidden.add(id); }
        names.remove(id); tracks.remove(i); if (!cur && i < idx) idx--;
        save(); changed();
    }
    public synchronized void rename(String id, String name) { int i = indexOf(id); if (i >= 0 && name != null && !name.trim().isEmpty()) { tracks.get(i).name = name.trim(); try { names.put(id, name.trim()); } catch (Exception e) { } save(); changed(); } }
    public synchronized void move(String id, int dir) {
        int i = indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= tracks.size()) return;
        Track a = tracks.get(i); tracks.set(i, tracks.get(j)); tracks.set(j, a);
        if (idx == i) idx = j; else if (idx == j) idx = i;
        save();
    }
    public synchronized void setModes(Boolean sh, String rp) { if (sh != null) shuffle = sh; if (rp != null) repeat = rp; save(); }
    private int indexOf(String id) { for (int i = 0; i < tracks.size(); i++) if (tracks.get(i).id.equals(id)) return i; return -1; }

    // ---------- playback ----------
    private void stopPlayer() { if (mp != null) { try { mp.stop(); } catch (Exception e) { } mp.release(); mp = null; } }
    public synchronized void playId(String id) { int i = indexOf(id); if (i >= 0) play(i); }
    public synchronized void play(int i) {
        if (i < 0 || i >= tracks.size()) return;
        stopPlayer(); idx = i;
        Track t = tracks.get(i);
        try {
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            mp.setWakeMode(ctx, android.os.PowerManager.PARTIAL_WAKE_LOCK);
            mp.setDataSource(ctx, android.net.Uri.parse(t.uri)); mp.prepare();
            mp.setOnCompletionListener(m -> onDone());
            mp.setOnErrorListener((m, w, e) -> { lastErr = "MediaPlayer error " + w + "/" + e; onDone(); return true; });
            focus();
            mp.start();
            lastErr = "";
        } catch (Exception e) { lastErr = e.getClass().getSimpleName() + ": " + e.getMessage() + " · uri=" + t.uri; stopPlayer(); idx = -1; }
        ensureService(); changed();
    }
    private void onDone() {
        synchronized (this) {
            if ("one".equals(repeat) && idx >= 0) { play(idx); return; }
            int n = nextIndex(1);
            if (n >= 0) play(n); else { stopPlayer(); changed(); }
        }
    }
    private int nextIndex(int dir) {
        if (tracks.isEmpty()) return -1;
        if (shuffle && dir > 0) { if (tracks.size() == 1) return 0; int r; do { r = new Random().nextInt(tracks.size()); } while (r == idx); return r; }
        int n = idx + dir;
        if (n >= tracks.size()) return "all".equals(repeat) ? 0 : -1;
        if (n < 0) return "all".equals(repeat) ? tracks.size() - 1 : 0;
        return n;
    }
    public synchronized void next() { int n = nextIndex(1); if (n >= 0) play(n); }
    public synchronized void prev() { if (mp != null && mp.getCurrentPosition() > 3000) { mp.seekTo(0); changed(); return; } int n = nextIndex(-1); if (n >= 0) play(n); }
    public synchronized void pause() { if (mp != null && mp.isPlaying()) { mp.pause(); changed(); } }
    public synchronized void userPause() { pausedByFocus = false; pause(); }
    public synchronized void resume() {
        if (mp != null && !mp.isPlaying()) {
            try { focus(); mp.start(); lastErr = ""; } catch (Exception e) { lastErr = "resume: " + e; stopPlayer(); play(idx >= 0 ? idx : 0); return; }
            ensureService(); changed();
        }
    }
    /** ✕ sa notification: hinto at alis ang notification (nananatili ang playlist; ▶ ulit sa app o widget). */
    public synchronized void close() { pausedByFocus = false; stopPlayer(); changed(); }
    // si Tigo (3D) bilang larawan ng kanta: sa notification, lock screen at media panel
    private android.graphics.Bitmap artPlay, artRest;
    android.graphics.Bitmap art(boolean playing) {
        try {
            if (artPlay == null) artPlay = android.graphics.BitmapFactory.decodeResource(ctx.getResources(), res(ctx, "tmn_tigo_music1", "drawable"));
            if (artRest == null) artRest = android.graphics.BitmapFactory.decodeResource(ctx.getResources(), res(ctx, "tmn_tigo_rest", "drawable"));
        } catch (Exception e) { }
        return playing ? artPlay : artRest;
    }
    public synchronized void toggle() {
        if (mp == null) { if (!tracks.isEmpty()) play(idx >= 0 ? idx : 0); return; }
        if (mp.isPlaying()) userPause(); else resume();
    }
    public synchronized void seek(int ms) { if (mp != null) { mp.seekTo(Math.max(0, ms)); changed(); } }
    public synchronized boolean isPlaying() { try { return mp != null && mp.isPlaying(); } catch (Exception e) { return false; } }
    public synchronized boolean hasTrack() { return idx >= 0 && idx < tracks.size() && mp != null; }
    public synchronized int pos() { try { return mp != null ? mp.getCurrentPosition() : 0; } catch (Exception e) { return 0; } }
    public synchronized int dur() { try { return mp != null ? mp.getDuration() : 0; } catch (Exception e) { return 0; } }
    public synchronized Track cur() { return idx >= 0 && idx < tracks.size() ? tracks.get(idx) : null; }
    public synchronized JSONObject stateJson() {
        try {
            Track t = cur();
            return new JSONObject().put("id", t != null ? t.id : "").put("playing", isPlaying()).put("active", hasTrack())
                .put("pos", pos()).put("dur", dur()).put("shuffle", shuffle).put("repeat", repeat).put("error", lastErr).put("count", tracks.size());
        } catch (Exception e) { return new JSONObject(); }
    }

    // Audio focus: IISANG listener at IISANG request lang. (Dati, bagong request bawat kanta → natatanggap ng lumang
    // request ang "LOSS" at pina-pause ang bagong kanta — kaya unang kanta lang ang tumutugtog.)
    private boolean hasFocus = false, pausedByFocus = false;
    private final AudioManager.OnAudioFocusChangeListener focusL = ch -> {
        if (ch == AudioManager.AUDIOFOCUS_LOSS) { hasFocus = false; pausedByFocus = false; pause(); }
        else if (ch == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) { if (isPlaying()) { pausedByFocus = true; pause(); } }
        else if (ch == AudioManager.AUDIOFOCUS_GAIN) { hasFocus = true; if (pausedByFocus) { pausedByFocus = false; resume(); } }
    };
    private void focus() {
        if (hasFocus) return;
        try {
            int r;
            if (Build.VERSION.SDK_INT >= 26) {
                if (focusReq == null) focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                    .setOnAudioFocusChangeListener(focusL).build();
                r = am.requestAudioFocus(focusReq);
            } else r = am.requestAudioFocus(focusL, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
            hasFocus = r == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        } catch (Exception e) { }
    }

    // ---------- service / notification / widget ----------
    void attach(MusicService s, MediaSessionCompat ms) { service = s; session = ms; }
    void detach() { service = null; session = null; }
    private void ensureService() {
        try { ContextCompat.startForegroundService(ctx, new Intent(ctx, MusicService.class)); } catch (Exception e) { }
    }
    private void changed() {
        main.post(() -> {
            if (service != null) service.refresh(); else updateWidgets();
        });
    }
    void updateSession(MediaSessionCompat s) {
        Track t = cur(); if (s == null) return;
        MediaMetadataCompat.Builder m = new MediaMetadataCompat.Builder();
        if (t != null) m.putString(MediaMetadataCompat.METADATA_KEY_TITLE, t.name).putString(MediaMetadataCompat.METADATA_KEY_ARTIST, t.artist.isEmpty() ? "My music" : t.artist).putLong(MediaMetadataCompat.METADATA_KEY_DURATION, dur());
        android.graphics.Bitmap a = art(isPlaying()); if (a != null) m.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, a);
        s.setMetadata(m.build());
        long acts = PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS | PlaybackStateCompat.ACTION_SEEK_TO;
        s.setPlaybackState(new PlaybackStateCompat.Builder().setActions(acts | PlaybackStateCompat.ACTION_STOP)
            // Android 13+: ang media controls ay galing sa session — kaya nandito rin ang ✕ (Close)
            .addCustomAction(new PlaybackStateCompat.CustomAction.Builder("tmn_close", "Close", res(ctx, "tmn_ic_close", "drawable")).build())
            .setState(!hasTrack() ? PlaybackStateCompat.STATE_STOPPED : isPlaying() ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, pos(), isPlaying() ? 1f : 0f).build());
    }
    private PendingIntent act(Context c, String a, int code) {
        Intent i = new Intent(c, MusicService.class).setAction(ACT + a);
        int fl = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        return Build.VERSION.SDK_INT >= 26 ? PendingIntent.getForegroundService(c, code, i, fl) : PendingIntent.getService(c, code, i, fl);
    }
    private PendingIntent open(Context c) {
        Intent i = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (i == null) i = new Intent();
        return PendingIntent.getActivity(c, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }
    private int res(Context c, String name, String type) { return c.getResources().getIdentifier(name, type, c.getPackageName()); }

    Notification build(Context c, MediaSessionCompat s) {
        Track t = cur(); boolean p = isPlaying();
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CH)
            .setSmallIcon(res(c, "tmn_ic_music", "drawable"))
            .setLargeIcon(art(p)).setColor(0xFF7B3FA0).setColorized(true)
            .setSubText(p ? "♪ Tigo is dancing" : "Tigo is resting")
            .setContentTitle(t != null ? t.name : "My music")
            .setContentText(t != null && !t.artist.isEmpty() ? t.artist : "TigoMeNote")
            .setContentIntent(open(c)).setOnlyAlertOnce(true).setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC).setOngoing(p)
            .addAction(res(c, "tmn_ic_prev", "drawable"), "Previous", act(c, "prev", 1))
            .addAction(res(c, p ? "tmn_ic_pause" : "tmn_ic_play", "drawable"), p ? "Pause" : "Play", act(c, "toggle", 2))
            .addAction(res(c, "tmn_ic_next", "drawable"), "Next", act(c, "next", 3))
            .addAction(res(c, "tmn_ic_close", "drawable"), "Close", act(c, "close", 5))
            .setDeleteIntent(act(c, "stop", 4));
        androidx.media.app.NotificationCompat.MediaStyle st = new androidx.media.app.NotificationCompat.MediaStyle().setShowActionsInCompactView(0, 1, 2)
            .setShowCancelButton(true).setCancelButtonIntent(act(c, "close", 6));
        if (s != null) st.setMediaSession(s.getSessionToken());
        b.setStyle(st);
        return b.build();
    }

    /** Progress lang (partial update) — hindi nire-restart ang sayaw ni Tigo sa widget. */
    public void updateProgress() {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, MusicWidget.class));
            if (ids == null) return;
            int d = dur(), ps = pos();
            for (int id : ids) {   // bawat widget ay may sariling ayos (laki)
                RemoteViews v = new RemoteViews(ctx.getPackageName(), layout(m, id));
                v.setProgressBar(res(ctx, "tmn_w_prog", "id"), 1000, d > 0 ? (int) (ps * 1000L / d) : 0, false);
                m.partiallyUpdateAppWidget(id, v);
            }
        } catch (Exception e) { }
    }
    private int layout(AppWidgetManager m, int id) { return res(ctx, "s".equals(MusicWidget.size(m, id)) ? "tmn_widget_music_s" : "tmn_widget_music", "layout"); }
    public void updateWidgets() {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx);
            int[] ids = m.getAppWidgetIds(new ComponentName(ctx, MusicWidget.class));
            if (ids == null || ids.length == 0) return;
            Track t = cur(); boolean p = isPlaying();
            for (int id : ids) {
            RemoteViews v = new RemoteViews(ctx.getPackageName(), layout(m, id));
            v.setTextViewText(res(ctx, "tmn_w_title", "id"), t != null ? t.name : "My music");
            v.setTextViewText(res(ctx, "tmn_w_artist", "id"), t != null ? (t.artist.isEmpty() ? "TigoMeNote" : t.artist) : "Tap ▶ to play your playlist");
            v.setImageViewResource(res(ctx, "tmn_w_play", "id"), res(ctx, p ? "tmn_ic_pause" : "tmn_ic_play", "drawable"));
            // si Tigo: sumasayaw (ViewFlipper) habang tumutugtog, tulog kapag naka-pause
            v.setViewVisibility(res(ctx, "tmn_w_dance", "id"), p ? android.view.View.VISIBLE : android.view.View.GONE);
            v.setViewVisibility(res(ctx, "tmn_w_rest", "id"), p ? android.view.View.GONE : android.view.View.VISIBLE);
            int d = dur(), ps = pos();
            v.setProgressBar(res(ctx, "tmn_w_prog", "id"), 1000, d > 0 ? (int) (ps * 1000L / d) : 0, false);
            v.setOnClickPendingIntent(res(ctx, "tmn_w_tigo", "id"), open(ctx));
            v.setOnClickPendingIntent(res(ctx, "tmn_w_prev", "id"), act(ctx, "prev", 11));
            v.setOnClickPendingIntent(res(ctx, "tmn_w_play", "id"), act(ctx, "toggle", 12));
            v.setOnClickPendingIntent(res(ctx, "tmn_w_next", "id"), act(ctx, "next", 13));
            v.setOnClickPendingIntent(res(ctx, "tmn_w_root", "id"), open(ctx));
            m.updateAppWidget(id, v);
            }
        } catch (Exception e) { }
    }
}
