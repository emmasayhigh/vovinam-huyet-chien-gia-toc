# BASELINE REPORT — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-BASE-001`  
> **Audit Date**: 2026-11-07  
> **Audited Version**: v5.8.0  
> **Baseline Classification**: `HEALTHY / OPERATIONAL`

---

## 1. EXECUTIVE SUMMARY

An exhaustive audit of the VOVINAM codebase was conducted prior to installing the development harness. The existing game is fully functional, all 19 automated test suites pass with 100% success rate, the HTML/JS application loads cleanly in headless Chromium with zero runtime console errors, and all visual and gameplay systems are operating as specified.

---

## 2. ENVIRONMENT & PLATFORM BASELINE

- **Operating System**: Windows 11 (win32 x64)
- **Node.js Runtime**: v22.19.0
- **NPM Package Manager**: 10.9.3
- **Headless Browser Engine**: Chromium 1243 (`C:\Users\ASUS\AppData\Local\ms-playwright\chromium-1243\chrome-win64\chrome.exe`)
- **Git Branch**: `master`
- **Safety Snapshot Ref**: `backup/user-wip-baseline` (created via `git stash create` at commit `1d8b59c5cb5da79ee3709c7d7aa9627858e7589d`)
- **Physical Working Tree Backup**: Stored in `<appDataDir>\brain\<conversation-id>\scratch\backup_baseline\`

---

## 3. BUILD & SCRIPT INTEGRITY STATUS

- **Build Process**: Pure zero-build HTML5 Canvas application.
- **Script Count**: 81 scripts in `index.html`.
- **Script Validation (`validate_index_scripts.js`)**:
  - Found scripts: **81**
  - Load errors: **0**
  - Exit code: **0 (PASS)**

---

## 4. AUTOMATED REGRESSION TEST RESULTS

All 19 test files in `tests/` were executed against the codebase:

| Suite Name | Checks | Status | Execution Time |
| :--- | :--- | :--- | :--- |
| `test_combat.js` | 86 combat & balance checks | `PASSED` | 0.85s |
| `test_v5_features.js` | 21 major feature checks | `PASSED` | 0.35s |
| `test_upgrades.js` | Save & upgrades validation | `PASSED` | 0.28s |
| `test_aura_armor.js` | 3-tier armor & counter break | `PASSED` | 0.22s |
| `test_boss_targeting_and_weapon_throw.js` | Boss targeting & weapon throw | `PASSED` | 0.26s |
| `test_weapons_durability.js` | Durability zero-clamp & throw | `PASSED` | 0.18s |
| `test_ally_select_screen.js` | 3-column ally modal & dock pills | `PASSED` | 0.21s |
| `test_hero_ally_exclusive.js` | Hero vs ally exclusivity | `PASSED` | 0.19s |
| `test_giangmanh_unlock.js` | Giang Mạnh unlock progression | `PASSED` | 0.17s |
| `test_passives_real.js` | Fighter passives calculation | `PASSED` | 0.18s |
| `test_stage7_victory_flow.js` | Stage 7 branching story flow | `PASSED` | 0.18s |
| `test_tutorial_trigger.js` | Tutorial sequence & skip logic | `PASSED` | 0.17s |
| `test_nerf_allies.js` | Ally balance & cooldown tuning | `PASSED` | 0.19s |
| `test_v5_ally_and_moves.js` | Ally moveset choreography | `PASSED` | 0.18s |
| `test_v5_combat_and_passives.js` | Combat combos & passives | `PASSED` | 0.18s |
| `test_char_select_passives_and_ally_title.js` | UI strings & character data | `PASSED` | 0.17s |
| `test_enemy_target_ally.js` | AI aggro distribution | `PASSED` | 0.18s |
| `test_modular_characters_and_stage_flow.js` | Modular characters & stage flow | `PASSED` | 0.19s |
| `validate_index_scripts.js` | 81 script loads in order | `PASSED` | 0.32s |
| **TOTAL** | **> 120 Checks** | **100% PASS** | **4.32s total** |

---

## 5. RUNTIME & BROWSER SMOKE BASELINE

- **Server Port**: 3000 (`server.js`)
- **Page Load (`index.html`)**: Successful (`HTTP 200`)
- **Page Title**: `VOVINAM: HUYẾT CHIẾN GIA TỘC`
- **Canvas Element (`#gameCanvas`)**: Present, dimensions `1280x720`
- **Title Screen (`#title-screen`)**: Present, rendered with cinematic styling
- **Console Errors Detected**: **0**
- **Unhandled Page Exceptions**: **0**
- **Baseline Screenshot**: Captured and verified (`harness/visual-baselines/baseline_title_screen.png`)

---

## 6. AUDIT CONCLUSION

The baseline state of the game is verified to be robust, performant, and stable. No pre-existing functional bugs or regressions exist. All future changes must preserve this baseline.

---

## 7. UI SYSTEM OVERHAUL 3.0 ADDENDUM (2026-11-15)

- **Scope**: Added `js/ui/uiCore.js` (`window.uiCore`), `css/ui-overhaul.css`, redesigned `#training-mode-modal` (Võ Đường), `#settings-modal`, `#keybindings-modal`, and 4-tab Studio `#skills-equip-modal` (Kho Đồ), plus idle rAF pausing, `Image.decode()` pre-warming, DOM card caching, and `__vovClickBound` click handler deduplication.
- **Automated Suites**: Expanded with `tests/test_ui_overhaul_3.js` (verified via `node harness/run-tests.js`).
- **Chromium UI Benchmark (`1280×720` & `1366×768`)**:
  - **Idle rAF callbacks/s**: Main Menu reduced `577.7 -> 144.6 rAF/s`; Võ Đường `569.6 -> 0 rAF/s`; Settings `579.3 -> 0 rAF/s`; Kho Đồ `580.5 -> 0 rAF/s`; CharSelect `578.8 -> 144.8 rAF/s`.
  - **Visible Backdrop Blurs**: Reduced from `53–55` elements to `12` elements across idle screens.
  - **Runtime Errors**: `0` console errors, `0` page errors, `0` duplicate click triggers on Campaign Hub / Achievements buttons.
