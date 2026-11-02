"""TigoMeNote · apk/patch-android.py — inaayos ang android project na ginawa ng `npx cap add android`
   python3 apk/patch-android.py main
   - Icons, splash at notification icon mula sa apk/res/<app>/ (gawa ng tools/make-icons.py)
   - MainActivity: textZoom 100 at walang zoom; hindi natatakpan ng status/navigation bar; window.TMNNative.setBars()
   - Splash ng Android 12+: kulay ng app + icon (apk/<app>/app.json "splash")
   - versionName = version sa config.js; versionCode = 0.11.18 → 1118 (laging tumataas)
   - configChanges + density (hindi nagre-reload ang app kapag nag-ikot o nagbago ang laki)
   - tigo: laging landscape"""
import json, os, re, shutil, sys, glob
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = sys.argv[1] if len(sys.argv) > 1 else "main"
AND = os.path.join(ROOT, "apk", app, "android")
cfg = json.load(open(os.path.join(ROOT, "apk", app, "capacitor.config.json")))
pkg = cfg["appId"]
meta = json.load(open(os.path.join(ROOT, "apk", app, "app.json")))   # id, home, splash, bar
bar_bg = meta.get("bar", "#ffffff")
res = os.path.join(AND, "app/src/main/res")

# 1) icons + splash: alisin ang default ng Capacitor, ilagay ang atin
for d in glob.glob(os.path.join(res, "mipmap-*")) + glob.glob(os.path.join(res, "drawable*")):
    for f in glob.glob(os.path.join(d, "ic_launcher*")) + glob.glob(os.path.join(d, "splash.png")):
        os.remove(f)
src = os.path.join(ROOT, "apk/res", app)
for d in os.listdir(src):
    if not os.path.isdir(os.path.join(src, d)): continue
    os.makedirs(os.path.join(res, d), exist_ok=True)
    for f in os.listdir(os.path.join(src, d)):
        shutil.copy(os.path.join(src, d, f), os.path.join(res, d, f))

