/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/animation.js - Procedural skeletal animation v2
 *
 * - Quy ước góc: 0 = chi buông thẳng xuống, dương = vung về PHÍA TRƯỚC (+x), PI = chỉ thẳng lên.
 * - Chân tính theo phương thẳng đứng của thế giới, tay tính tương đối so với thân.
 * - Đòn đánh dùng 3 pha: gồng (cham) -> ra đòn (ext) -> thu về, đồng bộ với cửa sổ va chạm.
 * - Pose được blend mượt giữa các trạng thái, chân luôn tự "bám sàn".
 */

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

// Bảng nhân vật. Võ phục Ngô Nhất Nghị: xanh dương Vovinam, Bạch đai (đai trắng).
const STYLE_DEFS = {
  player:          { scale: 1.3,  skin: '#f0c29a', hair: '#15171d', hairStyle: 'short', gi: '#1f4fd6', pants: '#2352d8', belt: '#f8fafc', patch: true, aura: '#38bdf8', shoes: 'kungfu', eyeColor: '#0ea5e9' },
  boss_haclang:    { scale: 1.4,  skin: '#dcae82', hair: '#2a1a1a', hairStyle: 'bandana', gi: '#2a1217', pants: '#1c0d10', belt: '#9b111e', weapon: 'machete', aura: '#ff2244', under: '#4a2128', bandana: '#c1121f', shoes: 'combat', eyeColor: '#ef4444' },
  boss_thietquyen: { scale: 1.5,  skin: '#c99a70', hair: '#1a1a1a', hairStyle: 'buzz', gi: '#2f3640', pants: '#20252c', belt: '#d4a017', gauntlet: true, armor: true, scar: true, aura: '#ffd700', under: '#4b5563', shoes: 'wraps', eyeColor: '#eab308' },
  boss_huyetanh:   { scale: 1.4,  skin: '#efc9ae', hair: '#1a0000', hairStyle: 'spiky', gi: '#5a0f1c', pants: '#2b0610', belt: '#e11d48', weapon: 'twin_daggers', mask: '#c9184a', aura: '#ff0055', under: '#2b0610', shoes: 'kungfu', glowingEyes: '#ff0055' },
  boss_longvuong:  { scale: 1.45, skin: '#f1cfa6', hair: '#e5e7eb', hairStyle: 'white', gi: '#15120f', pants: '#0d0b09', belt: '#eab308', dragon: true, beard: true, aura: '#facc15', under: '#7c5a10', shoes: 'dress', eyeColor: '#ca8a04' },
  enemy_dodger:    { scale: 1.3,  skin: '#e4b68f', hair: '#222831', hairStyle: 'spiky', gi: '#0e7490', pants: '#0b5566', belt: '#67e8f9', aura: '#22d3ee', shoes: 'sneakers', eyeColor: '#06b6d4' },
  enemy_guard:     { scale: 1.36, skin: '#c99468', hair: '#1c1c1c', hairStyle: 'buzz', gi: '#6b2d2d', pants: '#3f1d1d', belt: '#f59e0b', armor: true, aura: '#f59e0b', shoes: 'combat', sunglasses: true },
  thug:            { scale: 1.3,  skin: '#e1b189', hair: '#1f2937', hairStyle: 'buzz', gi: '#3d4656', pants: '#2a303c', belt: '#9ca3af', aura: '#94a3b8', shoes: 'sneakers' },
  npc_huavudai:    { scale: 1.32, skin: '#e8bf98', hair: '#374151', hairStyle: 'short', gi: '#1c1c24', pants: '#15151c', belt: '#3a3a46', aura: '#ef4444', under: '#f8fafc', suit: true, shoes: 'dress', eyeColor: '#ef4444' },
  boss_hoanganh:   { scale: 1.46, skin: '#c99468', hair: '#241a12', hairStyle: 'buzz', gi: '#4d462d', pants: '#2e2a1b', belt: '#b91c1c', weapon: 'hoe', scar: true, aura: '#f59e0b', under: '#292518', shoes: 'wraps', eyeColor: '#f59e0b' },
  boss_vinhtam:    { scale: 1.44, skin: '#e8be96', hair: '#e2e8f0', hairStyle: 'white', gi: '#4a121a', pants: '#2a0a0f', belt: '#ffd700', dragon: true, beard: true, robe: true, aura: '#ffd700', under: '#6b1d28', shoes: 'dress', eyeColor: '#ffd700' },
  boss_giangmanh:  { scale: 1.38, skin: '#deb28b', hair: '#cbd5e1', hairStyle: 'ponytail', gi: '#1e293b', pants: '#0f172a', belt: '#94a3b8', beard: true, robe: true, aura: '#38bdf8', under: '#334155', shoes: 'kungfu', eyeColor: '#38bdf8' },
  boss_dunghai:    { scale: 1.35, skin: '#e0b28a', hair: '#18181b', hairStyle: 'spiky', gi: '#1f242d', pants: '#13161c', belt: '#991b1b', scarf: true, scarfColor: '#dc2626', weapon: 'twin_daggers', aura: '#ef4444', under: '#27272a', shoes: 'combat', eyeColor: '#ef4444' },
  npc_mocdang:     { scale: 1.3,  skin: '#edd0b7', hair: '#1e293b', hairStyle: 'short', gi: '#0f293a', pants: '#0a1d24', belt: '#00d2ff', glasses: true, aura: '#00d2ff', under: '#e0f2fe', suit: true, shoes: 'dress' },
  boss_bichlam:    { scale: 1.34, skin: '#f5c6a5', hair: '#18181b', hairStyle: 'spiky', gi: '#166534', pants: '#0f3d24', belt: '#22c55e', aura: '#4ade80', under: '#14532d', shoes: 'combat', eyeColor: '#22c55e' },
  boss_dinhan:     { scale: 1.45, skin: '#d4a179', hair: '#1c1917', hairStyle: 'ponytail', gi: '#7a1a1f', pants: '#401013', belt: '#d4a017', shield: true, weapon: 'mace', weaponLen: 46, armor: true, beard: true, aura: '#d4a017', under: '#991b1b', shoes: 'combat', eyeColor: '#d4a017' },
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
};

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
  'punch', 'kick', 'punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse', 'flying_kick', 'scissor_kick', 'ultimate_flurry',
  // Đòn thế Vovinam mở rộng của nhân vật chơi được
  'elbow_strike', 'kick_sweep', 'air_punch', 'hook_run', 'uppercut',
  // Kỹ thuật Counter Vovinam và tiếp đất
  'counter_hand_prep', 'counter_hand_strike', 'counter_leg_prep', 'counter_leg_strike', 'counter_hand_recovery', 'counter_leg_recovery', 'landing',
  // Tuyệt kỹ của các nhân vật chơi được
  'ultimate_slam', 'ultimate_command', 'ultimate_rush', 'ultimate_precision', 'ultimate_feint', 'ultimate_bash',
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
  guard_break: 'hurt',
  counter_hand_strike: 'elbow_strike', counter_leg_strike: 'kick_sweep',
  counter_hand_recovery: 'guard', counter_leg_recovery: 'guard',
  ultimate_command: 'boss_taunt', ultimate_rush: 'flying_kick',
  ultimate_precision: 'kick_roundhouse', ultimate_feint: 'punch_hook',
  windup_throw: 'punch_straight',
  chain_cast: 'punch_straight', channel_heal: 'guard'
};
const POSE_KEYS = ['hx', 'torso', 'head', 'lift', 'roll', 'nT', 'nS', 'nF', 'fT', 'fS', 'fF', 'nA', 'nE', 'fA', 'fE', 'fixedHy', 'fixW', 'grip'];

class SkeletalRenderer {
  constructor() {
    this.SCALE = 1.3;
    this._styles = {};
  }

  // Tương thích ngược: vẽ nhân vật theo styleType
  drawCharacter(ctx, entity, styleType) {
    if (!entity) return;
    const oldStyle = entity.styleType;
    if (styleType) entity.styleType = styleType;
    this.render(ctx, entity, { x: 0, y: 0 });
    if (styleType) entity.styleType = oldStyle;
  }

  // ------------------------------------------------------------------ STYLE
  getStyle(e) {
    let type = e.styleType || e.type || 'thug';
    // Lính thường (không phải boss/người chơi): chọn biến thể ổn định theo id
    if (!e.isBoss && e.type !== 'player' && VARIANTS[type]) {
      if (e.variant === undefined) e.variant = hashStr(String(e.id || '')) % VARIANTS[type].length;
      type = type + '#' + e.variant;
    }
    if (!this._styles[type]) this._styles[type] = this.buildStyle(type);
    let st = this._styles[type];
    // Địch đã mất vũ khí: bỏ vũ khí/khiên khỏi hình vẽ (không còn vũ khí vô hình)
    if (e.armed === false && (st.weapon || st.riotShield)) {
      const k = type + '!unarmed';
      if (!this._styles[k]) this._styles[k] = Object.assign({}, st, { weapon: null, riotShield: false });
      st = this._styles[k];
    }
    // Trang phục Võ Phục Vovinam (Áo lam truyền thống, đai vàng/trắng, huy hiệu Vovinam trước ngực)
    // Ngô Nhất Nghị ('nghi') mặc định đã mặc Võ Phục Vovinam nên không áp dụng ghi đè skin phụ này
    const charKey = e.characterId || e.charId || (e.type === 'player' ? (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter) || 'nghi' : null);
    const isVovinam = (typeof e.vovinamSkin === 'boolean')
      ? (e.vovinamSkin && charKey !== 'nghi')
      : ((e.type === 'player' || e.isAlly) && charKey && charKey !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(charKey, 'vovinam'));
    if (isVovinam) {
      const k = type + '!vovinam';
      if (!this._styles[k]) {
        const vovinamOverrides = {
          gi: '#1f4fd6',
          giD: '#143896',
          giL: '#38bdf8',
          pants: '#1c42b8',
          pantsD: '#122c7a',
          belt: st.belt === '#f8fafc' ? '#f8fafc' : '#facc15',
          beltD: '#b45309',
          patch: true,
          suit: false,
          coat: false,
          aura: st.aura || '#38bdf8'
        };
        this._styles[k] = Object.assign({}, st, vovinamOverrides);
      }
      st = this._styles[k];
    }
    // Người chơi đang cầm vũ khí nhặt được trên sân ([E] Nhặt Côn / Mã Tấu): luôn ưu tiên hiển thị vũ khí đang cầm trên tay!
    const heldType = e.heldWeapon || (e.weapon && e.weapon.type) || null;
    if (heldType && window.WEAPON_DEFS && window.WEAPON_DEFS[heldType] && window.WEAPON_DEFS[heldType].styleWeapon) {
      const k = type + (isVovinam ? '!vovinam' : '') + '!held' + heldType;
      if (!this._styles[k]) {
        const wd = window.WEAPON_DEFS[heldType];
        this._styles[k] = Object.assign({}, st, {
          weapon: wd.styleWeapon,
          weaponLen: wd.styleWeapon === 'baton' ? 54 : 40,
          shield: false
        });
      }
      st = this._styles[k];
    }
    return e.ghostColor ? this.solidStyle(st, e.ghostColor) : st;
  }

  buildStyle(type) {
    const parts = type.split('#');
    const base = STYLE_DEFS[parts[0]] || STYLE_DEFS.thug;
    const vr = parts.length > 1 ? VARIANTS[parts[0]][+parts[1]] : null;
    const d = Object.assign({}, base, vr || {});
    const st = Object.assign({ metal: '#9aa5b1', patchA: '#e11d2e', patchB: '#ffd23f', under: '#e5e7eb' }, d);
    st.skinD = shadeColor(st.skin, -0.2);
    st.giD = shadeColor(st.gi, -0.33);
    st.giL = shadeColor(st.gi, 0.2);
    st.pantsD = shadeColor(st.pants, -0.3);
    st.beltD = shadeColor(st.belt, -0.3);
    return st;
  }

  solidStyle(st, col) {
    const o = Object.assign({}, st);
    ['skin', 'skinD', 'hair', 'gi', 'giD', 'giL', 'pants', 'pantsD', 'belt', 'beltD', 'under', 'patchA', 'patchB', 'metal', 'mask', 'bandana']
      .forEach((k) => { if (o[k]) o[k] = col; });
    o.aura = col;
    return o;
  }

