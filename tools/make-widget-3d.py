"""TigoMeNote · tools/make-widget-3d.py — 3D na si Tigo para sa widgets at music notification
   python3 tools/make-widget-3d.py [--sheet out.png]
   Binubuksan ang tools/widget3d/index.html sa headless Chromium (Playwright), kinukuha ang bawat frame (256 px, transparent)
   at isinusulat sa apk/native/res/drawable-nodpi/:
     tmn_tigo_<idle|blink|look|wave|excited|music1-3|rest>.png   (Music widget, notification)
     tmn_wx_<sun|night|cloud|cold|rain|storm><n>.png             (Messages widget: si Tigo ayon sa panahon)
   Kailangan: playwright (python) + Pillow."""
import base64, functools, http.server, io, os, sys, threading
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "apk/native/res/drawable-nodpi")

def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    h.log_message = lambda *a: None
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s

def main():
    s = serve(); url = "http://127.0.0.1:%d/tools/widget3d/index.html" % s.server_address[1]
    imgs = {}
    with sync_playwright() as pw:
        br = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        p = br.new_page(viewport={"width": 300, "height": 300})
        errs = []; p.on("pageerror", lambda e: errs.append(str(e)))
        p.goto(url); p.wait_for_function("window.READY === true", timeout=30000)
        for name in p.evaluate("FRAME_NAMES"):
            data = p.evaluate("n => renderFrame(n)", name)
            im = Image.open(io.BytesIO(base64.b64decode(data.split(",", 1)[1]))).convert("RGBA")
            imgs[name] = im
        br.close()
    if errs: sys.exit("render errors: " + "; ".join(errs))
    for name, im in imgs.items():
        fn = ("tmn_" + name if name.startswith("wx_") else "tmn_tigo_" + name) + ".png"
        im.quantize(colors=255, method=Image.Quantize.FASTOCTREE).save(os.path.join(OUT, fn), optimize=True)
    if "--sheet" in sys.argv:
        out = sys.argv[sys.argv.index("--sheet") + 1]
        cols = 7; rows = (len(imgs) + cols - 1) // cols
        sh = Image.new("RGBA", (cols * 256, rows * 256), (40, 60, 90, 255))
        for i, im in enumerate(imgs.values()): sh.alpha_composite(im, ((i % cols) * 256, (i // cols) * 256))
        sh.save(out)
    print("%d frames → %s" % (len(imgs), OUT))

if __name__ == "__main__":
    main()
