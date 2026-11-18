/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationData.js - Hang so, style va tien ich dung chung.
 *
 * Duoc boc trong IIFE de khong tao qua nhieu bien global; cac module khac
 * doc qua window.AnimUtil / window.STYLE_DEFS / ...
 */

(function () {
if (!window.CharacterRegistry && typeof require === 'function') {
  try { require('../characters/bootstrap.js'); } catch (_) {}
}
const AnimUtil = {
  clamp(v, a = 0, b = 1) { return Math.max(a, Math.min(b, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  easeOut(t) { return 1 - Math.pow(1 - t, 3); },
  easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  progress(e) {
    return e.stateDuration > 0 ? this.clamp((e.stateTimer || 0) / e.stateDuration) : 0;
  },
  // Pha gồng: 0 -> 1 rồi giữ, thu về ở cuối đòn
  cham(p) {
    if (p < 0.25) return this.easeOut(p / 0.25);
    if (p < 0.65) return 1;
    return 1 - this.easeInOut((p - 0.65) / 0.35);
  },
  // Pha ra đòn: bật nhanh, giữ ngắn, thu về
  ext(p) {
    if (p < 0.25) return 0;
    if (p < 0.4) return this.easeOut((p - 0.25) / 0.15);
    if (p < 0.55) return 1;
    if (p < 0.7) return 1 - this.easeInOut((p - 0.55) / 0.15);
    return 0;
  },
  // Đường cong non-linear có lực bật, đàn hồi và thu hồi tự nhiên cho 5 giai đoạn kỹ năng
  easeInQuad(t) { t = this.clamp(t, 0, 1); return t * t; },
  easeInCubic(t) { t = this.clamp(t, 0, 1); return t * t * t; },
  easeOutCubic(t) { t = this.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
  easeInOutQuart(t) {
    t = this.clamp(t, 0, 1);
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  },
  easeOutBack(t, s = 1.70158) {
    t = this.clamp(t, 0, 1) - 1;
    return 1 + t * t * ((s + 1) * t + s);
  },
  easeOutElasticSoft(t) {
    t = this.clamp(t, 0, 1);
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) * 0.45 + 1;
  },
  // Bộ đánh giá 5 giai đoạn chuẩn mực:
  // 0: anticipation (lấy đà) -> 1: cast (tung chiêu) -> 2: impact (va chạm) -> 3: follow_through (quán tính) -> 4: recovery (hồi thế)
  stage5(p, bp) {
    p = this.clamp(p, 0, 1);
    const b = bp || {};
    const a = b.a !== undefined ? b.a : 0.22;
    const c = b.c !== undefined ? b.c : 0.42;
    const i = b.i !== undefined ? b.i : 0.58;
    const f = b.f !== undefined ? b.f : 0.80;

    if (p < a) {
      const t = a > 0 ? p / a : 1;
      const w = this.easeInOut(t);
      return {
        stage: 'anticipation', stageIndex: 0, localT: t,
        windup: w, strike: 0, hold: 0, follow: 0, recover: 0,
        arc: -0.35 * w, overshoot: 0
      };
    }
    if (p < c) {
      const t = (p - a) / Math.max(0.001, c - a);
      const s = this.easeInCubic(t);
      return {
        stage: 'cast', stageIndex: 1, localT: t,
        windup: 1 - s, strike: s, hold: 0, follow: 0, recover: 0,
        arc: s, overshoot: 0
      };
    }
    if (p < i) {
      const t = (p - c) / Math.max(0.001, i - c);
      const peak = this.easeOutBack(t, 1.45);
      return {
        stage: 'impact', stageIndex: 2, localT: t,
        windup: 0, strike: 1, hold: 1, follow: 0, recover: 0,
        arc: 1, overshoot: (peak - 1) * 0.4 + Math.sin(t * Math.PI) * 0.18
      };
    }
    if (p < f) {
      const t = (p - i) / Math.max(0.001, f - i);
      const fl = this.easeOutCubic(t);
      return {
        stage: 'follow_through', stageIndex: 3, localT: t,
        windup: 0, strike: 1 - fl * 0.25, hold: 1 - fl * 0.3, follow: fl, recover: 0,
        arc: 1 - fl * 0.22, overshoot: -0.08 * fl
      };
    }
    const t = (p - f) / Math.max(0.001, 1 - f);
    const rec = this.easeInOutQuart(t);
    return {
      stage: 'recovery', stageIndex: 4, localT: t,
      windup: 0, strike: Math.max(0, 0.75 * (1 - rec)), hold: Math.max(0, 0.7 * (1 - rec)),
      follow: 1 - rec, recover: rec,
      arc: 0.78 * (1 - rec), overshoot: 0
    };
  },
  // Nhịp con có đỉnh trong khoảng [t0, t1] dùng cho chuỗi chiêu nhiều đòn / tuyệt kỹ
  beat(p, t0, t1, peakHold = 0.35) {
    if (p <= t0 || p >= t1) return 0;
    const u = (p - t0) / Math.max(0.001, t1 - t0);
    const up = Math.max(0.15, (1 - peakHold) * 0.45);
    const downStart = up + peakHold;
    if (u < up) return this.easeOutCubic(u / up);
    if (u < downStart) return 1;
    return 1 - this.easeInOut((u - downStart) / Math.max(0.001, 1 - downStart));
  },
  extSmooth(p) {
    const s = this.stage5(p, { a: 0.22, c: 0.38, i: 0.56, f: 0.76 });
    return this.clamp(s.strike + s.overshoot * 0.5, 0, 1.15);
  },
  // Đòn bắt đầu gây sát thương ngay khi duỗi đòn, loại bỏ cảm giác trễ (delay)
  isActive(e) {
    const p = this.progress(e);
    if (e.state === 'flying_kick') return p > 0.08;
    return this.ext(p) > 0.2;
  },
  // Pha của đòn vũ khí (startup -> active -> recovery) theo thời gian thực của đòn đó
  wpPhase(e) {
    const a = e.atk;
    if (!a) return { w: 0, s: 0, r: 0 };
    const t = e.stateTimer || 0;
    const rc = a.recoveryEff || a.recovery || 0.3;
    return {
      w: this.clamp(t / a.startup),
      s: this.clamp((t - a.startup) / a.active),
      r: this.clamp((t - a.startup - a.active) / rc)
    };
  }
};
window.AnimUtil = AnimUtil;

function shadeColor(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

// Bảng ngoại hình chung cho lính thường / mộc nhân; ngoại hình của 13 nhân vật được nạp tự động từ js/entities/characters/*.js
const STYLE_DEFS = Object.assign({
  enemy_dodger:    { scale: 1.3,  skin: '#e4b68f', hair: '#222831', hairStyle: 'spiky', gi: '#0e7490', pants: '#0b5566', belt: '#67e8f9', aura: '#22d3ee', shoes: 'sneakers', eyeColor: '#06b6d4' },
  enemy_guard:     { scale: 1.36, skin: '#c99468', hair: '#1c1c1c', hairStyle: 'buzz', gi: '#6b2d2d', pants: '#3f1d1d', belt: '#f59e0b', armor: true, aura: '#f59e0b', shoes: 'combat', sunglasses: true },
  thug:            { scale: 1.3,  skin: '#e1b189', hair: '#1f2937', hairStyle: 'buzz', gi: '#3d4656', pants: '#2a303c', belt: '#9ca3af', aura: '#94a3b8', shoes: 'sneakers' },
  dummy_wood:      { scale: 1.32, skin: '#a37147', hair: '#5c3a21', hairStyle: 'buzz', gi: '#8b5a2b', pants: '#5c3a21', belt: '#f59e0b', aura: '#d97706', under: '#78350f', shoes: 'combat', eyeColor: '#f59e0b' },
  // Địch có vũ khí thật (weapons.js)
  enemy_baton:     { scale: 1.34, skin: '#d9a77c', hair: '#1f2937', hairStyle: 'buzz', gi: '#3f3f46', pants: '#27272a', belt: '#f97316', helmet: '#facc15', weapon: 'baton', weaponLen: 54, aura: '#fb923c', under: '#52525b', shoes: 'combat', eyeColor: '#f97316' },
  enemy_blade:     { scale: 1.3,  skin: '#e0b28a', hair: '#111827', hairStyle: 'bandana', bandana: '#111827', gi: '#7f1d1d', pants: '#3b0a0a', belt: '#e5e7eb', weapon: 'machete', weaponLen: 40, scar: true, aura: '#f87171', under: '#450a0a', shoes: 'sneakers', eyeColor: '#ef4444' },
  enemy_shield:    { scale: 1.4,  skin: '#c99468', hair: '#1c1c1c', hairStyle: 'buzz', gi: '#1e3a5f', pants: '#152a45', belt: '#d4a017', helmet: '#94a3b8', armor: true, riotShield: true, aura: '#60a5fa', under: '#334155', shoes: 'combat', eyeColor: '#38bdf8' },
  // Các lớp địch mở rộng (Giai đoạn 3)
  enemy_armored:   { scale: 1.48, skin: '#c99a70', hair: '#1a1a1a', hairStyle: 'buzz', gi: '#1f2937', pants: '#111827', belt: '#f59e0b', helmet: '#475569', armor: true, heavyShoulders: true, aura: '#f59e0b', under: '#374151', shoes: 'combat', eyeColor: '#f59e0b' },
  enemy_thrower:   { scale: 1.28, skin: '#e5b995', hair: '#292524', hairStyle: 'spiky', gi: '#78350f', pants: '#451a03', belt: '#fef08a', bandana: '#f59e0b', aura: '#ea580c', under: '#92400e', shoes: 'sneakers', eyeColor: '#ea580c' },
  enemy_brawler:   { scale: 1.34, skin: '#deb28b', hair: '#1c1917', hairStyle: 'short', gi: '#1e293b', pants: '#0f172a', belt: '#38bdf8', gauntlet: true, aura: '#0284c7', under: '#334155', shoes: 'wraps', eyeColor: '#38bdf8' },
  enemy_grabber:   { scale: 1.35, skin: '#d6a378', hair: '#172554', hairStyle: 'bandana', bandana: '#1e3a8a', gi: '#312e81', pants: '#1e1b4b', belt: '#a5b4fc', chainWeapon: true, aura: '#6366f1', under: '#3730a3', shoes: 'combat', eyeColor: '#818cf8' },
  enemy_medic:     { scale: 1.28, skin: '#f3c5a6', hair: '#1c1917', hairStyle: 'short', gi: '#065f46', pants: '#064e3b', belt: '#6ee7b7', medicCross: true, aura: '#10b981', under: '#047857', shoes: 'sneakers', eyeColor: '#34d399' }
}, window.CharacterRegistry ? window.CharacterRegistry.buildStyleDefsMap() : {});

// Biến thể ngoại hình cho lính thường: mỗi tên lính một màu áo / kiểu tóc / phụ kiện khác nhau
const VARIANTS = {
  thug: [
    { gi: '#3d4656', pants: '#2a303c', belt: '#9ca3af', aura: '#94a3b8' },
    { gi: '#7c2d12', pants: '#451a03', belt: '#fb923c', aura: '#fb923c', hairStyle: 'bandana', bandana: '#f97316', weapon: 'knife' },
    { gi: '#14532d', pants: '#052e16', belt: '#86efac', aura: '#4ade80', hairStyle: 'spiky', hair: '#3f2a14' },
    { gi: '#581c87', pants: '#3b0764', belt: '#d8b4fe', aura: '#c084fc', mask: '#7e22ce', weapon: 'baton' },
    { gi: '#713f12', pants: '#422006', belt: '#fde047', aura: '#facc15', hairStyle: 'short', scar: true, beard: true },
    { gi: '#1e3a8a', pants: '#172554', belt: '#93c5fd', aura: '#60a5fa', helmet: '#475569', weapon: 'baton' }
  ],
  enemy_dodger: [
    { gi: '#0e7490', pants: '#0b5566', belt: '#67e8f9', aura: '#22d3ee' },
    { gi: '#be185d', pants: '#831843', belt: '#f9a8d4', aura: '#f472b6', hairStyle: 'ponytail', scarfColor: '#f472b6' },
    { gi: '#4d7c0f', pants: '#365314', belt: '#bef264', aura: '#a3e635', hairStyle: 'bandana', bandana: '#84cc16', scarf: true, scarfColor: '#a3e635' },
    { gi: '#0f172a', pants: '#020617', belt: '#e2e8f0', aura: '#e2e8f0', mask: '#334155', weapon: 'knife' }
  ],
  enemy_guard: [
    { gi: '#6b2d2d', pants: '#3f1d1d', belt: '#f59e0b', aura: '#f59e0b' },
    { gi: '#374151', pants: '#1f2937', belt: '#d1d5db', aura: '#9ca3af', helmet: '#6b7280', shield: true },
    { gi: '#7f1d1d', pants: '#450a0a', belt: '#fca5a5', aura: '#f87171', helmet: '#991b1b', gauntlet: true },
    { gi: '#1e40af', pants: '#1e3a8a', belt: '#fbbf24', aura: '#60a5fa', helmet: '#cbd5e1', beard: true, weapon: 'baton' }
  ],
  enemy_baton: [
    { gi: '#3f3f46', pants: '#27272a', belt: '#f97316', helmet: '#facc15', aura: '#fb923c' },
    { gi: '#1e3a8a', pants: '#172554', belt: '#93c5fd', helmet: '#60a5fa', aura: '#3b82f6', hairStyle: 'buzz' },
    { gi: '#365314', pants: '#1a2e05', belt: '#a3e635', bandana: '#84cc16', hairStyle: 'bandana', aura: '#84cc16' }
  ],
  enemy_blade: [
    { gi: '#7f1d1d', pants: '#3b0a0a', belt: '#e5e7eb', aura: '#f87171', hairStyle: 'bandana', bandana: '#111827' },
    { gi: '#18181b', pants: '#09090b', belt: '#ef4444', aura: '#dc2626', hairStyle: 'spiky', mask: '#ef4444' },
    { gi: '#451a03', pants: '#271004', belt: '#fbbf24', aura: '#f59e0b', hairStyle: 'short', scar: true }
  ],
  enemy_shield: [
    { gi: '#1e3a5f', pants: '#152a45', belt: '#d4a017', helmet: '#94a3b8', aura: '#60a5fa' },
    { gi: '#374151', pants: '#1f2937', belt: '#e2e8f0', helmet: '#cbd5e1', aura: '#94a3b8' },
    { gi: '#064e3b', pants: '#022c22', belt: '#34d399', helmet: '#10b981', aura: '#10b981' }
  ],
  enemy_armored: [
    { gi: '#1f2937', pants: '#111827', helmet: '#475569', aura: '#f59e0b' },
    { gi: '#4a0404', pants: '#2b0202', helmet: '#7f1d1d', aura: '#ef4444' },
    { gi: '#064e3b', pants: '#022c22', helmet: '#10b981', aura: '#10b981' }
  ],
  enemy_thrower: [
    { gi: '#78350f', pants: '#451a03', bandana: '#f59e0b', aura: '#ea580c' },
    { gi: '#1e3a8a', pants: '#172554', bandana: '#38bdf8', aura: '#38bdf8' },
    { gi: '#3f3f46', pants: '#27272a', bandana: '#ef4444', aura: '#dc2626' }
  ],
  enemy_brawler: [
    { gi: '#1e293b', pants: '#0f172a', belt: '#38bdf8', aura: '#0284c7' },
    { gi: '#701a75', pants: '#4a044e', belt: '#f472b6', aura: '#d946ef' },
    { gi: '#14532d', pants: '#052e16', belt: '#86efac', aura: '#22c55e' }
  ],
  enemy_grabber: [
    { gi: '#312e81', pants: '#1e1b4b', belt: '#a5b4fc', aura: '#6366f1' },
    { gi: '#18181b', pants: '#09090b', belt: '#ef4444', aura: '#ef4444' },
    { gi: '#1e293b', pants: '#0f172a', belt: '#38bdf8', aura: '#00d2ff' }
  ],
  enemy_medic: [
    { gi: '#065f46', pants: '#064e3b', belt: '#6ee7b7', aura: '#10b981' },
    { gi: '#1e3a8a', pants: '#172554', belt: '#93c5fd', aura: '#38bdf8' },
    { gi: '#831843', pants: '#500724', belt: '#fbcfe8', aura: '#ec4899' }
  ]
};

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Đòn của Player & Boss (dùng chung cho vệt chuyển động, telegraph và va chạm)
const ATTACK_STATES = new Set([
  'punch', 'kick', 'punch_straight', 'punch_hook', 'kick_push', 'wk', 'kick_roundhouse', 'flying_kick', 'scissor_kick', 'ultimate_flurry',
  // Đòn thế Vovinam mở rộng của nhân vật chơi được
  'elbow_strike', 'kick_sweep', 'air_punch', 'hook_run', 'uppercut',
  // Kỹ thuật Counter Vovinam và tiếp đất
  'counter_hand_prep', 'counter_hand_strike', 'counter_leg_prep', 'counter_leg_strike', 'counter_hand_recovery', 'counter_leg_recovery', 'landing',
  // Tuyệt kỹ của các nhân vật chơi được
  'ultimate_slam', 'ultimate_command', 'ultimate_rush', 'ultimate_precision', 'ultimate_feint', 'ultimate_bash', 'ultimate_barrage', 'ultimate_blink',
  // Đòn của boss mới
  'boss_swing', 'boss_thrust', 'boss_slam', 'boss_chain1', 'boss_chain2', 'boss_chain3',
  'boss_riposte', 'boss_dash', 'boss_throw', 'boss_stab', 'boss_heavy1', 'boss_heavy2', 'boss_heavy3',
  'boss_bash', 'boss_upper',
  // Đòn của 5 loại địch mở rộng
  'overhead_smash', 'ram_charge', 'windup_throw', 'chain_cast', 'channel_heal',
  // Đòn của đồng minh hỗ trợ
  'attack', 'coop'
]);
window.ATTACK_STATES = ATTACK_STATES;

// Ánh xạ trạng thái mới -> pose có sẵn (các đòn đặc trưng đã tách pose riêng bên dưới)
const POSE_ALIAS = {
  punch: 'punch_straight', kick: 'kick_roundhouse',
  attack: 'punch_hook', coop: 'flying_kick',
  guard_practice: 'guard',
  boss_heavy1: 'punch_straight', boss_heavy2: 'punch_hook',
  boss_heavy3: 'kick_roundhouse', boss_dash: 'kick_push',
  boss_parry: 'guard', boss_feint: 'dodge',
  wk: 'kick_push',
  guard_break: 'hurt',
  counter_hand_strike: 'elbow_strike', counter_leg_strike: 'kick_sweep',
  counter_hand_recovery: 'guard', counter_leg_recovery: 'guard',
  windup_throw: 'punch_straight',
  chain_cast: 'punch_straight', channel_heal: 'guard'
};
const POSE_KEYS = ['hx', 'torso', 'head', 'lift', 'roll', 'nT', 'nS', 'nF', 'fT', 'fS', 'fF', 'nA', 'nE', 'fA', 'fE', 'fixedHy', 'fixW', 'grip'];

  window.STYLE_DEFS = STYLE_DEFS;
  window.VARIANTS = VARIANTS;
  window.shadeColor = shadeColor;
  window.hashStr = hashStr;
  window.POSE_ALIAS = POSE_ALIAS;
  window.POSE_KEYS = POSE_KEYS;
  window.AnimUtil = AnimUtil;
  window.ATTACK_STATES = ATTACK_STATES;
})();
