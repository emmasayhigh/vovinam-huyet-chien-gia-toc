# PROJECT MAP — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-MAP-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Target Audience**: AI Agents, Systems Architects, Game QA Engineers

---

## 1. PROJECT DIRECTORY OVERVIEW

```
cucuvababa/
├── AGENTS.md                          # Mandatory agent instructions and workflow rules
├── index.html                         # Primary game HTML entry point; strict script load order
├── package.json                       # Project manifest, NPM scripts, and harness devDependencies
├── README.md                          # Project overview and gameplay instructions
├── server.js                          # Zero-dependency local Node.js static HTTP server (port 3000)
├── start_game.bat                     # Windows launch batch script (launches server and browser)
│
├── assets/                            # Static game media assets
│   └── images/
│       ├── backgrounds/               # Title, menu, stage backdrop textures
│       ├── cards/                     # Chapter selection and menu reference cards
│       ├── characters/                # Character portraits, roster avatars, skins
│       ├── cutscenes/                 # Story cutscene illustrations
│       └── previews/                  # Move preview assets
│
├── css/                               # Cascading Style Sheets (modular UI styling)
│   ├── base.css                       # Reset, layout canvas wrapper, typography, utility classes
│   ├── features.css                   # Modals for chronicles, deductions, investigation, boss rush
│   ├── hud.css                        # In-game HUD: health bars, energy, skill cooldown badges, boss bars
│   ├── menu.css                       # Cinematic title screen, character selector, ally modal, settings
│   └── training.css                   # Võ Đường (Training Dojo) overlay, collapsible dock, drill UI
│
├── js/                                # JavaScript Game Engine (Vanilla JS, window global scope)
│   ├── combat/
│   │   ├── combat.js                  # CombatManager: hitboxes, hurtboxes, counters, i-frames, armors
│   │   ├── props.js                   # Interactive environmental objects (barrels/crates, wall splats)
│   │   └── weapons.js                 # Weapon durability, pickup [E], dropping, throwing mechanics
│   ├── core/
│   │   ├── audio.js                   # Web Audio synthesizer, SFX, interactive boss dynamic BGM, kiai
│   │   ├── effects.js                 # Particle emitter, hit sparks, shockwaves, screen shake
│   │   ├── game.js                    # Core Game class entry point combining sub-engine mixins
│   │   ├── gameBase.js                # Game state loop, fixed step updater, core initialization
│   │   ├── gameCamera.js              # Dynamic camera, look-ahead, duel zoom, punch shake
│   │   ├── gameFlow.js                # Pause, victory, game over, stage progression, stats
│   │   ├── gameRender.js              # Canvas 2D scene renderer, layering, particles, projectiles
│   │   ├── gameStory.js               # Mid-battle dialogue triggers, story pacts, stage 7 flow
│   │   ├── gameWave.js                # Wave director, enemy spawner, reinforcements, drops
│   │   ├── input.js                   # Keyboard & touch input handling, buffer, key remapping
│   │   ├── main.js                    # Bootstrap entry point connecting UI buttons to Game instance
│   │   └── save.js                    # SaveManager: schema v5 localStorage persistence, data migration
│   ├── data/
│   │   ├── stages.js                  # Data definitions for 11 story stages (waves, bosses, dialogs)
│   │   └── training.js                # Data for 7 training fighters and 7 trial drills
│   ├── entities/
│   │   ├── allySystem.js              # Ally AI summoning, companion behavior, assist attacks
│   │   ├── animation.js               # Animation class orchestrator
│   │   ├── bosses2.js                 # Specialized boss logic (Hạc Lang, Thiết Quyền, Long Vương)
│   │   ├── enemy.js                   # Enemy system aggregator class
│   │   ├── player.js                  # Player system aggregator class
│   │   ├── roster.js                  # Roster metadata, character bios, skill descriptions
│   │   ├── animation/
│   │   │   ├── animationBase.js       # Base animation curves and playback timing
│   │   │   ├── animationBody.js       # Torso, head, and limb skeletal transformations
│   │   │   ├── animationData.js       # Keyframe tables and pose coordinate offsets
│   │   │   ├── animationPose.js       # Pose calculations (idle, punch, kick, dodge, counter, etc.)
│   │   │   ├── animationRenderBase.js # Base canvas 2D bone rendering primitives
│   │   │   └── animationWeapon.js     # Weapon attachment transforms and swinging trails
│   │   ├── characters/
│   │   │   ├── bichlam.js             # Đình Bích Lâm: stats, passives, sword techniques
│   │   │   ├── bootstrap.js           # Character registry bootstrapper
│   │   │   ├── characterRegistry.js   # Character registry singleton managing all 13 fighters
│   │   │   ├── dinhan.js              # Đình An: stats, passives, gentle crane fist
│   │   │   ├── dunghai.js             # Dũng Hải: stats, passives, heavy blade techniques
│   │   │   ├── giangmanh.js           # Giang Mạnh: stats, passives, iron body defenses
│   │   │   ├── haclang.js             # Hắc Lang: stats, assassin strikes, dive attacks
│   │   │   ├── hoanganh.js            # Hoàng Anh: stats, agility, high kicks
│   │   │   ├── huavudai.js            # Hứa Vũ Đại: patriarch stats, golden bell iron shield
│   │   │   ├── huyetanh.js            # Huyết Ảnh: shadow assassination style
│   │   │   ├── longvuong.js           # Long Vương: dragon fist master
│   │   │   ├── mocdang.js             # Mộc Đặng: wooden puppet combat mechanics
│   │   │   ├── nghi.js                # Ngô Nhất Nghị: protagonist dragon punch style
│   │   │   ├── thietquyen.js          # Thiết Quyền: earth stomp, shockwaves
│   │   │   └── vinhtam.js             # Triệu Vinh Tâm: secret legacy character
│   │   ├── enemy/
│   │   │   ├── baseEnemy.js           # BaseEnemy class: state machine, obstacle evasion, targeting
│   │   │   ├── enemyBosses.js         # Boss states, poise breaking, OTG immunity, enrage phases
│   │   │   └── enemyVariants.js       # Grunt, brawler, assassin, brute variations
│   │   └── player/
│   │       ├── playerBase.js          # Player state machine, physics, animation linkages
│   │       ├── playerDamage.js        # Health calculation, poise damage, armor reduction, i-frames
│   │       ├── playerInput.js         # Buffered input interpretation, combo chaining
│   │       └── playerUltimate.js      # Ultimate energy charging, screen freeze, cinematic strikes
│   ├── features/
│   │   ├── bossRush.js                # Boss Rush challenge mode manager
│   │   ├── confrontation.js           # Dramatic confrontation cinematic controller
│   │   ├── deduction.js               # Evidence deduction puzzle system
│   │   ├── flashback.js               # Narrative flashback sequence player
│   │   └── investigation.js           # Clan investigation & crime scene evidence search
│   ├── ui/
│   │   ├── menu.js                    # Menu orchestrator
│   │   ├── ranking.js                 # Stage clearance rating (S/A/B/C) and leaderboard stats
│   │   ├── training.js                # Training Dojo orchestrator
│   │   ├── tutorial.js                # 10-step interactive tutorial system
│   │   ├── ui.js                      # HUD bindings, popups, floating damage numbers
│   │   ├── menu/
│   │   │   ├── charSelect.js          # Character selection coordinator
│   │   │   ├── charSlots.js           # Character roster grid slots layout
│   │   │   ├── chronicles.js          # Clan chronicles narrative log
│   │   │   ├── collections.js         # Achievements, dossiers, collectibles viewer
│   │   │   ├── menuBase.js            # Menu DOM event bindings, campaign map controller
│   │   │   ├── settings.js            # Audio volume, visual toggles, custom keybindings
│   │   │   └── charselect/
│   │   │       ├── charSelectCore.js       # Core selection state, active fighter selection
│   │   │       ├── charSelectDemo.js       # Character move showcase arena (3D/2D toggle)
│   │   │       └── charSelectDeployment.js # 3-column ally selection modal, hero-busy check
│   │   ├── training/
│   │   │   ├── trainingDummy.js            # Immortal training dummy logic
│   │   │   ├── trainingManagerBase.js      # Training state manager, drill tracking
│   │   │   ├── trainingManagerOverlay.js   # Training UI overlay, stats panel, collapse dock
│   │   │   └── trainingModes.js            # Drill mode vs Free sandbox mode
│   │   └── tutorial/
│   │       ├── tutorialDummy.js            # Guided tutorial dummy
│   │       ├── tutorialManagerBase.js      # 10-step sequence progression logic
│   │       └── tutorialManagerOverlay.js   # Tutorial prompt overlays and key hints
│   └── world/
│       ├── scenery.js                 # Environmental scenery generator, weather effects
│       ├── stageManager.js            # Current stage state, dialogue queue, stage victory flow
│       ├── stageRenderer.js           # Parallax background scrolling and stage backdrop layers
│       ├── stages.js                  # Stage system entry point
│       └── story.js                   # Narrative script dispatcher and chapter transitions
│
├── tests/                             # Node.js Test Suite (19 automated test files)
│   ├── test_ally_select_screen.js     # 3-column ally selection DOM and cycle logic
│   ├── test_aura_armor.js             # 3-tier aura armors (White, Gold, Red) and counter interactions
│   ├── test_boss_targeting_and_weapon_throw.js # Boss %HP targeting, anti-clamp, weapon throw
│   ├── test_char_select_passives_and_ally_title.js # Passive display and ally title strings
│   ├── test_combat.js                 # 86 combat balance tests: dodge L, counters U+J, U+K, poise, OTG
│   ├── test_enemy_target_ally.js      # Enemy targeting logic between player and ally
│   ├── test_giangmanh_unlock.js       # Giang Mạnh unlock condition verification
│   ├── test_hero_ally_exclusive.js    # Prevention of playing a character and summoning same as ally
│   ├── test_modular_characters_and_stage_flow.js # Stage transitions and character modularity
│   ├── test_nerf_allies.js            # Ally balance and attack cooldowns
│   ├── test_passives_real.js          # Passive skill runtime calculations
│   ├── test_stage7_victory_flow.js    # Stage 7 story branch and victory conditions
│   ├── test_tutorial_trigger.js       # Tutorial trigger conditions and skip flags
│   ├── test_upgrades.js               # Upgrades, skill points, and combat stat boosts
│   ├── test_v5_ally_and_moves.js      # V5 ally assists and martial moves
│   ├── test_v5_combat_and_passives.js # V5 combat combo mechanics and passive integration
│   ├── test_v5_features.js            # 21 tests: keybindings, achievements, boss BGM, kiai, dossiers
│   ├── test_weapons_durability.js     # Weapon durability zero-clamp, breaking, and throwing
│   └── validate_index_scripts.js      # Synthesizes index.html scripts and tests require loads (81 scripts)
│
├── harness/                           # Project Quality & Safety Harness
│   ├── gate.js                        # AI Pre-Commit Quality Gate CLI
│   ├── run-tests.js                   # Comprehensive test runner (runs all 19 test files)
│   ├── change-control.js              # Default Deny & Deletion Budget enforcement
│   ├── interface-guard.js             # Public API & Class interface protector
│   ├── browser-smoke.js               # Headless browser smoke test (Playwright/Chromium)
│   ├── visual-diff.js                 # Deterministic visual regression validator
│   ├── generate-report.js             # Machine-readable verification report generator
│   ├── recovery.js                    # Checkpoint and safe recovery utility
│   ├── test-harness.js                # Acceptance test suite for the harness itself
│   └── lib/                           # Harness support modules
│       ├── utils.js                   # Logging, file search, and system helpers
│       └── browser-launcher.js        # Browser discovery and launch abstraction
│
├── tasks/                             # AI Task Specifications
│   └── TASK-template.json             # Mandatory template for defining change scopes
│
└── docs/                              # Project Knowledge System
    ├── AGENTS.md -> ../AGENTS.md      # Root agent instructions
    ├── ARCHITECTURE.md                # System architecture, game loop, inheritance chains
    ├── BASELINE_REPORT.md             # Baseline status audit report
    ├── CHANGE_POLICY.md               # Change authorization and zero-deletion rules
    ├── DEPENDENCY_MAP.md              # Script and module dependency graph
    ├── FEATURE_REGISTRY.md            # Comprehensive feature catalog and statuses
    ├── GAMEPLAY_SYSTEMS.md            # In-depth gameplay rules and combat specifications
    ├── KNOWN_ISSUES.md                # Benign quirks and pre-existing items
    ├── PROJECT_MAP.md                 # This document
    └── TEST_STRATEGY.md               # Quality assurance and testing pyramid
```

