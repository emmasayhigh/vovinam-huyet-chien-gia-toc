# TEST STRATEGY — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-TST-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Target Audience**: AI Agents, QA Engineers, CI/CD Maintainers

---

## 1. TESTING PYRAMID

To guarantee both rapid iteration (<3 seconds per run) and real-world browser fidelity, the project employs a three-tier testing pyramid:

```
               / \
              /   \
             / E2E \       Tier 3: Browser Smoke & Visual Regression
            / Visual\      (Playwright / Headless Chromium, screenshots)
           /---------\
          /           \
         / Integration \   Tier 2: DOM & Script Validation
        /   DOM Mocks   \  (validate_index_scripts.js, modal tests)
       /-----------------\
      /                   \
     /   Fast Unit Logic   \  Tier 1: Deterministic Node.js Tests
    /    & Balance Tests    \ (Combat, Poise, Counters, SaveManager)
   /-------------------------\
```

---

## 2. TIER 1: DETERMINISTIC NODE.JS REGRESSION SUITES

Located in `tests/`, these suites run in pure Node.js with mock DOM/Canvas globals. They run in **under 2 seconds** and test exact gameplay mechanics:

| Test File | Focus Areas | Key Checks |
| :--- | :--- | :--- |
| `tests/test_combat.js` | Core Combat & Balance (86 tests) | Obstacle evasion, wall splat, Space+K flying kick, L dodge 8s cooldown, U+J counter hand, U+K counter leg, Boss poise & OTG immunity, Dojo drills, Tutorial |
| `tests/test_aura_armor.js` | 3-Tier Aura Armors | White invulnerability, Gold unbreakable super armor, Red breakable hyper armor, U+J / U+K counter armor break |
| `tests/test_boss_targeting_and_weapon_throw.js` | Boss AI & Weapon Throw | Boss %HP vs distance priority targeting, anti-sandwich clamp, weapon throw [E] |
| `tests/test_weapons_durability.js` | Weapon Durability | Initial durability, hit degradation, zero-clamp, HUD presentation |
| `tests/test_ally_select_screen.js` | Ally Selection Screen | 3-column modal DOM, `hero-busy` active fighter exclusion, cycle logic |
| `tests/test_hero_ally_exclusive.js` | Hero Exclusivity | Prevents summoning active player fighter as companion |
| `tests/test_giangmanh_unlock.js` | Character Progression | Stage 11 victory & boss defeat unlock conditions |
| `tests/test_upgrades.js` | Player Upgrades & Save | Skill points, attribute scaling, localStorage save migration |
| `tests/test_v5_features.js` | V5.0 Major Features (21 tests) | Custom keybindings, achievements, boss phase BGM tempo, kiai shouts, dossier viewer |
| `tests/test_passives_real.js` | Passive Calculations | Passive combat bonuses and damage modifiers |
| `tests/test_stage7_victory_flow.js` | Stage Flow & Branching | Stage 7 branching story choices and victory conditions |
| `tests/test_tutorial_trigger.js` | Tutorial Triggers | Tutorial prompt logic and skip flag preservation |
| `tests/test_nerf_allies.js` | Ally Combat Tuning | Ally damage output and cooldown pacing |
| `tests/test_v5_ally_and_moves.js` | Ally Movesets | Companion combat behaviors and choreography |
| `tests/test_v5_combat_and_passives.js` | Combat Combinations | Multi-hit combo chaining and passive interactions |
| `tests/test_char_select_passives_and_ally_title.js` | UI Text Integrity | Character select strings, passive tooltips, titles |
| `tests/test_enemy_target_ally.js` | AI Aggro Management | Enemy aggro distribution between player and ally |
| `tests/test_modular_characters_and_stage_flow.js` | Modularity & Stages | Character registry instantiation and stage transitions |

---

## 3. TIER 2: INTEGRATION & SCRIPT VALIDATION

### Script Tag Integrity (`tests/validate_index_scripts.js`)
- Parses `index.html` to discover all `<script>` tags in order (81 scripts).
- Executes every script in a controlled Node environment with mock `window` and `document`.
- Verifies that no script throws a `ReferenceError`, `SyntaxError`, or missing dependency error on load.

---

## 4. TIER 3: BROWSER SMOKE & VISUAL REGRESSION

Automated via `harness/browser-smoke.js` and `harness/visual-diff.js` using Chromium:
1. Spawns the static HTTP server.
2. Boots headless Chromium and navigates to `http://localhost:3000/index.html`.
3. Monitors `pageerror` and `console.error` events; asserts **zero unhandled exceptions**.
4. Asserts presence of `#gameCanvas`, `#title-screen`, `#hud`, and menu navigation elements.
5. Captures baseline screenshots at `1280x720` resolution and compares against known references in `harness/visual-baselines/`.
6. Checks for rendering anomalies: missing HUD, blank canvas, or broken layout.

---

## 5. HARNESS TEST COMMANDS

```bash
# Run all 19 automated regression test suites
npm run harness:test

# Run headless browser smoke check
node harness/browser-smoke.js

# Run full pre-commit gate (tests + change control + interface guard + smoke)
npm run harness:gate

# Run harness acceptance self-test
npm run harness:acceptance
```
