---
tags: [build]
updated: 2026-10-23
---
# Build - Foundation (database + login + app shell)

**What it does:** Accounts, login/logout, at ang layout ng lahat ng app pages (menu, dark mode).

**Pages:** `index.html`, `login.html`, `app/*.html`
**Shared code:** `config.js`, `theme.js`, `auth-guard.js`, `api.js`, `icons.js`, `nav-items.js`, `components/app-shell.js`

**Edge function:** `auth-fast`
| Action | Sino pwede | Method |
|---|---|---|
| register | kahit sino | POST |
| login | kahit sino | POST |
| checkSession | may token | GET/POST |
| logout | may token | GET/POST |

**Tables:** `users` (username unique lowercase; role Admin/User; status Active/Pending/Inactive), `sessions` (token_hash, expires_at 24 h), `write_action_dedup` (rate limit). Lahat: RLS on, grant sa `service_role` lang.

**Browser storage:** `tmnToken`, `tmnUser`, `tmnCheckedAt` (60 s cache ng session check), `tmnTheme`.

**HTML/CSS/JS notes:**
- Walang framework, walang build step.
- Fonts: Bricolage Grotesque (headings) + Inter (text), galing Google Fonts.
- Kulay: puti (`#ffffff`), ink `#121212`, isang accent na orange `#ff5a36`. Dark: `#0e0e10`.
- Desktop ≥ 900 px: sidebar 248 px + content box na may sariling scroll. Phone: sticky topbar, hamburger drawer, bottom tabs na may malaking "+" sa gitna.
- Icons sa page: `<i data-icon="camera"></i>`, pinapalitan ng `app-shell.js` ng SVG.

**How to rebuild (order):**
1. SQL `001` → `004` sa SQL editor.
2. Secret `AUTH_PEPPER` (mahabang random text; **huwag nang palitan**).
3. Deploy `backend/auth-fast.ts` bilang `auth-fast`, verify_jwt **off**.
4. I-upload ang files sa GitHub, i-on ang Pages (`main` / root).

**Known limits / hindi pa na-test:**
- Hindi pa na-test ang totoong login sa Supabase (hindi abot ng sandbox).
- Placeholder pa ang Explore, Share at Messages.
- Wala pang "change password" at "edit profile".

Tingnan din: [[System map]], [[Supabase setup]], [[Change log]]
