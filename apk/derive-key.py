"""TigoMeNote · apk/derive-key.py — signing key ng APK na GINAGAWA mula sa password (walang key file na sine-save kahit saan)
   PW=<secret> python3 apk/derive-key.py OUT.p12      (sa GitHub Actions lang; PW = secret APK_KEYSTORE_PASSWORD)
   - Parehong password → parehong RSA key at parehong certificate tuwing build → laging puwedeng i-update ang naka-install na app.
   - Ang .p12 ay sa temp folder ng build lang (bawal sa repo: *.p12 sa .gitignore).
   - Ini-print ang SHA-256 ng certificate (public, hindi secret) para ma-check ng workflow na hindi nagbago ang key.
   Huwag baguhin ang SALT, BITS, pangalan, petsa o serial: magbabago ang key at hindi na ma-update ang app."""
import hashlib, hmac, os, sys, datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12

SALT = b"tigomenote-apk-signing-v1"
BITS = 3072

class Stream:
    """Deterministic na random (HMAC-SHA256 counter mode) mula sa seed."""
    def __init__(self, seed): self.seed, self.n, self.buf = seed, 0, b""
    def bytes(self, k):
        while len(self.buf) < k:
            self.n += 1
            self.buf += hmac.new(self.seed, self.n.to_bytes(8, "big"), hashlib.sha256).digest()
        out, self.buf = self.buf[:k], self.buf[k:]
        return out
    def int(self, bits): return int.from_bytes(self.bytes((bits + 7) // 8), "big") >> ((8 - bits % 8) % 8)

SMALL = [p for p in range(3, 2000, 2) if all(p % q for q in range(3, int(p ** 0.5) + 1, 2))]
def probable_prime(n, rnd, rounds=48):
    if any(n % p == 0 for p in SMALL): return n in SMALL
    d, r = n - 1, 0
    while d % 2 == 0: d //= 2; r += 1
    for _ in range(rounds):
        a = 2 + rnd.int(n.bit_length() - 1) % (n - 3)
        x = pow(a, d, n)
        if x in (1, n - 1): continue
        for _ in range(r - 1):
            x = pow(x, 2, n)
            if x == n - 1: break
        else: return False
    return True

def prime(bits, rnd, e):
    while True:
        c = rnd.int(bits) | (3 << (bits - 2)) | 1      # 2 pinakamataas na bit = 1 → eksaktong haba ng n
        if probable_prime(c, rnd) and (c - 1) % e: return c

def main():
    pw = os.environ.get("PW", "")
    if len(pw) < 20: sys.exit("PW (APK_KEYSTORE_PASSWORD) dapat 20+ characters")
    rnd = Stream(hashlib.pbkdf2_hmac("sha256", pw.encode(), SALT, 600_000, 64))
    e = 65537
    p = prime(BITS // 2, rnd, e)
    q = prime(BITS // 2, rnd, e)
    while q == p: q = prime(BITS // 2, rnd, e)
    if p < q: p, q = q, p
    d = pow(e, -1, (p - 1) * (q - 1))
    key = rsa.RSAPrivateNumbers(p, q, d, d % (p - 1), d % (q - 1), pow(q, -1, p), rsa.RSAPublicNumbers(e, p * q)).private_key()
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "TigoMeNote"), x509.NameAttribute(NameOID.ORGANIZATION_NAME, "TigoMeNote"),
                      x509.NameAttribute(NameOID.COUNTRY_NAME, "BH")])
    serial = int.from_bytes(hashlib.sha256(b"serial" + rnd.seed).digest()[:16], "big") >> 1
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key()).serial_number(serial)
            .not_valid_before(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc))
            .not_valid_after(datetime.datetime(2125, 12, 31, tzinfo=datetime.timezone.utc))
            .sign(key, hashes.SHA256()))                 # RSA PKCS#1 v1.5 = laging parehong signature
    der = cert.public_bytes(serialization.Encoding.DER)
    out = sys.argv[1] if len(sys.argv) > 1 else "release.p12"
    open(out, "wb").write(pkcs12.serialize_key_and_certificates(b"tigomenote", key, cert, None, serialization.BestAvailableEncryption(pw.encode())))
    print(hashlib.sha256(der).hexdigest())

if __name__ == "__main__":
    main()
