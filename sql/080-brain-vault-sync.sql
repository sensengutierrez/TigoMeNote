-- TigoMeNote · 080 · vault sync: #56 dl fallback — record lang; napatakbo na
insert into brain_notes (title, body, tags, updated_by) values ($v$Change log$v$, '', '{}', 'claude') on conflict (lower(title)) do update set body = replace(brain_notes.body, $v$- **Paano:** test_gate 3/3 (simulated na APK), test_messages 86/86.
$v$, $v$- **Paano:** test_gate 3/3 (simulated na APK), test_messages 86/86.

## 2026-10-25 · #56 Fix: 404 sa tigomenote.com/dl → backup na GitHub link
- **Ano:** Kapag wala pa ang APK sa `tigomenote.com/dl/` (hal. napalitan ng lumang "Deploy from a branch" ang site), sa GitHub Release muna ang Download button sa Get app page (HEAD check ng bawat app sa `app-version.json` → `github`).
- **Bakit:** Ayon kay Bench (screenshot ng 404 sa `/dl/TigoMeNoteChat.apk`): "both download wala". Dahilan: naka-"Deploy from a branch" pa ang Pages, kaya ang branch deploy (walang `dl/`) ang huling nag-deploy.
- **Files:** `assets/js/pages/get.js`
- **Paano:** test_get 18/18. Para sa tigomenote.com/dl mismo: Settings → Pages → Source: **GitHub Actions**.
$v$), updated_by = 'claude', updated_at = now();
