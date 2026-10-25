"""TigoMeNote · tools/make-qr.py — QR code (SVG) para sa Get app page, walang library sa browser
   python3 tools/make-qr.py [url]   (default: https://tigomenote.com/get/)  → assets/img/qr-get.svg
   Gawa ng OpenCV (QRCodeEncoder) at chine-check ng QRCodeDetector bago i-save."""
import sys, os, cv2, numpy as np
url = sys.argv[1] if len(sys.argv) > 1 else "https://tigomenote.com/get/"
p = cv2.QRCodeEncoder_Params(); p.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_M
m = cv2.QRCodeEncoder.create(p).encode(url)            # 0 = itim, 255 = puti (may 4-module na quiet zone na)
dark = (m == 0)
img = cv2.resize(np.where(dark, 0, 255).astype(np.uint8), None, fx=8, fy=8, interpolation=cv2.INTER_NEAREST)
got, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
assert got == url, f"QR check failed: {got!r}"
n = dark.shape[0]
path = "".join(f"M{x} {y}h1v1h-1z" for y in range(n) for x in range(n) if dark[y, x])
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
       f'<rect width="{n}" height="{n}" fill="#fff"/><path d="{path}" fill="#141418"/></svg>')
out = os.path.join(os.path.dirname(__file__), "..", "assets/img/qr-get.svg")
open(out, "w").write(svg)
print("QR ok:", url, n, "modules")
