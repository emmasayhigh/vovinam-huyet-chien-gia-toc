/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationBase.js - Khoi tao, style va cac ham pose dung chung.
 */

(function () {
const { AnimUtil, STYLE_DEFS, VARIANTS, ATTACK_STATES, POSE_ALIAS, POSE_KEYS, shadeColor, hashStr } = window;

class SkeletalRendererBase {
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
}

window.SkeletalRendererBase = SkeletalRendererBase;
})();