---

## 2. ENTRY POINTS & RUNTIME ARCHITECTURE

1. **Browser Entry Point**: `index.html`
   - Sets viewport and canvas size (`1280x720`).
   - Links stylesheets: `css/base.css`, `hud.css`, `menu.css`, `features.css`, `training.css`.
   - Defines DOM structure for HUD, modals, overlays, and virtual controls.
   - Loads 81 JavaScript files in exact sequential order.
   - Instantiates `window.game` and binds event listeners in `js/core/main.js`.

2. **Local Server Entry Point**: `server.js`
   - Zero-dependency Node.js HTTP server.
   - Listens on `http://localhost:3000/`.
   - Serves `.html`, `.css`, `.js`, `.json`, `.png`, `.jpg`, `.svg` with no-cache headers.

3. **Desktop Launch Script**: `start_game.bat`
   - Checks for Node.js in system `PATH`.
   - Boots `server.js` and opens the default browser at `http://localhost:3000/`.

---

## 3. ASSETS INVENTORY

- **Characters**: `assets/images/characters/`
  - High-resolution character portraits and skin variants for all 13 martial artists.
- **Backgrounds**: `assets/images/backgrounds/`
  - Parallax backdrops for stages 1 through 11, title screen, and clan dojo.
- **Cards**: `assets/images/cards/`
  - Chapter cards for the Campaign Hub and Clan Chronicles.
- **Cutscenes**: `assets/images/cutscenes/`
  - Story illustrations for dialogue interludes, evidence discoveries, and chapter conclusions.
