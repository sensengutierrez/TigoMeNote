"""TigoMeNote · apk/patch-android.py — inaayos ang android project na ginawa ng `npx cap add android`
   python3 apk/patch-android.py main
   - Icons, splash at notification icon mula sa apk/res/<app>/ (gawa ng tools/make-icons.py)
   - MainActivity: textZoom 100 at walang zoom → hindi lumiliit/lumalaki ang app kahit iba ang font size ng phone
   - versionName = version sa config.js; versionCode = 0.11.18 → 1118 (laging tumataas)
   - configChanges + density (hindi nagre-reload ang app kapag nag-ikot o nagbago ang laki)
   - tigo: laging landscape"""
import os, re, shutil, sys, glob
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = sys.argv[1] if len(sys.argv) > 1 else "main"
AND = os.path.join(ROOT, "apk", app, "android")
cfg = __import__("json").load(open(os.path.join(ROOT, "apk", app, "capacitor.config.json")))
pkg = cfg["appId"]
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

# 2) MainActivity
java = os.path.join(AND, "app/src/main/java", *pkg.split("."), "MainActivity.java")
open(java, "w").write(f'''package {pkg};

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {{
    @Override
    public void onCreate(Bundle savedInstanceState) {{
        super.onCreate(savedInstanceState);
        WebSettings s = getBridge().getWebView().getSettings();
        s.setTextZoom(100);              // hindi sumusunod sa font size / zoom ng phone
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        getBridge().getWebView().setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
    }}
}}
''')

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
if app == "tigo" and "screenOrientation" not in s:
    s = s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"', 1)
open(m, "w").write(s)
print(f"patched {pkg} v{ver} ({code})")
