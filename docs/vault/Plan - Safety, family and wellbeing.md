---
tags: [plan, safety, guidelines]
updated: 2026-10-24
---
# Plan - Safety, family and wellbeing

**Status:** GINAWA NA ang web version (2026-10-24): [[Build - Safety and wellbeing]]. Ang APK part ay naka-abang pa.
**Bakit mahalaga:** Ayon kay Bench, ang **safety ang pinaka-pundasyon ng app**. Ang note na ito rin ang magiging basehan ng **guidelines at instructions** na ipapakita sa APK (onboarding, Help, Play Store listing).

## Mga napagdesisyunan
| Ano | Desisyon |
|---|---|
| Location history | **30 araw**, tapos kusang nabubura |
| Friends sa Locate | Oo, **pinipili** kung sinong Friends ang "Can locate me" |
| Family vs Friends | Hiwalay na circle. Family = Locate + SOS. Friends = SOS, at Locate kung pinili |
| Pahintulot | Laging **invite + accept**. Walang naa-add o nalo-locate nang hindi pumapayag |
| Age limit | **13+** (ok kay Bench) |
| Parental | Oo, may parental supervision para sa Teen (13–17) |
| Sleep timer | Oo, auto sleep (hal. 10pm–6am) |
| Give a break | Oo, default **60 min** para sa adults (puwedeng palitan o i-off) |

## 1. Family / Friends circle (sa My Profile)
- Mag-invite → tanggapin ng tao → kasali na sa circle.
- Makikita sa map (OpenStreetMap, libre) ang **huling location** at "last seen".
- Bawat user: on/off ng sharing, **Pause sharing**, at puwedeng **burahin ang sariling history**.
- Location history: 30 araw lang, binubura araw-araw ng database cleanup.

## 2. SOS / Emergency
- **Pindutin nang matagal (3 s)** → **5 s countdown** na puwedeng i-cancel (iwas aksidente).
- Pag na-trigger: naka-save ang GPS, live na update habang bukas ang app, **push notification** sa buong circle.
- May **"I'm safe"** para tapusin ang alarm.
- May button na tumawag sa **999 (Bahrain)** / **911 (Philippines)**. Ang app ay **hindi kapalit** ng pulis o ambulansya.
- **Laging gumagana ang SOS**: kahit sleep time, kahit ubos na ang daily limit.

## 3. Age limit
- **Birthdate** sa Create account; hihingin din sa mga lumang account sa susunod na login.
- Mas bata sa minimum: hindi puwedeng gumawa ng account.
- **Teen (13–17):** private ang account by default, walang public location, followers lang ang puwedeng mag-message, kailangang naka-link sa magulang.
- Limit: hindi ma-verify ang totoong edad (puwedeng magsinungaling). Proteksyon ito, hindi kandado.

## 4. Parental supervision
- Iimbitahan ng magulang ang anak → **i-accept ng anak**.
- **Walang lihim na tracking:** laging may "Supervised by …" sa account ng anak.
- Kayang i-set ng magulang: sleep schedule, daily limit, location (Family), approval ng bagong followers.
- Hindi matatanggal ng teen ang link hanggang **18**; kusang natatapos sa 18.

## 5. Auto sleep timer
- Sa takdang oras, lalabas ang **Sleep time** screen.
- Gumagana pa rin: **SOS** at **Family Locate**.
- Adult: siya ang nagse-set. Teen: magulang ang nagse-set.

## 6. Give a break
- Binibilang ang oras na bukas ang app **sa server** (kasama ang ibang phone/browser).
- Adult: paalala lang ("Break muna?"), puwedeng i-snooze.
- Teen: daily limit mula sa magulang; pag ubos, sarado ang app maliban sa SOS, Family, at tawag sa magulang.
- Limit: oras sa loob ng TigoMeNote lang ang nabibilang, hindi ang buong phone.

## Web vs APK (bakit kailangan ang APK)
| Feature | Web (ngayon) | APK |
|---|---|---|
| SOS push | Notification lang (sumusunod sa silent/DND). Sa iPhone, kailangang naka-"Add to Home Screen" | **Malakas na alarm** kahit silent |
| Location | Habang bukas lang ang app ("last seen") | **Background location** |
| Walang internet | Hindi kaya | SMS na may location link (galing sa load ng user, libre sa server) |
| Usage limit | Sa loob ng app lang | Sa loob ng app lang din |

## Guidelines para sa APK (ipapakita sa users)
Ilalagay sa onboarding, Settings → Help, at Play Store listing:
1. **Bakit kailangan ang location:** para sa Family Locate at SOS lang. Hindi ibinebenta, hindi pang-ads.
2. **Background location:** Google Play ay nangangailangan ng malinaw na paliwanag (prominent disclosure) bago humingi nito. Ipaliwanag: "Para makita ka ng Family mo at gumana ang SOS kahit sarado ang app."
3. **Notifications at alarm:** hingin ang permission para tumunog ang SOS kahit naka-silent.
4. **Kontrol mo ang data mo:** Pause sharing, burahin ang history, umalis sa circle anumang oras. History = 30 araw lang.
5. **Pahintulot:** walang nalo-locate nang hindi pumapayag. Laging nakikita kung sino ang may access.
6. **Para sa Teen at magulang:** paano gumagana ang supervision, at na nakikita ito ng anak.
7. **Emergency:** ang SOS ay tumutulong sa Family/Friends; sa totoong emergency, tumawag sa 999 / 911.
8. **Sleep at break:** paano i-set, at na hindi nito naba-block ang SOS.
9. **Data Safety form (Play Store):** location, birthdate, at usage time ay kailangang ideklara.
10. **Policies:** ang Terms, Privacy Policy at Community Guidelines ay nasa `legal/` ([[Build - Moderation and policies]]). Ang Privacy Policy URL ay kailangan sa Play Store listing.

## Pagkakasunod ng gagawin
1. **Safety:** circles, invite/accept, Locate (30 days), SOS + push.
2. **Age:** birthdate, age gate, Teen defaults.
3. **Parental:** link, sleep timer, break, daily limit.
4. **APK:** alarm, background location, SMS fallback, guidelines screens.


Tingnan din: [[Decisions]], [[Build - Social feed]], [[System map]]
