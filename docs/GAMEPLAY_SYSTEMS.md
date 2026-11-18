# GAMEPLAY SYSTEMS — VOVINAM: HUYẾT CHIẾN GIA TỘC

> **Document ID**: `DOC-SYS-001`  
> **Last Verified**: November 2026 (v5.8.0)  
> **Target Audience**: AI Agents, Gameplay Designers, Combat Engineers

---

## 1. CHARACTER SELECTION, INITIALIZATION & ROSTER

### 1.1 Character Registry Architecture
All 13 playable and boss fighters are registered in `window.characterRegistry` via individual modular scripts (`js/entities/characters/*.js`). Each fighter definition specifies:
- `id`: Internal identifier (e.g. `nghi`, `bichlam`, `huavudai`, `vinhtam`).
- `name`: Full Vietnamese title (e.g. "Ngô Nhất Nghị", "Đình Bích Lâm").
- `title`: Martial moniker (e.g. "Sát Thần Việt Võ Đạo", "Bích Ảnh Sát Thủ").
- `stats`: Base parameters:
  - `maxHp`: 800 - 1400 HP.
  - `atk`: Attack multiplier (0.85 - 1.35).
  - `speed`: Horizontal movement velocity (3.8 - 6.2 px/frame).
  - `defense`: Flat damage reduction percentage.
- `passives`: Real calculated gameplay modifiers (e.g. bonus critical on low HP, bleed stacks, counter damage magnification).
- `ultimate`: Signature finishing technique configuration.

### 1.2 Character Switching & Deployment
- **Campaign**: Players choose their active fighter in the Campaign Hub prior to starting a stage, except where a stage enforces a narrative requirement (`forcedCharacter`).
- **Training Dojo**: Fighter can be switched dynamically via `setPlayerCharacter(id)` which cleanly updates sprites, reset cooldowns, and updates move previews.
- **Ally Deployment & Exclusivity**: The active player character is flagged as `hero-busy` and CANNOT be deployed as an AI ally in the same mission.

---

## 2. PLAYER MOVEMENT & SPATIAL LANES

