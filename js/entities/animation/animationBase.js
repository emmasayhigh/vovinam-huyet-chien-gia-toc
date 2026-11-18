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
    // Trang phục thay thế: Võ Phục Vovinam hoặc Skin đặc biệt (VD: Ông Năm Chèo cho Đình Bích Lâm)
    // Ngô Nhất Nghị ('nghi') mặc định đã mặc Võ Phục Vovinam nên không áp dụng ghi đè skin phụ này
    const charKey = e.characterId || e.charId || (e.type === 'player' ? (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter) || 'nghi' : null);
    let skinId = 'default';
    if (e.namcheoSkin === true) skinId = 'namcheo';
    else if (e.vovinamSkin === true || e.isVovinamSkin === true) skinId = 'vovinam';
    else if (typeof e.equippedSkin === 'string' && e.equippedSkin) skinId = e.equippedSkin;
    else if ((e.type === 'player' || e.isAlly) && charKey && charKey !== 'nghi' && window.saveManager) {
      if (typeof window.saveManager.getEquippedSkin === 'function') skinId = window.saveManager.getEquippedSkin(charKey);
      else if (typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(charKey, 'vovinam')) skinId = 'vovinam';
    }
    if (charKey === 'nghi') skinId = 'default';
    const isVovinam = (skinId === 'vovinam');
    if (skinId && skinId !== 'default') {
      const k = type + '!' + skinId;
      if (!this._styles[k]) {
        let customOverrides = null;
        if (window.CharacterRegistry && typeof window.CharacterRegistry.getCustomSkinOverrides === 'function') {
          customOverrides = window.CharacterRegistry.getCustomSkinOverrides(charKey, skinId, st);
        } else if (isVovinam) {
          customOverrides = window.CharacterRegistry
            ? window.CharacterRegistry.getVovinamSkinOverrides(charKey, st)
            : {
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
        }
        if (customOverrides) {
          this._styles[k] = Object.assign({}, st, customOverrides);
        }
      }
      if (this._styles[k]) st = this._styles[k];
    }
    // Người chơi đang cầm vũ khí nhặt được trên sân ([E] Nhặt Côn / Mã Tấu / Khiên): luôn ưu tiên hiển thị vũ khí đang cầm trên tay!
    const heldType = e.heldWeapon || (e.weapon && e.weapon.type) || null;
    if (heldType && window.WEAPON_DEFS && window.WEAPON_DEFS[heldType] && window.WEAPON_DEFS[heldType].styleWeapon) {
      const k = type + (skinId && skinId !== 'default' ? '!' + skinId : '') + '!held' + heldType;
      if (!this._styles[k]) {
        const wd = window.WEAPON_DEFS[heldType];
        if (wd.styleWeapon === 'riot_shield') {
          this._styles[k] = Object.assign({}, st, {
            weapon: null,
            weaponLen: 0,
            riotShield: true,
            shield: false,
            frostBlade: false,
            chainWeapon: false
          });
        } else {
          this._styles[k] = Object.assign({}, st, {
            weapon: wd.styleWeapon,
            weaponLen: wd.styleWeapon === 'baton' ? 54 : 42,
            riotShield: false,
            shield: false,
            frostBlade: false,
            chainWeapon: false
          });
        }
      }
      st = this._styles[k];
    }
    if (e._silhouetteColor) return this.solidStyle(st, e._silhouetteColor);
    return e.ghostColor ? this.solidStyle(st, e.ghostColor) : st;
  }

  buildStyle(type) {
    const parts = type.split('#');
    const base = STYLE_DEFS[parts[0]] || STYLE_DEFS.thug;
    const vr = parts.length > 1 ? VARIANTS[parts[0]][+parts[1]] : null;
    const d = Object.assign({}, base, vr || {});
    const st = Object.assign({ metal: '#9aa5b1', patchA: '#e11d2e', patchB: '#ffd23f', under: '#e5e7eb' }, d);
    st.skinL = shadeColor(st.skin, 0.12);
    st.skinD = shadeColor(st.skin, -0.2);
    st.giD = shadeColor(st.gi, -0.33);
    st.giL = shadeColor(st.gi, 0.2);
    st.pantsD = shadeColor(st.pants, -0.3);
    st.beltD = shadeColor(st.belt, -0.3);
    st.hairD = shadeColor(st.hair || '#15171d', -0.25);
    st.hairL = shadeColor(st.hair || '#15171d', 0.24);
    if (st.coatColor) {
      st.coatD = shadeColor(st.coatColor, -0.3);
      st.coatL = shadeColor(st.coatColor, 0.16);
    }
    if (st.liningColor) st.liningD = shadeColor(st.liningColor, -0.25);
    if (st.scarfColor) st.scarfD = shadeColor(st.scarfColor, -0.28);
    if (st.vestColor) st.vestD = shadeColor(st.vestColor, -0.28);
    return st;
  }

  solidStyle(st, col) {
    const o = Object.assign({}, st);
    o._solid = col;
    [
      'skin', 'skinL', 'skinD', 'hair', 'hairL', 'hairD',
      'gi', 'giD', 'giL', 'pants', 'pantsD', 'belt', 'beltD', 'beltTrim',
      'under', 'patchA', 'patchB', 'metal', 'mask', 'bandana', 'vestColor', 'vestD',
      'coatColor', 'coatD', 'coatL', 'coatTrim', 'liningColor', 'liningD',
      'scarfColor', 'scarfD', 'wrapColor', 'shoeColor', 'leatherBeltColor',
      'tieColor', 'pocketSquare', 'cuffTrim', 'legStripe', 'gloves',
      'armorColor', 'armorTrim', 'eyeColor', 'glowingEyes', 'beardColor'
    ].forEach((k) => { if (o[k]) o[k] = col; });
    o.aura = col;
    return o;
  }

  // Helper tự động chuyển toàn bộ màu sang màu đơn sắc khi đang Flash trắng hoặc Silhouette đen
  _c(st, col) {
    return (st && st._solid) ? st._solid : col;
  }

  _edge(st, col = 'rgba(0,0,0,0.52)') {
    return (st && st._solid) ? st._solid : col;
  }

  // Hệ thống Material Shading chuyên biệt theo chất liệu (Fabric, Metal, Leather, Skin, Hair, Silk)
  _materialFill(ctx, st, mat, x0, y0, x1, y1, baseCol, far = false) {
    if (st && st._solid) return st._solid;
    const base = far ? shadeColor(baseCol, -0.22) : baseCol;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    if (mat === 'metal' || mat === 'gold' || mat === 'steel') {
      const hiAmt = mat === 'gold' ? 0.55 : 0.48;
      const shAmt = mat === 'gold' ? -0.45 : -0.42;
      g.addColorStop(0.0, shadeColor(base, hiAmt));
      g.addColorStop(0.24, base);
      g.addColorStop(0.54, shadeColor(base, shAmt));
      g.addColorStop(0.84, shadeColor(base, -0.18));
      g.addColorStop(1.0, shadeColor(base, hiAmt * 0.6));
      return g;
    }
    if (mat === 'leather') {
      g.addColorStop(0.0, shadeColor(base, 0.24));
      g.addColorStop(0.22, shadeColor(base, 0.08));
      g.addColorStop(0.62, base);
      g.addColorStop(1.0, shadeColor(base, -0.34));
      return g;
    }
    if (mat === 'silk') {
      g.addColorStop(0.0, shadeColor(base, 0.22));
      g.addColorStop(0.35, base);
      g.addColorStop(0.72, shadeColor(base, -0.24));
      g.addColorStop(1.0, shadeColor(base, -0.40));
      return g;
    }
    if (mat === 'skin') {
      g.addColorStop(0.0, shadeColor(base, 0.14));
      g.addColorStop(0.45, base);
      g.addColorStop(1.0, shadeColor(base, -0.24));
      return g;
    }
    if (mat === 'hair') {
      g.addColorStop(0.0, shadeColor(base, 0.26));
      g.addColorStop(0.38, base);
      g.addColorStop(1.0, shadeColor(base, -0.28));
      return g;
    }
    // Mặc định 'fabric': chuyển sắc mượt không bóng nhựa
    g.addColorStop(0.0, shadeColor(base, 0.16));
    g.addColorStop(0.48, base);
    g.addColorStop(1.0, shadeColor(base, -0.28));
    return g;
  }

  // Vẽ cụm nếp gấp vải có hướng (chỉ hiện ở render thường, tắt khi _solid)
  _drawFoldCluster(ctx, st, segs, col = 'rgba(0,0,0,0.34)', lw = 0.9) {
    if (st && st._solid) return;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      ctx.moveTo(s[0], s[1]);
      if (s.length >= 6) ctx.quadraticCurveTo(s[2], s[3], s[4], s[5]);
      else ctx.lineTo(s[2], s[3]);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Vẽ viền highlight cạnh sáng mềm cho mặt phẳng 2.5D
  _drawRimLight(ctx, st, pts, col = 'rgba(255,255,255,0.28)', lw = 0.95) {
    if (st && st._solid || !pts || pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
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
    const prog = AnimUtil.progress(e);
    if (st === 'walk' || st === 'run') rate = 26;
    else if (st === 'hurt' || st === 'knockdown' || st === 'getup') rate = 28;
    else if (st === 'scissor_kick' || (typeof st === 'string' && st.indexOf('ultimate_') === 0)) {
      rate = (prog > 0.78) ? 24 : 38;
    } else if (ATTACK_STATES.has(st)) {
      // Giữ độ giật bén khi tung chiêu, nhưng nới nhẹ ở giai đoạn theo đà & hồi thế
      rate = (prog > 0.72) ? 26 : 46;
    }
    const k = 1 - Math.exp(-rate * dt);

    // Tránh "xoay ngược" sau khi lộn vòng
    if (st !== 'scissor_kick' && Math.abs(cur.roll) > Math.PI) {
      cur.roll -= Math.sign(cur.roll) * Math.PI * 2;
    }
    for (const key of POSE_KEYS) cur[key] += (target[key] - cur[key]) * k;
    return cur;
  }

  // Tính toạ độ các khớp theo tỷ lệ cơ thể riêng (rig) của từng nhân vật (đơn vị chưa scale, gốc = điểm chạm đất dưới chân)
  skeleton(P, st = {}) {
    const rig = (st && st.rig) || {};
    const thighLen = rig.thighLen || 22;
    const calfLen  = rig.calfLen  || 22;
    const armU     = rig.armUpper || 17;
    const armF     = rig.armFore  || 16;
    const spineH   = rig.spineH   || 30;
    const neckLen  = rig.neckLen  || 14.5;
    const nShX     = (rig.nShX !== undefined) ? rig.nShX : 2.5;
    const nShY     = (rig.nShY !== undefined) ? rig.nShY : -2.5;
    const fShX     = (rig.fShX !== undefined) ? rig.fShX : -3.0;
    const fShY     = (rig.fShY !== undefined) ? rig.fShY : -1.5;
    const hipHalf  = (rig.hipHalf !== undefined) ? rig.hipHalf : 2.0;

    const ankleY = (T, S) => thighLen * Math.cos(T) + calfLen * Math.cos(T + S);
    const auto = Math.max(ankleY(P.nT, P.nS), ankleY(P.fT, P.fS)) + (rig.footPad || 6);
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
    const sh = [H[0] + d[0] * spineH, H[1] + d[1] * spineH];
    const nSh = [sh[0] + pp[0] * nShX + d[0] * nShY, sh[1] + pp[1] * nShX + d[1] * nShY];
    const fSh = [sh[0] + pp[0] * fShX + d[0] * fShY, sh[1] + pp[1] * fShX + d[1] * fShY];
    const ha = ang + P.head;
    const head = [sh[0] + Math.sin(ha) * neckLen, sh[1] - Math.cos(ha) * neckLen];

    const nHip = add(H, lv(0, 0)); nHip[0] += cr * hipHalf; nHip[1] += sr * hipHalf;
    const fHip = [H[0] - cr * hipHalf, H[1] - sr * hipHalf];
    const nKnee = add(nHip, lv(P.nT, thighLen)), nAnk = add(nKnee, lv(P.nT + P.nS, calfLen));
    const fKnee = add(fHip, lv(P.fT, thighLen)), fAnk = add(fKnee, lv(P.fT + P.fS, calfLen));

    const armv = (a, l) => lv(P.torso + a, l);
    const nElb = add(nSh, armv(P.nA, armU)), nHand = add(nElb, armv(P.nA + P.nE, armF));
    const fElb = add(fSh, armv(P.fA, armU)), fHand = add(fElb, armv(P.fA + P.fE, armF));

    return {
      H, ang, d, pp, sh, nSh, fSh, head, ha,
      nHip, fHip, nKnee, nAnk, fKnee, fAnk,
      nElb, nHand, fElb, fHand,
      armU, armF, thighLen, calfLen, spineH, neckLen,
      nFore: P.torso + P.nA + P.nE + r, fFore: P.torso + P.fA + P.fE + r, grip: P.grip || 0,
      nFoot: P.nF - r, fFoot: P.fF - r
    };
  }

  // ------------------------------------------------------------------ RENDER
}

window.SkeletalRendererBase = SkeletalRendererBase;
})();
