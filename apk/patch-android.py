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

import android.content.Intent;
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
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        final WebView wv = getBridge().getWebView();
        WebSettings s = wv.getSettings();
        s.setTextZoom(100);              // hindi sumusunod sa font size / zoom ng phone
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
    }}

    // Ibang TigoMeNote app: naka-install ba? buksan · at link na bubuksan sa Chrome (hal. download page)
    public class Apps {{
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

    // window.TMNNative.setBars("#ffffff", false) — kulay sa likod ng status/navigation bar + kulay ng icons (app-mode.js)
    public class Bars {{
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
PERMS = ["CAMERA", "RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "POST_NOTIFICATIONS", "VIBRATE"]
add = "".join(f'    <uses-permission android:name="android.permission.{p}" />\n' for p in PERMS if f"android.permission.{p}\"" not in s)
add += '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.location.gps" android:required="false" />\n'
# para makita ng app kung naka-install ang ibang TigoMeNote app (Android 11+)
add += '    <queries>\n' + "".join(f'        <package android:name="{p}" />\n' for p in ("com.tigomenote.app", "com.tigomenote.chat", "com.tigomenote.tigo")) + '    </queries>\n'
if "<queries>" not in s: s = s.replace("</manifest>", add + "</manifest>", 1)
if app == "tigo" and "screenOrientation" not in s:
    s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"', 1)
open(m, "w").write(s)
print(f"patched {pkg} v{ver} ({code})")
