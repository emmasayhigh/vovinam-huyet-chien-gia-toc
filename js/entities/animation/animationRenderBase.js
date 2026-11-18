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
    const jt = this.skeleton(pose, st);
    this.applyWeaponGrip(jt, st);

    const facing = e.facing || 1;
    const z = e.z || 0;
    const isSil = !!e._silhouetteColor;
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
    if (!ghost && !isSil) this.drawShadow(ctx, sx, sy, z, S);

    // Đồng minh chiến đấu: vòng hào quang bảo hộ màu xanh ngọc dưới chân
    if (!ghost && !isSil && e.isAlly && !e.isDead) {
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
    if (!ghost && !isSil && isBoss && !e.isDead) {
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
      if (window.effectManager && Array.isArray(window.effectManager.particles) && Math.random() < 0.2) {
        window.effectManager.particles.push({
          x: e.x + (Math.random() - 0.5) * 55, y: e.y + z - 10,
          vx: (Math.random() - 0.5) * 1.1, vy: -1.4 - Math.random() * 1.3,
          size: 2.5 + Math.random() * 2.5, color: st.aura, alpha: 0.85,
          life: 0.85, maxLife: 0.85, gravity: -0.01
        });
      }
    }

    // Hào quang Giáp 3 Tầng (3-Tier Armor Auras: White, Gold, Red)
    if (!ghost && !isSil && e.auraArmor && e.auraArmorTimer > 0 && !e.isDead) {
      this.drawAuraArmor(ctx, sx, sy, z, S, e, now);
    }

    // Vệt đòn (toạ độ màn hình)
    if (!ghost && !isSil) this.updateAndDrawTrail(ctx, e, jt, st, S, facing, z, camera, p);

    // Cảnh báo đòn mạnh của đối thủ
    const isWp = typeof state === 'string' && state.indexOf('wp_') === 0;
    if (!ghost && !isSil && !isPlayer && (isWp ? e._tele : (e.isAttacking && U.cham(p) > 0.3 && U.ext(p) < 0.45))) {
      this.drawTelegraph(ctx, jt, S, facing, sx, sy + z, now);
    }

    // Nháy trắng khi trúng đòn (Arcade hit flash - dùng solidStyle trực tiếp, KHÔNG dùng ctx.filter vì gây tụt FPS nghiêm trọng)
    // Nhân vật chơi: nhấp nháy trắng ↔ thường khi bất tử (đọc rõ là "đang né"), tránh bị bôi trắng cả người
    const flash = !ghost && !isSil && e.invincibleTimer > 0 && (isPlayer
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
    if (!ghost && !isSil && (charged || isBoss || inUlt)) {
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

    const stg = U.stage5 ? U.stage5(p) : { stage: 'idle', windup: 0, strike: 0, overshoot: 0, follow: 0, recover: 0 };
    const shout = (ATTACK_STATES.has(state) && (U.ext(p) > 0.2 || stg.stage === 'impact')) || state === 'hurt' || inUlt || state === 'victory';
    const angry = e.type !== 'player' || ATTACK_STATES.has(state);
    const beltSway = this.beltSway(e, now, facing);

    // Chuyển động thứ cấp (Secondary Motion Inertia) cho tà áo, áo choàng, khăn quàng & tay áo rộng
    const rawVx = (e.vx || 0) * facing;
    const prevVx = e._prevRelVx !== undefined ? e._prevRelVx : rawVx;
    e._prevRelVx = rawVx;
    const accelImpulse = (rawVx - prevVx) * 0.045;
    let stageImpulse = 0;
    if (ATTACK_STATES.has(state) || inUlt || state === 'dodge') {
      if (stg.stage === 'anticipation') stageImpulse = stg.windup * 6.5;
      else if (stg.stage === 'cast') stageImpulse = -stg.strike * 14.5;
      else if (stg.stage === 'impact') stageImpulse = -16.0 - stg.overshoot * 10;
      else if (stg.stage === 'follow_through') stageImpulse = -12 * (1 - stg.follow * 0.55);
      else stageImpulse = -4 * (1 - stg.recover);
    }
    const targetWhip = Math.max(-18, Math.min(18, stageImpulse - accelImpulse));
    e._clothWhip = (e._clothWhip === undefined) ? targetWhip : e._clothWhip + (targetWhip - e._clothWhip) * 0.24;

    const motion = {
      sway: beltSway,
      whip: e._clothWhip,
      inertiaX: e._clothWhip,
      stage: stg.stage,
      stageWeight: stg,
      vx: rawVx,
      vy: e.vy || 0,
      now,
      state,
      p,
      animTime: e.animTime || 0,
      isRunning: state === 'run' || Math.abs(e.vx || 0) > 150,
      isAttacking: ATTACK_STATES.has(state) || inUlt
    };

    // Thứ tự vẽ phân tầng 2.5D: Bóng Cá Sấu 5 Chân & Thuyền sau -> Tầng áo choàng/nón sau lưng -> chân/tay xa -> chân gần -> thân & đai -> đầu & tóc -> tay gần & vũ khí -> Mạn thuyền trước & Mái chèo
    const isNamCheoUlt = !ghost && !isSil && state === 'ultimate_rush' && (
      e.equippedSkin === 'namcheo' ||
      (window.CharacterRegistry && typeof window.CharacterRegistry.getEquippedSkin === 'function' && window.CharacterRegistry.getEquippedSkin(e) === 'namcheo')
    );
    if (isNamCheoUlt && typeof this.drawFiveLeggedCrocodilePhantom === 'function') {
      this.drawFiveLeggedCrocodilePhantom(ctx, jt, st, p, now);
    }
    if (isNamCheoUlt && typeof this.drawNamCheoBoat === 'function') {
      this.drawNamCheoBoat(ctx, jt, st, p, now, 'back');
    }
    const shieldInFront = st.shield && (state === 'guard' || state === 'boss_bash' || state === 'elbow_strike' || (state === 'ultimate_bash' && p < 0.58));
    if (typeof this.drawBackLayers === 'function') this.drawBackLayers(ctx, jt, st, motion);
    this.drawLeg(ctx, jt.fHip, jt.fKnee, jt.fAnk, jt.fFoot, st, true);
    this.drawArm(ctx, jt.fSh, jt.fElb, jt.fHand, jt.fFore, st, true, true, motion);
    this.drawLeg(ctx, jt.nHip, jt.nKnee, jt.nAnk, jt.nFoot, st, false);
    this.drawTorso(ctx, jt, st, motion);
    this.drawBelt(ctx, jt, st, beltSway, motion);
    if (typeof this.drawHipSkirtAndTassets === 'function') this.drawHipSkirtAndTassets(ctx, jt, st, motion);
    if (st.shield && !shieldInFront) {
      this.drawTigerShield(ctx, jt.fElb, jt.fHand, jt.fFore, st, false);
    }
    this.drawNeckAndHead(ctx, jt, st, { shout, angry, sway: beltSway, motion });
    if (st.shield && shieldInFront) {
      this.drawTigerShield(ctx, jt.fElb, jt.fHand, jt.fFore, st, true);
    }
    this.drawArm(ctx, jt.nSh, jt.nElb, jt.nHand, jt.nFore, st, false, false, motion);
    if (typeof this.drawFrontShoulderOverlay === 'function') this.drawFrontShoulderOverlay(ctx, jt, st, motion);
    if (st.riotShield) this.drawRiotShield(ctx, jt, st);
    if (st.chainWeapon) this.drawChainWeapon(ctx, jt.nHand, jt.nFore, st, e);
    if (st.medicCross) this.drawMedicCross(ctx, jt, st, e);
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
    else if (st.weapon === 'coin_sword') this.drawWeapon(ctx, jt.nHand, jt.nFore, st, st.weaponLen || 44, jt.grip || 0);
    if (st.cigar && (state === 'ultimate_barrage' || state === 'counter_hand_strike' || state === 'boss_bash' || state === 'air_punch' || (state === 'punch_hook' && p > 0.28 && p < 0.75))) {
      this.drawPistol(ctx, jt.nHand, jt.nFore, now, state === 'ultimate_barrage' || state === 'boss_bash' || state === 'counter_hand_strike', st);
    }
    if (isNamCheoUlt && typeof this.drawNamCheoBoat === 'function') {
      this.drawNamCheoBoat(ctx, jt, st, p, now, 'front');
    }

    ctx.restore();

    // Tia trị liệu Quân Y -> đồng đội đang được chữa
    if (!ghost && !isSil && e.state === 'channel_heal' && e.healTarget && !e.healTarget.isDead && typeof this.drawHealBeam === 'function') {
      const t = e.healTarget;
      this.drawHealBeam(ctx, sx, sy + z - 60 * S / 1.3, Math.round(t.x - camera.x), Math.round(t.y - camera.y) + (t.z || 0) - 60 * S / 1.3, now);
    }

    // Thanh thể lực & hồi chiêu đá trên đầu người chơi (ẩn khi đầy)
    const showKickBar = isPlayer && typeof e.kickCooldown === 'number' && e.kickCooldown > 0;
    const showStamBar = isPlayer && typeof e.stamina === 'number' && e.stamina < e.maxStamina - 0.5;
    if (!ghost && !isSil && isPlayer && (showStamBar || showKickBar) && !e.isDead) {
      this.drawStaminaBar(ctx, sx, sy + z - 128 * S / 1.3 - 16, e, now);
    }

    // Thanh Độ Bền Khiên (Guard Gauge / Block Limit)
    const showGuardBar = isPlayer && (e.state === 'guard' || e.state === 'guard_break' || (typeof e.guardGauge === 'number' && e.guardGauge < (e.maxGuardGauge || 100) - 0.5));
    if (!ghost && !isSil && isPlayer && showGuardBar && !e.isDead) {
      const offsetAbove = (showStamBar || showKickBar) ? -36 : -18;
      this.drawGuardGaugeBar(ctx, sx, sy + z - 128 * S / 1.3 + offsetAbove, e, now);
    }

    const entityDebuffs = (!ghost && !isSil && !e.isDead && !isPlayer && window.CharacterRegistry && typeof window.CharacterRegistry.getEntityDebuffs === 'function')
      ? window.CharacterRegistry.getEntityDebuffs(e)
      : [];

    // Thanh Máu & Nhãn Hiệu Ứng Bất Lợi ngay DƯỚI thanh máu của kẻ bị dính (Địch / Tinh anh / Boss)
    if (!ghost && !isSil && !isPlayer && !e.isDead && typeof e.hp === 'number' && typeof e.maxHp === 'number' && (e.hp < e.maxHp || entityDebuffs.length > 0)) {
      const hpBarY = sy + z - (isBoss ? 156 : 148) * S / 1.3;
      const hpBarH = isBoss ? 7 : ((e.armorAll || (e.maxHp >= 240)) ? 6 : 5);
      this.drawEnemyHpBar(ctx, sx, hpBarY, e);
      if (entityDebuffs.length > 0) {
        this.drawEntityDebuffs(ctx, sx, hpBarY + hpBarH + 4, e, entityDebuffs);
      }
    }
  }

  drawEntityDebuffs(ctx, x, y, e, debuffs) {
    if (!Array.isArray(debuffs) || debuffs.length === 0) return;
    const items = debuffs.slice(0, 4);
    const pillH = 14;
    const gap = 3;
    ctx.save();
    ctx.font = '800 9px "Montserrat", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const measured = items.map((d) => {
      const label = `${d.icon} ${d.shortText}`;
      const tw = (typeof ctx.measureText === 'function') ? ctx.measureText(label).width : (label.length * 5.2);
      const pw = Math.max(30, Math.round(tw + 10));
      return { d, label, pw };
    });
    const totalW = measured.reduce((acc, m) => acc + m.pw, 0) + gap * (measured.length - 1);
    let curX = Math.round(x - totalW / 2);
    const py = Math.round(y);

    for (const m of measured) {
      ctx.fillStyle = 'rgba(9, 13, 24, 0.88)';
      ctx.fillRect(curX, py, m.pw, pillH);
      ctx.fillStyle = m.d.bg || 'rgba(225, 29, 72, 0.25)';
      ctx.fillRect(curX, py, m.pw, pillH);
      ctx.strokeStyle = m.d.color || '#fb7185';
      ctx.lineWidth = 1;
      ctx.strokeRect(curX, py, m.pw, pillH);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(m.label, curX + m.pw / 2, py + pillH / 2 + 0.5);
      curX += m.pw + gap;
    }
    ctx.restore();
  }

  drawEnemyHpBar(ctx, x, y, e) {
    const isBoss = !!(e.isBoss || (typeof e.type === 'string' && e.type.startsWith('boss_')));
    const isElite = e.armorAll || (e.maxHp >= 240);
    const w = isBoss ? 68 : (isElite ? 54 : 46);
    const h = isBoss ? 7 : (isElite ? 6 : 5);
    const pct = Math.max(0, Math.min(1, e.hp / (e.maxHp || 1)));
    ctx.save();
    ctx.translate(Math.round(x - w / 2), Math.round(y));
    ctx.fillStyle = 'rgba(8, 12, 22, 0.85)';
    ctx.fillRect(-1.5, -1.5, w + 3, h + 3);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = isBoss ? '#f43f5e' : (isElite ? '#f59e0b' : '#ef4444');
    ctx.fillRect(0, 0, w * pct, h);
    if (e.armorTimer > 0 || e.riotShield) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-1.5, -1.5, w + 3, h + 3);
    }
    ctx.restore();
  }

  // ==========================================================================
  // HỆ THỐNG HIỂN THỊ 3 TẦNG HÀO QUANG GIÁP (3-TIER ARMOR AURA RENDERING)
  // 1. WHITE: Hào Quang Trắng (Bất Tử Hoàn Toàn 0 DMG, Miễn Khống Chế)
  // 2. GOLD:  Hào Quang Vàng (Kim Cang Bất Khuất, Kháng Choáng/Ngã, Giảm 35% DMG, Bất Khả Phá)
  // 3. RED:   Hào Quang Đỏ  (Bá Thể Cương Kình, Kháng Choáng/Ngã, Có Thể Bị Phá)
  // ==========================================================================
  drawAuraArmor(ctx, sx, sy, z, S, e, now) {
    if (!e.auraArmor || e.auraArmorTimer <= 0 || e.isDead) return;
    const type = e.auraArmor;
    const pulse = 0.6 + 0.4 * Math.sin(now * 0.008);
    const pulseFast = 0.5 + 0.5 * Math.sin(now * 0.016);
    const bodyY = sy + z - 58 * S / 1.3;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (type === 'white') {
      // 1. Vòng bát quái / pháp trận bạc trắng dưới chân
      ctx.save();
      ctx.translate(sx, sy + 2);
      ctx.scale(1, 0.32);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 + 0.25 * pulse})`;
      ctx.lineWidth = 3.6;
      ctx.beginPath(); ctx.arc(0, 0, 58 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.55 + 0.35 * pulseFast})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath(); ctx.arc(0, 0, 42 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.16 * pulse})`;
      ctx.fill();
      ctx.restore();

      // 2. Quả cầu Bất Hoại bảo hộ bao bọc toàn thân
      ctx.save();
      ctx.translate(sx, bodyY);
      const grad = ctx.createRadialGradient(0, 0, 15, 0, 0, 52 * S / 1.3);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      grad.addColorStop(0.7, `rgba(224, 242, 254, ${0.24 + 0.12 * pulse})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${0.70 + 0.25 * pulseFast})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, (48 + 4 * pulseFast) * S / 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 + 0.15 * pulse})`;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();

    } else if (type === 'gold') {
      // 1. Trận đồ Kim Cang hoàng kim dưới chân
      ctx.save();
      ctx.translate(sx, sy + 2);
      ctx.scale(1, 0.32);
      ctx.strokeStyle = `rgba(250, 204, 21, ${0.8 + 0.2 * pulse})`;
      ctx.lineWidth = 3.8;
      ctx.beginPath(); ctx.arc(0, 0, 60 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(now * 0.002);
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 44 * S / 1.3, Math.sin(a) * 44 * S / 1.3);
        ctx.lineTo(Math.cos(a) * 60 * S / 1.3, Math.sin(a) * 60 * S / 1.3);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(250, 204, 21, ${0.18 * pulse})`;
      ctx.fill();
      ctx.restore();

      // 2. Hào quang Kim Cang hộ thể hình ngọn lửa vàng
      ctx.save();
      ctx.translate(sx, bodyY);
      const gradG = ctx.createRadialGradient(0, 0, 18, 0, 0, 50 * S / 1.3);
      gradG.addColorStop(0, 'rgba(250, 204, 21, 0.05)');
      gradG.addColorStop(0.75, `rgba(245, 158, 11, ${0.22 + 0.10 * pulse})`);
      gradG.addColorStop(1, `rgba(254, 240, 138, ${0.65 + 0.25 * pulse})`);
      ctx.fillStyle = gradG;
      ctx.beginPath();
      ctx.ellipse(0, 0, (38 + 3 * pulse) * S / 1.3, (52 + 4 * pulse) * S / 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(253, 224, 71, ${0.8 + 0.2 * pulse})`;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();

    } else if (type === 'red') {
      // 1. Vòng lửa huyết sắc xoáy dưới chân
      ctx.save();
      ctx.translate(sx, sy + 2);
      ctx.scale(1, 0.32);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.85 + 0.15 * pulse})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(0, 0, 56 * S / 1.3, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(-now * 0.003);
      ctx.strokeStyle = 'rgba(252, 165, 165, 0.65)';
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 38 * S / 1.3, Math.sin(a) * 38 * S / 1.3);
        ctx.lineTo(Math.cos(a) * 56 * S / 1.3, Math.sin(a) * 56 * S / 1.3);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(239, 68, 68, ${0.16 * pulse})`;
      ctx.fill();
      ctx.restore();

      // 2. Vỏ bọc Bá Thể Đỏ rực lửa
      ctx.save();
      ctx.translate(sx, bodyY);
      const gradR = ctx.createRadialGradient(0, 0, 15, 0, 0, 48 * S / 1.3);
      gradR.addColorStop(0, 'rgba(239, 68, 68, 0.06)');
      gradR.addColorStop(0.7, `rgba(220, 38, 38, ${0.24 + 0.12 * pulse})`);
      gradR.addColorStop(1, `rgba(248, 113, 113, ${0.60 + 0.25 * pulse})`);
      ctx.fillStyle = gradR;
      ctx.beginPath();
      ctx.ellipse(0, 0, (36 + 3 * pulseFast) * S / 1.3, (50 + 4 * pulseFast) * S / 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(248, 113, 113, ${0.85 + 0.15 * pulse})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Hạt tàn năng lượng bay lên theo loại hào quang
    if (window.effectManager && Math.random() < 0.24) {
      const col = type === 'white' ? '#ffffff' : (type === 'gold' ? '#ffd700' : '#ef4444');
      window.effectManager.particles.push({
        x: e.x + (Math.random() - 0.5) * 44,
        y: e.y + z - 10 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -1.6 - Math.random() * 1.5,
        size: 2.2 + Math.random() * 2.5,
        color: col,
        alpha: 0.85,
        life: 0.7,
        maxLife: 0.7,
        gravity: -0.015
      });
    }
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
  _drawRibbonPoints(ctx, tr, camera, auraCol, coreCol, baseWidth) {
    if (!tr || tr.length < 2) return;
    const pts = tr.map(pt => [pt[0] - camera.x, pt[1] - camera.y]);
    for (let i = 1; i < pts.length; i++) {
      const a = i / pts.length;
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const midX = (p0[0] + p1[0]) * 0.5;
      const midY = (p0[1] + p1[1]) * 0.5;

      ctx.strokeStyle = this.rgba(auraCol, a * 0.78);
      ctx.lineWidth = 2.6 + a * (baseWidth || 11);
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

      if (i >= pts.length - 4) {
        ctx.strokeStyle = this.rgba(coreCol || '#ffffff', a * 0.92);
        ctx.lineWidth = 1.2 + a * Math.max(3.6, (baseWidth || 11) * 0.42);
        ctx.stroke();
      }
    }
  }

  updateAndDrawTrail(ctx, e, jt, st, S, facing, z, camera, p) {
    const state = e.state;
    const U = AnimUtil;
    if (!e._trail) e._trail = [];
    if (!e._trail2) e._trail2 = [];
    if (e._disableVfx || window._disableSkillVfx) {
      e._trail.length = 0;
      e._trail2.length = 0;
      return;
    }
    const toWorld = (pt) => [e.x + facing * S * pt[0], e.y + z + S * pt[1]];

    const prof = (window.CharacterRegistry && typeof window.CharacterRegistry.getTrailProfile === 'function')
      ? window.CharacterRegistry.getTrailProfile(e, st)
      : { primary: st.aura || '#00f0ff', core: '#ffffff', width: 11, dual: false };

    let tip = null;
    let tip2 = null;
    const isWpState = typeof state === 'string' && state.indexOf('wp_') === 0;
    const isUlt = typeof state === 'string' && state.indexOf('ultimate_') === 0;
    const active = isWpState ? !!e._wpActive
      : (ATTACK_STATES.has(state) && (
        state === 'flying_kick' || state === 'scissor_kick' || isUlt ||
        state === 'counter_hand_strike' || state === 'counter_leg_strike' ||
        U.ext(p) > 0.08 || U.cham(p) > 0.45
      ));

    if (active) {
      if (isWpState) {
        const len = st.weapon ? (st.weaponLen || 38) + 3 : 8;
        const wa = this.weaponAngle(st, jt.nFore) + (jt.grip || 0);
        tip = [jt.nHand[0] + Math.sin(wa) * len, jt.nHand[1] + Math.cos(wa) * len];
      } else if (
        state === 'punch_straight' || state === 'punch_hook' || state === 'boss_stab' ||
        state === 'boss_riposte' || state === 'boss_upper' || state === 'boss_heavy1' ||
        state === 'boss_thrust' || state === 'boss_throw' || state === 'boss_swing' ||
        state === 'boss_slam' || state === 'boss_bash' || state === 'uppercut' ||
        state === 'elbow_strike' || state === 'hook_run' || state === 'air_punch' ||
        state === 'counter_hand_strike' || state === 'ultimate_bash' || state === 'ultimate_slam' ||
        state === 'ultimate_barrage' || state === 'ultimate_precision' || state === 'ultimate_command' ||
        state === 'ultimate_feint' || state.startsWith('boss_chain')
      ) {
        tip = jt.nHand;
        if (st.weapon === 'twin_daggers' || state === 'ultimate_feint' || state === 'ultimate_barrage') {
          tip2 = jt.fHand;
        }
      } else if (state === 'ultimate_flurry') {
        tip = (Math.floor((e.animTime || 0) * 14) % 2) ? jt.fHand : jt.nHand;
        tip2 = jt.nAnk;
      } else if (state === 'scissor_kick' || state === 'ultimate_rush' || state === 'ultimate_blink') {
        tip = jt.nAnk;
        tip2 = jt.fAnk;
      } else {
        tip = jt.nAnk;
      }

      // Đòn dùng vũ khí: đưa vệt sáng tới đầu mũi vũ khí / gậy rồng / búa / cuốc / Hàn Băng Kiếm
      const applyWeaponTip = (handPt, foreAng) => {
        if (st.weapon === 'twin_daggers') {
          const wa = this.weaponAngle(st, foreAng) + (jt.grip || 0);
          return [handPt[0] + Math.sin(wa) * 24, handPt[1] + Math.cos(wa) * 24];
        }
        if (st.weapon) {
          const wl = st.weapon === 'hoe' ? 68 : (st.weaponLen || (st.weapon === 'knife' ? 20 : 38)) + 15;
          const wa = this.weaponAngle(st, foreAng) + (jt.grip || 0);
          return [handPt[0] + Math.sin(wa) * wl, handPt[1] + Math.cos(wa) * wl];
        }
        if (st.cane) {
          const dirC = [Math.sin(foreAng), Math.cos(foreAng)];
          return [handPt[0] + dirC[0] * 46, handPt[1] + dirC[1] * 46];
        }
        return handPt;
      };
      if (tip === jt.nHand) tip = applyWeaponTip(jt.nHand, jt.nFore);
      if (tip2 === jt.fHand) tip2 = applyWeaponTip(jt.fHand, jt.fFore);
    }

    if (tip) { e._trail.push(toWorld(tip)); if (e._trail.length > 10) e._trail.shift(); }
    else if (e._trail.length) e._trail.shift();

    if (tip2) { e._trail2.push(toWorld(tip2)); if (e._trail2.length > 9) e._trail2.shift(); }
    else if (e._trail2.length) e._trail2.shift();

    if (e._trail.length < 2 && e._trail2.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const auraCol = prof.primary || st.aura || '#00f0ff';
    const coreCol = prof.core || '#ffffff';
    const baseW = prof.width || 11;
    this._drawRibbonPoints(ctx, e._trail, camera, auraCol, coreCol, baseW);
    if (e._trail2.length >= 2) {
      this._drawRibbonPoints(ctx, e._trail2, camera, prof.secondary || auraCol, coreCol, Math.max(7, baseW * 0.78));
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

  // Khối chi cơ bắp uốn lượn tự nhiên (thay vì ống trụ thẳng kiểu mannequin)
  muscleCapsule(ctx, a, b, w0, w1, col, bulgeAmt = 0, tMid = 0.38, bias = 0.3) {
    if (!bulgeAmt) { this.capsule(ctx, a, b, w0, w1, col); return; }
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    const mx = a[0] + dx * tMid, my = a[1] + dy * tMid;
    const wm = w0 + (w1 - w0) * tMid;
    const swPos = wm / 2 + bulgeAmt * (1 + bias);
    const swNeg = wm / 2 + bulgeAmt * (1 - bias);

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * w0 / 2, a[1] + ny * w0 / 2);
    ctx.quadraticCurveTo(mx + nx * swPos, my + ny * swPos, b[0] + nx * w1 / 2, b[1] + ny * w1 / 2);
    ctx.lineTo(b[0] - nx * w1 / 2, b[1] - ny * w1 / 2);
    ctx.quadraticCurveTo(mx - nx * swNeg, my - ny * swNeg, a[0] - nx * w0 / 2, a[1] - ny * w0 / 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.arc(a[0], a[1], w0 / 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b[0], b[1], w1 / 2, 0, Math.PI * 2); ctx.fill();
  }

  muscleLimb(ctx, a, b, w0, w1, col, edge, hi, st, bulgeAmt = 1.6, tMid = 0.36, bias = 0.25) {
    if (st && st._solid) {
      this.muscleCapsule(ctx, a, b, w0 + 1.45, w1 + 1.45, st._solid, bulgeAmt, tMid, bias);
      return;
    }
    this.muscleCapsule(ctx, a, b, w0 + 1.45, w1 + 1.45, edge, bulgeAmt, tMid, bias);
    this.muscleCapsule(ctx, a, b, w0, w1, col, bulgeAmt, tMid, bias);
    if (hi) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l, ny = dx / l;
      const o = -Math.min(w0, w1) * 0.25;
      this.capsule(ctx, [a[0] + nx * o, a[1] + ny * o], [b[0] + nx * o, b[1] + ny * o], w0 * 0.27, w1 * 0.25, hi);
      const ro = -Math.min(w0, w1) * 0.41;
      this.capsule(ctx, [a[0] + nx * ro, a[1] + ny * ro], [b[0] + nx * ro, b[1] + ny * ro], w0 * 0.11, w1 * 0.10, 'rgba(224,242,254,0.22)');
    }
  }

  limb(ctx, a, b, w0, w1, col, edge, hi, st) {
    if (st && st._solid) {
      this.capsule(ctx, a, b, w0 + 1.45, w1 + 1.45, st._solid);
      return;
    }
    this.capsule(ctx, a, b, w0 + 1.45, w1 + 1.45, edge);
    this.capsule(ctx, a, b, w0, w1, col);
    if (hi) {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l, ny = dx / l;
      const o = -Math.min(w0, w1) * 0.24;
      this.capsule(ctx, [a[0] + nx * o, a[1] + ny * o], [b[0] + nx * o, b[1] + ny * o], w0 * 0.28, w1 * 0.28, hi);
      const ro = -Math.min(w0, w1) * 0.40;
      this.capsule(ctx, [a[0] + nx * ro, a[1] + ny * ro], [b[0] + nx * ro, b[1] + ny * ro], w0 * 0.11, w1 * 0.11, 'rgba(224,242,254,0.20)');
    }
  }

  drawLeg(ctx, hip, knee, ank, footA, st, far) {
    const rig = (st && st.rig) || {};
    const bulk = rig.limbBulk || 1.0;
    const isSolid = !!(st && st._solid);
    const col = this._c(st, far ? st.pantsD : st.pants);
    const edge = this._edge(st, 'rgba(0,0,0,0.56)');
    const hi = (far || isSolid) ? null : 'rgba(255,255,255,0.16)';
    const arch = st.archetype || '';
    const isBaggy = !!(st.baggyPants || arch === 'vovinam_master' || arch === 'street_brawler_gi' || arch === 'mountain_guardian' || arch === 'shinobi_assassin');

    // Khối đùi & bắp chân có khối lượng quần vải/giáp thật theo archetype (không còn ống trụ mỏng manh)
    const thW0 = (isBaggy ? 14.4 : (st.armor ? 14.0 : (st.suit ? 12.2 : 11.8))) * bulk;
    const thW1 = (isBaggy ? 12.0 : (st.armor ? 11.8 : (st.suit ? 9.6 : 9.4))) * bulk;
    const cfW0 = (isBaggy ? 12.2 : (st.armor ? 12.0 : (st.suit ? 10.0 : 9.6))) * bulk;
    const cfW1 = (isBaggy ? 7.6 : (st.armor ? 8.4 : (st.suit ? 7.0 : 6.6))) * bulk;

    const thighFill = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', hip[0] - 8, hip[1], knee[0] + 8, knee[1], st.pants, far);
    const calfFill = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', knee[0] - 7, knee[1], ank[0] + 7, ank[1], st.pants, far);

    this.muscleLimb(ctx, hip, knee, thW0, thW1, thighFill, edge, hi, st, (isBaggy ? 2.85 : 1.95) * bulk, 0.38, 0.28);
    this.muscleLimb(ctx, knee, ank, cfW0, cfW1, calfFill, edge, hi, st, (isBaggy ? 2.35 : 1.80) * bulk, 0.30, -0.32);

    // Nếp gấp vải tự nhiên quanh đầu gối & đường ly quần âu sang trọng
    if (!isSolid) {
      if (st.suit && !far) {
        const crA = [hip[0] + (knee[0] - hip[0]) * 0.14 + 1.1, hip[1] + (knee[1] - hip[1]) * 0.14];
        const crB = [ank[0] + 0.8, ank[1] - 2.0];
        this._drawFoldCluster(ctx, st, [
          [crA[0], crA[1], knee[0] + 1.0, knee[1], crB[0], crB[1]]
        ], 'rgba(255,255,255,0.16)', 0.9);
      } else if (isBaggy) {
        const kFold = [knee[0] + (hip[0] - knee[0]) * 0.14, knee[1] + (hip[1] - knee[1]) * 0.14];
        this._drawFoldCluster(ctx, st, [
          [kFold[0] - 3.6 * bulk, kFold[1] - 1.2, knee[0], knee[1] + 0.6, knee[0] + 3.2 * bulk, knee[1] - 0.8],
          [knee[0] - 3.0 * bulk, knee[1] + 2.2, knee[0] + 0.4, knee[1] + 3.8, knee[0] + 2.6 * bulk, knee[1] + 2.6]
        ], far ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.32)', 0.95);
      }
    }

    // Sọc vàng dọc ống quần & họa tiết Rồng Vàng sắc nét trên đùi (Ngô Nhất Nghị & Võ Phục Vovinam)
    if (!isSolid && !far && st.legStripe) {
      const sA = [hip[0] + (knee[0] - hip[0]) * 0.12 - 1.0, hip[1] + (knee[1] - hip[1]) * 0.12];
      const sB = [ank[0] - (ank[0] - knee[0]) * 0.08 - 0.8, ank[1] - (ank[1] - knee[1]) * 0.08];
      ctx.strokeStyle = st.legStripe;
      ctx.lineWidth = 1.65;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sA[0], sA[1]); ctx.lineTo(knee[0] - 1.0, knee[1]); ctx.lineTo(sB[0], sB[1]); ctx.stroke();
    }
    if (!isSolid && !far && st.thighDragon) {
      const mx = hip[0] + (knee[0] - hip[0]) * 0.50;
      const my = hip[1] + (knee[1] - hip[1]) * 0.50;
      const angT = Math.atan2(knee[1] - hip[1], knee[0] - hip[0]);
      ctx.save();
      ctx.translate(mx + 0.8, my);
      ctx.rotate(angT);
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5.2, -1.6);
      ctx.bezierCurveTo(-1.8, -4.8, 1.8, 3.8, 5.2, -0.4);
      ctx.moveTo(-2.2, 2.2); ctx.lineTo(0.8, 4.0);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath(); ctx.arc(5.4, -0.5, 1.45, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Bảo hộ / Xà cạp / Ủng cao cổ ôm cẳng chân đa tầng vật liệu (từ 20%-96% bắp chân)
    const shinA = [knee[0] + (ank[0] - knee[0]) * 0.20, knee[1] + (ank[1] - knee[1]) * 0.20];
    const shinB = [knee[0] + (ank[0] - knee[0]) * 0.96, knee[1] + (ank[1] - knee[1]) * 0.96];
    const shoe = st.shoes || (st.suit ? 'dress' : 'kungfu');

    if (shoe === 'cyber_boots') {
      // Ủng chiến đấu Cyber bọc ống đồng có tấm giáp gối & chỉ thép (Phó Tiến Đăng)
      const gFill = isSolid ? st._solid : this._materialFill(ctx, st, 'metal', shinA[0] - 6, shinA[1], shinB[0] + 6, shinB[1], '#334155', far);
      this.limb(ctx, shinA, shinB, cfW0 * 1.06, cfW1 * 1.12, gFill, edge, far ? null : 'rgba(186,230,253,0.28)', st);
      if (!isSolid) {
        const kPad = [knee[0] + (ank[0] - knee[0]) * 0.16, knee[1] + (ank[1] - knee[1]) * 0.16];
        ctx.fillStyle = this._materialFill(ctx, st, 'metal', kPad[0] - 5, kPad[1] - 4, kPad[0] + 5, kPad[1] + 4, '#475569', far);
        ctx.beginPath();
        ctx.moveTo(kPad[0] - 4.2 * bulk, kPad[1] - 2.6);
        ctx.lineTo(kPad[0] + 3.2 * bulk, kPad[1] - 3.6);
        ctx.lineTo(kPad[0] + 5.2 * bulk, kPad[1]);
        ctx.lineTo(kPad[0] + 2.8 * bulk, kPad[1] + 3.6);
        ctx.lineTo(kPad[0] - 4.0 * bulk, kPad[1] + 2.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.95; ctx.stroke();
        // Khớp chia tầng giáp ống đồng & dải phản quang bạc
        const midS = [shinA[0] + (shinB[0] - shinA[0]) * 0.45, shinA[1] + (shinB[1] - shinA[1]) * 0.45];
        this._drawFoldCluster(ctx, st, [
          [shinA[0] - 3.8 * bulk, shinA[1], shinA[0] + 4.4 * bulk, shinA[1] + 1.0],
          [midS[0] - 3.4 * bulk, midS[1], midS[0] + 3.8 * bulk, midS[1] + 0.8]
        ], far ? '#475569' : '#94a3b8', 1.0);
      }
    } else if (shoe === 'brawler_boots') {
      // Quần bo gấu đen phồng + Băng quấn cẳng chân xanh lục + Ủng cổ cao (Đình Bích Lâm)
      const cuffTop = [knee[0] + (ank[0] - knee[0]) * 0.30, knee[1] + (ank[1] - knee[1]) * 0.30];
      const cuffBot = [knee[0] + (ank[0] - knee[0]) * 0.46, knee[1] + (ank[1] - knee[1]) * 0.46];
      const cuffEnd = [knee[0] + (ank[0] - knee[0]) * 0.72, knee[1] + (ank[1] - knee[1]) * 0.72];
      // Quần rủ phồng nhẹ trên viền bo đen rồi thắt lại
      this.limb(ctx, cuffTop, cuffBot, cfW0 * 1.12, cfW0 * 0.98, this._c(st, '#0f172a'), edge, null, st);
      // Dải quấn ống chân xanh lục có sọc chéo rõ ràng
      this.limb(ctx, cuffBot, cuffEnd, cfW0 * 0.88, cfW1 * 1.02, this._c(st, far ? '#14532d' : '#16a34a'), edge, null, st);
      if (!isSolid) {
        this._drawFoldCluster(ctx, st, [
          [cuffBot[0] - 3.2 * bulk, cuffBot[1] + 1.5, cuffBot[0] + 3.6 * bulk, cuffBot[1] + 3.8],
          [cuffEnd[0] - 3.0 * bulk, cuffEnd[1] - 2.2, cuffEnd[0] + 3.2 * bulk, cuffEnd[1] - 0.2]
        ], '#052e16', 1.1);
      }
      // Cổ ủng chiến đấu da tối cao tới giữa cẳng chân
      this.limb(ctx, cuffEnd, shinB, cfW1 * 1.16, cfW1 * 1.14, this._c(st, far ? '#091f14' : '#143322'), edge, far ? null : 'rgba(255,255,255,0.14)', st);
    } else if (shoe === 'general_greaves') {
      // Hộ thối giáp đồng vàng chạm nổi & thép đỏ (Triệu Đình An)
      const gRim = isSolid ? st._solid : this._materialFill(ctx, st, 'gold', shinA[0] - 6, shinA[1], shinB[0] + 6, shinB[1], '#d97706', far);
      this.limb(ctx, shinA, shinB, cfW0 * 1.16, cfW1 * 1.16, gRim, edge, null, st);
      if (!isSolid) {
        const gCore = this._materialFill(ctx, st, 'metal', shinA[0] - 4, shinA[1], shinB[0] + 4, shinB[1], far ? '#450a0a' : '#881337', far);
        this.capsule(ctx, shinA, shinB, cfW0 * 0.78, cfW1 * 0.78, gCore);
        // Sống gờ vàng giữa ống đồng & đai giáp gối
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(shinA[0] + 0.6, shinA[1]); ctx.lineTo(shinB[0] + 0.6, shinB[1]); ctx.stroke();
        ctx.fillStyle = this._materialFill(ctx, st, 'gold', shinA[0] - 5, shinA[1] - 4, shinA[0] + 5, shinA[1] + 4, '#f59e0b', far);
        ctx.beginPath(); ctx.ellipse(shinA[0] + 0.8, shinA[1] - 1.0, 5.2 * bulk, 3.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#451a03'; ctx.lineWidth = 0.85; ctx.stroke();
      }
    } else if (shoe === 'shin_wraps') {
      // Xà cạp quấn bắp chân sơn cước chồng dải (Phó Đặng Hoàng Anh)
      const wrFill = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', shinA[0] - 6, shinA[1], shinB[0] + 6, shinB[1], '#7c5836', far);
      this.limb(ctx, shinA, shinB, cfW0 * 1.02, cfW1 * 1.05, wrFill, edge, null, st);
      if (!isSolid) {
        const wBands = [];
        for (let i = 1; i <= 4; i++) {
          const t = i / 5;
          const p = [shinA[0] + (shinB[0] - shinA[0]) * t, shinA[1] + (shinB[1] - shinA[1]) * t];
          wBands.push([p[0] - 4.4 * bulk, p[1] - 1.6, p[0] + 4.4 * bulk, p[1] + 1.4]);
        }
        this._drawFoldCluster(ctx, st, wBands, '#3b2616', 1.25);
        this._drawRimLight(ctx, st, [[shinA[0] + 2.2 * bulk, shinA[1]], [shinB[0] + 1.8 * bulk, shinB[1]]], 'rgba(253,230,138,0.22)', 0.9);
      }
    } else if (shoe === 'tabi_guards') {
      // Hộ ống chân Nhẫn giả bọc thép xám đen & dây đai quấn (Phó Dung Hải)
      const tFill = isSolid ? st._solid : this._materialFill(ctx, st, 'leather', shinA[0] - 5, shinA[1], shinB[0] + 5, shinB[1], '#27272a', far);
      this.limb(ctx, shinA, shinB, cfW0 * 1.00, cfW1 * 1.04, tFill, edge, far ? null : 'rgba(148,163,184,0.24)', st);
      if (!isSolid) {
        const mS = [shinA[0] + (shinB[0] - shinA[0]) * 0.45, shinA[1] + (shinB[1] - shinA[1]) * 0.45];
        this._drawFoldCluster(ctx, st, [
          [shinA[0] - 3.6 * bulk, shinA[1] + 1, shinA[0] + 3.8 * bulk, shinA[1] + 1],
          [mS[0] - 3.2 * bulk, mS[1], mS[0] + 3.4 * bulk, mS[1]]
        ], '#52525b', 1.1);
      }
    } else if (shoe === 'patriarch_boots') {
      // Ủng võ lâm đen cổ chữ V thêu viền bạc (Ngô Giang Mạnh)
      const pFill = isSolid ? st._solid : this._materialFill(ctx, st, 'leather', shinA[0] - 5, shinA[1], shinB[0] + 5, shinB[1], '#141e30', far);
      this.limb(ctx, shinA, shinB, cfW0 * 1.04, cfW1 * 1.08, pFill, edge, far ? null : 'rgba(226,232,240,0.28)', st);
      if (!isSolid) {
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(shinA[0] - 3.6 * bulk, shinA[1] - 0.8);
        ctx.lineTo(shinA[0] + 0.5, shinA[1] + 2.2);
        ctx.lineTo(shinA[0] + 3.8 * bulk, shinA[1] - 0.8);
        ctx.moveTo(shinA[0] + 1.0, shinA[1] + 2.0); ctx.lineTo(shinB[0] + 1.0, shinB[1]);
        ctx.stroke();
      }
    } else if (shoe === 'bandage_wraps') {
      // Quấn vải trắng cổ chân đạo sĩ cổ trang (Châu Ngọc Thiên Khánh)
      const wFill = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', shinA[0] - 4, shinA[1], shinB[0] + 4, shinB[1], '#e2e8f0', far);
      this.limb(ctx, shinA, shinB, cfW0 * 0.96, cfW1 * 0.98, wFill, edge, far ? null : 'rgba(255,255,255,0.4)', st);
      if (!isSolid) {
        const m1 = [shinA[0] + (shinB[0] - shinA[0]) * 0.34, shinA[1] + (shinB[1] - shinA[1]) * 0.34];
        const m2 = [shinA[0] + (shinB[0] - shinA[0]) * 0.68, shinA[1] + (shinB[1] - shinA[1]) * 0.68];
        this._drawFoldCluster(ctx, st, [
          [m1[0] - 3.2 * bulk, m1[1] - 1.2, m1[0] + 3.4 * bulk, m1[1] + 1.0],
          [m2[0] - 2.8 * bulk, m2[1] - 1.0, m2[0] + 3.0 * bulk, m2[1] + 1.0]
        ], '#64748b', 0.9);
      }
    }

    // Giày / Bốt dưới bàn chân (với hình khối đế/mũi sắc nét cân đối cổ chân)
    const f = [Math.cos(footA), -Math.sin(footA)];
    const dn = [Math.sin(footA), Math.cos(footA)];
    const cx = ank[0] + f[0] * 3.2 + dn[0] * 2.0;
    const cy = ank[1] + f[1] * 3.2 + dn[1] * 2.0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-footA);

    if (isSolid) {
      ctx.fillStyle = st._solid;
      ctx.beginPath(); ctx.ellipse(0.5, 0.1, 8.2 * Math.min(1.12, bulk), 3.9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }

    if (shoe === 'sneakers' || shoe === 'brawler_boots') {
      const sCol = far ? shadeColor(st.shoeColor || '#14532d', -0.3) : (st.shoeColor || '#166534');
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(0.2, 0.2, 8.4, 4.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this._materialFill(ctx, st, 'leather', -7, -3, 7, 2, sCol, false);
      ctx.beginPath(); ctx.ellipse(0.2, -0.7, 7.6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090d16'; ctx.fillRect(-6.4, 1.1, 13.4, 2.0);
      // Dây giày buộc ngang mu bàn chân
      ctx.strokeStyle = '#052e16'; ctx.lineWidth = 0.85;
      ctx.beginPath(); ctx.moveTo(-2.5, -2.0); ctx.lineTo(-0.5, -1.0); ctx.moveTo(0.2, -2.2); ctx.lineTo(2.2, -1.2); ctx.stroke();
    } else if (shoe === 'combat' || shoe === 'cyber_boots' || shoe === 'tabi_guards') {
      ctx.fillStyle = 'rgba(0,0,0,0.54)';
      ctx.beginPath(); ctx.ellipse(0.3, 0.2, 8.6, 4.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#0f172a' : (shoe === 'cyber_boots' ? '#273549' : '#18181b');
      ctx.beginPath(); ctx.ellipse(0.3, -0.7, 7.8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090d16'; ctx.fillRect(-6.8, 1.0, 14.0, 2.3);
      ctx.strokeStyle = shoe === 'cyber_boots' ? '#94a3b8' : '#52525b'; ctx.lineWidth = 1.05;
      ctx.beginPath(); ctx.moveTo(-1.8, -2.2); ctx.lineTo(3.2, -2.0); ctx.stroke();
      if (shoe === 'tabi_guards') {
        ctx.strokeStyle = '#09090b'; ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.moveTo(4.2, -0.8); ctx.lineTo(7.8, -0.2); ctx.stroke();
      }
    } else if (shoe === 'general_greaves') {
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.beginPath(); ctx.ellipse(0.5, 0.2, 9.2, 4.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#450a0a' : '#7f1d1d';
      ctx.beginPath(); ctx.ellipse(0.5, -0.5, 8.4, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1.25; ctx.stroke();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-2.5, -1.8); ctx.lineTo(4.5, -1.2); ctx.stroke();
    } else if (shoe === 'shin_wraps') {
      ctx.fillStyle = 'rgba(0,0,0,0.48)';
      ctx.beginPath(); ctx.ellipse(0.2, 0.2, 8.4, 4.0, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#4a3520' : '#6b4e30';
      ctx.beginPath(); ctx.ellipse(0.2, -0.4, 7.6, 3.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#291d12'; ctx.fillRect(-6.4, 1.2, 13.0, 1.7);
    } else if (shoe === 'dress' || shoe === 'patriarch_boots') {
      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.beginPath(); ctx.ellipse(0.2, 0.2, 8.4, 3.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#09090b' : '#18181b';
      ctx.beginPath(); ctx.ellipse(0.5, -0.5, 7.8, 3.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000000'; ctx.fillRect(-6.2, 0.6, 4.0, 2.5);
      ctx.strokeStyle = shoe === 'patriarch_boots' ? '#e2e8f0' : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 0.95;
      ctx.beginPath(); ctx.moveTo(-1.8, -1.6); ctx.lineTo(4.4, -1.5); ctx.stroke();
    } else if (shoe === 'wraps') {
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.beginPath(); ctx.ellipse(0, 0, 7.6, 3.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#d6d3d1' : '#f5f5f4';
      ctx.beginPath(); ctx.ellipse(0, 0, 6.8, 3.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 1.0;
      ctx.beginPath(); ctx.moveTo(-4, -1.5); ctx.lineTo(2.4, 1.5); ctx.moveTo(-1.5, -2.2); ctx.lineTo(4.8, 0.8); ctx.stroke();
    } else {
      // Giày võ Vovinam đen gọn gàng sắc sảo
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0.2, 0.1, 8.0, 3.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = far ? '#090b10' : '#181a24';
      ctx.beginPath(); ctx.ellipse(0.5, -0.3, 7.3, 3.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-2.6, -1.4); ctx.lineTo(3.2, -1.4); ctx.stroke();
      ctx.fillStyle = '#090b10'; ctx.fillRect(-5.8, 1.3, 12.2, 1.4);
    }
    ctx.restore();
  }

  drawArm(ctx, sh, elb, hand, foreAbs, st, far, skipShield = false, motion = null) {
    const rig = (st && st.rig) || {};
    const bulk = rig.armBulk || rig.limbBulk || 1.0;
    const isSolid = !!(st && st._solid);
    const isBareUpper = !!(st.sleeveless || st.vest || st.bareBiceps);
    const edge = this._edge(st, 'rgba(0,0,0,0.56)');
    const hi = (far || isSolid) ? null : 'rgba(255,255,255,0.16)';
    const arch = st.archetype || '';
    const sleeveFill = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', sh[0] - 5, sh[1], hand[0] + 5, hand[1], st.gi, far);
    const bareSkinFill = isSolid ? st._solid : this._materialFill(ctx, st, 'skin', sh[0] - 4, sh[1], hand[0] + 4, hand[1], st.skin, far);
    const g = isBareUpper ? bareSkinFill : sleeveFill;

    // 1. Nối cơ vai / cầu tay áo liền lạc vào thân trên (tránh tay trụ rời rạc khỏi vai)
    if (st.bareBiceps && !st.wideSleeves) {
      // Đình Bích Lâm: lộ tay áo thun bó đen bó sát cơ vai đen dưới nách gile lục + cơ vai/nhị đầu cuồn cuộn
      const shMid = [sh[0] + (elb[0] - sh[0]) * 0.22, sh[1] + (elb[1] - sh[1]) * 0.22];
      this.capsule(ctx, sh, shMid, 10.6 * bulk, 9.6 * bulk, this._c(st, far ? '#090b10' : '#14171f'));
      if (!isSolid) {
        ctx.fillStyle = bareSkinFill;
        ctx.beginPath(); ctx.ellipse(sh[0] + (elb[0] - sh[0]) * 0.26, sh[1] + (elb[1] - sh[1]) * 0.26, 4.9 * bulk, 5.4 * bulk, 0.2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (!st.wideSleeves && !st.suit) {
      // Múi vai áo / cầu vải tạo độ dày nếp vai
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sh[0], sh[1] + 0.5, 5.2 * bulk, 0, Math.PI * 2); ctx.fill();
      if (!isSolid) { ctx.strokeStyle = edge; ctx.lineWidth = 0.9; ctx.stroke(); }
    }

    // 2. Tay áo lửng 3/4 cho Phó Đặng Hoàng Anh (cổ tay thổ cẩm + xà cạp quấn da nâu)
    if (st.mountainWraps) {
      this.muscleLimb(ctx, sh, elb, 10.4 * bulk, 8.2 * bulk, sleeveFill, edge, hi, st, 1.55 * bulk, 0.42, 0.25);
      const cuffMid = [elb[0] + (hand[0] - elb[0]) * 0.36, elb[1] + (hand[1] - elb[1]) * 0.36];
      const wr = [elb[0] + (hand[0] - elb[0]) * 0.82, elb[1] + (hand[1] - elb[1]) * 0.82];
      this.muscleLimb(ctx, elb, cuffMid, 8.4 * bulk, 7.2 * bulk, sleeveFill, edge, hi, st, 0.9 * bulk, 0.45, 0.15);
      if (!isSolid) {
        const cBand0 = [elb[0] + (hand[0] - elb[0]) * 0.24, elb[1] + (hand[1] - elb[1]) * 0.24];
        this.capsule(ctx, cBand0, cuffMid, 8.5 * bulk, 7.7 * bulk, far ? '#785e36' : '#a88854');
        this._drawFoldCluster(ctx, st, [
          [elb[0] - 2.6 * bulk, elb[1] - 1, elb[0] + 2.8 * bulk, elb[1] + 1],
          [cBand0[0] - 2.8 * bulk, cBand0[1], cuffMid[0] + 2.4 * bulk, cuffMid[1]]
        ], '#3f2e18', 0.95);
      }
      this.muscleLimb(ctx, cuffMid, wr, 6.6 * bulk, 4.8 * bulk, bareSkinFill, edge, hi, st, 0.85 * bulk, 0.3, 0.18);
      const w0 = [elb[0] + (hand[0] - elb[0]) * 0.48, elb[1] + (hand[1] - elb[1]) * 0.48];
      const wrLeather = isSolid ? st._solid : this._materialFill(ctx, st, 'leather', w0[0] - 3, w0[1], wr[0] + 3, wr[1], '#5c3c20', far);
      this.capsule(ctx, w0, wr, 5.9 * bulk, 4.7 * bulk, wrLeather);
      if (!isSolid) {
        const mW = [w0[0] + (wr[0] - w0[0]) * 0.5, w0[1] + (wr[1] - w0[1]) * 0.5];
        this._drawFoldCluster(ctx, st, [
          [w0[0] - 2.2 * bulk, w0[1] + 0.8, mW[0] + 2.4 * bulk, mW[1]],
          [mW[0] - 2.0 * bulk, mW[1] + 1.2, wr[0] + 1.8 * bulk, wr[1] - 0.8]
        ], '#291d12', 1.05);
      }
    } else {
      const isMartialBaggySleeve = (arch === 'vovinam_master' || st.cuffTrim);
      const uW0 = (st.wideSleeves ? 11.0 : (isMartialBaggySleeve ? 10.6 : (st.suit ? 9.8 : 9.6))) * bulk;
      const uW1 = (st.wideSleeves ? 10.4 : (isMartialBaggySleeve ? 8.8 : (st.suit ? 7.6 : 7.4))) * bulk;
      const fW0 = (st.wideSleeves ? 10.6 : (isMartialBaggySleeve ? 9.0 : (st.suit ? 7.8 : 7.6))) * bulk;
      const fW1 = (st.wideSleeves ? 9.6 : (isMartialBaggySleeve ? 6.4 : 4.8)) * bulk;

      this.muscleLimb(ctx, sh, elb, uW0, uW1, g, edge, hi, st, (st.wideSleeves ? 1.2 : 1.45) * bulk, 0.42, 0.24);
      const wr = [elb[0] + (hand[0] - elb[0]) * 0.82, elb[1] + (hand[1] - elb[1]) * 0.82];
      this.muscleLimb(ctx, elb, wr, fW0, fW1, g, edge, hi, st, (st.wideSleeves ? 1.0 : 1.05) * bulk, 0.30, 0.20);

      // Nếp nhăn vải ở khuỷu tay cho võ phục & vest may đo
      if (!isSolid && !isBareUpper && !st.wideSleeves) {
        this._drawFoldCluster(ctx, st, [
          [elb[0] - 2.4 * bulk, elb[1] - 1.2, elb[0] + 2.6 * bulk, elb[1] + 1.2],
          [elb[0] - 1.8 * bulk, elb[1] + 1.6, elb[0] + 1.9 * bulk, elb[1] + 2.8]
        ], far ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.34)', 0.9);
      }

      // Tay áo bào rộng hình chuông nhiều lớp phủ trọn cổ tay của Kiếm Tông Cổ Truyền (Ngô Giang Mạnh)
      if (st.wideSleeves) {
        const sw = motion ? motion.sway * 0.55 : 0;
        const wb = motion && motion.runBias ? motion.runBias * 0.25 : 0;
        const drop = 13.8;
        const fDirX = wr[0] - elb[0], fDirY = wr[1] - elb[1];
        const fLen = Math.hypot(fDirX, fDirY) || 1;
        // Hướng vuông góc phía trên cánh tay để mép áo phủ kín trọn phần cẳng tay trên
        let upX = -fDirY / fLen, upY = fDirX / fLen;
        if (upY > 0) { upX = -upX; upY = -upY; }
        const elbTop = [elb[0] + upX * (fW0 * 0.56), elb[1] + upY * (fW0 * 0.56)];
        const wrTop = [wr[0] + upX * (fW1 * 0.52), wr[1] + upY * (fW1 * 0.52)];
        const elbDrop = [elb[0] - 2.2 + sw * 0.5 + wb * 0.4, elb[1] + drop * 0.88];
        const wrDrop = [wr[0] - 4.2 + sw + wb, wr[1] + drop * 1.08];
        const shTop = [sh[0] + upX * (uW0 * 0.48), sh[1] + upY * (uW0 * 0.48)];
        const slBody = isSolid ? st._solid : this._materialFill(ctx, st, 'silk', shTop[0], shTop[1], wrDrop[0], wrDrop[1], st.gi, far);
        ctx.fillStyle = slBody;
        ctx.beginPath();
        ctx.moveTo(sh[0] - 1.5, sh[1] + 4.5);
        ctx.quadraticCurveTo(elb[0] - 3.5, elb[1] + 6.5, elbDrop[0], elbDrop[1]);
        ctx.bezierCurveTo(
          (elbDrop[0] + wrDrop[0]) * 0.45, Math.max(elbDrop[1], wrDrop[1]) + 4.5,
          wrDrop[0] - 3.6, wrDrop[1] + 2.8,
          wrDrop[0], wrDrop[1]
        );
        ctx.lineTo(wrTop[0], wrTop[1]);
        ctx.lineTo(elbTop[0], elbTop[1]);
        ctx.lineTo(shTop[0], shTop[1]);
        ctx.closePath();
        ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.52)'; ctx.lineWidth = 1.15; ctx.stroke();
          // Khoang lót tối bên trong ống tay áo bào xòe ở cổ tay
          const isCrimsonTaoist = st.archetype === 'crimson_coin_taoist';
          ctx.fillStyle = far ? (isCrimsonTaoist ? '#1f0707' : '#060c18') : (isCrimsonTaoist ? '#2b0909' : '#091426');
          ctx.beginPath();
          ctx.moveTo(wrTop[0], wrTop[1]);
          ctx.quadraticCurveTo(wr[0] + 2.6, (wrTop[1] + wrDrop[1]) * 0.5, wrDrop[0], wrDrop[1]);
          ctx.quadraticCurveTo(wr[0] - 3.0, (wrTop[1] + wrDrop[1]) * 0.52, wrTop[0], wrTop[1]);
          ctx.closePath();
          ctx.fill();
          // Nếp rủ bên trong ống tay chuông + diềm hoa văn dọc miệng tay áo
          this._drawFoldCluster(ctx, st, [
            [elb[0] + 0.5, elb[1] + 3.0, (elb[0] + wr[0]) * 0.5, elb[1] + 8.5, wr[0] - 3.0, wr[1] + 5.8],
            [elbDrop[0] + 2.0, elbDrop[1] - 3.2, (elbDrop[0] + wrDrop[0]) * 0.5, wrDrop[1] - 2.6, wrDrop[0] - 1.8, wrDrop[1] - 5.2]
          ], isCrimsonTaoist ? '#7f1d1d' : '#64748b', 1.05);
          ctx.strokeStyle = isCrimsonTaoist ? (far ? '#92400e' : '#eab308') : (far ? '#64748b' : '#cbd5e1'); ctx.lineWidth = 2.8; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(wrTop[0], wrTop[1]); ctx.lineTo(wrDrop[0], wrDrop[1]); ctx.stroke();
          ctx.strokeStyle = isCrimsonTaoist ? '#1c1917' : '#f8fafc'; ctx.lineWidth = 0.95;
          ctx.beginPath(); ctx.moveTo(wrTop[0], wrTop[1]); ctx.lineTo(wrDrop[0], wrDrop[1]); ctx.stroke();
        }
      }

      // Viền cổ tay áo gấp dày đỏ (Ngô Nhất Nghị & Võ Phục Vovinam)
      if (st.cuffTrim) {
        const cuffStart = [elb[0] + (hand[0] - elb[0]) * 0.62, elb[1] + (hand[1] - elb[1]) * 0.62];
        const cuffFill = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', cuffStart[0] - 4, cuffStart[1], wr[0] + 4, wr[1], st.cuffTrim, far);
        this.limb(ctx, cuffStart, wr, fW1 + 1.35, fW1 + 0.9, cuffFill, edge, null, st);
        if (!isSolid) {
          this._drawRimLight(ctx, st, [[cuffStart[0], cuffStart[1] - fW1 * 0.4], [wr[0], wr[1] - fW1 * 0.4]], 'rgba(255,255,255,0.22)', 0.9);
        }
      }

      // Măng-sét thêu chỉ đỏ-vàng (Hứa Vũ Đại)
      if (st.cuffRedEmbroidery && !isSolid) {
        const emStart = [elb[0] + (hand[0] - elb[0]) * 0.72, elb[1] + (hand[1] - elb[1]) * 0.72];
        this.capsule(ctx, emStart, wr, fW1 + 0.75, fW1 + 0.45, far ? '#450a0a' : '#7f1d1d');
        this._drawRimLight(ctx, st, [[emStart[0], emStart[1]], [wr[0], wr[1]]], '#eab308', 0.9);
      }

      // Băng quấn cẳng tay / Hộ uyển chạm khắc thon ôm cẳng tay
      const w0 = [elb[0] + (hand[0] - elb[0]) * 0.42, elb[1] + (hand[1] - elb[1]) * 0.42];
      if (st.armor) {
        // Hộ uyển Phụng Hoàng chạm đồng vàng & đỏ (Triệu Đình An)
        const m0 = [elb[0] + (hand[0] - elb[0]) * 0.16, elb[1] + (hand[1] - elb[1]) * 0.16];
        const brGold = isSolid ? st._solid : this._materialFill(ctx, st, 'gold', m0[0] - 4, m0[1], wr[0] + 4, wr[1], '#d97706', far);
        this.limb(ctx, m0, wr, 6.9 * bulk, 5.2 * bulk, brGold, edge, null, st);
        if (!isSolid) {
          this.capsule(ctx, m0, wr, 3.8 * bulk, 2.9 * bulk, far ? '#450a0a' : '#881337');
          this.capsule(ctx, [elb[0] + (hand[0] - elb[0]) * 0.72, elb[1] + (hand[1] - elb[1]) * 0.72], wr, 5.5 * bulk, 5.1 * bulk, '#facc15');
          this._drawFoldCluster(ctx, st, [[m0[0], m0[1], wr[0], wr[1]]], '#fef08a', 0.95);
        }
      } else if (st.stripedWraps) {
        // Băng quấn sọc đen - xanh lục đậm của Đình Bích Lâm
        this.limb(ctx, w0, wr, 5.8 * bulk, 4.7 * bulk, this._c(st, '#0f1419'), edge, null, st);
        if (!isSolid) {
          const mid1 = [w0[0] + (wr[0] - w0[0]) * 0.25, w0[1] + (wr[1] - w0[1]) * 0.25];
          const mid2 = [w0[0] + (wr[0] - w0[0]) * 0.50, w0[1] + (wr[1] - w0[1]) * 0.50];
          const mid3 = [w0[0] + (wr[0] - w0[0]) * 0.78, w0[1] + (wr[1] - w0[1]) * 0.78];
          const wc = far ? '#14532d' : '#16a34a';
          this.capsule(ctx, w0, mid1, 5.9 * bulk, 5.4 * bulk, wc);
          this.capsule(ctx, mid2, mid3, 5.2 * bulk, 4.8 * bulk, wc);
        }
      } else if (st.shinobiArmor) {
        // Hộ uyển thép xám đen chia đốt & ốp khuỷu tay sắc cạnh (Phó Dung Hải)
        const m0 = [elb[0] + (hand[0] - elb[0]) * 0.16, elb[1] + (hand[1] - elb[1]) * 0.16];
        const vFill = isSolid ? st._solid : this._materialFill(ctx, st, 'metal', m0[0] - 4, m0[1], wr[0] + 4, wr[1], '#3b404c', far);
        this.limb(ctx, m0, wr, 6.4 * bulk, 4.9 * bulk, vFill, edge, far ? null : 'rgba(226,232,240,0.22)', st);
        if (!isSolid) {
          ctx.fillStyle = this._materialFill(ctx, st, 'metal', elb[0] - 4, elb[1] - 4, elb[0] + 4, elb[1] + 4, '#27272a', far);
          ctx.beginPath(); ctx.ellipse(elb[0], elb[1], 4.2 * bulk, 3.6 * bulk, 0.2, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.9; ctx.stroke();
          const mS = [m0[0] + (wr[0] - m0[0]) * 0.5, m0[1] + (wr[1] - m0[1]) * 0.5];
          this._drawFoldCluster(ctx, st, [[mS[0] - 2.2 * bulk, mS[1], mS[0] + 2.4 * bulk, mS[1]]], '#94a3b8', 0.95);
        }
      } else if (!st.suit && !st.cuffTrim && !st.wideSleeves && !st.quantumGauntlets && !st.bareForearms) {
        const wDef = [elb[0] + (hand[0] - elb[0]) * 0.56, elb[1] + (hand[1] - elb[1]) * 0.56];
        const wrapCol = this._c(st, st.patch ? (far ? '#cbd5e1' : '#f8fafc') : (st.beltD || '#1e293b'));
        this.capsule(ctx, wDef, wr, 5.1 * bulk, 4.4 * bulk, wrapCol);
      }
    }

    const wr = [elb[0] + (hand[0] - elb[0]) * 0.82, elb[1] + (hand[1] - elb[1]) * 0.82];
    if (st.quantumGauntlets) {
      // Hộ uyển Lượng Tử đa diện kim loại + viền sáng cyan có kiểm soát (Phó Tiến Đăng)
      const q0 = [elb[0] + (hand[0] - elb[0]) * 0.22, elb[1] + (hand[1] - elb[1]) * 0.22];
      const qHull = isSolid ? st._solid : this._materialFill(ctx, st, 'metal', q0[0] - 4, q0[1], wr[0] + 4, wr[1], '#0284c7', far);
      this.limb(ctx, q0, wr, 6.8 * bulk, 5.1 * bulk, qHull, edge, far ? null : 'rgba(186,230,253,0.42)', st);
      if (!isSolid) {
        const qMid = [q0[0] + (wr[0] - q0[0]) * 0.45, q0[1] + (wr[1] - q0[1]) * 0.45];
        this.capsule(ctx, q0, qMid, 3.6 * bulk, 3.2 * bulk, far ? '#1e293b' : '#334155');
        this.capsule(ctx, qMid, wr, 3.2 * bulk, 2.5 * bulk, '#a5f3fc');
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath(); ctx.arc(qMid[0], qMid[1], 1.75 * bulk, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Cổ tay & Bàn tay / Nắm đấm theo tỷ lệ giải phẫu tự nhiên gọn gàng (KHÔNG phồng to)
    this.drawHand(ctx, wr, hand, foreAbs, st, far, motion);

    // Gậy rồng bạc sang trọng của Hứa Vũ Đại (đầu rồng chạm khắc tinh xảo)
    if (st.cane && !far) {
      ctx.save();
      const attacking = !!(motion && motion.isAttacking);
      const dirC = attacking ? [Math.sin(foreAbs), Math.cos(foreAbs)] : [0.05, 0.998];
      const cTop = [hand[0] - dirC[0] * 3.0, hand[1] - dirC[1] * 3.0];
      const cBot = [hand[0] + dirC[0] * 52, hand[1] + dirC[1] * 52];
      ctx.strokeStyle = this._c(st, '#271a12'); ctx.lineWidth = 3.1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cTop[0], cTop[1]); ctx.lineTo(cBot[0], cBot[1]); ctx.stroke();
      if (!isSolid) {
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cTop[0] + dirC[0] * 1.5, cTop[1] + dirC[1] * 1.5); ctx.lineTo(cTop[0] + dirC[0] * 8, cTop[1] + dirC[1] * 8); ctx.stroke();
        // Đầu rồng bạc chạm nổi góc cạnh
        ctx.fillStyle = this._materialFill(ctx, st, 'steel', cTop[0] - 4, cTop[1] - 3, cTop[0] + 4, cTop[1] + 3, '#cbd5e1', false);
        ctx.beginPath();
        ctx.moveTo(cTop[0] - 4.2, cTop[1] - 1.4);
        ctx.lineTo(cTop[0] + 2.6, cTop[1] - 3.2);
        ctx.lineTo(cTop[0] + 4.8, cTop[1] - 0.5);
        ctx.lineTo(cTop[0] + 2.2, cTop[1] + 2.6);
        ctx.lineTo(cTop[0] - 3.8, cTop[1] + 1.8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.85; ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(cTop[0] + 1.6, cTop[1] - 0.7, 0.95, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = st._solid;
        ctx.beginPath(); ctx.ellipse(cTop[0], cTop[1], 4.2, 3.0, -0.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // Khiên Hổ Phù trên tay xa (Triệu Đình An)
    if (st.shield && far && !skipShield) {
      this.drawTigerShield(ctx, elb, hand, foreAbs, st, false);
    }
  }

  // Vẽ Bàn tay / Nắm đấm theo tỷ lệ giải phẫu thực tế (nắm đấm gọn ~36-45% chiều rộng đầu, bàn tay mở rõ ngón)
  drawHand(ctx, wr, hand, foreAbs, st, far, motion) {
    const rig = (st && st.rig) || {};
    const bulk = rig.armBulk || rig.limbBulk || 1.0;
    const isSolid = !!(st && st._solid);
    const sk = this._c(st, far ? st.skinD : st.skin);
    const edge = this._edge(st, 'rgba(0,0,0,0.52)');
    const handFill = st.quantumGauntlets
      ? this._c(st, far ? '#0284c7' : '#0ea5e9')
      : (st.gloves ? this._c(st, far ? shadeColor(st.gloves, -0.22) : st.gloves)
        : (st.gauntlet ? this._c(st, far ? '#a16207' : '#d97706')
          : (st.stripedWraps ? this._c(st, far ? '#14532d' : '#16a34a') : sk)));

    // Cổ tay thon chuyển tiếp tự nhiên sang lòng bàn tay
    this.capsule(ctx, wr, hand, 3.9 * bulk, 3.1 * bulk, handFill);

    const stName = (motion && motion.state) || 'idle';
    const isIdleOrPrep = !motion || !motion.isAttacking || stName === 'idle' || stName === 'walk' || stName === 'run' || stName === 'guard' || stName === 'counter_hand_prep';
    const holdsObj = !!(
      (st.weapon && !far) ||
      (st.weapon === 'twin_daggers' && far) ||
      (st.weapon === 'hoe') ||
      (st.cane && !far) ||
      (st.cigar && !far && (stName === 'ultimate_barrage' || stName === 'boss_bash' || stName === 'counter_hand_strike' || stName === 'air_punch'))
    );
    const useOpenPalm = !holdsObj && (
      isIdleOrPrep ||
      stName === 'counter_hand_strike' ||
      stName === 'ultimate_command' ||
      stName === 'ultimate_precision' ||
      (far && !st.shield)
    );

    const hScale = Math.min(1.06, Math.max(0.84, bulk));
    ctx.save();
    ctx.translate(hand[0], hand[1]);
    // Hệ tọa độ cục bộ khớp hướng trục cẳng tay (+Y là hướng vươn từ cổ tay ra ngón)
    ctx.rotate(-foreAbs);

    if (useOpenPalm) {
      // Lòng bàn tay + Ngón cái + 4 ngón tách rõ cấu trúc
      const pw = 2.05 * hScale;
      const pl = 4.25 * hScale;
      ctx.fillStyle = handFill;
      ctx.strokeStyle = edge;
      ctx.lineWidth = isSolid ? 0.6 : 0.9;
      ctx.beginPath();
      ctx.moveTo(-pw * 0.85, 0);
      ctx.lineTo(pw * 0.95, 0);
      ctx.lineTo(pw * 1.05, pl);
      ctx.lineTo(-pw * 0.75, pl);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) ctx.stroke();

      // Ngón cái
      ctx.lineCap = 'round';
      ctx.strokeStyle = edge; ctx.lineWidth = 2.1 * hScale;
      ctx.beginPath(); ctx.moveTo(pw * 0.8, 1.2); ctx.lineTo(pw * 1.9, pl * 0.78); ctx.stroke();
      ctx.strokeStyle = handFill; ctx.lineWidth = 1.35 * hScale;
      ctx.beginPath(); ctx.moveTo(pw * 0.8, 1.2); ctx.lineTo(pw * 1.9, pl * 0.78); ctx.stroke();

      // 4 ngón tay thon dài (lộ đốt hở ngón nếu đeo băng/găng hở ngón)
      const fingerCol = (!isSolid && (st.stripedWraps || st.shinobiArmor || st.quantumGauntlets)) ? sk : handFill;
      const fingerOffsets = [-1.15, -0.32, 0.52, 1.28];
      const fingerLens = [3.1, 3.9, 3.7, 2.9];
      for (let i = 0; i < 4; i++) {
        const fx0 = fingerOffsets[i] * hScale;
        const fl = fingerLens[i] * hScale;
        const spread = (i - 1.5) * 0.22;
        ctx.strokeStyle = edge; ctx.lineWidth = 1.65 * hScale;
        ctx.beginPath(); ctx.moveTo(fx0, pl - 0.3); ctx.lineTo(fx0 + spread, pl + fl); ctx.stroke();
        ctx.strokeStyle = fingerCol; ctx.lineWidth = 1.05 * hScale;
        ctx.beginPath(); ctx.moveTo(fx0, pl - 0.3); ctx.lineTo(fx0 + spread, pl + fl); ctx.stroke();
      }

      if (!isSolid && st.signetRings) {
        // 2 chiếc nhẫn bạc đính đá (Hứa Vũ Đại / bàn tay hở)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-0.5 * hScale, pl + 0.5, 1.0, 1.1);
        ctx.fillRect(0.45 * hScale, pl + 0.5, 1.0, 1.1);
      }

      if (!isSolid && st.quantumGauntlets) {
        // Nút khớp găng cyber & lõi cyan gọn trên mu bàn tay
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath(); ctx.ellipse(0.1, pl * 0.52, 1.1, 1.75, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#94a3b8';
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath(); ctx.arc(k * 0.85, pl - 0.4, 0.52, 0, Math.PI * 2); ctx.fill();
        }
      }
      // Điếu xì gà kẹp giữa ngón + làn khói mỏng của Phó Văn Anh khi idle
      if (!isSolid && st.cigar && !far && isIdleOrPrep) {
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.moveTo(0.8, pl + 1.0); ctx.lineTo(6.2, pl + 2.6); ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(6.4, pl + 2.7, 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(226,232,240,0.45)'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(6.4, pl + 2.0);
        ctx.quadraticCurveTo(8.2, pl - 2.0, 6.8, pl - 6.0);
        ctx.stroke();
      }
    } else {
      // Nắm đấm điêu khắc góc cạnh nhỏ gọn (~4.8 x 5.2)
      const fw = 2.4 * hScale;
      const fh = 5.15 * hScale;
      ctx.fillStyle = handFill;
      ctx.strokeStyle = edge;
      ctx.lineWidth = isSolid ? 0.7 : 1.0;
      ctx.beginPath();
      ctx.moveTo(-fw * 0.82, 0.2);
      ctx.lineTo(fw * 0.88, 0.2);
      ctx.lineTo(fw * 1.02, fh * 0.58);
      ctx.lineTo(fw * 0.65, fh);
      ctx.lineTo(-fw * 0.72, fh * 0.94);
      ctx.lineTo(-fw * 0.96, fh * 0.52);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) ctx.stroke();

      if (!isSolid) {
        // Đốt ngón & ngón cái gập gọn + gờ sáng da/găng
        ctx.strokeStyle = 'rgba(0,0,0,0.36)'; ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(-fw * 0.55, fh * 0.45); ctx.lineTo(fw * 0.72, fh * 0.48);
        ctx.moveTo(-fw * 0.50, fh * 0.72); ctx.lineTo(fw * 0.62, fh * 0.74);
        ctx.stroke();
        if (st.gloves) {
          ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 0.75;
          ctx.beginPath(); ctx.moveTo(-fw * 0.6, fh * 0.22); ctx.lineTo(fw * 0.6, fh * 0.22); ctx.stroke();
        }
        if (st.signetRings) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(0.2, fh * 0.36, 1.25, 1.15);
          ctx.fillRect(-1.1, fh * 0.40, 1.15, 1.1);
        }
        if (st.quantumGauntlets) {
          ctx.fillStyle = '#a5f3fc';
          ctx.fillRect(-fw * 0.55, fh * 0.76, fw * 1.1, 1.2);
        }
      }
    }
    ctx.restore();
  }

  // Khiên Chiến Thuật Hổ Phù (Triệu Đình An): tấm khiên bát giác/bầu dục bọc đồng vàng, đinh tán thép và phù hiệu trung tâm

  // ==========================================================================
  // TUYỆT KỸ THẦN THOẠI SSS — ÔNG NĂM CHÈO: THUYỀN RẼ SÓNG & BÓNG CÁ SẤU 5 CHÂN
  // ==========================================================================
  drawFiveLeggedCrocodilePhantom(ctx, jt, st, p, now) {
    const shimmer = 0.56 + 0.16 * Math.sin(now * 0.014);
    const tailWag = Math.sin(now * 0.018) * 9;
    const jawRoar = 0.14 + 0.08 * Math.sin(now * 0.02);
    ctx.save();
    ctx.globalAlpha *= shimmer;

    // 1. Quầng sương Cửu Long đỏ thẫm - xanh ngọc ma mị ẩn hiện sau lưng & phía trên thuyền
    const aura = ctx.createRadialGradient(-42, -96, 16, -42, -96, 168);
    aura.addColorStop(0, 'rgba(239, 68, 68, 0.36)');
    aura.addColorStop(0.45, 'rgba(20, 184, 166, 0.32)');
    aura.addColorStop(1, 'rgba(6, 78, 59, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-42, -96, 168, 0, Math.PI * 2);
    ctx.fill();

    // 2. Thân & Đuôi Cá Sấu 5 Chân khổng lồ uốn lượn phía sau lưng (cao vượt trên vai Bích Lâm)
    const bodyGrad = ctx.createLinearGradient(-196, -70, 56, -135);
    bodyGrad.addColorStop(0, 'rgba(13, 148, 136, 0.35)');
    bodyGrad.addColorStop(0.55, 'rgba(6, 78, 59, 0.72)');
    bodyGrad.addColorStop(1, 'rgba(127, 29, 29, 0.65)');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-194, -64 + tailWag);
    ctx.quadraticCurveTo(-136, -124 + tailWag * 0.4, -48, -134);
    ctx.quadraticCurveTo(-6, -138, 22, -124);
    ctx.lineTo(14, -92);
    ctx.quadraticCurveTo(-40, -68, -118, -60);
    ctx.quadraticCurveTo(-162, -56, -194, -64 + tailWag);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hàng gai lưng đỏ-ngọc rực chạy dọc sống lưng cá sấu khổng lồ
    for (let i = 0; i < 8; i++) {
      const rx = -168 + i * 23;
      const arcOffset = Math.sin((i / 7) * Math.PI) * 52;
      const ry = -72 - arcOffset + (i < 2 ? tailWag * 0.4 : 0);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(239, 68, 68, 0.88)' : 'rgba(45, 212, 191, 0.82)';
      ctx.beginPath();
      ctx.moveTo(rx - 5, ry + 7);
      ctx.lineTo(rx + 2, ry - 12);
      ctx.lineTo(rx + 8, ry + 4);
      ctx.closePath();
      ctx.fill();
    }

    // 3. 5 CHÂN CÁ SẤU RÕ NÉT (2 chân sau, CHÂN THỨ 5 ĐỎ VÀNG nổi bật ở giữa, 2 chân trước)
    const legSpecs = [
      { x: -146, y: -62, a: -0.32, fifth: false },
      { x: -120, y: -64, a: -0.10, fifth: false },
      { x: -91,  y: -66, a: 0.06,  fifth: true },
      { x: -62,  y: -69, a: 0.22,  fifth: false },
      { x: -35,  y: -73, a: 0.40,  fifth: false }
    ];
    for (const lg of legSpecs) {
      ctx.save();
      ctx.translate(lg.x, lg.y);
      ctx.rotate(lg.a + Math.sin(now * 0.02 + lg.x * 0.05) * 0.16);
      ctx.fillStyle = lg.fifth ? 'rgba(220, 38, 38, 0.86)' : 'rgba(13, 148, 136, 0.72)';
      ctx.strokeStyle = lg.fifth ? '#facc15' : '#5eead4';
      ctx.lineWidth = lg.fifth ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.lineTo(8, 28);
      ctx.lineTo(-3, 30);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // 3 móng vuốt sắc nhọn
      ctx.strokeStyle = lg.fifth ? '#fef08a' : '#e0f2fe';
      ctx.lineWidth = 1.6;
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(2 + c * 3, 28);
        ctx.lineTo(5 + c * 4.5, 38);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. ĐẦU CÁ SẤU KHỔNG LỒ ĐỎ MŨI gầm phía trên cao sau lưng Bích Lâm
    ctx.save();
    ctx.translate(16, -118);
    // Hàm trên
    ctx.save();
    ctx.rotate(-jawRoar);
    ctx.fillStyle = 'rgba(6, 78, 59, 0.82)';
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.92)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-22, -16);
    ctx.quadraticCurveTo(14, -26, 60, -8);
    ctx.lineTo(55, 2);
    ctx.lineTo(-18, 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Răng nanh hàm trên
    ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
    for (let t = 0; t < 6; t++) {
      const tx = 2 + t * 8.8;
      ctx.beginPath();
      ctx.moveTo(tx - 2.4, 2); ctx.lineTo(tx, t === 5 ? 11 : 8); ctx.lineTo(tx + 2.4, 2);
      ctx.closePath(); ctx.fill();
    }
    // Con mắt cá sấu đỏ rực lõi vàng
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.ellipse(10, -11, 6.2, 3.6, -0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(9.5, -13.5, 1.8, 5);
    // Chóp Mũi Đỏ Rực đặc trưng Ông Năm Chèo
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(57, -6, 5.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fecaca';
    ctx.beginPath(); ctx.arc(56, -7.2, 2.0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Hàm dưới há rộng gầm vang
    ctx.save();
    ctx.rotate(jawRoar * 0.9);
    ctx.fillStyle = 'rgba(15, 118, 110, 0.78)';
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-18, 5);
    ctx.lineTo(54, 6);
    ctx.quadraticCurveTo(34, 19, -20, 17);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
    for (let t = 0; t < 5; t++) {
      const tx = 6 + t * 8.8;
      ctx.beginPath();
      ctx.moveTo(tx - 2.2, 6); ctx.lineTo(tx, -2.5); ctx.lineTo(tx + 2.2, 6);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.restore();

    ctx.restore();
  }

  drawNamCheoBoat(ctx, jt, st, p, now, layer) {
    const wave = Math.sin(now * 0.024) * 2.5;
    const rowAng = Math.sin(p * Math.PI * 8) * 0.42;
    ctx.save();
    ctx.translate(0, wave);

    if (layer === 'back') {
      // Mạn thuyền phía xa & quầng nước Cửu Long dưới lườn thuyền
      ctx.fillStyle = 'rgba(14, 165, 233, 0.42)';
      ctx.beginPath();
      ctx.ellipse(4, 7, 98, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#451a03';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-78, -14);
      ctx.quadraticCurveTo(6, -3, 86, -26);
      ctx.lineTo(72, 1);
      ctx.lineTo(-66, 1);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }

    // LỚP TRƯỚC: Thân thuyền gỗ tam bản Nam Bộ + Chỉ vàng + Mắt thuyền + Khăn đỏ mũi thuyền + Mái chèo + Bọt sóng
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-82, -16);
    ctx.quadraticCurveTo(-8, -3, 76, -10);
    ctx.quadraticCurveTo(88, -18, 96, -32);
    ctx.quadraticCurveTo(82, 4, 56, 9);
    ctx.lineTo(-64, 9);
    ctx.quadraticCurveTo(-78, 5, -82, -16);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Đường ghép ván thuyền gỗ tam bản & viền chỉ vàng
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.72)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-68, -2);
    ctx.quadraticCurveTo(6, 3, 66, -2);
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-76, -11);
    ctx.quadraticCurveTo(4, 0, 92, -28);
    ctx.stroke();

    // "Mắt thuyền" Nam Bộ ở mũi thuyền (đỏ-trắng-đen truyền thống chống thủy quái)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.ellipse(72, -15, 6.2, 3.6, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(73, -15, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(73.8, -15, 1.1, 0, Math.PI * 2); ctx.fill();

    // Giải lụa đỏ Thần Thoại buộc ở mũi thuyền
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(86, -25);
    ctx.quadraticCurveTo(64, -22 + wave, 46, -18 - wave);
    ctx.stroke();

    // Mái chèo gỗ cầm trên tay Bích Lâm quạt sóng
    const handX = (jt && jt.nHand) ? jt.nHand[0] : 8;
    const handY = (jt && jt.nHand) ? jt.nHand[1] : -32;
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(0.55 + rowAng);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.lineTo(14, 36);
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10, 34);
    ctx.lineTo(19, 32);
    ctx.lineTo(23, 56);
    ctx.lineTo(11, 58);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Sóng rẽ mũi thuyền trắng xóa - xanh ngọc
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(84, 2, 20, Math.PI * 0.72, Math.PI * 1.68);
    ctx.stroke();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-74, 4, 16, -0.4, 1.35);
    ctx.stroke();

    ctx.restore();
  }
}

window.SkeletalRendererRenderBase = SkeletalRendererRenderBase;
})();
