/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationBody.js - Ve than, dau, chan dung va the skin.
 */

(function () {
const { AnimUtil, STYLE_DEFS, VARIANTS, ATTACK_STATES, POSE_ALIAS, POSE_KEYS, shadeColor, hashStr } = window;

class SkeletalRendererBody extends window.SkeletalRendererWeapon {
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

window.SkeletalRendererBody = SkeletalRendererBody;
})();
