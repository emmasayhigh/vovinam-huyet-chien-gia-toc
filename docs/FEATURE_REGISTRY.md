# FEATURE REGISTRY — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-REG-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Protection Rule**: Features marked `VERIFIED` are protected against accidental deletion or regression.

---

## 1. STATUS TAXONOMY

- `VERIFIED`: Implemented, tested with automated test suite, active in runtime, protected against regression.
- `IMPLEMENTED_UNVERIFIED`: Implemented in source code but lacks dedicated automated unit test coverage.
- `PARTIALLY_IMPLEMENTED`: Implementation in progress; stub or partial functionality present.
- `KNOWN_BROKEN`: Known pre-existing defect documented in `docs/KNOWN_ISSUES.md`.
- `DEPRECATED_APPROVED`: Intentionally retired with documented architectural approval.

---

## 2. FEATURE INVENTORY

### CATEGORY: COMBAT MECHANICS

#### `FEAT-CMB-001`: Dodge [L] Mechanic & Cooldown
- **Name**: Dodge [L] & Invulnerability Window
- **Description**: Rapid evasion maneuver granting brief invulnerability (i-frames) followed by a mandatory cooldown to prevent spamming.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/combat.js`, `js/entities/player/playerInput.js`, `js/entities/player/playerBase.js`
- **Dependencies**: `window.combatManager`, `InputHandler`, `PlayerBase`
- **Public Interfaces**: `player.triggerDodge()`, `player.dodgeCooldown`, `player.isDodgeActive()`
- **Expected Behavior**: Key [L] triggers dodge; sets `dodgeCooldown = 8.0s`; provides `0.18s` i-frame; repeated key presses while cooldown > 0 are rejected; holding [L] does not repeat.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite D).

#### `FEAT-CMB-002`: Counter Tay Vovinam [U+J]
- **Name**: Vovinam Hand Counter Technique
- **Description**: Defensive stance anticipating incoming high, punch, or heavy strikes; executes instantaneous counter-strike and negates all incoming damage.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/combat.js`, `js/entities/player/playerInput.js`
- **Dependencies**: `window.combatManager`, `Player`
- **Public Interfaces**: `player.triggerCounterHand()`, `player.counterHandCooldown`
- **Expected Behavior**: Pressing [U+J] enters `counter_hand_prep`; counter window `0.32s`; cooldown `2.5s`; whiff recovery `0.28s`; successfully counters uncounterable/heavy strikes; player takes 0 damage.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite E).

#### `FEAT-CMB-003`: Counter Chân Vovinam [U+K]
- **Name**: Vovinam Leg Sweep Counter Technique
- **Description**: Low defensive stance anticipating incoming strikes; sweeps and trips opponents upon interception.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/combat.js`, `js/entities/player/playerInput.js`
- **Dependencies**: `window.combatManager`, `Player`
- **Public Interfaces**: `player.triggerCounterLeg()`, `player.counterLegCooldown`
- **Expected Behavior**: Pressing [U+K] (in any key press order) enters `counter_leg_prep`; counter window `0.32s`; cooldown `3.5s`; whiff recovery `0.32s`; trips normal enemies; counters punches and negates damage.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite F).

#### `FEAT-CMB-004`: Airborne Kick [Space+K] & Landing Recovery
- **Name**: Flying Kick & Landing Lockout
- **Description**: Mid-air kick technique with recovery penalty and anti-spam protection.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/combat.js`, `js/entities/player/playerBase.js`
- **Dependencies**: `PlayerBase`, `CombatManager`
- **Public Interfaces**: `player.triggerFlyingKick()`, `player.landingRecovery`
- **Expected Behavior**: Space + K sets state to `flying_kick`; applies `0.6s` cooldown; cannot overwrite mid-air; landing on miss adds `0.20s` whiff penalty (`0.75s` total recovery); landing on hit recovers in `0.55s`; no actions allowed during landing state.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite C).

