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
    }
  };

  // Cấu hình vũ khí nhặt được
  const WEAPON_DEFS = {
    baton: {
      name: 'CÔN', stance: 'baton', styleWeapon: 'baton', durability: 8, pickable: true,
      effect: 'stun', effectName: 'GÂY CHOÁNG', effectIcon: '💫',
      light: ['baton_sweep', 'baton_sweep'], heavy: ['baton_slam']
    },
    blade: {
      name: 'MÃ TẤU', stance: 'blade', styleWeapon: 'machete', durability: 9, pickable: true,
      effect: 'bleed', effectName: 'XUẤT HUYẾT', effectIcon: '🩸',
      light: ['blade_slash', 'blade_chop'], heavy: ['blade_lunge']
    },
    shield: {
      name: 'KHIÊN', stance: 'shield', styleWeapon: null, durability: 0, pickable: false,
      effect: 'guard', effectName: 'PHÒNG THỦ', effectIcon: '🛡️',
      light: [], heavy: []
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
  ['wp_baton_sweep', 'wp_baton_slam', 'wp_blade_slash', 'wp_blade_chop', 'wp_blade_lunge', 'wp_shield_strike', 'wp_shield_bash']
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
        window.combatSystem.checkAttackHit(this, player, {
          damage: a.damage, knockback: a.knockback, weight: a.weight,
          knockdown: !!a.knockdown, unblockable: !!a.unblockable,
          isKick: !!a.isKick, counterType: a.counterType || (a.isKick ? 'leg' : 'hand'),
          weaponEffect: a.weaponEffect,
          bleedChance: a.bleedChance, bleedDmg: a.bleedDmg,
          stunChance: a.stunChance, stunDuration: a.stunDuration, bossPoiseDmg: a.bossPoiseDmg,
          offsetX: box.offsetX, offsetY: box.offsetY, width: box.width, height: box.height
        });
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

      if (this.atk) { this.runAttack(dt, player); return; }
      this.brain(dt, player);
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
          window.combatSystem.checkAttackHit(this, player, hitData);
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
          window.combatSystem.checkAttackHit(this, player, hitData);
        }
        if (this.stateTimer >= this.stateDuration) {
          this.setState('idle');
          this.smashCooldown = 2.8;
        }
        return;
      }

      // AI quyết định ra đòn
      if (!this.isAttacking && this.state !== 'hurt' && this.state !== 'knockdown' && this.state !== 'getup') {
        const dx = (player.x - this.x) * this.facing;
        const dy = Math.abs(player.y - this.y);

        // Đòn húc vai tầm xa khi người chơi cách 130-260px
        if (dx > 120 && dx < 260 && dy < 35 && this.chargeCooldown <= 0) {
          this.facing = Math.sign(player.x - this.x) || this.facing;
          this.setState('ram_charge', 0.52);
          if (window.audioManager) window.audioManager.playWarning();
          if (window.effectManager) window.effectManager.addFloatingText('!', this.x, this.y - 160, 'crit');
          return;
        }

        // Đòn bổ búa cận chiến
        if (dx > 0 && dx < 95 && dy < 45 && this.smashCooldown <= 0) {
          this.facing = Math.sign(player.x - this.x) || this.facing;
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
      window.combatSystem.checkAttackHit(this, player, attackData);
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

  const weaponSystem = {
    drops: [],
    _nearest: null,

    reset(player) {
      this.drops = [];
      this._nearest = null;
      if (player) this.clearPlayerWeapon(player);
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
      if (window.audioManager) window.audioManager.playBlock();
    },

    // Nhặt tay: vũ khí bị người chơi giữ thì có độ bền hữu hạn (kế thừa đúng độ bền khi nhặt)
    setPlayerWeapon(player, type, dur = null) {
      const def = WEAPON_DEFS[type];
      if (!def) return;
      const currentDur = (dur !== null && dur !== undefined) 
        ? Math.max(1, Math.min(dur, def.durability)) 
        : def.durability;
      player.weapon = { type, dur: currentDur, max: def.durability, step: 0, lastAt: -99 };
      player.heldWeapon = type;
      player.stance = def.stance;
      player.atk = null;
    },

    clearPlayerWeapon(player) {
      player.weapon = null; player.heldWeapon = null; player.stance = null; player.atk = null;
    },

    update(dt, player, enemies) {
      this._nearest = null;
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
            if (!d.bounced) { d.bounced = true; d.vz = 120; d.vx *= 0.4; d.rotV *= 0.4; if (window.effectManager) window.effectManager.createDust(d.x, d.y, 4, 20); }
            else { d.landed = true; d.vz = 0; d.vx = 0; d.rotV = 0; d.rot = Math.round(d.rot / Math.PI) * Math.PI + 0.12; }
          }
        }
        if (d.age > DROP_LIFE || (!d.pickable && d.age > 7)) this.drops.splice(i, 1);
      }

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
        if (best && ePressed) {
          // Kiểm tra hợp lệ phía xử lý gameplay: khoảng cách và trạng thái
          const realDist = Math.hypot(best.x - player.x, (best.y - player.y) * 1.6);
          if (realDist <= 85 && best.pickable && best.landed) {
            // Nếu người chơi đang cầm vũ khí cũ thì rơi vũ khí cũ ra thế giới, giữ nguyên độ bền còn lại
            if (player.weapon) {
              this.spawnDrop(player.weapon.type, player.x - player.facing * 28, player.y, -player.facing, player.weapon.dur);
            }
            this.setPlayerWeapon(player, best.type, best.dur);
            const idx = this.drops.indexOf(best);
            if (idx !== -1) this.drops.splice(idx, 1);
            this._nearest = null;
            const def = WEAPON_DEFS[best.type];
            const effTxt = def && def.effectName ? ` — ${def.effectName} ${def.effectIcon || ''}` : '';
            if (window.audioManager) window.audioManager.playClick();
            if (window.effectManager) window.effectManager.addFloatingText('NHẶT ' + (def ? def.name : 'VŨ KHÍ') + ` (${player.weapon.dur}/${player.weapon.max})${effTxt}!`, player.x, player.y - 170, 'heal');
          }
        }
      }
    },

    // ----- Người chơi tấn công bằng vũ khí -----
    startPlayerAttack(player, kind) {
      const w = player.weapon;
      if (!w) return false;
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
      const w = player.weapon;
      if (!a || !w) { player._wpActive = false; player.setState('idle'); return; }
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
          w.dur--;
        }
      }
      if (t >= su + ac + a.recovery) {
        player.atk = null;
        player._wpActive = false;
        player.comboWindowTimer = 0;
        if (w.dur <= 0) {
          if (window.effectManager) {
            window.effectManager.addFloatingText(WEAPON_DEFS[w.type].name + ' GÃY!', player.x, player.y - 170, 'warn');
            window.effectManager.createHitSparks(player.x + player.facing * 40, player.y - 80, 10, false);
          }
          if (window.audioManager) window.audioManager.playHeavyHit();
          this.clearPlayerWeapon(player);
        }
        player.setState('idle');
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

    // ----- Vẽ -----
    render(ctx, camera) {
      for (const d of this.drops) {
        const sx = d.x - camera.x, sy = d.y - camera.y;
        if (sx < -80 || sx > 1700) continue;
        const blink = d.age > DROP_LIFE - 4 && Math.floor(d.age * 6) % 2 === 0;
        if (blink) continue;
        ctx.save();
        // bóng
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.beginPath(); ctx.ellipse(sx, sy + 2, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
        // vòng sáng nhận biết vật nhặt được
        if (d.pickable && d.landed) {
          const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006);
          ctx.fillStyle = `rgba(250, 204, 21, ${0.10 + 0.10 * pulse})`;
          ctx.beginPath(); ctx.ellipse(sx, sy, 30 + 4 * pulse, 9 + pulse, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.translate(sx, sy + d.z - 6);
        ctx.rotate(d.rot);
        if (d.type === 'baton') {
          ctx.fillStyle = '#1f2330'; ctx.fillRect(-26, -3, 52, 6);
          ctx.fillStyle = '#9aa5b1'; ctx.fillRect(14, -3.6, 12, 7.2);
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-24, -2.4, 40, 1.4);
        } else if (d.type === 'blade') {
          ctx.fillStyle = '#dbe4ee';
          ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(30, -3); ctx.lineTo(34, 0); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-4, -2.6, 32, 1.4);
          ctx.fillStyle = '#3b2a1a'; ctx.fillRect(-22, -3, 16, 6);
          ctx.fillStyle = '#c1121f'; ctx.fillRect(-14, -3.4, 3, 6.8);
        } else {
          ctx.fillStyle = '#4b5d73'; ctx.fillRect(-9, -26, 18, 52);
          ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.strokeRect(-9, -26, 18, 52);
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-5, -20, 4, 18);
        }
        ctx.restore();
      }
    },

    // Chữ gợi ý nhặt + độ bền vũ khí đang cầm (vẽ sau thực thể để không bị che)
    renderHud(ctx, camera, player) {
      if (this._nearest) {
        const d = this._nearest;
        const sx = d.x - camera.x, sy = d.y - camera.y - 44;
        ctx.save();
        ctx.font = '800 13px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        const def = WEAPON_DEFS[d.type];
        const wName = (def && def.name) ? def.name : 'VŨ KHÍ';
        const durText = (d.dur !== undefined && d.maxDur) ? ` (${d.dur}/${d.maxDur})` : '';
        const effIcon = (def && def.effectIcon) ? ` ${def.effectIcon}` : '';
        const txt = 'E — NHẶT ' + wName + durText + effIcon;
        const w = ctx.measureText(txt).width + 18;
        ctx.fillStyle = 'rgba(8,10,18,0.85)'; ctx.fillRect(sx - w / 2, sy - 14, w, 24);
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.strokeRect(sx - w / 2 + 0.5, sy - 13.5, w - 1, 23);
        ctx.fillStyle = '#fde68a'; ctx.fillText(txt, sx, sy + 3);
        ctx.restore();
      }
      if (player && player.weapon && !player.isDead) {
        const w = player.weapon;
        const def = WEAPON_DEFS[w.type];
        const sx = player.x - camera.x, sy = player.y + (player.z || 0) - camera.y - 128 * 1.3 / 1.3 - 36;
        ctx.save();
        ctx.translate(Math.round(sx - 28), Math.round(sy));
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(-2, -2, 60, 9);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, 0, 56, 5);
        ctx.fillStyle = w.dur <= 2 ? '#ef4444' : '#facc15';
        ctx.fillRect(0, 0, 56 * clamp(w.dur / w.max), 5);
        ctx.font = '800 9px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde68a';
        const effIcon = (def && def.effectIcon) ? ` ${def.effectIcon}` : '';
        ctx.fillText(((def && def.name) ? def.name : 'VŨ KHÍ') + effIcon + ' ' + w.dur + '/' + w.max, 28, -5);
        ctx.restore();
      }
    }
  };
  window.weaponSystem = weaponSystem;
  window.WEAPON_DEFS = WEAPON_DEFS;
  window.ENEMY_ATTACKS = ENEMY_ATTACKS;
  window.PLAYER_ATTACKS = PLAYER_ATTACKS;
})();
