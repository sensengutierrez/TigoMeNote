-- TigoMeNote · 005 · unang Brain notes (System map, logs, template)
insert into public.brain_notes (title, body, tags, updated_by) values
('System map', $$# System map
Pages (ROOT): index.html (landing), login.html
Pages (app/): home.html (Daily), explore.html, share.html, messages.html, profile.html, settings.html
Admin (app/admin/): wala pa

Shared code (assets/js): config.js (lahat ng URL), theme.js (light/dark/auto), auth-guard.js, api.js, icons.js, nav-items.js (MENU), components/app-shell.js (sidebar, hamburger, tabs)
Page code: assets/js/pages/<page>.js. Styles: assets/css/tokens.css (kulay), base.css, components.css, shell.css, pages/<page>.css

Edge functions: auth-fast (register, login, checkSession, logout). Source: backend/auth-fast.ts
Tables: users, sessions, write_action_dedup, brain_notes. SQL: sql/001-005
Secrets: AUTH_PEPPER (required, huwag palitan), REQUIRE_APPROVAL (optional "true")

Rules: walang URL sa page (config.js lang); menu sa nav-items.js lang; kulay sa tokens.css lang; bawat SQL may file sa sql/; bawat function may copy sa backend/.
See also: [[What's new log]], [[Fix log]], [[How it was built: Foundation]]$$, '{system}', 'claude'),
('What''s new log', $$# What's new log
- 2026-10-23: Bagong Supabase project tigomenote (ap-south-1). Tables users, sessions, write_action_dedup, brain_notes.
- 2026-10-23: auth-fast deployed (PBKDF2 + pepper, 24 h session, 5 mali = lock 30 min).
- 2026-10-23: Front-end shell: landing, login/register, 6 app pages, dark mode, editable menu (nav-items.js).$$, '{log}', 'claude'),
('Fix log', $$# Fix log
PROBLEM -> CAUSE -> FIX (file)
- (wala pa)$$, '{log}', 'claude'),
('How it was built: Foundation', $$# Foundation (auth + shell)
What it does: login/register at ang layout ng lahat ng app pages.
Pages: index.html, login.html, app/*.html. Shared code: config.js, theme.js, auth-guard.js, api.js, icons.js, nav-items.js, components/app-shell.js
Edge function: auth-fast. register/login = kahit sino (POST); checkSession/logout = may token.
Tables: users (username unique lower, role Admin/User, status Active/Pending/Inactive), sessions (token_hash lang), write_action_dedup (rate limit). Grants: service_role lang, RLS on.
HTML/CSS/JS notes: walang framework. Fonts Bricolage Grotesque + Inter. Plain white + dark mode (tokens.css). Desktop >= 900px: sidebar + content box na may sariling scroll. Phone: topbar + hamburger drawer + bottom tabs.
Browser storage: tmnToken, tmnUser (local kung "keep me signed in", kung hindi session), tmnTheme.
How to rebuild: sql 001-004 -> secret AUTH_PEPPER -> deploy auth-fast (verify_jwt off) -> upload files sa GitHub.
Known limits: unang nag-register = Admin. Hindi pa na-test sa totoong server mula sa sandbox.
See also: [[System map]]$$, '{feature}', 'claude')
on conflict do nothing;
