"""TigoMeNote · apk/update-version.py — isinusulat ang bagong APK sa app-version.json (Get app page at auto-update)
   python3 apk/update-version.py <app> <version> <apk file> <repo>   (sa GitHub Actions)"""
import datetime, hashlib, json, os, sys
app, ver, f, repo = sys.argv[1:5]
p = "app-version.json"
site = open("CNAME").read().strip() if os.path.exists("CNAME") else "tigomenote.com"   # domain ng site
d = json.load(open(p)) if os.path.exists(p) else {}
cfg = json.load(open(f"apk/{app}/capacitor.config.json"))
a, b, c = (int(x) for x in ver.split("."))
d[app] = {"name": cfg["appName"], "id": cfg["appId"], "version": ver, "code": a * 1000000 + b * 1000 + c,
          # sariling site (Deploy site workflow ang naglalagay sa dl/); ?v= para hindi lumang cache
          "url": f"https://{site}/dl/{os.path.basename(f)}?v={ver}",
          "github": f"https://github.com/{repo}/releases/download/{app}-v{ver}/{os.path.basename(f)}",
          "size": os.path.getsize(f), "sha256": hashlib.sha256(open(f, "rb").read()).hexdigest(),
          "date": datetime.date.today().isoformat()}
with open(p, "w") as o:
    json.dump(d, o, indent=2); o.write("\n")
print("app-version.json:", app, ver)
