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
            for (Uri u : uris) {
                try {
                    String id = "m" + Long.toString(System.currentTimeMillis(), 36) + Integer.toString((int) (Math.random() * 46656), 36);
                    String nm = null;
                    try (Cursor c = getContext().getContentResolver().query(u, new String[] { "_display_name" }, null, null, null)) { if (c != null && c.moveToFirst()) nm = c.getString(0); }
                    if (nm == null) nm = "Song";
                    String ext = nm.contains(".") ? nm.substring(nm.lastIndexOf('.')) : ".mp3";
                    File out = new File(eng().musicDir(), id + ext);
                    try (InputStream in = getContext().getContentResolver().openInputStream(u); OutputStream os = new FileOutputStream(out)) {
                        byte[] b = new byte[64 * 1024]; int n; while ((n = in.read(b)) > 0) os.write(b, 0, n);
                    }
                    MusicEngine.Track t = new MusicEngine.Track(); t.id = id; t.file = out.getAbsolutePath();
                    String title = null, artist = null; long dur = 0;
                    try {
                        MediaMetadataRetriever mr = new MediaMetadataRetriever(); mr.setDataSource(t.file);
                        title = mr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE); artist = mr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST);
                        String d = mr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION); if (d != null) dur = Long.parseLong(d);
                        mr.release();
                    } catch (Exception e) { }
                    String base = nm.replaceAll("\\.[A-Za-z0-9]{2,5}$", "").replace('_', ' ').trim();
                    if ((title == null || title.trim().isEmpty()) && base.contains(" - ")) { artist = artist != null && !artist.isEmpty() ? artist : base.substring(0, base.indexOf(" - ")); title = base.substring(base.indexOf(" - ") + 3); }
                    t.name = title != null && !title.trim().isEmpty() ? title.trim() : base; t.artist = artist != null ? artist.trim() : ""; t.dur = dur / 1000;
                    eng().add(t); added++;
                } catch (Exception e) { skipped++; }
            }
            JSObject o = new JSObject(); o.put("added", added); o.put("skipped", skipped); call.resolve(o);
        }).start();
    }

    @PluginMethod public void musicList(PluginCall call) throws Exception {
        JSObject o = new JSObject(); o.put("tracks", new JSArray(eng().listJson().toString())); o.put("state", new JSObject(eng().stateJson().toString())); call.resolve(o);
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
}