### 2.1 2.5D Movement Plane
The gameplay field represents a pseudo-3D side-scrolling martial lane:
- **X-Axis**: Forward and backward translation along the stage width (0 to `stage.length`, typically 3000 - 6000px).
- **Y-Axis (Combat Depth)**: Bounded between **`Y = 510px`** (top boundary) and **`Y = 640px`** (bottom boundary). Entities sort rendering order by `y` coordinate (painter's algorithm).
- **Z-Axis (Airborne Altitude)**: Vertical offset for jumping and air kicks. Entity coordinates are `(x, y)` on the ground plane with `z` representing height above ground.

### 2.2 Locomotion States
- `idle`: Standard ready stance.
- `walk`: Directional vector applied at base speed.
- `run`: Double-tap directional input triggers sprint with acceleration.
- `jump`: Parabolic arc with gravity acceleration (`vy += gravity * dt`).

---

## 3. COMBAT ENGINE & ACTION MECHANICS

### 3.1 Normal Combos
- **Punches [Key J]**: 3-stage chain (`punch_1` -> `punch_2` -> `punch_3`). Fast startup (0.12s), low knockback, builds combo meter.
- **Kicks [Key K]**: 3-stage chain (`kick_1` -> `kick_2` -> `kick_3`). Higher range and damage, final kick inflicts soft knockdown.

### 3.2 Airborne Attack: Flying Kick [Space + K]
- Can only be initiated while `z > 0`.
- Transition into `flying_kick` state.
- **Cooldown**: `0.6s` anti-spam timer.
- **Landing Recovery**:
  - On Hit: Smooth recovery lasting `0.55s`.
  - On Whiff (Miss): Recovery penalty of `+0.20s` (`0.75s` total duration).
  - Player is locked in `landing` state and cannot attack or jump until recovery completes.

### 3.3 Evasion: Dodge [Key L]
- **Mechanic**: Rapid slip-step maneuver moving in the facing direction.
- **Invulnerability Window**: **`0.18s`** true invulnerability (i-frame) during which all hitboxes pass through harmlessly.
- **Cooldown**: **`8.0s`** balance cooldown.
- **Spam Protection**: Pressing or holding [L] during the 8-second cooldown is completely ignored; cooldown is not reset.

### 3.4 Vovinam Counters: Hand [U+J] & Leg [U+K]
The core of Vovinam combat relies on tactical counter stances:

| Metric | Counter Tay [U + J] | Counter Chân [U + K] |
| :--- | :--- | :--- |
| **Preparation State** | `counter_hand_prep` | `counter_leg_prep` |
| **Strike State** | `counter_hand_strike` | `counter_leg_strike` |
| **Recovery State** | `counter_hand_recovery` | `counter_leg_recovery` |
| **Active Counter Window** | **`0.32s`** | **`0.32s`** |
| **Cooldown** | **`2.5s`** | **`3.5s`** |
| **Whiff Penalty** | **`0.28s`** | **`0.32s`** |
| **Damage Absorbed** | **100% (0 DMG taken)** | **100% (0 DMG taken)** |
| **Special Effect** | Counters heavy/uncounterable strikes & instantly breaks Red Armor | Trips normal enemies into knockdown; counters punches |
| **Input Forgiveness** | Accepts simultaneous or near-simultaneous U+J | Accepts U+K in any order (K then U or U then K) |

### 3.5 Three-Tier Armor System
Combatants can manifest one of three defensive aura barriers:
1. **White Invulnerability Aura**:
   - Absorbs 100% of all incoming damage (0 DMG taken).
   - Immune to all crowd-control, staggers, and knockdowns.
   - Typically active during player ultimates or boss cinematic phase transitions.
2. **Gold Super Armor (Unbreakable)**:
   - Combatant continues receiving damage.
   - Completely immune to hit stun, stagger, and knockdown (`hurt` and `knockdown` transitions blocked).
   - Cannot be interrupted even by sustained combos.
3. **Red Hyper Armor (Breakable)**:
   - Absorbs staggers and knockdowns up to a threshold (e.g. 100 HP or 3 hits).
   - Decrements `armorHits` with each incoming blow.
   - **Instantly broken** if intercepted by [U+J] or [U+K] counter.
   - When Red Armor breaks, bearer immediately suffers hard knockdown.

---

## 4. WEAPONS & ENVIRONMENTAL PROPS

### 4.1 Weapon Mechanics
- **Pickup [Key E]**: When within interaction proximity of a dropped weapon, [E] picks up or swaps the weapon.
- **Durability System**:
  - Weapons possess finite durability (standard sword/club: 8 durability).
  - Each connecting strike consumes 1 durability.
  - At 1 durability, the attack connects and the weapon shatters immediately.
  - Zero-clamp ensures durability never becomes negative (`-1`, `-2`).
- **Weapon Throw [Key E]**:
  - When holding a weapon and NO ground weapon is in proximity, pressing [E] throws the weapon forward.
  - Thrown weapon deals projectile damage, loses 2 durability, and drops to ground if durability remains. If durability <= 2, it shatters on impact.

### 4.2 Environmental Props
- Wooden barrels and crates populate stages.
- Walking into a crate acts as a physical obstacle; AI pathfinding detects and navigates around props within the `510-640` lane.
- Striking an enemy with combat knockback into a prop causes **Wall-Splat damage** and forces a knockdown.
- The `combatKnockback` flag is cleared immediately upon impact to prevent cascading infinite damage loops.

---

## 5. BOSS ENCOUNTERS & ENEMY AI

### 5.1 Boss Poise & Stagger Mechanics
- Bosses have a dedicated Poise meter displayed on the HUD.
- Single light attacks reduce poise without interrupting the boss.
- Heavy attacks (finishers, flying kicks, weapon hits) deliver large poise damage.
- When Poise reaches 0, the boss suffers **Poise Break** and collapses into knockdown.
- While in knockdown, the boss cannot be hit by Ground-OTG loops.

### 5.2 Post-Getup OTG Immunity
- Upon completing the getup animation, the boss gains **`3.5s` of Knockdown Immunity**.
- During this 3.5s window, the boss can take normal damage, but cannot be knocked down again, preventing infinite knockdown spam.
- Poise gauge instantly resets to 100%.

### 5.3 Boss Dynamic Targeting & Anti-Sandwich AI
- Bosses dynamically evaluate targets between the Player and the summoned Ally.
- **Target Selection Rules**:
  1. If either target is within close range (<80px), engage the closest target.
  2. If both are far (>250px), hunt the target with the **lowest percentage HP**.
  3. If both are close, prioritize executing the target with the lowest HP.
- **Anti-Sandwich / Flank Protection**:
  - When flanked on both sides by Player and Ally, the boss locks facing toward the prioritized target for at least 1.2s to prevent rapid back-and-forth sprite spinning.

---

## 6. USER INTERFACE & AUDIO SYSTEMS

### 6.1 Combat HUD
- **Player Status**: Canvas portrait, animated health bar with delay fill, Vovinam energy gauge.
- **Skill Cooldown Dock**: Real-time badges for [L] Dodge (8s), [U+J] Counter Hand (2.5s), [U+K] Counter Leg (3.5s).
- **Boss Status**: Dynamic boss bar with HP, phase markers (P1/P2/P3), and Poise / Stagger gauge.

### 6.2 Interactive Audio Synthesis
- Built using Web Audio API (`AudioContext`).
- Synthesizes rhythmic beats, bass lines, and dynamic tempos.
- Boss phase shifts automatically trigger increased tempo and intense percussion.
- Martial vocalizations ("Kiai") accompany combos and counter-strikes.
