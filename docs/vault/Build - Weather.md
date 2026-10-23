---
tags: [build]
updated: 2026-10-23
---
# Build - Weather (Daily)

**What it does:** Weather card sa Daily na **kusang nakaka-detect ng lokasyon**: Bahrain kung nasa Bahrain, Pilipinas kung nasa Pinas. Ngayon + 5 araw na forecast.

**Files:** `assets/js/components/weather.js`, `app/home.html` (`#weather`), `assets/js/pages/daily.js`, `assets/css/pages/daily.css`
**Server:** wala. Diretso ang browser sa libreng APIs (walang API key):
| Ano | API |
|---|---|
| Forecast | Open-Meteo `api.open-meteo.com/v1/forecast` |
| Pangalan ng lugar (mula GPS) | BigDataCloud `reverse-geocode-client` |
| Location kapag walang GPS | `ipapi.co/json` → fallback `get.geojs.io` |

## Daloy
1. Kung pinayagan ang location: **GPS ng device** (eksakto).
2. Kung hindi pinayagan / walang GPS: **approximate mula sa IP** (city level). May "Gamitin ang GPS" link.
3. Forecast: temperature °C, feels like, humidity, wind km/h, chance of rain, 5 araw.
4. **Cache 30 minuto** (`localStorage` `tmnWeather`). Kapag lumipat ng lugar (>25 km), kukuha ulit.
5. Desktop: nasa side panel (itaas). Phone: nasa itaas ng feed.

Kasama rin: ang "Today" card sa Daily ay bumibilang na ng **photos at videos ngayong araw** mula sa Gallery.

## Known limits / hindi pa na-test
- Hindi pa na-test ang totoong APIs mula sa sandbox (naka-mock sa test).
- Kapag VPN, ang IP location ay maaaring ibang bansa.
- Ang ipapi.co ay may limit (~1,000/araw bawat IP), kaya may cache at fallback.

Tingnan din: [[Build - Gallery and albums]], [[System map]]