#### `FEAT-CMB-005`: 3-Tier Armor Auras
- **Name**: Three-Tier Armor Defense System
- **Description**: White (Invulnerability), Gold (Unbreakable Super Armor), Red (Breakable Hyper Armor).
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/combat.js`, `js/entities/player/playerDamage.js`, `js/entities/enemy/baseEnemy.js`
- **Dependencies**: `CombatManager`
- **Public Interfaces**: `entity.armorType`, `entity.armorHp`, `entity.armorHits`
- **Expected Behavior**:
  - White: 100% damage negated, crowd-control immune.
  - Gold: Takes damage, zero hit stun or knockdown (unbreakable).
  - Red: Absorbs hit stun for 3 hits or 100 HP; breaks upon depletion or upon receiving [U+J]/[U+K] counter; breaker receives knockdown.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_aura_armor.js`.

#### `FEAT-CMB-006`: Weapon Durability & Zero-Clamp
- **Name**: Weapon Durability & Destruction
- **Description**: Weapons degrade with each strike and shatter cleanly at zero durability without dropping below zero.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/weapons.js`, `js/ui/ui.js`
- **Dependencies**: `WeaponManager`, `HUD`
- **Public Interfaces**: `weapon.durability`, `player.equippedWeapon`
- **Expected Behavior**: Initial weapon durability is set (e.g., 8); decrements per strike; shatters immediately when hitting at 1 durability; weapon state cleared; durability never drops to `-1`; HUD never displays negative durability.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_weapons_durability.js`.

#### `FEAT-CMB-007`: Weapon Throw [E] & Playable Riot Shield (Khiên)
- **Name**: Choreographed Weapon Throwing, Playable Shield & 2.5D Weapon Art
- **Description**: Pressing [E] near a dropped weapon picks up/swaps (including Côn, Mã Tấu, and Riot Shield `KHIÊN`); pressing [E] without a drop executes a 3-phase `wp_throw` coil-release-follow-through animation that spins out the weapon at release time (`0.105s`). All 3 weapons feature multi-layer 2.5D shading in hand, on ground, in flight, in restored `#hud-weapon-card`, and in Kho Đồ Tab 2.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/weapons.js`, `js/entities/animation/animationBase.js`, `js/entities/animation/animationWeapon.js`, `js/entities/player/playerDamage.js`, `js/ui/ui.js`, `js/ui/menu/collections.js`, `css/hud.css`, `index.html`
- **Dependencies**: `WeaponSystem`, `SkeletalRendererWeapon`, `PlayerDamage`, `UIManager`, `ProjectileManager`
- **Public Interfaces**: `weaponSystem.throwWeapon()`, `weaponSystem.getIconSvg()`, `WEAPON_DEFS.shield`, `WP_POSES.wp_throw`
- **Expected Behavior**: Riot Shield can be picked up (`durability: 10`), used for `[J]`/`[K]` (`shield_strike`/`shield_bash`), `[U]` enhanced guard (absorbs 75% extra chip damage + sparks), and `[E]` thrown; `[E]` throw animates visibly with weapon in hand during windup before detaching projectile with shock ring and spin trails; `#hud-weapon-card` displays SVG icons & durability pips accurately.
- **Verification Method**: Automated unit test + Playwright Chromium visual inspection.
- **Regression Test**: `tests/test_boss_targeting_and_weapon_throw.js`, `tests/test_weapons_durability.js`, `tests/test_weapon_shield_throw_visuals.js`.