# 2) MainActivity: textZoom, walang zoom, hindi natatakpan ng status/navigation bar, at kulay ng bars mula sa web
java = os.path.join(AND, "app/src/main/java", *pkg.split("."), "MainActivity.java")
open(java, "w").write(f'''package {pkg};

import android.app.ActivityManager;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringWriter;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import java.io.File;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.webkit.RenderProcessGoneDetail;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {{
    private static long lastGone = 0; private static int goneCount = 0;
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        // Crash report: isinusulat ang dahilan sa tmn-crash.txt; ipinapadala ng app-mode.js sa susunod na bukas (crash-fast)
        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, e) -> {{
            StringWriter sw = new StringWriter(); e.printStackTrace(new PrintWriter(sw));
            saveCrash("crash", "thread=" + t.getName() + "\\n" + sw);
            if (prev != null) prev.uncaughtException(t, e);
        }});
        registerPlugin(TmnNative.class);   // Gallery ng phone + music player (apk/native/*.java)
        super.onCreate(savedInstanceState);
        final WebView wv = getBridge().getWebView();
        WebSettings s = wv.getSettings();
        s.setTextZoom(100);              // hindi sumusunod sa font size / zoom ng phone (ang app mismo ang may Text size: TMNNative.setTextZoom)
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        wv.setOverScrollMode(View.OVER_SCROLL_NEVER);
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("{bar_bg}"));
        // Ang laman ay nasa pagitan ng status bar at navigation bar (Android 15 edge-to-edge) — at umaakyat kapag may keyboard
        ViewCompat.setOnApplyWindowInsetsListener(wv, (v, insets) -> {{
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            lp.setMargins(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
            v.setLayoutParams(lp);
            return WindowInsetsCompat.CONSUMED;
        }});
        ViewCompat.requestApplyInsets(wv);
        wv.addJavascriptInterface(new Bars(), "TMNNative");
        wv.addJavascriptInterface(new Apps(), "TMNApps");
        wv.addJavascriptInterface(new Crash(), "TMNCrash");
        wv.addJavascriptInterface(new Widget(), "TMNWidget");
        openFromIntent(getIntent());
        // Kapag namatay ang WebView (kulang sa memory, hal. 3D game): huwag i-force close ang app — buksan ulit ang screen (hanggang 3 beses kada minuto)
        getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {{
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {{
                long now = System.currentTimeMillis();
                if (now - lastGone > 60000) goneCount = 0;
                lastGone = now; goneCount++;
                saveCrash("webview", (Build.VERSION.SDK_INT >= 26 ? "didCrash=" + detail.didCrash() + " priority=" + detail.rendererPriorityAtExit() : "") + " count=" + goneCount + " url=" + view.getUrl());
                if (goneCount <= 3) runOnUiThread(() -> recreate()); else runOnUiThread(() -> finish());
                return true;
            }}
        }});
    }}

    // Ibang TigoMeNote app: naka-install ba? buksan · at link na bubuksan sa Chrome (hal. download page)
    public class Apps {{
        // may Firebase ba ang app na ito (google-services.json)? Kung wala, bawal ang push register (nagka-crash ang Tigo app)
        @JavascriptInterface
        public boolean hasFirebase() {{
            return getResources().getIdentifier("google_app_id", "string", getPackageName()) != 0;
        }}
        @JavascriptInterface
        public boolean hasApp(String pkg) {{
            try {{ getPackageManager().getPackageInfo(pkg, 0); return true; }} catch (Exception e) {{ return false; }}
        }}
        @JavascriptInterface
        public boolean openApp(String pkg) {{
            Intent i = getPackageManager().getLaunchIntentForPackage(pkg);
            if (i == null) return false;
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i); return true;
        }}
        @JavascriptInterface
        public void openUrl(String url) {{
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url)); i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {{ startActivity(i); }} catch (Exception e) {{ }}
        }}
    }}


    private void saveCrash(String kind, String body) {{
        try {{
            File f = new File(getFilesDir(), "tmn-crash.txt");
            if (f.length() > 20000) return;
            ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo(); if (am != null) am.getMemoryInfo(mi);
            String head = "kind=" + kind + "\\ntime=" + System.currentTimeMillis() + "\\ndevice=" + Build.MANUFACTURER + " " + Build.MODEL
                + "\\nandroid=" + Build.VERSION.RELEASE + " (sdk " + Build.VERSION.SDK_INT + ")"
                + "\\nmemClass=" + (am != null ? am.getMemoryClass() : -1) + "MB availMem=" + (mi.availMem / 1048576) + "MB lowMemory=" + mi.lowMemory + "\\n";
            FileWriter w = new FileWriter(f, true);
            w.write(head + (body.length() > 6000 ? body.substring(0, 6000) : body) + "\\n---\\n"); w.close();
        }} catch (Throwable x) {{ }}
    }}
    // Galing sa widget (o notification): extra "tmn_url" = page sa loob ng app (hal. app/messages.html?c=<id>)
    @Override
    protected void onNewIntent(Intent intent) {{ super.onNewIntent(intent); openFromIntent(intent); }}
    private void openFromIntent(Intent i) {{
        if (i == null) return;
        String u = i.getStringExtra("tmn_url");
        if (u == null || u.isEmpty() || u.contains(":") || u.contains("..")) return;
        i.removeExtra("tmn_url");
        final String full = getBridge().getLocalUrl() + "/" + u.replaceFirst("^/+", "");
        final WebView w = getBridge().getWebView();
        w.postDelayed(() -> w.loadUrl(full), 400);
    }}
    // window.TMNWidget.setAuth(token, inboxUrl) · refresh() — para sa Messages widget (Chat app)
    public class Widget {{
        @JavascriptInterface
        public void setAuth(String token, String url) {{
            getSharedPreferences("tmn_widget", MODE_PRIVATE).edit().putString("token", token == null ? "" : token).putString("url", url == null ? "" : url).apply();
        }}
        @JavascriptInterface
        public void refresh() {{
            try {{ sendBroadcast(new Intent(MainActivity.this, MessagesWidget.class).setAction(MessagesWidget.ACTION_REFRESH)); }} catch (Exception e) {{ }}
        }}
        // Settings → Appearance → Home screen widgets: background 0–100% (0 = see-through); ina-update agad ang lahat ng widget
        @JavascriptInterface
        public int look() {{ return getSharedPreferences("tmn_widget", MODE_PRIVATE).getInt("bg", 100); }}
        @JavascriptInterface
        public void setLook(int pct) {{
            getSharedPreferences("tmn_widget", MODE_PRIVATE).edit().putInt("bg", Math.max(0, Math.min(100, pct))).apply();
            try {{ MessagesWidget.render(getApplicationContext()); }} catch (Exception e) {{ }}
            try {{
                int[] mw = android.appwidget.AppWidgetManager.getInstance(MainActivity.this).getAppWidgetIds(new android.content.ComponentName(MainActivity.this, MusicWidget.class));
                if (mw != null && mw.length > 0) MusicEngine.get(getApplicationContext()).updateWidgets();
            }} catch (Exception e) {{ }}
        }}
    }}
    // window.TMNCrash.take() → huling crash report (text) at binubura; "" kung wala
    public class Crash {{
        @JavascriptInterface
        public String take() {{
            File f = new File(getFilesDir(), "tmn-crash.txt");
            if (!f.exists()) return "";
            try {{
                FileInputStream in = new FileInputStream(f); ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] b = new byte[4096]; int n; while ((n = in.read(b)) > 0) out.write(b, 0, n); in.close();
                f.delete(); return out.toString("UTF-8");
            }} catch (Exception e) {{ f.delete(); return ""; }}
        }}
    }}

    // window.TMNNative.setBars("#ffffff", false) — kulay sa likod ng status/navigation bar + kulay ng icons (app-mode.js)
    public class Bars {{
        // Settings → Appearance → Text size (ui-prefs.js): text lang ang lumalaki (Android textZoom), 80–140%
        @JavascriptInterface
        public void setTextZoom(final int pct) {{
            final int z = Math.max(80, Math.min(140, pct));
            runOnUiThread(() -> {{ WebSettings s = getBridge().getWebView().getSettings(); if (s.getTextZoom() != z) s.setTextZoom(z); }});
        }}
        // Tigo app: buong screen (nakatago ang status at navigation bar; swipe mula sa gilid para lumabas sandali)
        @JavascriptInterface
        public void setImmersive(final boolean on) {{
            runOnUiThread(() -> {{
                WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                if (on) {{
                    c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    c.hide(WindowInsetsCompat.Type.systemBars());
                }} else c.show(WindowInsetsCompat.Type.systemBars());
            }});
        }}
        // ✕ Exit (Tigo app): isara ang app
        @JavascriptInterface
        public void exitApp() {{ runOnUiThread(() -> finishAndRemoveTask()); }}
        @JavascriptInterface
        public void setBars(final String color, final boolean dark) {{
            runOnUiThread(() -> {{
                try {{ getWindow().getDecorView().setBackgroundColor(Color.parseColor(color)); }} catch (Exception e) {{ }}
                WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                c.setAppearanceLightStatusBars(!dark);
                c.setAppearanceLightNavigationBars(!dark);
            }});
        }}
    }}
}}
''')

