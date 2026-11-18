# ARCHITECTURE — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-ARCH-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Target Audience**: AI Agents, Systems Architects, Gameplay Programmers

---

## 1. HIGH-LEVEL ARCHITECTURE

VOVINAM is an arcade-style, 2D martial arts beat-'em-up engine implemented in pure vanilla JavaScript and HTML5 Canvas.

```
+-----------------------------------------------------------------------------------+
|                                BROWSER DOM LAYER                                  |
|   index.html  •  css/*.css  •  #ui-layer  •  #title-screen  •  #hud  •  #modals   |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              GLOBAL WINDOW REGISTRY                               |
|   window.game  •  window.combatManager  •  window.saveManager  •  window.roster   |
|   window.characterRegistry  •  window.audioManager  •  window.effectsManager      |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  CORE GAME LOOP                                   |
|   requestAnimationFrame  --->  fixed-step update (60Hz)  --->  render (Canvas 2D)|
|   Input Buffer           --->  Combat / Physics / AI     --->  Camera Interpolate|
+-----------------------------------------+-----------------------------------------+
       |                                  |                                   |
       v                                  v                                   v
+---------------+                +-----------------+                 +--------------+
| ENTITY ENGINE |                |  COMBAT ENGINE  |                 | WORLD ENGINE |
| Player        |                | CombatManager   |                 | StageManager |
| BaseEnemy     |                | Hitboxes        |                 | Scenery      |
| Bosses        |                | Hurtboxes       |                 | Story Events |
| Allies        |                | Weapons & Props |                 | Parallax FX  |
| Animation     |                | Aura Armors     |                 | Waves/Spawns |
+---------------+                +-----------------+                 +--------------+
```

---

## 2. THE GAME LOOP & TIME SYSTEM

- **Frame Rate Target**: 60 FPS standard via `requestAnimationFrame`.
- **Fixed Physics Step**: Physics and combat state mutations operate on a delta time (`dt`) clamped to prevent spiral-of-death tunneling (typically `dt = Math.min(rawDt, 0.05)`).
- **Interpolation**: Camera look-ahead and cinematic zoom smoothly interpolate (`lerp`) toward targets to prevent visual jitter.
- **Cinematic Hitstop**: Impact freezes (1-3 frames on heavy blows, counters, or ultimate finishers) temporarily pause entity physics while particles and screen shakes continue.

---

## 3. CLASS HIERARCHY & MIXIN INHERITANCE CHAINS

The codebase is modularized without ES Modules (`import`/`export`) or a bundler. Instead, modules use **sequential prototype / class extension** attached to the `window` scope.

### 3.1 Player Inheritance Chain
Each sub-class extends the previous class, culminating in `Player`:
```
PlayerBase (js/entities/player/playerBase.js)
   └── PlayerDamage (js/entities/player/playerDamage.js)
         └── PlayerUltimate (js/entities/player/playerUltimate.js)
               └── PlayerInput (js/entities/player/playerInput.js)
                     └── Player (js/entities/player.js)
```
- `PlayerBase`: Base properties, position `(x, y)`, movement velocities, state machine transitions, basic animation triggers.
- `PlayerDamage`: Hurtbox logic, hit reception, poise reduction, damage calculation, invulnerability frames (`i-frames`).
- `PlayerUltimate`: Ultimate energy gauge, meter accumulation, cinematic freeze activation, execution frames.
- `PlayerInput`: Buffered input queue, combo state evaluation, attack transitions, custom key remapping.
- `Player`: Final aggregator exposing the public `window.Player` interface.

### 3.2 Enemy Inheritance Chain
```
BaseEnemy (js/entities/enemy/baseEnemy.js)
   └── EnemyVariants (js/entities/enemy/enemyVariants.js)
         └── EnemyBosses (js/entities/enemy/enemyBosses.js)
               └── Enemy (js/entities/enemy.js)
```
- `BaseEnemy`: Core AI state machine (idle, advance, retreat, attack, hurt, knockdown, getup), obstacle avoidance, player/ally target selection.
- `EnemyVariants`: Archetype configurations (brawler, spearman, assassin, bruiser) and distinct attack profiles.
- `EnemyBosses`: Boss poise system, phase transitions (P1/P2/P3), enrage mechanics, special attacks (Hạc Lang Dive, Thiết Quyền Earth Stomp), OTG knockdown immunity.
- `Enemy`: Aggregator exposing `window.BaseEnemy` and enemy factory helpers.

