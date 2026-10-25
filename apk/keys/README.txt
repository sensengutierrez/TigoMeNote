Walang signing key file dito (bawal ang *.p12 sa repo).
Ang key ay ginagawa ng apk/derive-key.py mula sa GitHub secret na APK_KEYSTORE_PASSWORD tuwing build.
cert-sha256.txt = SHA-256 ng certificate (public, hindi secret). Kapag iba ang lumabas, hihinto ang build.
Huwag kalimutan o palitan ang password: kapag nagbago, hindi na ma-update ang naka-install na app (kailangang i-uninstall muna).