# 2a) Native: music player (service, notification, lock screen, widget) at Gallery ng phone — apk/native/
jdir = os.path.dirname(java)
for f in ("MusicEngine.java", "MusicService.java", "MusicWidget.java", "MessagesWidget.java", "UploadKeepService.java", "TmnNative.java"):
    open(os.path.join(jdir, f), "w").write(open(os.path.join(ROOT, "apk/native", f)).read().replace("__PKG__", pkg))
nres = os.path.join(ROOT, "apk/native/res")
for d in os.listdir(nres):
    os.makedirs(os.path.join(res, d), exist_ok=True)
    for f in os.listdir(os.path.join(nres, d)): shutil.copy(os.path.join(nres, d, f), os.path.join(res, d, f))
os.makedirs(os.path.join(res, "values"), exist_ok=True)
open(os.path.join(res, "values", "tmn_widget.xml"), "w").write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="tmn_widget_desc">Music player: previous, play/pause, next</string>\n    <string name="tmn_widget_msgs_desc">Clock, weather with Tigo, and your newest message</string>\n</resources>\n')
gr = os.path.join(AND, "app/build.gradle"); g0 = open(gr).read()
if "androidx.media:media" not in g0:
    g0 = g0.replace("dependencies {", 'dependencies {\n    implementation "androidx.media:media:1.7.0"', 1)
    open(gr, "w").write(g0)

