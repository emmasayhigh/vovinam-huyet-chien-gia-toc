/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/weapons.js — Hệ thống vũ khí thật (Giai đoạn 1 + 2)
 *
 *  - Mỗi đòn có cấu hình riêng: startup / active / recovery, hitbox THEO PHA (chỉ gây sát thương ở pha active)
 *  - 3 loại địch có vũ khí: Côn thủ, Đao thủ, Khiên giáp (cùng một engine ArmedEnemy, hành vi riêng)
 *  - Vũ khí bị đánh rơi -> vật thể trong thế giới -> người chơi nhặt [E], dùng có độ bền
 *  - Địch mất vũ khí chuyển sang đánh tay không (dùng bộ đòn BaseEnemy)
 *  - Tùy chọn giảm rung màn hình / giảm flash (window.fxSettings)
 */
(function () {
  'use strict';

  // ==========================================================================
  // 0. TÙY CHỌN TIẾP CẬN (giảm rung / giảm flash) — lưu localStorage
  // ==========================================================================
  const FX_KEY = 'vovinam_fx_settings';
  const fx = { reduceShake: false, reduceFlash: false };
  try { Object.assign(fx, JSON.parse(localStorage.getItem(FX_KEY) || '{}')); } catch (_) { /* bỏ qua */ }
  fx.save = function () {
    try { localStorage.setItem(FX_KEY, JSON.stringify({ reduceShake: fx.reduceShake, reduceFlash: fx.reduceFlash })); } catch (_) { /* bỏ qua */ }
  };
  window.fxSettings = fx;

  const U = () => window.AnimUtil;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ==========================================================================
  // 1. CẤU HÌNH ĐÒN VŨ KHÍ (dữ liệu, dễ tinh chỉnh)
  //    box(t): hitbox tại thời điểm t∈[0,1] của pha active (hitbox đi theo đường vũ khí quét qua)
  // ==========================================================================
  const ENEMY_ATTACKS = {
    // ---- CÔN THỦ: quét ngang (tầm xa, né ngang/lướt vào) & đập dọc (báo hiệu lâu, không đỡ được) ----
    baton_sweep: {
      state: 'wp_baton_sweep', startup: 0.52, active: 0.17, recovery: 0.60,
      damage: 30, knockback: 220, weight: 'heavy',
      weaponEffect: 'stun', stunChance: 0.20, stunDuration: 0.5, bossPoiseDmg: 15,
      box: (t) => ({ offsetX: 78 + 26 * t, offsetY: -72, width: 34, height: 44 })
    },
    baton_slam: {
      state: 'wp_baton_slam', startup: 0.78, active: 0.14, recovery: 0.85,
      damage: 44, knockback: 300, weight: 'heavy', knockdown: true, unblockable: true,
      weaponEffect: 'stun', stunChance: 0.80, stunDuration: 0.8, bossPoiseDmg: 25,
      box: () => ({ offsetX: 96, offsetY: -100, width: 22, height: 112 })
    },
    // ---- ĐAO THỦ: chém nhanh, chém ngang rộng, lao tới (recovery dài) ----
    blade_slash: {
      state: 'wp_blade_slash', startup: 0.28, active: 0.12, recovery: 0.32, link: 0.06,
      damage: 20, knockback: 150, weight: 'light',
      weaponEffect: 'bleed', bleedChance: 0.25, bleedDmg: 2,
      box: (t) => ({ offsetX: 56 + 12 * t, offsetY: -78, width: 46, height: 50 })
    },
    blade_chop: {
      state: 'wp_blade_chop', startup: 0.36, active: 0.15, recovery: 0.38, link: 0.1,
      damage: 24, knockback: 200, weight: 'light',
      weaponEffect: 'bleed', bleedChance: 0.30, bleedDmg: 2,
      box: (t) => ({ offsetX: 52 + 26 * t, offsetY: -72, width: 64, height: 42 })
    },
    blade_lunge: {
      state: 'wp_blade_lunge', startup: 0.46, active: 0.20, recovery: 0.90, lunge: 360,
      damage: 32, knockback: 280, weight: 'heavy',
      weaponEffect: 'bleed', bleedChance: 0.80, bleedDmg: 3,
      box: (t) => ({ offsetX: 60 + 14 * t, offsetY: -66, width: 50, height: 52 })
    },
    // ---- KHIÊN GIÁP: đánh bằng khiên, đẩy khiên (đẩy lùi mạnh, recovery dài) ----
    shield_strike: {
      state: 'wp_shield_strike', startup: 0.50, active: 0.14, recovery: 0.62,
      damage: 24, knockback: 200, weight: 'light',
      box: () => ({ offsetX: 54, offsetY: -80, width: 50, height: 70 })
    },
    shield_bash: {
      state: 'wp_shield_bash', startup: 0.72, active: 0.20, recovery: 0.90, lunge: 300,
      damage: 16, knockback: 430, weight: 'heavy',
      box: () => ({ offsetX: 52, offsetY: -90, width: 60, height: 90 })
    }
  };

  // Đòn của người chơi khi cầm vũ khí nhặt được (nhanh hơn địch, độ bền hữu hạn)
  const PLAYER_ATTACKS = {
    baton_sweep: {
      state: 'wp_baton_sweep', startup: 0.22, active: 0.14, recovery: 0.34,
      damage: 46, knockback: 300, weight: 'heavy', energyGain: 8,
      weaponEffect: 'stun', stunChance: 0.30, stunDuration: 0.8, bossPoiseDmg: 15,
      box: (t) => ({ offsetX: 70 + 28 * t, offsetY: -72, width: 40, height: 48 })
    },
    baton_slam: {
      state: 'wp_baton_slam', startup: 0.34, active: 0.12, recovery: 0.52,
      damage: 78, knockback: 320, weight: 'heavy', knockdown: true, energyGain: 12,
      weaponEffect: 'stun', stunChance: 1.0, stunDuration: 1.4, bossPoiseDmg: 25,
      box: () => ({ offsetX: 84, offsetY: -100, width: 36, height: 112 })
    },
    blade_slash: {
      state: 'wp_blade_slash', startup: 0.14, active: 0.10, recovery: 0.20,
      damage: 34, knockback: 200, weight: 'light', energyGain: 7,
      weaponEffect: 'bleed', bleedChance: 0.35, bleedDmg: 7,
      box: (t) => ({ offsetX: 56 + 14 * t, offsetY: -78, width: 50, height: 50 })
    },
    blade_chop: {
      state: 'wp_blade_chop', startup: 0.18, active: 0.12, recovery: 0.26,
      damage: 40, knockback: 240, weight: 'light', energyGain: 8,
      weaponEffect: 'bleed', bleedChance: 0.35, bleedDmg: 7,
      box: (t) => ({ offsetX: 54 + 26 * t, offsetY: -72, width: 70, height: 44 })
    },
    blade_lunge: {
      state: 'wp_blade_lunge', startup: 0.30, active: 0.16, recovery: 0.50, lunge: 320,
      damage: 64, knockback: 380, weight: 'heavy', energyGain: 12,
      weaponEffect: 'bleed', bleedChance: 1.0, bleedDmg: 8,
      box: (t) => ({ offsetX: 62 + 16 * t, offsetY: -66, width: 56, height: 54 })
    },
    shield_strike: {
      state: 'wp_shield_strike', startup: 0.16, active: 0.12, recovery: 0.24,
      damage: 36, knockback: 290, weight: 'light', energyGain: 7, bossPoiseDmg: 16,
      box: (t) => ({ offsetX: 46 + 18 * t, offsetY: -78, width: 46, height: 58 })
    },
    shield_bash: {
      state: 'wp_shield_bash', startup: 0.24, active: 0.14, recovery: 0.36, lunge: 260,
      damage: 58, knockback: 440, weight: 'heavy', knockdown: true, energyGain: 12,
      weaponEffect: 'stun', stunChance: 0.75, stunDuration: 1.0, bossPoiseDmg: 28,
      box: (t) => ({ offsetX: 52 + 24 * t, offsetY: -80, width: 54, height: 64 })
    },
    weapon_throw: {
      state: 'wp_throw', startup: 0.105, active: 0.14, recovery: 0.17,
      damage: 0, knockback: 0, weight: 'light'
    }
  };

  // Cấu hình vũ khí nhặt được
  const WEAPON_DEFS = {
    baton: {
      name: 'CÔN', stance: 'baton', styleWeapon: 'baton', durability: 8, pickable: true, color: '#38bdf8',
      effect: 'stun', effectName: 'GÂY CHOÁNG', effectIcon: '💫',
      light: ['baton_sweep', 'baton_sweep'], heavy: ['baton_slam']
    },
    blade: {
      name: 'MÃ TẤU', stance: 'blade', styleWeapon: 'machete', durability: 9, pickable: true, color: '#f43f5e',
      effect: 'bleed', effectName: 'XUẤT HUYẾT', effectIcon: '🩸',
      light: ['blade_slash', 'blade_chop'], heavy: ['blade_lunge']
    },
    shield: {
      name: 'KHIÊN', stance: 'shield', styleWeapon: 'riot_shield', durability: 10, pickable: true, color: '#38bdf8',
      effect: 'guard', effectName: 'CHẮN & ĐẨY', effectIcon: '🛡️',
      light: ['shield_strike'], heavy: ['shield_bash']
    }
  };

  // ==========================================================================
  // 2. POSE ĐÒN VŨ KHÍ (nội suy: rest -> wind (startup) -> strike (active) -> rest (recovery))
  //    Quy ước góc như animation.js: 0 = buông xuống, + = vung về phía trước.
  // ==========================================================================
  window.WP_POSES = {
    wp_baton_sweep: {
      wind:   { torso: -0.32, head: 0.12, hx: -6, lift: -1.5, nA: -0.95, nE: 0.55, grip: 0.35, fA: 0.45, fE: 1.65, nT: 0.52, nS: -0.85, fT: -0.72, fS: 0.22 },
      strike: { torso: 0.38,  head: -0.14, hx: 8,  lift: -2.5, nA: 1.48,  nE: 0.12, grip: -0.72, fA: -0.35, fE: 1.25, nT: 1.05, nS: -0.95, fT: -0.82, fS: 0.12 }
    },
    wp_baton_slam: {
      wind:   { torso: -0.34, head: -0.18, hx: -5, lift: 3.5,  nA: 2.65,  nE: 0.35, grip: 0.42, fA: 1.85, fE: 0.85, nT: 0.48, nS: -0.75, fT: -0.65, fS: 0.18 },
      strike: { torso: 0.54,  head: 0.15,  hx: 9,  lift: -4.5, nA: 0.28,  nE: 0.15, grip: -0.85, fA: -0.25, fE: 1.1, nT: 1.15, nS: -1.15, fT: -0.85, fS: 0.2 }
    },
    wp_blade_slash: {
      wind:   { torso: -0.22, head: 0.08, hx: -4, lift: -1,   nA: 2.15,  nE: 0.65, grip: 0.38, fA: 0.45, fE: 1.85, nT: 0.65, nS: -0.9, fT: -0.65, fS: 0.2 },
      strike: { torso: 0.38,  head: -0.12, hx: 7, lift: -2,   nA: 0.42,  nE: 0.18, grip: -0.68, fA: -0.25, fE: 1.5, nT: 0.98, nS: -0.95, fT: -0.78, fS: 0.15 }
    },
    wp_blade_chop: {
      wind:   { torso: -0.28, head: 0.1,  hx: -5, lift: -1.5, nA: -0.85, nE: 0.75, grip: 0.45, fA: 0.55, fE: 1.75, nT: 0.58, nS: -0.85, fT: -0.7, fS: 0.2 },
      strike: { torso: 0.36,  head: -0.1, hx: 8,  lift: -2.5, nA: 1.45,  nE: 0.08, grip: -0.78, fA: -0.35, fE: 1.35, nT: 1.06, nS: -0.98, fT: -0.84, fS: 0.15 }
    },
    wp_blade_lunge: {
      wind:   { torso: 0.28,  head: -0.12, hx: -5, lift: -4,  nA: -0.45, nE: 1.15, grip: -0.35, fA: 0.65, fE: 1.65, nT: 1.1, nS: -1.45, fT: -0.85, fS: 0.22 },
      strike: { torso: 0.52,  head: -0.22, hx: 12, lift: -3,  nA: 1.08,  nE: 0.05, grip: -1.12, fA: -0.45, fE: 0.85, nT: 1.38, nS: -0.45, fT: -0.98, fS: 0.18 }
    },
    wp_shield_strike: {
      wind:   { torso: -0.18, head: 0.06, hx: -4, nA: 0.35,  nE: 1.55, fA: 0.55, fE: 1.85, nT: 0.65, nS: -0.9 },
      strike: { torso: 0.36,  head: -0.1, hx: 8,  nA: 1.32,  nE: 0.28, fA: 0.15, fE: 1.65, nT: 0.98, nS: -0.95 }
    },
    wp_shield_bash: {
      wind:   { torso: -0.26, head: 0.08, hx: -6, lift: -2,  nA: 0.45,  nE: 1.75, fA: 0.5,  fE: 1.85, nT: 0.88, nS: -1.15, fT: -0.72, fS: 0.22 },
      strike: { torso: 0.46,  head: -0.18, hx: 13, lift: -3, nA: 1.38,  nE: 0.35, fA: 0.95, fE: 1.15, nT: 1.12, nS: -0.78, fT: -0.88, fS: 0.15 }
    },
    wp_throw: {
      wind:   { torso: -0.35, head: 0.12, hx: -6, lift: 2.5,  nA: -1.55, nE: 1.28, grip: 0.85,  fA: 1.05,  fE: 0.42, nT: 0.48, nS: -0.78, fT: -0.72, fS: 0.18 },
      strike: { torso: 0.50,  head: -0.14, hx: 10, lift: -3.0, nA: 1.62,  nE: 0.06, grip: -0.95, fA: -0.42, fE: 1.15, nT: 1.18, nS: -0.82, fT: -0.88, fS: 0.16 }
    },
    // Tư thế tĩnh
    wp_turn:    { statics: { torso: 0.1, head: -0.18, nA: 0.42, nE: 0.85, grip: -0.15, fA: 0.35, fE: 1.1, nT: 0.55, nS: -0.75 }, sway: 1.6 },
    wp_stagger: { statics: { torso: -0.38, head: -0.32, hx: -4, nA: -0.3, nE: 0.8, grip: 0.25, fA: -0.5, fE: 0.7, nT: 0.35, nS: -0.5, fT: -0.7, fS: 0.1 }, sway: 2.2 }
  };

  window.WP_STANCES = {
    baton:  { idle: { torso: 0.22, head: -0.06, nA: 0.72, nE: 1.32, grip: -0.18, fA: 0.55, fE: 1.65 },
              walk: { torso: 0.24, head: -0.06, nA: 0.68, nE: 1.28, grip: -0.18, fA: 0.52, fE: 1.62 } },
    blade:  { idle: { torso: 0.32, head: -0.1, nT: 0.88, nS: -1.12, fT: -0.75, fS: 0.22, nA: 0.78, nE: 0.92, grip: -0.22, fA: 0.38, fE: 1.85 },
              walk: { torso: 0.3,  head: -0.08, nA: 0.76, nE: 0.9, grip: -0.22, fA: 0.36, fE: 1.85 } },
    shield: { idle: { torso: 0.24, head: -0.06, nT: 0.82, nS: -1.0, fT: -0.65, fS: 0.2, nA: 0.92, nE: 0.72, fA: 0.6, fE: 1.85 },
              walk: { torso: 0.22, head: -0.06, nA: 0.9,  nE: 0.72, fA: 0.6, fE: 1.85 } }
  };

  // Báo cho renderer biết các trạng thái đòn vũ khí là "trạng thái ra đòn"
  ['wp_baton_sweep', 'wp_baton_slam', 'wp_blade_slash', 'wp_blade_chop', 'wp_blade_lunge', 'wp_shield_strike', 'wp_shield_bash', 'wp_throw']
    .forEach((s) => { if (window.ATTACK_STATES) window.ATTACK_STATES.add(s); });

  // ==========================================================================
  // 3. ĐỊCH CÓ VŨ KHÍ — một engine, nhiều hành vi
  // ==========================================================================
  const KINDS = {
    baton:  { type: 'enemy_baton',  name: 'Côn Thủ',     hp: 205, speed: 120, weapon: 'baton', stance: 'baton' },
    blade:  { type: 'enemy_blade',  name: 'Đao Thủ',     hp: 170, speed: 165, weapon: 'blade', stance: 'blade' },
    shield: { type: 'enemy_shield', name: 'Khiên Giáp',  hp: 310, speed: 85,  weapon: 'shield', stance: 'shield' }
  };

  function playerLocked(player) {
    const s = player.state;
    if (player.isDead) return false;
    if (s === 'hurt' || s === 'knockdown' || s === 'getup') return true;
    if ((player.exhaustTimer || 0) > 0) return true;
    if (window.ATTACK_STATES && window.ATTACK_STATES.has(s) && player.stateDuration > 0) {
      return player.stateTimer / player.stateDuration > 0.55; // đang ở nửa sau (recovery) của đòn
    }
    return false;
  }

  class ArmedEnemy extends BaseEnemy {
    constructor(x, y, kind) {
      const k = KINDS[kind];
      super(x, y, k.type, k.name);
      this.kind = kind;
      this.weaponType = k.weapon;
      this.stance = k.stance;
      this.maxHp = k.hp; this.hp = k.hp;
      this.speed = k.speed;
      this.armed = true;
      this.atk = null;
      this.phaseName = null;
      this.queue = [];
      this.forceNext = null;
      this._wpActive = false;
      this._tele = false;
      this.evadeCd = 0;
      this.breakThreshold = 5;
    }

    setState(s, d = 0) {
      super.setState(s, d);
      // Đòn vũ khí tự quản thời gian: không bị nhân thêm hệ số "kéo dài gồng" của BaseEnemy
      if (typeof s === 'string' && s.indexOf('wp_') === 0 && d > 0) this.stateDuration = d;
    }

    // ---------------- Khởi động đòn ----------------
    beginAttack(key, player) {
      const a = Object.assign({}, ENEMY_ATTACKS[key], { key });
      a.recoveryEff = (this.queue.length > 0 && a.link !== undefined) ? a.link : a.recovery;
      this.atk = a;
      this.phaseName = 'startup';
      this.facing = (player.x >= this.x) ? 1 : -1;
      this.setState(a.state, a.startup + a.active + a.recoveryEff);
      this.isAttacking = true;
      this._recoveryOpened = false;
      if (window.audioManager) window.audioManager.playWarning();
    }

    runAttack(dt, player) {
      const a = this.atk;
      const t = this.stateTimer;
      const su = a.startup, ac = a.active;
      if (t < su) {
        this.phaseName = 'startup';
        this.isAttacking = true;
        this._tele = t > su * 0.3;
        this._wpActive = false;
        if (a.lunge) this.vx *= 0.4;            // lấy đà: dừng lại, không trượt
      } else if (t < su + ac) {
        this.phaseName = 'active';
        this.isAttacking = true;
        this._tele = false;
        this._wpActive = true;
        if (a.lunge) this.vx = this.facing * a.lunge;
        const box = a.box(clamp((t - su) / ac));
        const hitPayload = {
          damage: a.damage, knockback: a.knockback, weight: a.weight,
          knockdown: !!a.knockdown, unblockable: !!a.unblockable,
          isKick: !!a.isKick, counterType: a.counterType || (a.isKick ? 'leg' : 'hand'),
          weaponEffect: a.weaponEffect,
          bleedChance: a.bleedChance, bleedDmg: a.bleedDmg,
          stunChance: a.stunChance, stunDuration: a.stunDuration, bossPoiseDmg: a.bossPoiseDmg,
          offsetX: box.offsetX, offsetY: box.offsetY, width: box.width, height: box.height
        };
        if (typeof this.deliverAttackHit === 'function') {
          this.deliverAttackHit(player, hitPayload);
        } else {
          window.combatSystem.checkAttackHit(this, player, hitPayload);
        }
      } else if (t < a.recoveryEff + su + ac) {
        this.phaseName = 'recovery';
        this.isAttacking = false;                // recovery: có thể bị đánh gián đoạn
        this._tele = false;
        this._wpActive = (t - su - ac) < 0.08;
        if (!this._recoveryOpened && this.queue.length === 0) {
          this._recoveryOpened = true;
          this.openWeakWindow(a.recoveryEff * 0.9);   // cửa sổ phản công
        }
      } else {
        this.finishAttack(player);
      }
    }

    finishAttack(player) {
      this.atk = null; this.phaseName = null; this._wpActive = false; this._tele = false;
      if (this.queue.length) {
        this.beginAttack(this.queue.shift(), player);
        return;
      }
      this.setState('idle');
      this.attackCooldown = this.afterAttackCooldown();
      this.onChainEnd(player);
    }

    afterAttackCooldown() { return 0.9 + Math.random() * 0.5; }
    onChainEnd() { /* ghi đè theo loại */ }

    // ---------------- Vòng đời AI ----------------
    updateAI(dt, player) {
      if (this.atk && this.state !== this.atk.state) { this.atk = null; this.phaseName = null; this._wpActive = false; this._tele = false; }
      if (this.evadeCd > 0) this.evadeCd -= dt;

      if (this.stunTimer > 0) {
        this.atk = null; this.phaseName = null; this._wpActive = false; this._tele = false; this.queue = [];
        this.isAttacking = false;
        return super.updateAI(dt, player);
      }
      if (this.state === 'hurt' || this.state === 'knockdown' || this.state === 'getup') { this._wpActive = false; this._tele = false; return super.updateAI(dt, player); }
      if (this.state === 'wp_stagger') {
        if (this.stateTimer >= this.stateDuration) this.setState('idle');
        return;
      }
      if (this.state === 'dodge') {
        if (this.stateTimer >= this.stateDuration) this.setState('idle');
        return;
      }
      if (!this.armed) return super.updateAI(dt, player);   // tay không: dùng bộ đòn BaseEnemy

      const target = (typeof this.selectCombatTarget === 'function') ? (this.selectCombatTarget(player) || player) : player;
      if (this.atk) { this.runAttack(dt, target); return; }
      this.brain(dt, target);
    }

    // Di chuyển giữ khoảng cách: wantDist = cự ly ưa thích; trả về dist
    steer(player, wantDist, speedMul = 1) {
      const dx = player.x - this.x, dy = player.y - this.y;
      const adx = Math.abs(dx);
      let moving = false;
      this.vx = 0; this.vy = 0;
      if (adx > wantDist + 16) { this.vx = Math.sign(dx) * this.speed * speedMul; moving = true; }
      else if (adx < wantDist - 20) { this.vx = -Math.sign(dx) * this.speed * 0.7 * speedMul; moving = true; }
      if (Math.abs(dy) > 14 && adx < 300) { this.vy = Math.sign(dy) * this.speed * 0.6 * speedMul; moving = true; }
      this.setState(moving ? 'walk' : 'idle');
      return adx;
    }

    canStrike(player, minD, maxD) {
      const dx = Math.abs(player.x - this.x), dy = Math.abs(player.y - this.y);
      return this.attackCooldown <= 0 && !player.isDead && dy < 32 && dx >= minD && dx <= maxD;
    }

    wantsToken() { return !window.game || window.game.requestAttackToken(this); }

    brain() { /* ghi đè */ }

    // ---------------- Nhận sát thương / mất vũ khí ----------------
    takeDamage(amount, knockbackX = 0, isKnockdown = false) {
      if (this.isDead || this.invincibleTimer > 0) return;
      knockbackX = BaseEnemy.resolveKnockback ? BaseEnemy.resolveKnockback(knockbackX) : (Number.isFinite(knockbackX) ? knockbackX : 0);
      const hit = this.pendingHit || {};
      if (this.armed && this.preDamage && this.preDamage(amount, knockbackX, isKnockdown, hit)) return;

      const vulnerable = this.phaseName === 'recovery' || this.state === 'wp_stagger' || this.state === 'wp_turn';
      // Điều kiện đánh rơi: Perfect Counter / quật ngã / đòn tối thượng / đòn nặng trúng lúc sơ hở
      const wantDrop = this.armed && (hit.isCrit || hit.weight === 'ultimate' || isKnockdown ||
        (hit.weight === 'heavy' && vulnerable));
      super.takeDamage(amount, knockbackX, isKnockdown);
      if (wantDrop) this.dropWeapon(this.isDead);
    }

    dropWeapon(onDeath) {
      if (!this.armed) return;
      this.armed = false;
      this.atk = null; this.phaseName = null; this.queue = []; this._wpActive = false; this._tele = false;
      this.isAttacking = false;
      this.stance = null;
      this.holdFacing = false;
      if (window.weaponSystem) window.weaponSystem.spawnDrop(this.weaponType, this.x + this.facing * 24, this.y, this.facing);
      if (onDeath) return;
      this.speed *= 1.12;
      this.preferredDist = 66 + Math.random() * 20;
      this.followupChance = 0.2;
      this.attackCooldown = Math.max(this.attackCooldown, 0.8);
      if (window.effectManager) window.effectManager.addFloatingText('MẤT VŨ KHÍ!', this.x, this.y - 150, 'warn');
      if (this.state !== 'knockdown' && this.state !== 'hurt') this.setState('wp_stagger', 0.55);
    }

    // Tay không (sau khi mất vũ khí) dùng bộ đòn của BaseEnemy
    startAttackSequence(player) { return BaseEnemy.prototype.startAttackSequence.call(this, player); }
    checkAttackPlayer(player) { return BaseEnemy.prototype.checkAttackPlayer.call(this, player); }
  }

  // --------------------------------------------------------------------------
  // CÔN THỦ — kiểm soát khoảng cách, quét ngang, trừng phạt người chơi bị khóa recovery
  // --------------------------------------------------------------------------
  class EnemyBaton extends ArmedEnemy {
    constructor(x, y) {
      super(x, y, 'baton');
      this.keepDist = 104 + Math.random() * 12;
    }
    afterAttackCooldown() { return 1.0 + Math.random() * 0.6; }
    brain(dt, player) {
      const adx = this.steer(player, this.keepDist);
      // Bị áp sát sát người: lùi chậm lấy khoảng, không ra đòn bừa
      if (adx < 52) {
        this.vx = -Math.sign(player.x - this.x) * this.speed * 0.55;
        this.attackCooldown = Math.max(this.attackCooldown, 0.35);
        return;
      }
      if (this.canStrike(player, 62, 128)) {
        const punish = playerLocked(player);
        if (!this.wantsToken()) return;
        const useSlam = punish && adx >= 66 && adx <= 124 && Math.random() < 0.8;
        this.beginAttack(useSlam ? 'baton_slam' : 'baton_sweep', player);
      }
    }
  }

  // --------------------------------------------------------------------------
  // ĐAO THỦ — áp lực gần, chuỗi ngắn + recovery rõ, đọc nhịp lặp lại của người chơi
  // --------------------------------------------------------------------------
  class EnemyBlade extends ArmedEnemy {
    constructor(x, y) {
      super(x, y, 'blade');
      this.keepDist = 58 + Math.random() * 14;
      this.strafeTimer = 2 + Math.random() * 2;
      this.strafeDir = Math.random() < 0.5 ? -1 : 1;
    }
    afterAttackCooldown() { return 0.7 + Math.random() * 0.5; }
    onChainEnd() {
      // Sau chuỗi: lùi nhẹ ra khỏi tầm (kết thúc bằng khoảng recovery đã mở ở runAttack)
      this.vx = -this.facing * 190;
    }
    playerIsSpamming() {
      const log = (window.combatSystem && window.combatSystem.playerMoveLog) || [];
      if (log.length < 3) return false;
      const last = log.slice(-3);
      return last[0] === last[1] && last[1] === last[2];
    }
    brain(dt, player) {
      const adx = Math.abs(player.x - this.x);
      // Đọc thói quen: người chơi lặp một đòn -> lùi né rồi phản công bằng đòn lao
      if (this.evadeCd <= 0 && adx < 96 && this.playerIsSpamming() && Math.random() < 0.5) {
        this.evadeCd = 3.5;
        this.facing = (player.x >= this.x) ? 1 : -1;
        this.vx = -this.facing * 340;
        this.forceNext = 'blade_lunge';
        this.attackCooldown = 0.25;
        this.setState('dodge', 0.28);
        if (window.audioManager) window.audioManager.playDodge();
        if (window.effectManager) window.effectManager.addFloatingText('ĐỌC NHỊP!', this.x, this.y - 150, 'warn');
        return;
      }
      // Người chơi giữ khoảng cách xa: đổi hướng (đi vòng) thay vì đứng nhìn
      this.strafeTimer -= dt;
      if (adx > 150 && this.strafeTimer <= 0) { this.strafeTimer = 1.5 + Math.random() * 1.5; this.strafeDir *= -1; }
      this.steer(player, this.keepDist, adx > 150 ? 1.15 : 1);
      if (adx > 150) this.vy = this.strafeDir * this.speed * 0.5;

      if (this.canStrike(player, 0, 92)) {
        if (!this.wantsToken()) return;
        if (this.forceNext) {
          const k = this.forceNext; this.forceNext = null;
          this.beginAttack(k, player);
          return;
        }
        const r = Math.random();
        this.queue = [];
        if (r < 0.62) this.queue.push('blade_chop');
        if (r < 0.2) this.queue.push('blade_lunge');
        this.beginAttack('blade_slash', player);
      }
    }
  }

  // --------------------------------------------------------------------------
  // KHIÊN GIÁP — chặn đòn phía trước, xoay người chậm, đẩy khiên có báo hiệu
  // --------------------------------------------------------------------------
  class EnemyShield extends ArmedEnemy {
    constructor(x, y) {
      super(x, y, 'shield');
      this.holdFacing = true;     // hướng khiên chỉ đổi khi hoàn tất xoay người
      this.guardMeter = 100;
      this.turnWait = 0;
      this.turnTo = -1;
      this.keepDist = 78;
      this.breakThreshold = 8;
    }
    afterAttackCooldown() { return 1.1 + Math.random() * 0.6; }

    isGuarding() {
      if (!this.armed) return false;
      if (this.state === 'idle' || this.state === 'walk') return true;
      if (this.atk && (this.phaseName === 'startup' || this.phaseName === 'active')) return true;
      return false;
    }

    // Chỉ chặn đòn tới từ phía mặt (hướng khiên), không chặn từ sau lưng
    fromFront(hit) {
      const fromX = (typeof hit.fromX === 'number') ? hit.fromX : (this.x + this.facing * 40);
      return Math.sign(fromX - this.x) === this.facing;
    }

    preDamage(amount, kb, isKnockdown, hit) {
      if (!this.isGuarding() || !this.fromFront(hit) || hit.isCrit || hit.weight === 'ultimate') return false;
      if (hit.unblockable) {
        // Đòn chỏ / quét trụ / unblockable: phá thế khiên
        this.breakGuard();
        return false;   // vẫn nhận sát thương đầy đủ
      }
      this.pendingHit = null;
      const heavy = hit.weight === 'heavy' || isKnockdown;
      this.guardMeter -= heavy ? 42 : 14;
      this.hp = Math.max(1, this.hp - Math.max(1, Math.ceil(amount * (heavy ? 0.2 : 0.1))));
      this.invincibleTimer = 0.05;
      this.vx = -this.facing * (heavy ? 90 : 40);
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) {
        window.effectManager.createHitSparks(this.x + this.facing * 26, this.y - 90, heavy ? 8 : 4, false);
        window.effectManager.addFloatingText('CHẶN', this.x, this.y - 140, 'block');
      }
      if (this.guardMeter <= 0) this.breakGuard();
      return true;
    }

    breakGuard() {
      this.guardMeter = 60;
      this.atk = null; this.phaseName = null; this._wpActive = false; this._tele = false; this.queue = [];
      this.isAttacking = false;
      this.setState('wp_stagger', 1.1);
      this.openWeakWindow(1.1);
      if (window.audioManager) window.audioManager.playHeavyHit();
      if (window.effectManager) {
        window.effectManager.createHitSparks(this.x + this.facing * 24, this.y - 85, 14, true);
        window.effectManager.addFloatingText('PHÁ THỦ!', this.x, this.y - 160, 'weak');
      }
    }

    startTurn(side) {
      this.turnTo = side;
      this.atk = null;
      this.setState('wp_turn', 0.7);
      this.vx = 0;
      this.openWeakWindow(0.7);   // lưng lộ trong lúc xoay
    }

    updateAI(dt, player) {
      if (this.state === 'wp_turn') {
        this.vx *= 0.5;
        if (this.stateTimer >= this.stateDuration) {
          this.facing = this.turnTo;
          this.setState('idle');
          this.attackCooldown = Math.max(this.attackCooldown, 0.35);
        }
        return;
      }
      if (this.guardMeter < 100 && this.state !== 'wp_stagger') this.guardMeter = Math.min(100, this.guardMeter + 8 * dt);
      return super.updateAI(dt, player);
    }

    brain(dt, player) {
      const side = Math.sign(player.x - this.x) || this.facing;
      if (side !== this.facing && Math.abs(player.x - this.x) > 14) {
        this.turnWait += dt;
        this.vx *= 0.5; this.vy = 0;
        this.setState('idle');
        if (this.turnWait > 0.28) { this.turnWait = 0; this.startTurn(side); }
        return;
      }
      this.turnWait = 0;
      const adx = this.steer(player, this.keepDist);
      if (this.canStrike(player, 0, 96)) {
        if (!this.wantsToken()) return;
        this.beginAttack(adx < 100 && Math.random() < 0.38 ? 'shield_bash' : 'shield_strike', player);
      }
    }

    // Hạ gục / bị đánh bay khiên
    dropWeapon(onDeath) {
      if (!this.armed) return;
      super.dropWeapon(onDeath);
      this.holdFacing = false;
    }
  }

  // ==========================================================================
  // 3b. CÁC LOẠI ĐỊCH MỞ RỘNG (GIAI ĐOẠN 3)
  //  1. EnemyArmored: Thiết giáp (siêu giáp kháng đòn nhẹ, đập búa/bổ ngực AoE, húc vai)
  //  2. EnemyThrower: Địch ném xa (giữ khoảng cách, chạy lùi khi áp sát, ném chai/gạch)
  //  3. EnemyBrawler: Võ sĩ tay không (đọc thói quen spam của người chơi, né ngang + phản đòn 1-2)
  //  4. EnemyGrabber: Địch trói bắt (phóng xích kéo người chơi, nếu hụt bị khựng dài)
  //  5. EnemyMedic: Y tá chiến trường (hồi máu cho đồng đội bị thương, ngắt đòn khi bị đánh)
  // ==========================================================================

  // --- 1. THIẾT GIÁP (EnemyArmored) ---
  class EnemyArmored extends BaseEnemy {
    constructor(x, y, faction = 'general') {
      super(x, y, 'enemy_armored', 'Thiết Giáp Binh');
      this.faction = faction;
      this.maxHp = 380;
      this.hp = 380;
      this.speed = 85;
      this.armorAll = true; // Siêu giáp: đòn nhẹ không làm chùn bước
      this.breakThreshold = 6;
      this.chargeCooldown = 2.0;
      this.smashCooldown = 1.0;
      this.preferredDist = 75;
    }

    takeDamage(amount, knockbackX = 0, isKnockdown = false) {
      knockbackX = BaseEnemy.resolveKnockback ? BaseEnemy.resolveKnockback(knockbackX) : (Number.isFinite(knockbackX) ? knockbackX : 0);
      const hit = this.pendingHit || null;
      const weight = hit ? hit.weight : (isKnockdown ? 'heavy' : 'light');
      // Đòn nhẹ: nhận sát thương nhưng KHÔNG bị gián đoạn hoạt ảnh
      if (weight === 'light' && !isKnockdown && !hit?.isCrit && this.hp > amount) {
        this.hp -= amount;
        this.invincibleTimer = 0.04;
        if (window.effectManager) {
          window.effectManager.createHitSparks(this.x, this.y - 70, 6, false);
          window.effectManager.addFloatingText('SIÊU GIÁP', this.x, this.y - 145, 'stale');
        }
        if (window.audioManager) window.audioManager.playBlock();
        return;
      }
      super.takeDamage(amount, knockbackX * 0.45, isKnockdown);
    }

    updateAI(dt, player) {
      if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
      if (this.smashCooldown > 0) this.smashCooldown -= dt;

      // Xử lý đòn húc lao tới
      if (this.state === 'ram_charge') {
        this.vx = this.facing * 360;
        if (window.AnimUtil && AnimUtil.isActive(this)) {
          const hitData = { damage: 38, offsetX: 50, offsetY: -75, width: 85, height: 60, knockback: 12, knockdown: true, unblockable: true, weight: 'heavy' };
          this.deliverAttackHit(player, hitData);
        }
        if (this.stateTimer >= this.stateDuration) {
          this.setState('idle');
          this.chargeCooldown = 4.0;
        }
        return;
      }

      // Xử lý đòn bổ ngực / đập đất
      if (this.state === 'overhead_smash') {
        if (this.stateTimer > 0.45 && !this._smashed) {
          this._smashed = true;
          if (window.audioManager) window.audioManager.playHeavyHit();
          if (window.effectManager) {
            window.effectManager.createShockRing(this.x + this.facing * 45, this.y, '#f59e0b');
            window.effectManager.createDust(this.x + this.facing * 45, this.y, 14, 85);
            window.effectManager.createGroundCrack(this.x + this.facing * 45, this.y, 85, '#d97706');
            window.effectManager.triggerScreenShake(8, 0.25);
          }
          if (window.propSystem) {
            window.propSystem.checkAttackHit(this, { damage: 45, weight: 'heavy', width: 95, height: 65, offsetX: 45, offsetY: -50 });
          }
          const hitData = { damage: 46, offsetX: 55, offsetY: -75, width: 95, height: 65, knockback: 9, knockdown: true, weight: 'heavy' };
          this.deliverAttackHit(player, hitData);
        }
        if (this.stateTimer >= this.stateDuration) {
          this.setState('idle');
          this.smashCooldown = 2.8;
        }
        return;
      }

      // AI quyết định ra đòn
      const target = this.selectCombatTarget ? (this.selectCombatTarget(player) || player) : player;
      if (target && !this.isAttacking && this.state !== 'hurt' && this.state !== 'knockdown' && this.state !== 'getup') {
        const dx = (target.x - this.x) * this.facing;
        const dy = Math.abs(target.y - this.y);

        // Đòn húc vai tầm xa khi mục tiêu cách 130-260px
        if (dx > 120 && dx < 260 && dy < 35 && this.chargeCooldown <= 0) {
          this.facing = Math.sign(target.x - this.x) || this.facing;
          this.setState('ram_charge', 0.52);
          if (window.audioManager) window.audioManager.playWarning();
          if (window.effectManager) window.effectManager.addFloatingText('!', this.x, this.y - 160, 'crit');
          return;
        }

        // Đòn bổ búa cận chiến
        if (dx > 0 && dx < 95 && dy < 45 && this.smashCooldown <= 0) {
          this.facing = Math.sign(target.x - this.x) || this.facing;
          this._smashed = false;
          this.setState('overhead_smash', 0.78);
          if (window.audioManager) window.audioManager.playWarning();
          return;
        }
      }

      super.updateAI(dt, player);
    }
  }

  // --- 2. ĐỊCH NÉM XA (EnemyThrower) ---
  class EnemyThrower extends BaseEnemy {
    constructor(x, y, faction = 'general') {
      super(x, y, 'enemy_thrower', 'Kẻ Ném Đá');
      this.faction = faction;
      this.maxHp = 155;
      this.hp = 155;
      this.speed = 155;
      this.preferredDist = 340 + Math.random() * 80;
      this.throwCooldown = 1.0 + Math.random() * 0.8;
      this._hasThrown = false;
    }

    updateAI(dt, player) {
      if (this.throwCooldown > 0) this.throwCooldown -= dt;

      if (this.state === 'windup_throw') {
        this.vx = 0;
        if (this.stateTimer > 0.42 && !this._hasThrown) {
          this._hasThrown = true;
          const dir = this.facing;
          if (window.game && typeof window.game.spawnProjectile === 'function') {
            window.game.spawnProjectile(this.x + dir * 28, this.y - 50, dir, 430, 26, this);
          }
          if (window.audioManager) window.audioManager.playWhoosh();
        }
        if (this.stateTimer >= this.stateDuration) {
          this.setState('idle');
          this.throwCooldown = 2.6 + Math.random() * 1.2;
        }
        return;
      }

      // Giữ khoảng cách: Nếu người chơi áp sát < 170px -> bỏ chạy lùi lại
      const dist = Math.hypot(player.x - this.x, (player.y - this.y) * 1.3);
      if (dist < 170 && !this.isDead && this.state !== 'hurt' && this.state !== 'knockdown') {
        const awayX = -Math.sign(player.x - this.x) || -this.facing;
        this.vx = awayX * this.speed * 1.15;
        this.facing = Math.sign(player.x - this.x) || 1;
        this.setState('walk');
        return;
      }

      // Khi ở cự ly ném an toàn (220 - 480px) và cùng làn đường:
      if (dist >= 210 && dist <= 480 && Math.abs(player.y - this.y) < 40 && this.throwCooldown <= 0) {
        this.facing = Math.sign(player.x - this.x) || this.facing;
        this._hasThrown = false;
        this.setState('windup_throw', 0.65);
        if (window.effectManager) window.effectManager.addFloatingText('NÉM!', this.x, this.y - 145, 'warn');
        return;
      }

      super.updateAI(dt, player);
    }
  }

  // --- 3. VÕ SĨ TAY KHÔNG (EnemyBrawler) ---
  class EnemyBrawler extends BaseEnemy {
    constructor(x, y, faction = 'general') {
      super(x, y, 'enemy_brawler', 'Võ Sĩ Quyền Cước');
      this.faction = faction;
      this.maxHp = 240;
      this.hp = 240;
      this.speed = 165;
      this.slipCooldown = 0;
      this.brawlerCombo = 0;
      this.preferredDist = 68;
    }

    updateAI(dt, player) {
      if (this.slipCooldown > 0) this.slipCooldown -= dt;

      // Đọc thói quen của người chơi: Nếu người chơi spam cùng 1 đòn >= 2 lần
      const combat = window.combatSystem;
      const log = combat ? combat.playerMoveLog : [];
      const isPlayerSpamming = log.length >= 2 && log[log.length - 1] === log[log.length - 2];
      const isPlayerAttacking = (typeof ATTACK_STATES !== 'undefined') && ATTACK_STATES.has(player.state);

      // Né lướt (Slip & Weave) khi người chơi ra đòn lặp lại trong cự ly gần
      if (isPlayerAttacking && isPlayerSpamming && this.slipCooldown <= 0 &&
          Math.abs(player.x - this.x) < 95 && Math.abs(player.y - this.y) < 38 &&
          ['idle', 'walk'].includes(this.state)) {
        this.slipCooldown = 2.8;
        this.facing = Math.sign(player.x - this.x) || this.facing;
        this.vx = -this.facing * 280;
        this.setState('dodge', 0.28);
        if (window.audioManager) window.audioManager.playDodge();
        if (window.effectManager) {
          window.effectManager.addGhostTrail(this, 'rgba(56, 189, 248, 0.6)');
          window.effectManager.addFloatingText('BẮT BÀI!', this.x, this.y - 150, 'counter');
        }
        // Phản đòn ngay sau khi né
        setTimeout(() => {
          if (!this.isDead && this.state !== 'knockdown' && this.state !== 'hurt') {
            this.facing = Math.sign(player.x - this.x) || this.facing;
            this.setState('punch_straight', 0.3);
            this.vx = this.facing * 180;
          }
        }, 300);
        return;
      }

      super.updateAI(dt, player);
    }

    startAttackSequence(player) {
      this.brawlerCombo = (this.brawlerCombo + 1) % 2;
      if (this.brawlerCombo === 1) {
        this.setState('punch_hook', 0.32);
        this.vx = this.facing * 160;
      } else {
        this.setState('punch_straight', 0.28);
        this.vx = this.facing * 140;
      }
    }

    checkAttackPlayer(player) {
      const isHook = this.state === 'punch_hook';
      const attackData = {
        damage: isHook ? 32 : 24,
        offsetX: 52, offsetY: -80,
        width: isHook ? 68 : 58, height: 50,
        knockback: isHook ? 8 : 4,
        weight: isHook ? 'heavy' : 'light'
      };
      this.deliverAttackHit(player, attackData);
    }
  }

  // --- 4. ĐỊCH TRÓI BẮT (EnemyGrabber) ---
  class EnemyGrabber extends BaseEnemy {
    constructor(x, y, faction = 'general') {
      super(x, y, 'enemy_grabber', 'Lính Xích Tỏa');
      this.faction = faction;
      this.maxHp = 205;
      this.hp = 205;
      this.speed = 135;
      this.chainCooldown = 1.8;
      this.preferredDist = 180;
      this.isPulling = false;
    }

    updateAI(dt, player) {
      if (this.chainCooldown > 0) this.chainCooldown -= dt;

      // Xử lý đòn phóng xích
      if (this.state === 'chain_cast') {
        this.vx = 0;
        if (this.stateTimer > 0.28 && !this._chainFired) {
          this._chainFired = true;
          const reach = 240;
          const dx = (player.x - this.x) * this.facing;
          const dy = Math.abs(player.y - this.y);
          const canGrab = dx > 40 && dx < reach && dy < 36 && player.invincibleTimer <= 0 && player.state !== 'dodge';

          if (canGrab) {
            // Trúng xích -> Kéo người chơi lại gần!
            if (window.audioManager) window.audioManager.playScissorClamp();
            if (window.effectManager) {
              window.effectManager.createHitSparks(player.x, player.y - 70, 10, true);
              window.effectManager.addFloatingText('BỊ XÍCH KÉO!', player.x, player.y - 150, 'warn');
            }
            player.x = this.x + this.facing * 55;
            player.takeDamage(26, -this.facing * 5, false);
            player.setState('hurt', 0.45);
          } else {
            // Hụt xích -> Rơi vào hồi đòn sơ hở (punishable window)
            this.weakWindow = 0.85;
            if (window.effectManager) {
              window.effectManager.addFloatingText('SƠ HỞ!', this.x, this.y - 145, 'weak');
            }
          }
        }
        if (this.stateTimer >= this.stateDuration) {
          this.setState('idle');
          this.chainCooldown = 3.8;
        }
        return;
      }

      // Phóng xích khi ở cự ly 130 - 240px
      const dx = (player.x - this.x) * this.facing;
      const dy = Math.abs(player.y - this.y);
      if (!this.isAttacking && dx > 130 && dx < 240 && dy < 36 && this.chainCooldown <= 0 &&
          this.state !== 'hurt' && this.state !== 'knockdown') {
        this.facing = Math.sign(player.x - this.x) || this.facing;
        this._chainFired = false;
        this.setState('chain_cast', 0.72);
        if (window.audioManager) window.audioManager.playWarning();
        return;
      }

      super.updateAI(dt, player);
    }
  }

  // --- 5. Y TÁ CHIẾN TRƯỜNG (EnemyMedic) ---
  class EnemyMedic extends BaseEnemy {
    constructor(x, y, faction = 'general') {
      super(x, y, 'enemy_medic', 'Quân Y Chiến Trường');
      this.faction = faction;
      this.maxHp = 145;
      this.hp = 145;
      this.speed = 145;
      this.healCooldown = 2.5;
      this.healTarget = null;
    }

    takeDamage(amount, knockbackX = 0, isKnockdown = false) {
      knockbackX = BaseEnemy.resolveKnockback ? BaseEnemy.resolveKnockback(knockbackX) : (Number.isFinite(knockbackX) ? knockbackX : 0);
      // Bị ngắt chiêu khi đang hồi phục
      if (this.state === 'channel_heal') {
        if (window.effectManager) {
          window.effectManager.addFloatingText('BỊ NGẮT TRỊ LIỆU!', this.x, this.y - 150, 'crit');
          window.effectManager.triggerFlash('#ef4444', 0.2);
        }
        amount = Math.round(amount * 1.5); // Phạt sơ hở 1.5x damage
      }
      super.takeDamage(amount, knockbackX, isKnockdown);
    }

    updateAI(dt, player) {
      if (this.healCooldown > 0) this.healCooldown -= dt;

      // Đang niệm trị liệu
      if (this.state === 'channel_heal') {
        this.vx = 0;
        if (window.effectManager && Math.random() < 0.3) {
          window.effectManager.createEnergySparks(this.x, this.y - 50, 2);
        }
        if (this.stateTimer >= this.stateDuration) {
          // Trị liệu hoàn tất!
          const target = this.healTarget;
          if (target && !target.isDead) {
            target.hp = Math.min(target.maxHp, target.hp + 90);
            if (window.audioManager) window.audioManager.playChime();
            if (window.effectManager) {
              window.effectManager.createShockRing(target.x, target.y, '#10b981');
              window.effectManager.addFloatingText('+90 HP', target.x, target.y - 145, 'counter');
            }
          }
          this.setState('idle');
          this.healCooldown = 6.5;
          this.healTarget = null;
        }
        return;
      }

      // Tìm đồng đội bị thương
      const enemies = (window.game && window.game.enemies) || [];
      let lowestAlly = null;
      let minHpRatio = 0.75;
      for (const e of enemies) {
        if (e !== this && !e.isDead && (e.hp / e.maxHp) < minHpRatio) {
          minHpRatio = e.hp / e.maxHp;
          lowestAlly = e;
        }
      }

      // Di chuyển về phía đồng đội bị thương để cứu chữa
      if (lowestAlly && this.healCooldown <= 0) {
        const dist = Math.hypot(lowestAlly.x - this.x, lowestAlly.y - this.y);
        if (dist > 75) {
          this.facing = Math.sign(lowestAlly.x - this.x) || 1;
          this.vx = this.facing * this.speed;
          this.vy = Math.sign(lowestAlly.y - this.y) * this.speed * 0.7;
          this.setState('walk');
          return;
        } else {
          // Ở đủ gần -> niệm trị liệu
          this.healTarget = lowestAlly;
          this.setState('channel_heal', 1.25);
          if (window.audioManager) window.audioManager.playWarning();
          if (window.effectManager) {
            window.effectManager.addFloatingText('ĐANG TRỊ LIỆU...', this.x, this.y - 145, 'warn');
          }
          return;
        }
      }

      // Nếu không có đồng đội bị thương và người chơi ở gần -> lùi lại giữ an toàn
      const pDist = Math.hypot(player.x - this.x, player.y - this.y);
      if (pDist < 160 && !this.isDead && this.state !== 'hurt' && this.state !== 'knockdown') {
        this.vx = -Math.sign(player.x - this.x) * this.speed;
        this.facing = Math.sign(player.x - this.x) || 1;
        this.setState('walk');
        return;
      }

      super.updateAI(dt, player);
    }
  }

  window.ArmedEnemy = ArmedEnemy;
  window.EnemyBaton = EnemyBaton;
  window.EnemyBlade = EnemyBlade;
  window.EnemyShield = EnemyShield;
  window.EnemyArmored = EnemyArmored;
  window.EnemyThrower = EnemyThrower;
  window.EnemyBrawler = EnemyBrawler;
  window.EnemyGrabber = EnemyGrabber;
  window.EnemyMedic = EnemyMedic;

  // ==========================================================================
  // 4. HỆ THỐNG VŨ KHÍ TRONG THẾ GIỚI + NGƯỜI CHƠI
  // ==========================================================================
  const MAX_DROPS = 5;
  const DROP_LIFE = 22;

  // Vẽ hình chữ nhật bo góc tương thích an toàn trên mọi Canvas context
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (!ctx) return;
    if (typeof ctx.beginPath !== 'function') return;
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const weaponSystem = {
    drops: [],
    thrownWeapons: [],
    throwArcs: [],
    _nearest: null,

    reset(player) {
      this.drops = [];
      this.thrownWeapons = [];
      this.throwArcs = [];
      this._nearest = null;
      if (player) {
        player._pendingThrow = null;
        this.clearPlayerWeapon(player);
      }
    },

    // Vũ khí rơi thành vật thể: có vị trí, hướng, vận tốc, nảy một lần rồi nằm yên trên nền
    // Lưu lại chính xác độ bền / số lượt dùng còn lại khi rơi
    spawnDrop(type, x, y, dir, currentDurability = null) {
      const def = WEAPON_DEFS[type];
      if (!def) return;
      const dur = (currentDurability !== null && currentDurability !== undefined) 
        ? Math.max(1, Math.min(currentDurability, def.durability)) 
        : def.durability;
      this.drops.push({
        type, dur, maxDur: def.durability, x, y: clamp(y, 515, 640), z: -34, vx: dir * (90 + Math.random() * 70), vz: 260 + Math.random() * 60,
        rot: 0, rotV: dir * (7 + Math.random() * 5), landed: false, bounced: false, age: 0, pickable: def.pickable
      });
      if (this.drops.length > MAX_DROPS) this.drops.shift();
      if (window.audioManager && typeof window.audioManager.playBlock === 'function') {
        window.audioManager.playBlock();
      }
    },

    // Nhặt tay: vũ khí bị người chơi giữ thì có độ bền hữu hạn (kế thừa đúng độ bền khi nhặt)
    setPlayerWeapon(player, type, dur = null) {
      const def = WEAPON_DEFS[type];
      if (!def) return;
      const currentDur = (dur !== null && dur !== undefined) 
        ? Math.max(1, Math.min(dur, def.durability)) 
        : def.durability;
      const wpObj = {
        type,
        _dur: currentDur,
        max: def.durability,
        step: 0,
        lastAt: -99,
        get dur() {
          return this._dur;
        },
        set dur(val) {
          this._dur = Math.max(0, typeof val === 'number' ? val : 0);
          if (this._dur <= 0 && window.weaponSystem && player && player.weapon) {
            window.weaponSystem.breakWeapon(player, this);
          }
          if (window.uiManager && typeof window.uiManager.updateWeaponHUD === 'function') {
            window.uiManager.updateWeaponHUD(player);
          }
        }
      };
      player.weapon = wpObj;
      player.heldWeapon = type;
      player.stance = def.stance;
      player.atk = null;
      if (window.uiManager && typeof window.uiManager.updateWeaponHUD === 'function') {
        window.uiManager.updateWeaponHUD(player);
      }
    },

    clearPlayerWeapon(player, opts = null) {
      if (!player) return;
      player.weapon = null;
      player.heldWeapon = null;
      player.stance = null;
      if (!opts || !opts.preserveThrow) {
        player.atk = null;
        player._pendingThrow = null;
      }
      player._wpActive = false;
      if (window.uiManager && typeof window.uiManager.updateWeaponHUD === 'function') {
        window.uiManager.updateWeaponHUD(player);
      }
    },

    // Ném / phi vũ khí trên tay [Phím E]: 3 pha gồng thu tay giữ vũ khí -> vung tay giải phóng -> theo đà thu thế
    throwWeapon(player, enemies) {
      if (!player || !player.weapon || player.weapon.dur <= 0 || player.isDead || player._pendingThrow) return false;
      const w = player.weapon;
      const type = w.type;
      const def = WEAPON_DEFS[type] || {};
      const currentDur = Math.max(1, w.dur);
      const maxDur = w.max || def.durability || 8;
      const facing = player.facing || 1;
      const atkDef = PLAYER_ATTACKS.weapon_throw;
      const totalDur = atkDef.startup + atkDef.active + atkDef.recovery;

      // Bước lùi nhẹ lấy đà và vặn mình co tay vẫn đang nắm chặt vũ khí
      player.atk = Object.assign({}, atkDef, { key: 'weapon_throw', recoveryEff: atkDef.recovery });
      player.comboStep = 0;
      player._pendingThrow = {
        type,
        dur: currentDur,
        maxDur,
        facing,
        startup: atkDef.startup,
        totalDur,
        elapsed: 0,
        wsTime: 0,
        sawPlayerUpdate: false,
        released: false
      };
      if (typeof player.vx === 'number') {
        player.vx = -facing * 48;
      }
      if (typeof player.setState === 'function') {
        player.setState('wp_throw', totalDur);
      } else {
        player.state = 'wp_throw';
        player.stateTimer = 0;
        player.stateDuration = totalDur;
      }

      // Vòng tụ lực sau vai trong pha kéo tay (charge arc)
      this.throwArcs.push({
        kind: 'charge',
        player,
        x: player.x - facing * 14,
        y: player.y,
        z: (player.z || 0) - 64,
        facing,
        color: def.color || '#38bdf8',
        age: 0,
        life: atkDef.startup + 0.04
      });

      if (window.audioManager) {
        if (typeof window.audioManager.playWhoosh === 'function') {
          window.audioManager.playWhoosh();
        } else if (typeof window.audioManager.playSwing === 'function') {
          window.audioManager.playSwing();
        }
      }
      return true;
    },

    _releasePendingThrow(player) {
      const pt = player && player._pendingThrow;
      if (!pt || pt.released) return false;
      pt.released = true;

      const facing = player.facing || pt.facing || 1;
      const type = (player.weapon && player.weapon.type) || pt.type;
      const currentDur = Math.max(1, (player.weapon && player.weapon.dur) || pt.dur || 1);
      const def = WEAPON_DEFS[type] || {};
      const maxDur = (player.weapon && player.weapon.max) || pt.maxDur || def.durability || 8;
      const throwAtk = player.atk;

      // Thu hồi vũ khí khỏi tay đúng thời điểm cánh tay vung qua trước, giữ nguyên player.atk để đi hết pha theo đà!
      this.clearPlayerWeapon(player, { preserveThrow: true });
      player.atk = throwAtk || Object.assign({}, PLAYER_ATTACKS.weapon_throw, { key: 'weapon_throw', recoveryEff: PLAYER_ATTACKS.weapon_throw.recovery });
      if (typeof player.vx === 'number') {
        player.vx = facing * 135;
      }

      const releaseX = player.x + facing * 40;
      const releaseY = player.y;
      const releaseZ = (player.z || 0) - 56;

      // Vệt quất khí động học khi rời tay + hiệu ứng rung & bụi đất
      this.throwArcs.push({
        kind: 'whip',
        x: player.x + facing * 18,
        y: releaseY,
        z: releaseZ - 4,
        facing,
        type,
        color: type === 'blade' ? '#fb7185' : '#38bdf8',
        age: 0,
        life: 0.22
      });

      if (window.effectManager) {
        if (typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText('PHI ' + (def.name || 'VŨ KHÍ') + '!', player.x, player.y - 150, 'skill');
        }
        if (typeof window.effectManager.createDust === 'function') {
          window.effectManager.createDust(player.x + facing * 16, player.y, 7, 24);
        }
        if (typeof window.effectManager.createShockRing === 'function') {
          window.effectManager.createShockRing(releaseX, releaseY, def.color || '#38bdf8');
        }
      }

      const isBlade = type === 'blade';
      const isShield = type === 'shield';
      const thrown = {
        type,
        x: releaseX,
        y: releaseY,
        z: releaseZ,
        vx: facing * (isShield ? 800 : 860),
        vy: 0,
        vz: isShield ? 48 : 60,
        gravity: isShield ? 880 : 940,
        rot: facing * (isShield ? 0.15 : -0.35),
        rotV: facing * (isShield ? 20 : (isBlade ? 29 : 25)),
        facing,
        dur: currentDur,
        maxDur,
        age: 0,
        trail: [],
        hitEnemies: new Set(),
        active: true
      };
      this.thrownWeapons.push(thrown);
      return true;
    },

    _tickPendingThrow(player, dt, fromPlayerUpdate = false) {
      const pt = player && player._pendingThrow;
      if (!pt) return;

      // Hủy an toàn nếu người chơi bị đánh ngắt / gục ngã trong lúc kéo tay
      if (player.isDead || player.state !== 'wp_throw') {
        player._pendingThrow = null;
        return;
      }

      if (fromPlayerUpdate) {
        pt.sawPlayerUpdate = true;
        pt.elapsed = player.stateTimer || 0;
      } else {
        pt.wsTime += dt;
        if (!pt.sawPlayerUpdate) {
          player.stateTimer = pt.wsTime;
          pt.elapsed = pt.wsTime;
        }
      }

      if (!pt.released && pt.elapsed >= pt.startup) {
        this._releasePendingThrow(player);
      }

      if (!pt.sawPlayerUpdate && pt.elapsed >= pt.totalDur) {
        player._pendingThrow = null;
        player.atk = null;
        player._wpActive = false;
        if (typeof player.setState === 'function') {
          player.setState('idle');
        } else {
          player.state = 'idle';
        }
      }
    },

    // Xử lý vũ khí gãy: tạo hiệu ứng tóe lửa, âm thanh, chữ "VŨ KHÍ GÃY!" và thu hồi vũ khí an toàn
    breakWeapon(player, w) {
      const weapon = w || (player && player.weapon);
      if (!weapon) return;
      const def = WEAPON_DEFS[weapon.type];
      const name = (def && def.name) ? def.name : 'VŨ KHÍ';
      if (window.effectManager && player) {
        if (typeof window.effectManager.addFloatingText === 'function') {
          window.effectManager.addFloatingText(name + ' GÃY!', player.x, player.y - 170, 'warn');
        }
        if (typeof window.effectManager.createHitSparks === 'function') {
          window.effectManager.createHitSparks(player.x + (player.facing || 1) * 40, player.y - 80, 12, false);
        }
      }
      if (window.audioManager && typeof window.audioManager.playHeavyHit === 'function') {
        window.audioManager.playHeavyHit();
      }
      if (player) {
        player._wpActive = false;
        this.clearPlayerWeapon(player);
        if (player.state && typeof player.state === 'string' && player.state.startsWith('wp_')) {
          player.setState('idle');
        }
      }
      if (window.uiManager && typeof window.uiManager.updateWeaponHUD === 'function') {
        window.uiManager.updateWeaponHUD(player);
      }
    },

    update(dt, player, enemies) {
      // Bảo hộ an toàn tuyệt đối: nếu vũ khí của người chơi đã hết độ bền (<= 0), gãy ngay lập tức
      if (player && player.weapon && player.weapon.dur <= 0) {
        this.breakWeapon(player, player.weapon);
      }
      if (player && player._pendingThrow) {
        this._tickPendingThrow(player, dt, false);
      }
      if (this.throwArcs && this.throwArcs.length > 0) {
        for (let i = this.throwArcs.length - 1; i >= 0; i--) {
          const arc = this.throwArcs[i];
          arc.age += dt;
          if (arc.player) {
            arc.x = arc.player.x - (arc.facing || 1) * 14;
            arc.y = arc.player.y;
            arc.z = (arc.player.z || 0) - 64;
          }
          if (arc.age >= arc.life) this.throwArcs.splice(i, 1);
        }
      }
      this._nearest = null;

      // 1. Cập nhật các vũ khí rơi trên mặt đất
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        d.age += dt;
        if (!d.landed) {
          d.x += d.vx * dt;
          d.z -= d.vz * dt;
          d.vz -= 1300 * dt;
          d.rot += d.rotV * dt;
          if (d.z >= 0) {
            d.z = 0;
            if (!d.bounced) {
              d.bounced = true;
              d.vz = 120;
              d.vx *= 0.4;
              d.rotV *= 0.4;
              if (window.effectManager && typeof window.effectManager.createDust === 'function') {
                window.effectManager.createDust(d.x, d.y, 4, 20);
              }
            } else {
              d.landed = true;
              d.vz = 0;
              d.vx = 0;
              d.rotV = 0;
              d.rot = Math.round(d.rot / Math.PI) * Math.PI + 0.12;
            }
          }
        }
        if (d.age > DROP_LIFE || (!d.pickable && d.age > 7)) this.drops.splice(i, 1);
      }

      // 2. Cập nhật các vũ khí phi / ném đang bay tốc độ cao
      if (this.thrownWeapons && this.thrownWeapons.length > 0) {
        for (let i = this.thrownWeapons.length - 1; i >= 0; i--) {
          const tw = this.thrownWeapons[i];
          tw.age += dt;
          tw.x += tw.vx * dt;
          tw.y += tw.vy * dt;
          tw.z -= tw.vz * dt;
          tw.vz -= tw.gravity * dt;
          tw.rot += tw.rotV * dt;

          // Lưu vệt bóng mờ sau lưng (motion trail)
          tw.trail.push({ x: tw.x, y: tw.y, z: tw.z, rot: tw.rot, alpha: 0.72 });
          if (tw.trail.length > 8) tw.trail.shift();
          for (const tr of tw.trail) {
            tr.alpha -= dt * 2.5;
          }

          // Kiểm tra va chạm với đối thủ
          let removed = false;
          if (tw.active && enemies && enemies.length > 0) {
            for (const enemy of enemies) {
              if (!enemy || enemy.isDead || tw.hitEnemies.has(enemy)) continue;
              const dy = Math.abs(tw.y - enemy.y);
              const dx = Math.abs(tw.x - enemy.x);
              if (dy <= 38 && dx <= 44) {
                tw.hitEnemies.add(enemy);
                const def = WEAPON_DEFS[tw.type];
                const isBlade = tw.type === 'blade';
                const isShield = tw.type === 'shield';
                const baseDmg = isBlade ? 112 : (isShield ? 96 : 90);
                const dmg = Math.round(baseDmg * (0.95 + Math.random() * 0.12));
                const throwDir = tw.facing || 1;
                const kbX = throwDir * (enemy.isBoss ? (isShield ? 260 : 220) : (isShield ? 410 : 340));
                const shouldKnockdown = !enemy.isBoss;

                enemy.pendingHit = {
                  weight: 'heavy',
                  isCrit: true,
                  knockdown: shouldKnockdown,
                  fromX: tw.x - throwDir * 24,
                  unblockable: false,
                  attackerState: 'weapon_throw'
                };

                if (typeof enemy.takeDamage === 'function') {
                  const isRealEntity = (typeof window.BaseEnemy === 'function' && enemy instanceof window.BaseEnemy) || typeof enemy.setState === 'function';
                  if (isRealEntity) {
                    enemy.takeDamage(dmg, kbX, shouldKnockdown);
                  } else {
                    enemy.takeDamage(dmg, {
                      knockback: true,
                      force: kbX,
                      hitStun: 0.55,
                      type: isBlade ? 'slash' : 'blunt',
                      critical: true
                    }, shouldKnockdown);
                  }
                } else if (typeof enemy.hp === 'number') {
                  enemy.hp = Math.max(0, enemy.hp - dmg);
                }

                if (enemy.isBoss && window.uiManager) {
                  if (typeof window.uiManager.updateBossHp === 'function') {
                    window.uiManager.updateBossHp(enemy.hp, enemy.maxHp);
                  }
                  if (typeof window.uiManager.updateBossPoise === 'function') {
                    window.uiManager.updateBossPoise(enemy.poise ?? 100, enemy.maxPoise ?? 100, enemy.weakWindow || 0);
                  }
                }

                if (window.combatSystem && typeof window.combatSystem.registerHit === 'function') {
                  window.combatSystem.registerHit(true, enemy, dmg, true);
                }

                if (isBlade && !enemy.isDead) {
                  if (window.combatSystem && typeof window.combatSystem.applyBleed === 'function') {
                    window.combatSystem.applyBleed(enemy, true, 6);
                  } else if (typeof enemy.applyBleed === 'function') {
                    enemy.applyBleed(5, 4);
                  }
                }

                if (window.audioManager) {
                  if (isBlade && typeof window.audioManager.playSlash === 'function') {
                    window.audioManager.playSlash();
                  } else if (typeof window.audioManager.playHeavyHit === 'function') {
                    window.audioManager.playHeavyHit();
                  }
                }
                if (window.effectManager) {
                  if (typeof window.effectManager.createHitSparks === 'function') {
                    window.effectManager.createHitSparks(tw.x, tw.y + tw.z, 16, true);
                  }
                  if (typeof window.effectManager.triggerScreenShake === 'function') {
                    window.effectManager.triggerScreenShake(7, 0.22);
                  } else if (typeof window.effectManager.screenShake === 'function') {
                    window.effectManager.screenShake(7, 0.22);
                  }
                  if (typeof window.effectManager.addFloatingText === 'function') {
                    window.effectManager.addFloatingText(`-${dmg} BẠO KÍCH!`, tw.x, tw.y + tw.z - 30, 'crit');
                  }
                }

                // Giảm 2 độ bền khi ném trúng mục tiêu
                tw.dur = Math.max(0, tw.dur - 2);

                if (tw.dur <= 0) {
                  if (window.effectManager) {
                    if (typeof window.effectManager.addFloatingText === 'function') {
                      window.effectManager.addFloatingText((def ? def.name : 'VŨ KHÍ') + ' VỠ NÁT!', tw.x, tw.y + tw.z - 50, 'warn');
                    }
                    if (typeof window.effectManager.createHitSparks === 'function') {
                      window.effectManager.createHitSparks(tw.x, tw.y + tw.z, 22, false);
                    }
                  }
                  this.thrownWeapons.splice(i, 1);
                  removed = true;
                } else {
                  tw.active = false;
                  this.spawnDrop(tw.type, tw.x, tw.y, -throwDir * 0.7, tw.dur);
                  this.thrownWeapons.splice(i, 1);
                  removed = true;
                }
                break;
              }
            }
          }
          if (removed) continue;

          // Kiểm tra tiếp đất (z >= 0)
          if (tw.z >= 0) {
            tw.z = 0;
            this.spawnDrop(tw.type, tw.x, tw.y, tw.facing * 0.4, tw.dur);
            if (window.effectManager && typeof window.effectManager.createDust === 'function') {
              window.effectManager.createDust(tw.x, tw.y, 4, 18);
            }
            this.thrownWeapons.splice(i, 1);
            continue;
          }

          if (tw.age > 4.5 || tw.x < -300 || tw.x > 6000) {
            this.thrownWeapons.splice(i, 1);
          }
        }
      }

      // 3. Xử lý tương tác phím [E] cho người chơi (Nhặt vũ khí HOẶC Ném vũ khí)
      const free = player && ['idle', 'walk', 'run', 'guard'].includes(player.state) && !player.isDead;
      if (free) {
        let best = null, bd = 85;
        for (const d of this.drops) {
          if (!d.pickable || !d.landed) continue;
          const dist = Math.hypot(d.x - player.x, (d.y - player.y) * 1.6);
          if (dist < bd) { bd = dist; best = d; }
        }
        this._nearest = best;

        const inp = window.input;
        const ePressed = inp && (
          (typeof inp.isKeyJustPressed === 'function' && inp.isKeyJustPressed('KeyE')) ||
          (typeof inp.isJustPressed === 'function' && inp.isJustPressed('KeyE')) ||
          (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('interact'))
        );
        if (ePressed) {
          if (best) {
            // Khi có vũ khí dưới đất: [E] là NHẶT VŨ KHÍ (hoặc đổi vũ khí)
            const realDist = Math.hypot(best.x - player.x, (best.y - player.y) * 1.6);
            if (realDist <= 85 && best.pickable && best.landed) {
              if (player.weapon && player.weapon.dur > 0) {
                this.spawnDrop(player.weapon.type, player.x - player.facing * 28, player.y, -player.facing, player.weapon.dur);
              }
              this.setPlayerWeapon(player, best.type, best.dur);
              const idx = this.drops.indexOf(best);
              if (idx !== -1) this.drops.splice(idx, 1);
              this._nearest = null;
              const def = WEAPON_DEFS[best.type];
              const effTxt = def && def.effectName ? ` — ${def.effectName} ${def.effectIcon || ''}` : '';
              if (window.audioManager && typeof window.audioManager.playClick === 'function') {
                window.audioManager.playClick();
              }
              if (window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
                window.effectManager.addFloatingText('NHẶT ' + (def ? def.name : 'VŨ KHÍ') + ` (${player.weapon.dur}/${player.weapon.max})${effTxt}!`, player.x, player.y - 170, 'heal');
              }
            }
          } else if (player.weapon && player.weapon.dur > 0) {
            // Khi KHÔNG có vũ khí dưới đất để nhặt: [E] là NÉM VŨ KHÍ!
            const stageEv = window.game && window.game.stageEvidence;
            const nearEvidence = stageEv && !stageEv.collected && Math.abs(player.x - stageEv.x) < 85;
            if (!nearEvidence) {
              this.throwWeapon(player, enemies);
            }
          }
        }
      }

      // Đồng bộ HUD hiển thị vũ khí liên tục
      if (window.uiManager && typeof window.uiManager.updateWeaponHUD === 'function') {
        window.uiManager.updateWeaponHUD(player);
      }
    },

    // ----- Người chơi tấn công bằng vũ khí -----
    startPlayerAttack(player, kind) {
      const w = player.weapon;
      if (!w || w.dur <= 0) {
        if (w && w.dur <= 0) this.breakWeapon(player, w);
        return false;
      }
      const def = WEAPON_DEFS[w.type];
      let key;
      if (kind === 'heavy') key = def.heavy[0];
      else {
        if (player.attackClock - w.lastAt > 0.85) w.step = 0;
        key = def.light[w.step % def.light.length];
        w.step++;
      }
      const a = Object.assign({}, PLAYER_ATTACKS[key], { key, counted: false });
      a.recoveryEff = a.recovery;
      player.atk = a;
      player.comboStep = 0;
      w.lastAt = player.attackClock;
      player.vx = player.facing * (a.lunge ? 60 : 90);
      player.setState(a.state, a.startup + a.active + a.recovery);
      if (window.audioManager) window.audioManager.playWhoosh();
      player.spendStamina(kind === 'heavy' ? 'kick_roundhouse' : 'punch_hook');
      return true;
    },

    updatePlayerAttack(player, dt, enemies) {
      const a = player.atk;
      if (player.state === 'wp_throw' && a && a.state === 'wp_throw') {
        if (player._pendingThrow) {
          this._tickPendingThrow(player, dt, true);
        }
        if (player.stateTimer >= a.startup + a.active + a.recovery) {
          player.atk = null;
          player._wpActive = false;
          player._pendingThrow = null;
          player.setState('idle');
        }
        return;
      }
      const w = player.weapon;
      if (!a || !w || w.dur <= 0) {
        if (w && w.dur <= 0) this.breakWeapon(player, w);
        player._wpActive = false;
        player.setState('idle');
        return;
      }
      const t = player.stateTimer;
      const su = a.startup, ac = a.active;
      player._wpActive = (t >= su && t < su + ac + 0.08);
      if (t >= su && t < su + ac) {
        if (a.lunge) player.vx = player.facing * a.lunge;
        const box = a.box(clamp((t - su) / ac));
        let connected = false;
        for (const e of enemies) {
          if (e.isDead) continue;
          const ok = window.combatSystem.checkAttackHit(player, e, {
            damage: Math.round(a.damage * (player.dmgMul || 1)), knockback: a.knockback, weight: a.weight,
            knockdown: !!a.knockdown, energyGain: a.energyGain,
            weaponEffect: a.weaponEffect,
            bleedChance: a.bleedChance, bleedDmg: a.bleedDmg,
            stunChance: a.stunChance, stunDuration: a.stunDuration, bossPoiseDmg: a.bossPoiseDmg,
            offsetX: box.offsetX, offsetY: box.offsetY, width: box.width, height: box.height
          });
          if (ok) connected = true;
        }
        if (window.propSystem) {
          const propHit = window.propSystem.checkAttackHit(player, {
            damage: Math.round(a.damage * (player.dmgMul || 1)), weight: a.weight,
            offsetX: box.offsetX, offsetY: box.offsetY, width: box.width, height: box.height
          });
          if (propHit) connected = true;
        }
        if (connected && !a.counted) {
          a.counted = true;
          w.dur = Math.max(0, (w.dur || 0) - 1);
          if (w.dur <= 0) {
            w.dur = 0;
            this.breakWeapon(player, w);
            return;
          }
        }
      }
      if (t >= su + ac + a.recovery) {
        player.atk = null;
        player._wpActive = false;
        player.comboWindowTimer = 0;
        if (w.dur <= 0) {
          this.breakWeapon(player, w);
        } else {
          player.setState('idle');
        }
      }
    },

    // ----- Khiên chắn đồng đội: đòn của người chơi đánh vào địch phía sau khiên sẽ trúng khiên -----
    tryShieldIntercept(combat, attacker, defender, attackData) {
      if (attacker.type !== 'player' || combat._intercepting) return false;
      const enemies = (window.game && window.game.enemies) || [];
      for (const s of enemies) {
        if (!(s instanceof EnemyShield) || s === defender || s.isDead || !s.isGuarding()) continue;
        const toAtt = Math.sign(attacker.x - s.x);
        if (toAtt !== s.facing) continue;                                   // khiên phải hướng về người đánh
        if ((s.x - attacker.x) * (defender.x - s.x) <= 0) continue;         // khiên phải nằm giữa người đánh và địch
        if (Math.abs(defender.x - s.x) > 110 || Math.abs(defender.y - s.y) > 46) continue;
        combat._intercepting = true;
        let hit = false;
        try { hit = combat.checkAttackHit(attacker, s, attackData); } finally { combat._intercepting = false; }
        if (hit) {
          if (!attacker.hitTargets) attacker.hitTargets = new Set();
          attacker.hitTargets.add(defender.id);
          return true;
        }
      }
      return false;
    },

    // ----- Vẽ hình dáng vũ khí dùng chung (rơi & đang bay) -----
    renderWeaponShape(ctx, type, isGhost = false) {
      if (type === 'baton') {
        // Côn tác chiến hợp kim: thân vát cạnh kim loại, đai khóa đỏ, đầu tungsten phát sáng, cán nhám & tua đỏ
        ctx.fillStyle = isGhost ? 'rgba(56, 189, 248, 0.55)' : '#090d16';
        ctx.beginPath();
        ctx.moveTo(-28, -3.8); ctx.lineTo(10, -4.4); ctx.lineTo(28, -5.2); ctx.lineTo(30, 0);
        ctx.lineTo(28, 5.2); ctx.lineTo(10, 4.4); ctx.lineTo(-28, 3.8);
        ctx.closePath(); ctx.fill();

        const bg = ctx.createLinearGradient(0, -4.2, 0, 4.2);
        bg.addColorStop(0, isGhost ? 'rgba(125,211,252,0.75)' : '#64748b');
        bg.addColorStop(0.45, isGhost ? 'rgba(56,189,248,0.6)' : '#1e293b');
        bg.addColorStop(1, isGhost ? 'rgba(14,116,144,0.6)' : '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(-26.5, -3.4, 38, 6.8);

        // Đầu thép tungsten vát cạnh + rãnh phát quang cyan
        const hg = ctx.createLinearGradient(0, -5, 0, 5);
        hg.addColorStop(0, isGhost ? 'rgba(255,255,255,0.85)' : '#f8fafc');
        hg.addColorStop(0.5, isGhost ? 'rgba(186,230,253,0.7)' : '#94a3b8');
        hg.addColorStop(1, isGhost ? 'rgba(56,189,248,0.65)' : '#475569');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.moveTo(11, -4.4); ctx.lineTo(27.2, -4.8); ctx.lineTo(29.2, 0); ctx.lineTo(27.2, 4.8); ctx.lineTo(11, 4.4);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = isGhost ? 'rgba(125,211,252,0.85)' : '#38bdf8';
        ctx.fillRect(14, -1.3, 12, 2.6);
        ctx.fillStyle = isGhost ? 'rgba(255,255,255,0.7)' : '#ef4444';
        ctx.fillRect(9.2, -4.6, 2.4, 9.2);

        // Cán nhám + vòng chốt bên + tua dây đỏ
        ctx.strokeStyle = isGhost ? 'rgba(255,255,255,0.5)' : '#94a3b8'; ctx.lineWidth = 1.1;
        for (let x = -24; x < -2; x += 3.2) {
          ctx.beginPath(); ctx.moveTo(x, -3); ctx.lineTo(x + 1.8, 3); ctx.stroke();
        }
        ctx.fillStyle = isGhost ? 'rgba(255,255,255,0.6)' : '#cbd5e1';
        ctx.fillRect(-4, -6.2, 3, 12.4);
        ctx.fillStyle = isGhost ? 'rgba(250,204,21,0.7)' : '#eab308';
        ctx.beginPath(); ctx.arc(-28, 0, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isGhost ? 'rgba(255,255,255,0.5)' : '#dc2626'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(-29, 0); ctx.quadraticCurveTo(-36, 6, -32, 12); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.52)';
        ctx.fillRect(-24, -2.6, 50, 1.1);
      } else if (type === 'blade') {
        // Mã tấu rèn chiến trận: sống dày có răng cưa, rãnh máu sâu, chắn tay chữ S đồng vàng, chuôi quấn đỏ
        const bladeG = ctx.createLinearGradient(0, -7, 0, 7);
        bladeG.addColorStop(0, isGhost ? 'rgba(254,205,211,0.9)' : '#f8fafc');
        bladeG.addColorStop(0.45, isGhost ? 'rgba(244,63,94,0.8)' : '#cbd5e1');
        bladeG.addColorStop(1, isGhost ? 'rgba(159,18,57,0.75)' : '#475569');

        ctx.fillStyle = isGhost ? 'rgba(0,0,0,0.3)' : '#090d16';
        ctx.beginPath();
        ctx.moveTo(-5, -5.8); ctx.lineTo(13, -5.4); ctx.lineTo(15, -7.2); ctx.lineTo(18.5, -5.4);
        ctx.lineTo(20.5, -7.4); ctx.lineTo(24.5, -5.6); ctx.lineTo(35, -3.5);
        ctx.lineTo(40, 2.2); ctx.quadraticCurveTo(28, 7.2, -5, 5.4);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = bladeG;
        ctx.beginPath();
        ctx.moveTo(-5, -4.7); ctx.lineTo(13, -4.4); ctx.lineTo(15, -6.1); ctx.lineTo(18.2, -4.4);
        ctx.lineTo(20.2, -6.2); ctx.lineTo(24.2, -4.5); ctx.lineTo(34, -2.7);
        ctx.lineTo(38.5, 1.8); ctx.quadraticCurveTo(27, 6.1, -5, 4.4);
        ctx.closePath(); ctx.fill();

        // Sống đao thép sẫm + rãnh máu
        ctx.fillStyle = isGhost ? 'rgba(255,255,255,0.65)' : '#334155';
        ctx.fillRect(-5, -4.7, 30, 1.9);
        ctx.strokeStyle = isGhost ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.65)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-2, -0.4); ctx.quadraticCurveTo(16, -0.2, 31, 0.5); ctx.stroke();

        // Mép lưỡi chém sáng sắc
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.15;
        ctx.beginPath(); ctx.moveTo(-4, 4.3); ctx.quadraticCurveTo(27, 6.0, 38.5, 1.8); ctx.stroke();

        // Chắn tay chữ S đồng vàng + tán tâm
        ctx.fillStyle = isGhost ? 'rgba(253,224,71,0.75)' : '#92400e';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-9.5, -8.5, 5.2, 17, 2) : ctx.rect(-9.5, -8.5, 5.2, 17); ctx.fill();
        ctx.fillStyle = isGhost ? 'rgba(254,240,138,0.85)' : '#fbbf24';
        ctx.fillRect(-8.4, -7.4, 2.8, 14.8);
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath(); ctx.arc(-7, 0, 1.5, 0, Math.PI * 2); ctx.fill();

        // Chuôi quấn dây đỏ & khuyên đồng cuối cán
        ctx.fillStyle = '#1e293b'; ctx.fillRect(-25.5, -3.5, 16.5, 7);
        ctx.strokeStyle = isGhost ? 'rgba(244,63,94,0.8)' : '#dc2626'; ctx.lineWidth = 2;
        for (let x = -23.5; x < -10.5; x += 3.5) {
          ctx.beginPath(); ctx.moveTo(x, -3.5); ctx.lineTo(x + 2, 3.5); ctx.stroke();
        }
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(-27, 0, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isGhost ? 'rgba(251,113,133,0.7)' : '#dc2626'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-29, 1); ctx.quadraticCurveTo(-36, 7, -33, 13); ctx.stroke();
      } else {
        // Khiên chiến thuật vát góc 2.5D: tấm giáp titan nhiều tầng, kính cường lực polycarbonate, đinh tán lục giác & vạch cảnh giới
        ctx.fillStyle = isGhost ? 'rgba(56, 189, 248, 0.45)' : '#090d16';
        ctx.beginPath();
        ctx.moveTo(-8, -30); ctx.lineTo(8, -30); ctx.lineTo(12, -23);
        ctx.lineTo(12, 23); ctx.lineTo(8, 30); ctx.lineTo(-8, 30);
        ctx.lineTo(-12, 23); ctx.lineTo(-12, -23);
        ctx.closePath(); ctx.fill();

        const sg = ctx.createLinearGradient(-10, -28, 10, 28);
        sg.addColorStop(0, isGhost ? 'rgba(186,230,253,0.85)' : '#94a3b8');
        sg.addColorStop(0.45, isGhost ? 'rgba(56,189,248,0.72)' : '#334155');
        sg.addColorStop(1, isGhost ? 'rgba(14,116,144,0.75)' : '#0f172a');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.moveTo(-6.8, -28); ctx.lineTo(6.8, -28); ctx.lineTo(10.2, -21.8);
        ctx.lineTo(10.2, 21.8); ctx.lineTo(6.8, 28); ctx.lineTo(-6.8, 28);
        ctx.lineTo(-10.2, 21.8); ctx.lineTo(-10.2, -21.8);
        ctx.closePath(); ctx.fill();

        // Kính quan sát bọc khung thép & ánh chói chéo
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-7, -23, 14, 17);
        const vg = ctx.createLinearGradient(-6, -22, 6, -7);
        vg.addColorStop(0, 'rgba(186,230,253,0.92)');
        vg.addColorStop(1, 'rgba(14,165,233,0.72)');
        ctx.fillStyle = vg;
        ctx.fillRect(-5.8, -21.8, 11.6, 14.6);
        ctx.fillStyle = 'rgba(255,255,255,0.52)';
        ctx.beginPath(); ctx.moveTo(-5.8, -21.8); ctx.lineTo(1, -21.8); ctx.lineTo(-5.8, -11); ctx.closePath(); ctx.fill();

        // Đường rãnh giáp & 3 vạch cảnh giới vàng/cyan
        ctx.strokeStyle = 'rgba(15,23,42,0.75)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-9.5, -2); ctx.lineTo(9.5, -2); ctx.stroke();
        ctx.fillStyle = isGhost ? '#7dd3fc' : '#eab308';
        for (let i = 0; i < 3; i++) ctx.fillRect(-7.5, 4 + i * 6, 15, 2.8);

        // Viền thép sáng + đinh tán 4 góc
        ctx.strokeStyle = isGhost ? '#7dd3fc' : '#cbd5e1'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-6.8, -28); ctx.lineTo(6.8, -28); ctx.lineTo(10.2, -21.8);
        ctx.lineTo(10.2, 21.8); ctx.lineTo(6.8, 28); ctx.lineTo(-6.8, 28);
        ctx.lineTo(-10.2, 21.8); ctx.lineTo(-10.2, -21.8);
        ctx.closePath(); ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        for (const [rx, ry] of [[-7, -24.5], [7, -24.5], [-7, 24.5], [7, 24.5]]) {
          ctx.beginPath(); ctx.arc(rx, ry, 1.15, 0, Math.PI * 2); ctx.fill();
        }
      }
    },

    // ----- Vẽ các thực thể vũ khí trong thế giới -----
    render(ctx, camera) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // 1. Vẽ các vũ khí rơi trên sàn
      for (const d of this.drops) {
        const sx = d.x - camera.x, sy = d.y - camera.y;
        if (sx < -80 || sx > 1700) continue;
        const blink = d.age > DROP_LIFE - 4 && Math.floor(d.age * 6) % 2 === 0;
        if (blink) continue;
        ctx.save();
        // Bóng dưới nền đất
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vòng sáng nhận biết vật có thể nhặt
        if (d.pickable && d.landed) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
          ctx.fillStyle = `rgba(250, 204, 21, ${0.10 + 0.10 * pulse})`;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 30 + 4 * pulse, 9 + pulse, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.translate(sx, sy + d.z - 6);
        ctx.rotate(d.rot);
        this.renderWeaponShape(ctx, d.type, false);
        ctx.restore();
      }

      // 2. Vẽ hiệu ứng tụ lực & quất khí động học khi phóng vũ khí (throwArcs)
      if (this.throwArcs && this.throwArcs.length > 0) {
        for (const arc of this.throwArcs) {
          const p = clamp(arc.age / Math.max(0.01, arc.life));
          const sx = arc.x - camera.x;
          const sy = arc.y - camera.y + (arc.z || 0);
          ctx.save();
          ctx.translate(sx, sy);
          ctx.scale(arc.facing || 1, 1);
          if (arc.kind === 'charge') {
            const rad = 28 * (1 - p * 0.45);
            ctx.globalAlpha = 0.72 * (1 - p * 0.5);
            ctx.strokeStyle = arc.color || '#38bdf8';
            ctx.lineWidth = 3.2 * (1 - p * 0.4);
            ctx.beginPath();
            ctx.arc(-6, -4, rad, Math.PI * 0.75, Math.PI * 1.65);
            ctx.stroke();
          } else {
            const rad = 34 + 34 * p;
            ctx.globalAlpha = Math.max(0, 0.85 * (1 - p));
            ctx.strokeStyle = arc.color || '#38bdf8';
            ctx.lineWidth = 5.5 * (1 - p);
            ctx.beginPath();
            ctx.arc(8, 0, rad, -Math.PI * 0.42, Math.PI * 0.36);
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.2 * (1 - p);
            ctx.beginPath();
            ctx.arc(12, 0, rad * 0.82, -Math.PI * 0.32, Math.PI * 0.28);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 3. Vẽ các vũ khí phi / ném đang bay tốc độ cao
      if (this.thrownWeapons && this.thrownWeapons.length > 0) {
        for (const tw of this.thrownWeapons) {
          const sx = tw.x - camera.x;
          const sy = tw.y - camera.y + tw.z;
          const isBlade = tw.type === 'blade';
          const trailCol = isBlade ? '#fb7185' : '#38bdf8';

          // Dải vệt gió liên tục theo quỹ đạo bay
          if (tw.trail && tw.trail.length > 1) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let tIdx = 1; tIdx < tw.trail.length; tIdx++) {
              const p0 = tw.trail[tIdx - 1];
              const p1 = tw.trail[tIdx];
              const ratio = tIdx / tw.trail.length;
              ctx.globalAlpha = Math.max(0, Math.min(0.65, (p1.alpha || 0.4) * ratio));
              ctx.strokeStyle = trailCol;
              ctx.lineWidth = (isBlade ? 8 : 10) * ratio;
              ctx.beginPath();
              ctx.moveTo(p0.x - camera.x, p0.y - camera.y + p0.z);
              ctx.lineTo(p1.x - camera.x, p1.y - camera.y + p1.z);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Vệt bóng mờ sau lưng (motion trail)
          if (tw.trail && tw.trail.length > 0) {
            for (const tr of tw.trail) {
              if (tr.alpha <= 0.05) continue;
              ctx.save();
              ctx.translate(tr.x - camera.x, tr.y - camera.y + tr.z);
              ctx.rotate(tr.rot);
              ctx.globalAlpha = Math.max(0, Math.min(1, tr.alpha * 0.38));
              this.renderWeaponShape(ctx, tw.type, true);
              ctx.restore();
            }
          }

          // Bóng trên mặt đất
          const floorSy = tw.y - camera.y;
          ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.beginPath();
          ctx.ellipse(sx, floorSy, 20, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Thân vũ khí đang bay xoay tròn kèm vòng gió xoay
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(tw.rot);
          ctx.strokeStyle = isBlade ? 'rgba(251,113,133,0.6)' : 'rgba(56,189,248,0.6)';
          ctx.lineWidth = 2.4;
          const spinR = tw.type === 'shield' ? 32 : 34;
          ctx.beginPath(); ctx.arc(0, 0, spinR, 0.2, Math.PI * 0.95); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, spinR, Math.PI + 0.2, Math.PI * 1.95); ctx.stroke();
          ctx.shadowColor = isBlade ? '#f43f5e' : '#38bdf8';
          ctx.shadowBlur = 14;
          this.renderWeaponShape(ctx, tw.type, false);
          ctx.restore();
        }
      }
    },

    // Bảng gợi ý nhặt + bảng chỉ số vũ khí nổi trên đầu người chơi
    renderHud(ctx, camera, player) {
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      // 1. BẢNG GỢI Ý NHẶT VŨ KHÍ DƯỚI ĐẤT (FLOATING PICKUP BADGE)
      if (this._nearest) {
        const d = this._nearest;
        const hoverOffset = Math.sin(now * 0.006) * 3;
        const sx = d.x - camera.x;
        const sy = d.y - camera.y - 48 + hoverOffset;
        const def = WEAPON_DEFS[d.type];
        const wName = (def && def.name) ? def.name : 'VŨ KHÍ';
        const durText = (d.dur !== undefined && d.maxDur) ? ` (${d.dur}/${d.maxDur})` : '';
        const effIcon = (def && def.effectIcon) ? ` ${def.effectIcon}` : '';
        const actionText = `NHẶT ${wName}${durText}${effIcon}`;

        ctx.save();
        ctx.font = '800 12px "Montserrat", sans-serif';
        const textW = (ctx.measureText && ctx.measureText(actionText).width) || 120;
        const badgeW = Math.max(130, textW + 46);
        const badgeH = 26;
        const badgeX = sx - badgeW / 2;
        const badgeY = sy - badgeH / 2;

        // Shadow & Glow
        ctx.shadowColor = 'rgba(250, 204, 21, 0.45)';
        ctx.shadowBlur = 10;

        // Background Glass
        drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
        ctx.fillStyle = 'rgba(10, 15, 28, 0.92)';
        if (typeof ctx.fill === 'function') ctx.fill();

        // Border
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        if (typeof ctx.stroke === 'function') ctx.stroke();

        ctx.shadowBlur = 0;

        // Keycap [ E ] Badge on left
        const keyW = 20, keyH = 18;
        const keyX = badgeX + 5, keyY = badgeY + 4;
        drawRoundedRect(ctx, keyX, keyY, keyW, keyH, 4);
        ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
        if (typeof ctx.fill === 'function') ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.2;
        if (typeof ctx.stroke === 'function') ctx.stroke();

        ctx.font = '900 11px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        if (typeof ctx.fillText === 'function') ctx.fillText('E', keyX + keyW / 2, keyY + keyH / 2 + 0.5);

        // Text label
        ctx.font = '800 11.5px "Montserrat", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fef08a';
        if (typeof ctx.fillText === 'function') ctx.fillText(actionText, keyX + keyW + 7, badgeY + badgeH / 2 + 0.5);

        ctx.restore();
      }

      // 2. THANH TRẠNG THÁI VŨ KHÍ NỔI TRÊN ĐẦU NGƯỜI CHƠI (OVERHEAD WEAPON HUD)
      if (player && player.weapon && !player.isDead) {
        const w = player.weapon;
        if (!w || w.dur <= 0) return;
        const displayDur = Math.max(0, Math.floor(w.dur));
        if (displayDur <= 0) return;

        const def = WEAPON_DEFS[w.type];
        const isBlade = w.type === 'blade';
        const isShield = w.type === 'shield';
        const maxDur = Math.max(1, w.max || (def ? def.durability : 8));
        const sx = player.x - camera.x;
        const sy = player.y + (player.z || 0) - camera.y - 128 * 1.3 / 1.3 - 44;

        ctx.save();
        const cardW = 104;
        const cardH = 35;
        const cardX = Math.round(sx - cardW / 2);
        const cardY = Math.round(sy - cardH / 2);

        // Theme colors & Low alert pulse
        const isLow = displayDur <= 2;
        const pulse = isLow ? (0.6 + 0.4 * Math.sin(now * 0.012)) : 0.8;

        // Outer Glow
        ctx.shadowColor = isLow ? `rgba(239, 68, 68, ${pulse})` : (isBlade ? 'rgba(244, 63, 94, 0.45)' : (isShield ? 'rgba(56, 189, 248, 0.5)' : 'rgba(0, 210, 255, 0.45)'));
        ctx.shadowBlur = isLow ? 10 : 7;

        // Card Background Glass
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 6);
        ctx.fillStyle = 'rgba(11, 19, 36, 0.94)';
        if (typeof ctx.fill === 'function') ctx.fill();

        // Card Border
        ctx.strokeStyle = isLow ? `rgba(239, 68, 68, ${pulse})` : (isBlade ? 'rgba(244, 63, 94, 0.78)' : (isShield ? 'rgba(250, 204, 21, 0.72)' : 'rgba(0, 210, 255, 0.78)'));
        ctx.lineWidth = 1.4;
        if (typeof ctx.stroke === 'function') ctx.stroke();

        ctx.shadowBlur = 0;

        // Row 1: Icon + Name & Durability Number
        const icon = isBlade ? '⚔️' : (isShield ? '🛡️' : '🦯');
        const name = (def && def.name) ? def.name : (isBlade ? 'MÃ TẤU' : (isShield ? 'KHIÊN' : 'CÔN'));

        ctx.font = '800 9.5px "Montserrat", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        if (typeof ctx.fillText === 'function') ctx.fillText(`${icon} ${name}`, cardX + 7, cardY + 5);

        ctx.textAlign = 'right';
        ctx.fillStyle = isLow ? '#f87171' : (displayDur <= maxDur * 0.5 ? '#facc15' : '#38bdf8');
        if (typeof ctx.fillText === 'function') ctx.fillText(`${displayDur}/${maxDur}`, cardX + cardW - 7, cardY + 5);

        // Row 2: Segmented Energy Pips
        const pipAreaX = cardX + 7;
        const pipAreaY = cardY + 18.5;
        const pipAreaW = cardW - 14;
        const pipGap = 2;
        const pipW = Math.max(3, (pipAreaW - (maxDur - 1) * pipGap) / maxDur);
        const pipH = 4.5;

        for (let i = 0; i < maxDur; i++) {
          const px = pipAreaX + i * (pipW + pipGap);
          drawRoundedRect(ctx, px, pipAreaY, pipW, pipH, 1.5);
          if (i < displayDur) {
            if (isLow) {
              ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
            } else if (displayDur <= maxDur * 0.5) {
              ctx.fillStyle = '#f59e0b';
            } else if (isBlade) {
              ctx.fillStyle = '#f43f5e';
            } else if (isShield) {
              ctx.fillStyle = '#38bdf8';
            } else {
              ctx.fillStyle = '#00d2ff';
            }
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          }
          if (typeof ctx.fill === 'function') ctx.fill();
        }

        // Row 3: Action Cue: [E] PHI / [U] CHẮN
        const cueLabel = isShield ? '[E] PHI · [U] CHẮN' : '[E] PHI VŨ KHÍ';
        const cueW = isShield ? 80 : 62, cueH = 11;
        const cueX = cardX + (cardW - cueW) / 2;
        const cueY = cardY + cardH - 8.5;
        drawRoundedRect(ctx, cueX, cueY, cueW, cueH, 3);
        ctx.fillStyle = isShield ? 'rgba(56, 189, 248, 0.22)' : 'rgba(234, 179, 8, 0.22)';
        if (typeof ctx.fill === 'function') ctx.fill();
        ctx.strokeStyle = isShield ? 'rgba(56, 189, 248, 0.72)' : 'rgba(250, 204, 21, 0.72)';
        ctx.lineWidth = 0.8;
        if (typeof ctx.stroke === 'function') ctx.stroke();

        ctx.font = '900 7px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isShield ? '#bae6fd' : '#fef08a';
        if (typeof ctx.fillText === 'function') ctx.fillText(cueLabel, cueX + cueW / 2, cueY + cueH / 2);

        ctx.restore();
      }
    },

    // Biểu tượng SVG vector dùng chung cho HUD cầm tay & Kho Đồ
    getIconSvg(type) {
      if (type === 'blade') {
        return `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M5 24L8.5 27.5L13 23L9.5 19.5L5 24Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1"/>
          <circle cx="5.2" cy="26.8" r="2" fill="#facc15" stroke="#78350f" stroke-width="0.9"/>
          <rect x="8.8" y="16.5" width="7.2" height="2.6" rx="1.2" transform="rotate(-45 8.8 16.5)" fill="#fbbf24" stroke="#78350f" stroke-width="0.9"/>
          <path d="M12.2 19.8L25.8 6.2L27.5 4.2L26.2 9.4L23.5 12.2L24.5 14L20.5 16L21.5 17.6L16.5 22.8C15 24.2 12.8 23.2 12.2 19.8Z" fill="#cbd5e1" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M13.5 21L26.6 7.8L27.2 4.9L13.5 18.6Z" fill="#f8fafc" opacity="0.88"/>
          <path d="M15.4 17.5L23.2 9.7" stroke="#334155" stroke-width="1.3" stroke-linecap="round"/>
        </svg>`;
      }
      if (type === 'shield') {
        return `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M8 5L24 5L26 9V18.5C26 23.4 20.8 27.2 16 29C11.2 27.2 6 23.4 6 18.5V9L8 5Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M9.5 7H22.5L23.8 10V18.2C23.8 21.8 19.6 24.8 16 26.5C12.4 24.8 8.2 21.8 8.2 18.2V10L9.5 7Z" fill="#334155"/>
          <rect x="10.2" y="8.8" width="11.6" height="6.2" rx="1.2" fill="#7dd3fc" stroke="#0f172a" stroke-width="1"/>
          <path d="M10.8 9.2H15.2L11.8 14.5H10.8V9.2Z" fill="#ffffff" opacity="0.65"/>
          <rect x="9.6" y="17.2" width="12.8" height="2.2" rx="0.8" fill="#eab308"/>
          <rect x="11" y="21" width="10" height="2" rx="0.8" fill="#eab308"/>
          <circle cx="9.6" cy="7.6" r="0.9" fill="#f8fafc"/>
          <circle cx="22.4" cy="7.6" r="0.9" fill="#f8fafc"/>
        </svg>`;
      }
      return `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4.5 25.5L9.5 20.5" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="5.2" cy="26.2" r="2" fill="#eab308" stroke="#78350f" stroke-width="0.8"/>
        <path d="M7.5 23L24 6.5L26.8 5.2L25.5 8L9 24.5Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M16.5 14L24.2 6.3L26.5 5.4L25.6 7.7L17.9 15.4Z" fill="#cbd5e1"/>
        <path d="M18.6 13.8L24.6 7.8" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="14.6" y="13.2" width="2.4" height="4.8" rx="0.8" transform="rotate(-45 14.6 13.2)" fill="#ef4444"/>
        <rect x="11" y="15.8" width="2" height="5.5" rx="0.8" transform="rotate(-45 11 15.8)" fill="#94a3b8"/>
      </svg>`;
    }
  };
  window.weaponSystem = weaponSystem;
  window.WEAPON_DEFS = WEAPON_DEFS;
  window.ENEMY_ATTACKS = ENEMY_ATTACKS;
  window.PLAYER_ATTACKS = PLAYER_ATTACKS;
})();
