package __PKG__;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Size;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/** window.Capacitor.Plugins.TmnNative — Gallery ng phone (MediaStore) at music player (MusicEngine). */
@CapacitorPlugin(name = "TmnNative", permissions = {
    @Permission(alias = "media33", strings = { Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO }),
    @Permission(alias = "audio33", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
    @Permission(alias = "media", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
})
public class TmnNative extends Plugin {

    // ================= Permission =================
    private String alias() { return Build.VERSION.SDK_INT >= 33 ? "media33" : "media"; }
    private boolean has() { return getPermissionState(alias()) == PermissionState.GRANTED; }

    @PluginMethod
    public void galleryAccess(PluginCall call) {
        JSObject o = new JSObject(); o.put("granted", has()); call.resolve(o);
    }
    @PluginMethod
    public void galleryRequest(PluginCall call) {
        if (has()) { JSObject o = new JSObject(); o.put("granted", true); call.resolve(o); return; }
        requestPermissionForAlias(alias(), call, "accessDone");
    }
    @PermissionCallback
    private void accessDone(PluginCall call) {
        JSObject o = new JSObject(); o.put("granted", has()); call.resolve(o);
    }

    // ================= Gallery =================
    private static final String[] COLS = {
        MediaStore.Files.FileColumns._ID, MediaStore.Files.FileColumns.MEDIA_TYPE, MediaStore.Files.FileColumns.DISPLAY_NAME,
        MediaStore.Files.FileColumns.MIME_TYPE, MediaStore.Files.FileColumns.SIZE, MediaStore.Files.FileColumns.DATE_ADDED,
        MediaStore.MediaColumns.BUCKET_ID, MediaStore.MediaColumns.BUCKET_DISPLAY_NAME,
        MediaStore.MediaColumns.WIDTH, MediaStore.MediaColumns.HEIGHT, MediaStore.MediaColumns.DURATION
    };
    private static final String BASE_SEL = "(" + MediaStore.Files.FileColumns.MEDIA_TYPE + "=" + MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE
        + " OR " + MediaStore.Files.FileColumns.MEDIA_TYPE + "=" + MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO + ")";

    private Cursor q(String sel, String[] args, int offset, int limit) {
        ContentResolver r = getContext().getContentResolver();
        Uri uri = MediaStore.Files.getContentUri("external");
        String sort = MediaStore.Files.FileColumns.DATE_ADDED + " DESC";
        if (Build.VERSION.SDK_INT >= 26) {
            Bundle b = new Bundle();
            b.putString(ContentResolver.QUERY_ARG_SQL_SELECTION, sel);
            b.putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, args);
            b.putString(ContentResolver.QUERY_ARG_SQL_SORT_ORDER, sort);
            if (limit > 0) { b.putInt(ContentResolver.QUERY_ARG_LIMIT, limit); b.putInt(ContentResolver.QUERY_ARG_OFFSET, offset); }
            return r.query(uri, COLS, b, null);
        }
        return r.query(uri, COLS, sel, args, sort + (limit > 0 ? " LIMIT " + limit + " OFFSET " + offset : ""));
    }
    private JSObject row(Cursor c) {
        JSObject o = new JSObject();
        long id = c.getLong(0); int type = c.getInt(1);
        o.put("id", id); o.put("type", type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO ? "video" : "photo");
        o.put("name", c.getString(2)); o.put("mime", c.getString(3)); o.put("size", c.getLong(4)); o.put("date", c.getLong(5) * 1000L);
        o.put("w", c.getInt(8)); o.put("h", c.getInt(9)); o.put("duration", c.getLong(10) / 1000.0);
        return o;
    }

    @PluginMethod
    public void galleryBuckets(PluginCall call) {
        if (!has()) { call.reject("No permission"); return; }
        try (Cursor c = q(BASE_SEL, null, 0, 0)) {
            Map<String, JSObject> m = new LinkedHashMap<>();
            int total = 0;
            while (c != null && c.moveToNext()) {
                total++;
                String bid = c.getString(6); if (bid == null) bid = "0";
                JSObject b = m.get(bid);
                if (b == null) {
                    b = new JSObject(); b.put("id", bid); b.put("name", c.getString(7) != null ? c.getString(7) : "Other");
                    b.put("count", 0); b.put("cover", row(c)); m.put(bid, b);
                }
                b.put("count", b.optInt("count") + 1);
            }
            JSArray a = new JSArray(); for (JSObject b : m.values()) a.put(b);
            JSObject o = new JSObject(); o.put("buckets", a); o.put("total", total);
            call.resolve(o);
        } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
    }

    @PluginMethod
    public void galleryItems(PluginCall call) {
        if (!has()) { call.reject("No permission"); return; }
        String bucket = call.getString("bucket", "all");
        int offset = call.getInt("offset", 0), limit = call.getInt("limit", 120);
        String sel = BASE_SEL; String[] args = null;
        if (!"all".equals(bucket)) { sel += " AND " + MediaStore.MediaColumns.BUCKET_ID + "=?"; args = new String[] { bucket }; }
        // photosOnly: litrato lang (para sa pag-post — walang video sa server)
        if (call.getBoolean("photosOnly", false)) sel += " AND " + MediaStore.Files.FileColumns.MEDIA_TYPE + "=" + MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE;
        try (Cursor c = q(sel, args, offset, limit)) {
            JSArray a = new JSArray();
            while (c != null && c.moveToNext()) a.put(row(c));
            JSObject o = new JSObject(); o.put("items", a); call.resolve(o);
        } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
    }

    private Uri uriFor(long id, String type) {
        Uri base = "video".equals(type) ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI : MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
        return ContentUris.withAppendedId(base, id);
    }

    /** Thumbnail ng isang item → file sa cache (ipapakita gamit ang Capacitor.convertFileSrc). */
    @PluginMethod
    public void galleryThumb(PluginCall call) {
        try {
            long id = call.getData().getLong("id"); String type = call.getString("type", "photo");
            int size = call.getInt("size", 320);
            File d = new File(getContext().getCacheDir(), "tmn-thumbs"); d.mkdirs();
            File f = new File(d, type + "_" + id + "_" + size + ".jpg");
            if (!f.exists()) {
                Bitmap bm = null;
                if (Build.VERSION.SDK_INT >= 29) bm = getContext().getContentResolver().loadThumbnail(uriFor(id, type), new Size(size, size), null);
                else if ("video".equals(type)) bm = MediaStore.Video.Thumbnails.getThumbnail(getContext().getContentResolver(), id, MediaStore.Video.Thumbnails.MINI_KIND, null);
                else bm = MediaStore.Images.Thumbnails.getThumbnail(getContext().getContentResolver(), id, MediaStore.Images.Thumbnails.MINI_KIND, null);
                if (bm == null) { call.reject("No thumbnail"); return; }
                try (OutputStream out = new FileOutputStream(f)) { bm.compress(Bitmap.CompressFormat.JPEG, 82, out); }
            }
            JSObject o = new JSObject(); o.put("path", f.getAbsolutePath()); call.resolve(o);
        } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
    }

    /** Kopya ng buong file sa cache (para ma-fetch ng page at ma-upload / ma-post). */
    @PluginMethod
    public void galleryFile(PluginCall call) {
        try {
            long id = call.getData().getLong("id"); String type = call.getString("type", "photo");
            String name = call.getString("name", "file");
            File d = new File(getContext().getCacheDir(), "tmn-up"); d.mkdirs();
            File f = new File(d, id + "_" + name.replaceAll("[^A-Za-z0-9._-]", "_"));
            if (!f.exists()) {
                try (InputStream in = getContext().getContentResolver().openInputStream(uriFor(id, type)); OutputStream out = new FileOutputStream(f)) {
                    byte[] b = new byte[64 * 1024]; int n; while ((n = in.read(b)) > 0) out.write(b, 0, n);
                }
            }
            JSObject o = new JSObject(); o.put("path", f.getAbsolutePath()); call.resolve(o);
        } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
    }

    @PluginMethod
    public void galleryClean(PluginCall call) {
        File d = new File(getContext().getCacheDir(), "tmn-up");
        File[] fs = d.listFiles(); if (fs != null) for (File f : fs) f.delete();
        call.resolve();
    }

    // ================= Music =================
    private MusicEngine eng() { return MusicEngine.get(getContext()); }

    @PluginMethod
    public void musicPick(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE); i.setType("audio/*"); i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(call, i, "musicPicked");
    }
    @ActivityCallback
    private void musicPicked(final PluginCall call, final ActivityResult r) {
        if (call == null) return;
        final Intent data = r.getData();
        if (r.getResultCode() != android.app.Activity.RESULT_OK || data == null) { JSObject o = new JSObject(); o.put("added", 0); call.resolve(o); return; }
        final ArrayList<Uri> uris = new ArrayList<>();
        if (data.getClipData() != null) for (int k = 0; k < data.getClipData().getItemCount(); k++) uris.add(data.getClipData().getItemAt(k).getUri());
        else if (data.getData() != null) uris.add(data.getData());
        new Thread(() -> {
            int added = 0, skipped = 0;
            java.util.HashSet<String> have = musicNames();
            for (Uri u : uris) {
                int k = musicCopy(u, null, null, have);
                if (k > 0) added++; else if (k < 0) skipped++;
            }
            JSObject o = new JSObject(); o.put("added", added); o.put("skipped", skipped); call.resolve(o);
        }).start();
    }

    /** Mga pangalan ng kanta na nasa Music/TigoMeNote na (para hindi madoble). */
    private java.util.HashSet<String> musicNames() {
        java.util.HashSet<String> have = new java.util.HashSet<>();
        try (Cursor c = getContext().getContentResolver().query(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, new String[] { MediaStore.MediaColumns.DISPLAY_NAME },
                Build.VERSION.SDK_INT >= 29 ? MediaStore.MediaColumns.RELATIVE_PATH + " LIKE ?" : null, Build.VERSION.SDK_INT >= 29 ? new String[] { "Music/TigoMeNote%" } : null, null)) {
            while (c != null && c.moveToNext()) { String n = c.getString(0); if (n != null) have.add(n.toLowerCase()); }
        } catch (Exception e) { }
        return have;
    }
    /** Kopya ng isang kanta papunta sa Music/TigoMeNote. 1 = naidagdag, 0 = nandoon na (nilaktawan), -1 = hindi nakopya. */
    private int musicCopy(Uri u, String nm, String mime, java.util.HashSet<String> have) {
        try {
            if (Build.VERSION.SDK_INT < 29) return -1;
            ContentResolver cr = getContext().getContentResolver();
            if (nm == null) try (Cursor c = cr.query(u, new String[] { "_display_name" }, null, null, null)) { if (c != null && c.moveToFirst()) nm = c.getString(0); }
            if (nm == null) nm = "Song_" + System.currentTimeMillis() + ".mp3";
            if (have != null && have.contains(nm.toLowerCase())) return 0;
            if (mime == null) mime = cr.getType(u);
            if (mime == null || !mime.startsWith("audio")) mime = "audio/mpeg";
            android.content.ContentValues v = new android.content.ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, nm); v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, "Music/TigoMeNote"); v.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri dest = cr.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, v);
            if (dest == null) return -1;
            try (InputStream in = cr.openInputStream(u); OutputStream os = cr.openOutputStream(dest)) {
                byte[] b = new byte[64 * 1024]; int n; while ((n = in.read(b)) > 0) os.write(b, 0, n);
            } catch (Exception e) { cr.delete(dest, null, null); return -1; }
            android.content.ContentValues done = new android.content.ContentValues(); done.put(MediaStore.MediaColumns.IS_PENDING, 0);
            cr.update(dest, done, null, null);
            if (have != null) have.add(nm.toLowerCase());
            return 1;
        } catch (Exception e) { return -1; }
    }

    /** Pili ng buong FOLDER sa phone → lahat ng kanta sa loob (at sa mga folder sa loob nito, hanggang 3 lalim; hanggang 300 kanta). */
    @PluginMethod
    public void musicPickFolder(PluginCall call) {
        startActivityForResult(call, new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), "musicFolderPicked");
    }
    @ActivityCallback
    private void musicFolderPicked(final PluginCall call, final ActivityResult r) {
        if (call == null) return;
        final Intent data = r.getData();
        if (r.getResultCode() != android.app.Activity.RESULT_OK || data == null || data.getData() == null) { JSObject o = new JSObject(); o.put("added", 0); o.put("cancelled", true); call.resolve(o); return; }
        final Uri tree = data.getData();
        new Thread(() -> {
            int[] n = new int[4];   // 0 naidagdag · 1 nandoon na · 2 hindi nakopya · 3 nakitang kanta
            try { musicWalk(tree, android.provider.DocumentsContract.getTreeDocumentId(tree), 0, n, musicNames()); } catch (Exception e) { }
            JSObject o = new JSObject(); o.put("added", n[0]); o.put("had", n[1]); o.put("skipped", n[2]); o.put("found", n[3]); call.resolve(o);
        }).start();
    }
    private static final String AUDIO_EXT = "mp3|m4a|aac|wav|ogg|oga|opus|flac|wma|amr|mid|midi|3gp";
    private void musicWalk(Uri tree, String docId, int depth, int[] n, java.util.HashSet<String> have) {
        Uri kids = android.provider.DocumentsContract.buildChildDocumentsUriUsingTree(tree, docId);
        ArrayList<String[]> dirs = new ArrayList<>();
        try (Cursor c = getContext().getContentResolver().query(kids, new String[] { "document_id", "_display_name", "mime_type" }, null, null, null)) {
            while (c != null && c.moveToNext() && n[3] < 300) {
                String id = c.getString(0), nm = c.getString(1), mime = c.getString(2);
                if (id == null || nm == null) continue;
                if (android.provider.DocumentsContract.Document.MIME_TYPE_DIR.equals(mime)) { if (!nm.startsWith(".")) dirs.add(new String[] { id }); continue; }
                boolean audio = (mime != null && mime.startsWith("audio/")) || nm.toLowerCase().matches(".*\\.(" + AUDIO_EXT + ")$");
                if (!audio) continue;
                n[3]++;
                int k = musicCopy(android.provider.DocumentsContract.buildDocumentUriUsingTree(tree, id), nm, mime, have);
                if (k > 0) n[0]++; else if (k == 0) n[1]++; else n[2]++;
            }
        } catch (Exception e) { }
        if (depth < 3) for (String[] d : dirs) { if (n[3] >= 300) break; musicWalk(tree, d[0], depth + 1, n, have); }
    }

    // Permiso para makita ang kanta na idinagdag ng ibang TigoMeNote app (Android 13+: Music and audio)
    private boolean audioOk() {
        if (Build.VERSION.SDK_INT >= 33) return getPermissionState("audio33") == PermissionState.GRANTED;
        return Build.VERSION.SDK_INT < 23 || getPermissionState("media") == PermissionState.GRANTED;
    }
    @PluginMethod public void musicRequest(PluginCall call) {
        if (audioOk()) { JSObject o = new JSObject(); o.put("granted", true); call.resolve(o); return; }
        requestPermissionForAlias(Build.VERSION.SDK_INT >= 33 ? "audio33" : "media", call, "audioDone");
    }
    @PermissionCallback private void audioDone(PluginCall call) { JSObject o = new JSObject(); o.put("granted", audioOk()); call.resolve(o); }

    @PluginMethod public void musicList(PluginCall call) throws Exception {
        JSObject o = new JSObject(); o.put("access", audioOk()); o.put("tracks", new JSArray(eng().listJson().toString())); o.put("state", new JSObject(eng().stateJson().toString())); call.resolve(o);
    }
    @PluginMethod public void musicState(PluginCall call) throws Exception { call.resolve(new JSObject(eng().stateJson().toString())); }
    @PluginMethod public void musicPlay(PluginCall call) { eng().playId(call.getString("id", "")); call.resolve(); }
    @PluginMethod public void musicToggle(PluginCall call) { eng().toggle(); call.resolve(); }
    @PluginMethod public void musicNext(PluginCall call) { eng().next(); call.resolve(); }
    @PluginMethod public void musicPrev(PluginCall call) { eng().prev(); call.resolve(); }
    @PluginMethod public void musicSeek(PluginCall call) { eng().seek(call.getInt("ms", 0)); call.resolve(); }
    @PluginMethod public void musicRemove(PluginCall call) { eng().remove(call.getString("id", "")); call.resolve(); }
    @PluginMethod public void musicRename(PluginCall call) { eng().rename(call.getString("id", ""), call.getString("name", "")); call.resolve(); }
    @PluginMethod public void musicMove(PluginCall call) { eng().move(call.getString("id", ""), call.getInt("dir", 0)); call.resolve(); }
    @PluginMethod public void musicSet(PluginCall call) {
        eng().setModes(call.hasOption("shuffle") ? call.getBoolean("shuffle") : null, call.getString("repeat"));
        call.resolve();
    }

    // ================= Upload keep-alive =================
    /** on = may naka-pilang posts → panatilihing buhay ang app (foreground service). */
    @PluginMethod public void syncKeep(PluginCall call) {
        try {
            Intent i = new Intent(getContext(), UploadKeepService.class);
            if (call.getBoolean("on", false)) androidx.core.content.ContextCompat.startForegroundService(getContext(), i);
            else getContext().stopService(i);
        } catch (Exception e) { }
        call.resolve();
    }

    // ================= Phone storage (hindi nabubura kahit i-uninstall ang app) =================
    /** saveToPhone({ data: base64, name, mime }) → Pictures/TigoMeNote (litrato) o Movies/TigoMeNote (video). Makikita sa gallery ng phone. */
    @PluginMethod public void saveToPhone(final PluginCall call) {
        final String data = call.getString("data", ""), mime0 = call.getString("mime", "image/jpeg");
        final String name = call.getString("name", "TigoMeNote_" + System.currentTimeMillis());
        new Thread(() -> {
            try {
                if (Build.VERSION.SDK_INT < 29) { call.reject("Android 10 or newer is needed."); return; }
                boolean video = mime0.startsWith("video/");
                String mime = video || mime0.startsWith("image/") ? mime0 : "image/jpeg";
                byte[] bytes = android.util.Base64.decode(data, android.util.Base64.DEFAULT);
                ContentResolver cr = getContext().getContentResolver();
                android.content.ContentValues v = new android.content.ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name); v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, video ? "Movies/TigoMeNote" : "Pictures/TigoMeNote"); v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                Uri dest = cr.insert(video ? MediaStore.Video.Media.EXTERNAL_CONTENT_URI : MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                if (dest == null) { call.reject("Couldn't save to the phone."); return; }
                try (OutputStream os = cr.openOutputStream(dest)) { os.write(bytes); }
                catch (Exception e) { cr.delete(dest, null, null); call.reject("Couldn't save to the phone."); return; }
                android.content.ContentValues done = new android.content.ContentValues(); done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                cr.update(dest, done, null, null);
                JSObject o = new JSObject(); o.put("uri", dest.toString()); call.resolve(o);
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
        }).start();
    }

    /** backupWrite({ text, name }) → Documents/TigoMeNote/<name> (pinapalitan kung meron na). Para sa Daily notes at reminders. */
    @PluginMethod public void backupWrite(final PluginCall call) {
        final String text = call.getString("text", ""), name = call.getString("name", "TigoMeNote-backup.json");
        new Thread(() -> {
            try {
                if (Build.VERSION.SDK_INT < 29) { call.reject("Android 10 or newer is needed."); return; }
                ContentResolver cr = getContext().getContentResolver();
                Uri coll = MediaStore.Files.getContentUri("external");
                Uri dest = null;
                // sariling file na ginawa ng app na ito (kung meron na): palitan ang laman
                try (Cursor c = cr.query(coll, new String[] { MediaStore.MediaColumns._ID },
                        MediaStore.MediaColumns.RELATIVE_PATH + "=? AND " + MediaStore.MediaColumns.DISPLAY_NAME + "=?", new String[] { "Documents/TigoMeNote/", name }, null)) {
                    if (c != null && c.moveToFirst()) dest = ContentUris.withAppendedId(coll, c.getLong(0));
                }
                if (dest == null) {
                    android.content.ContentValues v = new android.content.ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, name); v.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, "Documents/TigoMeNote");
                    dest = cr.insert(coll, v);
                }
                if (dest == null) { call.reject("Couldn't write the backup."); return; }
                try (OutputStream os = cr.openOutputStream(dest, "wt")) { os.write(text.getBytes("UTF-8")); }
                JSObject o = new JSObject(); o.put("uri", dest.toString()); o.put("at", System.currentTimeMillis()); call.resolve(o);
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
        }).start();
    }
}
