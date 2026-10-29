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
}

window.SkeletalRendererWeapon = SkeletalRendererWeapon;
})();
