"""TigoMeNote · apk/add-firebase.py — push notifications (Firebase Cloud Messaging) para sa APK
   GOOGLE_SERVICES_JSON="<secret>" python3 apk/add-firebase.py main
   - Isinusulat ang google-services.json (galing sa GitHub secret GOOGLE_SERVICES_JSON) sa android/app/
     kung may "client" ito para sa package ng app na ito (com.tigomenote.app / .chat). Wala → walang push, tuloy ang build.
   - Default na icon at kulay ng notification (ic_stat_tigo) sa AndroidManifest.
   Hindi kailanman ipinapakita ang laman ng secret sa log."""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = sys.argv[1] if len(sys.argv) > 1 else "main"
AND = os.path.join(ROOT, "apk", app, "android")
pkg = json.load(open(os.path.join(ROOT, "apk", app, "capacitor.config.json")))["appId"]
res = os.path.join(AND, "app/src/main/res")
COLOR = {"chat": "#2f8dff"}.get(app, "#ff6b4a")

raw = os.environ.get("GOOGLE_SERVICES_JSON", "").strip()
if not raw:
    print("::warning::Walang GOOGLE_SERVICES_JSON secret → walang push sa app na ito"); sys.exit(0)
try:
    data = json.loads(raw)
except Exception:
    sys.exit("::error::GOOGLE_SERVICES_JSON ay hindi tamang JSON (kopyahin ang buong laman ng google-services.json)")
pkgs = [c.get("client_info", {}).get("android_client_info", {}).get("package_name") for c in data.get("client", [])]
if pkg not in pkgs:
    print(f"::warning::Walang {pkg} sa google-services.json → walang push sa app na ito (idagdag ang Android app sa Firebase)"); sys.exit(0)

root_gradle = open(os.path.join(AND, "build.gradle")).read()
if "google-services" not in root_gradle:
    sys.exit("::error::build.gradle: walang com.google.gms:google-services (nagbago ang Capacitor template)")
open(os.path.join(AND, "app", "google-services.json"), "w").write(raw)

os.makedirs(os.path.join(res, "values"), exist_ok=True)
open(os.path.join(res, "values", "tmn_colors.xml"), "w").write(
    f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="tmn_notify">{COLOR}</color>\n</resources>\n')
m = os.path.join(AND, "app/src/main/AndroidManifest.xml"); s = open(m).read()
if "default_notification_icon" not in s:
    s = s.replace("</application>", '''    <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_tigo" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/tmn_notify" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="social" />
    </application>''', 1)
    open(m, "w").write(s)
print(f"firebase ok: {pkg}")
