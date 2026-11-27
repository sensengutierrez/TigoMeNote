package __PKG__;

// TigoMeNote · AppUpdater — in-app na update (OTA) mula sa GitHub Releases. Hindi kasama sa Google Play build (TMN_PLAY=1).
// JS (app-update.js):  const U = Capacitor.Plugins.TmnUpdate
//   U.download({ name, url, url2, sha256, size })  → { path }   (itinutuloy kapag naputol; sinusuri ang laki at SHA-256 bago ibigay)
//   U.addListener("progress", ({ done, total }) => …)
//   U.install({ path }) → { started } o { needPermission: true }   (Android 8+: "Install unknown apps" para sa app na ito)
//   U.openInstallSettings() · U.canInstall() → { allowed } · U.clean()
// Saan: <files>/updates/<name>.part → <name>.apk. Binubuksan ang installer ng Android sa TmnUpdateProvider (<pkg>.tmnupdate).
// Bakit sinusuri: ang "There was a problem while parsing the package" ay galing sa putol o maling file — hindi na ito umaabot sa installer.

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

@CapacitorPlugin(name = "TmnUpdate")
public class AppUpdater extends Plugin {
    private volatile boolean busy = false;

    private File dir() { File d = new File(getContext().getFilesDir(), "updates"); if (!d.exists()) d.mkdirs(); return d; }
    private static String safe(String s) { return s == null ? "update" : s.replaceAll("[^A-Za-z0-9._-]", "_"); }

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject r = new JSObject();
        r.put("allowed", Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls());
        call.resolve(r);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            Intent i = Build.VERSION.SDK_INT >= 26
                ? new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()))
                : new Intent(Settings.ACTION_SECURITY_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) { call.reject("Couldn't open settings"); }
    }

    @PluginMethod
    public void clean(PluginCall call) {
        File[] fs = dir().listFiles();
        if (fs != null) for (File f : fs) f.delete();
        call.resolve();
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String name = safe(call.getString("name", "update"));
        final String sha = call.getString("sha256", "").toLowerCase();
        final Double szD = call.getDouble("size", 0.0);
        final long size = szD == null ? 0 : szD.longValue();
        final String u1 = call.getString("url", ""), u2 = call.getString("url2", "");
        if (busy) { call.reject("Already downloading"); return; }
        busy = true;
        new Thread(() -> {
            try {
                File f = fetch(name, sha, size, new String[] { u1, u2 });
                JSObject r = new JSObject(); r.put("path", f.getAbsolutePath()); call.resolve(r);
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : "Download failed");
            } finally { busy = false; }
        }).start();
    }

    private File fetch(String name, String sha, long size, String[] urls) throws Exception {
        File done = new File(dir(), name + ".apk"), part = new File(dir(), name + ".part");
        if (done.exists() && (size <= 0 || done.length() == size) && (sha.isEmpty() || sha.equals(sha256(done)))) return done;
        done.delete();
        // iba pang lumang file (ibang version): burahin para hindi mapuno ang phone
        File[] old = dir().listFiles();
        if (old != null) for (File o : old) if (!o.getName().startsWith(name + ".")) o.delete();
        String last = "No internet";
        for (String u : urls) {
            if (u == null || u.isEmpty()) continue;
            for (int attempt = 0; attempt < 4; attempt++) {
                try {
                    if (get(u, part, size)) {
                        if (size > 0 && part.length() != size) { if (part.length() > size) part.delete(); last = "Download incomplete"; continue; }
                        if (!sha.isEmpty() && !sha.equals(sha256(part))) { part.delete(); last = "The file was damaged. Please try again."; continue; }
                        PackageInfo pi = getContext().getPackageManager().getPackageArchiveInfo(part.getAbsolutePath(), 0);
                        if (pi == null) { part.delete(); last = "The file is not a valid app."; continue; }
                        if (!getContext().getPackageName().equals(pi.packageName)) { part.delete(); throw new Exception("This update is for a different app."); }
                        if (!part.renameTo(done)) throw new Exception("Couldn't save the update.");
                        return done;
                    }
                } catch (java.io.IOException e) { last = "Connection lost. Retrying…"; Thread.sleep(1500L * (attempt + 1)); }
            }
        }
        throw new Exception(last);
    }

    // Kinukuha ang file; itinutuloy mula sa dulo ng .part (Range). true = tapos ang pagkuha (susuriin pa).
    private boolean get(String url, File part, long size) throws Exception {
        long have = part.exists() ? part.length() : 0;
        if (size > 0 && have >= size) return true;
        HttpURLConnection c = null;
        for (int hop = 0; hop < 6; hop++) {   // sundan ang redirect (GitHub → objects.githubusercontent.com) at ipadala ulit ang Range
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(15000); c.setReadTimeout(30000);
            c.setRequestProperty("User-Agent", "TigoMeNote-Updater");
            if (have > 0) c.setRequestProperty("Range", "bytes=" + have + "-");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) {
                url = new URL(new URL(url), c.getHeaderField("Location")).toString(); c.disconnect(); continue;
            }
            break;
        }
        int code = c.getResponseCode();
        if (code == 416) { c.disconnect(); return true; }              // tapos na pala
        if (code != 200 && code != 206) { c.disconnect(); throw new java.io.IOException("HTTP " + code); }
        String type = c.getContentType();
        if (type != null && type.toLowerCase().contains("text/html")) { c.disconnect(); throw new Exception("The download link returned a web page, not the app."); }
        boolean append = code == 206 && have > 0;
        if (!append) have = 0;
        long len = -1;
        try { len = Long.parseLong(c.getHeaderField("Content-Length")); } catch (Exception e) { }
        long total = len > 0 ? have + len : size;
        InputStream in = c.getInputStream();
        FileOutputStream out = new FileOutputStream(part, append);
        byte[] buf = new byte[64 * 1024];
        long got = have, lastT = 0;
        try {
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n); got += n;
                long now = System.currentTimeMillis();
                if (now - lastT > 250) { lastT = now; JSObject p = new JSObject(); p.put("done", got); p.put("total", total); notifyListeners("progress", p); }
            }
        } finally { out.close(); in.close(); c.disconnect(); }
        JSObject p = new JSObject(); p.put("done", got); p.put("total", total); notifyListeners("progress", p);
        return true;
    }

    private static String sha256(File f) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        FileInputStream in = new FileInputStream(f);
        byte[] b = new byte[64 * 1024]; int n;
        try { while ((n = in.read(b)) > 0) md.update(b, 0, n); } finally { in.close(); }
        StringBuilder sb = new StringBuilder();
        for (byte x : md.digest()) sb.append(String.format("%02x", x));
        return sb.toString();
    }

    @PluginMethod
    public void install(PluginCall call) {
        try {
            File f = new File(call.getString("path", ""));
            if (!f.exists() || !f.getCanonicalPath().startsWith(dir().getCanonicalPath())) { call.reject("Update file not found"); return; }
            if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
                JSObject r = new JSObject(); r.put("needPermission", true); call.resolve(r); return;
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".tmnupdate", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            JSObject r = new JSObject(); r.put("started", true); call.resolve(r);
        } catch (Exception e) { call.reject("Couldn't open the installer: " + e.getMessage()); }
    }
}