### 3.3 Animation Inheritance Chain
```
AnimationData (js/entities/animation/animationData.js)
   └── AnimationBase (js/entities/animation/animationBase.js)
         └── AnimationPose (js/entities/animation/animationPose.js)
               └── AnimationRenderBase (js/entities/animation/animationRenderBase.js)
                     └── AnimationWeapon (js/entities/animation/animationWeapon.js)
                           └── AnimationBody (js/entities/animation/animationBody.js)
                                 └── Animation (js/entities/animation.js)
```
- Skeletal 2D limb transformations computed per frame. Supports dynamically attaching weapons to hands and emitting weapon trails.

### 3.4 Menu System Chain
```
MenuBase (js/ui/menu/menuBase.js)
   └── CharSelectCore (js/ui/menu/charselect/charSelectCore.js)
         └── CharSelectDemo (js/ui/menu/charselect/charSelectDemo.js)
               └── CharSelectDeployment (js/ui/menu/charselect/charSelectDeployment.js)
                     └── CharSelect (js/ui/menu/charSelect.js)
                           └── Collections (js/ui/menu/collections.js)
                                 └── Settings (js/ui/menu/settings.js)
                                       └── Chronicles (js/ui/menu/chronicles.js)
                                             └── Menu (js/ui/menu.js)
```

### 3.5 Training Dojo & Tutorial Chains
```
TrainingDummy ──► TrainingManagerBase ──► TrainingModes ──► TrainingManagerOverlay ──► Training
TutorialDummy ──► TutorialManagerBase ──► TutorialManagerOverlay ──► Tutorial
```

---

## 4. GLOBAL WINDOW STATE & SCRIPT LOAD ORDER

Because JavaScript files run without bundler isolation, order of `<script>` tags in `index.html` is **strictly mandatory**:
1. Core services (`audio.js`, `effects.js`).
2. Character registry and 13 individual character modules (`characterRegistry.js`, `nghi.js`, ..., `vinhtam.js`).
3. Animation sub-modules in exact inheritance sequence (`animationData.js` -> `animation.js`).
4. Input (`input.js`), Combat (`combat.js`), Save manager (`save.js`), Roster (`roster.js`).
5. Feature sub-systems (`investigation.js`, `flashback.js`, `confrontation.js`, `story.js`).
6. Player inheritance chain (`playerBase.js` -> `player.js`).
7. Enemy inheritance chain (`baseEnemy.js` -> `enemy.js`).
8. Bosses, weapons, props (`bosses2.js`, `weapons.js`, `props.js`).
9. World & Stage manager (`stages.js`, `stageManager.js`, `stageRenderer.js`, `scenery.js`).
10. UI & Menu sub-modules (`ranking.js`, `training/*`, `tutorial/*`, `menu/*`).
11. Game engine mixins (`gameBase.js` -> `gameWave.js` -> `gameCamera.js` -> `gameFlow.js` -> `gameStory.js` -> `gameRender.js` -> `game.js`).
12. Bootstrap entry point (`main.js`).

---

## 5. STATE MACHINES

### 5.1 Game State Machine (`game.gameState`)
- `TITLE`: Main cinematic title screen with chapter cards, profile, chronicles, and settings.
- `CHAR_SELECT`: Character roster and combat demo arena.
- `ALLY_SELECT`: 3-column ally deployment modal.
- `PLAYING`: Active gameplay in canvas.
- `PAUSED`: Game loop update paused; modal active.
- `TRAINING`: Võ Đường (Training Dojo) sandbox or drill mode.
- `TUTORIAL`: 10-step guided player tutorial.
- `VICTORY`: Stage cleared; rating and rewards screen.
- `GAMEOVER`: Player defeat; retry / return to menu.

### 5.2 Combat State Machine (`player.state` / `enemy.state`)
- **Locomotion**: `idle`, `walk`, `run`, `jump`, `dash`.
- **Offense**: `punch_1`, `punch_2`, `punch_3`, `kick_1`, `kick_2`, `kick_3`, `flying_kick`, `weapon_strike`, `ultimate`.
- **Defense & Counters**:
  - `dodge`: Invulnerable dash (0.18s i-frame, 8.0s cooldown).
  - `counter_hand_prep`: Stance waiting for incoming hand/heavy strike (0.32s window).
  - `counter_hand_strike`: Active counter strike.
  - `counter_hand_recovery`: Whiff recovery (0.28s).
  - `counter_leg_prep`: Stance waiting for incoming low/leg strike (0.32s window).
  - `counter_leg_strike`: Active leg sweep counter.
  - `counter_leg_recovery`: Whiff recovery (0.32s).
- **Hit Reaction**: `hurt`, `knockdown`, `wall_splat`, `landing`, `getup`, `dead`.
