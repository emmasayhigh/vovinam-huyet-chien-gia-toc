# DEPENDENCY MAP — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-DEP-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Target Audience**: AI Agents, Systems Architects, Integration Engineers

---

## 1. SCRIPT LOAD ORDER GRAPH

Because the game engine runs directly in the browser without a module bundler, all files share the `window` scope and extend classes sequentially.
The `<script>` tag order in `index.html` is strictly enforced:

```
[Layer 1: Audio & Effects]
  js/core/audio.js
  js/core/effects.js
         │
         ▼
[Layer 2: Character Registry & 13 Character Definitions]
  js/entities/characters/characterRegistry.js
  ├── nghi.js
  ├── bichlam.js
  ├── huavudai.js
  ├── dinhan.js
  ├── hoanganh.js
  ├── dunghai.js
  ├── giangmanh.js
  ├── mocdang.js
  ├── haclang.js
  ├── thietquyen.js
  ├── huyetanh.js
  ├── longvuong.js
  └── vinhtam.js
         │
         ▼
[Layer 3: Skeletal Animation Chain]
  js/entities/animation/animationData.js
  └── animationBase.js
        └── animationPose.js
              └── animationRenderBase.js
                    └── animationWeapon.js
                          └── animationBody.js
                                └── js/entities/animation.js
         │
         ▼
[Layer 4: Core Systems & World Engine]
  js/core/input.js ─────────────► js/combat/combat.js
  js/core/save.js  ─────────────► js/entities/roster.js
  js/features/investigation.js  ─► js/features/flashback.js ─► confrontation.js ─► world/story.js
         │
         ▼
[Layer 5: Player Entity Chain]
  js/entities/player/playerBase.js
  └── playerDamage.js
        └── playerUltimate.js
              └── playerInput.js
                    └── js/entities/player.js
         │
         ▼
[Layer 6: Enemy Entity Chain & Combat Items]
  js/entities/enemy/baseEnemy.js
  └── enemyVariants.js
        └── enemyBosses.js
              └── js/entities/enemy.js
  js/entities/bosses2.js
  js/combat/weapons.js
  js/combat/props.js
         │
         ▼
[Layer 7: World Stages & Dojo]
  js/data/stages.js ────────────► stageManager.js ─► stageRenderer.js ─► stages.js ─► scenery.js
  js/ui/ranking.js
  js/data/training.js ──────────► training/trainingDummy.js ─► trainingManagerBase.js
                                       └── trainingModes.js ─► trainingManagerOverlay.js ─► ui/training.js
  js/features/deduction.js
  js/features/bossRush.js
  js/entities/allySystem.js
  js/ui/tutorial/tutorialDummy.js ──► tutorialManagerBase.js ─► tutorialManagerOverlay.js ─► ui/tutorial.js
  js/ui/ui.js
         │
         ▼
[Layer 8: UI & Menu Chain]
  js/ui/menu/charSlots.js
  └── menuBase.js
        └── charselect/charSelectCore.js
              └── charSelectDemo.js
                    └── charSelectDeployment.js
                          └── charSelect.js
                                └── collections.js
                                      └── settings.js
                                            └── chronicles.js
                                                  └── js/ui/menu.js
         │
         ▼
[Layer 9: Game Engine Mixins & Bootstrap]
  js/core/gameBase.js
  └── gameWave.js
        └── gameCamera.js
              └── gameFlow.js
                    └── gameStory.js
                          └── gameRender.js
                                └── js/core/game.js
                                      └── js/core/main.js (Instantiates Game & binds UI)
```

---

## 2. RUNTIME GLOBAL OBJECTS & CONTRACTS

| Global Identifier | Instantiated In | Consumed By | Architectural Role |
| :--- | :--- | :--- | :--- |
| `window.game` | `js/core/main.js` | All UI handlers, game loop | Root game singleton |
| `window.characterRegistry` | `js/entities/characters/characterRegistry.js` | Roster, Player, Menu, Dojo | Fighter database (13 characters) |
| `window.combatManager` | `js/combat/combat.js` | Player, Enemies, Bosses, Weapons | Hitbox collision & counter arbiter |
| `window.saveManager` | `js/core/save.js` | Menu, StageManager, Tutorial | LocalStorage schema v5 manager |
| `window.audioManager` | `js/core/audio.js` | Combat, Menu, Bosses | Web Audio sound effects & BGM |
| `window.effectsManager` | `js/core/effects.js` | Combat, Render, Camera | Particle & screen shake orchestrator |
| `window.roster` | `js/entities/roster.js` | CharSelect, Collections | Fighter metadata & skill cards |
| `window.stageManager` | `js/world/stageManager.js` | Game, Story, Dialogues | 11-stage narrative director |

---

## 3. DOM ELEMENT DEPENDENCIES

The following DOM element IDs in `index.html` are strictly required by JavaScript controllers. Renaming or deleting them without modifying the corresponding code will break game functionality:

### 3.1 Primary Containers & Canvas
- `#game-wrapper`: Root container for CSS scaling.
- `#gameCanvas`: Primary rendering target (1280x720).
- `#ui-layer`: Overlay holding HUD and modals.

### 3.2 Combat HUD Elements (`js/ui/ui.js`)
- `#hud`: Container for in-game HUD (toggled via `.hidden`).
- `#player-hp-fill`, `#player-hp-delay`, `#player-hp-text`: Player health bars.
- `#player-energy-fill`, `#player-energy-text`: Vovinam energy gauge.
- `#badge-dodge`, `#cd-dodge-text`: [L] Dodge badge and cooldown countdown.
- `#badge-counter-hand`, `#cd-counter-hand-text`: [U+J] Counter Hand badge.
- `#badge-counter-leg`, `#cd-counter-leg-text`: [U+K] Counter Leg badge.
- `#boss-hud`, `#boss-hp-fill`, `#boss-poise-fill`: Boss health and poise meters.
- `#alert-banner`, `#alert-text`: Perfect dodge / counter visual callout.

### 3.3 Menu & Modal Overlays (`js/ui/menu/*`)
- `#title-screen`: Cinematic title screen container.
- `#char-select-screen`: Character selection screen.
- `#ally-select-modal`: 3-column ally deployment modal.
- `#training-overlay`: Võ Đường overlay container.
- `#settings-modal`: Settings modal for audio and custom keybindings.
- `#chronicles-modal`: Clan chronicles log modal.