  // ------------------------------------------------------------------ POSES
  calculatePose(e) {
    const U = AnimUtil;
    const t = e.animTime || 0;
    const st = POSE_ALIAS[e.state] || e.state || 'idle';
    const style = this.getStyle(e);
    const p = U.progress(e);
    const ch = U.cham(p);
    const ex = U.ext(p);
    const mix = (rest, cham, ext) => U.lerp(U.lerp(rest, cham, ch), ext, ex);

    const hasHoe = (style.weapon === 'hoe');
    const hasMaceShield = (style.weapon === 'mace' || style.shield);
    const isHoangAnh = (e.styleType === 'boss_hoanganh' || e.type === 'boss_hoanganh' || e.charId === 'hoanganh' || e.characterId === 'hoanganh');
    const isDinhAn = (e.styleType === 'boss_dinhan' || e.type === 'boss_dinhan' || e.charId === 'dinhan' || e.characterId === 'dinhan');

    const P = {
      hx: 0, torso: 0.14, head: -0.05, lift: 0, roll: 0, fixedHy: 44, fixW: 0,
      grip: hasHoe ? 1.16 : (style.weapon === 'mace' ? -0.34 : 0),
      nT: 0.62, nS: -0.82, nF: 0, fT: -0.55, fS: 0.15, fF: 0,
      nA: hasHoe ? 0.44 : 0.7,
      nE: hasHoe ? 0.64 : 1.8,
      fA: hasHoe ? 0.44 : 0.35,
      fE: hasHoe ? 0.64 : 1.95
    };

    // Cuốc: cán nằm NGANG qua hai nắm tay (vuông góc cẳng tay). Truyền: thân, cánh tay trên, cẳng tay, góc cán (tuyệt đối)
    const hoeArms = (torso, upper, fore, shaft) => {
      P.nA = upper - torso; P.nE = fore - upper; P.grip = shaft - fore;
      P.fA = P.nA; P.fE = P.nE;
    };

    switch (st) {
      case 'idle': {
        // Phó Đặng Hoàng Anh: Nếu có cuốc sắt thì cầm cuốc bằng 2 tay đĩnh đạc trước ngực
        if (hasHoe) {
          const b = Math.sin(t * 2.2);
          P.torso = 0.18 + 0.015 * b;
          P.head = -0.06;
          P.nT = 0.76; P.nS = -0.98;
          P.fT = -0.68; P.fS = 0.22;
          P.lift = Math.sin(t * 2.2) * 1.2;
          hoeArms(P.torso, 0.58 + 0.03 * b, 1.22, 2.38 + 0.04 * b);
          P.hx = Math.sin(t * 1.1) * 0.8;
          break;
        }
        // Triệu Đình An: Tay trái dựng Khiên Hổ Phù che ngực, tay phải giữ Thiết Chùy nghiêng 45 độ uy nghi (không che mặt)
        if (hasMaceShield) {
          const b = Math.sin(t * 2.2);
          P.torso = 0.16 + 0.012 * b;
          P.head = -0.05;
          P.nT = 0.78; P.nS = -1.0;
          P.fT = -0.68; P.fS = 0.24;
          P.lift = Math.sin(t * 2.2) * 1.0;
          P.nA = 0.34 + 0.03 * b; P.nE = 1.08; P.grip = -0.34;
          P.fA = 0.92 - 0.02 * b; P.fE = 0.96;
          P.hx = Math.sin(t * 1.1) * 0.6;
          break;
        }
        const b = Math.sin(t * 3.2);
        P.torso = 0.14 + 0.02 * b;
        P.hx = Math.sin(t * 1.6) * 1.2;
        // Nhún gối nhịp nhàng theo hơi thở võ thuật
        const kneeB = Math.sin(t * 3.2) * 0.05;
        P.nT = 0.62 + kneeB;
        P.nS = -0.82 - kneeB * 1.2;
        P.fT = -0.55 - kneeB * 0.8;
        P.fS = 0.15 + kneeB;
        P.lift = Math.sin(t * 3.2) * 1.8;
        P.nA = 0.7 + 0.04 * b;
        P.fA = 0.35 - 0.03 * b;
        P.head = -0.05 + 0.02 * b;
        break;
      }
      case 'captive': {
        P.torso = 0.45; P.head = 0.55;
        P.nA = 0.15; P.nE = 0.3; P.fA = -0.1; P.fE = 0.3;
        P.nT = 1.45; P.nS = -2.7; P.fT = 1.2; P.fS = -2.6;
        break;
      }
      case 'walk': {
        const isBackpedal = (e.vx * (e.facing || 1) < -10);
        const dir = isBackpedal ? -1 : 1;

        // Phó Đặng Hoàng Anh: Có cuốc sắt thì hai tay giữ cán cuốc nhịp nhàng theo bước chân
        if (hasHoe) {
          const c = t * 6.5 * dir;
          const s = Math.sin(c), co = Math.cos(c);
          P.torso = isBackpedal ? 0.10 : 0.20;
          P.nT = 0.25 + 0.52 * s; P.nS = -(0.3 + 0.85 * Math.max(0, co));
          P.fT = 0.25 - 0.52 * s; P.fS = -(0.3 + 0.85 * Math.max(0, -co));
          hoeArms(P.torso, 0.62 + 0.05 * s, 1.2, 2.34 + 0.06 * s);
          break;
        }
        // Triệu Đình An: Dựng khiên trước ngực, tay phải vung nhẹ Thiết Chùy theo bước tiến
        if (hasMaceShield) {
          const c = t * 6.0 * dir;
          const s = Math.sin(c), co = Math.cos(c);
          P.torso = isBackpedal ? 0.12 : 0.22;
          P.nT = 0.28 + 0.48 * s; P.nS = -(0.32 + 0.8 * Math.max(0, co));
          P.fT = 0.28 - 0.48 * s; P.fS = -(0.32 + 0.8 * Math.max(0, -co));
          P.nA = 0.32 + 0.06 * s; P.nE = 1.1; P.grip = -0.32;
          P.fA = 0.92 - 0.04 * s; P.fE = 0.95;
          break;
        }

        const c = t * 9 * dir, s = Math.sin(c), co = Math.cos(c);
        P.torso = isBackpedal ? 0.08 : 0.16;
        P.nT = 0.15 + 0.6 * s; P.nS = -(0.2 + 0.9 * Math.max(0, co));
        P.fT = 0.15 - 0.6 * s; P.fS = -(0.2 + 0.9 * Math.max(0, -co));
        if (isBackpedal) {
          P.nA = 0.85; P.nE = 1.4; P.fA = 0.45; P.fE = 1.6;
        } else {
          P.nA = 0.7 + 0.07 * s; P.fA = 0.35 - 0.07 * s;
        }
        break;
      }
      case 'run': {
        const c = t * 14, s = Math.sin(c), co = Math.cos(c);
        P.torso = 0.42; P.head = -0.2;
        P.nT = 0.2 + 0.95 * s; P.nS = -(0.3 + 1.25 * Math.max(0, co));
        P.fT = 0.2 - 0.95 * s; P.fS = -(0.3 + 1.25 * Math.max(0, -co));
        P.nF = -0.5 * Math.max(0, co); P.fF = -0.5 * Math.max(0, -co);
        if (hasHoe) {
          hoeArms(P.torso, 0.48 + 0.08 * s, 1.15, 2.28 + 0.08 * s);
          break;
        }
        if (hasMaceShield && isDinhAn) {
          P.nA = 0.28 - 0.22 * s; P.nE = 1.05; P.grip = -0.32;
          P.fA = 0.95; P.fE = 0.88;
          break;
        }
        P.nA = 0.35 - 1.1 * s; P.nE = 1.5; P.fA = 0.35 + 1.1 * s; P.fE = 1.5;
        break;
      }
      case 'jump_up': {
        P.torso = 0.1;
        P.nT = 1.0; P.nS = -1.7; P.fT = 0.35; P.fS = -1.1; P.nF = -0.5; P.fF = -0.5;
        if (hasHoe) {
          hoeArms(P.torso, 0.72, 1.32, 2.48);
          break;
        }
        P.nA = 2.2; P.nE = 0.3; P.fA = 1.6; P.fE = 0.4;
        break;
      }
      case 'jump_fall': {
        P.torso = 0.05;
        P.nT = 0.5; P.nS = -0.3; P.fT = -0.3; P.fS = -0.15;
        if (hasHoe) {
          hoeArms(P.torso, 0.55, 1.18, 2.32);
          break;
        }
        P.nA = 1.0; P.nE = 1.2; P.fA = 0.5; P.fE = 1.2;
        break;
      }
      case 'guard': {
        if (hasHoe) {
          P.torso = 0.24; P.head = -0.08;
          P.nT = 0.85; P.nS = -1.2; P.fT = -0.7; P.fS = 0.22;
          hoeArms(P.torso, 0.72, 1.38, 2.55);
          break;
        }
        if (hasMaceShield && isDinhAn) {
          P.torso = 0.22; P.head = -0.08;
          P.nT = 0.86; P.nS = -1.22; P.fT = -0.72; P.fS = 0.22;
          P.nA = 0.22; P.nE = 1.15; P.grip = -0.25;
          P.fA = 1.18; P.fE = 0.82;
          break;
        }
        P.torso = 0.26; P.head = -0.1;
        P.nT = 0.85; P.nS = -1.25; P.fT = -0.7; P.fS = 0.2;
        P.nA = 1.05; P.nE = 1.75; P.fA = 0.85; P.fE = 2.0;
        break;
      }
      case 'punch_straight': {
        const stDef = style;
        if (stDef.weapon === 'mace') {
          // Triệu Đình An: Nâng Thiết Chùy lên trên vai phải rồi giáng chéo xuống trước mặt, tay trái dựng Khiên hộ ngực
          P.torso = mix(0.16, -0.24, 0.44);
          P.head = mix(-0.05, 0.06, -0.12);
          P.hx = mix(0, -4, 7);
          P.nA = mix(0.34, 1.95, 0.68); P.nE = mix(1.08, 0.52, 0.14);
          P.grip = mix(-0.34, 0.25, -0.85);
          P.fA = mix(0.92, 1.08, 0.72); P.fE = mix(0.96, 0.88, 1.05);
          P.nT = mix(0.78, 0.65, 1.02); P.nS = mix(-1.0, -0.85, -0.58);
          P.fT = mix(-0.68, -0.72, -0.82); P.fS = mix(0.24, 0.2, 0.25);
          break;
        }
        if (stDef.weapon === 'hoe') {
          // Phó Đặng Hoàng Anh: Hai tay nắm chắc cán cuốc, thu lực bên sườn rồi đâm/bổ đầu cuốc lao thẳng tới trước
          P.torso = mix(0.18, -0.18, 0.46);
          P.head = mix(-0.06, 0.06, -0.12);
          P.hx = mix(0, -4, 8);
          hoeArms(
            P.torso,
            mix(0.58, 0.28, 1.18),
            mix(1.22, 0.92, 1.38),
            mix(2.38, 2.05, 1.56)
          );
          P.nT = mix(0.76, 0.55, 1.12); P.nS = mix(-0.98, -0.72, -1.22);
          P.fT = mix(-0.68, -0.82, -0.35); P.fS = mix(0.22, 0.15, 0.1);
          break;
        }
        P.torso = mix(0.14, -0.05, 0.46);
        P.hx = mix(0, -2, 4);
        P.nA = mix(0.7, 0.15, 1.35); P.nE = mix(1.8, 1.6, 0.02);
        P.grip = stDef.weapon ? mix(0, 0.15, -0.95) : 0;
        P.fA = mix(0.35, 0.6, -0.2); P.fE = mix(1.95, 2.1, 2.3);
        P.nT = mix(0.62, 0.62, 0.85); P.nS = mix(-0.82, -0.82, -0.5);
        P.fT = mix(-0.55, -0.55, -0.75); P.fS = mix(0.15, 0.15, 0.25);
        break;
      }
      case 'punch_hook': {
        const stDef = style;
        if (stDef.weapon === 'mace') {
          // Triệu Đình An: Mở rộng vai phải lấy đà rồi quét ngang Thiết Chùy ngàn cân phá thế
          P.torso = mix(0.16, -0.34, 0.52);
          P.head = mix(-0.05, 0.08, -0.14);
          P.hx = mix(0, -5, 8);
          P.nA = mix(0.34, -0.85, 1.42); P.nE = mix(1.08, 0.72, 0.12);
          P.grip = mix(-0.34, 0.35, -0.76);
          P.fA = mix(0.92, 1.12, 0.45); P.fE = mix(0.96, 0.85, 1.15);
          P.nT = mix(0.78, 0.68, 1.05); P.nS = mix(-1.0, -1.05, -0.65);
          P.fT = mix(-0.68, -0.65, -0.82); P.fS = mix(0.24, 0.2, 0.2);
          break;
        }
        if (stDef.weapon === 'hoe') {
          // Phó Đặng Hoàng Anh: Hai tay vung cuốc sắt qua vai rồi bổ quét vòng cung rộng phía trước
          P.torso = mix(0.18, -0.32, 0.48);
          P.head = mix(-0.06, 0.1, -0.14);
          P.hx = mix(0, -6, 8);
          hoeArms(
            P.torso,
            mix(0.58, 1.72, 0.88),
            mix(1.22, 1.98, 1.05),
            mix(2.38, 3.08, 1.38)
          );
          P.nT = mix(0.76, 0.62, 1.14); P.nS = mix(-0.98, -0.85, -1.18);
          P.fT = mix(-0.68, -0.78, -0.35); P.fS = mix(0.22, 0.2, 0.12);
          break;
        }
        P.torso = mix(0.14, -0.25, 0.58);
        P.hx = mix(0, -3, 5);
        P.nA = mix(0.7, -0.6, 1.55); P.nE = mix(1.8, 1.8, 1.2);
        P.grip = stDef.weapon ? mix(0, 0.3, -0.78) : 0;
        P.fA = mix(0.35, 0.8, 0.4); P.fE = 2.1;
        P.nT = mix(0.62, 0.62, 0.85); P.nS = mix(-0.82, -0.82, -0.65);
        P.fT = mix(-0.55, -0.55, -0.7); P.fS = mix(0.15, 0.15, 0.2);
        break;
      }
      case 'boss_bash': {
        // Triệu Đình An: Đưa Khiên Hổ Phù chắn ngay trước ngực lao ủi thẳng tới, tay phải thu Thiết Chùy lấy đà rồi bổ xuống
        if (!hasMaceShield && isDinhAn) {
          // Khi mặc Võ Phục Vovinam (tay không): Thiết Sơn Khảo / Song Chưởng Công Phá
          P.torso = mix(0.16, -0.22, 0.52);
          P.hx = mix(0, -4, 9);
          P.nA = mix(0.7, -0.35, 1.32); P.nE = mix(1.8, 1.65, 0.22);
          P.fA = mix(0.35, -0.2, 1.18); P.fE = mix(1.95, 1.7, 0.3);
          P.nT = mix(0.62, 0.52, 1.15); P.nS = mix(-0.82, -0.7, -1.35);
          P.fT = mix(-0.55, -0.75, -0.85); P.fS = mix(0.15, 0.2, 0.22);
          break;
        }
        const u = U.cham(p), d = U.ext(p);
        P.torso = U.lerp(U.lerp(0.16, 0.42, u), 0.48, d);
        P.head = U.lerp(-0.05, -0.18, Math.max(u, d));
        P.hx = U.lerp(U.lerp(0, 6, u), 10, d);
        // Tay trái (cầm khiên) đẩy thẳng tấm khiên ra phía trước ngực suốt pha lao ủi
        P.fA = U.lerp(U.lerp(0.92, 1.18, u), 1.32, d);
        P.fE = U.lerp(U.lerp(0.96, 0.72, u), 0.48, d);
        // Tay phải (cầm chùy) thu về sau nạp lực rồi vung bổ bồi thêm ở cuối cú húc
        P.nA = U.lerp(U.lerp(0.34, -0.45, u), 1.15, d);
        P.nE = U.lerp(U.lerp(1.08, 1.25, u), 0.22, d);
        P.grip = U.lerp(U.lerp(-0.34, 0.25, u), -0.82, d);
        P.nT = U.lerp(U.lerp(0.78, 1.05, u), 1.18, d);
        P.nS = U.lerp(U.lerp(-1.0, -1.35, u), -1.25, d);
        P.fT = U.lerp(U.lerp(-0.68, -0.78, u), -0.88, d);
        P.fS = 0.22;
        break;
      }
      case 'air_punch': {
        // Phi Quyền Vovinam trên không: co gối tụ lực rồi đấm/bổ vũ khí lao dốc từ trên xuống
        P.torso = mix(0.18, -0.12, 0.56);
        P.head = -0.18;
        P.nT = 1.15; P.nS = -1.85; P.fT = 0.25; P.fS = -1.1;
        if (hasHoe) {
          hoeArms(P.torso, mix(0.65, 1.85, 0.85), mix(1.25, 2.05, 1.0), mix(2.38, 3.05, 1.38));
          break;
        }
        P.nA = mix(0.9, -0.35, 1.18); P.nE = mix(1.7, 1.9, 0.05);
        P.grip = style.weapon ? mix(0, 0.25, -0.85) : 0;
        P.fA = mix(0.5, 0.8, -0.45); P.fE = 2.0;
        break;
      }
      case 'hook_run': {
        // Xung Quyền (Shift + J): lao thấp người, xoắn vai tung cú móc ngang / bổ vũ khí cực mạnh
        P.torso = mix(0.28, -0.32, 0.68);
        P.hx = mix(0, -6, 10);
        P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.7, -1.25);
        P.fT = mix(-0.6, -0.85, -0.95); P.fS = mix(0.2, 0.25, 0.3);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.6, 1.8, 0.92), mix(1.22, 2.0, 1.08), mix(2.38, 3.12, 1.36));
          break;
        }
        if (style.weapon === 'mace') {
          P.nA = mix(0.34, 1.95, 0.82); P.nE = mix(1.08, 0.5, 0.12);
          P.grip = mix(-0.34, 0.35, -0.88);
          P.fA = mix(0.92, 1.1, 0.55); P.fE = 0.95;
          break;
        }
        P.nA = mix(0.6, -0.95, 1.65); P.nE = mix(1.7, 1.5, 0.85);
        P.grip = style.weapon ? mix(0, 0.3, -0.85) : 0;
        P.fA = mix(0.4, 0.9, -0.35); P.fE = 2.05;
        break;
      }
      case 'boss_stab': {
        // Đòn đâm đoản đao / mã tấu hiểm hóc: hạ thấp trọng tâm, duỗi cổ tay phóng mũi đao thẳng tắp
        P.torso = mix(0.16, -0.22, 0.62);
        P.hx = mix(0, -5, 9);
        P.nA = mix(0.7, -0.4, 1.52); P.nE = mix(1.7, 1.9, 0.02);
        P.grip = mix(0, -0.25, -1.12);
        P.fA = mix(0.4, 0.85, -0.5); P.fE = 1.95;
        P.nT = mix(0.68, 0.5, 1.2); P.nS = mix(-0.85, -0.65, -1.35);
        P.fT = mix(-0.55, -0.75, -0.95); P.fS = 0.22;
        break;
      }
      case 'boss_riposte': {
        // Phản trảm chớp nhoáng: lách người về sau rồi vung đòn chém chéo
        P.torso = mix(0.14, -0.38, 0.54);
        P.hx = mix(0, -6, 7);
        P.nA = mix(0.8, 2.25, 0.65); P.nE = mix(1.6, 0.4, 0.1);
        P.grip = style.weapon ? mix(0, 0.32, -0.82) : 0;
        P.fA = mix(0.4, 1.2, -0.3); P.fE = 1.85;
        P.nT = mix(0.65, 0.4, 1.05); P.nS = mix(-0.82, -0.55, -1.1);
        P.fT = mix(-0.55, -0.75, -0.7); P.fS = 0.2;
        break;
      }
      case 'boss_upper': {
        // Thăng Long Quyền của Boss: khuỵu gối sâu rồi bốc ngược nắm đấm lên trời
        P.torso = mix(0.22, 0.48, -0.24);
        P.hx = mix(0, 3, -2);
        P.lift = mix(0, 4, -5);
        P.nA = mix(0.65, -0.75, 2.42); P.nE = mix(1.8, 1.9, 0.35);
        P.grip = style.weapon ? mix(0, -0.55, -0.25) : 0;
        P.fA = mix(0.4, 0.8, 0.15); P.fE = 2.0;
        P.nT = mix(0.65, 1.1, 0.45); P.nS = mix(-0.85, -1.45, -0.35);
        P.fT = mix(-0.55, -0.3, -0.75); P.fS = 0.2;
        break;
      }
      case 'overhead_smash': {
        // Đập búa ngàn cân từ đỉnh đầu xuống sàn (EnemyArmored)
        P.torso = mix(0.16, -0.36, 0.66);
        P.hx = mix(0, -5, 8);
        P.lift = mix(0, -3, 4);
        P.nA = mix(0.7, 2.65, 0.32); P.nE = mix(1.6, 0.25, 0.12);
        P.grip = style.weapon ? mix(0, 0.35, -0.88) : 0;
        P.fA = mix(0.5, 2.55, 0.28); P.fE = mix(1.6, 0.25, 0.12);
        P.nT = mix(0.65, 0.5, 1.15); P.nS = mix(-0.85, -0.6, -1.35);
        P.fT = mix(-0.55, -0.7, -0.45); P.fS = 0.2;
        break;
      }
      case 'ram_charge': {
        // Húc vai / khiên thiết giáp lao tới (EnemyShield / Brawler)
        P.torso = mix(0.2, -0.15, 0.58);
        P.head = -0.25;
        P.hx = mix(0, -4, 9);
        P.nA = mix(0.85, 0.5, 1.15); P.nE = mix(1.8, 1.95, 1.65);
        P.fA = mix(0.6, 0.4, 0.95); P.fE = 1.95;
        P.nT = mix(0.7, 0.55, 1.25); P.nS = mix(-0.9, -0.75, -1.45);
        P.fT = mix(-0.6, -0.8, -0.95); P.fS = 0.25;
        break;
      }
      case 'ultimate_bash': {
        // LÔI HỎA PHÁ TRẬN (Triệu Đình An): Pha 1 (p < 0.58) dựng Khiên Hổ Phù ủi thẳng kéo địch; Pha 2 (p >= 0.58) vung Thiết Chùy giáng Thiên Lôi vỡ đất!
        if (p < 0.58) {
          const rushK = U.easeOut(U.clamp(p / 0.18));
          P.torso = U.lerp(0.16, 0.46, rushK);
          P.head = U.lerp(-0.05, -0.22, rushK);
          P.hx = U.lerp(0, 10, rushK);
          // Tay trái đẩy Khiên chắn ngang ngực lao tới
          P.fA = U.lerp(0.92, 1.32, rushK);
          P.fE = U.lerp(0.96, 0.52, rushK);
          // Tay phải giương cao Thiết Chùy tích tụ lôi điện phía trên/sau vai
          P.nA = U.lerp(0.34, 2.25, rushK);
          P.nE = U.lerp(1.08, 0.38, rushK);
          P.grip = U.lerp(-0.34, 0.32, rushK);
          // Chân đạp lướt tốc độ cao
          const stride = Math.sin(t * 22);
          P.nT = 0.85 + 0.45 * stride; P.nS = -1.05 - 0.35 * Math.max(0, stride);
          P.fT = -0.55 - 0.45 * stride; P.fS = 0.2;
        } else {
          const slamP = U.clamp((p - 0.58) / 0.42);
          const slamK = U.easeOut(U.clamp(slamP / 0.35));
          P.torso = U.lerp(-0.18, 0.58, slamK);
          P.head = U.lerp(0.12, -0.18, slamK);
          P.lift = U.lerp(-4, 4, slamK);
          P.hx = U.lerp(-3, 11, slamK);
          // Tay phải bổ Thiết Chùy Sấm Sét từ đỉnh đầu giáng thẳng xuống đất
          P.nA = U.lerp(2.55, 0.32, slamK);
          P.nE = U.lerp(0.28, 0.12, slamK);
          P.grip = U.lerp(0.38, -0.92, slamK);
          // Tay khiên mở sang bên giữ thăng bằng
          P.fA = U.lerp(1.15, -0.15, slamK);
          P.fE = U.lerp(0.6, 1.15, slamK);
          P.nT = U.lerp(0.55, 1.15, slamK); P.nS = U.lerp(-0.7, -1.45, slamK);
          P.fT = U.lerp(-0.6, -0.82, slamK); P.fS = 0.22;
        }
        break;
      }
      case 'kick_push': {
        P.torso = mix(0.14, 0.22, -0.42);
        P.hx = mix(0, 2, -4);
        P.nT = mix(0.62, 1.3, 1.55); P.nS = mix(-0.82, -2.2, -0.05);
        P.fT = mix(-0.55, -0.2, -0.1); P.fS = mix(0.15, 0.1, 0.0);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.72, 0.35), mix(1.22, 1.35, 1.05), mix(2.38, 2.55, 2.15));
        } else {
          P.nA = mix(0.7, 0.9, 1.15); P.nE = mix(1.8, 1.6, 1.35);
          P.fA = mix(0.35, 0.2, -0.9); P.fE = mix(1.95, 1.5, 1.0);
        }
        P.nF = U.lerp(0, P.nT + P.nS, ex);
        break;
      }
      case 'kick_roundhouse': {
        P.torso = mix(0.14, -0.1, -0.65);
        P.hx = mix(0, 3, 2);
        P.nT = mix(0.62, 1.15, 1.85); P.nS = mix(-0.82, -2.1, 0.2);
        P.fT = mix(-0.55, -0.3, -0.1); P.fS = mix(0.15, 0.3, 0.1);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.65, 0.25), mix(1.22, 1.3, 0.95), mix(2.38, 2.5, 2.05));
        } else {
          P.nA = mix(0.7, 0.8, -0.8); P.nE = mix(1.8, 1.5, 0.7);
          P.fA = mix(0.35, 0.9, 1.6); P.fE = mix(1.95, 1.7, 0.6);
        }
        P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, ex);
        break;
      }
      case 'flying_kick': {
        const f = U.clamp(p * 7);
        P.torso = U.lerp(0.1, -0.6, f);
        P.nT = U.lerp(1.0, 1.6, f); P.nS = U.lerp(-1.7, 0.05, f);
        P.fT = U.lerp(0.35, 0.25, f); P.fS = U.lerp(-1.1, -1.8, f);
        if (hasHoe) {
          hoeArms(P.torso, U.lerp(0.6, 0.2, f), U.lerp(1.2, 0.9, f), U.lerp(2.38, 2.0, f));
        } else {
          P.nA = U.lerp(2.0, -0.7, f); P.nE = U.lerp(0.4, 0.4, f);
          P.fA = U.lerp(1.6, 1.95, f); P.fE = 0.35;
        }
        P.nF = U.lerp(0, P.nT + P.nS - Math.PI / 2, f);
        break;
      }
      case 'elbow_strike': {
        // Đánh Chỏ / Thúc Cán Vũ Khí cự ly gần phá thủ
        P.torso = mix(0.14, -0.3, 0.5);
        P.hx = mix(0, -4, 5);
        P.nT = mix(0.62, 0.7, 0.8); P.nS = mix(-0.82, -0.95, -0.68);
        P.fT = mix(-0.55, -0.6, -0.72); P.fS = mix(0.15, 0.2, 0.24);
        if (hasHoe) {
          // Hoàng Anh nắm ngang thân cuốc thúc mạnh chuôi/cán cuốc vào ngực địch
          hoeArms(P.torso, mix(0.58, 0.25, 1.15), mix(1.22, 0.95, 1.55), mix(2.38, 2.55, 2.15));
          break;
        }
        if (hasMaceShield && isDinhAn) {
          // Đình An thúc mạnh cạnh Khiên Hổ Phù + khuỷu tay phá giáp
          P.fA = mix(0.92, 0.55, 1.38); P.fE = mix(0.96, 1.35, 0.52);
          P.nA = mix(0.34, 0.15, 0.85); P.nE = mix(1.08, 1.25, 0.65); P.grip = -0.34;
          break;
        }
        P.nA = mix(0.7, 0.95, 1.35); P.nE = mix(1.8, 0.55, 0.12);
        P.fA = mix(0.35, 0.75, 0.45); P.fE = mix(1.95, 1.7, 1.75);
        break;
      }
      case 'kick_sweep': {
        // Quét Trụ Vovinam (Xà Tấn): hạ sát mặt sàn, một tay chống đất làm tâm,
        // chân quét duỗi thẳng quét vòng tròn quét ngã toàn bộ đối thủ
        P.lift = mix(0, 16, 21);
        P.torso = mix(0.14, 0.48, 0.62);
        P.head = mix(-0.05, -0.15, -0.32);
        P.hx = mix(0, 4, -6);
        // Chân trụ (chân xa): gập sâu sát đất dưới hông
        P.fT = mix(-0.55, 1.25, 1.4); P.fS = mix(0.15, -2.35, -2.5); P.fF = mix(0, 0.15, 0.25);
        // Chân quét (chân gần): duỗi thẳng sát mặt sàn
        P.nT = mix(0.62, 1.52, 1.62); P.nS = mix(-0.82, -0.05, 0.0);
        P.nF = -0.45;
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.8, 0.95), mix(1.22, 1.3, 1.4), mix(2.38, 2.2, 2.0));
          break;
        }
        // Tay chống đất (tay xa): cắm thẳng xuống sàn làm điểm tựa xoay
        P.fA = mix(0.35, 1.15, 1.4); P.fE = mix(1.95, 0.35, 0.18);
        // Tay vung thăng bằng (tay gần): giật mạnh ra sau đầu lấy đà xoay
        P.nA = mix(0.7, -0.65, -1.25); P.nE = mix(1.8, 0.8, 0.35);
        break;
      }
      case 'uppercut': {
        // Thôi Sơn Thượng (Đấm Móc Ngược / Hất Vũ Khí Lên Trời)
        P.lift = mix(0, 9, -15);
        P.torso = mix(0.14, 0.38, -0.24);
        P.head = mix(-0.05, 0.12, -0.28);
        P.hx = mix(0, -3, 6);
        // Chân: nén thấp gối rồi đạp thẳng lên trời
        P.nT = mix(0.62, 0.98, 0.18); P.nS = mix(-0.82, -1.6, -0.25);
        P.fT = mix(-0.55, -0.75, -0.25); P.fS = mix(0.15, 0.45, 0.1);
        if (hasHoe) {
          // Hoàng Anh hạ thấp mũi cuốc rồi hất tung lưỡi cuốc từ dưới đất vút lên cao
          hoeArms(P.torso, mix(0.58, 0.32, 1.78), mix(1.22, 0.55, 1.98), mix(2.38, 1.35, 2.78));
          break;
        }
        if (style.weapon === 'mace') {
          P.nA = mix(0.34, -0.45, 2.25); P.nE = mix(1.08, 1.25, 0.35);
          P.grip = mix(-0.34, -0.75, -0.25);
          P.fA = mix(0.92, 0.85, 0.45); P.fE = 0.95;
          break;
        }
        // Nắm đấm móc (tay gần): từ hông vung vụt lên trời, gập khuỷu tay 90 độ (không duỗi thẳng đơ)
        P.nA = mix(0.7, -0.35, 2.75); P.nE = mix(1.8, 2.15, 1.25);
        P.grip = style.weapon ? mix(0, -0.55, -0.25) : 0;
        // Tay thủ (tay xa): che cằm rồi giật về hông cân bằng lực
        P.fA = mix(0.35, 0.85, -0.35); P.fE = mix(1.95, 2.05, 1.7);
        break;
      }
      case 'scissor_kick': {
        const flip = U.clamp((p - 0.12) / 0.62);
        const open = Math.sin(U.clamp((p - 0.2) / 0.5) * Math.PI);
        P.roll = -U.easeInOut(flip) * Math.PI * 2;
        P.fixedHy = 40; P.fixW = 1;
        P.torso = 0.1;
        P.nT = 0.4 + 1.2 * open; P.nS = -0.2 - 0.3 * open;
        P.fT = -0.4 - 1.2 * open; P.fS = -0.2;
        P.nA = 1.6; P.nE = 0.4; P.fA = -1.4; P.fE = 0.4;
        break;
      }
      case 'dodge': {
        P.torso = 0.55; P.head = -0.3;
        P.nT = 1.15; P.nS = -1.85; P.fT = -0.4; P.fS = -1.0;
        if (hasHoe) {
          hoeArms(P.torso, 0.52, 1.18, 2.28);
          break;
        }
        P.nA = 0.9; P.nE = 1.7; P.fA = 0.7; P.fE = 1.9;
        break;
      }
      case 'landing': {
        // Tiếp đất võ thuật Vovinam: Đứng vững hai chân trên sàn, thân thẳng đĩnh đạc, đầu ngẩng cao quan sát đối thủ, hai tay thủ vững (không bị gục/khuỵu ngã)
        P.torso = 0.10;
        P.head = 0.04;
        P.lift = 0;
        P.nT = 0.62; P.nS = -0.80; P.fT = -0.55; P.fS = 0.18;
        if (hasHoe) {
          hoeArms(P.torso, 0.54, 1.18, 2.34);
          break;
        }
        P.nA = 0.82; P.nE = 1.55; P.fA = 0.45; P.fE = 1.72;
        break;
      }

      case 'counter_hand_prep': {
        // Vovinam Thủ Thế Bắt Đòn Tay / Chuẩn bị đòn: Đứng vững hai chân, hai tay dâng cao trước ngực, nhấp nhổm theo nhịp thở
        const sw = Math.sin(t * 7.5);
        P.torso = 0.18 + 0.02 * sw; P.head = -0.05;
        P.hx = sw * 1.5;
        P.nT = 0.72; P.nS = -1.05; P.fT = -0.6; P.fS = 0.22;
        if (hasHoe) {
          hoeArms(P.torso, 0.68 + 0.04 * sw, 1.32, 2.48 + 0.04 * sw);
          break;
        }
        P.nA = 1.25 + 0.06 * sw; P.nE = 1.45; P.fA = 1.1 - 0.04 * sw; P.fE = 1.6;
        break;
      }
      case 'counter_leg_prep': {
        // Vovinam Thủ Thế Gạt Phá Đòn Chân / Chuẩn bị cước: Chùng thấp trọng tâm, nhấc nhẹ chân trước
        const sw = Math.sin(t * 7.5);
        P.torso = 0.28 + 0.02 * sw; P.head = -0.1;
        P.lift = 4 + 1.2 * sw;
        P.hx = sw * 1.2;
        P.nT = 0.95; P.nS = -1.45; P.fT = -0.68; P.fS = 0.35;
        if (hasHoe) {
          hoeArms(P.torso, 0.55 + 0.04 * sw, 1.18, 2.30 + 0.04 * sw);
          break;
        }
        P.nA = 0.85 + 0.05 * sw; P.nE = 1.8; P.fA = 0.65 - 0.04 * sw; P.fE = 1.85;
        break;
      }
      case 'counter_hand_recovery': {
        // Bắt hụt đòn tay: hơi mất thăng bằng tiến về trước, hở sườn
        P.torso = 0.32; P.head = 0.1;
        P.nT = 0.85; P.nS = -1.15; P.fT = -0.55; P.fS = 0.1;
        P.nA = 0.55; P.nE = 1.35; P.fA = 0.25; P.fE = 1.5;
        break;
      }
      case 'counter_leg_recovery': {
        // Gạt hụt đòn chân: trọng tâm bị dồn, sơ hở phòng thủ
        P.torso = 0.38; P.head = 0.08;
        P.nT = 1.05; P.nS = -1.65; P.fT = -0.45; P.fS = 0.15;
        P.nA = 0.45; P.nE = 1.25; P.fA = 0.3; P.fE = 1.4;
        break;
      }
      case 'hurt': {
        const k = 1 - p;
        P.torso = -0.4 * k + 0.1 * (1 - k);
        P.head = -0.4 * k;
        P.hx = -5 * k;
        P.nA = 0.2 - 0.6 * k; P.nE = 0.9; P.fA = -0.3 * k; P.fE = 0.8;
        P.nT = 0.3; P.nS = -0.5; P.fT = -0.7; P.fS = 0.1;
        break;
      }
      case 'knockdown': {
        P.roll = -1.45; P.fixedHy = 9; P.fixW = 1; P.torso = 0.0; P.head = -0.15;
        P.nT = 0.25; P.nS = -0.2; P.fT = 0.5; P.fS = -0.1;
        P.nA = 0.9; P.nE = 0.3; P.fA = 0.6; P.fE = 0.3;
        break;
      }
      case 'getup': {
        const k = U.easeInOut(p);
        P.roll = U.lerp(-1.45, 0, k);
        P.fixedHy = U.lerp(9, 44, k); P.fixW = p < 0.75 ? 1 : 0;
        P.torso = U.lerp(0, 0.14, k);
        P.nT = U.lerp(0.25, 0.62, k); P.nS = U.lerp(-0.2, -0.82, k);
        break;
      }
      case 'victory': {
        const b = Math.sin(t * 5) * 0.06;
        P.torso = -0.05; P.head = -0.15;
        P.nT = 0.3; P.nS = -0.2; P.fT = -0.3; P.fS = 0.1;
        P.nA = 2.6 + b; P.nE = 0.3; P.fA = 2.4 - b; P.fE = 0.2;
        break;
      }
      case 'ultimate_flurry': {
        const c = t * 26;
        const a = Math.max(0, Math.sin(c)), b = Math.max(0, -Math.sin(c));
        const kk = Math.max(0, Math.sin(c / 2));
        P.torso = 0.35;
        P.nA = U.lerp(0.4, 1.25, a); P.nE = U.lerp(1.8, 0.1, a);
        P.fA = U.lerp(0.4, 1.25, b); P.fE = U.lerp(1.9, 0.1, b);
        P.nT = 0.5 + 0.9 * kk; P.nS = -0.8 + 0.8 * kk;
        P.fT = -0.5; P.fS = 0.1;
        break;
      }
      case 'ultimate_slam': {
        // Thổng Sơn Đại Chùy (Hoàng Anh): bật cao, giơ cuốc (hoặc song chưởng Vovinam) quá đầu -> lao xuống nện vỡ mặt đất -> khuỵu gối thu thế
        const airborne = (e.z || 0) < -2;
        if (airborne && (e.vz || 0) > 60) {
          // đang bay lên: co chân, hai tay vung cuốc / song chưởng lên cao quá đầu
          P.torso = -0.22; P.head = 0.12;
          P.nT = 1.1; P.nS = -1.8; P.fT = 0.5; P.fS = -1.3; P.nF = -0.4; P.fF = -0.4;
          if (hasHoe) {
            hoeArms(P.torso, 2.05, 2.35, 3.12);
          } else {
            P.nA = 2.65; P.nE = 0.35; P.fA = 2.45; P.fE = 0.4;
          }
        } else if (airborne) {
          // rơi xuống: thân chúi mạnh, cuốc / song chưởng bổ thẳng xuống
          P.torso = 0.58; P.head = -0.22;
          P.nT = 0.5; P.nS = -0.2; P.fT = -0.3; P.fS = -0.1;
          if (hasHoe) {
            hoeArms(P.torso, 0.92, 1.12, 1.42);
          } else {
            P.nA = 0.55; P.nE = 0.2; P.fA = 0.45; P.fE = 0.25;
          }
        } else {
          // chạm đất: khuỵu sâu, hai tay cắm mũi cuốc / song chưởng xuống nền đá
          const k = U.clamp(((e.stateTimer || 0) - (e._slamAt || 0)) / 0.5);
          const crouch = 1 - U.easeInOut(k);
          P.torso = 0.18 + 0.46 * crouch; P.head = -0.12 * crouch;
          P.nT = 0.72 + 0.58 * crouch; P.nS = -0.92 - 1.05 * crouch;
          P.fT = -0.62 + 0.78 * crouch; P.fS = 0.2 - 1.15 * crouch;
          if (hasHoe) {
            hoeArms(
              P.torso,
              0.58 + 0.24 * crouch,
              1.22 - 0.18 * crouch,
              2.38 - 1.02 * crouch
            );
          } else {
            P.nA = 0.7 - 0.45 * crouch; P.nE = 1.8 - 1.45 * crouch;
            P.fA = 0.35 - 0.15 * crouch; P.fE = 1.95 - 1.55 * crouch;
          }
          P.hx = 5 * crouch;
        }
        break;
      }
      // ---------------------------------------------------------------- POSE MỚI
      case 'boss_swing': {
        if (hasHoe) {
          // Hoàng Anh: kéo cuốc lên cao qua vai (telegraph rõ), dồn trọng tâm rồi bổ chéo xuống nặng nề
          const u = U.cham(p), d = U.ext(p);
          P.torso = U.lerp(U.lerp(0.18, -0.34, u), 0.5, d);
          P.head = U.lerp(-0.06, 0.12, d);
          P.lift = U.lerp(U.lerp(0, -2, u), 3, d);
          P.hx = U.lerp(U.lerp(0, -8, u), 10, d);
          hoeArms(P.torso,
            U.lerp(U.lerp(0.58, 1.82, u), 0.88, d),
            U.lerp(U.lerp(1.22, 2.05, u), 1.06, d),
            U.lerp(U.lerp(2.38, 3.12, u), 1.38, d));
          P.nT = U.lerp(U.lerp(0.76, 0.6, u), 1.02, d); P.nS = U.lerp(U.lerp(-0.98, -0.8, u), -1.25, d);
          P.fT = U.lerp(U.lerp(-0.68, -0.85, u), -0.35, d); P.fS = U.lerp(U.lerp(0.22, 0.3, u), 0.12, d);
          break;
        }
        // Gồng vũ khí ra sau rồi quét ngang một nhát lớn (tầm rộng, telegraph rõ)
        P.torso = mix(0.2, -0.28, 0.6);
        P.hx = mix(0, -6, 5);
        P.nA = mix(0.5, -1.15, 1.5); P.nE = mix(1.7, 1.5, 0.12);
        P.grip = style.weapon ? mix(0, 0.35, -0.82) : 0;
        P.fA = mix(0.3, -1.35, 1.38); P.fE = mix(1.9, 1.6, 0.18);
        P.nT = mix(0.6, 0.95, 1.25); P.nS = mix(-0.8, -1.45, -0.12);
        P.fT = mix(-0.5, -0.42, -0.32); P.fS = mix(0.15, 0.2, 0.1);
        break;
      }
      case 'boss_slam': {
        // Nện xuống đất: tay giơ cao rồi đập xuống, thân chúi tới
        const u = U.cham(p), d = U.ext(p);
        if (hasHoe) {
          // Hoàng Anh: nhún gối bật người, giơ cuốc quá đầu, rồi đáp xuống bổ thẳng mũi cuốc vào nền đá
          P.torso = U.lerp(U.lerp(0.18, -0.28, u), 0.58, d);
          P.head = U.lerp(-0.06, 0.16, d);
          P.lift = U.lerp(U.lerp(0, -5, u), 4, d);
          P.hx = U.lerp(U.lerp(0, -4, u), 9, d);
          hoeArms(P.torso,
            U.lerp(U.lerp(0.58, 2.05, u), 0.85, d),
            U.lerp(U.lerp(1.22, 2.28, u), 1.02, d),
            U.lerp(U.lerp(2.38, 3.15, u), 1.35, d));
          P.nT = U.lerp(U.lerp(0.76, 0.52, u), 1.05, d); P.nS = U.lerp(U.lerp(-0.98, -0.6, u), -1.32, d);
          P.fT = U.lerp(U.lerp(-0.68, -0.35, u), -0.48, d); P.fS = U.lerp(U.lerp(0.22, 0.12, u), 0.2, d);
          break;
        }
        P.torso = U.lerp(U.lerp(0.14, -0.18, u), 0.55, d);
        P.hx = mix(0, -3, 7);
        P.nA = U.lerp(U.lerp(0.5, 2.55, u), 0.38, d); P.nE = U.lerp(1.6, 0.18, Math.max(u, d));
        P.grip = style.weapon ? U.lerp(U.lerp(0, 0.35, u), -0.92, d) : 0;
        P.fA = U.lerp(U.lerp(0.35, 2.35, u), 0.32, d); P.fE = U.lerp(1.75, 0.25, Math.max(u, d));
        P.nT = mix(0.6, 1.05, d); P.nS = mix(-0.8, -1.5, d);
        P.fT = mix(-0.5, -0.4, d); P.fS = 0.15;
        break;
      }
      case 'boss_throw': {
        // Ném đồ môi trường: tay ra sau rồi vung tới
        const u = U.cham(p), d = U.ext(p);
        P.torso = U.lerp(U.lerp(0.14, 0.3, u), -0.25, d);
        P.nA = U.lerp(U.lerp(0.5, -1.55, u), 2.4, d); P.nE = U.lerp(1.7, 0.25, Math.max(u, d));
        P.fA = 0.4; P.fE = 1.85;
        P.nT = mix(0.6, 0.85, d); P.nS = mix(-0.8, -1.2, d);
        P.fT = -0.5; P.fS = 0.15;
        break;
      }
      case 'boss_taunt': {
        // Dừng lại nói (hội thoại giữa trận): chỉ tay về phía trước
        const b = Math.sin(t * 4) * 0.05;
        P.torso = 0.1; P.head = -0.08;
        P.nA = 1.4 + b; P.nE = 0.12;
        P.fA = 0.5; P.fE = 1.7;
        P.nT = 0.5; P.nS = -0.7; P.fT = -0.5; P.fS = 0.2;
        P.hx = Math.sin(t * 2) * 1.5;
        break;
      }
      // ===== BỘ ĐÒN VÕ THUẬT PHÓ ĐẶNG HOÀNG ANH: CUỐC SẮT & THÁI CỰC BÁT QUÁI CƯỚC =====
      case 'boss_thrust': {
        // Đột kích mũi cuốc xới đất: hai tay lao cán cuốc thẳng tới trước theo đinh tấn
        P.torso = mix(0.18, -0.15, 0.46);
        P.hx = mix(0, -4, 8);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.3, 1.22), mix(1.22, 0.95, 1.42), mix(2.38, 2.02, 1.56));
        } else {
          P.nA = mix(0.7, -0.2, 1.38); P.nE = mix(1.8, 1.6, 0.1);
          P.fA = mix(0.35, -0.1, 1.25); P.fE = mix(1.95, 1.7, 0.15);
        }
        P.nT = mix(0.7, 0.45, 1.15); P.nS = mix(-0.9, -0.6, -1.35);
        P.fT = mix(-0.6, -0.85, -0.2); P.fS = mix(0.2, 0.1, 0.05);
        break;
      }
      case 'boss_chain1': {
        // Hoành Tảo Sơn Hà: Quét cuốc vòng cung 120 độ mở màn
        P.torso = mix(0.18, -0.32, 0.48);
        P.hx = mix(0, -6, 8);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 1.78, 0.92), mix(1.22, 2.02, 1.08), mix(2.38, 3.12, 1.38));
        } else {
          P.nA = mix(0.7, -0.8, 1.48); P.nE = mix(1.8, 1.6, 0.25);
          P.fA = mix(0.35, 0.8, -0.3); P.fE = 1.9;
        }
        P.nT = mix(0.7, 0.85, 1.2); P.nS = mix(-0.9, -1.3, -0.3);
        P.fT = mix(-0.6, -0.5, -0.3); P.fS = mix(0.2, 0.15, 0.1);
        P.lift = mix(0, -2, 3); P.head = mix(-0.06, 0.1, -0.12);
        break;
      }
      case 'boss_chain2': {
        // Phục Địa Kích: Bổ ngược mũi cuốc từ dưới sàn hất lên cao
        P.torso = mix(0.2, 0.42, -0.22);
        P.hx = mix(0, 4, -3);
        if (hasHoe) {
          hoeArms(P.torso, mix(0.58, 0.35, 1.75), mix(1.22, 0.6, 1.98), mix(2.38, 1.32, 2.75));
        } else {
          P.nA = mix(0.7, -0.35, 2.45); P.nE = mix(1.8, 1.95, 0.45);
          P.fA = mix(0.35, 0.75, 0.1); P.fE = 1.9;
        }
        P.nT = mix(0.7, 0.9, 0.4); P.nS = mix(-0.9, -1.3, -0.8);
        P.fT = mix(-0.6, -0.4, -0.8); P.fS = mix(0.2, 0.15, 0.1);
        P.lift = mix(0, -2, 3); P.head = mix(-0.06, 0.15, -0.1);
        break;
      }
      case 'boss_chain3': {
        // Thái Cực Bát Quái Cước: Chống cán cuốc xuống đất xoay người quét cước vòng cầu
        const u = U.cham(p), d = U.ext(p);
        P.torso = U.lerp(U.lerp(0.18, 0.35, u), -0.35, d);
        P.hx = mix(0, 4, -6);
        if (hasHoe) {
          hoeArms(P.torso, U.lerp(0.58, 0.7, Math.max(u, d)), U.lerp(1.22, 1.32, Math.max(u, d)), U.lerp(2.38, 2.55, Math.max(u, d)));
        } else {
          P.nA = U.lerp(0.7, -0.5, d); P.nE = 1.4;
          P.fA = U.lerp(0.35, 1.2, d); P.fE = 1.5;
        }
        P.nT = mix(0.7, 1.1, 0.4); P.nS = mix(-0.9, -1.5, -0.8);
        P.fT = U.lerp(U.lerp(-0.6, -1.0, u), 1.65, d);
        P.fS = U.lerp(U.lerp(0.2, -0.8, u), -0.2, d);
        P.lift = U.lerp(0, 2, u) - 2 * d;
        P.head = U.lerp(-0.06, 0.12, d);
        break;
      }
      default: this.weaponPose(P, e, st); break;
    }

    // Thế thủ cầm vũ khí (côn / đao / khiên) khi đứng hoặc đi
    if (e.stance && window.WP_STANCES && (st === 'idle' || st === 'walk')) {
      const S = window.WP_STANCES[e.stance];
      const o = S && S[st];
      if (o) for (const k in o) P[k] = o[k];
    }

    // Đòn không dùng pose riêng cho chân sau (đứng vững) ở trạng thái locomotion
    return P;
  }

  // Pose đòn vũ khí theo dữ liệu (window.WP_POSES): rest -> wind -> strike -> rest
  weaponPose(P, e, st) {
    const def = window.WP_POSES && window.WP_POSES[st];
    if (!def) return;
    const U = AnimUtil;
    if (def.statics) {
      for (const k in def.statics) P[k] = def.statics[k];
      if (def.sway) P.hx = (def.statics.hx || 0) + Math.sin((e.animTime || 0) * 16) * def.sway;
      return;
    }
    const ph = U.wpPhase(e);
    const wind = def.wind || {}, strike = def.strike || {};
    const keys = new Set([...Object.keys(wind), ...Object.keys(strike)]);
    for (const k of keys) {
      const rest = P[k];
      const wv = wind[k] !== undefined ? wind[k] : rest;
      const sv = strike[k] !== undefined ? strike[k] : wv;
      const v = U.lerp(U.lerp(U.lerp(rest, wv, U.easeInOut(ph.w)), sv, U.easeOut(ph.s)), rest, U.easeInOut(ph.r));
      P[k] = v;
    }
  }

  // Blend mượt giữa pose hiện tại và pose mục tiêu
  blend(e, target, now) {
    let cur = e._pose;
    if (!cur) {
      cur = Object.assign({}, target);
      e._pose = cur;
      e._poseT = now;
      return cur;
    }
    const dt = Math.min(0.05, (now - (e._poseT || now)) / 1000);
    e._poseT = now;

    let rate = 15;
    const st = e.state;
    if (st === 'walk' || st === 'run') rate = 26;
    else if (st === 'hurt' || st === 'knockdown' || st === 'getup') rate = 28;
    else if (st === 'scissor_kick' || st === 'ultimate_flurry') rate = 34;
    else if (ATTACK_STATES.has(st)) rate = 44;
    const k = 1 - Math.exp(-rate * dt);

    // Tránh "xoay ngược" sau khi lộn vòng
    if (st !== 'scissor_kick' && Math.abs(cur.roll) > Math.PI) {
      cur.roll -= Math.sign(cur.roll) * Math.PI * 2;
    }
    for (const key of POSE_KEYS) cur[key] += (target[key] - cur[key]) * k;
    return cur;
  }

  // Tính toạ độ các khớp (đơn vị chưa scale, gốc = điểm chạm đất dưới chân)
  skeleton(P) {
    const ankleY = (T, S) => 22 * Math.cos(T) + 22 * Math.cos(T + S);
    const auto = Math.max(ankleY(P.nT, P.nS), ankleY(P.fT, P.fS)) + 6;
    const hipH = auto + (P.fixedHy - auto) * P.fixW;
    const r = P.roll, cr = Math.cos(r), sr = Math.sin(r);
    const H = [P.hx, -hipH + P.lift];
    const lv = (a, l) => {
      const x = Math.sin(a) * l, y = Math.cos(a) * l;
      return [x * cr - y * sr, x * sr + y * cr];
    };
    const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
    const ang = P.torso + r;
    const d = [Math.sin(ang), -Math.cos(ang)];
    const pp = [Math.cos(ang), Math.sin(ang)];
    const sh = [H[0] + d[0] * 30, H[1] + d[1] * 30];
    const nSh = [sh[0] + pp[0] * 2.5 - d[0] * 2.5, sh[1] + pp[1] * 2.5 - d[1] * 2.5];
    const fSh = [sh[0] - pp[0] * 3 - d[0] * 1.5, sh[1] - pp[1] * 3 - d[1] * 1.5];
    const ha = ang + P.head;
    const head = [sh[0] + Math.sin(ha) * 14.5, sh[1] - Math.cos(ha) * 14.5];

    const nHip = add(H, lv(0, 0)); nHip[0] += cr * 2; nHip[1] += sr * 2;
    const fHip = [H[0] - cr * 2, H[1] - sr * 2];
    const nKnee = add(nHip, lv(P.nT, 22)), nAnk = add(nKnee, lv(P.nT + P.nS, 22));
    const fKnee = add(fHip, lv(P.fT, 22)), fAnk = add(fKnee, lv(P.fT + P.fS, 22));

    const armv = (a, l) => lv(P.torso + a, l);
    const nElb = add(nSh, armv(P.nA, 17)), nHand = add(nElb, armv(P.nA + P.nE, 16));
    const fElb = add(fSh, armv(P.fA, 17)), fHand = add(fElb, armv(P.fA + P.fE, 16));

    return {
      H, ang, d, pp, sh, nSh, fSh, head, ha,
      nHip, fHip, nKnee, nAnk, fKnee, fAnk,
      nElb, nHand, fElb, fHand,
      nFore: P.torso + P.nA + P.nE + r, fFore: P.torso + P.fA + P.fE + r, grip: P.grip || 0,
      nFoot: P.nF - r, fFoot: P.fF - r
    };
  }

  // ------------------------------------------------------------------ RENDER
  render(ctx, e, camera) {
    camera = camera || { x: 0, y: 0 };
    let st = this.getStyle(e);
    const S = e.renderScale || st.scale || this.SCALE;
    const now = performance.now();
    const U = AnimUtil;
    const ghost = !!e.frozenPose;

    let pose;
    if (ghost) pose = e.frozenPose;
    else pose = this.blend(e, this.calculatePose(e), now);
    const jt = this.skeleton(pose);
    this.applyWeaponGrip(jt, st);

    const facing = e.facing || 1;
    const z = e.z || 0;
    // Target Hit-Jitter: mục tiêu trúng đòn rung ngang dữ dội tại chỗ ngay cả trong lúc Hit-Stop
    const jitterX = (!ghost && (e.hitJitterTimer || 0) > 0) ? Math.sin(now * 1.1) * 4.5 : 0;
    const sx = Math.round(e.x - camera.x + jitterX);
    const sy = Math.round(e.y - camera.y);
    const state = e.state || 'idle';
    const p = U.progress(e);
    const isPlayer = e.type === 'player';
    const isBoss = !isPlayer && (e.isBoss || (typeof e.type === 'string' && e.type.startsWith('boss_')));

    ctx.save();

    // Mờ dần xác lính thường
    if (!ghost && e.isDead && !isBoss && !isPlayer && (e.stateTimer || 0) > 1.6) {
      ctx.globalAlpha *= U.clamp(1 - ((e.stateTimer || 0) - 1.6) / 0.9);
    }

    // Bóng đổ
    if (!ghost) this.drawShadow(ctx, sx, sy, z, S);

    // Đồng minh chiến đấu: vòng hào quang bảo hộ màu xanh ngọc dưới chân
    if (!ghost && e.isAlly && !e.isDead) {
      const pulse = 0.6 + 0.4 * Math.sin(now * 0.006);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(sx, sy + 2);
      ctx.scale(1, 0.32);
      ctx.strokeStyle = `rgba(0, 210, 255, ${0.45 + 0.3 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 52 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 0, 38 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(0, 210, 255, ${0.12 * pulse})`;
      ctx.fill();
      ctx.restore();
    }

    // Boss: vòng pháp trận dưới chân theo màu riêng + tàn lửa bay lên
    if (!ghost && isBoss && !e.isDead) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(sx, sy + 2);
      ctx.scale(1, 0.32);
      ctx.strokeStyle = this.rgba(st.aura, 0.45 + 0.3 * pulse);
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.arc(0, 0, 62 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(0, 0, 46 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(now * 0.0016);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 46 * S / 1.3, Math.sin(a) * 46 * S / 1.3);
        ctx.lineTo(Math.cos(a) * 62 * S / 1.3, Math.sin(a) * 62 * S / 1.3);
        ctx.stroke();
      }
      ctx.restore();
      if (window.effectManager && Math.random() < 0.2) {
        window.effectManager.particles.push({
          x: e.x + (Math.random() - 0.5) * 55, y: e.y + z - 10,
          vx: (Math.random() - 0.5) * 1.1, vy: -1.4 - Math.random() * 1.3,
          size: 2.5 + Math.random() * 2.5, color: st.aura, alpha: 0.85,
          life: 0.85, maxLife: 0.85, gravity: -0.01
        });
      }
    }

    // Vệt đòn (toạ độ màn hình)
    if (!ghost) this.updateAndDrawTrail(ctx, e, jt, st, S, facing, z, camera, p);

    // Cảnh báo đòn mạnh của đối thủ
    const isWp = typeof state === 'string' && state.indexOf('wp_') === 0;
    if (!ghost && !isPlayer && (isWp ? e._tele : (e.isAttacking && U.cham(p) > 0.3 && U.ext(p) < 0.45))) {
      this.drawTelegraph(ctx, jt, S, facing, sx, sy + z, now);
    }

    // Nháy trắng khi trúng đòn (Arcade hit flash - dùng solidStyle trực tiếp, KHÔNG dùng ctx.filter vì gây tụt FPS nghiêm trọng)
    // Nhân vật chơi: nhấp nháy trắng ↔ thường khi bất tử (đọc rõ là "đang né"), tránh bị bôi trắng cả người
    const flash = !ghost && e.invincibleTimer > 0 && (isPlayer
      ? e.invincibleTimer > 0.22 && Math.floor(e.invincibleTimer * 16) % 2 === 0
      : e.invincibleTimer > 0.015);
    if (flash) {
      st = this.solidStyle(st, '#ffffff');
    }

    ctx.translate(sx, sy + z);
    // Squash & Stretch vật lý khi nhảy / tiếp đất / lướt né / trúng đòn
    let sqX = 1.0, sqY = 1.0;
    if (!ghost && (e.squashTimer || 0) > 0) {
      const sqT = Math.min(1, e.squashTimer / 0.16);
      const wave = Math.sin(sqT * Math.PI);
      if (e.squashType === 'stretch') {
        sqX = 1 + 0.11 * wave;
        sqY = 1 - 0.08 * wave;
      } else {
        sqX = 1 + 0.12 * wave;
        sqY = 1 - 0.11 * wave;
      }
    }
    ctx.scale(S * facing * sqX, S * sqY);

    // Hào quang
    const charged = isPlayer && e.energy >= e.maxEnergy;
    const inUlt = typeof state === 'string' && state.indexOf('ultimate_') === 0;
    if (!ghost && (charged || isBoss || inUlt)) {
      const pulse = 0.2 + 0.08 * Math.sin(now * 0.008);
      const big = inUlt ? 1.5 : (charged ? 1.2 : 1);
      const g = ctx.createRadialGradient(jt.H[0], jt.H[1] - 10, 6, jt.H[0], jt.H[1] - 10, 78 * big);
      g.addColorStop(0, this.rgba(st.aura, pulse * 1.6 * big));
      g.addColorStop(1, this.rgba(st.aura, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(jt.H[0], jt.H[1] - 10, 78 * big, 0, Math.PI * 2); ctx.fill();
      // Vòng năng lượng xoay quanh thân khi đã đầy tuyệt kỹ
      if (charged || inUlt) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = this.rgba(st.aura, 0.55 + 0.25 * Math.sin(now * 0.012));
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const a0 = now * 0.006 * (i % 2 ? -1 : 1) + i * 2.1;
          ctx.beginPath();
          ctx.ellipse(jt.H[0], jt.H[1] - 20, 30 + i * 8, 52 + i * 6, 0, a0, a0 + 1.6);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    const shout = (ATTACK_STATES.has(state) && U.ext(p) > 0.2) || state === 'hurt' || inUlt || state === 'victory';
    const angry = e.type !== 'player' || ATTACK_STATES.has(state);
    const beltSway = this.beltSway(e, now, facing);

    // Thứ tự vẽ: chân xa, tay xa, chân gần, thân, đai, đầu, tay gần
    const shieldInFront = st.shield && (state === 'guard' || state === 'boss_bash' || state === 'elbow_strike' || (state === 'ultimate_bash' && p < 0.58));
    this.drawLeg(ctx, jt.fHip, jt.fKnee, jt.fAnk, jt.fFoot, st, true);
    this.drawArm(ctx, jt.fSh, jt.fElb, jt.fHand, jt.fFore, st, true, shieldInFront);
    this.drawLeg(ctx, jt.nHip, jt.nKnee, jt.nAnk, jt.nFoot, st, false);
    this.drawTorso(ctx, jt, st);
    this.drawBelt(ctx, jt, st, beltSway);
    this.drawNeckAndHead(ctx, jt, st, { shout, angry, sway: beltSway });
    if (shieldInFront) {
      this.drawTigerShield(ctx, jt.fElb, jt.fHand, jt.fFore, st, true);
    }
    this.drawArm(ctx, jt.nSh, jt.nElb, jt.nHand, jt.nFore, st, false, false);
    if (st.riotShield) this.drawRiotShield(ctx, jt, st);
    if (st.chainWeapon) this.drawChainWeapon(ctx, jt.nHand, jt.nFore, st, e);
    if (st.medicCross) this.drawMedicCross(ctx, jt, st);
    if (st.heavyShoulders) this.drawHeavyShoulders(ctx, jt, st);
    if (st.weapon === 'twin_daggers') this.drawWeapon(ctx, jt.fHand, jt.fFore, st, 22, jt.grip || 0, true);
    if (st.weapon === 'machete') this.drawWeapon(ctx, jt.nHand, jt.nFore, st, st.weaponLen || 38, jt.grip || 0);
    else if (st.weapon === 'twin_daggers') this.drawWeapon(ctx, jt.nHand, jt.nFore, st, 22, jt.grip || 0);
    else if (st.weapon === 'hoe') {
      this.drawWeapon(ctx, jt.nHand, jt.nFore, st, 54, jt.grip);
      this.drawGripFist(ctx, jt.fHand, jt.fFore, st, true, jt.nFore + jt.grip);
    }
    else if (st.weapon === 'mace') this.drawWeapon(ctx, jt.nHand, jt.nFore, st, st.weaponLen || 46, jt.grip || 0);
    else if (st.weapon === 'knife') this.drawWeapon(ctx, jt.nHand, jt.nFore, st, 20, jt.grip || 0);
    else if (st.weapon === 'baton') this.drawWeapon(ctx, jt.nHand, jt.nFore, st, st.weaponLen || 34, jt.grip || 0);

    ctx.restore();

    // Thanh thể lực & hồi chiêu đá trên đầu người chơi (ẩn khi đầy)
    const showKickBar = isPlayer && typeof e.kickCooldown === 'number' && e.kickCooldown > 0;
    const showStamBar = isPlayer && typeof e.stamina === 'number' && e.stamina < e.maxStamina - 0.5;
    if (!ghost && isPlayer && (showStamBar || showKickBar) && !e.isDead) {
      this.drawStaminaBar(ctx, sx, sy + z - 128 * S / 1.3 - 16, e, now);
    }

    // Thanh Độ Bền Khiên (Guard Gauge / Block Limit)
    const showGuardBar = isPlayer && (e.state === 'guard' || e.state === 'guard_break' || (typeof e.guardGauge === 'number' && e.guardGauge < (e.maxGuardGauge || 100) - 0.5));
    if (!ghost && isPlayer && showGuardBar && !e.isDead) {
      const offsetAbove = (showStamBar || showKickBar) ? -36 : -18;
      this.drawGuardGaugeBar(ctx, sx, sy + z - 128 * S / 1.3 + offsetAbove, e, now);
    }

    // Thanh Máu & Giáp nổi trên đầu kẻ địch thường / Tinh anh khi bị thương
    if (!ghost && !isPlayer && !isBoss && !e.isDead && typeof e.hp === 'number' && typeof e.maxHp === 'number' && e.hp < e.maxHp) {
      this.drawEnemyHpBar(ctx, sx, sy + z - 126 * S / 1.3 - 10, e);
    }
  }

  drawEnemyHpBar(ctx, x, y, e) {
    const isElite = e.armorAll || (e.maxHp >= 240);
    const w = isElite ? 52 : 42;
    const h = isElite ? 6 : 5;
    const pct = Math.max(0, Math.min(1, e.hp / (e.maxHp || 1)));
    ctx.save();
    ctx.translate(Math.round(x - w / 2), Math.round(y));
    ctx.fillStyle = 'rgba(8, 12, 22, 0.85)';
    ctx.fillRect(-1.5, -1.5, w + 3, h + 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = isElite ? '#f59e0b' : '#ef4444';
    ctx.fillRect(0, 0, w * pct, h);
    if (e.armorTimer > 0 || e.riotShield) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-1.5, -1.5, w + 3, h + 3);
    }
    ctx.restore();
  }

  drawStaminaBar(ctx, x, y, e, now) {
    const w = 54, h = 7;
    const k = Math.max(0, Math.min(1, (e.stamina || 100) / (e.maxStamina || 100)));
    const exhausted = (e.exhaustTimer || 0) > 0;
    const low = k < 0.3;
    const blink = exhausted ? (Math.floor(now / 90) % 2 === 0) : false;
    ctx.save();
    ctx.translate(Math.round(x - w / 2), Math.round(y));

    // Khung & thanh thể lực chính
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(-2, -2, w + 4, h + 4);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    if (exhausted) { g.addColorStop(0, '#ef4444'); g.addColorStop(1, '#fb923c'); }
    else if (low) { g.addColorStop(0, '#f97316'); g.addColorStop(1, '#facc15'); }
    else { g.addColorStop(0, '#22d3ee'); g.addColorStop(1, '#4ade80'); }
    ctx.fillStyle = blink ? '#ffffff' : g;
    ctx.fillRect(0, 0, w * k, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-1.5, -1.5, w + 3, h + 3);

    // Chữ KIỆT SỨC khi cạn thể lực
    if (exhausted) {
      ctx.font = '900 11px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fca5a5';
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText('KIỆT SỨC', w / 2, -6);
      ctx.fillText('KIỆT SỨC', w / 2, -6);
    }

    // Thanh hồi chiêu Đá (K): hiển thị trực tiếp khi đang hồi chiêu đá
    if (e.kickCooldown > 0) {
      const maxCd = e.maxKickCooldown || 0.28;
      const kickReadyPct = Math.max(0, Math.min(1, 1 - e.kickCooldown / maxCd));
      const kw = w - 6;
      ctx.translate(3, h + 4);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-1, -1, kw + 2, 5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 0, kw * kickReadyPct, 3);
      ctx.font = '700 8px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('HỒI ĐÁ', kw / 2, 11);
    }
    ctx.restore();
  }

  // Vẽ thanh độ bền khiên (Guard Gauge) 6 phân đoạn trực quan
  drawGuardGaugeBar(ctx, x, y, e, now) {
    const w = 58, h = 8;
    const max = e.maxGuardGauge || 100;
    const cur = Math.max(0, Math.min(max, (e.guardGauge !== undefined ? e.guardGauge : 100)));
    const pct = cur / max;
    const isBroken = e.state === 'guard_break' || (e.guardBreakTimer || 0) > 0;
    const isLow = cur <= 25;
    const blink = isBroken || (isLow && (Math.floor(now / 120) % 2 === 0));

    ctx.save();
    ctx.translate(Math.round(x - w / 2), Math.round(y));

    // Khung kim loại công nghệ cao
    ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
    ctx.fillRect(-2, -2, w + 4, h + 4);
    ctx.strokeStyle = isBroken ? '#ef4444' : (isLow ? '#f59e0b' : '#38bdf8');
    ctx.lineWidth = 1;
    ctx.strokeRect(-2, -2, w + 4, h + 4);

    // Nền rãnh thanh
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(0, 0, w, h);

    if (isBroken) {
      // Chữ BỂ THỦ nhấp nháy đỏ
      ctx.fillStyle = blink ? '#ef4444' : '#fee2e2';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '900 9px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = 2.5;
      ctx.strokeText('BỂ THỦ!', w / 2, -5);
      ctx.fillText('BỂ THỦ!', w / 2, -5);
    } else {
      // 6 phân đoạn tương ứng tối đa 6 đòn đỡ
      const numSegs = 6;
      const segW = (w - (numSegs - 1) * 2) / numSegs;
      const filledSegs = Math.ceil(pct * numSegs);

      for (let i = 0; i < numSegs; i++) {
        const sx = i * (segW + 2);
        if (i < filledSegs) {
          const segColor = isLow ? (blink ? '#ffffff' : '#ef4444') : (pct < 0.5 ? '#f59e0b' : '#06b6d4');
          ctx.fillStyle = segColor;
          ctx.fillRect(sx, 1, segW, h - 2);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.fillRect(sx, 1, segW, h - 2);
        }
      }

      // Nhãn THỦ [x/6]
      ctx.font = '800 8px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isLow ? '#fca5a5' : '#e0f2fe';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 2;
      const label = `THỦ [${filledSegs}/6]`;
      ctx.strokeText(label, w / 2, -4);
      ctx.fillText(label, w / 2, -4);
    }

    ctx.restore();
  }

  rgba(col, a) {
    if (col[0] === '#') {
      const n = parseInt(col.slice(1), 16);
      return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
    }
    return col;
  }

  drawShadow(ctx, sx, sy, z, S) {
    const k = Math.max(0.45, 1 - Math.abs(z) / 220);
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.42 * k})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 3, 30 * S / 1.3 * k, 9 * S / 1.3 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  beltSway(e, now, facing) {
    const target = Math.max(-14, Math.min(14, -((e.vx || 0) * facing) * 0.025)) + Math.sin(now * 0.006 + (e.x || 0)) * 1.4;
    e._belt = (e._belt === undefined) ? target : e._belt + (target - e._belt) * 0.18;
    return e._belt;
  }

  // ------------------------------------------------------------------ TRAIL / TELEGRAPH
  updateAndDrawTrail(ctx, e, jt, st, S, facing, z, camera, p) {
    const state = e.state;
    const U = AnimUtil;
    if (!e._trail) e._trail = [];
    const toWorld = (pt) => [e.x + facing * S * pt[0], e.y + z + S * pt[1]];

    let tip = null;
    const isWpState = typeof state === 'string' && state.indexOf('wp_') === 0;
    const active = isWpState ? !!e._wpActive
      : (ATTACK_STATES.has(state) && (state === 'flying_kick' || state === 'scissor_kick' || state === 'ultimate_flurry' || U.ext(p) > 0.1 || U.cham(p) > 0.5));
    if (active) {
      if (isWpState) {
        // Đầu vũ khí (côn/đao) hoặc mép khiên — vệt đi theo vũ khí thật sự
        const len = st.weapon ? (st.weaponLen || 38) + 3 : 8;
        const wa = this.weaponAngle(st, jt.nFore) + (jt.grip || 0);
        tip = [jt.nHand[0] + Math.sin(wa) * len, jt.nHand[1] + Math.cos(wa) * len];
      } else if (state === 'punch_straight' || state === 'punch_hook' || state === 'boss_stab' ||
          state === 'boss_riposte' || state === 'boss_upper' || state === 'boss_heavy1' ||
          state === 'boss_thrust' || state === 'boss_throw' || state === 'boss_swing' ||
          state === 'boss_slam' || state === 'uppercut' || state === 'elbow_strike' || state === 'hook_run' ||
          state === 'air_punch' || state === 'ultimate_bash' || state === 'ultimate_slam' || state.startsWith('boss_chain')) tip = jt.nHand;
      else if (state === 'ultimate_flurry') tip = (Math.floor((e.animTime || 0) * 13) % 2) ? jt.fHand : jt.nAnk;
      else tip = jt.nAnk;
      // Đòn có vũ khí: vệt đi theo mũi vũ khí chứ không phải bàn tay
      if (tip === jt.nHand && st.weapon && st.weapon !== 'twin_daggers') {
        const wl = st.weapon === 'hoe' ? 68 : (st.weaponLen || (st.weapon === 'knife' ? 20 : 38)) + 14;
        const wa2 = this.weaponAngle(st, jt.nFore) + (jt.grip || 0);
        tip = [jt.nHand[0] + Math.sin(wa2) * wl, jt.nHand[1] + Math.cos(wa2) * wl];
      }
    }
    if (tip) { e._trail.push(toWorld(tip)); if (e._trail.length > 9) e._trail.shift(); }
    else if (e._trail.length) e._trail.shift();

    const tr = e._trail;
    if (tr.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Vệt chém Bezier Crescent Slash mượt mà: Lớp hào quang ngoài + Lõi trắng sắc bén bên trong
    const pts = tr.map(pt => [pt[0] - camera.x, pt[1] - camera.y]);
    for (let i = 1; i < pts.length; i++) {
      const a = i / pts.length;
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const midX = (p0[0] + p1[0]) * 0.5;
      const midY = (p0[1] + p1[1]) * 0.5;

      // Hào quang màu theo nhân vật/vũ khí
      ctx.strokeStyle = this.rgba(st.aura || '#00f0ff', a * 0.72);
      ctx.lineWidth = 3 + a * 11;
      ctx.beginPath();
      if (i > 1) {
        const prevMidX = (pts[i - 2][0] + p0[0]) * 0.5;
        const prevMidY = (pts[i - 2][1] + p0[1]) * 0.5;
        ctx.moveTo(prevMidX, prevMidY);
        ctx.quadraticCurveTo(p0[0], p0[1], midX, midY);
      } else {
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(midX, midY);
      }
      ctx.stroke();

      // Lõi trắng sắc lẹm ở phần đầu mũi đòn
      if (i >= pts.length - 4) {
        ctx.strokeStyle = this.rgba('#ffffff', a * 0.9);
        ctx.lineWidth = 1.2 + a * 4.2;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawTelegraph(ctx, jt, S, facing, sx, sy, now) {
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.03);
    const hx = sx + facing * S * jt.head[0], hy = sy + S * jt.head[1];
    ctx.save();
    const g = ctx.createRadialGradient(sx, sy - 55, 6, sx, sy - 55, 90);
    g.addColorStop(0, `rgba(255,40,60,${0.3 + 0.25 * pulse})`);
    g.addColorStop(1, 'rgba(255,40,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy - 55, 90, 0, Math.PI * 2); ctx.fill();
    // Dấu "!" cảnh báo
    ctx.translate(hx, hy - 30);
    ctx.fillStyle = `rgba(255,60,60,${0.75 + 0.25 * pulse})`;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(11, 8); ctx.lineTo(-11, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-1.5, -5, 3, 7); ctx.fillRect(-1.5, 4, 3, 2.6);
    ctx.restore();
  }

  // ------------------------------------------------------------------ BODY PARTS
  capsule(ctx, a, b, w0, w1, col) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * w0 / 2, a[1] + ny * w0 / 2);
    ctx.lineTo(b[0] + nx * w1 / 2, b[1] + ny * w1 / 2);
    ctx.lineTo(b[0] - nx * w1 / 2, b[1] - ny * w1 / 2);
    ctx.lineTo(a[0] - nx * w0 / 2, a[1] - ny * w0 / 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.arc(a[0], a[1], w0 / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b[0], b[1], w1 / 2, 0, Math.PI * 2); ctx.fill();
  }

  limb(ctx, a, b, w0, w1, col, edge, hi) {
    this.capsule(ctx, a, b, w0 + 2.6, w1 + 2.6, edge);
    this.capsule(ctx, a, b, w0, w1, col);
    if (hi) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l, ny = dx / l;
      const o = -Math.min(w0, w1) * 0.24;
      this.capsule(ctx, [a[0] + nx * o, a[1] + ny * o], [b[0] + nx * o, b[1] + ny * o], w0 * 0.3, w1 * 0.3, hi);
      // Viền Rim-Light sắc nét kiểu Cel-Shading võ hiệp hiện đại
      const ro = -Math.min(w0, w1) * 0.42;
      this.capsule(ctx, [a[0] + nx * ro, a[1] + ny * ro], [b[0] + nx * ro, b[1] + ny * ro], w0 * 0.12, w1 * 0.12, 'rgba(224,242,254,0.22)');
    }
  }

  drawLeg(ctx, hip, knee, ank, footA, st, far) {
    const col = far ? st.pantsD : st.pants;
    const edge = 'rgba(0,0,0,0.5)';
    const hi = far ? null : 'rgba(255,255,255,0.16)';
    this.limb(ctx, hip, knee, 12.5, 11, col, edge, hi);
    this.limb(ctx, knee, ank, 11, 9.4, col, edge, hi);

    // Giày / dép theo phong cách nhân vật (thay cho chân trần)
    const f = [Math.cos(footA), -Math.sin(footA)];
    const dn = [Math.sin(footA), Math.cos(footA)];
    const cx = ank[0] + f[0] * 3.5 + dn[0] * 2.4;
    const cy = ank[1] + f[1] * 3.5 + dn[1] * 2.4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-footA);

    const shoe = st.shoes || (st.suit ? 'dress' : 'kungfu');
    if (shoe === 'sneakers') {
      // Giày thể thao street sneaker: đế cao su trắng + thân giày màu + mũi tròn
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 0, 9.4, 5.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? shadeColor(st.shoeColor || '#dc2626', -0.3) : (st.shoeColor || '#dc2626');
      ctx.beginPath(); ctx.ellipse(0, -1, 8.4, 4.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-7.5, 1.2, 16, 2.5);
      ctx.beginPath(); ctx.arc(5.5, 0, 2.8, 0, Math.PI * 2); ctx.fill();
    } else if (shoe === 'combat') {
      // Bốt chiến thuật cao cổ: đế dày có gai + khóa kim loại
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.ellipse(0, 0, 9.6, 5.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#1e293b' : '#334155';
      ctx.beginPath(); ctx.ellipse(0, -1, 8.6, 4.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-8, 1.4, 16.5, 3.2);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-2, -2.5); ctx.lineTo(2, -2.5); ctx.stroke();
    } else if (shoe === 'dress') {
      // Giày Tây âu phục bóng loáng
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 0, 9.2, 4.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#09090b' : '#18181b';
      ctx.beginPath(); ctx.ellipse(0.5, -0.6, 8.6, 3.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(-7.5, 0.8, 5, 3.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-2, -1.8); ctx.lineTo(4.5, -1.8); ctx.stroke();
    } else if (shoe === 'wraps') {
      // Băng quấn đấu trường (Thiết Quyền)
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(0, 0, 8.6, 4.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#d6d3d1' : '#f5f5f4';
      ctx.beginPath(); ctx.ellipse(0, 0, 7.6, 3.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(3, 2); ctx.moveTo(-2, -3); ctx.lineTo(6, 1); ctx.stroke();
    } else {
      // Giày vải Vovinam truyền thống: vớ trắng + giày đen đế viền trắng
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 0, 8.8, 4.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.ellipse(-2, -2.5, 4.5, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#0f172a' : '#1e293b';
      ctx.beginPath(); ctx.ellipse(0.5, 0, 7.8, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6.5, 1.8, 14, 1.6);
    }
    ctx.restore();
  }

  drawArm(ctx, sh, elb, hand, foreAbs, st, far, skipShield = false) {
    const g = far ? st.giD : st.gi;
    const edge = 'rgba(0,0,0,0.55)';
    const hi = far ? null : 'rgba(255,255,255,0.16)';
    this.limb(ctx, sh, elb, 10.6, 9.5, g, edge, hi);
    const wr = [elb[0] + (hand[0] - elb[0]) * 0.78, elb[1] + (hand[1] - elb[1]) * 0.78];
    this.limb(ctx, elb, wr, 9.5, 10.4, g, edge, hi);

    // Hộ uyển / Băng quấn cổ tay võ thuật
    const w0 = [elb[0] + (hand[0] - elb[0]) * 0.56, elb[1] + (hand[1] - elb[1]) * 0.56];
    if (st.armor) {
      const m0 = [elb[0] + (hand[0] - elb[0]) * 0.16, elb[1] + (hand[1] - elb[1]) * 0.16];
      this.capsule(ctx, m0, wr, 8.8, 9.6, st.metal || '#64748b');
      this.capsule(ctx, m0, wr, 3.0, 3.0, 'rgba(255,255,255,0.38)');
      this.capsule(ctx, w0, wr, 9.2, 9.8, st.belt || '#eab308');
    } else if (!st.suit) {
      const wrapCol = st.patch ? (far ? '#cbd5e1' : '#f8fafc') : (st.beltD || '#1e293b');
      this.capsule(ctx, w0, wr, 8.2, 8.4, wrapCol);
    }

    // Cổ tay + nắm đấm (vẽ trước khi vẽ Khiên để nắm tay nằm gọn phía sau mặt khiên, không bị lộ nắm đấm trần trước cằm)
    const sk = far ? st.skinD : st.skin;
    this.capsule(ctx, wr, hand, 6.2, 5.4, sk);
    const dir = [Math.sin(foreAbs), Math.cos(foreAbs)];
    const fc = [hand[0] + dir[0] * 2.8, hand[1] + dir[1] * 2.8];
    const fr = st.gauntlet ? 7.2 : 4.9;
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.beginPath(); ctx.arc(fc[0], fc[1], fr + 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = st.gauntlet ? '#eab308' : sk;
    ctx.beginPath(); ctx.arc(fc[0], fc[1], fr, 0, Math.PI * 2); ctx.fill();
    if (st.gauntlet) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(fc[0] - 1.6, fc[1] - 1.8, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(fc[0], fc[1], fr - 0.8, 0, Math.PI * 2); ctx.stroke();
    } else {
      // Chi tiết khớp đốt ngón tay nắm quyền
      ctx.strokeStyle = 'rgba(80,35,15,0.38)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fc[0] - 2.5, fc[1] - 0.8); ctx.lineTo(fc[0] + 2.5, fc[1] - 0.8);
      ctx.moveTo(fc[0] - 2.0, fc[1] + 1.2); ctx.lineTo(fc[0] + 2.2, fc[1] + 1.2);
      ctx.stroke();
    }

    // Khiên Hổ Phù trên tay xa (Triệu Đình An): vẽ đè lên cẳng tay và nắm đấm tay trái
    if (st.shield && far && !skipShield) {
      this.drawTigerShield(ctx, elb, hand, foreAbs, st, false);
    }
  }

  // Khiên Chiến Thuật Hổ Phù (Triệu Đình An): tấm khiên bát giác/bầu dục bọc đồng vàng, đinh tán thép và phù hiệu trung tâm
  drawTigerShield(ctx, elb, hand, foreAbs, st, isFrontCharge) {
    const mx = elb[0] + (hand[0] - elb[0]) * 0.72;
    const my = elb[1] + (hand[1] - elb[1]) * 0.72;
    ctx.save();
    ctx.translate(mx + (isFrontCharge ? 4 : 1.5), my);
    ctx.rotate(-foreAbs * 0.22);

    const rx = isFrontCharge ? 14.5 : 13.0;
    const ry = isFrontCharge ? 21.0 : 19.0;

    // Bóng đổ viền ngoài
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.beginPath(); ctx.ellipse(0, 0, rx + 2, ry + 2, 0, 0, Math.PI * 2); ctx.fill();

    // Vành khiên hợp kim đồng vàng
    const rimGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    rimGrad.addColorStop(0, '#fde047');
    rimGrad.addColorStop(0.5, '#d97706');
    rimGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = rimGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();

    // Lòng khiên thép sơn son đỏ thẫm
    const coreGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, ry * 0.85);
    coreGrad.addColorStop(0, '#b91c1c');
    coreGrad.addColorStop(0.65, '#7f1d1d');
    coreGrad.addColorStop(1, '#310a0b');
    ctx.fillStyle = coreGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, rx - 2.6, ry - 3.0, 0, 0, Math.PI * 2); ctx.fill();

    // Sọc gia cố chữ X bằng đồng
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-(rx - 4) * 0.7, -(ry - 4) * 0.65); ctx.lineTo((rx - 4) * 0.7, (ry - 4) * 0.65);
    ctx.moveTo((rx - 4) * 0.7, -(ry - 4) * 0.65); ctx.lineTo(-(rx - 4) * 0.7, (ry - 4) * 0.65);
    ctx.stroke();

    // 6 Đinh tán vàng quanh vành khiên
    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (rx - 1.4), Math.sin(a) * (ry - 1.6), 1.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tâm khiên Hổ Phù (Umbo/Boss trung tâm nhô cao)
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.ellipse(0.5, 0, 5.2, 6.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.ellipse(0.5, 0, 4.0, 5.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath(); ctx.arc(-0.5, -1.5, 1.5, 0, Math.PI * 2); ctx.fill();

    // Vệt phản quang chéo trên mặt khiên
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.45, -ry * 0.55);
    ctx.lineTo(rx * 0.45, -ry * 0.15);
    ctx.stroke();
    ctx.restore();
  }

  // Khiên chống bạo động: vẽ trước người ở tay gần — hướng khiên rõ ràng, lưng nhân vật không được che
  drawRiotShield(ctx, jt, st) {
    const h = jt.nHand;
    ctx.save();
    ctx.translate(h[0] + 5, h[1] - 4);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-4, -34, 16, 66);
    const sg = ctx.createLinearGradient(-2, -32, 10, 30);
    sg.addColorStop(0, '#64748b');
    sg.addColorStop(0.5, '#334155');
    sg.addColorStop(1, '#1e293b');
    ctx.fillStyle = sg;
    ctx.fillRect(-2, -32, 12, 62);
    ctx.fillStyle = 'rgba(186,230,253,0.65)';
    ctx.fillRect(1, -26, 5, 20);                 // kính quan sát polycarbonate
    ctx.fillStyle = st.belt || '#eab308';
    ctx.fillRect(-2, 4, 12, 4.5);                // vạch nhận diện cảnh giới
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-2, -32, 12, 62);
    ctx.restore();
  }

  // Xích sắt trói bắt (EnemyGrabber)
  drawChainWeapon(ctx, hand, foreAbs, st, e) {
    ctx.save();
    const isCasting = e && e.state === 'chain_cast';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    if (isCasting) {
      // Xích văng thẳng ra phía trước
      const reach = 110;
      ctx.beginPath();
      ctx.moveTo(hand[0], hand[1]);
      for (let i = 1; i <= 6; i++) {
        const segX = hand[0] + (reach / 6) * i;
        const segY = hand[1] + Math.sin(i * 1.5) * 4;
        ctx.lineTo(segX, segY);
      }
      ctx.stroke();

      // Móc sắt ở đầu xích
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(hand[0] + reach, hand[1], 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(hand[0] + reach, hand[1]);
      ctx.lineTo(hand[0] + reach + 8, hand[1] - 6);
      ctx.stroke();
    } else {
      // Xích quấn và rủ xuống từ tay
      ctx.beginPath();
      ctx.moveTo(hand[0], hand[1]);
      ctx.quadraticCurveTo(hand[0] + 6, hand[1] + 12, hand[0] + 2, hand[1] + 24);
      ctx.stroke();

      // Móc sắt nhỏ
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(hand[0] + 2, hand[1] + 24, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Huy hiệu chữ thập cứu thương (EnemyMedic)
  drawMedicCross(ctx, jt, st) {
    const cx = jt.sh[0] + 4;
    const cy = jt.sh[1] + 8;
    ctx.save();
    // Vòng tròn trắng
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Chữ thập đỏ / xanh y tế
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cx - 1.2, cy - 3.8, 2.4, 7.6);
    ctx.fillRect(cx - 3.8, cy - 1.2, 7.6, 2.4);
    ctx.restore();
  }

  // Giáp vai hạng nặng (EnemyArmored)
  drawHeavyShoulders(ctx, jt, st) {
    ctx.save();
    // Giáp vai tay gần
    const sh = jt.nSh;
    ctx.fillStyle = st.helmet || '#475569';
    ctx.beginPath();
    ctx.ellipse(sh[0], sh[1] - 4, 11, 7.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Đinh tán kim loại
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(sh[0] - 4, sh[1] - 5, 1.2, 0, Math.PI * 2);
    ctx.arc(sh[0] + 4, sh[1] - 3, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Góc vũ khí: cuốc đi thẳng theo hai tay; vũ khí một tay được bẻ cổ tay hướng lên để cầm tự nhiên
  weaponAngle(st, foreAbs) {
    if (!st || !st.weapon || st.weapon === 'hoe') return foreAbs;
    // Nắm ngang: cán/chuôi vũ khí vuông góc cẳng tay, xuyên qua nắm đấm
    return foreAbs + (st.weapon === 'mace' ? 1.15 : 1.25);
  }

  // Nắm đấm phủ lên trên vũ khí: ngón tay quấn ngang cán — bàn tay luôn hiện phía trước vũ khí
  drawGripFist(ctx, hand, foreAbs, st, far, axisAbs) {
    const fd = [Math.sin(foreAbs), Math.cos(foreAbs)];
    const c = [hand[0] + fd[0] * 2.8, hand[1] + fd[1] * 2.8];
    const sk = far ? st.skinD : st.skin;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.arc(c[0], c[1], 6.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = st.gauntlet ? '#d4a017' : sk;
    ctx.beginPath(); ctx.arc(c[0], c[1], 5.4, 0, Math.PI * 2); ctx.fill();
    // Các ngón tay quấn ngang qua cán
    const ad = [Math.sin(axisAbs), Math.cos(axisAbs)];
    const nx = -ad[1], ny = ad[0];
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const o = [c[0] + ad[0] * i * 2.6, c[1] + ad[1] * i * 2.6];
      ctx.beginPath();
      ctx.moveTo(o[0] - nx * 4, o[1] - ny * 4);
      ctx.lineTo(o[0] + nx * 4, o[1] + ny * 4);
      ctx.stroke();
    }
    // Ngón cái ôm cán
    ctx.fillStyle = sk;
    ctx.beginPath(); ctx.arc(c[0] + nx * 3.4 + ad[0] * 1.5, c[1] + ny * 3.4 + ad[1] * 1.5, 2.1, 0, Math.PI * 2); ctx.fill();
  }

  drawWeapon(ctx, hand, foreAbs, st, len, grip = 0, far = false) {
    this.drawWeaponBody(ctx, hand, foreAbs, st, len, grip);
    this.drawGripFist(ctx, hand, foreAbs, st, far, this.weaponAngle(st, foreAbs) + grip);
  }

  // Cầm hai tay: tay xa được đặt lên cán cuốc (IK 2 xương) và khóa trục cán xuyên chuẩn qua tâm cả 2 nắm đấm
  applyWeaponGrip(jt, st) {
    if (!st || st.weapon !== 'hoe') return;
    const sa0 = jt.nFore + (jt.grip || 0);
    const dir0 = [Math.sin(sa0), Math.cos(sa0)];
    const nFist = [jt.nHand[0] + Math.sin(jt.nFore) * 2.8, jt.nHand[1] + Math.cos(jt.nFore) * 2.8];
    const L1 = 17, L2Fist = 18.8; // 16 (cẳng tay) + 2.8 (tâm nắm đấm)
    const tx = nFist[0] - dir0[0] * 14, ty = nFist[1] - dir0[1] * 14;
    let dx = tx - jt.fSh[0], dy = ty - jt.fSh[1];
    let dist = Math.hypot(dx, dy) || 0.001;
    const maxD = L1 + L2Fist - 0.4;
    if (dist > maxD) { dx *= maxD / dist; dy *= maxD / dist; dist = maxD; }
    const ux = dx / dist, uy = dy / dist;
    const x = (dist * dist + L1 * L1 - L2Fist * L2Fist) / (2 * dist);
    const h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
    // Khuỷu tay chọn phía thấp hơn (rủ xuống) cho tự nhiên
    let px = -uy, py = ux;
    if (py < 0) { px = -px; py = -py; }
    const fFist = [jt.fSh[0] + dx, jt.fSh[1] + dy];
    const elb = [jt.fSh[0] + ux * x + px * h, jt.fSh[1] + uy * x + py * h];
    const fFore = Math.atan2(fFist[0] - elb[0], fFist[1] - elb[1]);
    jt.fElb = elb;
    jt.fFore = fFore;
    jt.fHand = [elb[0] + Math.sin(fFore) * 16, elb[1] + Math.cos(fFore) * 16];
    // Khóa góc cán cuốc đi xuyên qua chính xác tâm của cả 2 nắm đấm (fFist -> nFist)
    if (Math.hypot(nFist[0] - fFist[0], nFist[1] - fFist[1]) > 2) {
      const lockedAxis = Math.atan2(nFist[0] - fFist[0], nFist[1] - fFist[1]);
      jt.grip = lockedAxis - jt.nFore;
    }
  }

  drawWeaponBody(ctx, hand0, fore0, st, len, grip = 0) {
    // Trục vũ khí xuyên qua tâm nắm đấm (cùng vị trí nắm đấm được vẽ ở drawGripFist)
    const hand = [hand0[0] + Math.sin(fore0) * 2.8, hand0[1] + Math.cos(fore0) * 2.8];
    const foreAbs = this.weaponAngle(st, fore0) + grip;
    const dir = [Math.sin(foreAbs), Math.cos(foreAbs)];
    const perp = [-dir[1], dir[0]];
    const a = [hand[0] - dir[0] * 6, hand[1] - dir[1] * 6];
    const b = [hand[0] + dir[0] * (len + 3), hand[1] + dir[1] * (len + 3)];

    // 1. CUỐC SẮT ĐẶC CHẾ (Phó Đặng Hoàng Anh): Cán thiết mộc bọc đai đồng + Lưỡi cuốc thép rèn góc cố định (không bao giờ lật ngược)
    if (st.weapon === 'hoe') {
      const butt = [hand[0] - dir[0] * 26, hand[1] - dir[1] * 26];
      // Đế chuôi bọc sắt
      const pommelEnd = [butt[0] - dir[0] * 3, butt[1] - dir[1] * 3];
      this.capsule(ctx, pommelEnd, b, 5.8, 4.4, 'rgba(0,0,0,0.62)');
      this.capsule(ctx, butt, b, 4.5, 3.4, '#6b4c2b');
      // Vệt sáng thớ gỗ thiết mộc
      this.capsule(ctx, [butt[0] - perp[0] * 0.9, butt[1] - perp[1] * 0.9], [b[0] - perp[0] * 0.7, b[1] - perp[1] * 0.7], 1.2, 0.9, 'rgba(253, 230, 138, 0.28)');
      this.capsule(ctx, pommelEnd, butt, 5.2, 4.8, '#475569');

      // Dây da quấn ở 2 vị trí nắm tay
      ctx.strokeStyle = '#291d12'; ctx.lineWidth = 3.8; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hand[0] - dir[0] * 4, hand[1] - dir[1] * 4);
      ctx.lineTo(hand[0] + dir[0] * 3, hand[1] + dir[1] * 3);
      ctx.moveTo(hand[0] - dir[0] * 18, hand[1] - dir[1] * 18);
      ctx.lineTo(hand[0] - dir[0] * 12, hand[1] - dir[1] * 12);
      ctx.stroke();

      // Cổ cuốc bọc đồng & thép gia cố
      const collarA = [b[0] - dir[0] * 5, b[1] - dir[1] * 5];
      const collarB = [b[0] + dir[0] * 2, b[1] + dir[1] * 2];
      this.capsule(ctx, collarA, collarB, 6.8, 6.2, '#1e293b');
      this.capsule(ctx, [b[0] - dir[0] * 4, b[1] - dir[1] * 4], [b[0] - dir[0] * 2, b[1] - dir[1] * 2], 7.2, 7.2, '#d97706');

      // Góc lưỡi cuốc cố định ~108 độ theo chiều bổ xuống của cán (tuyệt đối không lật)
      const bx = perp[0] * 0.95 - dir[0] * 0.31;
      const by = perp[1] * 0.95 - dir[1] * 0.31;
      const tip = [b[0], b[1]];
      // Đầu búa đối trọng phía lưng cuốc
      const pollEnd = [tip[0] - bx * 8, tip[1] - by * 8];
      this.capsule(ctx, tip, pollEnd, 6.2, 4.6, '#334155');

      // Thân lưỡi cuốc thép rèn bản rộng vát sắc ở mũi
      const bladeEdge = [tip[0] + bx * 27, tip[1] + by * 27];
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath();
      ctx.moveTo(tip[0] - dir[0] * 3.5, tip[1] - dir[1] * 3.5);
      ctx.lineTo(tip[0] + dir[0] * 4.2, tip[1] + dir[1] * 4.2);
      ctx.lineTo(bladeEdge[0] + dir[0] * 6.8, bladeEdge[1] + dir[1] * 6.8);
      ctx.lineTo(bladeEdge[0] - dir[0] * 4.8, bladeEdge[1] - dir[1] * 4.8);
      ctx.closePath();
      ctx.fill();

      // Thép đen ở phần sống cuốc
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(tip[0] - dir[0] * 2.6, tip[1] - dir[1] * 2.6);
      ctx.lineTo(tip[0] + dir[0] * 3.2, tip[1] + dir[1] * 3.2);
      ctx.lineTo(bladeEdge[0] + dir[0] * 5.6, bladeEdge[1] + dir[1] * 5.6);
      ctx.lineTo(bladeEdge[0] - dir[0] * 3.8, bladeEdge[1] - dir[1] * 3.8);
      ctx.closePath();
      ctx.fill();

      // Lưỡi vát ánh bạc sắc lẹm ở mép bổ
      const bevelStart = [tip[0] + bx * 17, tip[1] + by * 17];
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(bevelStart[0] - dir[0] * 3.2, bevelStart[1] - dir[1] * 3.2);
      ctx.lineTo(bevelStart[0] + dir[0] * 4.4, bevelStart[1] + dir[1] * 4.4);
      ctx.lineTo(bladeEdge[0] + dir[0] * 5.6, bladeEdge[1] + dir[1] * 5.6);
      ctx.lineTo(bladeEdge[0] - dir[0] * 3.8, bladeEdge[1] - dir[1] * 3.8);
      ctx.closePath();
      ctx.fill();

      // Đường sáng lưỡi bén
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bladeEdge[0] - dir[0] * 3.6, bladeEdge[1] - dir[1] * 3.6);
      ctx.lineTo(bladeEdge[0] + dir[0] * 5.4, bladeEdge[1] + dir[1] * 5.4);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 2. THIẾT CHÙY BÁT GIÁC KIM CƯƠNG (Triệu Đình An): Thiết kế lại hoàn toàn — Đầu chùy thép đen bát giác gai nhọn tam giác + Mũi thương phá giáp + Cổ chùy chạm vàng
    if (st.weapon === 'mace') {
      const shaftTop = [hand[0] + dir[0] * (len - 6), hand[1] + dir[1] * (len - 6)];
      const pommel = [hand[0] - dir[0] * 8, hand[1] - dir[1] * 8];

      // Cán thiết chùy bằng thép đen nhám, thon gọn và cứng cáp
      this.capsule(ctx, pommel, shaftTop, 5.6, 4.8, 'rgba(0,0,0,0.72)');
      this.capsule(ctx, pommel, shaftTop, 4.2, 3.5, '#1e293b');
      // Vệt ánh kim dọc thân cán
      this.capsule(ctx, [pommel[0] - perp[0] * 0.8, pommel[1] - perp[1] * 0.8], [shaftTop[0] - perp[0] * 0.6, shaftTop[1] - perp[1] * 0.6], 1.1, 0.9, '#64748b');

      // Dây da đỏ sẫm quấn chéo phần tay cầm + Đốc chùy đồng vàng
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(pommel[0], pommel[1], 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.2;
      for (let k = 1; k <= 3; k++) {
        const gp = [hand[0] + dir[0] * (k * 4.5), hand[1] + dir[1] * (k * 4.5)];
        ctx.beginPath();
        ctx.moveTo(gp[0] - perp[0] * 2.2 - dir[0] * 1.2, gp[1] - perp[1] * 2.2 - dir[1] * 1.2);
        ctx.lineTo(gp[0] + perp[0] * 2.2 + dir[0] * 1.2, gp[1] + perp[1] * 2.2 + dir[1] * 1.2);
        ctx.stroke();
      }

      // Chắn tay (handguard) và Cổ chùy (collar) bọc đồng vàng tinh xảo
      const guardPt = [hand[0] + dir[0] * 6.5, hand[1] + dir[1] * 6.5];
      this.capsule(ctx, [guardPt[0] - perp[0] * 4.2, guardPt[1] - perp[1] * 4.2], [guardPt[0] + perp[0] * 4.2, guardPt[1] + perp[1] * 4.2], 3.2, 3.2, '#b45309');
      this.capsule(ctx, [guardPt[0] - perp[0] * 3.4, guardPt[1] - perp[1] * 3.4], [guardPt[0] + perp[0] * 3.4, guardPt[1] + perp[1] * 3.4], 2.2, 2.2, '#facc15');

      const collarBase = [shaftTop[0] - dir[0] * 3.5, shaftTop[1] - dir[1] * 3.5];
      this.capsule(ctx, collarBase, shaftTop, 5.2, 7.6, '#b45309');
      this.capsule(ctx, [shaftTop[0] - dir[0] * 2, shaftTop[1] - dir[1] * 2], shaftTop, 5.8, 6.8, '#facc15');

      // Tâm bầu chùy Bát Giác
      const maceCenter = [shaftTop[0] + dir[0] * 10.5, shaftTop[1] + dir[1] * 10.5];
      const R = 11.2;

      // Vẽ 6 mũi gai thép hình tam giác sắc nhọn (Spikes) xung quanh quả cầu chùy
      const spikeAngles = [-2.25, -1.57, -0.88, 0.88, 1.57, 2.25];
      for (let i = 0; i < spikeAngles.length; i++) {
        const aSpike = foreAbs + spikeAngles[i];
        const sx = Math.sin(aSpike), sy = Math.cos(aSpike);
        const px = -sy, py = sx;
        const baseR = R - 1.5;
        const tipR = R + 6.8;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(maceCenter[0] + sx * baseR - px * 3.2, maceCenter[1] + sy * baseR - py * 3.2);
        ctx.lineTo(maceCenter[0] + sx * (tipR + 1.2), maceCenter[1] + sy * (tipR + 1.2));
        ctx.lineTo(maceCenter[0] + sx * baseR + px * 3.2, maceCenter[1] + sy * baseR + py * 3.2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(maceCenter[0] + sx * baseR - px * 2.2, maceCenter[1] + sy * baseR - py * 2.2);
        ctx.lineTo(maceCenter[0] + sx * tipR, maceCenter[1] + sy * tipR);
        ctx.lineTo(maceCenter[0] + sx * baseR + px * 2.2, maceCenter[1] + sy * baseR + py * 2.2);
        ctx.closePath();
        ctx.fill();
      }

      // Mũi thương phá giáp (Crown Spear Spike) vươn thẳng từ đỉnh đầu chùy
      const crownBase = [maceCenter[0] + dir[0] * (R - 1), maceCenter[1] + dir[1] * (R - 1)];
      const crownTip = [maceCenter[0] + dir[0] * (R + 11.5), maceCenter[1] + dir[1] * (R + 11.5)];
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(crownBase[0] - perp[0] * 4.2, crownBase[1] - perp[1] * 4.2);
      ctx.lineTo(crownTip[0] + dir[0] * 1.5, crownTip[1] + dir[1] * 1.5);
      ctx.lineTo(crownBase[0] + perp[0] * 4.2, crownBase[1] + perp[1] * 4.2);
      ctx.closePath();
      ctx.fill();
      // Hai mặt vát kim cương của mũi thương đỉnh chùy
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(crownBase[0] - perp[0] * 3.0, crownBase[1] - perp[1] * 3.0);
      ctx.lineTo(crownTip[0], crownTip[1]);
      ctx.lineTo(crownBase[0], crownBase[1]);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(crownBase[0], crownBase[1]);
      ctx.lineTo(crownTip[0], crownTip[1]);
      ctx.lineTo(crownBase[0] + perp[0] * 3.0, crownBase[1] + perp[1] * 3.0);
      ctx.closePath();
      ctx.fill();

      // Khối cầu thép Bát Giác trung tâm có chiều sâu 3D
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.beginPath(); ctx.arc(maceCenter[0], maceCenter[1], R + 1.4, 0, Math.PI * 2); ctx.fill();

      const headGrad = ctx.createRadialGradient(
        maceCenter[0] - perp[0] * 3 - dir[0] * 2,
        maceCenter[1] - perp[1] * 3 - dir[1] * 2,
        1.5,
        maceCenter[0],
        maceCenter[1],
        R
      );
      headGrad.addColorStop(0, '#94a3b8');
      headGrad.addColorStop(0.45, '#334155');
      headGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = headGrad;
      ctx.beginPath(); ctx.arc(maceCenter[0], maceCenter[1], R, 0, Math.PI * 2); ctx.fill();

      // Đai vàng kim ôm ngang bụng quả chùy + Đinh tán trung tâm
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(maceCenter[0] - perp[0] * (R - 1), maceCenter[1] - perp[1] * (R - 1));
      ctx.lineTo(maceCenter[0] + perp[0] * (R - 1), maceCenter[1] + perp[1] * (R - 1));
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(maceCenter[0], maceCenter[1], 2.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // 3. DÙI CUI TÁC CHIẾN (Baton): Cán chống trượt, chắn tay bên, thân hợp kim đen bọc đầu thép phát sáng
    if (st.weapon === 'baton') {
      this.capsule(ctx, a, b, 5.8, 5.2, 'rgba(0,0,0,0.65)');
      this.capsule(ctx, a, b, 4.4, 3.8, '#1e293b');
      // Vòng chắn tay
      const bg = [hand[0] + dir[0] * 5.5, hand[1] + dir[1] * 5.5];
      this.capsule(ctx, [bg[0] - perp[0] * 4, bg[1] - perp[1] * 4], [bg[0] + perp[0] * 4, bg[1] + perp[1] * 4], 2.6, 2.6, '#475569');
      // Đầu bọc kim loại nặng
      const t0 = [a[0] + dir[0] * len * 0.68, a[1] + dir[1] * len * 0.68];
      this.capsule(ctx, t0, b, 5.2, 5.4, st.aura || '#94a3b8');
      this.capsule(ctx, [t0[0] - perp[0] * 1, t0[1] - perp[1] * 1], [b[0] - perp[0] * 1, b[1] - perp[1] * 1], 1.6, 1.6, '#ffffff');
      return;
    }

    // 4. MÃ TẤU / ĐOẢN ĐAO / SONG ĐAO (Machete, Knife, Twin Daggers): Lưỡi đao vát sắc bén có sống đao, rãnh máu & chắn tay đồng
    const isDagger = st.weapon === 'twin_daggers' || st.weapon === 'knife';
    const bladeTint = st.weapon === 'twin_daggers' ? '#fecdd3' : '#e2e8f0';
    const spineCol = st.weapon === 'twin_daggers' ? '#881337' : '#475569';
    const bladeStart = [hand[0] + dir[0] * 5, hand[1] + dir[1] * 5];
    const bladeTip = [b[0] + dir[0] * 4, b[1] + dir[1] * 4];
    const midBell = [hand[0] + dir[0] * (len * 0.72), hand[1] + dir[1] * (len * 0.72)];
    const wBase = isDagger ? 2.6 : 3.4;
    const wBell = isDagger ? 3.2 : 5.4;

    // Chuôi đao quấn dây đỏ
    this.capsule(ctx, a, bladeStart, 4.6, 4.6, '#1e293b');
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hand[0] - dir[0] * 4.5, hand[1] - dir[1] * 4.5); ctx.lineTo(hand[0] + dir[0] * 3, hand[1] + dir[1] * 3); ctx.stroke();

    // Lưỡi đao đa giác sắc lẹm
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * (wBase + 1), bladeStart[1] - perp[1] * (wBase + 1));
    ctx.lineTo(midBell[0] - perp[0] * (wBase + 0.8), midBell[1] - perp[1] * (wBase + 0.8));
    ctx.lineTo(bladeTip[0] + dir[0] * 1.5, bladeTip[1] + dir[1] * 1.5);
    ctx.lineTo(midBell[0] + perp[0] * (wBell + 1), midBell[1] + perp[1] * (wBell + 1));
    ctx.lineTo(bladeStart[0] + perp[0] * (wBase + 1), bladeStart[1] + perp[1] * (wBase + 1));
    ctx.closePath();
    ctx.fill();

    // Phần lưỡi sáng
    ctx.fillStyle = bladeTint;
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * wBase, bladeStart[1] - perp[1] * wBase);
    ctx.lineTo(midBell[0] - perp[0] * (wBase * 0.85), midBell[1] - perp[1] * (wBase * 0.85));
    ctx.lineTo(bladeTip[0], bladeTip[1]);
    ctx.lineTo(midBell[0] + perp[0] * wBell, midBell[1] + perp[1] * wBell);
    ctx.lineTo(bladeStart[0] + perp[0] * wBase, bladeStart[1] + perp[1] * wBase);
    ctx.closePath();
    ctx.fill();

    // Sống đao thép sẫm
    ctx.fillStyle = spineCol;
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * wBase, bladeStart[1] - perp[1] * wBase);
    ctx.lineTo(midBell[0] - perp[0] * (wBase * 0.85), midBell[1] - perp[1] * (wBase * 0.85));
    ctx.lineTo(bladeTip[0], bladeTip[1]);
    ctx.lineTo(bladeStart[0], bladeStart[1]);
    ctx.closePath();
    ctx.fill();

    // Đường highlight sắc bén dọc mép lưỡi
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] + perp[0] * (wBase * 0.8), bladeStart[1] + perp[1] * (wBase * 0.8));
    ctx.lineTo(midBell[0] + perp[0] * (wBell * 0.9), midBell[1] + perp[1] * (wBell * 0.9));
    ctx.lineTo(bladeTip[0], bladeTip[1]);
    ctx.stroke();

    // Chắn tay (Crossguard) bằng đồng vàng
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * 5.2, bladeStart[1] - perp[1] * 5.2);
    ctx.lineTo(bladeStart[0] + perp[0] * 5.2, bladeStart[1] + perp[1] * 5.2);
    ctx.stroke();
  }

  drawTorso(ctx, jt, st) {
    const { H, sh, d, pp } = jt;
    const P = (base, a, b) => [base[0] + pp[0] * a + d[0] * b, base[1] + pp[1] * a + d[1] * b];
    const backSh = P(sh, -10.2, 0), frontSh = P(sh, 10.2, 0);
    const backWa = P(H, -8.2, 6), frontWa = P(H, 8.6, 6);
    const backSk = P(H, -9.8, -8.5), frontSk = P(H, 10.4, -8.5);
    const chest = P(sh, 12.6, -10);

    const path = () => {
      ctx.beginPath();
      ctx.moveTo(backSh[0], backSh[1]);
      ctx.lineTo(frontSh[0], frontSh[1]);
      ctx.quadraticCurveTo(chest[0], chest[1], frontWa[0], frontWa[1]);
      ctx.lineTo(frontSk[0], frontSk[1]);
      ctx.lineTo(backSk[0], backSk[1]);
      ctx.lineTo(backWa[0], backWa[1]);
      ctx.closePath();
    };
    path();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineJoin = 'round'; ctx.stroke();
    const grad = ctx.createLinearGradient(backSh[0], backSh[1], frontSh[0], frontSh[1]);
    grad.addColorStop(0, st.giD); grad.addColorStop(0.52, st.gi); grad.addColorStop(1, st.giL);
    path();
    ctx.fillStyle = grad; ctx.fill();

    // Đường xẻ tà võ phục & Nếp gấp cơ ngực / eo
    ctx.strokeStyle = 'rgba(0,0,0,0.26)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    const f1 = P(H, -1.5, 9), f2 = P(H, -2.8, -5);
    const pec1 = P(sh, 2.5, -9.5), pec2 = P(sh, 8.2, -9.2);
    ctx.moveTo(f1[0], f1[1]); ctx.lineTo(f2[0], f2[1]);
    ctx.moveTo(pec1[0], pec1[1]); ctx.lineTo(pec2[0], pec2[1]);
    ctx.stroke();

    // Cổ áo chéo Võ Phục (hoặc Âu Phục có cà vạt cho Hứa Vũ Đại / Mộc Đăng)
    const neckF = P(sh, 3.4, 2), crossB = P(H, -4.2, 4), neckB = P(sh, -3.4, 2), crossF = P(H, 5.4, 4);
    const v1 = P(sh, -3.4, 1.2), v2 = P(sh, 4.8, 1.2), v3 = P(sh, 0.8, -10.5);
    ctx.fillStyle = st.suit ? st.under : (st.under || '#e5e7eb');
    ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v2[0], v2[1]); ctx.lineTo(v3[0], v3[1]); ctx.closePath(); ctx.fill();

    if (st.suit) {
      // Cà vạt đỏ/xanh sang trọng cho Âu phục
      const tieTop = P(sh, 0.8, -2), tieBot = P(H, 1.8, 7);
      ctx.strokeStyle = st.belt === '#00d2ff' ? '#0284c7' : '#dc2626';
      ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tieTop[0], tieTop[1]); ctx.lineTo(tieBot[0], tieBot[1]); ctx.stroke();
      // Khăn túi ngực
      const pk = P(sh, 5.5, -7.5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(pk[0] - 1.5, pk[1] - 1, 3.2, 1.8);
    }

    // Viền cổ áo võ phục 2 lớp dày dặn
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(neckF[0], neckF[1]); ctx.lineTo(crossB[0], crossB[1]); ctx.stroke();
    ctx.strokeStyle = st.giL; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(neckF[0], neckF[1]); ctx.lineTo(crossB[0], crossB[1]); ctx.stroke();
    ctx.strokeStyle = st.gi; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(neckB[0], neckB[1]); ctx.lineTo(crossF[0], crossF[1]); ctx.stroke();

    // Khăn quàng cổ (Phó Dung Hải / Trần Bích Lâm)
    if (st.scarf) {
      const s1 = P(sh, 3.8, 2.5), s2 = P(sh, -4.5, 2.5);
      ctx.strokeStyle = st.scarfColor || st.belt; ctx.lineWidth = 6.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s1[0], s1[1]); ctx.quadraticCurveTo(s1[0] - 13, s1[1] + 12, s1[0] - 24, s1[1] + 27); ctx.stroke();
      ctx.strokeStyle = st.beltD || st.belt; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(s2[0], s2[1]); ctx.quadraticCurveTo(s2[0] - 9, s2[1] + 14, s2[0] - 17, s2[1] + 24); ctx.stroke();
    }

    // Huy hiệu Vovinam Việt Võ Đạo sắc nét trên ngực trái
    if (st.patch) {
      const c = P(sh, 5.8, -8.8);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate(Math.atan2(d[0], -d[1]));
      // Nền khiên vàng viền trắng chuẩn Vovinam
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(-4.4, -3.8, 8.8, 7.6);
      ctx.fillStyle = '#facc15'; ctx.fillRect(-3.7, -3.1, 7.4, 6.2);
      // Vòng tròn âm dương đỏ - xanh ở tâm huy hiệu
      ctx.fillStyle = '#e11d2e'; ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(0, 0, 2.3, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Rồng vàng thêu ngực (Long Vương / Vinh Tâm)
    if (st.dragon) {
      const a = P(sh, 2, -6);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      ctx.bezierCurveTo(a[0] + 8, a[1] + 3, a[0] - 6, a[1] + 8, a[0] + 6, a[1] + 14);
      ctx.stroke();
    }

    // Giáp vai Chiến Thần nhiều lớp viền vàng kim (Triệu Đình An / Thiết Quyền / Vệ Sĩ)
    if (st.armor) {
      const sx = jt.nSh[0], sy = jt.nSh[1];
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.atan2(d[0], -d[1]) * 0.6);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.ellipse(0, 0, 8.2, 6.2, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = st.metal || '#64748b';
      ctx.beginPath(); ctx.ellipse(0, 0, 7.2, 5.2, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = st.belt || '#eab308'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, 6.8, 4.8, -0.2, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.beginPath(); ctx.arc(-1.8, -1.6, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  drawBelt(ctx, jt, st, sway) {
    const { H, d, pp } = jt;
    const P = (a, b) => [H[0] + pp[0] * a + d[0] * b, H[1] + pp[1] * a + d[1] * b];
    const q = [P(-9.2, 3.2), P(9.6, 3.2), P(9.8, -3.2), P(-9.0, -3.2)];
    ctx.beginPath();
    ctx.moveTo(q[0][0], q[0][1]); ctx.lineTo(q[1][0], q[1][1]); ctx.lineTo(q[2][0], q[2][1]); ctx.lineTo(q[3][0], q[3][1]); ctx.closePath();
    ctx.fillStyle = st.belt; ctx.fill();
    ctx.lineWidth = 1.3; ctx.strokeStyle = st.beltD; ctx.stroke();

    // Đường chỉ thêu dọc đai võ thuật
    const sL = P(-8.2, 0), sR = P(8.6, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(sL[0], sL[1]); ctx.lineTo(sR[0], sR[1]); ctx.stroke();

    const k = P(7, 0);
    const tail = (len, dx, w) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = st.beltD; ctx.lineWidth = w + 1.8;
      ctx.beginPath(); ctx.moveTo(k[0], k[1]); ctx.quadraticCurveTo(k[0] + sway * 0.4 + dx, k[1] + len * 0.5, k[0] + sway * 1.3 + dx, k[1] + len); ctx.stroke();
      ctx.strokeStyle = st.belt; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(k[0], k[1]); ctx.quadraticCurveTo(k[0] + sway * 0.4 + dx, k[1] + len * 0.5, k[0] + sway * 1.3 + dx, k[1] + len); ctx.stroke();
    };
    tail(25, 1.2, 4.2);
    tail(19, -3.5, 3.8);
    // Nút thắt đai Vovinam vuông vắn
    ctx.fillStyle = st.beltD; ctx.fillRect(k[0] - 3.4, k[1] - 4.2, 6.8, 8.4);
    ctx.fillStyle = st.belt; ctx.fillRect(k[0] - 2.4, k[1] - 3.2, 4.8, 6.4);
  }

  drawNeckAndHead(ctx, jt, st, o) {
    // Cổ có bóng đổ dưới cằm tạo khối tự nhiên
    const nA = [jt.sh[0] + jt.d[0] * 2, jt.sh[1] + jt.d[1] * 2];
    const nB = [jt.head[0] - Math.sin(jt.ha) * 6, jt.head[1] + Math.cos(jt.ha) * 6];
    this.capsule(ctx, nA, nB, 7.2, 6.6, 'rgba(0,0,0,0.45)');
    this.capsule(ctx, nA, nB, 6.2, 5.8, st.skinD);
    ctx.save();
    ctx.translate(jt.head[0], jt.head[1]);
    ctx.rotate(jt.ha);
    this.drawHead(ctx, st, o);
    ctx.restore();
  }

  // Vẽ đầu (hệ toạ độ cục bộ: mặt hướng +x, đỉnh đầu hướng -y). Đã nâng cấp thẩm mỹ cho toàn bộ nhân vật.
  drawHead(ctx, st, o) {
    const sw = o.sway || 0;
    // 1. Tóc/đuôi phía sau
    if (st.hairStyle === 'white') {
      ctx.fillStyle = st.hair;
      ctx.beginPath();
      ctx.moveTo(-7.5, -6);
      ctx.quadraticCurveTo(-19, -2, -17 + sw * 0.35, 13);
      ctx.quadraticCurveTo(-11, 6, -5.5, 4);
      ctx.closePath();
      ctx.fill();
    }
    if (st.mask || st.hairStyle === 'bandana') {
      ctx.strokeStyle = st.mask || st.bandana; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, st.mask ? 2 : -3); ctx.quadraticCurveTo(-16, 3, -24 + sw * 0.45, 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, st.mask ? 3 : -2); ctx.quadraticCurveTo(-15, 8, -22 + sw * 0.55, 9.5); ctx.stroke();
    }

    // 2. Khuôn mặt góc cạnh võ hiệp (có đường xương hàm rõ nét thay vì hình bầu dục đơn điệu)
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.beginPath(); ctx.ellipse(1.0, 0.5, 9.8, 10.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = st.skin;
    ctx.beginPath(); ctx.ellipse(1.0, 0.5, 8.7, 9.8, 0, 0, Math.PI * 2); ctx.fill();

    // Bóng đổ khối cằm & xương hàm
    ctx.fillStyle = 'rgba(110,48,20,0.16)';
    ctx.beginPath(); ctx.ellipse(1.2, 4.6, 7.6, 5.8, 0, 0.1, Math.PI - 0.1); ctx.fill();
    // Bóng mảnh dưới mái tóc (trán)
    ctx.fillStyle = 'rgba(90,38,15,0.18)';
    ctx.beginPath(); ctx.ellipse(1.5, -4.5, 7.5, 2.2, 0, Math.PI, Math.PI * 2); ctx.fill();

    // 3. Tai có chi tiết vành tai trong tinh tế (không còn là chấm tròn tối màu)
    ctx.fillStyle = st.skin;
    ctx.beginPath(); ctx.ellipse(-3.8, 1.4, 2.4, 3.3, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = st.skinD; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(-3.9, 1.5, 1.3, -1.2, 1.8); ctx.stroke();

    // 4. Kiểu tóc đa lớp có độ bồng & vệt sáng bóng tóc (Hair Highlights)
    ctx.fillStyle = st.hair;
    const hs = st.hairStyle;
    if (hs === 'short' || hs === 'white') {
      ctx.beginPath();
      ctx.moveTo(-9.6, 3.2);
      ctx.bezierCurveTo(-11.4, -10.2, -3.2, -14.2, 3.5, -12.6);
      ctx.bezierCurveTo(9.8, -11.2, 11.4, -5.8, 9.8, -2.8);
      // Các lọn tóc mái sắc sảo trước trán
      ctx.lineTo(6.8, -5.2);
      ctx.lineTo(5.2, -3.2);
      ctx.lineTo(2.4, -5.8);
      ctx.lineTo(-1.2, -4.2);
      ctx.bezierCurveTo(-4.2, -1.8, -6.2, 0.5, -6.8, 3.6);
      ctx.closePath();
      ctx.fill();
      // Highlight ánh tóc
      ctx.strokeStyle = hs === 'white' ? '#ffffff' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4, -9.5); ctx.quadraticCurveTo(1, -11.2, 5.5, -8.2); ctx.stroke();
    } else if (hs === 'buzz' || hs === 'bandana') {
      // Kiểu tóc Undercut / Chiến Binh Gọn Gàng (Triệu Đình An, Hoàng Anh, Thiết Quyền)
      ctx.beginPath();
      ctx.moveTo(-9.4, -0.8);
      ctx.bezierCurveTo(-10.5, -11.8, 7.5, -13.5, 9.8, -3.4);
      ctx.lineTo(7.2, -5.2);
      ctx.bezierCurveTo(3.5, -6.8, -4.2, -6.2, -7.2, -2.2);
      ctx.lineTo(-9.4, -0.8);
      ctx.closePath();
      ctx.fill();
      // Vệt sáng nhẹ trên đỉnh tóc
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-3.5, -9.2); ctx.quadraticCurveTo(1.5, -10.4, 5.2, -7.8); ctx.stroke();
    } else if (hs === 'spiky') {
      // Tóc gai đa tầng (Dung Hải, Bích Lâm, Huyết Ảnh)
      ctx.beginPath();
      ctx.moveTo(-9.6, 2.2);
      ctx.lineTo(-11.2, -8.5); ctx.lineTo(-6.4, -7.2);
      ctx.lineTo(-5.8, -14.8); ctx.lineTo(-1.0, -9.8);
      ctx.lineTo(3.2, -15.4); ctx.lineTo(5.8, -9.2);
      ctx.lineTo(11.2, -11.2); ctx.lineTo(9.4, -3.2);
      ctx.lineTo(6.2, -5.8); ctx.lineTo(3.0, -4.2);
      ctx.bezierCurveTo(0, -6.4, -4.2, -2.5, -6.8, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-3.5, -11.5); ctx.lineTo(2.2, -13.2); ctx.stroke();
    } else if (hs === 'ponytail') {
      ctx.beginPath();
      ctx.moveTo(-9.6, 2.2);
      ctx.bezierCurveTo(-11.2, -9.5, 0.5, -13.5, 9.0, -5.8);
      ctx.bezierCurveTo(4.2, -6.5, -1.2, -5.5, -4.2, -1.0);
      ctx.bezierCurveTo(-6, 1, -7, 3, -7.5, 4);
      ctx.closePath();
      ctx.fill();
      // Đuôi tóc dài phía sau bay mềm mại
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.quadraticCurveTo(-18.5, -12.5, -24.5 + sw * 0.45, 4.5);
      ctx.quadraticCurveTo(-16, -1.5, -6, -4);
      ctx.closePath();
      ctx.fill();
      // Dây cột tóc
      ctx.fillStyle = st.scarfColor || '#22c55e';
      ctx.beginPath(); ctx.arc(-7, -8, 2.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = st.hair;
    }
    if (hs === 'bandana') {
      ctx.fillStyle = st.bandana;
      ctx.beginPath(); ctx.moveTo(-9.5, -5.8); ctx.lineTo(9.9, -6.6); ctx.lineTo(10.0, -3.3); ctx.lineTo(-9.6, -2.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-7, -4.6); ctx.lineTo(8, -5.2); ctx.stroke();
    }

    // 5. Mặt nạ, Râu, Mũ bảo hộ, Sẹo
    if (st.mask) {
      ctx.fillStyle = st.mask;
      ctx.beginPath(); ctx.moveTo(-8.8, 1.8); ctx.lineTo(9.8, 0.8); ctx.lineTo(8.2, 10.8); ctx.lineTo(0, 12.4); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-6, 3.2); ctx.lineTo(8.5, 2.2); ctx.stroke();
    }
    if (st.beard) {
      // Râu quai nón / Râu bạc oai phong
      const isSilver = st.hairStyle === 'white';
      ctx.fillStyle = isSilver ? '#e5e7eb' : st.hair;
      if (isSilver) {
        ctx.beginPath(); ctx.moveTo(-1, 6); ctx.lineTo(8.2, 5); ctx.lineTo(5.5, 13.5); ctx.lineTo(1, 15.2); ctx.closePath(); ctx.fill();
      } else {
        // Râu cằm nam tính cho Phó Đặng Hoàng Anh
        ctx.beginPath(); ctx.moveTo(-0.5, 6.8); ctx.lineTo(7.8, 6.2); ctx.lineTo(6.2, 10.6); ctx.lineTo(1.2, 11.2); ctx.closePath(); ctx.fill();
      }
    }
    if (st.helmet) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.moveTo(-10.4, 1); ctx.bezierCurveTo(-12, -14, 9, -15, 10.4, -3); ctx.lineTo(-10.4, -1.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = st.helmet;
      ctx.beginPath(); ctx.moveTo(-9.6, 0); ctx.bezierCurveTo(-11, -13, 8, -14, 9.6, -3.4); ctx.lineTo(-9.6, -2.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(-1, -9, 5, 1.8, -0.2, 0, Math.PI * 2); ctx.fill();
    }
    if (st.scar) {
      ctx.strokeStyle = 'rgba(150,40,40,0.85)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(1.2, -7.8); ctx.lineTo(6.2, -0.2); ctx.stroke();
    }

    // 6. Mắt, Chân Mày Kiếm & Thần Thái Võ Giả
    if (st.sunglasses) {
      ctx.fillStyle = '#09090b';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(1.2, -3.2, 8.2, 4.2, 1.2) : ctx.rect(1.2, -3.2, 8.2, 4.2); ctx.fill();
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(3, -2.6); ctx.lineTo(7.5, 0.4); ctx.stroke();
    } else if (st.glowingEyes) {
      ctx.save();
      ctx.shadowColor = st.glowingEyes; ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(4.3, -1, 3.2, 1.6, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = st.glowingEyes;
      ctx.beginPath(); ctx.arc(5.2, -1, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      // Mắt sắc nét: lòng trắng + mí trên đậm + tròng mắt màu + con ngươi + đốm phản quang kép
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(4.4, -1.0, 2.8, 1.85, -0.05, 0, Math.PI * 2); ctx.fill();
      // Tròng mắt màu theo nhân vật
      ctx.fillStyle = st.eyeColor || '#0f172a';
      ctx.beginPath(); ctx.arc(5.1, -1.0, 1.4, 0, Math.PI * 2); ctx.fill();
      // Con ngươi tối ở tâm
      ctx.fillStyle = '#020617';
      ctx.beginPath(); ctx.arc(5.25, -1.0, 0.72, 0, Math.PI * 2); ctx.fill();
      // Đốm sáng phản quang (catchlight) giúp mắt có hồn
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(4.65, -1.45, 0.62, 0, Math.PI * 2); ctx.fill();
      // Đường viền mí mắt trên sắc sảo
      ctx.strokeStyle = 'rgba(15,23,42,0.85)'; ctx.lineWidth = 0.95;
      ctx.beginPath(); ctx.moveTo(1.6, -1.5); ctx.quadraticCurveTo(4.5, -2.9, 7.2, -1.2); ctx.stroke();
    }

    // Kính (Phó Mộc Đăng)
    if (st.glasses) {
      ctx.strokeStyle = 'rgba(180,205,235,0.9)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(4.6, -1, 4.6, 3.4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0.2, -1.4); ctx.lineTo(0.4, -1.4); ctx.stroke();
      ctx.fillStyle = 'rgba(120,200,255,0.18)';
      ctx.beginPath(); ctx.ellipse(4.6, -1, 4.2, 3, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Chân mày kiếm uy nghi
    ctx.strokeStyle = (st.hairStyle === 'white') ? '#cbd5e1' : st.hair;
    ctx.lineWidth = 1.75; ctx.lineCap = 'round';
    ctx.beginPath();
    if (o.angry) {
      ctx.moveTo(1.4, -4.9); ctx.lineTo(7.4, -2.6);
    } else {
      ctx.moveTo(1.6, -4.0); ctx.lineTo(7.2, -3.5);
    }
    ctx.stroke();

    // Sống mũi & Miệng (há miệng hét kiai khi ra đòn)
    ctx.strokeStyle = 'rgba(105,46,18,0.6)'; ctx.lineWidth = 1.05;
    ctx.beginPath(); ctx.moveTo(8.8, -0.8); ctx.lineTo(9.9, 1.7); ctx.lineTo(8.3, 2.2); ctx.stroke();
    if (!st.mask) {
      if (o.shout) {
        ctx.fillStyle = '#4a0d18';
        ctx.beginPath(); ctx.ellipse(5.4, 5.6, 2.9, 2.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(3.3, 3.7, 4.2, 1.1);
      } else {
        ctx.strokeStyle = 'rgba(90,32,22,0.85)'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.moveTo(3.2, 5.8); ctx.quadraticCurveTo(5.2, 5.9, 7.3, 5.4); ctx.stroke();
      }
    }
  }

  // ------------------------------------------------------------------ PORTRAIT (HUD / thoại / Thẻ Trang Phục)
  drawPortrait(canvas, type, flip, vovinamSkin = false) {
    if (!canvas || !canvas.getContext) return;
    const c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const st = this.getStyle({ type: type || 'player', styleType: type || 'player', vovinamSkin: !!vovinamSkin });
    c.clearRect(0, 0, w, h);

    const bg = c.createRadialGradient(w * 0.5, h * 0.45, 4, w * 0.5, h * 0.5, w * 0.75);
    bg.addColorStop(0, this.rgba(vovinamSkin ? '#38bdf8' : st.aura, 0.62));
    bg.addColorStop(1, '#070a12');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);

    c.save();
    if (flip) { c.translate(w, 0); c.scale(-1, 1); }

    // Vai + võ phục
    const sg = c.createLinearGradient(0, h * 0.7, 0, h);
    sg.addColorStop(0, st.giL); sg.addColorStop(1, st.giD);
    c.fillStyle = sg;
    c.beginPath();
    c.moveTo(w * 0.02, h); c.quadraticCurveTo(w * 0.06, h * 0.72, w * 0.32, h * 0.7);
    c.lineTo(w * 0.7, h * 0.7); c.quadraticCurveTo(w * 0.96, h * 0.72, w * 0.98, h); c.closePath(); c.fill();
    // Cổ + áo lót
    c.fillStyle = st.skinD; c.fillRect(w * 0.42, h * 0.58, w * 0.18, h * 0.16);
    c.fillStyle = st.under || '#e5e7eb';
    c.beginPath(); c.moveTo(w * 0.36, h * 0.7); c.lineTo(w * 0.66, h * 0.7); c.lineTo(w * 0.51, h * 0.9); c.closePath(); c.fill();
    c.strokeStyle = st.giL; c.lineWidth = w * 0.035;
    c.beginPath(); c.moveTo(w * 0.34, h * 0.7); c.lineTo(w * 0.58, h * 0.98); c.stroke();
    c.beginPath(); c.moveTo(w * 0.68, h * 0.7); c.lineTo(w * 0.44, h * 0.98); c.stroke();
    // Logo Vovinam trên ngực
    if (st.patch) {
      c.fillStyle = '#f8fafc'; c.fillRect(w * 0.13, h * 0.81, w * 0.14, h * 0.12);
      c.fillStyle = '#facc15'; c.fillRect(w * 0.14, h * 0.82, w * 0.12, h * 0.1);
      c.fillStyle = '#e11d2e'; c.beginPath(); c.arc(w * 0.2, h * 0.87, w * 0.032, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1d4ed8'; c.beginPath(); c.arc(w * 0.2, h * 0.87, w * 0.032, Math.PI * 0.5, Math.PI * 1.5); c.fill();
    }
    // Đầu (khung chân dung: đầu chiếm ~55% khung, thấy rõ vai + cổ áo, không bị cắt cằm)
    const sc = w / 38;
    c.translate(w * 0.5, h * 0.41);
    c.scale(sc, sc);
    this.drawHead(c, st, { shout: false, angry: type !== 'player' && type !== 'npc_huavudai', sway: 0 });
    c.restore();

    // Khung bóng
    const vg = c.createLinearGradient(0, h * 0.6, 0, h);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = vg; c.fillRect(0, 0, w, h);
  }

  // Vẽ hình minh họa toàn thân/bán thân cho Thẻ Trang Phục (Skin Card) trong màn hình Chọn Tướng kiểu Liên Quân
  drawSkinCardArt(canvas, charObj, skinId) {
    if (!canvas || !canvas.getContext || !charObj) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const isVovinam = (skinId === 'vovinam');
    const styleType = charObj.styleType || 'player';
    const dummy = {
      id: 'skin_card_' + charObj.id + '_' + skinId,
      type: styleType,
      styleType: styleType,
      charId: charObj.id,
      characterId: charObj.id,
      vovinamSkin: isVovinam,
      state: 'idle',
      animTime: 0.4,
      facing: 1,
      x: Math.round(w * 0.5),
      y: Math.round(h * 0.92),
      z: 0,
      renderScale: 1.15
    };
    const st = this.getStyle(dummy);
    ctx.clearRect(0, 0, w, h);

    // Nền võ đường / hào quang trang phục
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    if (isVovinam) {
      bg.addColorStop(0, '#0c2461');
      bg.addColorStop(0.55, '#1e3799');
      bg.addColorStop(1, '#070b19');
    } else {
      bg.addColorStop(0, '#1e293b');
      bg.addColorStop(0.6, '#0f172a');
      bg.addColorStop(1, '#050811');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Vòng pháp trận Thái Cực / Âm Dương Vovinam phía sau lưng nhân vật
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 4, w * 0.5, h * 0.42, w * 0.62);
    glow.addColorStop(0, this.rgba(isVovinam ? '#38bdf8' : (st.aura || '#ffd700'), 0.48));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    if (isVovinam) {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.4);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.32)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, w * 0.34, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, w * 0.28, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Vẽ nhân vật toàn thân trong bộ trang phục tương ứng
    this.render(ctx, dummy, { x: 0, y: 0 });

    // Đổ bóng chân trang phục để nổi bật tên thẻ
    const botGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
    botGrad.addColorStop(0, 'rgba(4,7,14,0)');
    botGrad.addColorStop(1, 'rgba(4,7,14,0.92)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
  }
}

const skeletalRenderer = new SkeletalRenderer();
window.skeletalRenderer = skeletalRenderer;
window.SkeletalRenderer = SkeletalRenderer;