#### `FEAT-CMB-008`: Environmental Props & Wall Splat
- **Name**: Destructible Props & Knockback Collision
- **Description**: Crate/barrel objects that block movement and cause wall-splat damage when enemies are knocked into them.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/combat/props.js`, `js/combat/combat.js`
- **Dependencies**: `PropManager`, `CombatManager`
- **Public Interfaces**: `props.checkCollision()`, `props.handleKnockbackImpact()`
- **Expected Behavior**: AI walking into crates does not auto-fall; enemies hit by combat knockback into crates suffer wall-splat impact damage and knockdown; `combatKnockback` flag cleared immediately to prevent infinite damage loop.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suites A & B).

---

### CATEGORY: BOSS ENCOUNTERS & ENEMY AI

#### `FEAT-BOS-001`: Boss Poise & Stagger System
- **Name**: Boss Poise Meter & Stagger Breakdown
- **Description**: Bosses possess a Poise gauge that resists single knockdowns until broken.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/entities/enemy/enemyBosses.js`, `js/combat/combat.js`
- **Dependencies**: `EnemyBosses`, `CombatManager`
- **Public Interfaces**: `boss.poise`, `boss.maxPoise`, `boss.breakPoise()`
- **Expected Behavior**: Boss resists knockdown while poise > 0; heavy strikes deplete poise; poise <= 0 triggers knockdown; poise automatically regenerates after a delay without taking damage.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite G).

#### `FEAT-BOS-002`: Boss OTG Knockdown Immunity
- **Name**: Post-Getup OTG Protection
- **Description**: Bosses receive 3.5s anti-knockdown immunity upon completing getup animation to prevent infinite loop juggling.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/entities/enemy/enemyBosses.js`
- **Dependencies**: `EnemyBosses`
- **Public Interfaces**: `boss.otgImmune`, `boss.otgImmunityTimer`
- **Expected Behavior**: After getup, boss gets `3.5s` knockdown immunity; poise resets to 100%; boss still takes damage normally but cannot be knocked down again during the window.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite G).

#### `FEAT-BOS-003`: Boss Hắc Lang Phase 3 Dive Attack
- **Name**: Hắc Lang Dive Strike Execution
- **Description**: Phase 3 aerial dive attack targeting player position.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/entities/bosses2.js`, `js/entities/characters/haclang.js`
- **Dependencies**: `Bosses2`, `CharacterRegistry`
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite G).

#### `FEAT-BOS-004`: Boss Thiết Quyền Phase 2 Earth Stomp
- **Name**: Thiết Quyền Ground Smash AoE
- **Description**: Phase 2 area-of-effect shockwave strike.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/entities/bosses2.js`, `js/entities/characters/thietquyen.js`
- **Dependencies**: `Bosses2`, `EffectsManager`
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Test Suite G).

#### `FEAT-BOS-005`: Boss %HP vs Distance Target Selection
- **Name**: Boss Dynamic Priority Targeting & Anti-Clamp
- **Description**: Boss evaluates distance and percentage HP when deciding between Player and Ally; prevents getting trapped turning between them.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/entities/enemy/enemyBosses.js`
- **Dependencies**: `EnemyBosses`, `AllySystem`, `Player`
- **Public Interfaces**: `boss.selectBestTarget(player, ally)`
- **Expected Behavior**: Target < 80px prioritized; if both far (>250px), targets the one with lower % HP; if both close, finishes off the lower HP target; does not toggle facing rapidly when flanked.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_boss_targeting_and_weapon_throw.js`.

---

### CATEGORY: ROSTER, ALLIES & CHARACTERS

#### `FEAT-ALY-001`: Ally Summoning System [Key H]
- **Name**: Tactical Ally Summon & AI Partner
- **Description**: Summons designated companion to fight alongside the player.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/entities/allySystem.js`, `js/core/gameBase.js`
- **Dependencies**: `AllySystem`, `Player`, `CharacterRegistry`
- **Public Interfaces**: `allySystem.summonAlly()`, `allySystem.activeAlly`
- **Expected Behavior**: Pressing [H] summons ally when available; ally pursues enemies, performs combos, and draws aggro.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_v5_ally_and_moves.js`, `tests/test_nerf_allies.js`.

#### `FEAT-ALY-002`: 3-Column Ally Selection Modal & Exclusive Roster Check
- **Name**: 3-Column Ally Deployment Modal
- **Description**: UI modal displaying 9 available allies with `hero-busy` lock on the currently active player fighter.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/ui/menu/charselect/charSelectDeployment.js`, `index.html`, `css/menu.css`
- **Dependencies**: `MenuManagerCharSelectDeployment`, `SaveManager`
- **Public Interfaces**: `openAllySelect()`, `cycleAlly()`, `renderAllyDockPills()`
- **Expected Behavior**: 3-column modal; cards show portrait and stats; active hero cannot be selected as ally (`hero-busy`); cycling skips busy heroes.
- **Verification Method**: Automated unit test & DOM inspection.
- **Regression Test**: `tests/test_ally_select_screen.js`, `tests/test_hero_ally_exclusive.js`.

