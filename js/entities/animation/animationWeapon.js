/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationWeapon.js - Ve khi tai, khien va vu khi.
 */

(function () {
const { AnimUtil, STYLE_DEFS, VARIANTS, ATTACK_STATES, POSE_ALIAS, POSE_KEYS, shadeColor, hashStr } = window;

class SkeletalRendererWeapon extends window.SkeletalRendererRenderBase {
  drawTigerShield(ctx, elb, hand, foreAbs, st, isFrontCharge) {
    const mx = elb[0] + (hand[0] - elb[0]) * 0.72;
    const my = elb[1] + (hand[1] - elb[1]) * 0.72;
    ctx.save();
    ctx.translate(mx + (isFrontCharge ? 4.5 : 4.0), my + (isFrontCharge ? 0 : 4.5));
    ctx.rotate(-foreAbs * 0.22);

    const rx = isFrontCharge ? 12.8 : 10.2;
    const ry = isFrontCharge ? 20.5 : 16.5;

    // Đường bao khiên lục giác nhọn đầu/đít kiểu Đại Tướng Phụng Hoàng
    const traceHexShield = (sx, sy) => {
      ctx.beginPath();
      ctx.moveTo(0, -sy);
      ctx.lineTo(sx * 0.92, -sy * 0.45);
      ctx.lineTo(sx, sy * 0.16);
      ctx.lineTo(0, sy);
      ctx.lineTo(-sx, sy * 0.16);
      ctx.lineTo(-sx * 0.92, -sy * 0.45);
      ctx.closePath();
    };

    if (st && st._solid) {
      ctx.fillStyle = st._solid;
      traceHexShield(rx + 1.5, ry + 1.5);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Bóng đổ viền ngoài
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    traceHexShield(rx + 1.8, ry + 1.8);
    ctx.fill();

    // Vành khiên đồng vàng chạm khắc
    const rimGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    rimGrad.addColorStop(0, '#fef08a');
    rimGrad.addColorStop(0.45, '#d97706');
    rimGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = rimGrad;
    traceHexShield(rx, ry);
    ctx.fill();

    // Lòng khiên thép xám đen chạm vân (giống concept art Triệu Đình An)
    const coreGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, ry * 0.88);
    coreGrad.addColorStop(0, '#475569');
    coreGrad.addColorStop(0.55, '#334155');
    coreGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = coreGrad;
    traceHexShield(rx - 2.6, ry - 3.0);
    ctx.fill();

    // Thanh gia cố đồng chạy dọc & ngang nối vào tâm khiên
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, -(ry - 3)); ctx.lineTo(0, ry - 3);
    ctx.moveTo(-(rx - 3) * 0.9, -(ry - 3) * 0.42); ctx.lineTo((rx - 3) * 0.9, (ry - 3) * 0.18);
    ctx.moveTo((rx - 3) * 0.9, -(ry - 3) * 0.42); ctx.lineTo(-(rx - 3) * 0.9, (ry - 3) * 0.18);
    ctx.stroke();

    // Đinh tán đồng vàng quanh viền ngoài khiên
    ctx.fillStyle = '#fde047';
    const rivets = [
      [0, -ry + 1.6], [rx * 0.85, -ry * 0.42], [rx * 0.92, ry * 0.15],
      [0, ry - 1.8], [-rx * 0.92, ry * 0.15], [-rx * 0.85, -ry * 0.42]
    ];
    for (let i = 0; i < rivets.length; i++) {
      ctx.beginPath(); ctx.arc(rivets[i][0], rivets[i][1], 1.1, 0, Math.PI * 2); ctx.fill();
    }

    // Tâm khiên nhỏ hình lục giác chứa Hỏa Liên (Ngọn lửa hoa sen vàng cam)
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(0, -7.2); ctx.lineTo(5.6, -2.5); ctx.lineTo(4.8, 3.8); ctx.lineTo(0, 7.6);
    ctx.lineTo(-4.8, 3.8); ctx.lineTo(-5.6, -2.5); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, -5.8); ctx.lineTo(4.3, -1.8); ctx.lineTo(3.7, 3.0); ctx.lineTo(0, 6.0);
    ctx.lineTo(-3.7, 3.0); ctx.lineTo(-4.3, -1.8); ctx.closePath();
    ctx.fill();

    // Ngọn lửa hoa sen vàng cam phát sáng nhẹ ở tâm
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(0, -4.6); ctx.quadraticCurveTo(3.2, -0.5, 2.2, 3.2);
    ctx.quadraticCurveTo(0, 4.4, -2.2, 3.2); ctx.quadraticCurveTo(-3.2, -0.5, 0, -4.6);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(0, -2.6); ctx.quadraticCurveTo(1.5, 0.2, 0.9, 2.6);
    ctx.lineTo(-0.9, 2.6); ctx.quadraticCurveTo(-1.5, 0.2, 0, -2.6);
    ctx.fill();

    ctx.restore();
  }

  // Khiên chống bạo động: vẽ trước người ở tay gần — thiết kế góc cạnh 2.5D, kính polycarbonate & xoay nhẹ theo cánh tay
  drawRiotShield(ctx, jt, st) {
    const h = jt.nHand;
    if (!h || !Number.isFinite(h[0]) || !Number.isFinite(h[1])) return;
    const rawFore = Number.isFinite(jt.nFore) ? jt.nFore : 1.88;
    const rawGrip = Number.isFinite(jt.grip) ? jt.grip : 0;
    const tilt = Math.max(-0.65, Math.min(0.65, (rawFore - 1.88) * 0.22 - rawGrip * 0.48));

    ctx.save();
    ctx.translate(h[0] + 6, h[1] - 3);
    ctx.rotate(tilt);

    const traceShield = (x0, y0, w, hBox, cut) => {
      const x1 = x0 + w, y1 = y0 + hBox;
      ctx.beginPath();
      ctx.moveTo(x0 + cut, y0);
      ctx.lineTo(x1 - cut, y0);
      ctx.lineTo(x1, y0 + cut + 3);
      ctx.lineTo(x1, y1 - cut - 3);
      ctx.lineTo(x1 - cut, y1);
      ctx.lineTo(x0 + cut, y1);
      ctx.lineTo(x0, y1 - cut - 3);
      ctx.lineTo(x0, y0 + cut + 3);
      ctx.closePath();
    };

    if (st && st._solid) {
      ctx.fillStyle = st._solid;
      traceShield(-4, -34, 17, 68, 3);
      ctx.fill();
      ctx.restore();
      return;
    }

    // Viền bóng ngoài sắc nét
    ctx.fillStyle = 'rgba(8, 12, 22, 0.78)';
    traceShield(-4, -34, 17, 68, 3);
    ctx.fill();

    // Thân giáp titan đa tầng
    const sg = ctx.createLinearGradient(-3, -32, 12, 32);
    sg.addColorStop(0, '#94a3b8');
    sg.addColorStop(0.38, '#475569');
    sg.addColorStop(0.72, '#1e293b');
    sg.addColorStop(1, '#0f172a');
    ctx.fillStyle = sg;
    traceShield(-2.5, -32.5, 14, 65, 2.5);
    ctx.fill();

    // Kính chắn polycarbonate cường lực + khung bezel & tia phản quang
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0.2, -26.5, 8.2, 20.5);
    const vg = ctx.createLinearGradient(1, -25.5, 7.5, -7);
    vg.addColorStop(0, 'rgba(186,230,253,0.92)');
    vg.addColorStop(1, 'rgba(14,165,233,0.72)');
    ctx.fillStyle = vg;
    ctx.fillRect(1.1, -25.6, 6.4, 18.6);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.moveTo(1.1, -25.6); ctx.lineTo(5.6, -25.6); ctx.lineTo(1.1, -14.5); ctx.closePath(); ctx.fill();

    // Đường rãnh giáp & vạch cảnh giới / gia huy
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2, -1); ctx.lineTo(11, -1); ctx.stroke();

    const trimCol = st.belt || '#eab308';
    ctx.fillStyle = trimCol;
    ctx.fillRect(-1.2, 4, 11.4, 3.6);
    ctx.fillRect(-0.6, 10.2, 10.2, 2.8);

    // Đường highlight thép dọc mép ngoài
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.3;
    traceShield(-2.5, -32.5, 14, 65, 2.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(9.8, -27); ctx.lineTo(9.8, 27); ctx.stroke();

    // 4 đinh tán lục giác
    ctx.fillStyle = '#f8fafc';
    for (const [rx, ry] of [[-0.2, -29.2], [9.2, -29.2], [-0.2, 29.2], [9.2, 29.2]]) {
      ctx.beginPath(); ctx.arc(rx, ry, 1.0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }

  // Xích sắt trói bắt (EnemyGrabber)
  // Vẽ một mắt xích hình oval (xen kẽ dọc/ngang cho cảm giác 3D)
  _chainLink(ctx, x, y, ang, flat) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.ellipse(0, 0, 4.2, flat ? 1.7 : 2.8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = flat ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 4.2, flat ? 1.7 : 2.8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Móc câu 3 ngạnh bằng thép (grappling hook), hướng theo góc ang
  _grappleHook(ctx, x, y, ang, glow) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    if (glow) { ctx.shadowColor = '#818cf8'; ctx.shadowBlur = 10; }
    // Thân móc
    ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, 5);
    g.addColorStop(0, '#f1f5f9'); g.addColorStop(1, '#64748b');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, Math.PI * 2); ctx.fill();
    // 3 ngạnh cong sắc nhọn
    for (const k of [-0.9, 0, 0.9]) {
      ctx.save(); ctx.rotate(k);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.moveTo(2, -2.6); ctx.quadraticCurveTo(13, -3.5, 15, 3); ctx.quadraticCurveTo(9, 0.5, 2, 2.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.moveTo(3, -1.6); ctx.quadraticCurveTo(12, -2.4, 14, 2.4); ctx.quadraticCurveTo(9, 0, 3, 1.4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#818cf8'; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawChainWeapon(ctx, hand, foreAbs, st, e) {
    ctx.save();
    const isCasting = e && e.state === 'chain_cast';
    ctx.lineCap = 'round';

    if (isCasting) {
      // Xích văng thẳng ra phía trước, từng mắt xích rõ ràng + móc câu phát sáng
      const reach = 110;
      const n = 11;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = hand[0] + reach * t;
        const y = hand[1] + Math.sin(t * 9 + performance.now() * 0.02) * 2.6 * (1 - t * 0.4);
        this._chainLink(ctx, x, y, 0, i % 2 === 0);
      }
      // Vệt tốc độ
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.35)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(hand[0] + reach, hand[1]); ctx.stroke();
      ctx.restore();
      this._grappleHook(ctx, hand[0] + reach + 4, hand[1], 0, true);
    } else {
      // Cuộn xích quấn quanh hông/tay + móc câu rủ xuống
      const sway = Math.sin(performance.now() * 0.004) * 1.5;
      for (let i = 1; i <= 5; i++) {
        const t = i / 5;
        const x = hand[0] + 2 * t + sway * t + Math.sin(t * 3) * 3;
        const y = hand[1] + 4 + 22 * t;
        this._chainLink(ctx, x, y, 0.3 * Math.sin(t * 4), i % 2 === 0);
      }
      this._grappleHook(ctx, hand[0] + 3 + sway, hand[1] + 31, Math.PI / 2, false);
    }
    ctx.restore();
  }

  // Huy hiệu chữ thập cứu thương (EnemyMedic) + túi y tế đeo hông + hào quang khi niệm trị liệu
  drawMedicCross(ctx, jt, st, e) {
    const cx = jt.sh[0] + 4;
    const cy = jt.sh[1] + 8;
    const now = performance.now();
    ctx.save();
    // Viền sáng + vòng tròn trắng
    ctx.shadowColor = '#34d399'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Chữ thập y tế
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cx - 1.3, cy - 4, 2.6, 8);
    ctx.fillRect(cx - 4, cy - 1.3, 8, 2.6);

    // Túi y tế đeo hông
    const hx = jt.nHip ? jt.nHip[0] : cx - 6, hy = jt.nHip ? jt.nHip[1] : cy + 22;
    ctx.fillStyle = '#064e3b'; ctx.fillRect(hx - 8, hy - 3, 13, 10);
    ctx.fillStyle = '#10b981'; ctx.fillRect(hx - 8, hy - 3, 13, 2.5);
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(hx - 3.5, hy, 1.8, 5); ctx.fillRect(hx - 5, hy + 1.6, 4.8, 1.8);

    // Hào quang trị liệu khi niệm chú
    if (e && e.state === 'channel_heal') {
      ctx.globalCompositeOperation = 'lighter';
      const t = now * 0.004;
      const rg = ctx.createRadialGradient(cx, cy + 6, 4, cx, cy + 6, 46);
      rg.addColorStop(0, 'rgba(52, 211, 153, 0.55)'); rg.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy + 6, 46, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const ph = (t + i * 0.25) % 1;
        const px = cx + Math.sin(i * 2.4 + t * 3) * 16;
        const py = cy + 10 - ph * 56;
        ctx.fillStyle = `rgba(167, 243, 208, ${1 - ph})`;
        ctx.fillRect(px - 1, py - 3.5, 2, 7); ctx.fillRect(px - 3.5, py - 1, 7, 2);
      }
    }
    ctx.restore();
  }

  // Tia trị liệu xanh ngọc nối từ Quân Y tới mục tiêu (toạ độ màn hình)
  drawHealBeam(ctx, x1, y1, x2, y2, now) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 36;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.9)'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
    // Hạt năng lượng chạy dọc theo tia
    for (let i = 0; i < 6; i++) {
      const t = ((now * 0.0007) + i / 6) % 1;
      const u = 1 - t;
      const px = u * u * x1 + 2 * u * t * mx + t * t * x2;
      const py = u * u * y1 + 2 * u * t * my + t * t * y2;
      ctx.fillStyle = 'rgba(236, 253, 245, 0.95)';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(px - 0.8, py - 4.5, 1.6, 9); ctx.fillRect(px - 4.5, py - 0.8, 9, 1.6);
    }
    // Vòng sáng ở mục tiêu
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x2, y2 + 52, 26, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Giáp vai hạng nặng (EnemyArmored)
  drawHeavyShoulders(ctx, jt, st) {
    ctx.save();
    // Giáp vai tay gần
    const sh = jt.nSh;
    ctx.fillStyle = st.helmet || '#475569';
    ctx.beginPath();
    ctx.ellipse(sh[0], sh[1] - 3, 8.6, 5.6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Đinh tán kim loại
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(sh[0] - 3.2, sh[1] - 4, 1.0, 0, Math.PI * 2);
    ctx.arc(sh[0] + 3.2, sh[1] - 2.4, 1.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Góc vũ khí: cuốc đi thẳng theo hai tay; vũ khí một tay được bẻ cổ tay hướng lên để cầm tự nhiên
  weaponAngle(st, foreAbs) {
    if (!st || !st.weapon || st.weapon === 'hoe') return foreAbs;
    // Nắm ngang: cán/chuôi vũ khí vuông góc cẳng tay, xuyên qua nắm đấm
    return foreAbs + (st.weapon === 'mace' ? 1.15 : 1.25);
  }

  // Nắm đấm phủ lên trên vũ khí: góc cạnh gọn theo tỷ lệ tay thật (KHÔNG dùng hình cầu khổng lồ)
  drawGripFist(ctx, hand, foreAbs, st, far, axisAbs) {
    const fd = [Math.sin(foreAbs), Math.cos(foreAbs)];
    const pd = [-fd[1], fd[0]];
    const c = [hand[0] + fd[0] * 2.1, hand[1] + fd[1] * 2.1];
    const sk = far ? st.skinD : st.skin;
    const fistCol = st.gloves ? st.gloves : (st.gauntlet ? '#d4a017' : sk);
    const bulk = (st && st.rig && (st.rig.armBulk || st.rig.limbBulk)) || 1.0;
    const w = 2.6 * Math.min(1.06, bulk);
    const h = 2.3 * Math.min(1.06, bulk);

    const traceGrip = (pad) => {
      ctx.beginPath();
      ctx.moveTo(c[0] - fd[0] * (h + pad) - pd[0] * (w + pad), c[1] - fd[1] * (h + pad) - pd[1] * (w + pad));
      ctx.lineTo(c[0] + fd[0] * (h + pad) - pd[0] * (w * 0.9 + pad), c[1] + fd[1] * (h + pad) - pd[1] * (w * 0.9 + pad));
      ctx.lineTo(c[0] + fd[0] * (h + pad) + pd[0] * (w * 0.9 + pad), c[1] + fd[1] * (h + pad) + pd[1] * (w * 0.9 + pad));
      ctx.lineTo(c[0] - fd[0] * (h + pad) + pd[0] * (w + pad), c[1] - fd[1] * (h + pad) + pd[1] * (w + pad));
      ctx.closePath();
    };
    ctx.fillStyle = this._edge(st, 'rgba(0,0,0,0.56)');
    traceGrip(0.8); ctx.fill();
    ctx.fillStyle = this._c(st, fistCol);
    traceGrip(0); ctx.fill();
    if (st && st._solid) return;

    // Các đốt ngón tay quấn quanh cán vũ khí
    const ad = [Math.sin(axisAbs), Math.cos(axisAbs)];
    const nx = -ad[1], ny = ad[0];
    ctx.strokeStyle = 'rgba(0,0,0,0.36)'; ctx.lineWidth = 0.85; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const o = [c[0] + ad[0] * i * 1.7, c[1] + ad[1] * i * 1.7];
      ctx.beginPath();
      ctx.moveTo(o[0] - nx * 2.2, o[1] - ny * 2.2);
      ctx.lineTo(o[0] + nx * 2.2, o[1] + ny * 2.2);
      ctx.stroke();
    }
    // Ngón cái khép giữ cán
    ctx.fillStyle = fistCol;
    ctx.beginPath(); ctx.ellipse(c[0] + nx * 2.0 + ad[0] * 1.0, c[1] + ny * 2.0 + ad[1] * 1.0, 1.5, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawWeapon(ctx, hand, foreAbs, st, len, grip = 0, far = false) {
    this.drawWeaponBody(ctx, hand, foreAbs, st, len, grip);
    this.drawGripFist(ctx, hand, foreAbs, st, far, this.weaponAngle(st, foreAbs) + grip);
  }

  // Cầm hai tay: tay xa được đặt lên cán cuốc (IK 2 xương) và khóa trục cán xuyên chuẩn qua tâm cả 2 nắm đấm
  applyWeaponGrip(jt, st) {
    if (!st || st.weapon !== 'hoe') return;
    const armU = jt.armU || 17;
    const armF = jt.armF || 16;
    const sa0 = jt.nFore + (jt.grip || 0);
    const dir0 = [Math.sin(sa0), Math.cos(sa0)];
    const nFist = [jt.nHand[0] + Math.sin(jt.nFore) * 2.8, jt.nHand[1] + Math.cos(jt.nFore) * 2.8];
    const L1 = armU, L2Fist = armF + 2.8;
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
    jt.fHand = [elb[0] + Math.sin(fFore) * armF, elb[1] + Math.cos(fFore) * armF];
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

    // 1. CUỐC SẮT THỦ CÔNG (Phó Đặng Hoàng Anh): Cán thiết mộc thô chắc + Cổ thép đinh tán + Lưỡi cuốc rèn bản rộng có vết mẻ chiến trận
    if (st.weapon === 'hoe') {
      const butt = [hand[0] - dir[0] * 26, hand[1] - dir[1] * 26];
      const pommelEnd = [butt[0] - dir[0] * 3.5, butt[1] - dir[1] * 3.5];
      const bx = perp[0] * 0.94 - dir[0] * 0.34;
      const by = perp[1] * 0.94 - dir[1] * 0.34;
      const tip = [b[0], b[1]];
      const pollEnd = [tip[0] - bx * 8.5, tip[1] - by * 8.5];
      const bladeEdge = [tip[0] + bx * 29, tip[1] + by * 29];
      const bevelStart = [tip[0] + bx * 19, tip[1] + by * 19];
      if (st && st._solid) {
        this.capsule(ctx, pommelEnd, b, 5.4, 4.3, st._solid);
        this.capsule(ctx, tip, pollEnd, 6.2, 4.6, st._solid);
        ctx.fillStyle = st._solid;
        ctx.beginPath();
        ctx.moveTo(tip[0] - dir[0] * 3.8, tip[1] - dir[1] * 3.8);
        ctx.lineTo(tip[0] + dir[0] * 4.5, tip[1] + dir[1] * 4.5);
        ctx.lineTo(bladeEdge[0] + dir[0] * 7.6, bladeEdge[1] + dir[1] * 7.6);
        ctx.lineTo(bladeEdge[0] - dir[0] * 5.2, bladeEdge[1] - dir[1] * 5.2);
        ctx.closePath(); ctx.fill();
        return;
      }
      // Thân cán gỗ lim tối màu + đổ bóng khối trụ
      this.capsule(ctx, pommelEnd, b, 5.9, 4.6, 'rgba(0,0,0,0.68)');
      this.capsule(ctx, butt, b, 4.6, 3.6, '#5c3d24');
      this.capsule(ctx, [butt[0] - perp[0] * 1.1, butt[1] - perp[1] * 1.1], [b[0] - perp[0] * 0.9, b[1] - perp[1] * 0.9], 1.5, 1.1, 'rgba(253, 224, 171, 0.26)');
      // Đế cán bọc sắt rèn có đai đồng
      this.capsule(ctx, pommelEnd, butt, 5.3, 4.8, '#334155');
      this.capsule(ctx, butt, [butt[0] + dir[0] * 1.8, butt[1] + dir[1] * 1.8], 4.8, 4.8, '#b45309');

      // Quấn dây vải/da tối ở hai vị trí cầm
      ctx.strokeStyle = '#1c140d'; ctx.lineWidth = 4.2; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hand[0] - dir[0] * 4.5, hand[1] - dir[1] * 4.5);
      ctx.lineTo(hand[0] + dir[0] * 3.5, hand[1] + dir[1] * 3.5);
      ctx.moveTo(hand[0] - dir[0] * 18.5, hand[1] - dir[1] * 18.5);
      ctx.lineTo(hand[0] - dir[0] * 12, hand[1] - dir[1] * 12);
      ctx.stroke();
      ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.4;
      for (let w = -17; w <= -13; w += 2) {
        const gp = [hand[0] + dir[0] * w, hand[1] + dir[1] * w];
        ctx.beginPath(); ctx.moveTo(gp[0] - perp[0] * 2.3, gp[1] - perp[1] * 2.3); ctx.lineTo(gp[0] + perp[0] * 2.3, gp[1] + perp[1] * 2.3); ctx.stroke();
      }

      // Cổ cuốc thép rèn đa lớp + vòng đồng gia cố + 2 đinh tán
      this.capsule(ctx, [b[0] - dir[0] * 5.5, b[1] - dir[1] * 5.5], [b[0] + dir[0] * 2.4, b[1] + dir[1] * 2.4], 7.1, 6.4, '#1e293b');
      this.capsule(ctx, [b[0] - dir[0] * 4.2, b[1] - dir[1] * 4.2], [b[0] - dir[0] * 2.0, b[1] - dir[1] * 2.0], 7.4, 7.4, '#b45309');
      this.capsule(ctx, tip, pollEnd, 6.3, 4.7, '#334155');

      // Bản lưỡi cuốc thép đen rèn thô, góc vát và sứt mẻ nhẹ chiến trận
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.beginPath();
      ctx.moveTo(tip[0] - dir[0] * 3.8, tip[1] - dir[1] * 3.8);
      ctx.lineTo(tip[0] + dir[0] * 4.5, tip[1] + dir[1] * 4.5);
      ctx.lineTo(bladeEdge[0] + dir[0] * 7.6, bladeEdge[1] + dir[1] * 7.6);
      ctx.lineTo(bladeEdge[0] - dir[0] * 5.2, bladeEdge[1] - dir[1] * 5.2);
      ctx.closePath(); ctx.fill();

      const hoeGrad = ctx.createLinearGradient(tip[0], tip[1], bladeEdge[0], bladeEdge[1]);
      hoeGrad.addColorStop(0, '#1e293b');
      hoeGrad.addColorStop(0.55, '#475569');
      hoeGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = hoeGrad;
      ctx.beginPath();
      ctx.moveTo(tip[0] - dir[0] * 2.8, tip[1] - dir[1] * 2.8);
      ctx.lineTo(tip[0] + dir[0] * 3.4, tip[1] + dir[1] * 3.4);
      ctx.lineTo(bladeEdge[0] + dir[0] * 6.4, bladeEdge[1] + dir[1] * 6.4);
      ctx.lineTo(bladeEdge[0] - dir[0] * 4.2, bladeEdge[1] - dir[1] * 4.2);
      ctx.closePath(); ctx.fill();

      // Mép vát thép sáng + vết mẻ nhỏ đặc trưng cuốc nông dân chiến đấu
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(bevelStart[0] - dir[0] * 3.6, bevelStart[1] - dir[1] * 3.6);
      ctx.lineTo(bevelStart[0] + dir[0] * 4.9, bevelStart[1] + dir[1] * 4.9);
      ctx.lineTo(bladeEdge[0] + dir[0] * 6.4, bladeEdge[1] + dir[1] * 6.4);
      ctx.lineTo(bladeEdge[0] + dir[0] * 2.4 - bx * 1.4, bladeEdge[1] + dir[1] * 2.4 - by * 1.4);
      ctx.lineTo(bladeEdge[0] + dir[0] * 0.8, bladeEdge[1] + dir[1] * 0.8);
      ctx.lineTo(bladeEdge[0] - dir[0] * 4.2, bladeEdge[1] - dir[1] * 4.2);
      ctx.closePath(); ctx.fill();

      // Đường sắc mép lưỡi & 2 đinh tán cổ cuốc
      ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bladeEdge[0] - dir[0] * 4.0, bladeEdge[1] - dir[1] * 4.0);
      ctx.lineTo(bladeEdge[0] + dir[0] * 6.0, bladeEdge[1] + dir[1] * 6.0);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(tip[0] + bx * 4.5 + dir[0] * 1.2, tip[1] + by * 4.5 + dir[1] * 1.2, 1.3, 0, Math.PI * 2);
      ctx.arc(tip[0] + bx * 4.5 - dir[0] * 1.2, tip[1] + by * 4.5 - dir[1] * 1.2, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 2. PHƯỢNG HOÀNG KIM CHÙY BÁT GIÁC (Triệu Đình An): Đầu chùy thon dài đa diện có gân nổi vàng kim + 3 tầng gai thép + Mũi thương phá giáp
    if (st.weapon === 'mace') {
      const shaftTop = [hand[0] + dir[0] * (len - 8), hand[1] + dir[1] * (len - 8)];
      const pommel = [hand[0] - dir[0] * 9, hand[1] - dir[1] * 9];
      const maceCenter = [shaftTop[0] + dir[0] * 12.5, shaftTop[1] + dir[1] * 12.5];
      const rx = 9.2, ry = 14.2;
      if (st && st._solid) {
        this.capsule(ctx, pommel, shaftTop, 5.4, 4.8, st._solid);
        ctx.fillStyle = st._solid;
        ctx.beginPath();
        ctx.ellipse(maceCenter[0], maceCenter[1], ry + 1.2, rx + 1.2, Math.atan2(dir[1], dir[0]), 0, Math.PI * 2);
        ctx.fill();
        for (const t of [-0.55, 0, 0.55]) {
          for (const side of [-1, 1]) {
            const sb = [maceCenter[0] + dir[0] * (ry * t) + perp[0] * (side * (rx - 1.5)), maceCenter[1] + dir[1] * (ry * t) + perp[1] * (side * (rx - 1.5))];
            const stp = [sb[0] + perp[0] * (side * 6.5) + dir[0] * (t * 2), sb[1] + perp[1] * (side * 6.5) + dir[1] * (t * 2)];
            ctx.beginPath();
            ctx.moveTo(sb[0] - dir[0] * 2.8, sb[1] - dir[1] * 2.8);
            ctx.lineTo(stp[0], stp[1]);
            ctx.lineTo(sb[0] + dir[0] * 2.8, sb[1] + dir[1] * 2.8);
            ctx.closePath(); ctx.fill();
          }
        }
        ctx.beginPath();
        ctx.moveTo(maceCenter[0] + dir[0] * (ry - 1) - perp[0] * 4.2, maceCenter[1] + dir[1] * (ry - 1) - perp[1] * 4.2);
        ctx.lineTo(maceCenter[0] + dir[0] * (ry + 12.5), maceCenter[1] + dir[1] * (ry + 12.5));
        ctx.lineTo(maceCenter[0] + dir[0] * (ry - 1) + perp[0] * 4.2, maceCenter[1] + dir[1] * (ry - 1) + perp[1] * 4.2);
        ctx.closePath(); ctx.fill();
        return;
      }

      // Tua đỏ rủ từ đốc chùy (secondary visual accent)
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pommel[0], pommel[1]);
      ctx.quadraticCurveTo(pommel[0] - dir[0] * 5 + 3, pommel[1] - dir[1] * 5 + 4, pommel[0] - dir[0] * 9 + 1, pommel[1] - dir[1] * 9 + 7);
      ctx.stroke();

      // Cán thép rèn tối có gân ánh kim + quấn da đỏ hoàng gia
      this.capsule(ctx, pommel, shaftTop, 5.6, 4.9, 'rgba(0,0,0,0.74)');
      this.capsule(ctx, pommel, shaftTop, 4.1, 3.6, '#1e293b');
      this.capsule(ctx, [pommel[0] - perp[0] * 0.9, pommel[1] - perp[1] * 0.9], [shaftTop[0] - perp[0] * 0.7, shaftTop[1] - perp[1] * 0.7], 1.1, 0.9, '#64748b');

      // Đốc chùy vòng vàng + quấn tay cầm đỏ đô
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(pommel[0], pommel[1], 3.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(pommel[0], pommel[1], 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(hand[0] - dir[0] * 5, hand[1] - dir[1] * 5); ctx.lineTo(hand[0] + dir[0] * 6, hand[1] + dir[1] * 6); ctx.stroke();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.1;
      for (let k = -1; k <= 2; k++) {
        const gp = [hand[0] + dir[0] * (k * 3.0), hand[1] + dir[1] * (k * 3.0)];
        ctx.beginPath();
        ctx.moveTo(gp[0] - perp[0] * 2.2 - dir[0], gp[1] - perp[1] * 2.2 - dir[1]);
        ctx.lineTo(gp[0] + perp[0] * 2.2 + dir[0], gp[1] + perp[1] * 2.2 + dir[1]);
        ctx.stroke();
      }

      // Chắn tay & Cổ chùy chạm trổ 2 tầng đồng vàng
      const guardPt = [hand[0] + dir[0] * 7.2, hand[1] + dir[1] * 7.2];
      this.capsule(ctx, [guardPt[0] - perp[0] * 4.5, guardPt[1] - perp[1] * 4.5], [guardPt[0] + perp[0] * 4.5, guardPt[1] + perp[1] * 4.5], 3.3, 3.3, '#92400e');
      this.capsule(ctx, [guardPt[0] - perp[0] * 3.6, guardPt[1] - perp[1] * 3.6], [guardPt[0] + perp[0] * 3.6, guardPt[1] + perp[1] * 3.6], 2.2, 2.2, '#facc15');
      this.capsule(ctx, [shaftTop[0] - dir[0] * 4, shaftTop[1] - dir[1] * 4], shaftTop, 5.4, 7.8, '#b45309');
      this.capsule(ctx, [shaftTop[0] - dir[0] * 2.2, shaftTop[1] - dir[1] * 2.2], shaftTop, 6.0, 6.9, '#fde047');

      // 3 tầng gai thép 2 mặt (lưng + mũi) cho đầu chùy uy nghi hơn
      for (const t of [-0.52, 0, 0.52]) {
        const wFactor = t === 0 ? 1.0 : 0.84;
        for (const side of [-1, 1]) {
          const sb = [maceCenter[0] + dir[0] * (ry * t) + perp[0] * (side * (rx * wFactor - 1.2)), maceCenter[1] + dir[1] * (ry * t) + perp[1] * (side * (rx * wFactor - 1.2))];
          const tipLen = t === 0 ? 6.8 : 5.4;
          const stp = [sb[0] + perp[0] * (side * tipLen) + dir[0] * (t * 2.4), sb[1] + perp[1] * (side * tipLen) + dir[1] * (t * 2.4)];
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(sb[0] - dir[0] * 3.0, sb[1] - dir[1] * 3.0);
          ctx.lineTo(stp[0] + perp[0] * side, stp[1] + perp[1] * side);
          ctx.lineTo(sb[0] + dir[0] * 3.0, sb[1] + dir[1] * 3.0);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(sb[0] - dir[0] * 2.0, sb[1] - dir[1] * 2.0);
          ctx.lineTo(stp[0], stp[1]);
          ctx.lineTo(sb[0] + dir[0] * 2.0, sb[1] + dir[1] * 2.0);
          ctx.closePath(); ctx.fill();
        }
      }

      // Mũi thương phá giáp trên đỉnh chùy (gilded diamond spear)
      const crownBase = [maceCenter[0] + dir[0] * (ry - 1.5), maceCenter[1] + dir[1] * (ry - 1.5)];
      const crownTip = [maceCenter[0] + dir[0] * (ry + 12.2), maceCenter[1] + dir[1] * (ry + 12.2)];
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(crownBase[0] - perp[0] * 4.4, crownBase[1] - perp[1] * 4.4);
      ctx.lineTo(crownTip[0] + dir[0] * 1.4, crownTip[1] + dir[1] * 1.4);
      ctx.lineTo(crownBase[0] + perp[0] * 4.4, crownBase[1] + perp[1] * 4.4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(crownBase[0] - perp[0] * 3.1, crownBase[1] - perp[1] * 3.1);
      ctx.lineTo(crownTip[0], crownTip[1]);
      ctx.lineTo(crownBase[0], crownBase[1]);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.moveTo(crownBase[0], crownBase[1]);
      ctx.lineTo(crownTip[0], crownTip[1]);
      ctx.lineTo(crownBase[0] + perp[0] * 3.1, crownBase[1] + perp[1] * 3.1);
      ctx.closePath(); ctx.fill();

      // Khối đầu chùy hình bầu dục vát cạnh kim loại 3D + gân vàng chia múi
      const maceAng = Math.atan2(dir[1], dir[0]);
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.ellipse(maceCenter[0], maceCenter[1], ry + 1.3, rx + 1.3, maceAng, 0, Math.PI * 2); ctx.fill();
      const headGrad = ctx.createRadialGradient(
        maceCenter[0] - perp[0] * 3 + dir[0] * 2,
        maceCenter[1] - perp[1] * 3 + dir[1] * 2,
        1.5, maceCenter[0], maceCenter[1], ry
      );
      headGrad.addColorStop(0, '#94a3b8');
      headGrad.addColorStop(0.5, '#334155');
      headGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = headGrad;
      ctx.beginPath(); ctx.ellipse(maceCenter[0], maceCenter[1], ry, rx, maceAng, 0, Math.PI * 2); ctx.fill();

      // Khung viền dọc và đai ngang bằng vàng kim chạm nổi
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(maceCenter[0] - dir[0] * (ry - 2), maceCenter[1] - dir[1] * (ry - 2));
      ctx.lineTo(maceCenter[0] + dir[0] * (ry - 2), maceCenter[1] + dir[1] * (ry - 2));
      ctx.moveTo(maceCenter[0] - perp[0] * (rx - 1), maceCenter[1] - perp[1] * (rx - 1));
      ctx.lineTo(maceCenter[0] + perp[0] * (rx - 1), maceCenter[1] + perp[1] * (rx - 1));
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(maceCenter[0], maceCenter[1], 2.7, 0, Math.PI * 2); ctx.fill();
      return;
    }

    // 3. CÔN TÁC CHIẾN HỢP KIM (Baton): Cán nhám kim cương, đai đỏ, vòng chắn bên, đầu tungsten vát cạnh & rãnh quang cyan
    if (st.weapon === 'baton') {
      const tipEnd = [b[0] + dir[0] * 3, b[1] + dir[1] * 3];
      const bg = [hand[0] + dir[0] * 6.5, hand[1] + dir[1] * 6.5];
      if (st && st._solid) {
        this.capsule(ctx, a, tipEnd, 5.8, 5.6, st._solid);
        this.capsule(ctx, [bg[0] - perp[0] * 4.4, bg[1] - perp[1] * 4.4], [bg[0] + perp[0] * 4.4, bg[1] + perp[1] * 4.4], 2.6, 2.6, st._solid);
        return;
      }
      // Viền bóng ngoài sắc
      this.capsule(ctx, a, tipEnd, 5.8, 5.5, 'rgba(8,12,22,0.75)');
      // Thân hợp kim vát hình trụ có chuyển sắc dọc trục ngang
      const midShaft = [(a[0] + tipEnd[0]) * 0.5, (a[1] + tipEnd[1]) * 0.5];
      const shaftGrad = ctx.createLinearGradient(
        midShaft[0] - perp[0] * 4.2, midShaft[1] - perp[1] * 4.2,
        midShaft[0] + perp[0] * 4.2, midShaft[1] + perp[1] * 4.2
      );
      shaftGrad.addColorStop(0, '#64748b');
      shaftGrad.addColorStop(0.42, '#1e293b');
      shaftGrad.addColorStop(1, '#0f172a');
      this.capsule(ctx, a, tipEnd, 4.4, 4.0, shaftGrad);

      // Vân cán nhám chống trượt quanh tay cầm
      ctx.strokeStyle = 'rgba(148,163,184,0.7)';
      ctx.lineWidth = 1.05;
      for (let s = -4; s <= 5; s += 2.8) {
        const gp = [hand[0] + dir[0] * s, hand[1] + dir[1] * s];
        ctx.beginPath();
        ctx.moveTo(gp[0] - perp[0] * 3.1, gp[1] - perp[1] * 3.1);
        ctx.lineTo(gp[0] + perp[0] * 3.1 + dir[0] * 1.4, gp[1] + perp[1] * 3.1 + dir[1] * 1.4);
        ctx.stroke();
      }

      // Chốt giữ tay (tonfa side-guard) & đai khóa đỏ
      this.capsule(ctx, [bg[0] - perp[0] * 4.4, bg[1] - perp[1] * 4.4], [bg[0] + perp[0] * 4.4, bg[1] + perp[1] * 4.4], 2.4, 2.4, '#cbd5e1');
      const collar = [hand[0] + dir[0] * (len * 0.62), hand[1] + dir[1] * (len * 0.62)];
      this.capsule(ctx, [collar[0] - dir[0] * 1.3, collar[1] - dir[1] * 1.3], [collar[0] + dir[0] * 1.3, collar[1] + dir[1] * 1.3], 4.8, 4.8, '#ef4444');

      // Đầu đập tungsten phình nhẹ kèm rãnh phát quang
      const t0 = [a[0] + dir[0] * len * 0.68, a[1] + dir[1] * len * 0.68];
      const headGrad = ctx.createLinearGradient(
        t0[0] - perp[0] * 5, t0[1] - perp[1] * 5,
        t0[0] + perp[0] * 5, t0[1] + perp[1] * 5
      );
      headGrad.addColorStop(0, '#f8fafc');
      headGrad.addColorStop(0.5, '#cbd5e1');
      headGrad.addColorStop(1, '#475569');
      this.capsule(ctx, t0, tipEnd, 4.9, 5.2, headGrad);
      this.capsule(ctx, [t0[0] + dir[0] * 2.5, t0[1] + dir[1] * 2.5], [tipEnd[0] - dir[0] * 2.5, tipEnd[1] - dir[1] * 2.5], 1.7, 1.7, st.aura || '#38bdf8');
      this.capsule(ctx, [t0[0] - perp[0] * 2.1, t0[1] - perp[1] * 2.1], [tipEnd[0] - perp[0] * 2.1, tipEnd[1] - perp[1] * 2.1], 1.1, 1.1, 'rgba(255,255,255,0.85)');

      // Đuôi chuôi vàng & tua dây đỏ
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(a[0], a[1], 2.9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(a[0] - dir[0] * 5 + perp[0] * 3, a[1] - dir[1] * 5 + perp[1] * 3 + 3, a[0] - dir[0] * 8, a[1] - dir[1] * 8 + 7);
      ctx.stroke();
      return;
    }

    // 4A-2. KIẾM TIỀN XU ĐỒNG CỔ RỰC LỬA (Châu Ngọc Thiên Khánh)
    if (st.weapon === 'coin_sword') {
      const swordBase = [hand[0] + dir[0] * 5.2, hand[1] + dir[1] * 5.2];
      const swordTip = [b[0] + dir[0] * 8.5, b[1] + dir[1] * 8.5];
      if (st && st._solid) {
        this.capsule(ctx, a, swordTip, 4.2, 1.6, st._solid);
        return;
      }
      // Chuôi đồng + dây đỏ tà đạo
      this.capsule(ctx, a, swordBase, 4.2, 4.0, '#1c1917');
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(a[0] - dir[0] * 6 + 2, a[1] - dir[1] * 6 + 5, a[0] - dir[0] * 10, a[1] - dir[1] * 10 + 9);
      ctx.stroke();

      // Hộ thủ đồng cổ chạm cánh
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(swordBase[0] - perp[0] * 6.8, swordBase[1] - perp[1] * 6.8);
      ctx.lineTo(swordBase[0] + dir[0] * 3.0, swordBase[1] + dir[1] * 3.0);
      ctx.lineTo(swordBase[0] + perp[0] * 6.8, swordBase[1] + perp[1] * 6.8);
      ctx.lineTo(swordBase[0] - dir[0] * 1.4, swordBase[1] - dir[1] * 1.4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#451a03'; ctx.lineWidth = 1.0; ctx.stroke();

      // Dây sống đỏ xuyên chuỗi 7 đồng xu cổ
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(swordBase[0], swordBase[1]); ctx.lineTo(swordTip[0], swordTip[1]); ctx.stroke();

      const coinCount = 7;
      for (let i = 0; i < coinCount; i++) {
        const t = (i + 0.65) / (coinCount + 0.5);
        const cx = swordBase[0] + (swordTip[0] - swordBase[0]) * t;
        const cy = swordBase[1] + (swordTip[1] - swordBase[1]) * t;
        const r = 3.5 - i * 0.16;
        ctx.fillStyle = '#eab308';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 0.85; ctx.stroke();
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - r * 0.34, cy - r * 0.34, r * 0.68, r * 0.68);
      }

      // Quầng lửa đỏ cam xoắn quanh Kiếm Xu
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.72)';
      ctx.lineWidth = 2.6;
      const tPulse = Math.sin(performance.now() * 0.015) * 4.2;
      ctx.beginPath();
      ctx.moveTo(swordBase[0], swordBase[1]);
      ctx.quadraticCurveTo(
        (swordBase[0] + swordTip[0]) * 0.5 + perp[0] * (8 + tPulse),
        (swordBase[1] + swordTip[1]) * 0.5 + perp[1] * (8 + tPulse),
        swordTip[0] + dir[0] * 4,
        swordTip[1] + dir[1] * 4
      );
      ctx.stroke();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.60)';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(swordBase[0], swordBase[1]);
      ctx.quadraticCurveTo(
        (swordBase[0] + swordTip[0]) * 0.5 - perp[0] * (8 - tPulse),
        (swordBase[1] + swordTip[1]) * 0.5 - perp[1] * (8 - tPulse),
        swordTip[0],
        swordTip[1]
      );
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 4A. HÀN BĂNG KIẾM (Giang Mạnh): Trường kiếm Đạo gia thẳng thanh mảnh hai lưỡi + Hộ thủ cánh phượng bạc xanh + Đốc ngọc
    if (st.frostBlade) {
      const swordBase = [hand[0] + dir[0] * 5.2, hand[1] + dir[1] * 5.2];
      const swordTip = [b[0] + dir[0] * 7.5, b[1] + dir[1] * 7.5];
      const swordMid = [hand[0] + dir[0] * (len * 0.72), hand[1] + dir[1] * (len * 0.72)];
      if (st && st._solid) {
        this.capsule(ctx, a, swordBase, 4.6, 4.6, st._solid);
        ctx.fillStyle = st._solid;
        ctx.beginPath();
        ctx.moveTo(swordBase[0] - perp[0] * 3.1, swordBase[1] - perp[1] * 3.1);
        ctx.lineTo(swordMid[0] - perp[0] * 2.5, swordMid[1] - perp[1] * 2.5);
        ctx.lineTo(swordTip[0], swordTip[1]);
        ctx.lineTo(swordMid[0] + perp[0] * 2.5, swordMid[1] + perp[1] * 2.5);
        ctx.lineTo(swordBase[0] + perp[0] * 3.1, swordBase[1] + perp[1] * 3.1);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = st._solid; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(swordBase[0] - perp[0] * 7.2, swordBase[1] - perp[1] * 7.2);
        ctx.lineTo(swordBase[0] + perp[0] * 7.2, swordBase[1] + perp[1] * 7.2);
        ctx.stroke();
        return;
      }
      // Tua ngọc xanh bay nhẹ từ đốc kiếm
      const pom = [a[0] - dir[0] * 1.5, a[1] - dir[1] * 1.5];
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pom[0], pom[1]); ctx.quadraticCurveTo(pom[0] - dir[0] * 5 + 2, pom[1] - dir[1] * 5 + 4, pom[0] - dir[0] * 8, pom[1] - dir[1] * 8 + 7); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(pom[0], pom[1], 3.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(pom[0], pom[1], 1.4, 0, Math.PI * 2); ctx.fill();

      // Chuôi kiếm quấn dây xanh lục lam
      this.capsule(ctx, a, swordBase, 4.2, 4.2, '#0f172a');
      this.capsule(ctx, [a[0] + dir[0] * 1.5, a[1] + dir[1] * 1.5], [swordBase[0] - dir[0] * 1.5, swordBase[1] - dir[1] * 1.5], 3.1, 3.1, '#0284c7');

      // Lưỡi Hàn Băng Kiếm 2 mặt vát kim cương thanh thoát
      ctx.fillStyle = 'rgba(2, 132, 199, 0.55)';
      ctx.beginPath();
      ctx.moveTo(swordBase[0] - perp[0] * 3.1, swordBase[1] - perp[1] * 3.1);
      ctx.lineTo(swordMid[0] - perp[0] * 2.5, swordMid[1] - perp[1] * 2.5);
      ctx.lineTo(swordTip[0] + dir[0] * 1.5, swordTip[1] + dir[1] * 1.5);
      ctx.lineTo(swordMid[0] + perp[0] * 2.5, swordMid[1] + perp[1] * 2.5);
      ctx.lineTo(swordBase[0] + perp[0] * 3.1, swordBase[1] + perp[1] * 3.1);
      ctx.closePath(); ctx.fill();

      // Nửa trái lưỡi (bóng thép xanh lam) & nửa phải lưỡi (bạc băng phản chiếu)
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(swordBase[0] - perp[0] * 2.5, swordBase[1] - perp[1] * 2.5);
      ctx.lineTo(swordMid[0] - perp[0] * 2.0, swordMid[1] - perp[1] * 2.0);
      ctx.lineTo(swordTip[0], swordTip[1]);
      ctx.lineTo(swordBase[0], swordBase[1]);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#f0f9ff';
      ctx.beginPath();
      ctx.moveTo(swordBase[0], swordBase[1]);
      ctx.lineTo(swordTip[0], swordTip[1]);
      ctx.lineTo(swordMid[0] + perp[0] * 2.0, swordMid[1] + perp[1] * 2.0);
      ctx.lineTo(swordBase[0] + perp[0] * 2.5, swordBase[1] + perp[1] * 2.5);
      ctx.closePath(); ctx.fill();

      // Sống kiếm (Fuller) chạy dọc chính giữa lưỡi
      ctx.strokeStyle = '#0369a1'; ctx.lineWidth = 1.25;
      ctx.beginPath(); ctx.moveTo(swordBase[0], swordBase[1]); ctx.lineTo(swordMid[0] + dir[0] * 5, swordMid[1] + dir[1] * 5); ctx.stroke();

      // Hộ thủ cánh phượng chạm khắc bạc & lam ngọc
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(swordBase[0] - perp[0] * 7.6 + dir[0] * 2.0, swordBase[1] - perp[1] * 7.6 + dir[1] * 2.0);
      ctx.lineTo(swordBase[0] + dir[0] * 2.8, swordBase[1] + dir[1] * 2.8);
      ctx.lineTo(swordBase[0] + perp[0] * 7.6 + dir[0] * 2.0, swordBase[1] + perp[1] * 7.6 + dir[1] * 2.0);
      ctx.lineTo(swordBase[0] + perp[0] * 5.2 - dir[0] * 1.4, swordBase[1] + perp[1] * 5.2 - dir[1] * 1.4);
      ctx.lineTo(swordBase[0] - perp[0] * 5.2 - dir[0] * 1.4, swordBase[1] - perp[1] * 5.2 - dir[1] * 1.4);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(swordBase[0] - perp[0] * 6.8 + dir[0] * 1.4, swordBase[1] - perp[1] * 6.8 + dir[1] * 1.4);
      ctx.quadraticCurveTo(swordBase[0], swordBase[1] - dir[1] * 1.2, swordBase[0] + perp[0] * 6.8 + dir[0] * 1.4, swordBase[1] + perp[1] * 6.8 + dir[1] * 1.4);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(swordBase[0] + dir[0] * 0.6, swordBase[1] + dir[1] * 0.6, 1.8, 0, Math.PI * 2); ctx.fill();
      return;
    }

    // 4B. SONG ĐOẢN ĐAO SHINOBI (Trần Dũng Hải): Tantō gọn sắc + Chuôi quấn dây đỏ đen + Tsuba lục giác
    if (st.weapon === 'twin_daggers') {
      const dgStart = [hand[0] + dir[0] * 4.8, hand[1] + dir[1] * 4.8];
      const dgShoulder = [hand[0] + dir[0] * (len * 0.72), hand[1] + dir[1] * (len * 0.72)];
      const dgTip = [b[0] + dir[0] * 3.5 - perp[0] * 1.8, b[1] + dir[1] * 3.5 - perp[1] * 1.8];
      if (st && st._solid) {
        this.capsule(ctx, a, dgStart, 4.4, 4.4, st._solid);
        ctx.fillStyle = st._solid;
        ctx.beginPath();
        ctx.moveTo(dgStart[0] - perp[0] * 2.8, dgStart[1] - perp[1] * 2.8);
        ctx.lineTo(dgShoulder[0] - perp[0] * 2.3, dgShoulder[1] - perp[1] * 2.3);
        ctx.lineTo(dgTip[0] + dir[0] * 1.4, dgTip[1] + dir[1] * 1.4);
        ctx.lineTo(dgShoulder[0] + perp[0] * 3.3, dgShoulder[1] + perp[1] * 3.3);
        ctx.lineTo(dgStart[0] + perp[0] * 3.0, dgStart[1] + perp[1] * 3.0);
        ctx.closePath(); ctx.fill();
        return;
      }
      this.capsule(ctx, a, dgStart, 4.4, 4.4, '#0f172a');
      // Quấn dây tsuka-ito đỏ đen
      ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 1.6;
      for (let t = -3.5; t <= 2.5; t += 2.2) {
        const gp = [hand[0] + dir[0] * t, hand[1] + dir[1] * t];
        ctx.beginPath();
        ctx.moveTo(gp[0] - perp[0] * 2.1, gp[1] - perp[1] * 2.1);
        ctx.lineTo(gp[0] + perp[0] * 2.1 + dir[0] * 1.1, gp[1] + perp[1] * 2.1 + dir[1] * 1.1);
        ctx.stroke();
      }
      // Viền + Thân đoản đao Tantō hai tone thép
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.beginPath();
      ctx.moveTo(dgStart[0] - perp[0] * 3.1, dgStart[1] - perp[1] * 3.1);
      ctx.lineTo(dgShoulder[0] - perp[0] * 2.5, dgShoulder[1] - perp[1] * 2.5);
      ctx.lineTo(dgTip[0] + dir[0] * 1.4, dgTip[1] + dir[1] * 1.4);
      ctx.lineTo(dgShoulder[0] + perp[0] * 3.5, dgShoulder[1] + perp[1] * 3.5);
      ctx.lineTo(dgStart[0] + perp[0] * 3.2, dgStart[1] + perp[1] * 3.2);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(dgStart[0] - perp[0] * 2.2, dgStart[1] - perp[1] * 2.2);
      ctx.lineTo(dgShoulder[0] - perp[0] * 1.7, dgShoulder[1] - perp[1] * 1.7);
      ctx.lineTo(dgTip[0], dgTip[1]);
      ctx.lineTo(dgShoulder[0] + perp[0] * 2.7, dgShoulder[1] + perp[1] * 2.7);
      ctx.lineTo(dgStart[0] + perp[0] * 2.4, dgStart[1] + perp[1] * 2.4);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(dgStart[0] - perp[0] * 2.2, dgStart[1] - perp[1] * 2.2);
      ctx.lineTo(dgShoulder[0] - perp[0] * 1.7, dgShoulder[1] - perp[1] * 1.7);
      ctx.lineTo(dgTip[0], dgTip[1]);
      ctx.lineTo(dgShoulder[0] + perp[0] * 0.4, dgShoulder[1] + perp[1] * 0.4);
      ctx.lineTo(dgStart[0] + perp[0] * 0.4, dgStart[1] + perp[1] * 0.4);
      ctx.closePath(); ctx.fill();

      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.05;
      ctx.beginPath(); ctx.moveTo(dgStart[0] + perp[0] * 2.1, dgStart[1] + perp[1] * 2.1); ctx.lineTo(dgShoulder[0] + perp[0] * 2.5, dgShoulder[1] + perp[1] * 2.5); ctx.lineTo(dgTip[0], dgTip[1]); ctx.stroke();

      // Tsuba nhỏ sắc cạnh
      this.capsule(ctx, [dgStart[0] - perp[0] * 4.4, dgStart[1] - perp[1] * 4.4], [dgStart[0] + perp[0] * 4.4, dgStart[1] + perp[1] * 4.4], 1.9, 1.9, '#334155');
      return;
    }

    // 4. MÃ TẤU / ĐOẢN ĐAO (Machete, Knife fallback)
    const isDagger = st.weapon === 'twin_daggers' || st.weapon === 'knife';
    const isFrost = !!st.frostBlade;
    const isMachete = !isDagger && !isFrost;
    const bladeTint = isFrost ? '#bae6fd' : '#e2e8f0';
    const spineCol = isFrost ? '#0369a1' : (st.weapon === 'twin_daggers' ? '#334155' : '#1e293b');
    const bladeStart = [hand[0] + dir[0] * 5, hand[1] + dir[1] * 5];
    const curveOff = isFrost ? 4.2 : (st.weapon === 'twin_daggers' ? 2.4 : 1.4);
    const bladeTip = [b[0] + dir[0] * (isMachete ? 6.5 : 4) - perp[0] * curveOff, b[1] + dir[1] * (isMachete ? 6.5 : 4) - perp[1] * curveOff];
    const midBell = [hand[0] + dir[0] * (len * 0.72), hand[1] + dir[1] * (len * 0.72)];
    const wBase = isDagger ? 2.8 : (isMachete ? 3.8 : 3.4);
    const wBell = isDagger ? 3.5 : (isMachete ? 6.6 : 5.4);

    if (st && st._solid) {
      this.capsule(ctx, a, bladeStart, 4.8, 4.8, st._solid);
      ctx.fillStyle = st._solid;
      ctx.beginPath();
      ctx.moveTo(bladeStart[0] - perp[0] * (wBase + 1), bladeStart[1] - perp[1] * (wBase + 1));
      ctx.lineTo(midBell[0] - perp[0] * (wBase + 0.8), midBell[1] - perp[1] * (wBase + 0.8));
      ctx.lineTo(bladeTip[0] + dir[0] * 1.5, bladeTip[1] + dir[1] * 1.5);
      ctx.lineTo(midBell[0] + perp[0] * (wBell + 1), midBell[1] + perp[1] * (wBell + 1));
      ctx.lineTo(bladeStart[0] + perp[0] * (wBase + 1), bladeStart[1] + perp[1] * (wBase + 1));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = st._solid; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bladeStart[0] - perp[0] * 5.8, bladeStart[1] - perp[1] * 5.8);
      ctx.lineTo(bladeStart[0] + perp[0] * 5.8, bladeStart[1] + perp[1] * 5.8);
      ctx.stroke();
      return;
    }

    // Chuôi đao quấn dây (đỏ hoặc bạc xanh cho Hàn Băng Kiếm)
    this.capsule(ctx, a, bladeStart, 4.6, 4.6, '#1e293b');
    ctx.strokeStyle = isFrost ? '#38bdf8' : '#dc2626'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hand[0] - dir[0] * 4.5, hand[1] - dir[1] * 4.5); ctx.lineTo(hand[0] + dir[0] * 3, hand[1] + dir[1] * 3); ctx.stroke();

    // Lưỡi đao đa giác sắc lẹm (bao gồm răng cưa lưng Mã Tấu để viền bóng bọc gọn)
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * (wBase + 1), bladeStart[1] - perp[1] * (wBase + 1));
    if (isMachete) {
      for (let ti = 0; ti < 3; ti++) {
        const f0 = 0.42 + ti * 0.10;
        const oRoot = [bladeStart[0] + dir[0] * (len * f0) - perp[0] * (wBase + 0.6), bladeStart[1] + dir[1] * (len * f0) - perp[1] * (wBase + 0.6)];
        const oPeak = [bladeStart[0] + dir[0] * (len * (f0 + 0.045)) - perp[0] * (wBase + 3.2), bladeStart[1] + dir[1] * (len * (f0 + 0.045)) - perp[1] * (wBase + 3.2)];
        ctx.lineTo(oRoot[0], oRoot[1]);
        ctx.lineTo(oPeak[0], oPeak[1]);
      }
    }
    ctx.lineTo(midBell[0] - perp[0] * (wBase + 0.8), midBell[1] - perp[1] * (wBase + 0.8));
    ctx.lineTo(bladeTip[0] + dir[0] * 1.5, bladeTip[1] + dir[1] * 1.5);
    ctx.lineTo(midBell[0] + perp[0] * (wBell + 1), midBell[1] + perp[1] * (wBell + 1));
    ctx.lineTo(bladeStart[0] + perp[0] * (wBase + 1), bladeStart[1] + perp[1] * (wBase + 1));
    ctx.closePath();
    ctx.fill();

    // Phần lưỡi sáng với gradient thép bóng (cho Mã Tấu) & răng cưa sống lưng
    if (isMachete) {
      const mGrad = ctx.createLinearGradient(
        midBell[0] - perp[0] * wBell, midBell[1] - perp[1] * wBell,
        midBell[0] + perp[0] * wBell, midBell[1] + perp[1] * wBell
      );
      mGrad.addColorStop(0, '#475569');
      mGrad.addColorStop(0.55, '#cbd5e1');
      mGrad.addColorStop(1, '#f8fafc');
      ctx.fillStyle = mGrad;
    } else {
      ctx.fillStyle = bladeTint;
    }
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * wBase, bladeStart[1] - perp[1] * wBase);
    if (isMachete) {
      for (let ti = 0; ti < 3; ti++) {
        const f0 = 0.42 + ti * 0.10;
        const pRoot = [bladeStart[0] + dir[0] * (len * f0) - perp[0] * (wBase * 0.9), bladeStart[1] + dir[1] * (len * f0) - perp[1] * (wBase * 0.9)];
        const pPeak = [bladeStart[0] + dir[0] * (len * (f0 + 0.045)) - perp[0] * (wBase + 2.2), bladeStart[1] + dir[1] * (len * (f0 + 0.045)) - perp[1] * (wBase + 2.2)];
        ctx.lineTo(pRoot[0], pRoot[1]);
        ctx.lineTo(pPeak[0], pPeak[1]);
      }
    }
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
    ctx.strokeStyle = isFrost ? '#e0f2fe' : '#ffffff'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] + perp[0] * (wBase * 0.8), bladeStart[1] + perp[1] * (wBase * 0.8));
    ctx.lineTo(midBell[0] + perp[0] * (wBell * 0.9), midBell[1] + perp[1] * (wBell * 0.9));
    ctx.lineTo(bladeTip[0], bladeTip[1]);
    ctx.stroke();

    // Rãnh máu / Vân hàn băng chạy dọc thân đao
    const fullerA = [bladeStart[0] + dir[0] * 4, bladeStart[1] + dir[1] * 4];
    const fullerB = [bladeStart[0] + (bladeTip[0] - bladeStart[0]) * 0.78, bladeStart[1] + (bladeTip[1] - bladeStart[1]) * 0.78];
    ctx.strokeStyle = isFrost ? 'rgba(56, 189, 248, 0.85)' : (isDagger ? 'rgba(15, 23, 42, 0.7)' : 'rgba(30, 41, 59, 0.55)');
    ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fullerA[0], fullerA[1]); ctx.lineTo(fullerB[0], fullerB[1]); ctx.stroke();

    // Ánh chớp lấp lánh trên mũi đao & hàn khí
    const gl = 0.55 + 0.45 * Math.sin(performance.now() * 0.012 + len);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,255,255,${0.55 * gl})`;
    ctx.beginPath(); ctx.arc(bladeTip[0] - dir[0] * 3, bladeTip[1] - dir[1] * 3, 2.1, 0, Math.PI * 2); ctx.fill();
    if (isFrost) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.42 + 0.25 * gl})`; ctx.lineWidth = 3.6;
      ctx.beginPath(); ctx.moveTo(bladeStart[0], bladeStart[1]); ctx.lineTo(bladeTip[0], bladeTip[1]); ctx.stroke();
    }
    ctx.restore();

    // Chắn tay (Tsuba) bạc cho Giang Mạnh / thép tối cho Dung Hải / đồng vàng mặc định
    const tsubaRim = isFrost ? '#64748b' : (isDagger ? '#334155' : '#92400e');
    const tsubaCore = isFrost ? '#e2e8f0' : (isDagger ? '#94a3b8' : '#fbbf24');
    ctx.strokeStyle = tsubaRim; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * 5.8, bladeStart[1] - perp[1] * 5.8);
    ctx.lineTo(bladeStart[0] + perp[0] * 5.8, bladeStart[1] + perp[1] * 5.8);
    ctx.stroke();
    ctx.strokeStyle = tsubaCore; ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(bladeStart[0] - perp[0] * 5.2, bladeStart[1] - perp[1] * 5.2);
    ctx.lineTo(bladeStart[0] + perp[0] * 5.2, bladeStart[1] + perp[1] * 5.2);
    ctx.stroke();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath(); ctx.arc(bladeStart[0], bladeStart[1], 1.5, 0, Math.PI * 2); ctx.fill();

    // Đuôi chuôi (pommel)
    ctx.fillStyle = tsubaCore;
    ctx.beginPath(); ctx.arc(a[0], a[1], 2.8, 0, Math.PI * 2); ctx.fill();
    if (!isFrost && !isDagger) {
      ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(a[0] - dir[0] * 6 + perp[0] * 4, a[1] - dir[1] * 6 + perp[1] * 4 + 3, a[0] - dir[0] * 9, a[1] - dir[1] * 9 + 6);
      ctx.stroke();
    }
  }
}

window.SkeletalRendererWeapon = SkeletalRendererWeapon;
})();