# 2b) Splash (Android 12+): solid na kulay ng app + icon, walang kulay-abong background
splash_bg = meta.get("splash", "#141418")
vals = os.path.join(res, "values"); os.makedirs(vals, exist_ok=True)
open(os.path.join(vals, "tmn_colors.xml"), "w").write(f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="tmn_splash_bg">{splash_bg}</color>\n</resources>\n')
sty = os.path.join(vals, "styles.xml"); t = open(sty).read()
new_launch = ('<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">\n'
              '        <item name="windowSplashScreenBackground">@color/tmn_splash_bg</item>\n'
              '        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>\n'
              '        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>\n'
              '        <item name="android:background">@color/tmn_splash_bg</item>\n'
              '    </style>')
t2, n = re.subn(r'<style name="AppTheme\.NoActionBarLaunch"[^>]*>.*?</style>', new_launch, t, flags=re.S)
if not n: sys.exit("styles.xml: walang AppTheme.NoActionBarLaunch (nagbago ang Capacitor template)")
open(sty, "w").write(t2)

# 3) version
ver = re.search(r'version:\s*"([^"]+)"', open(os.path.join(ROOT, "assets/js/config.js")).read()).group(1)
a, b, c = (int(x) for x in ver.split("."))
code = a * 1000000 + b * 1000 + c
g = os.path.join(AND, "app/build.gradle"); s = open(g).read()
s = re.sub(r"versionCode\s+\d+", f"versionCode {code}", s)
s = re.sub(r'versionName\s+"[^"]*"', f'versionName "{ver}"', s)
open(g, "w").write(s)

# 4) manifest
m = os.path.join(AND, "app/src/main/AndroidManifest.xml"); s = open(m).read()
s = re.sub(r'android:configChanges="([^"]*)"', lambda k: 'android:configChanges="' + (k.group(1) if "density" in k.group(1) else k.group(1) + "|density") + '"', s, count=1)
# permissions: camera (litrato/video, video call), mic (voice, video), location (Safety, weather, Explore), notifications, vibrate
# Bawat app: kung ano lang ang kailangan (Play: bawal humingi ng hindi ginagamit)
PLAY = os.environ.get("TMN_PLAY") == "1"     # bersyon para sa Google Play (walang sariling download ng update)
BASE = ["POST_NOTIFICATIONS", "VIBRATE", "WAKE_LOCK"]
PERMS = {
    # TigoMeNote: camera/video, lokasyon (Safety, weather, Explore), gallery ng phone, music player, upload sa background
    "main": BASE + ["CAMERA", "RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "FOREGROUND_SERVICE",
                    "FOREGROUND_SERVICE_MEDIA_PLAYBACK", "FOREGROUND_SERVICE_DATA_SYNC", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_MEDIA_AUDIO", "READ_EXTERNAL_STORAGE"],
    # Chat: photo/camera, ibahagi ang lokasyon, gallery ng phone, upload sa background (walang music: nasa TigoMeNote)
    "chat": BASE + ["CAMERA", "RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "FOREGROUND_SERVICE",
                    "FOREGROUND_SERVICE_DATA_SYNC", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_EXTERNAL_STORAGE"],
    # Tigo: laro lang (walang camera, mic, lokasyon, gallery, push)
    "tigo": ["VIBRATE"],
}[app]
# Mga permission na inaalis kahit idagdag ng plugin (hal. push-notifications)
DROP = [p for p in ["POST_NOTIFICATIONS", "CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO",
        "READ_MEDIA_AUDIO", "READ_EXTERNAL_STORAGE", "FOREGROUND_SERVICE_MEDIA_PLAYBACK", "FOREGROUND_SERVICE_DATA_SYNC", "REQUEST_INSTALL_PACKAGES"] if p not in PERMS]
add = "".join(f'    <uses-permission android:name="android.permission.{p}"' + (' android:maxSdkVersion="32"' if p == "READ_EXTERNAL_STORAGE" else "") + ' />\n' for p in PERMS if f"android.permission.{p}\"" not in s)
add += "".join(f'    <uses-permission android:name="android.permission.{p}" tools:node="remove" />\n' for p in DROP)
if "xmlns:tools" not in s: s = s.replace("<manifest ", '<manifest xmlns:tools="http://schemas.android.com/tools" ', 1)
add += '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.location.gps" android:required="false" />\n'
# para makita ng app kung naka-install ang ibang TigoMeNote app (Android 11+)
add += '    <queries>\n' + "".join(f'        <package android:name="{p}" />\n' for p in ("com.tigomenote.app", "com.tigomenote.chat", "com.tigomenote.tigo")) + '    </queries>\n'
if "<queries>" not in s: s = s.replace("</manifest>", add + "</manifest>", 1)
# Pag-uninstall: "Keep app data" ng Android (10+, kung sinusuportahan ng phone). Ang mga litrato at backup ay nasa phone storage na rin.
if "hasFragileUserData" not in s: s = s.replace("<application", '<application android:hasFragileUserData="true"', 1)
# FileProvider para sa update.apk (sariling authority: <pkg>.tmnupdate)
if app == "main" and "MusicService" not in s:   # music player: TigoMeNote lang
    s = s.replace("</application>", '''    <service android:name=".MusicService" android:exported="false" android:foregroundServiceType="mediaPlayback" />
    </application>''', 1)
if app in ("main", "chat") and "UploadKeepService" not in s:   # pag-upload ng post sa background
    s = s.replace("</application>", '''    <service android:name=".UploadKeepService" android:exported="false" android:foregroundServiceType="dataSync" />
    </application>''', 1)
# Messages widget: sa TigoMeNote Chat lang (MessagesWidget.java — totoong messages galing sa server)
if app == "chat" and ".MessagesWidget" not in s:
    s = s.replace("</application>", '''    <receiver android:name=".MessagesWidget" android:exported="false" android:label="TigoMeNote messages">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/tmn_widget_msgs_info" />
        </receiver>
    </application>''', 1)
# Music widget: sa TigoMeNote (main) lang — iisang music player; ang Chat ay para sa messages
if app == "main" and ".MusicWidget" not in s:
    s = s.replace("</application>", '''    <receiver android:name=".MusicWidget" android:exported="false" android:label="TigoMeNote music">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/tmn_widget_music_info" />
        </receiver>
    </application>''', 1)
# (Inalis 2026-11-02: in-app installer at FileProvider ng update.apk — Chrome download na lang; bawal sa Play)
if app == "tigo" and "screenOrientation" not in s:
    s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"', 1)
open(m, "w").write(s)
print(f"patched {pkg} v{ver} ({code})")