#### `FEAT-CHR-001`: Character Registry (13 Martial Artists)
- **Name**: Modular Character Architecture
- **Description**: Registry holding 13 distinct fighter configurations: `nghi`, `bichlam`, `huavudai`, `dinhan`, `hoanganh`, `dunghai`, `giangmanh`, `mocdang`, `haclang`, `thietquyen`, `huyetanh`, `longvuong`, `vinhtam`. Khi bất kỳ nhân vật nào khoác Võ Phục Vovinam (`skin === 'vovinam'`), hệ thống tự động kế thừa trọn vẹn quyền cước, phản đòn, đòn chân kẹp scissor_kick và tuyệt kỹ Long Hổ Xuất Sơn của Ngô Nhất Nghị.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/entities/characters/*.js`, `js/entities/characters/characterRegistry.js`
- **Dependencies**: `window.characterRegistry`
- **Public Interfaces**: `characterRegistry.get(id)`, `characterRegistry.getAll()`
- **Expected Behavior**: All 13 character definitions load without error; specify unique stats, passives, ultimate keys, and skins.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/validate_index_scripts.js`, `tests/test_passives_real.js`, `tests/test_vovinam_skin_skills.js`.

#### `FEAT-CHR-002`: Giang Mạnh Unlock Condition
- **Name**: Giang Mạnh Progression Unlock
- **Description**: Unlocking Giang Mạnh requires completing Stage 11 or defeating Giang Mạnh boss.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/core/save.js`, `js/entities/characters/giangmanh.js`
- **Dependencies**: `SaveManager`
- **Expected Behavior**: `SaveManager.sanitize()` auto-unlocks Giang Mạnh if Stage 11 is cleared or boss defeated.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_giangmanh_unlock.js`.

---

### CATEGORY: TRAINING, TUTORIAL & PROGRESSION

#### `FEAT-TRN-001`: Võ Đường (Training Dojo) & 7 Trial Drills
- **Name**: Martial Dojo Training Mode
- **Description**: Practice arena with immortal dummy, combo damage meter, 7 specialized drills, and collapsible dock menu [C].
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/ui/training/*.js`, `js/data/training.js`, `css/training.css`
- **Dependencies**: `TrainingManager`, `TrainingDummy`
- **Public Interfaces**: `trainingManager.toggleMenuCollapse()`, `trainingManager.setMode()`
- **Expected Behavior**: Dummy auto-regenerates HP; combo damage counter updates peak combo; player cannot die in Dojo; pressing [C] collapses/expands overlay dock.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_combat.js` (Suite 6).

#### `FEAT-TUT-001`: 10-Step Interactive Tutorial
- **Name**: Beginner Martial Tutorial
- **Description**: 10 sequential guided steps teaching movement, combos, dodging, counters, and ultimates.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/ui/tutorial/*.js`
- **Dependencies**: `TutorialManager`, `SaveManager`
- **Expected Behavior**: Tracks step 1 through 10; skip option records `tutorialSkipped = true`; subsequent boots do not force tutorial.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_tutorial_trigger.js`, `tests/test_combat.js` (Suite 6).

#### `FEAT-SAV-001`: SaveManager Schema v5 & Sanitization
- **Name**: LocalStorage Save Persistence
- **Description**: Storage manager under key `vovinam_huyet_chinh_gia_toc` with versioning, corrupt data recovery, and migration clamp.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/core/save.js`
- **Dependencies**: `window.localStorage`
- **Public Interfaces**: `saveManager.save()`, `saveManager.load()`, `saveManager.sanitize(raw)`
- **Expected Behavior**: Clamps out-of-bounds stage numbers; sanitizes arrays; preserves achievements and character trusts across versions.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_upgrades.js`, `tests/test_v5_features.js`.

---

### CATEGORY: AUDIO, VISUALS & UI

#### `FEAT-AUD-001`: Dynamic Boss Phase BGM & Synthesizer
- **Name**: Interactive Boss BGM & Audio Synthesis
- **Description**: Web Audio synthesizer adjusting tempo, drum intensity, and key as boss transitions through phases.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/core/audio.js`
- **Dependencies**: `window.audioManager`, `AudioContext`
- **Public Interfaces**: `audioManager.setBossPhase(phase)`, `audioManager.playAchievementFanfare()`
- **Expected Behavior**: Transitions audio tempo without crackle or crash on boss phase changes.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_v5_features.js`.

#### `FEAT-UI-001`: UI System Overhaul 3.0 & Performance Foundation
- **Name**: Unified Modal Choreography, Võ Đường Redesign, Settings Studio & Kho Đồ
- **Description**: Centralized `UICore` modal stack/debounce/asset-warming controller paired with redesigned `#training-mode-modal` (clean `char_select_bg.jpg` backdrop, non-overlapping 3-column hero cards, action dock separated below hero boots), Studio `#settings-modal` & `#keybindings-modal` (`z-index: 440`, keydown remap cleanup), 4-tab `#skills-equip-modal` backed by real `CHAR_SLOTS` / `WEAPON_DEFS` / `PLAYER_ATTACKS` / `STORY_META`, idle rAF suspension behind menus/modals, and `prefers-reduced-motion` support.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/ui/uiCore.js`, `css/ui-overhaul.css`, `js/ui/menu/collections.js`, `js/ui/menu/settings.js`, `js/ui/menu/menuBase.js`, `js/ui/training/trainingManagerOverlay.js`, `js/ui/menu/charselect/charSelectCore.js`, `js/ui/menu/charselect/charSelectDemo.js`, `js/core/main.js`, `js/core/gameBase.js`, `js/ui/ui.js`, `index.html`
- **Dependencies**: `UICore`, `SaveManager`, `WeaponSystem`, `InputHandler`, `TrainingManagerOverlay`
- **Public Interfaces**: `uiCore.showModal()`, `uiCore.hideModal()`, `uiCore.schedulePersist()`, `showSkillsEquip()`, `cleanupKeybindingsListener()`
- **Expected Behavior**: Zero background combat rAF churn when modal/menu idle (`0 rAF/s` in Võ Đường / Settings / Kho Đồ), deduplicated `__vovClickBound` click handlers, `#keybindings-modal` layered cleanly above `#settings-modal`, real weapon/skin/progress data in Kho Đồ & Settings.
- **Verification Method**: Automated unit test + Chromium UI benchmark & responsive visual verification.
- **Regression Test**: `tests/test_ui_overhaul_3.js`.

#### `FEAT-UI-002`: Custom Keybindings System
- **Name**: Remappable Keyboard Controls
- **Description**: 13 configurable action keys in `#keybindings-modal` (elevated at `z-index: 440`) with UI formatting, `cleanupKeybindingsListener()` capture listener cleanup on close, and persistence in SaveManager.
- **Status**: `VERIFIED`
- **Stability**: `STABLE`
- **Main Files**: `js/core/input.js`, `js/ui/menu/settings.js`, `js/core/save.js`, `css/ui-overhaul.css`
- **Dependencies**: `InputHandler`, `MenuManagerSettings`, `UICore`
- **Public Interfaces**: `inputHandler.setBinding(action, newKey)`, `menuManager.cleanupKeybindingsListener()`, `menuManager.hideKeybindings()`
- **Expected Behavior**: Remaps key bindings; formats keys for display; stores and restores from localStorage; closing modal restores listening button text and detaches capture keydown listener.
- **Verification Method**: Automated unit test.
- **Regression Test**: `tests/test_v5_features.js`, `tests/test_ui_overhaul_3.js`.


