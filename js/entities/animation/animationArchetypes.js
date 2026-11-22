/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/entities/animation/animationArchetypes.js
 *
 * Hệ thống dựng tầng trang phục & silhouette chuyên biệt cho từng nhân vật:
 *  1. drawBackLayers: Nón đan sau lưng, áo choàng khoác vai + lót rồng, vạt trench coat, áo choàng tướng quân, khăn choàng dài.
 *  2. drawHipSkirtAndTassets: Vạt áo võ phục xẻ tà, giáp đùi vảy rồng, tà áo bào ngọc bội.
 *  3. drawFrontShoulderOverlay: Tay áo khoác rủ trên vai, cầu vai sư tử hoàng kim, cầu vai áo bào mây bạc, giáp vai nhẫn giả.
 */

(function () {
class SkeletalRendererArchetypes extends window.SkeletalRendererWeapon {
  // Chuyển điểm từ hệ cục bộ thân (trục ngang pp, trục dọc d) sang toạ độ nhân vật
  _bodyPt(jt, origin, xOff, yOff) {
    return [
      origin[0] + jt.pp[0] * xOff + jt.d[0] * yOff,
      origin[1] + jt.pp[1] * xOff + jt.d[1] * yOff
    ];
  }

  _motionMetrics(motion) {
    const sw = motion ? motion.sway : 0;
    const vx = motion ? motion.vx : 0;
    const whip = motion && typeof motion.whip === 'number' ? motion.whip : 0;
    const flutter = motion ? Math.sin(motion.now * 0.0085) * 2.2 : 0;
    const baseBias = motion && motion.isRunning ? -10 : Math.max(-9, Math.min(9, -vx * 0.032));
    const runBias = Math.max(-22, Math.min(18, baseBias + whip * 0.85));
    return { sw, vx, whip, flutter, runBias };
  }

  // =========================================================================
  // TẦNG 1: VẼ PHÍA SAU NHÂN VẬT (Đằng sau chân & thân)
  // =========================================================================
  drawBackLayers(ctx, jt, st, motion) {
    const isSolid = !!(st && st._solid);
    const { H, sh, d, pp } = jt;
    const { sw, flutter, runBias } = this._motionMetrics(motion);
    const wind = sw * 0.75 + runBias + flutter * 0.5;
    const P = (orig, x, y) => this._bodyPt(jt, orig, x, y);

    // 0. Tạo hình đặc biệt Skin Chí Tôn Phẩm: Đuôi Chó Trắng (Chó Đội Nón) & Áo Trùm Đỏ Thần Trùng
    if (st.dogTail) {
      const tWag = Math.sin(((motion && motion.now) || 0) * 0.012) * 3.8 + sw * 0.35;
      const tBase = P(H, -8.5, 1.5);
      const tMid = P(H, -22.5 + wind * 0.45, 9.0 + tWag * 0.4);
      const tTip = P(H, -30.5 + wind * 0.75, 22.0 + tWag);
      ctx.fillStyle = this._c(st, '#f1f5f9');
      ctx.beginPath();
      ctx.moveTo(tBase[0], tBase[1]);
      ctx.quadraticCurveTo(tMid[0] - 4, tMid[1] - 4, tTip[0], tTip[1]);
      ctx.quadraticCurveTo(tMid[0] + 6, tMid[1] + 5, tBase[0], tBase[1] - 7);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tBase[0] - 3, tBase[1] - 2);
        ctx.quadraticCurveTo(tMid[0] + 1, tMid[1], tTip[0] + 2, tTip[1] - 2);
        ctx.stroke();
      }
    }

    if (st.serpentTail) {
      const tWave = Math.sin(((motion && motion.now) || 0) * 0.011) * 5.2 + sw * 0.45;
      const tBase = P(H, -7.5, 2.0);
      const tMid1 = P(H, -24.0 + wind * 0.45, 8.5 + tWave * 0.45);
      const tMid2 = P(H, -40.0 + wind * 0.72, -3.5 - tWave * 0.5);
      const tTip = P(H, -54.0 + wind * 0.95, 7.5 + tWave);
      ctx.fillStyle = this._c(st, st.gi || '#0f766e');
      ctx.beginPath();
      ctx.moveTo(tBase[0], tBase[1] - 5.5);
      ctx.bezierCurveTo(tMid1[0], tMid1[1] - 5.5, tMid2[0], tMid2[1] - 4.0, tTip[0], tTip[1]);
      ctx.bezierCurveTo(tMid2[0], tMid2[1] + 5.5, tMid1[0], tMid1[1] + 6.5, tBase[0], tBase[1] + 5.5);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#042f2e'; ctx.lineWidth = 1.25; ctx.stroke();
        // Vây đỏ dọc sống lưng đuôi Thuồng Luồng
        ctx.fillStyle = '#dc2626';
        for (let k = 0; k < 4; k++) {
          const u = 0.22 + k * 0.2;
          const fx = tBase[0] + (tTip[0] - tBase[0]) * u;
          const fy = tBase[1] + (tTip[1] - tBase[1]) * u - 3.5;
          ctx.beginPath();
          ctx.moveTo(fx - 3.5, fy + 2);
          ctx.lineTo(fx - 6.5, fy - 6.5);
          ctx.lineTo(fx + 2.5, fy + 1);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    if (st.serpentSpines) {
      // Mũ trùm / cổ áo vây đỏ Thuồng Luồng dựng sau gáy và vai
      const colL = P(sh, -12.5, 4.0);
      const colTop = P(sh, -18.5 + wind * 0.35, 19.0);
      const colR = P(sh, 5.5, 6.0);
      ctx.fillStyle = this._c(st, '#0b4f52');
      ctx.beginPath();
      ctx.moveTo(colL[0], colL[1]);
      ctx.quadraticCurveTo(colTop[0] - 4, colTop[1], colR[0] - 6, colTop[1] - 4);
      ctx.lineTo(colR[0], colR[1]);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#042f2e'; ctx.lineWidth = 1.1; ctx.stroke();
        // Gai vây đỏ rực viền cổ áo Thuồng Luồng
        ctx.fillStyle = '#ef4444';
        for (let s = 0; s < 3; s++) {
          const sx = colL[0] - 2 - s * 3.5;
          const sy = colL[1] - 5 - s * 5.0;
          ctx.beginPath();
          ctx.moveTo(sx + 2, sy + 3);
          ctx.lineTo(sx - 7, sy - 4);
          ctx.lineTo(sx + 3, sy - 2);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    if (st.nguTinhTail) {
      const fWave = Math.sin(((motion && motion.now) || 0) * 0.011) * 5.0 + sw * 0.42;
      const tBase = P(H, -7.2, 2.5);
      const tMid1 = P(H, -23.0 + wind * 0.45, 7.5 + fWave * 0.45);
      const tMid2 = P(H, -39.5 + wind * 0.75, -4.0 - fWave * 0.45);
      const tTip = P(H, -55.0 + wind * 0.95, 6.0 + fWave);
      // Thân đuôi Ngư Tinh vảy trắng bạc ngọc trai
      ctx.fillStyle = this._c(st, st.gi || '#e2e8f0');
      ctx.beginPath();
      ctx.moveTo(tBase[0], tBase[1] - 5.2);
      ctx.bezierCurveTo(tMid1[0], tMid1[1] - 5.2, tMid2[0], tMid2[1] - 4.0, tTip[0], tTip[1]);
      ctx.bezierCurveTo(tMid2[0], tMid2[1] + 5.2, tMid1[0], tMid1[1] + 6.0, tBase[0], tBase[1] + 5.2);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.2; ctx.stroke();
        // Màng vây lưng tím hồng rực rỡ dọc sống trên đuôi
        ctx.fillStyle = '#c084fc';
        for (let k = 0; k < 4; k++) {
          const u = 0.2 + k * 0.21;
          const fx = tBase[0] + (tTip[0] - tBase[0]) * u;
          const fy = tBase[1] + (tTip[1] - tBase[1]) * u - 3.5;
          ctx.beginPath();
          ctx.moveTo(fx - 3.5, fy + 2);
          ctx.lineTo(fx - 7.0, fy - 7.5);
          ctx.lineTo(fx + 3.0, fy + 1);
          ctx.closePath();
          ctx.fill();
        }
        // Hàng chân xương / gai rết nâu vàng đặc trưng phía bụng đuôi Ngư Tinh
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        for (let r = 0; r < 5; r++) {
          const u = 0.16 + r * 0.18;
          const rx = tBase[0] + (tTip[0] - tBase[0]) * u;
          const ry = tBase[1] + (tTip[1] - tBase[1]) * u + 3.8;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4.5, ry + 6.5);
          ctx.stroke();
        }
      }
    }

    if (st.nguTinhFin) {
      // Mào vây tím hồng rực sau vai & cổ áo + lá bùa vàng cổ Ngư Tinh
      const cL = P(sh, -12.0, 3.5);
      const cTop = P(sh, -18.5 + wind * 0.35, 19.5);
      const cR = P(sh, 5.0, 5.5);
      ctx.fillStyle = this._c(st, '#9333ea');
      ctx.beginPath();
      ctx.moveTo(cL[0], cL[1]);
      ctx.quadraticCurveTo(cTop[0] - 4, cTop[1], cR[0] - 6, cTop[1] - 3);
      ctx.lineTo(cR[0], cR[1]);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 1.15; ctx.stroke();
        ctx.fillStyle = '#c084fc';
        for (let s = 0; s < 3; s++) {
          const sx = cL[0] - 2 - s * 3.6;
          const sy = cL[1] - 5 - s * 5.2;
          ctx.beginPath();
          ctx.moveTo(sx + 2, sy + 3);
          ctx.lineTo(sx - 8, sy - 4.5);
          ctx.lineTo(sx + 3, sy - 2);
          ctx.closePath();
          ctx.fill();
        }
        if (st.nguTinhTalisman) {
          const tp = P(sh, -14.5 + wind * 0.45, -1.5);
          ctx.save();
          ctx.translate(tp[0], tp[1]);
          ctx.rotate(-0.18 + wind * 0.012);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(-3.2, -10.5, 6.4, 15);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(0, -8); ctx.lineTo(0, 2.5);
          ctx.moveTo(-1.8, -4.5); ctx.lineTo(1.8, -3.5);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    if (st.thanTrungHood) {
      const shL = P(sh, -13.5, 2.0), shR = P(sh, 10.5, 2.0);
      const cBotL = P(H, -28.0 + wind * 1.15, -39.0);
      const cBotM = P(H, -9.0 + wind * 0.85, -36.5);
      const cBotR = P(H, 11.5 + wind * 0.55, -38.0);
      const cloakBase = st.coatColor || '#09090d';
      const trimCol = st.coatTrim || '#a855f7';
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', shL[0], shL[1], cBotL[0], cBotL[1], cloakBase, false);
      ctx.beginPath();
      ctx.moveTo(shL[0], shL[1]);
      ctx.lineTo(shR[0], shR[1]);
      ctx.quadraticCurveTo(shR[0] + 4.5, (shR[1] + cBotR[1]) * 0.5, cBotR[0], cBotR[1]);
      ctx.quadraticCurveTo(cBotM[0], cBotM[1] + 5.0, cBotL[0], cBotL[1]);
      ctx.quadraticCurveTo(shL[0] - 9.5 + wind * 0.5, (shL[1] + cBotL[1]) * 0.5, shL[0], shL[1]);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 1.25; ctx.stroke();
        ctx.strokeStyle = trimCol; ctx.lineWidth = 1.35;
        ctx.beginPath();
        ctx.moveTo(cBotL[0] + 2, cBotL[1] - 1);
        ctx.quadraticCurveTo(cBotM[0], cBotM[1] + 4.0, cBotR[0] - 2, cBotR[1] - 1);
        ctx.stroke();

        // Nâng cấp Thần Trùng: Chùm lông quạ đen ánh tím bay phất phơ ở gấu áo & Linh Quạ Hộ Vệ sau vai!
        if (st.thanTrungFeathers) {
          for (let f = 0; f < 4; f++) {
            const u = f / 3;
            const fx = cBotL[0] + (cBotR[0] - cBotL[0]) * u;
            const fy = cBotL[1] + (cBotR[1] - cBotL[1]) * u;
            const fw = Math.sin(((motion && motion.now) || 0) * 0.012 + f * 1.4) * 3.2;
            ctx.fillStyle = '#09090b';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(fx - 2.2, fy);
            ctx.lineTo(fx - 4.5 + wind * 0.25 + fw, fy + 8.5);
            ctx.lineTo(fx + 2.2, fy + 1.5);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
          }
        }
        if (st.thanTrungCrowFamiliar) {
          const tNow = (motion && motion.now) || 0;
          const hoverY = Math.sin(tNow * 0.008) * 3.4;
          const flap = Math.sin(tNow * 0.022) * 5.2;
          const cp = P(sh, -18.5 + wind * 0.28, 12.5 + hoverY);
          ctx.save();
          ctx.translate(cp[0], cp[1]);
          ctx.fillStyle = '#09090b';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.ellipse(0, 0, 7.2, 4.0, -0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-2, -1); ctx.lineTo(-11, -9 + flap); ctx.lineTo(-1, -4);
          ctx.moveTo(1, -2); ctx.lineTo(-4, -10 - flap * 0.6); ctx.lineTo(4, -3);
          ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(11, -0.5); ctx.lineTo(6, 1.5); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#e879f9';
          ctx.beginPath(); ctx.arc(5.2, -1.5, 1.1, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
    }

    // 1. Nón lá / Nón đan sơn cước đeo chéo sau lưng (Phó Đặng Hoàng Anh — đặt nghiêng sau vai, không che gáy)
    if (st.taoistQuiver) {
      // Bao kiếm đeo chéo sau lưng + ống thẻ tre tà đạo (Châu Ngọc Thiên Khánh)
      const qA = P(sh, -11.5, 4.5), qB = P(H, 6.0, -8.5);
      ctx.fillStyle = isSolid ? st._solid : '#292524';
      ctx.strokeStyle = isSolid ? st._solid : '#78350f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(qA[0] - 2.6, qA[1]); ctx.lineTo(qA[0] + 2.6, qA[1]);
      ctx.lineTo(qB[0] + 2.0, qB[1]); ctx.lineTo(qB[0] - 2.0, qB[1]);
      ctx.closePath(); ctx.fill(); if (!isSolid) ctx.stroke();
      if (!isSolid) {
        // Đốc kiếm ló trên vai & tua tím đặc trưng
        ctx.strokeStyle = '#1e1b4b'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(qA[0], qA[1]); ctx.lineTo(qA[0] - 4.5, qA[1] - 7.5); ctx.stroke();
        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(qA[0] - 4.5, qA[1] - 7.5); ctx.quadraticCurveTo(qA[0] - 7.5 + sw * 0.25, qA[1] - 2.0, qA[0] - 9.2 + sw * 0.35, qA[1] + 2.5); ctx.stroke();
        // Ống thẻ tre bên hông/lưng
        const tC = P(sh, -9.2, -6.5);
        ctx.fillStyle = '#57534e';
        for (let k = -2; k <= 2; k += 2) {
          ctx.fillRect(tC[0] + k - 1.2, tC[1] - 6, 1.5, 10);
        }
      }
    }

    if (st.wovenHat) {
      const hC = P(sh, -12.8, -4.8);
      const tilt = Math.atan2(d[0], -d[1]) - 0.52;
      ctx.save();
      ctx.translate(hC[0], hC[1]);
      ctx.rotate(tilt);
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', -15, -12, 15, 12, '#a38046', false);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14.5, 17.8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#3f2c12'; ctx.lineWidth = 1.65; ctx.stroke();
        // Vành đan trúc đồng tâm tạo chiều sâu nón nón nghiêng
        ctx.strokeStyle = 'rgba(74, 53, 24, 0.58)'; ctx.lineWidth = 0.9;
        for (const r of [13.5, 9.8, 6.2]) {
          ctx.beginPath(); ctx.ellipse(-1.4, 0, r * 0.80, r, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(63, 44, 18, 0.52)'; ctx.lineWidth = 0.72;
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI * 2) / 10;
          ctx.beginPath();
          ctx.moveTo(-2.6, 0);
          ctx.lineTo(Math.cos(a) * 13.8, Math.sin(a) * 17.0);
          ctx.stroke();
        }
        // Chóp nón đan sẫm
        ctx.fillStyle = '#5c401c';
        ctx.beginPath(); ctx.arc(-2.6, 0, 2.7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // 2. Áo khoác măng-tô khoác hờ trên vai + lót lụa đỏ thêu rồng vàng + 2 tay áo rủ (Phó Văn Anh, Hứa Vũ Đại)
    if (st.drapedOvercoat) {
      const rig = st.rig || {};
      const shW = rig.shW || 13.4;
      const len = st.archetype === 'patriarch_draped_suit' ? 37 : 38;
      const topL = P(sh, -shW - 3.0, 2.0);
      const topR = P(sh, shW + 2.0, 2.0);
      const waistL = P(H, -shW * 0.80 + wind * 0.16, 1.5);
      const waistR = P(H, shW * 0.80 + wind * 0.12, 1.5);
      const botL = P(H, -shW - 7.8 + wind * 1.15, -len + 3.0);
      const botVL = P(H, -4.2 + wind * 0.72, -len + 1.5);
      const botM = P(H, -1.0 + wind * 0.52, -len + 9.2);
      const botVR = P(H, 2.6 + wind * 0.48, -len + 2.2);
      const botR = P(H, shW + 4.8 + wind * 0.42, -len + 5.5);

      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', topL[0], topL[1], botL[0], botL[1], st.coatColor || '#14171f', false);
      ctx.beginPath();
      ctx.moveTo(topL[0], topL[1]);
      ctx.lineTo(topR[0], topR[1]);
      ctx.quadraticCurveTo(waistR[0] + 1.5, waistR[1], botR[0], botR[1]);
      ctx.lineTo(botVR[0], botVR[1]);
      ctx.lineTo(botM[0], botM[1]);
      ctx.lineTo(botVL[0], botVL[1]);
      ctx.lineTo(botL[0], botL[1]);
      ctx.quadraticCurveTo(waistL[0] - 2.0, waistL[1], topL[0], topL[1]);
      ctx.closePath();
      ctx.fill();

      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.72)'; ctx.lineWidth = 1.3; ctx.stroke();
        // Mảng lớp lót lụa đỏ sẫm thêu rồng hai vạt mở dưới thắt lưng
        const linL1 = P(H, -shW - 3.4 + wind * 0.45, -1);
        const linL2 = P(H, -shW - 6.2 + wind * 1.0, -len + 5.5);
        const linL3 = P(H, -4.4 + wind * 0.7, -len + 4.2);
        const linL4 = P(H, -4.2, -1);
        const silkL = this._materialFill(ctx, st, 'silk', linL1[0], linL1[1], linL2[0], linL2[1], st.liningColor || '#7f1d1d', false);
        ctx.fillStyle = silkL;
        ctx.beginPath();
        ctx.moveTo(linL1[0], linL1[1]); ctx.lineTo(linL2[0], linL2[1]);
        ctx.lineTo(linL3[0], linL3[1]); ctx.lineTo(linL4[0], linL4[1]);
        ctx.closePath(); ctx.fill();

        const linR1 = P(H, 4.2, -1);
        const linR2 = P(H, shW + 2.4 + wind * 0.35, -1);
        const linR3 = P(H, shW + 3.6 + wind * 0.42, -len + 7.2);
        const linR4 = P(H, 3.8 + wind * 0.44, -len + 4.8);
        ctx.fillStyle = this._materialFill(ctx, st, 'silk', linR1[0], linR1[1], linR3[0], linR3[1], st.liningColor || '#7f1d1d', false);
        ctx.beginPath();
        ctx.moveTo(linR1[0], linR1[1]); ctx.lineTo(linR2[0], linR2[1]);
        ctx.lineTo(linR3[0], linR3[1]); ctx.lineTo(linR4[0], linR4[1]);
        ctx.closePath(); ctx.fill();

        // Hoa văn rồng vàng chạm mờ tự nhiên trên vạt lót lụa đỏ
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.54)'; ctx.lineWidth = 1.05; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(linL2[0] + 3.5, linL2[1] - 4);
        ctx.bezierCurveTo(linL2[0] + 7, linL2[1] - 11, linL3[0] - 4.5, linL3[1] - 18, linL3[0] - 1.5, linL3[1] - 25);
        ctx.moveTo(linR3[0] - 3.5, linR3[1] - 4);
        ctx.bezierCurveTo(linR3[0] - 5.5, linR3[1] - 12, linR4[0] + 3.5, linR4[1] - 18, linR4[0] + 2.5, linR4[1] - 24);
        ctx.stroke();

        // Viền mép áo khoác xẻ tà đuôi én thanh thoát (KHÔNG dùng vạch neon vàng dày cộm)
        const trimTone = st.archetype === 'patriarch_draped_suit' ? '#64748b' : 'rgba(202, 138, 4, 0.62)';
        ctx.strokeStyle = trimTone; ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(topL[0], topL[1]);
        ctx.quadraticCurveTo(waistL[0] - 2.0, waistL[1], botL[0], botL[1]);
        ctx.lineTo(botVL[0], botVL[1]);
        ctx.lineTo(botM[0], botM[1]);
        ctx.lineTo(botVR[0], botVR[1]);
        ctx.lineTo(botR[0], botR[1]);
        ctx.stroke();

        // Nếp gấp lưng áo dọc xuống gấu
        this._drawFoldCluster(ctx, st, [
          [topL[0] + 4, (topL[1] + botL[1]) * 0.45, botL[0] + 6, botL[1] - 5],
          [botM[0], (topR[1] + botR[1]) * 0.55, botM[0], botM[1] - 3]
        ], 'rgba(255,255,255,0.14)', 0.9);

        // Tay áo măng-tô rỗng phía xa buông rủ hướng ra ngoài (không chắn ngang ngực)
        const fS = jt.fSh;
        const sideF = fS[0] >= sh[0] ? 1 : -1;
        const slTip = [fS[0] + pp[0] * 10.5 * sideF + wind * 0.45, fS[1] + 30.0];
        ctx.fillStyle = this._materialFill(ctx, st, 'fabric', fS[0], fS[1], slTip[0], slTip[1], st.coatD || '#0b0e16', true);
        ctx.beginPath();
        ctx.moveTo(fS[0] - 2.4 * sideF, fS[1] - 1.5);
        ctx.quadraticCurveTo(fS[0] + 11.0 * sideF + wind * 0.2, fS[1] + 15, slTip[0] + 3.4 * sideF, slTip[1]);
        ctx.lineTo(slTip[0] - 4.4 * sideF, slTip[1] - 1.5);
        ctx.quadraticCurveTo(fS[0] + 3.0 * sideF, fS[1] + 13, fS[0] - 2.8 * sideF, fS[1] + 2.5);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.68)'; ctx.lineWidth = 1.05; ctx.stroke();
        if (st.cuffRedEmbroidery) {
          ctx.fillStyle = '#881337';
          ctx.beginPath();
          ctx.moveTo(slTip[0] - 3.4, slTip[1] - 4.2);
          ctx.lineTo(slTip[0] + 4.6, slTip[1] - 5.2);
          ctx.lineTo(slTip[0] + 4.8, slTip[1] - 1.5);
          ctx.lineTo(slTip[0] - 3.6, slTip[1]);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#eab308'; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      return;
    }

    // 3. Áo Trench Coat công nghệ cao xẻ hai tà dài bay sau viền chỉ bạc mảnh (Phó Tiến Đăng)
    if (st.cyberTrench) {
      const wL = P(H, -10.5, 2.5), wR = P(H, 9.8, 2.5);
      const bTailOut = P(H, -25.0 + wind * 1.15, -35.5);
      const bTailIn  = P(H, -6.5 + wind * 0.85, -31.5);
      const fTailOut = P(H, 18.0 + wind * 0.65, -34.0);
      const fTailIn  = P(H, 4.5 + wind * 0.55, -29.5);
      const trim = this._c(st, st.coatTrim || '#cbd5e1');

      // Tà xẻ sau (phụ, đậm chiều sâu)
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', wL[0], wL[1], bTailOut[0], bTailOut[1], st.coatD || '#0b101b', true);
      ctx.beginPath();
      ctx.moveTo(wL[0], wL[1]);
      ctx.quadraticCurveTo(wL[0] - 10 + wind * 0.5, wL[1] + 15, bTailOut[0], bTailOut[1]);
      ctx.lineTo(bTailIn[0], bTailIn[1]);
      ctx.lineTo(P(H, -1, 0)[0], P(H, -1, 0)[1]);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.72)'; ctx.lineWidth = 1.15; ctx.stroke();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.1; ctx.stroke();
      }
      // Tà xẻ chính bay đối xứng với viền bạc kỹ thuật
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', wR[0], wR[1], fTailOut[0], fTailOut[1], st.coatColor || '#131a29', false);
      ctx.beginPath();
      ctx.moveTo(wR[0], wR[1]);
      ctx.quadraticCurveTo(wR[0] + 7 + wind * 0.3, wR[1] + 16, fTailOut[0], fTailOut[1]);
      ctx.lineTo(fTailIn[0], fTailIn[1]);
      ctx.lineTo(P(H, 2.5, 0)[0], P(H, 2.5, 0)[1]);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.72)'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.strokeStyle = trim; ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(wR[0] - 0.5, wR[1] + 1);
        ctx.quadraticCurveTo(wR[0] + 6.5 + wind * 0.3, wR[1] + 16, fTailOut[0], fTailOut[1]);
        ctx.lineTo(fTailIn[0], fTailIn[1]);
        ctx.stroke();
        this._drawFoldCluster(ctx, st, [[wL[0] - 3, wL[1] + 8, bTailOut[0] + 5, bTailOut[1] - 6]], 'rgba(255,255,255,0.12)', 0.9);
      }
      return;
    }

    // 4. Áo choàng chiến tướng đỏ thắm viền vàng chạm hoa văn dài chấm bắp chân (Triệu Đình An)
    if (st.cape && st.armor) {
      const shL = P(sh, -13.5, 1.5), shR = P(sh, 11.5, 1.5);
      const cBotL = P(H, -27.5 + wind * 1.15, -40.5);
      const cBotM = P(H, -8.5 + wind * 0.85, -37.5);
      const cBotR = P(H, 12.0 + wind * 0.55, -39.5);
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', shL[0], shL[1], cBotL[0], cBotL[1], '#7f1d1d', false);
      ctx.beginPath();
      ctx.moveTo(shL[0], shL[1]);
      ctx.lineTo(shR[0], shR[1]);
      ctx.quadraticCurveTo(shR[0] + 4.5, (shR[1] + cBotR[1]) * 0.5, cBotR[0], cBotR[1]);
      ctx.quadraticCurveTo(cBotM[0], cBotM[1] + 5.5, cBotL[0], cBotL[1]);
      ctx.quadraticCurveTo(shL[0] - 9 + wind * 0.5, (shL[1] + cBotL[1]) * 0.5, shL[0], shL[1]);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.68)'; ctx.lineWidth = 1.25; ctx.stroke();
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1.65;
        ctx.beginPath();
        ctx.moveTo(cBotL[0] + 2, cBotL[1] - 1);
        ctx.quadraticCurveTo(cBotM[0], cBotM[1] + 4.5, cBotR[0] - 2, cBotR[1] - 1);
        ctx.stroke();
        // Hoa văn phụng hoàng chìm dọc gấu & nếp gấp áo choàng
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.48)'; ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(cBotL[0] + 4, cBotL[1] - 4);
        ctx.quadraticCurveTo(cBotM[0], cBotM[1] + 0.5, cBotR[0] - 4, cBotR[1] - 4);
        ctx.stroke();
        this._drawFoldCluster(ctx, st, [
          [shL[0] - 2, shL[1] + 15, cBotL[0] + 7, cBotL[1] - 12, cBotL[0] + 6, cBotL[1] - 2]
        ], 'rgba(0,0,0,0.36)', 1.15);
      }
    }

    // 5. Tà áo bào sau đa tầng & hai dải lụa bay (Ngô Giang Mạnh)
    if (st.wideSleeves && st.robe) {
      const wL = P(H, -11.5, 2.5), wR = P(H, 11.5, 2.5);
      const rTailL = P(H, -24.0 + wind * 1.1, -35.5);
      const rTailR = P(H, 19.0 + wind * 0.6, -33.5);
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'silk', wL[0], wL[1], rTailL[0], rTailL[1], st.giD || '#11223a', false);
      ctx.beginPath();
      ctx.moveTo(wL[0], wL[1]);
      ctx.quadraticCurveTo(wL[0] - 9 + wind * 0.4, wL[1] + 16, rTailL[0], rTailL[1]);
      ctx.lineTo(P(H, -3.5 + wind * 0.6, -31.5)[0], P(H, -3.5 + wind * 0.6, -31.5)[1]);
      ctx.lineTo(P(H, 4.5 + wind * 0.4, -29.5)[0], P(H, 4.5 + wind * 0.4, -29.5)[1]);
      ctx.lineTo(rTailR[0], rTailR[1]);
      ctx.quadraticCurveTo(wR[0] + 5 + wind * 0.2, wR[1] + 16, wR[0], wR[1]);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(rTailL[0] + 1, rTailL[1] - 1);
        ctx.lineTo(P(H, -3.5 + wind * 0.6, -31.5)[0], P(H, -3.5 + wind * 0.6, -31.5)[1] - 1);
        ctx.moveTo(P(H, 4.5 + wind * 0.4, -29.5)[0], P(H, 4.5 + wind * 0.4, -29.5)[1] - 1);
        ctx.lineTo(rTailR[0] - 1, rTailR[1] - 1);
        ctx.stroke();
        // Hai dải lụa xanh băng-bạc bay phía sau hông
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wL[0] + 1, wL[1] + 1);
        ctx.quadraticCurveTo(wL[0] - 13 + wind * 0.8, wL[1] + 9, wL[0] - 25 + wind * 1.35, wL[1] + 16 + flutter);
        ctx.stroke();
      }
    }

    // 6. Hai dải khăn choàng cổ đỏ huyết bay dài sóng lượn mềm mại (Phó Dung Hải)
    if (st.crimsonScarf) {
      const neckAnchor = P(sh, -3.2, 2.2);
      const wWave = Math.sin((motion ? motion.now : 0) * 0.01) * 3.8;
      const tailLen1 = 38 + Math.abs(runBias) * 1.4;
      const tailLen2 = 30 + Math.abs(runBias) * 1.1;

      const drawTail = (lenT, yRise, width, colBase, dark) => {
        const endPt = [neckAnchor[0] - lenT + wind * 0.55, neckAnchor[1] + yRise + wWave * 0.75];
        const c1 = [neckAnchor[0] - lenT * 0.34 + wind * 0.2, neckAnchor[1] + yRise * 0.2 - wWave * 0.5];
        const c2 = [neckAnchor[0] - lenT * 0.72 + wind * 0.45, neckAnchor[1] + yRise * 0.75 + wWave * 0.6];
        ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', neckAnchor[0], neckAnchor[1], endPt[0], endPt[1], colBase, dark);
        ctx.beginPath();
        ctx.moveTo(neckAnchor[0], neckAnchor[1] - width * 0.48);
        ctx.bezierCurveTo(c1[0], c1[1] - width * 0.65, c2[0], c2[1] - width * 0.35, endPt[0], endPt[1] - 1.5);
        ctx.lineTo(endPt[0] - 3.8, endPt[1] + 2.4);
        ctx.bezierCurveTo(c2[0], c2[1] + width * 0.42, c1[0], c1[1] + width * 0.5, neckAnchor[0], neckAnchor[1] + width * 0.48);
        ctx.closePath();
        ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.52)'; ctx.lineWidth = 1.0; ctx.stroke();
          this._drawFoldCluster(ctx, st, [[neckAnchor[0] - 4, neckAnchor[1], c1[0], c1[1], endPt[0] + 4, endPt[1]]], '#7f1d1d', 0.85);
        }
      };
      drawTail(tailLen1, -10.5, 6.8, st.scarfColor || '#b91c1c', false);
      drawTail(tailLen2, -1.0, 5.2, st.scarfD || '#881337', true);
    }

    // 7. Dự phòng cho nhân vật/quái dùng flag coat hoặc cape cũ (Long Vương, Vĩnh Tâm...)
    if (st.coat && !st.drapedOvercoat && !st.cyberTrench) {
      const cA = P(sh, -10.5, 1), cB = P(sh, 10.5, 1);
      const cC = P(H, 10.5 + wind * 0.3, -29), cD = P(H, -12.5 + wind * 0.7, -30);
      ctx.fillStyle = this._c(st, st.coatColor || '#1e293b');
      ctx.beginPath();
      ctx.moveTo(cA[0], cA[1]); ctx.lineTo(cB[0], cB[1]); ctx.lineTo(cC[0], cC[1]); ctx.lineTo(cD[0], cD[1]);
      ctx.closePath(); ctx.fill();
      if (!isSolid && st.coatTrim) {
        ctx.strokeStyle = st.coatTrim; ctx.lineWidth = 1.3; ctx.stroke();
      }
    } else if (st.cape && !st.armor && !st.drapedOvercoat) {
      const cA = P(sh, -10, 0), cB = P(sh, 10, 0);
      const cC = P(H, 8 + wind * 0.4, -27), cD = P(H, -19 + wind * 0.85, -28);
      ctx.fillStyle = this._c(st, st.coatColor || '#090d16');
      ctx.beginPath();
      ctx.moveTo(cA[0], cA[1]); ctx.lineTo(cB[0], cB[1]); ctx.lineTo(cC[0], cC[1]); ctx.lineTo(cD[0], cD[1]);
      ctx.closePath(); ctx.fill();
      if (!isSolid && st.liningColor) {
        ctx.strokeStyle = st.liningColor; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
  }

  // Helper vẽ khối giáp vảy rồng/cá xếp tầng điêu khắc 3D cho Tướng Quân (Triệu Đình An)
  _drawScaleTasset(ctx, st, pts, fillBase, trimCol, farSide) {
    const isSolid = !!(st && st._solid);
    const [p1, p2, p3, p4] = pts;
    ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'metal', p1[0], p1[1], p3[0], p3[1], fillBase, farSide);
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]);
    ctx.closePath(); ctx.fill();
    if (isSolid) return;

    // Hàng vảy giáp xếp lớp bên trong tasset
    ctx.save();
    ctx.clip();
    ctx.fillStyle = farSide ? '#450a0a' : '#7f1d1d';
    ctx.strokeStyle = farSide ? '#b45309' : '#eab308';
    ctx.lineWidth = 0.85;
    for (let r = 0; r < 4; r++) {
      const tr = (r + 0.35) / 4;
      for (let c = 0; c < 4; c++) {
        const tc = (c + (r % 2 ? 0.65 : 0.25)) / 4;
        const ax = p1[0] + (p2[0] - p1[0]) * tc;
        const ay = p1[1] + (p2[1] - p1[1]) * tc;
        const bx = p4[0] + (p3[0] - p4[0]) * tc;
        const by = p4[1] + (p3[1] - p4[1]) * tc;
        const sx = ax + (bx - ax) * tr;
        const sy = ay + (by - ay) * tr;
        ctx.beginPath(); ctx.arc(sx, sy, 2.35, 0, Math.PI); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();

    ctx.strokeStyle = trimCol; ctx.lineWidth = 1.65;
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 0.8; ctx.stroke();
  }

  // =========================================================================
  // TẦNG 2: VẠT ÁO XẺ TÀ, GIÁP ĐÙI & NGỌC BỘI (Trên thắt lưng / phủ lên hông)
  // =========================================================================
  drawHipSkirtAndTassets(ctx, jt, st, motion) {
    const isSolid = !!(st && st._solid);
    const { H } = jt;
    const { sw, runBias } = this._motionMetrics(motion);
    const P = (x, y) => this._bodyPt(jt, H, x, y);
    const arch = st.archetype;

    // A. Triệu Đình An: Giáp đùi 3 mảng vảy cá xếp tầng đỏ-vàng (Tassets) & khố giáp chạm vàng
    if (st.armor && arch === 'phoenix_general') {
      const drawTasset = (x0, x1, tiltSway, farSide) => {
        const p1 = P(x0, -1), p2 = P(x1, -1);
        const p3 = P(x1 + Math.sign(x1 || 1) * 1.6 + tiltSway * 0.25, -17.5);
        const p4 = P(x0 + Math.sign(x0 || -1) * 1.4 + tiltSway * 0.25, -17.5);
        this._drawScaleTasset(ctx, st, [p1, p2, p3, p4], '#991b1b', '#eab308', farSide);
      };
      drawTasset(-11.8, -2.0, sw * 0.22, true);
      drawTasset(2.0, 11.8, sw * 0.22, false);
      // Khố giáp trung tâm chạm vàng đỉnh nhọn
      const c1 = P(-4.5, -1), c2 = P(4.5, -1), c3 = P(3.8, -16.5), c4 = P(0, -19.2), c5 = P(-3.8, -16.5);
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'metal', c1[0], c1[1], c3[0], c4[1], '#7f1d1d', false);
      ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]); ctx.lineTo(c4[0], c4[1]); ctx.lineTo(c5[0], c5[1]); ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.stroke();
        this._drawFoldCluster(ctx, st, [
          [c1[0] + 1.5, c1[1] - 4, c2[0] - 1.5, c2[1] - 4],
          [c5[0] + 1, c5[1] + 5, c3[0] - 1, c3[1] + 5]
        ], '#fef08a', 0.9);
      }
      return;
    }

    // B. Ngô Giang Mạnh: Vạt Đạo Bào Xẻ Nhiều Lớp Viền Bạc & Ngọc Bội Tua Rua Lụa Bạc
    if (arch === 'patriarch_sword_robe') {
      const swayX = sw * 0.35 + runBias * 0.22;
      const drawRobeFlap = (side, wide, drop, colHex, farSide) => {
        const s = side;
        const p1 = P(s * 1.0, -1), p2 = P(s * wide, -1);
        const p3 = P(s * (wide + 4.2) + swayX, -drop), p4 = P(s * 3.0 + swayX * 0.6, -drop - 2.5);
        ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'silk', p1[0], p1[1], p3[0], p3[1], colHex, farSide);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]);
        ctx.closePath(); ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.62)'; ctx.lineWidth = 1.0; ctx.stroke();
          ctx.strokeStyle = farSide ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 2.0;
          ctx.beginPath(); ctx.moveTo(p2[0], p2[1] - 2); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.stroke();
          ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 0.75;
          ctx.beginPath(); ctx.moveTo(p4[0], p4[1] + 2); ctx.lineTo(p3[0], p3[1] + 2); ctx.stroke();
        }
      };
      drawRobeFlap(-1, 11.2, 26.5, '#13243d', true);
      drawRobeFlap(1, 11.4, 25.5, '#1e3a5f', false);
      // Tà trước hẹp xanh xám đậm thêu hoa văn cuối vạt
      const m1 = P(-4.5, -1), m2 = P(5.2, -1), m3 = P(6.5 + swayX * 0.7, -27.5), m4 = P(-5.4 + swayX * 0.7, -27.5);
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'silk', m1[0], m1[1], m3[0], m3[1], '#17253b', false);
      ctx.beginPath(); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.lineTo(m3[0], m3[1]); ctx.lineTo(m4[0], m4[1]); ctx.closePath(); ctx.fill();
      if (!isSolid) { ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke(); }

      // Ngọc bội bạc & chùm tua rua lụa trắng rủ trước hông
      const j0 = P(1.6, -1.5);
      const j1 = P(1.6 + sw * 0.45, -18.0);
      if (!isSolid) {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath(); ctx.arc(j0[0], j0[1] - 2.5, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(j0[0], j0[1] - 2.5, 1.0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(j0[0], j0[1] - 4.5); ctx.quadraticCurveTo(j0[0] + sw * 0.2, (j0[1] + j1[1]) * 0.5, j1[0], j1[1]); ctx.stroke();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(j1[0] - 1.5, j1[1] - 1); ctx.lineTo(j0[0], j0[1] - 5.5);
        ctx.moveTo(j1[0] + 1.5, j1[1] - 1); ctx.lineTo(j0[0], j0[1] - 5.5);
        ctx.stroke();
      } else {
        ctx.strokeStyle = st._solid; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(j0[0], j0[1] - 4); ctx.lineTo(j1[0], j1[1]); ctx.stroke();
      }
      return;
    }

    // B2. Vạt tà Đạo Bào Đỏ Huyết Đạo Tà (Châu Ngọc Thiên Khánh: vạt đỏ rách xẻ tà + đai đen + bầu hồ lô đồng)
    if (arch === 'crimson_coin_taoist') {
      const flare = sw * 0.34 + runBias * 0.22;
      const drawRobeWing = (x0, x1, col, dropY, farSide) => {
        const p1 = P(x0, -1), p2 = P(x1, -1);
        const p3 = P(x1 + Math.sign(x1 || 1) * 3.8 + flare, dropY);
        const p4 = P(x0 + Math.sign(x0 || 1) * 1.4 + flare * 0.65, dropY + 1.5);
        ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', p1[0], p1[1], p3[0], p3[1], col, farSide);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.lineTo((p3[0] + p4[0]) * 0.5, (p3[1] + p4[1]) * 0.5 - 2.6);
        ctx.lineTo(p4[0], p4[1]);
        ctx.closePath(); ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.05; ctx.stroke();
          ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(p4[0], p4[1]); ctx.lineTo(p3[0], p3[1]); ctx.stroke();
        }
      };
      drawRobeWing(-9.8, -1.0, '#1f2937', -22.5, true);
      drawRobeWing(-2.0, 10.2, '#7f1d1d', -24.5, false);

      // Dải đai lưng đen rủ dài + hồ lô đồng bên hông
      const s0 = P(2.5, 0.5), s1 = P(7.2 + sw * 0.42 + runBias * 0.28, -21.0);
      if (!isSolid) {
        ctx.strokeStyle = '#090d16'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.quadraticCurveTo(s0[0] + sw * 0.2, (s0[1] + s1[1]) * 0.5, s1[0], s1[1]); ctx.stroke();
        const gp = P(-5.6, -4.5);
        ctx.fillStyle = '#a16207';
        ctx.beginPath(); ctx.arc(gp[0], gp[1], 3.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gp[0] - 0.5, gp[1] - 3.6, 2.0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#451a03'; ctx.lineWidth = 0.85; ctx.stroke();
      } else {
        ctx.strokeStyle = st._solid; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
      }
      return;
    }

    // C. Vạt áo võ phục / tunic xẻ tà cho Nghị, Bích Lâm, Hoàng Anh, Dung Hải
    if (arch === 'vovinam_master' || arch === 'street_brawler_gi' || arch === 'mountain_guardian' || arch === 'shinobi_assassin') {
      const dropY = arch === 'shinobi_assassin' ? -17.0 : (arch === 'mountain_guardian' ? -15.5 : -14.2);
      const flare = sw * 0.25 + runBias * 0.15;
      const trimCol = arch === 'mountain_guardian'
        ? '#a88854'
        : (arch === 'street_brawler_gi' ? '#090d16' : (arch === 'shinobi_assassin' ? '#52525b' : null));
      const baseCol = arch === 'shinobi_assassin' ? '#23262e' : st.gi;

      const drawFlap = (x0, x1, col, farSide) => {
        const p1 = P(x0, -1), p2 = P(x1, -1);
        const p3 = P(x1 + Math.sign(x1) * 2.4 + flare, dropY);
        const p4 = P(x0 + Math.sign(x0 || 1) * 0.7 + flare * 0.7, dropY);
        ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', p1[0], p1[1], p3[0], p3[1], col, farSide);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]);
        ctx.closePath(); ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.52)'; ctx.lineWidth = 1.1; ctx.stroke();
          this._drawFoldCluster(ctx, st, [[(p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5, (p3[0] + p4[0]) * 0.5, (p3[1] + p4[1]) * 0.5 + 1.5]], 'rgba(0,0,0,0.28)', 0.9);
          if (trimCol) {
            ctx.strokeStyle = trimCol; ctx.lineWidth = 2.0;
            ctx.beginPath(); ctx.moveTo(p4[0], p4[1]); ctx.lineTo(p3[0], p3[1]); ctx.stroke();
          }
        }
      };
      drawFlap(-9.2, -0.8, baseCol, true);
      drawFlap(-0.4, 9.5, baseCol, false);
    }
  }

  // =========================================================================
  // TẦNG 3: PHỦ VAI PHÍA TRƯỚC (Tay áo khoác rủ trên vai, Giáp vai Sư Tử, Cầu vai áo bào)
  // =========================================================================
  drawFrontShoulderOverlay(ctx, jt, st, motion) {
    const isSolid = !!(st && st._solid);
    const { nSh, fSh, sh, d, pp } = jt;
    const { sw, runBias } = this._motionMetrics(motion);
    const wind = sw * 0.5 + runBias * 0.4;
    const arch = st.archetype;

    // 1. Áo khoác choàng vai có tay áo rỗng rủ bên hông gần (Phó Văn Anh, Hứa Vũ Đại)
    // Giữ nắp vai thu gọn bên ngoài để không che khuất áo gile / cà vạt / sọc vest trên ngực
    if (st.drapedOvercoat) {
      const sideN = nSh[0] <= sh[0] ? -1 : 1;
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', nSh[0] - 6, nSh[1] - 4, nSh[0] + 4, nSh[1] + 6, st.coatColor || '#14171f', false);
      ctx.beginPath();
      ctx.moveTo(nSh[0] + pp[0] * 6.0 * sideN + d[0] * 2.2, nSh[1] + pp[1] * 6.0 * sideN + d[1] * 2.2);
      ctx.quadraticCurveTo(nSh[0] + pp[0] * 0.8 * sideN + d[0] * 3.0, nSh[1] + pp[1] * 0.8 * sideN + d[1] * 3.0, nSh[0] - pp[0] * 2.4 * sideN + d[0] * 1.4, nSh[1] - pp[1] * 2.4 * sideN + d[1] * 1.4);
      ctx.lineTo(nSh[0] - pp[0] * 0.5 * sideN - d[0] * 5.2, nSh[1] - pp[1] * 0.5 * sideN - d[1] * 5.2);
      ctx.lineTo(nSh[0] + pp[0] * 7.4 * sideN - d[0] * 7.2, nSh[1] + pp[1] * 7.4 * sideN - d[1] * 7.2);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.68)'; ctx.lineWidth = 1.05; ctx.stroke();
      }

      // Tay áo khoác rỗng treo rủ phía ngoài vai gần có nếp khuỷu & măng-sét thêu/cài
      const sTop = [nSh[0] + pp[0] * 3.8 * sideN, nSh[1] + pp[1] * 3.8 * sideN];
      const sBot = [sTop[0] + 8.0 * sideN + wind * 0.55, sTop[1] + 30.0];
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', sTop[0], sTop[1], sBot[0], sBot[1], st.coatColor || '#14171f', false);
      ctx.beginPath();
      ctx.moveTo(sTop[0] + 3.2 * sideN, sTop[1] - 1.5);
      ctx.quadraticCurveTo(sTop[0] + 7.2 * sideN + wind * 0.25, sTop[1] + 15.0, sBot[0] + 3.2 * sideN, sBot[1]);
      ctx.lineTo(sBot[0] - 4.0 * sideN, sBot[1] - 1.5);
      ctx.quadraticCurveTo(sTop[0] - 0.8 * sideN, sTop[1] + 14.0, sTop[0] - 3.0 * sideN, sTop[1] + 2.5);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.72)'; ctx.lineWidth = 1.15; ctx.stroke();
        this._drawFoldCluster(ctx, st, [
          [sTop[0], sTop[1] + 5.0, sTop[0] + 1.4 * sideN + wind * 0.15, sTop[1] + 14.0, sBot[0] - 1.0 * sideN, sBot[1] - 5.0]
        ], 'rgba(255,255,255,0.16)', 0.95);
        if (st.cuffRedEmbroidery) {
          ctx.fillStyle = '#881337';
          ctx.beginPath();
          ctx.moveTo(sBot[0] + 3.0 * sideN, sBot[1] - 4.4);
          ctx.lineTo(sBot[0] - 3.8 * sideN, sBot[1] - 5.2);
          ctx.lineTo(sBot[0] - 4.0 * sideN, sBot[1] - 1.5);
          ctx.lineTo(sBot[0] + 3.2 * sideN, sBot[1]);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#eab308'; ctx.lineWidth = 0.8; ctx.stroke();
        } else {
          ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(sBot[0] + 2.6 * sideN, sBot[1] - 3.8); ctx.lineTo(sBot[0] - 3.4 * sideN, sBot[1] - 4.5); ctx.stroke();
        }
      }
      return;
    }

    // 2. Cầu vai Đạo Bào Xòe Mây Bạc Kiến Trúc (Ngô Giang Mạnh)
    if (arch === 'patriarch_sword_robe') {
      const sideN = nSh[0] <= sh[0] ? -1 : 1;
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'silk', sh[0] - 10, sh[1] - 4, nSh[0] + 8, nSh[1] + 8, st.gi || '#1e3a5f', false);
      ctx.beginPath();
      ctx.moveTo(nSh[0] - pp[0] * 5.2 * sideN + d[0] * 2.2, nSh[1] - pp[1] * 5.2 * sideN + d[1] * 2.2);
      ctx.quadraticCurveTo(nSh[0] + pp[0] * 3.0 * sideN + d[0] * 2.8, nSh[1] + pp[1] * 3.0 * sideN + d[1] * 2.8, nSh[0] + pp[0] * 8.4 * sideN - d[0] * 4.0, nSh[1] + pp[1] * 8.4 * sideN - d[1] * 4.0);
      ctx.lineTo(nSh[0] - pp[0] * 4.8 * sideN - d[0] * 6.0, nSh[1] - pp[1] * 4.8 * sideN - d[1] * 6.0);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.05; ctx.stroke();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(nSh[0] - pp[0] * 4.8 * sideN - d[0] * 6.0, nSh[1] - pp[1] * 4.8 * sideN - d[1] * 6.0);
        ctx.lineTo(nSh[0] + pp[0] * 8.4 * sideN - d[0] * 4.0, nSh[1] + pp[1] * 8.4 * sideN - d[1] * 4.0);
        ctx.stroke();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(nSh[0] - pp[0] * 2.8 * sideN - d[0] * 2.5, nSh[1] - pp[1] * 2.8 * sideN - d[1] * 2.5);
        ctx.lineTo(nSh[0] + pp[0] * 5.8 * sideN - d[0] * 1.2, nSh[1] + pp[1] * 5.8 * sideN - d[1] * 1.2);
        ctx.stroke();
      }
      return;
    }

    // 2B. Cầu vai Đạo Bào Đỏ Huyết viền kim-hắc (Châu Ngọc Thiên Khánh)
    if (arch === 'crimson_coin_taoist') {
      const sideN = nSh[0] <= sh[0] ? -1 : 1;
      ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'fabric', sh[0] - 10, sh[1] - 4, nSh[0] + 8, nSh[1] + 8, '#290c0c', false);
      ctx.beginPath();
      ctx.moveTo(nSh[0] - pp[0] * 4.8 * sideN + d[0] * 2.2, nSh[1] - pp[1] * 4.8 * sideN + d[1] * 2.2);
      ctx.quadraticCurveTo(nSh[0] + pp[0] * 3.0 * sideN + d[0] * 2.8, nSh[1] + pp[1] * 3.0 * sideN + d[1] * 2.8, nSh[0] + pp[0] * 8.2 * sideN - d[0] * 3.6, nSh[1] + pp[1] * 8.2 * sideN - d[1] * 3.6);
      ctx.lineTo(nSh[0] - pp[0] * 4.5 * sideN - d[0] * 5.6, nSh[1] - pp[1] * 4.5 * sideN - d[1] * 5.6);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.05; ctx.stroke();
        ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(nSh[0] - pp[0] * 4.5 * sideN - d[0] * 5.6, nSh[1] - pp[1] * 4.5 * sideN - d[1] * 5.6);
        ctx.lineTo(nSh[0] + pp[0] * 8.2 * sideN - d[0] * 3.6, nSh[1] + pp[1] * 8.2 * sideN - d[1] * 3.6);
        ctx.stroke();
      }
      return;
    }

    // 3. Giáp vai thép xám đen 3 lá xếp tầng sắc cạnh (Phó Dung Hải)
    if (st.shinobiArmor) {
      for (let i = 0; i < 3; i++) {
        const off = 1.8 + i * 3.2;
        const pA = [nSh[0] - pp[0] * 4.4, nSh[1] - pp[1] * 4.4 + off];
        const pB = [nSh[0] + pp[0] * 4.4, nSh[1] + pp[1] * 4.4 + off];
        const mx = (pA[0] + pB[0]) * 0.5, my = (pA[1] + pB[1]) * 0.5;
        ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'metal', mx - 5, my - 2, mx + 5, my + 3, i === 0 ? '#4b5563' : '#27272a', false);
        ctx.beginPath();
        ctx.ellipse(mx, my, 5.4 - i * 0.45, 2.3, Math.atan2(pp[1], pp[0]), 0, Math.PI * 2);
        ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.9; ctx.stroke();
        }
      }
      return;
    }

    // 4. Giáp vai Hổ Đầu / Sư Tử Hoàng Kim Đúc 3D + 2 Tầng Vảy Đỏ Viền Vàng (Triệu Đình An — mở rộng bề ngang vai đại tướng, hạ thấp tránh cằm)
    if (st.armor && arch === 'phoenix_general') {
      const drawLionPauldron = (pt, far) => {
        const outX = far ? 2.2 : -2.4;
        ctx.save();
        ctx.translate(pt[0] + outX, pt[1] + 1.5);
        ctx.rotate(jt.ang);
        // Hai tầng vảy đỏ viền vàng mở rộng ra ngoài cánh tay
        for (let l = 2; l >= 1; l--) {
          const ly = l * 3.6;
          ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'metal', -8.2, ly - 2, 8.2, ly + 4, '#881337', far);
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-8.2 + l * 0.5, ly, 16.4 - l * 1.0, 4.4, 2.0) : ctx.rect(-8.2 + l * 0.5, ly, 16.4 - l * 1.0, 4.4); ctx.fill();
          if (!isSolid) { ctx.strokeStyle = far ? '#92400e' : '#eab308'; ctx.lineWidth = 1.15; ctx.stroke(); }
        }
        // Chỏm cầu vai đầu Sư Tử đúc vàng trải rộng ngang vai đại tướng (KHÔNG dâng lên cổ/cằm)
        ctx.fillStyle = isSolid ? st._solid : this._materialFill(ctx, st, 'gold', -9.6, -3.5, 9.6, 3.6, '#eab308', far);
        ctx.beginPath(); ctx.ellipse(0, 0.1, 9.6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath(); ctx.ellipse(1.0, -0.5, 4.8, 1.8, 0.08, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#78350f';
          ctx.beginPath(); ctx.arc(2.4, -0.6, 1.0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      };
      drawLionPauldron(fSh, true);
      drawLionPauldron(nSh, false);
    }
  }
}

window.SkeletalRendererArchetypes = SkeletalRendererArchetypes;
})();

