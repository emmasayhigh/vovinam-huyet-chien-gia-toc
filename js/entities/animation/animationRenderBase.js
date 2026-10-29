/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationRenderBase.js - Render nhan vat, thanh HP/stamina, hieu ung.
 */

(function () {
const { AnimUtil, STYLE_DEFS, VARIANTS, ATTACK_STATES, POSE_ALIAS, POSE_KEYS, shadeColor, hashStr } = window;

class SkeletalRendererRenderBase extends window.SkeletalRendererPose {
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
}

window.SkeletalRendererRenderBase = SkeletalRendererRenderBase;
})();
