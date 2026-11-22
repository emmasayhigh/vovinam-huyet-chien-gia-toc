/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation/animationBody.js - Ve than, dau, chan dung va the skin.
 */

(function () {
const { AnimUtil, STYLE_DEFS, VARIANTS, ATTACK_STATES, POSE_ALIAS, POSE_KEYS, shadeColor, hashStr } = window;

const _ParentRenderer = window.SkeletalRendererArchetypes || window.SkeletalRendererWeapon;
class SkeletalRendererBody extends _ParentRenderer {
  drawTorso(ctx, jt, st, motion) {
    const { H, sh, d, pp } = jt;
    const isSolid = !!(st && st._solid);
    const rig = st.rig || {};
    const shW = rig.shW || 11.4;
    const waW = rig.waW || 8.4;
    const hipW = rig.hipW || 10.6;
    const chestOut = rig.chestOut || 13.6;
    const arch = st.archetype;
    const P = (base, a, b) => [base[0] + pp[0] * a + d[0] * b, base[1] + pp[1] * a + d[1] * b];

    // Khối thân giải phẫu có độ dày lồng ngực, cơ xô, hông và vai vững chãi
    const backSh = P(sh, -shW, 1.0), frontSh = P(sh, shW, 1.0);
    const backLat = P(sh, -shW * 1.09, -10.8);
    const backWa = P(H, -waW, 6.4), frontWa = P(H, waW, 6.4);
    const backHip = P(H, -hipW * 1.05, -2.5), frontHip = P(H, hipW * 1.05, -2.5);
    const backSk = P(H, -hipW, -8.5), frontSk = P(H, hipW, -8.5);
    const chest = P(sh, chestOut, -9.2);
    const shoulderMid = P(sh, 0.6, 2.8);

    const path = () => {
      ctx.beginPath();
      ctx.moveTo(backSh[0], backSh[1]);
      ctx.quadraticCurveTo(shoulderMid[0], shoulderMid[1], frontSh[0], frontSh[1]);
      ctx.quadraticCurveTo(chest[0], chest[1], frontWa[0], frontWa[1]);
      ctx.quadraticCurveTo(frontHip[0], frontHip[1], frontSk[0], frontSk[1]);
      ctx.lineTo(backSk[0], backSk[1]);
      ctx.quadraticCurveTo(backHip[0], backHip[1], backWa[0], backWa[1]);
      ctx.quadraticCurveTo(backLat[0], backLat[1], backSh[0], backSh[1]);
      ctx.closePath();
    };
    path();
    ctx.lineWidth = 1.85; ctx.strokeStyle = this._edge(st, 'rgba(6,8,14,0.68)'); ctx.lineJoin = 'round'; ctx.stroke();

    if (isSolid) {
      path();
      ctx.fillStyle = st._solid;
      ctx.fill();
    } else {
      const torsoMat = arch === 'phoenix_general'
        ? 'metal'
        : (arch === 'patriarch_sword_robe' || arch === 'mafia_overcoat' ? 'silk' : (arch === 'cyber_trench' ? 'leather' : 'fabric'));
      path();
      ctx.fillStyle = this._materialFill
        ? this._materialFill(ctx, st, torsoMat, backSh[0], backSh[1], frontSh[0], frontSh[1], st.gi)
        : st.gi;
      ctx.fill();

      // Lớp bóng đổ dưới nách, gầm ngực & nếp dồn thắt lưng
      ctx.save();
      path(); ctx.clip();
      const waistShade = ctx.createLinearGradient(H[0], H[1] + 9, H[0], H[1] - 2);
      waistShade.addColorStop(0, 'rgba(0,0,0,0)');
      waistShade.addColorStop(1, 'rgba(0,0,0,0.34)');
      ctx.fillStyle = waistShade;
      ctx.fillRect(Math.min(backSh[0], backSk[0]) - 8, Math.min(backSh[1], frontSh[1]) - 10, 60, 70);
      ctx.restore();
    }

    // Hệ thống nếp gấp vải đa cụm, viền khối cơ ngực & rim light (Phase 5 Shading)
    if (!isSolid) {
      const fA = P(H, -1.8, 10.5), fC1 = P(H, -2.8, 3.0), fB = P(H, -3.5, -4.8);
      const fC = P(H, 2.4, 8.8), fC2 = P(H, 4.0, 2.5), fD = P(H, 4.8, -3.2);
      const pec1 = P(sh, 1.8, -9.8), pecMid = P(sh, Math.max(5.2, shW * 0.56), -11.0), pec2 = P(sh, Math.max(7.4, shW * 0.85), -8.6);
      const wFoldL1 = P(H, -waW + 0.8, 5.2), wFoldL2 = P(H, -2.0, 2.8);
      const wFoldR1 = P(H, waW - 0.8, 5.2), wFoldR2 = P(H, 3.0, 2.8);
      if (this._drawFoldCluster) {
        this._drawFoldCluster(ctx, st, [
          [fA[0], fA[1], fC1[0], fC1[1], fB[0], fB[1]],
          [fC[0], fC[1], fC2[0], fC2[1], fD[0], fD[1]],
          [pec1[0], pec1[1], pecMid[0], pecMid[1], pec2[0], pec2[1]],
          [wFoldL1[0], wFoldL1[1], (wFoldL1[0] + wFoldL2[0]) * 0.5, wFoldL1[1] - 1, wFoldL2[0], wFoldL2[1]],
          [wFoldR1[0], wFoldR1[1], (wFoldR1[0] + wFoldR2[0]) * 0.5, wFoldR1[1] - 1, wFoldR2[0], wFoldR2[1]]
        ], 'rgba(0,0,0,0.34)', 1.15);
      }
      if (this._drawRimLight) {
        this._drawRimLight(ctx, st, [
          [frontSh[0] - pp[0] * 1.4, frontSh[1] - pp[1] * 1.4],
          [chest[0] - pp[0] * 1.6, chest[1] - pp[1] * 1.6],
          [frontWa[0] - pp[0] * 1.4, frontWa[1] - pp[1] * 1.4]
        ], 'rgba(255,255,255,0.20)', 1.1);
      }
    }

    // Cổ áo & cấu tạo tầng trang phục theo từng Archetype (9 nhân vật + dự phòng cho quái/NPC)
    const neckF = P(sh, 3.6, 2.2), crossB = P(H, -4.4, 4.2), neckB = P(sh, -3.6, 2.2), crossF = P(H, 5.6, 4.2);
    const v1 = P(sh, -3.8, 1.6), v2 = P(sh, 5.0, 1.6), v3 = P(sh, 0.9, -11.5);

    if (arch === 'vovinam_master') {
      // Võ phục Vovinam truyền thống: Ngực chữ V (Nghị trần săn chắc có đường cơ ngực) + Ve cổ áo chéo 2 lớp dày + Thẻ tên + Huy hiệu
      if (!isSolid) {
        if (st.bareVChest) {
          ctx.fillStyle = this._materialFill ? this._materialFill(ctx, st, 'skin', v1[0], v1[1], v2[0], v2[1], st.skin) : st.skin;
        } else {
          ctx.fillStyle = st.under || '#e5e7eb';
        }
        ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v2[0], v2[1]); ctx.lineTo(v3[0], v3[1] - 1.5); ctx.closePath(); ctx.fill();
        if (st.bareVChest) {
          // Đường rãnh ngực & xương quai xanh tạo khối giải phẫu nam tính
          ctx.strokeStyle = st.skinD || '#a9744d'; ctx.lineWidth = 1.05;
          ctx.beginPath();
          ctx.moveTo(P(sh, 0.9, -2.5)[0], P(sh, 0.9, -2.5)[1]);
          ctx.lineTo(v3[0], v3[1] + 2.0);
          ctx.moveTo(v3[0] - 1.2, v3[1] + 5.2); ctx.lineTo(v3[0] + 2.4, v3[1] + 3.8);
          ctx.stroke();
        }
        // Ve cổ áo võ phục 2 tầng có viền bóng tối & highlight
        for (const [a, b, wShift] of [[neckB, crossF, 0], [neckF, crossB, 0]]) {
          ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          ctx.strokeStyle = st.giD; ctx.lineWidth = 3.2;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          ctx.strokeStyle = st.giL; ctx.lineWidth = 1.65;
          ctx.beginPath(); ctx.moveTo(a[0] + pp[0] * 0.4, a[1] + pp[1] * 0.4); ctx.lineTo(b[0] + pp[0] * 0.4, b[1] + pp[1] * 0.4); ctx.stroke();
        }
        // Thẻ tên chữ nhật vàng-trắng bên ngực trái gọn sát đường viền võ phục
        if (st.nameTag) {
          const nt = P(sh, 3.8, -7.8);
          ctx.save();
          ctx.translate(nt[0], nt[1]);
          ctx.rotate(Math.atan2(d[0], -d[1]));
          ctx.fillStyle = '#b45309'; ctx.fillRect(-2.6, -1.45, 5.2, 2.9);
          ctx.fillStyle = '#facc15'; ctx.fillRect(-2.35, -1.2, 4.7, 2.4);
          ctx.fillStyle = '#f8fafc'; ctx.fillRect(-1.75, -0.75, 3.5, 1.5);
          ctx.fillStyle = '#1e293b'; ctx.fillRect(-1.25, -0.25, 2.5, 0.55);
          ctx.restore();
        }
        // Họa tiết vằn da Hổ Xám & Cổ lông hổ trên võ phục (Ngô Nhất Nghị — Hổ Xám Sơn Lâm)
        if (st.tigerStripes) {
          ctx.save();
          path(); ctx.clip();
          ctx.fillStyle = '#111827';
          const stripeRows = [
            [[-12.5, -5.0], [-4.2, -7.2], [-11.5, -9.0]],
            [[-11.8, -13.5], [-3.8, -15.2], [-10.8, -17.5]],
            [[-10.2, -22.0], [-3.2, -23.5], [-9.2, -25.8]],
            [[13.0, -5.5], [4.5, -8.0], [11.8, -9.8]],
            [[11.8, -14.0], [4.2, -16.0], [10.6, -18.2]],
            [[10.0, -22.2], [3.5, -24.0], [9.0, -26.0]]
          ];
          for (const [a, b, cPt] of stripeRows) {
            const pA = P(sh, a[0], a[1]), pB = P(sh, b[0], b[1]), pC = P(sh, cPt[0], cPt[1]);
            ctx.beginPath();
            ctx.moveTo(pA[0], pA[1]);
            ctx.quadraticCurveTo(pB[0], pB[1], pC[0], pC[1]);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
        if (st.tigerFurCollar) {
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.05;
          for (const side of [-1, 1]) {
            const s0 = P(sh, side * 4.2, 2.5);
            const s1 = P(sh, side * (shW + 2.5), 3.0);
            const s2 = P(sh, side * (shW + 3.2), -5.0);
            const s3 = P(sh, side * 6.8, -4.5);
            ctx.beginPath();
            ctx.moveTo(s0[0], s0[1]);
            ctx.lineTo(s1[0], s1[1]);
            ctx.lineTo(s2[0], s2[1]);
            ctx.lineTo(s3[0], s3[1]);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
          }
        }
      }
    } else if (arch === 'mafia_overcoat') {
      // Phó Văn Anh: Sơ mi đen cổ bẻ + Cà vạt lụa vàng có kẹp + Gile đỏ rượu vang thêu chỉ vàng cổ chữ V 5 cúc + Ve măng-tô khoác vai
      if (!isSolid) {
        ctx.fillStyle = st.under || '#14161e';
        ctx.beginPath(); ctx.moveTo(v1[0] - 0.5, v1[1]); ctx.lineTo(v2[0] + 0.5, v2[1]); ctx.lineTo(v3[0], v3[1] - 2.5); ctx.closePath(); ctx.fill();
        // Lá cổ sơ mi đen
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(P(sh, -1.2, -1.8)[0], P(sh, -1.2, -1.8)[1]);
        ctx.moveTo(v2[0], v2[1]); ctx.lineTo(P(sh, 2.8, -1.8)[0], P(sh, 2.8, -1.8)[1]); ctx.stroke();

        // Cà vạt vàng hoàng gia + nút thắt & kẹp
        const tKnot = P(sh, 0.9, -0.6), tMid = P(sh, 1.1, -9.2), tEnd = P(sh, 1.2, -14.2);
        ctx.strokeStyle = '#92400e'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tKnot[0], tKnot[1]); ctx.lineTo(tEnd[0], tEnd[1]); ctx.stroke();
        ctx.strokeStyle = st.tieColor || '#eab308'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.moveTo(tKnot[0], tKnot[1]); ctx.lineTo(tEnd[0], tEnd[1]); ctx.stroke();
        ctx.fillStyle = '#fef08a'; ctx.fillRect(tMid[0] - 1.4, tMid[1] - 0.5, 2.8, 0.9);

        // Áo gile đỏ rượu vang 2 nửa có xẻ đáy chữ A, bóng lụa và viền thêu hoa văn vàng quanh cổ
        const gTL = P(sh, -shW + 2.2, -0.5), gTR = P(sh, shW - 1.8, -0.5);
        const gBL = P(H, -waW + 0.2, 2.4), gBM = P(H, 1.2, 5.2), gBR = P(H, waW - 0.2, 2.4);
        const vestFill = this._materialFill
          ? this._materialFill(ctx, st, 'silk', gTL[0], gTL[1], gTR[0], gTR[1], st.vestColor || '#6b1d2f')
          : (st.vestColor || '#6b1d2f');
        ctx.fillStyle = vestFill;
        ctx.beginPath();
        ctx.moveTo(gTL[0], gTL[1]); ctx.lineTo(v1[0], v1[1]); ctx.lineTo(v3[0], v3[1] - 2.5);
        ctx.lineTo(v2[0], v2[1]); ctx.lineTo(gTR[0], gTR[1]);
        ctx.lineTo(gBR[0], gBR[1]); ctx.lineTo(gBM[0], gBM[1]); ctx.lineTo(gBL[0], gBL[1]);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#3f0d1b'; ctx.lineWidth = 1.2; ctx.stroke();

        // Đường thêu vàng hoa văn chạy sát ve áo gile
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v3[0], v3[1] - 2.5); ctx.lineTo(v2[0], v2[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(v1[0] - pp[0] * 1.6, v1[1]); ctx.lineTo(v3[0] - pp[0] * 1.4, v3[1] - 4);
        ctx.moveTo(v2[0] + pp[0] * 1.6, v2[1]); ctx.lineTo(v3[0] + pp[0] * 1.4, v3[1] - 4);
        ctx.stroke();
        // Hàng 4 cúc vàng + khe túi gile
        ctx.fillStyle = '#facc15';
        for (let i = 0; i < 4; i++) {
          const bp = P(sh, 1.3, -13.5 - i * 3.8);
          ctx.beginPath(); ctx.arc(bp[0], bp[1], 1.05, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.0;
        const wp = P(H, 5.2, 6.2); ctx.beginPath(); ctx.moveTo(wp[0] - 2.2, wp[1]); ctx.lineTo(wp[0] + 2.2, wp[1]); ctx.stroke();

        // Ve cổ áo măng-tô đen khoác gọn mép vai ngoài để lộ rõ gile đỏ, cà vạt vàng & vùng cổ thông thoáng
        const cFill = this._materialFill ? this._materialFill(ctx, st, 'fabric', P(sh, -shW, 0)[0], P(sh, -shW, 0)[1], P(sh, shW, 0)[0], P(sh, shW, 0)[1], st.coatColor || '#11131a') : '#11131a';
        ctx.fillStyle = cFill;
        const cL1 = P(sh, -shW - 1.4, 1.2), cL2 = P(sh, -5.6, 1.4), cL3 = P(sh, -7.8, -14.5), cL4 = P(sh, -shW - 1.4, -13.0);
        ctx.beginPath(); ctx.moveTo(cL1[0], cL1[1]); ctx.lineTo(cL2[0], cL2[1]); ctx.lineTo(cL3[0], cL3[1]); ctx.lineTo(cL4[0], cL4[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(202, 138, 4, 0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
        const cR1 = P(sh, shW + 1.0, 1.2), cR2 = P(sh, 6.2, 1.4), cR3 = P(sh, 8.2, -14.5), cR4 = P(sh, shW + 1.0, -11.5);
        ctx.beginPath(); ctx.moveTo(cR1[0], cR1[1]); ctx.lineTo(cR2[0], cR2[1]); ctx.lineTo(cR3[0], cR3[1]); ctx.lineTo(cR4[0], cR4[1]); ctx.closePath(); ctx.fill();
        ctx.stroke();
      }
    } else if (arch === 'cyber_trench') {
      // Phó Tiến Đăng: Cổ áo đứng sắc cạnh viền bạc thoáng cằm + Giáp ngực chiến thuật phân khối tối + Áo khoác trench xẻ ngực thanh thoát
      const colL = P(sh, -5.8, 4.6), colR = P(sh, 5.8, 4.0), colBL = P(sh, -6.6, -0.6), colBR = P(sh, 6.6, -0.6);
      if (!isSolid) {
        // Thân giáp chiến thuật phân múi bụng + cơ ngực bọc tối
        ctx.fillStyle = '#0b111c';
        const pl1 = P(sh, -7.8, -1.5), pl2 = P(sh, 7.8, -1.5), pl3 = P(sh, 6.5, -13.5), pl4 = P(sh, -6.5, -13.5);
        ctx.beginPath(); ctx.moveTo(pl1[0], pl1[1]); ctx.lineTo(pl2[0], pl2[1]); ctx.lineTo(pl3[0], pl3[1]); ctx.lineTo(pl4[0], pl4[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(P(sh, -6.5, -7.5)[0], P(sh, -6.5, -7.5)[1]); ctx.lineTo(P(sh, 7.5, -7.5)[0], P(sh, 7.5, -7.5)[1]);
        ctx.moveTo(P(sh, 1.0, -2.0)[0], P(sh, 1.0, -2.0)[1]); ctx.lineTo(P(H, 0.9, 6.5)[0], P(H, 0.9, 6.5)[1]);
        ctx.moveTo(P(sh, -4.5, -17)[0], P(sh, -4.5, -17)[1]); ctx.lineTo(P(sh, 5.5, -17)[0], P(sh, 5.5, -17)[1]);
        ctx.stroke();

        // Cổ đứng trench-coat cứng cáp có viền bạc mảnh thanh thoát
        ctx.fillStyle = this._materialFill ? this._materialFill(ctx, st, 'leather', colBL[0], colBL[1], colBR[0], colBR[1], st.coatColor || '#131926') : '#131926';
        ctx.beginPath(); ctx.moveTo(colBL[0], colBL[1]); ctx.lineTo(colL[0], colL[1]); ctx.lineTo(colR[0], colR[1]); ctx.lineTo(colBR[0], colBR[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.25; ctx.stroke();

        // Ve áo khoác xẻ V đứng hai bên thân có đường viền bạc thanh mảnh & ánh cyan tinh tế
        const lapL1 = P(sh, -4.8, 0.5), lapL2 = P(H, -4.8, 2.2), lapR1 = P(sh, 5.6, 0.5), lapR2 = P(H, 5.2, 2.2);
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.25; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(lapL1[0], lapL1[1]); ctx.lineTo(lapL2[0], lapL2[1]); ctx.moveTo(lapR1[0], lapR1[1]); ctx.lineTo(lapR2[0], lapR2[1]); ctx.stroke();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)'; ctx.lineWidth = 0.85;
        ctx.beginPath(); ctx.moveTo(P(sh, -3.2, -2.5)[0], P(sh, -3.2, -2.5)[1]); ctx.lineTo(P(H, -3.4, 3.0)[0], P(H, -3.4, 3.0)[1]); ctx.stroke();
      } else {
        ctx.fillStyle = st._solid;
        ctx.beginPath(); ctx.moveTo(colBL[0], colBL[1]); ctx.lineTo(colL[0], colL[1]); ctx.lineTo(colR[0], colR[1]); ctx.lineTo(colBR[0], colBR[1]); ctx.closePath(); ctx.fill();
      }
    } else if (arch === 'patriarch_draped_suit') {
      if (st.dogFurSkin) {
        if (!isSolid) {
          // Lông trắng xù dày quanh cổ & trước ngực (Skin Chó Trắng Mũi Đỏ Đội Nón)
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(P(sh, -8.5, 0)[0], P(sh, -8.5, 0)[1]);
          ctx.lineTo(P(sh, -4.5, -5.5)[0], P(sh, -4.5, -5.5)[1]);
          ctx.lineTo(P(sh, -1.5, -2.5)[0], P(sh, -1.5, -2.5)[1]);
          ctx.lineTo(P(sh, 1.5, -7.0)[0], P(sh, 1.5, -7.0)[1]);
          ctx.lineTo(P(sh, 4.5, -2.5)[0], P(sh, 4.5, -2.5)[1]);
          ctx.lineTo(P(sh, 8.8, 0)[0], P(sh, 8.8, 0)[1]);
          ctx.lineTo(P(sh, 6.2, -16)[0], P(sh, 6.2, -16)[1]);
          ctx.lineTo(P(sh, 0.8, -21)[0], P(sh, 0.8, -21)[1]);
          ctx.lineTo(P(sh, -6.0, -16)[0], P(sh, -6.0, -16)[1]);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
      } else if (!isSolid) {
        const suitBox = () => {
          ctx.beginPath();
          ctx.moveTo(P(sh, -shW + 2.5, 0)[0], P(sh, -shW + 2.5, 0)[1]);
          ctx.lineTo(P(sh, shW - 2.2, 0)[0], P(sh, shW - 2.2, 0)[1]);
          ctx.lineTo(P(H, waW - 0.2, 2)[0], P(H, waW - 0.2, 2)[1]);
          ctx.lineTo(P(H, -waW + 0.2, 2)[0], P(H, -waW + 0.2, 2)[1]);
          ctx.closePath();
        };
        suitBox();
        ctx.fillStyle = '#2d3340'; ctx.fill();
        for (let sx = -8.5; sx <= 8.5; sx += 3.1) {
          ctx.strokeStyle = 'rgba(226,232,240,0.18)'; ctx.lineWidth = 0.85;
          const sA = P(sh, sx, -1.5), sB = P(H, sx * 0.88, 1.5);
          ctx.beginPath(); ctx.moveTo(sA[0], sA[1]); ctx.lineTo(sB[0], sB[1]); ctx.stroke();
        }
        // Sơ mi trắng xám cổ V nhỏ + Cà vạt đỏ rượu vang + Kẹp cà vạt vàng
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v2[0], v2[1]); ctx.lineTo(v3[0], v3[1] - 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = st.tieColor || '#991b1b'; ctx.lineWidth = 2.9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(P(sh, 1.0, -0.8)[0], P(sh, 1.0, -0.8)[1]); ctx.lineTo(P(sh, 1.2, -13.5)[0], P(sh, 1.2, -13.5)[1]); ctx.stroke();
        const tc = P(sh, 1.2, -8.2);
        ctx.fillStyle = '#facc15'; ctx.fillRect(tc[0] - 1.6, tc[1] - 0.5, 3.2, 1.0);

        // Khăn túi ngực đỏ son + dây xích đồng hồ vàng + hàng cúc gile rõ nét
        const pk = P(sh, 7.6, -10.2);
        ctx.fillStyle = st.pocketSquare || '#dc2626';
        ctx.beginPath(); ctx.moveTo(pk[0] - 2.4, pk[1]); ctx.lineTo(pk[0], pk[1] - 2.8); ctx.lineTo(pk[0] + 2.6, pk[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 1.05;
        const wChL = P(sh, -3.5, -18), wChM = P(sh, 0.5, -21), wChR = P(sh, 4.8, -18);
        ctx.beginPath(); ctx.moveTo(wChL[0], wChL[1]); ctx.quadraticCurveTo(wChM[0], wChM[1], wChR[0], wChR[1]); ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        for (let i = 0; i < 3; i++) {
          const bp = P(sh, 1.2, -14.5 - i * 4.2);
          ctx.beginPath(); ctx.arc(bp[0], bp[1], 1.15, 0, Math.PI * 2); ctx.fill();
        }
        // Ve áo khoác măng-tô đen ôm mép ngoài vai (để lộ toàn bộ áo vest kẻ sọc ở giữa ngực & thoáng cổ)
        ctx.fillStyle = this._materialFill ? this._materialFill(ctx, st, 'fabric', P(sh, -shW, 0)[0], P(sh, -shW, 0)[1], P(sh, shW, 0)[0], P(sh, shW, 0)[1], st.coatColor || '#090d16') : '#090d16';
        const cL1 = P(sh, -shW - 1.5, 1.4), cL2 = P(sh, -7.2, 1.5), cL3 = P(sh, -9.8, -14.5), cL4 = P(sh, -shW - 1.5, -12.5);
        ctx.beginPath(); ctx.moveTo(cL1[0], cL1[1]); ctx.lineTo(cL2[0], cL2[1]); ctx.lineTo(cL3[0], cL3[1]); ctx.lineTo(cL4[0], cL4[1]); ctx.closePath(); ctx.fill();
        const cR1 = P(sh, shW + 1.3, 1.4), cR2 = P(sh, 7.6, 1.5), cR3 = P(sh, 9.8, -14.5), cR4 = P(sh, shW + 1.3, -12.5);
        ctx.beginPath(); ctx.moveTo(cR1[0], cR1[1]); ctx.lineTo(cR2[0], cR2[1]); ctx.lineTo(cR3[0], cR3[1]); ctx.lineTo(cR4[0], cR4[1]); ctx.closePath(); ctx.fill();
      }
    } else if (arch === 'street_brawler_gi') {
      // Đình Bích Lâm: Áo thun bó đen phom chữ V thể thao (vai rộng - eo thon) + Áo gile võ thuật lục bảo viền đen
      if (!isSolid) {
        const teeTL = P(sh, -5.5, 2.6), teeTR = P(sh, 6.2, 2.6), teeBot = P(sh, 0.9, -16.5);
        ctx.fillStyle = st.under || '#12151c';
        ctx.beginPath();
        ctx.moveTo(teeTL[0], teeTL[1]);
        ctx.quadraticCurveTo(P(sh, 0.5, 0.2)[0], P(sh, 0.5, 0.2)[1], teeTR[0], teeTR[1]);
        ctx.lineTo(P(sh, 3.8, -10.5)[0], P(sh, 3.8, -10.5)[1]);
        ctx.lineTo(teeBot[0], teeBot[1]);
        ctx.lineTo(P(sh, -2.2, -10.5)[0], P(sh, -2.2, -10.5)[1]);
        ctx.closePath(); ctx.fill();
        // Cổ tròn áo thun đen + đường khối cơ ngực V-taper dưới lớp vải thun
        ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(P(sh, -3.6, 2.0)[0], P(sh, -3.6, 2.0)[1]);
        ctx.quadraticCurveTo(P(sh, 0.6, -0.4)[0], P(sh, 0.6, -0.4)[1], P(sh, 4.6, 2.0)[0], P(sh, 4.6, 2.0)[1]);
        ctx.moveTo(P(sh, -2.2, -6.2)[0], P(sh, -2.2, -6.2)[1]);
        ctx.quadraticCurveTo(P(sh, 0.8, -7.2)[0], P(sh, 0.8, -7.2)[1], P(sh, 3.6, -6.4)[0], P(sh, 3.6, -6.4)[1]);
        ctx.stroke();

        // Viền đen bản sắc ôm hai ve áo gile thót eo chữ V vào nút đai giữa bụng
        ctx.strokeStyle = '#090d14'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(P(sh, -5.6, 2.4)[0], P(sh, -5.6, 2.4)[1]);
        ctx.quadraticCurveTo(P(sh, -3.2, -7.0)[0], P(sh, -3.2, -7.0)[1], P(sh, 0.5, -15.6)[0], P(sh, 0.5, -15.6)[1]);
        ctx.moveTo(P(sh, 6.0, 2.4)[0], P(sh, 6.0, 2.4)[1]);
        ctx.quadraticCurveTo(P(sh, 4.0, -7.0)[0], P(sh, 4.0, -7.0)[1], P(sh, 1.3, -15.6)[0], P(sh, 1.3, -15.6)[1]);
        ctx.stroke();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(P(sh, -6.2, 1.8)[0], P(sh, -6.2, 1.8)[1]);
        ctx.quadraticCurveTo(P(sh, -4.0, -7.0)[0], P(sh, -4.0, -7.0)[1], P(sh, -0.2, -15.6)[0], P(sh, -0.2, -15.6)[1]);
        ctx.stroke();
      }
    } else if (arch === 'phoenix_general') {
      // Triệu Đình An: Cổ giáp lót lụa đỏ & vảy cá + Khối giáp ngực hoàng kim điêu khắc 3D đa tầng + Phù điêu Phụng Hoàng giữa ngực
      if (!isSolid) {
        // Cổ lụa đỏ & vảy cá đỏ ở phần cổ & hai bên hông dưới giáp
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath(); ctx.moveTo(v1[0] - 2.6, v1[1] + 0.8); ctx.lineTo(v2[0] + 2.6, v2[1] + 0.8); ctx.lineTo(P(sh, 1.0, -10)[0], P(sh, 1.0, -10)[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 0.85;
        ctx.beginPath(); ctx.arc(P(sh, -0.5, -1.5)[0], P(sh, -0.5, -1.5)[1], 2.2, 0.1, Math.PI - 0.1);
        ctx.arc(P(sh, 2.8, -1.5)[0], P(sh, 2.8, -1.5)[1], 2.2, 0.1, Math.PI - 0.1); ctx.stroke();

        // Phiến giáp ngực hoàng kim 3D (chữ V ôm cơ ngực + gờ nổi trung tâm)
        const g1 = P(sh, -shW + 1.6, -1.5), g2 = P(sh, shW - 1.6, -1.5);
        const g3 = P(H, waW - 0.5, 9.5), g4 = P(H, 0.8, 3.8), g5 = P(H, -waW + 0.5, 9.5);
        ctx.fillStyle = this._materialFill ? this._materialFill(ctx, st, 'gold', g1[0], g1[1], g2[0], g2[1], '#d97706') : '#d97706';
        ctx.beginPath(); ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]); ctx.lineTo(g3[0], g3[1]); ctx.lineTo(g4[0], g4[1]); ctx.lineTo(g5[0], g5[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.6; ctx.stroke();

        // Các lames xếp tầng phần bụng giáp & viền sáng chữ V dưới xương quai xanh
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(g1[0] + 1, g1[1] + 0.4); ctx.lineTo(P(sh, 0.9, -4.2)[0], P(sh, 0.9, -4.2)[1]); ctx.lineTo(g2[0] - 1, g2[1] + 0.4); ctx.stroke();
        ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(P(H, -waW + 2.5, 13.5)[0], P(H, -waW + 2.5, 13.5)[1]); ctx.lineTo(P(H, 0.8, 10.5)[0], P(H, 0.8, 10.5)[1]); ctx.lineTo(P(H, waW - 2.5, 13.5)[0], P(H, waW - 2.5, 13.5)[1]);
        ctx.moveTo(P(H, -waW + 1.8, 9.5)[0], P(H, -waW + 1.8, 9.5)[1]); ctx.lineTo(P(H, 0.8, 6.8)[0], P(H, 0.8, 6.8)[1]); ctx.lineTo(P(H, waW - 1.8, 9.5)[0], P(H, waW - 1.8, 9.5)[1]);
        ctx.stroke();

        // Phù điêu Phụng Hoàng sải cánh đỏ-vàng ngay chính giữa ngực
        const crest = P(sh, 1.3, -10.5);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(crest[0] - 8.2, crest[1] - 2.8);
        ctx.quadraticCurveTo(crest[0], crest[1] + 1.4, crest[0] + 8.2, crest[1] - 2.8);
        ctx.lineTo(crest[0] + 4.4, crest[1] + 2.6);
        ctx.lineTo(crest[0], crest[1] + 5.2);
        ctx.lineTo(crest[0] - 4.4, crest[1] + 2.6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.arc(crest[0], crest[1], 3.1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.arc(crest[0], crest[1], 1.3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (arch === 'mountain_guardian') {
      // Phó Đặng Hoàng Anh: Cổ V sâu lộ da rám nắng săn chắc + Viền thổ cẩm dệt họa tiết hình thoi dọc ve áo + Hai dây thừng treo nón lá
      if (!isSolid) {
        ctx.fillStyle = this._materialFill ? this._materialFill(ctx, st, 'skin', v1[0], v1[1], v2[0], v2[1], st.skin) : st.skin;
        ctx.beginPath(); ctx.moveTo(v1[0] - 0.6, v1[1]); ctx.lineTo(v2[0] + 0.6, v2[1]); ctx.lineTo(P(sh, 1.0, -12.5)[0], P(sh, 1.0, -12.5)[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = st.skinD || '#85583a'; ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.moveTo(P(sh, 1.0, -4.5)[0], P(sh, 1.0, -4.5)[1]); ctx.lineTo(P(sh, 1.0, -10.5)[0], P(sh, 1.0, -10.5)[1]); ctx.stroke();

        // Viền thổ cẩm vàng nâu bản dày có họa tiết chữ X / hình thoi thủ công
        for (const [a, b] of [[neckF, crossB], [neckB, crossF]]) {
          ctx.strokeStyle = '#4a3519'; ctx.lineWidth = 4.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          ctx.strokeStyle = '#cba865'; ctx.lineWidth = 3.1;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          ctx.fillStyle = '#7c2d12';
          for (let t = 0.2; t <= 0.82; t += 0.2) {
            const tx = a[0] + (b[0] - a[0]) * t;
            const ty = a[1] + (b[1] - a[1]) * t;
            ctx.beginPath(); ctx.arc(tx, ty, 0.95, 0, Math.PI * 2); ctx.fill();
          }
        }
        // Dây thừng bện treo nón lá vòng hai bên cổ & nút buộc ngực
        const cordL1 = P(sh, -5.4, 1.2), cordL2 = P(sh, -0.8, -12.8);
        const cordR1 = P(sh, 6.0, 1.2), cordR2 = P(sh, 1.8, -12.8);
        ctx.strokeStyle = '#785028'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cordL1[0], cordL1[1]); ctx.lineTo(cordL2[0], cordL2[1]);
        ctx.moveTo(cordR1[0], cordR1[1]); ctx.lineTo(cordR2[0], cordR2[1]); ctx.stroke();
        ctx.fillStyle = '#a16207';
        const tog = P(sh, 0.5, -13.0); ctx.beginPath(); ctx.arc(tog[0], tog[1], 1.7, 0, Math.PI * 2); ctx.fill();
      }
    } else if (arch === 'shinobi_assassin') {
      // Trần Dũng Hải: Cổ V than đen thêu gia huy bạc + Đai da ngực khóa thép + Khăn cổ len đỏ cuộn 2 vòng dày dặn
      if (!isSolid) {
        ctx.fillStyle = '#0d1016';
        ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v2[0], v2[1]); ctx.lineTo(v3[0], v3[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#52525b'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(neckF[0], neckF[1]); ctx.lineTo(crossB[0], crossB[1]); ctx.stroke();
        // Đai da chéo ngực + khóa kim loại
        ctx.strokeStyle = '#27272a'; ctx.lineWidth = 2.9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(P(sh, -7.2, 0.5)[0], P(sh, -7.2, 0.5)[1]); ctx.lineTo(P(H, 6.8, 3.2)[0], P(H, 6.8, 3.2)[1]); ctx.stroke();
        const strapB = P(sh, 2.2, -13.5);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(strapB[0] - 1.5, strapB[1] - 1.5, 3.0, 3.0);
        // Huy hiệu thêu chỉ bạc bên ngực
        const emb = P(sh, 4.6, -10.2);
        ctx.strokeStyle = 'rgba(226,232,240,0.72)'; ctx.lineWidth = 1.05;
        ctx.beginPath(); ctx.moveTo(emb[0] - 2.2, emb[1]); ctx.lineTo(emb[0] + 2.2, emb[1]); ctx.moveTo(emb[0], emb[1] - 2.2); ctx.lineTo(emb[0], emb[1] + 2.2); ctx.stroke();
        // Khăn quàng len đỏ 2 vòng cuộn gọn quanh xương quai xanh (thoáng cằm & nụ cười)
        const sLowerL = P(sh, -7.8, -0.4), sLowerR = P(sh, 8.2, -1.0), sLowerM = P(sh, 0.6, -5.2);
        const sUpperL = P(sh, -7.2, 2.0), sUpperR = P(sh, 7.6, 1.4), sUpperM = P(sh, 0.6, -2.4);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 4.8;
        ctx.beginPath(); ctx.moveTo(sLowerL[0], sLowerL[1]); ctx.quadraticCurveTo(sLowerM[0], sLowerM[1], sLowerR[0], sLowerR[1]); ctx.stroke();
        ctx.strokeStyle = st.scarfColor || '#b91c1c'; ctx.lineWidth = 4.6;
        ctx.beginPath(); ctx.moveTo(sUpperL[0], sUpperL[1]); ctx.quadraticCurveTo(sUpperM[0], sUpperM[1], sUpperR[0], sUpperR[1]); ctx.stroke();
        // Nếp cuộn khăn tối & viền len trên
        ctx.strokeStyle = 'rgba(0,0,0,0.48)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sUpperL[0] + 1, sUpperL[1] - 1.5); ctx.quadraticCurveTo(sUpperM[0], sUpperM[1] - 1.8, sUpperR[0] - 1, sUpperR[1] - 1.5); ctx.stroke();
        ctx.strokeStyle = 'rgba(252,165,165,0.28)'; ctx.lineWidth = 0.85;
        ctx.beginPath(); ctx.moveTo(sUpperL[0] + 2, sUpperL[1] + 1.2); ctx.quadraticCurveTo(sUpperM[0], sUpperM[1] + 1.2, sUpperR[0] - 2, sUpperR[1] + 1.2); ctx.stroke();
      } else {
        const sRingA = P(sh, -8.0, 1.8), sRingB = P(sh, 8.2, 1.0);
        ctx.strokeStyle = st._solid; ctx.lineWidth = 7.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sRingA[0], sRingA[1]); ctx.quadraticCurveTo(P(sh, 0.5, -3.5)[0], P(sh, 0.5, -3.5)[1], sRingB[0], sRingB[1]); ctx.stroke();
      }
    } else if (arch === 'patriarch_sword_robe') {
      // Ngô Giang Mạnh: Cổ đứng Đạo bào thanh thoát viền bạc dưới cằm/râu + Áo trong xanh thẫm + Áo bào ngoài xám băng gài khuy ngọc
      const colBL = P(sh, -5.6, -0.4), colTL = P(sh, -5.8, 5.2), colTR = P(sh, 5.4, 4.8), colBR = P(sh, 5.4, -0.4);
      ctx.fillStyle = this._c(st, st.giD || '#162b46');
      ctx.beginPath(); ctx.moveTo(colBL[0], colBL[1]); ctx.lineTo(colTL[0], colTL[1]); ctx.lineTo(colTR[0], colTR[1]); ctx.lineTo(colBR[0], colBR[1]); ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.65; ctx.stroke();
        // Đường chia đôi cổ áo đứng phía trước
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(P(sh, 0.6, 4.8)[0], P(sh, 0.6, 4.8)[1]); ctx.lineTo(P(sh, 0.6, 0)[0], P(sh, 0.6, 0)[1]); ctx.stroke();
        // Lớp áo trong xanh đen & ve áo chéo 2 tầng viền trắng bạc thanh cao
        ctx.fillStyle = '#0f2035';
        ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v2[0], v2[1]); ctx.lineTo(crossF[0], crossF[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(neckF[0], neckF[1]); ctx.lineTo(crossB[0], crossB[1]); ctx.stroke();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.75;
        ctx.beginPath(); ctx.moveTo(neckB[0], neckB[1]); ctx.lineTo(crossF[0], crossF[1]); ctx.stroke();
        // Khuy thắt ngọc bích & nẹp bạc cổ trang
        for (let i = 0; i < 3; i++) {
          const fr = P(sh, 1.8 + i * 1.1, -4.5 - i * 4.2);
          ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(fr[0], fr[1], 1.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(fr[0], fr[1], 0.7, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else {
      // Dự phòng cho tất cả kẻ địch thường / NPC (giữ nguyên tương thích 100%)
      if (!isSolid) {
        ctx.fillStyle = st.suit ? st.under : (st.under || '#e5e7eb');
        ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v2[0], v2[1]); ctx.lineTo(v3[0], v3[1]); ctx.closePath(); ctx.fill();

        if (st.suit) {
          const tieTop = P(sh, 0.8, -2), tieBot = P(H, 1.8, 7);
          ctx.strokeStyle = st.tieColor || (st.belt === '#00d2ff' ? '#0284c7' : '#dc2626');
          ctx.lineWidth = 2.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(tieTop[0], tieTop[1]); ctx.lineTo(tieBot[0], tieBot[1]); ctx.stroke();
          const pk = P(sh, 5.5, -7.5);
          ctx.fillStyle = st.pocketSquare || '#facc15';
          ctx.fillRect(pk[0] - 1.5, pk[1] - 1, 3.2, 1.8);
          ctx.strokeStyle = st.giL || '#374151'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v3[0] - 2, v3[1]); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(v2[0], v2[1]); ctx.lineTo(v3[0] + 2, v3[1]); ctx.stroke();
        } else if (st.tactical) {
          const zipTop = P(sh, 0.8, 3), zipBot = P(H, 0.5, 6);
          ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(zipTop[0], zipTop[1]); ctx.lineTo(zipBot[0], zipBot[1]); ctx.stroke();
          ctx.strokeStyle = st.aura || '#38bdf8'; ctx.lineWidth = 1.6;
          const n1 = P(sh, -3.2, 0), n2 = P(H, -2.5, 4);
          const n3 = P(sh, 4.5, 0), n4 = P(H, 3.5, 4);
          ctx.beginPath(); ctx.moveTo(n1[0], n1[1]); ctx.lineTo(n2[0], n2[1]); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(n3[0], n3[1]); ctx.lineTo(n4[0], n4[1]); ctx.stroke();
        } else if (st.robe) {
          ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 4.0; ctx.lineCap = 'round';
          const r1 = P(sh, -3.5, 2.5), r2 = P(sh, 4.5, 2.5);
          ctx.beginPath(); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); ctx.stroke();
          const frg1 = P(sh, 1.5, -4), frg2 = P(sh, 3.2, -7);
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath(); ctx.arc(frg1[0], frg1[1], 1.8, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(frg2[0], frg2[1], 1.8, 0, Math.PI * 2); ctx.fill();
        } else if (st.vest || st.sleeveless) {
          ctx.strokeStyle = st.giL || '#4ade80'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v3[0] - 1.5, v3[1]); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(v2[0], v2[1]); ctx.lineTo(v3[0] + 1.5, v3[1]); ctx.stroke();
        } else if (st.armor) {
          const aC = P(sh, 0.5, -6);
          ctx.fillStyle = st.metal || '#b45309';
          ctx.beginPath(); ctx.ellipse(aC[0], aC[1], 7.5, 8.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.ellipse(aC[0], aC[1], 6.5, 7.5, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(aC[0], aC[1], 2.8, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.strokeStyle = st.patch ? '#ffd23f' : '#cbd5e1'; ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.moveTo(neckF[0], neckF[1]); ctx.lineTo(crossB[0], crossB[1]); ctx.stroke();
          ctx.strokeStyle = st.patch ? '#e11d2e' : '#94a3b8'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(neckB[0], neckB[1]); ctx.lineTo(crossF[0], crossF[1]); ctx.stroke();
        }
      }
    }

    // Khăn quàng cổ dự phòng (mob/cũ, không áp dụng trùng với crimsonScarf)
    if (st.scarf && !st.crimsonScarf) {
      const s1 = P(sh, 3.8, 2.5), s2 = P(sh, -4.5, 2.5);
      ctx.strokeStyle = this._c(st, st.scarfColor || st.belt); ctx.lineWidth = 6.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s1[0], s1[1]); ctx.quadraticCurveTo(s1[0] - 13, s1[1] + 12, s1[0] - 24, s1[1] + 27); ctx.stroke();
      ctx.strokeStyle = this._c(st, st.beltD || st.belt); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(s2[0], s2[1]); ctx.quadraticCurveTo(s2[0] - 9, s2[1] + 14, s2[0] - 17, s2[1] + 24); ctx.stroke();
    }

    // Giáp Ngực Samurai Đỏ-Vàng Dạ Xoa (xếp tầng lá giáp + dây thừng hoàng kim)
    if (st.oniArmor && !isSolid) {
      for (let row = 0; row < 3; row++) {
        const yOff = -4.2 - row * 4.8;
        const pL = P(sh, -7.2 + row * 0.4, yOff);
        const pR = P(sh, 7.2 - row * 0.4, yOff);
        const pBR = P(sh, 6.8 - row * 0.4, yOff - 3.6);
        const pBL = P(sh, -6.8 + row * 0.4, yOff - 3.6);
        ctx.fillStyle = row % 2 === 0 ? '#991b1b' : '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(pL[0], pL[1]); ctx.lineTo(pR[0], pR[1]);
        ctx.lineTo(pBR[0], pBR[1]); ctx.lineTo(pBL[0], pBL[1]);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.05; ctx.stroke();
        // Mối đan chữ X trên từng tấm giáp đỏ Samurai
        ctx.strokeStyle = '#09090b'; ctx.lineWidth = 0.85;
        for (let t = 0.28; t <= 0.72; t += 0.22) {
          const lx = pL[0] + (pR[0] - pL[0]) * t;
          const ly = pL[1] + (pR[1] - pL[1]) * t + 1.5;
          ctx.beginPath();
          ctx.moveTo(lx - 1.2, ly - 1.1); ctx.lineTo(lx + 1.2, ly + 1.1);
          ctx.moveTo(lx + 1.2, ly - 1.1); ctx.lineTo(lx - 1.2, ly + 1.1);
          ctx.stroke();
        }
      }
      // Cổ giáp vàng-đỏ ôm vai
      ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(P(sh, -7.8, 1.0)[0], P(sh, -7.8, 1.0)[1]); ctx.quadraticCurveTo(P(sh, 0.4, -3.2)[0], P(sh, 0.4, -3.2)[1], P(sh, 7.8, 0.6)[0], P(sh, 7.8, 0.6)[1]); ctx.stroke();
    }

    // Huy hiệu Vovinam Việt Võ Đạo sắc nét trên ngực trái
    if (st.patch && !isSolid) {
      const c = P(sh, Math.max(4.6, shW * 0.56), -8.8);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate(Math.atan2(d[0], -d[1]));
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-4.6, -4.0, 9.2, 8.0);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(-4.0, -3.4, 8.0, 6.8);
      ctx.fillStyle = '#facc15'; ctx.fillRect(-3.3, -2.7, 6.6, 5.4);
      ctx.fillStyle = '#e11d2e'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(0, 0, 2.2, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.55;
      ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    // Rồng vàng thêu ngực (Long Vương / Vinh Tâm)
    if (st.dragon && !isSolid) {
      const a = P(sh, 2, -6);
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      ctx.bezierCurveTo(a[0] + 8, a[1] + 3, a[0] - 6, a[1] + 8, a[0] + 6, a[1] + 14);
      ctx.stroke();
    }

    // Phụ kiện ngực dự phòng cho quái/NPC không thuộc nhóm 9 nhân vật đã có drawBackLayers/drawFrontShoulderOverlay
    if (!arch && !isSolid) {
      if (st.coat && !st.drapedOvercoat && !st.cyberTrench) {
        const trim = st.coatTrim || '#f59e0b';
        ctx.strokeStyle = trim; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        const lpL1 = P(sh, -2.5, 2), lpL2 = P(sh, -9.5, 6), lpL3 = P(H, -8.5, 4);
        ctx.beginPath(); ctx.moveTo(lpL1[0], lpL1[1]); ctx.lineTo(lpL2[0], lpL2[1]); ctx.lineTo(lpL3[0], lpL3[1]); ctx.stroke();
        const lpR1 = P(sh, 3.5, 2), lpR2 = P(sh, 9.5, 6), lpR3 = P(H, 8.5, 4);
        ctx.beginPath(); ctx.moveTo(lpR1[0], lpR1[1]); ctx.lineTo(lpR2[0], lpR2[1]); ctx.lineTo(lpR3[0], lpR3[1]); ctx.stroke();
      }
      if (st.armor) {
        const aC = P(sh, 0.5, 6);
        ctx.save();
        ctx.translate(aC[0], aC[1]);
        ctx.rotate(Math.atan2(d[0], -d[1]));
        const bronzeGrad = ctx.createLinearGradient(-7, -8, 7, 8);
        bronzeGrad.addColorStop(0, '#fde047'); bronzeGrad.addColorStop(0.5, '#d97706'); bronzeGrad.addColorStop(1, '#78350f');
        ctx.fillStyle = bronzeGrad;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -8, 14, 16, 2.5) : ctx.rect(-7, -8, 14, 16); ctx.fill();
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.restore();
      }
      if (st.furMantle) {
        const shL = P(sh, -11, 0), shR = P(sh, 11, 0), shM = P(sh, 0, 4);
        ctx.fillStyle = '#452a19';
        ctx.beginPath();
        ctx.moveTo(shL[0] - 2, shL[1] - 3); ctx.lineTo(shR[0] + 2, shR[1] - 3);
        ctx.lineTo(shR[0] + 3, shR[1] + 8); ctx.lineTo(shM[0] + 5, shM[1] + 6);
        ctx.lineTo(shM[0], shM[1] + 9); ctx.lineTo(shM[0] - 5, shM[1] + 6);
        ctx.lineTo(shL[0] - 3, shL[1] + 8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      if (st.ninja) {
        const bX = P(sh, 0, 4);
        ctx.save();
        ctx.translate(bX[0], bX[1]);
        ctx.rotate(Math.atan2(d[0], -d[1]));
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(9, 14); ctx.moveTo(10, -14); ctx.lineTo(-9, 14); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Súng lục nén giảm thanh của Phó Văn Anh (tỷ lệ gọn thực tế, không bị phình to)
  drawPistol(ctx, hand, fore, now, firing, st) {
    const isSolid = !!(st && st._solid);
    const dx = Math.sin(fore), dy = Math.cos(fore);
    const px = -dy, py = dx;
    const at = (a, b) => [hand[0] + dx * a + px * b, hand[1] + dy * a + py * b];
    ctx.save();
    ctx.lineCap = 'round';
    const g0 = at(1, 0), g1 = at(-1.5, 5.2);
    ctx.strokeStyle = this._c(st, '#1f2937'); ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.stroke();
    const s0 = at(-1.5, -0.8), s1 = at(11.5, -0.8), s2 = at(24.5, -0.8);
    ctx.strokeStyle = this._c(st, '#0b0f19'); ctx.lineWidth = 4.0;
    ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
    ctx.strokeStyle = this._c(st, '#111827'); ctx.lineWidth = 3.0;
    ctx.beginPath(); ctx.moveTo(s1[0], s1[1]); ctx.lineTo(s2[0], s2[1]); ctx.stroke();
    if (!isSolid) {
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 0.85;
      ctx.beginPath(); ctx.moveTo(s0[0], s0[1] - 1.2); ctx.lineTo(s1[0], s1[1] - 1.2); ctx.stroke();
      if (firing && Math.sin(now * 0.034) > 0.2) {
        const m = at(28, -0.8);
        const gr = ctx.createRadialGradient(m[0], m[1], 0, m[0], m[1], 9.5);
        gr.addColorStop(0, 'rgba(255,250,210,0.98)'); gr.addColorStop(0.45, 'rgba(250,204,21,0.8)'); gr.addColorStop(1, 'rgba(245,158,11,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(m[0], m[1], 9.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  drawBelt(ctx, jt, st, sway, motion) {
    const { H, d, pp } = jt;
    const isSolid = !!(st && st._solid);
    const rig = st.rig || {};
    const wHalf = (rig.waW || 7.2) + 1.1;
    const arch = st.archetype;
    const P = (a, b) => [H[0] + pp[0] * a + d[0] * b, H[1] + pp[1] * a + d[1] * b];
    const hThick = (arch === 'phoenix_general' || arch === 'vovinam_master' || arch === 'mountain_guardian') ? 3.4 : 2.8;
    const q = [P(-wHalf, hThick), P(0.6, hThick - 0.6), P(wHalf, hThick), P(wHalf + 0.2, -hThick), P(0.6, -hThick - 0.7), P(-wHalf + 0.2, -hThick)];
    const beltPath = () => {
      ctx.beginPath();
      ctx.moveTo(q[0][0], q[0][1]);
      ctx.quadraticCurveTo(q[1][0], q[1][1], q[2][0], q[2][1]);
      ctx.lineTo(q[3][0], q[3][1]);
      ctx.quadraticCurveTo(q[4][0], q[4][1], q[5][0], q[5][1]);
      ctx.closePath();
    };

    const isModern = st.suit || st.tactical || st.leatherBelt || (st.armor && arch !== 'phoenix_general');
    const beltCol = isModern
      ? (st.leatherBeltColor || (st.suit ? '#18181b' : (st.belt || '#1e293b')))
      : st.belt;
    beltPath();
    ctx.fillStyle = this._c(st, beltCol); ctx.fill();
    if (!isSolid) {
      ctx.lineWidth = 1.4; ctx.strokeStyle = isModern ? '#09090b' : (st.beltD || '#111827'); ctx.stroke();
    }

    // 1. Chiến tướng Triệu Đình An: Đai lụa & phiến đồng + Mặt khóa ĐẦU SƯ TỬ HOÀNG KIM chạm nổi
    if (arch === 'phoenix_general') {
      const k = P(2.4, -0.4);
      if (!isSolid) {
        ctx.fillStyle = '#991b1b'; beltPath(); ctx.fill();
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.25; ctx.stroke();
        // Đĩa khóa sư tử vàng kim đa tầng
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.ellipse(k[0], k[1], 6.4, 5.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.ellipse(k[0], k[1], 5.1, 4.7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath(); ctx.arc(k[0], k[1], 2.0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath(); ctx.arc(k[0] - 0.6, k[1] - 0.6, 0.7, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = st._solid;
        ctx.beginPath(); ctx.ellipse(k[0], k[1], 6.4, 5.8, 0, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }

    // 2. Gia chủ Ngô Giang Mạnh: Đai lụa trường bào viền bạc + khóa bát quái ngọc bích & dây ngọc rủ
    if (arch === 'patriarch_sword_robe') {
      const k = P(2.4, -0.4);
      if (!isSolid) {
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.3; beltPath(); ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(k[0], k[1], 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(k[0], k[1], 1.9, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }

    // 3. Khóa thắt lưng kim loại hiện đại gọn gàng (suit, tactical)
    if (isModern) {
      const k = P(3.4, -0.4);
      const buckleCol = st.suit ? '#d97706' : (st.tactical ? '#cbd5e1' : '#94a3b8');
      if (!isSolid) {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(k[0] - 2.4, k[1] - 2.8, 4.8, 5.6);
        ctx.strokeStyle = buckleCol; ctx.lineWidth = 1.4;
        ctx.strokeRect(k[0] - 2.4, k[1] - 2.8, 4.8, 5.6);
        ctx.fillStyle = buckleCol;
        ctx.fillRect(k[0] - 0.6, k[1] - 2.4, 1.2, 4.8);
      }
      return;
    }

    // 4. Đai võ thuật Vovinam & Đai vải buộc 3D (Nghị, Bích Lâm, Hoàng Anh, Dung Hải)
    if (!isSolid) {
      const sL = P(-wHalf + 1.0, 0.8), sM = P(0.4, 0.1), sR = P(wHalf - 1.0, 0.8);
      const bL = P(-wHalf + 1.2, -1.2), bM = P(0.4, -1.8), bR = P(wHalf - 1.2, -1.2);
      ctx.strokeStyle = st.beltTrim || 'rgba(255,255,255,0.28)';
      ctx.lineWidth = st.beltTrim ? 1.4 : 0.9;
      ctx.beginPath(); ctx.moveTo(sL[0], sL[1]); ctx.quadraticCurveTo(sM[0], sM[1], sR[0], sR[1]); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(bL[0], bL[1]); ctx.quadraticCurveTo(bM[0], bM[1], bR[0], bR[1]); ctx.stroke();
    }

    const k = P(Math.min(6.4, wHalf - 2.4), -0.4);
    const vx = motion ? motion.vx : 0;
    const runPull = (motion && motion.isRunning) ? -7 : Math.max(-6, Math.min(6, -vx * 0.025));
    const tail = (len, dx, w) => {
      ctx.lineCap = 'round';
      if (!isSolid) {
        ctx.strokeStyle = st.beltD || '#111827'; ctx.lineWidth = w + 1.9;
        ctx.beginPath(); ctx.moveTo(k[0], k[1]);
        ctx.quadraticCurveTo(k[0] + sway * 0.4 + runPull * 0.4 + dx, k[1] + len * 0.5, k[0] + sway * 1.25 + runPull + dx, k[1] + len);
        ctx.stroke();
      }
      ctx.strokeStyle = this._c(st, st.belt); ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(k[0], k[1]);
      ctx.quadraticCurveTo(k[0] + sway * 0.4 + runPull * 0.4 + dx, k[1] + len * 0.5, k[0] + sway * 1.25 + runPull + dx, k[1] + len);
      ctx.stroke();
      if (!isSolid && st.beltTrim) {
        const endX = k[0] + sway * 1.25 + runPull + dx, endY = k[1] + len;
        const midX = k[0] + sway * 0.65 + runPull * 0.55 + dx, midY = k[1] + len * 0.55;
        ctx.strokeStyle = st.beltTrim; ctx.lineWidth = Math.max(1.2, w * 0.34);
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(endX, endY - 2.5);
        ctx.stroke();
      }
    };
    const tailLen = arch === 'street_brawler_gi' ? 27 : (arch === 'mountain_guardian' ? 22 : (arch === 'shinobi_assassin' ? 20 : 25));
    tail(tailLen, 1.4, 4.4);
    tail(tailLen - 6, -3.5, 3.8);

    // Nút thắt đai 3D
    if (!isSolid) {
      ctx.fillStyle = st.beltD || '#111827'; ctx.fillRect(k[0] - 3.6, k[1] - 4.4, 7.2, 8.8);
      ctx.fillStyle = st.belt; ctx.fillRect(k[0] - 2.5, k[1] - 3.3, 5.0, 6.6);
      if (st.beltTrim) {
        ctx.strokeStyle = st.beltTrim; ctx.lineWidth = 1.0;
        ctx.strokeRect(k[0] - 2.5, k[1] - 3.3, 5.0, 6.6);
      }
    } else {
      ctx.fillStyle = st._solid; ctx.fillRect(k[0] - 3.6, k[1] - 4.4, 7.2, 8.8);
    }
  }

  drawNeckAndHead(ctx, jt, st, o) {
    const isSolid = !!(st && st._solid);
    const nA = [jt.sh[0] + jt.d[0] * 1.5, jt.sh[1] + jt.d[1] * 1.5];
    const nB = [jt.head[0] - Math.sin(jt.ha) * 5.2, jt.head[1] + Math.cos(jt.ha) * 5.2];
    this.capsule(ctx, nA, nB, 5.6, 4.9, this._edge(st, 'rgba(0,0,0,0.48)'));
    this.capsule(ctx, nA, nB, 4.6, 4.1, this._c(st, st.skinD));
    if (!isSolid) {
      // Bóng cổ dưới cằm & gân cổ thanh thoát
      ctx.strokeStyle = 'rgba(85,32,12,0.34)'; ctx.lineWidth = 1.0;
      ctx.beginPath(); ctx.moveTo(nB[0] - 2.2, nB[1] + 2.2); ctx.lineTo(nA[0] - 1.2, nA[1] - 1.0); ctx.stroke();
    }
    ctx.save();
    ctx.translate(jt.head[0], jt.head[1]);
    ctx.rotate(jt.ha);
    const hsScale = (st.rig && st.rig.headScale) || 0.80;
    if (hsScale !== 1.0) ctx.scale(hsScale, hsScale);
    this.drawHead(ctx, st, o);
    ctx.restore();
  }

  // Vẽ đầu & khuôn mặt Phong cách Anime Thực Tả (tọa độ cục bộ: mặt hướng +x, đỉnh đầu hướng -y)
  drawHead(ctx, st, o) {
    const sw = o.sway || 0;
    const isSolid = !!(st && st._solid);
    const hs = st.hairStyle;

    // 0A. Đầu Chó Trắng Mũi Đỏ Đội Nón Mê (Skin Chí Tôn Phẩm: Hứa Vũ Đại)
    if (st.dogHead) {
      // Lông cổ & tai nhọn trắng
      ctx.fillStyle = this._c(st, '#f1f5f9');
      ctx.beginPath();
      ctx.moveTo(-10.5, 4.0);
      ctx.quadraticCurveTo(-13.5, -5.0, -7.5, -11.8);
      ctx.lineTo(-9.5, -18.5);
      ctx.lineTo(-2.5, -12.6);
      ctx.quadraticCurveTo(4.5, -13.2, 8.8, -7.2);
      ctx.lineTo(15.2, -3.5);
      ctx.lineTo(14.8, 2.2);
      ctx.lineTo(9.8, 4.0);
      ctx.lineTo(12.2, 7.6);
      ctx.quadraticCurveTo(4.0, 12.2, -4.5, 10.6);
      ctx.lineTo(-9.5, 12.2);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)'; ctx.lineWidth = 1.25; ctx.stroke();
        // Lòng tai & bờm lông cổ xù
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.moveTo(-7.8, -11.5); ctx.lineTo(-8.4, -16.2); ctx.lineTo(-4.0, -11.8); ctx.closePath(); ctx.fill();
        // Miệng nanh trắng nhe ra dữ tợn
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.moveTo(4.5, 2.2); ctx.lineTo(13.6, 1.8); ctx.lineTo(11.4, 6.2); ctx.lineTo(4.0, 5.2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(8.5, 1.8); ctx.lineTo(9.4, 4.4); ctx.lineTo(10.3, 1.8);
        ctx.moveTo(11.4, 1.8); ctx.lineTo(12.2, 4.6); ctx.lineTo(13.0, 1.8);
        ctx.moveTo(9.8, 5.8); ctx.lineTo(10.6, 3.2); ctx.lineTo(11.4, 5.8);
        ctx.fill();
        // MŨI ĐỎ đặc trưng nổi bật ở chóp mõm
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.ellipse(14.8, -1.6, 2.8, 2.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 0.75; ctx.stroke();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath(); ctx.arc(14.2, -2.3, 0.8, 0, Math.PI * 2); ctx.fill();
        // Mắt sói viền đỏ sắc lẹm
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath(); ctx.ellipse(3.6, -3.8, 3.1, 1.8, -0.18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.ellipse(3.8, -3.8, 2.2, 1.3, -0.18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(4.3, -3.8, 1.0, 0, Math.PI * 2); ctx.fill();
      }
      // Nón Lá rách sẫm màu kèm quai nón
      if (st.conicalHat) {
        ctx.save();
        ctx.translate(-0.5, -10.5);
        ctx.rotate(-0.12);
        ctx.fillStyle = this._c(st, '#443828');
        ctx.beginPath();
        ctx.moveTo(-18.5, 3.5);
        ctx.lineTo(0.2, -13.0);
        ctx.lineTo(19.0, 3.5);
        ctx.quadraticCurveTo(0, 6.2, -18.5, 3.5);
        ctx.closePath();
        ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = '#1c150e'; ctx.lineWidth = 1.45; ctx.stroke();
          ctx.strokeStyle = 'rgba(203, 182, 145, 0.35)'; ctx.lineWidth = 0.85;
          for (const rx of [-11, -5, 1, 7, 12]) {
            ctx.beginPath(); ctx.moveTo(0.2, -12.2); ctx.lineTo(rx, 4.0); ctx.stroke();
          }
          ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.45;
          ctx.beginPath();
          ctx.moveTo(6.5, 4.0);
          ctx.quadraticCurveTo(2.0, 14.5, -5.5, 18.0);
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }

    // 0B. Mũ Trùm Hắc Ám Thần Trùng Che Mặt Mắt Phát Sáng (Skin Chí Tôn Phẩm: Thiên Khánh)
    if (st.thanTrungHood) {
      const hoodCol = st.coatColor || '#09090d';
      const trimCol = st.coatTrim || '#a855f7';
      const eyeGlow = st.glowingEyes || '#a855f7';
      ctx.fillStyle = this._c(st, hoodCol);
      ctx.beginPath();
      ctx.moveTo(-12.5, 10.5);
      ctx.quadraticCurveTo(-15.5, -4.5, -4.5, -16.5);
      ctx.lineTo(3.5, -18.2);
      ctx.quadraticCurveTo(13.2, -9.5, 11.4, 2.5);
      ctx.lineTo(7.5, 11.0);
      ctx.lineTo(-10.5, 11.5);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#030206'; ctx.lineWidth = 1.3; ctx.stroke();
        // Khe mũ tối đen che kín khuôn mặt + đôi mắt sáng tím u minh
        ctx.fillStyle = '#020105';
        ctx.beginPath();
        ctx.moveTo(-4.0, -9.5);
        ctx.quadraticCurveTo(5.8, -11.5, 9.6, -2.5);
        ctx.quadraticCurveTo(9.2, 7.5, 4.2, 10.2);
        ctx.quadraticCurveTo(-3.2, 8.5, -5.5, 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = trimCol; ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-3.2, -15.5); ctx.quadraticCurveTo(6.5, -15.0, 10.6, -4.0);
        ctx.stroke();
        // Đôi mắt phát sáng trong bóng tối
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.moveTo(0.2, -2.2); ctx.lineTo(3.8, -0.6); ctx.lineTo(1.2, -0.2); ctx.closePath();
        ctx.moveTo(4.8, -2.0); ctx.lineTo(8.4, -0.8); ctx.lineTo(5.6, -0.2); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath(); ctx.arc(2.4, -1.0, 0.7, 0, Math.PI * 2); ctx.arc(6.6, -1.1, 0.7, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }

    // 1. Tóc/bím tóc dài phía sau đầu
    if (hs === 'giangmanh_topknot' || hs === 'silver_patriarch' || hs === 'white') {
      const braidBase = [-6.8, -4.5];
      const braidMid = [-14.5 + sw * 0.25, 6.0];
      const braidTip = [-16.2 + sw * 0.55, 22.5];
      ctx.fillStyle = this._c(st, hs === 'white' ? (st.hair || '#e2e8f0') : '#cbd5e1');
      ctx.beginPath();
      ctx.moveTo(braidBase[0], braidBase[1]);
      ctx.quadraticCurveTo(braidMid[0] - 2.5, braidMid[1] - 2, braidTip[0], braidTip[1]);
      ctx.quadraticCurveTo(braidMid[0] + 2.8, braidMid[1], -5.2, 4.5);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.95; ctx.stroke();
        // Đốt tết bím tóc & dây buộc ngọc ở đuôi bím (Ngô Giang Mạnh)
        ctx.strokeStyle = 'rgba(51,65,85,0.65)'; ctx.lineWidth = 0.85;
        for (let t = 0.22; t <= 0.78; t += 0.16) {
          const bx = braidBase[0] * (1 - t) + braidTip[0] * t + (sw * 0.2 * t);
          const by = braidBase[1] * (1 - t) + braidTip[1] * t + 1.5;
          ctx.beginPath(); ctx.moveTo(bx - 1.8, by - 1.2); ctx.lineTo(bx + 1.8, by + 1.2); ctx.stroke();
        }
        ctx.fillStyle = '#0284c7';
        ctx.beginPath(); ctx.arc(braidTip[0] + 0.6, braidTip[1] - 3.2, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (hs === 'thienkhanh_topknot') {
      // Châu Ngọc Thiên Khánh: Suối tóc đen dài bay tự do sau gáy + hai dải ruy-băng đỏ cột búi đỉnh
      ctx.fillStyle = this._c(st, st.hair || '#090d16');
      ctx.beginPath();
      ctx.moveTo(-6.2, -3.5);
      ctx.quadraticCurveTo(-15.8 + sw * 0.35, 5.5, -18.5 + sw * 0.75, 21.5);
      ctx.lineTo(-10.5 + sw * 0.55, 17.5);
      ctx.quadraticCurveTo(-8.2, 8.0, -5.0, 4.2);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.65; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4.2, -13.2); ctx.quadraticCurveTo(-13.5, -13.0 + sw * 0.25, -20.5 + sw * 0.6, -7.8);
        ctx.moveTo(-4.0, -12.6); ctx.quadraticCurveTo(-12.0, -8.5 + sw * 0.2, -17.5 + sw * 0.5, -2.5);
        ctx.stroke();
      }
    } else if (hs === 'oni_silver_mane') {
      // Quỷ Dạ Xoa: Suối tóc bạc trắng dài xù tung bay rực khí chất ác quỷ Samurai
      ctx.fillStyle = this._c(st, st.hair || '#f1f5f9');
      ctx.beginPath();
      ctx.moveTo(-5.8, -8.8);
      ctx.quadraticCurveTo(-18.5 + sw * 0.45, -8.0, -24.5 + sw * 0.85, 6.5);
      ctx.lineTo(-15.5 + sw * 0.65, 11.5);
      ctx.lineTo(-20.2 + sw * 0.72, 22.5);
      ctx.lineTo(-8.8 + sw * 0.42, 16.5);
      ctx.quadraticCurveTo(-6.2, 6.5, -4.6, 2.2);
      ctx.closePath();
      ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.05; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-7.2, -5.8); ctx.quadraticCurveTo(-15.8 + sw * 0.35, -3.5, -21.2 + sw * 0.7, 5.2);
        ctx.moveTo(-6.5, -2.2); ctx.quadraticCurveTo(-13.2 + sw * 0.3, 4.0, -17.8 + sw * 0.6, 17.5);
        ctx.stroke();
      }
    }
    if (st.mask || hs === 'bandana') {
      ctx.strokeStyle = this._c(st, st.mask || st.bandana); ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, st.mask ? 2 : -3); ctx.quadraticCurveTo(-16, 3, -24 + sw * 0.45, 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, st.mask ? 3 : -2); ctx.quadraticCurveTo(-15, 8, -22 + sw * 0.55, 9.5); ctx.stroke();
    }

    // 2. Đường viền đầu & Xương hàm điêu khắc theo st.jawStyle (tỷ lệ mặt đầy đặn, có gò má rõ ràng)
    const jaw = st.jawStyle || 'default';
    const drawJawPath = (pad) => {
      ctx.beginPath();
      if (jaw === 'rugged_square' || jaw === 'broad_elder') {
        const rx = (jaw === 'broad_elder' ? 9.6 : 9.3) + pad;
        const ry = (jaw === 'broad_elder' ? 10.6 : 10.3) + pad;
        ctx.moveTo(-rx * 0.86, -ry * 0.28);
        ctx.bezierCurveTo(-rx, -ry * 1.06, rx * 0.92, -ry * 1.04, rx * 1.02, -ry * 0.14);
        ctx.lineTo(rx * 0.96, ry * 0.52);
        ctx.quadraticCurveTo(rx * 0.56, ry * 1.04, 0.8, ry * 0.96);
        ctx.lineTo(-rx * 0.62, ry * 0.76);
        ctx.closePath();
      } else if (jaw === 'sharp' || jaw === 'lean_angular' || jaw === 'elder_dignified') {
        const rx = (jaw === 'elder_dignified' ? 8.6 : 8.8) + pad;
        const ry = 10.4 + pad;
        ctx.moveTo(-rx * 0.88, -ry * 0.24);
        ctx.bezierCurveTo(-rx, -ry * 1.04, rx * 0.9, -ry * 1.02, rx * 0.98, -ry * 0.08);
        ctx.lineTo(rx * 0.90, ry * 0.42);
        ctx.quadraticCurveTo(rx * 0.38, ry * 1.06, -0.4, ry * 0.94);
        ctx.lineTo(-rx * 0.68, ry * 0.66);
        ctx.closePath();
      } else {
        ctx.ellipse(1.0, 0.4, 9.0 + pad, 10.2 + pad, 0, 0, Math.PI * 2);
      }
    };
    drawJawPath(1.15);
    ctx.fillStyle = this._edge(st, 'rgba(6,8,14,0.58)'); ctx.fill();
    drawJawPath(0);
    ctx.fillStyle = (this._materialFill && !isSolid)
      ? this._materialFill(ctx, st, 'skin', -6, -9, 9, 9, st.skin)
      : this._c(st, st.skin);
    ctx.fill();

    if (!isSolid) {
      // Khối bóng dưới gò má & hốc mắt tạo chiều sâu 2.5D
      ctx.fillStyle = 'rgba(110,48,20,0.16)';
      ctx.beginPath(); ctx.ellipse(1.2, 4.9, 7.6, 5.4, 0, 0.1, Math.PI - 0.1); ctx.fill();
      ctx.fillStyle = 'rgba(90,38,15,0.18)';
      ctx.beginPath(); ctx.ellipse(1.6, -4.6, 7.6, 2.3, 0, Math.PI, Math.PI * 2); ctx.fill();
      // Tai & hốc tai sắc nét
      ctx.fillStyle = st.skin;
      ctx.beginPath(); ctx.ellipse(-3.8, 1.4, 2.5, 3.4, -0.1, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = st.skinD || '#a9744d'; ctx.lineWidth = 0.95;
      ctx.beginPath(); ctx.arc(-3.9, 1.5, 1.4, -1.2, 1.8); ctx.stroke();

      // Nếp tuổi gò má & khóe miệng uy nghiêm (Hứa Vũ Đại) - tông dịu tự nhiên
      if (jaw === 'broad_elder' && !st.beard) {
        ctx.strokeStyle = 'rgba(115, 58, 28, 0.36)'; ctx.lineWidth = 0.85; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(6.8, 2.6); ctx.quadraticCurveTo(5.9, 4.4, 5.4, 5.8);
        ctx.moveTo(2.4, 1.3); ctx.quadraticCurveTo(4.2, 2.0, 5.8, 1.4);
        ctx.stroke();
      }
    }

    // 4. Kiểu tóc chuyên biệt đầy khối & lọn tóc có chiều sâu cho 9 nhân vật
    ctx.fillStyle = this._c(st, st.hair);
    if (hs === 'nghi_hero') {
      // Ngô Nhất Nghị: Tóc nâu đen rẽ tầng bồng bềnh năng động + lọn mái rũ nhẹ trước trán + mai tóc
      ctx.beginPath();
      ctx.moveTo(-9.8, 3.8);
      ctx.bezierCurveTo(-11.8, -6.5, -8.5, -12.5, -3.5, -14.0);
      ctx.lineTo(-0.5, -15.4); ctx.lineTo(2.2, -13.4);
      ctx.lineTo(5.5, -14.6); ctx.lineTo(7.4, -10.8);
      ctx.lineTo(10.8, -8.2); ctx.lineTo(9.0, -4.6);
      ctx.lineTo(11.4, -2.5); ctx.lineTo(7.8, -3.0);
      ctx.lineTo(5.8, -5.8); ctx.lineTo(3.6, -2.0);
      ctx.lineTo(1.5, -5.8); ctx.lineTo(-1.8, -2.6);
      ctx.bezierCurveTo(-4.8, -1.2, -6.4, 1.4, -7.2, 4.4);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(205,145,105,0.42)'; ctx.lineWidth = 1.15; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-5.2, -9.2); ctx.quadraticCurveTo(0.8, -12.2, 6.4, -8.6);
        ctx.moveTo(-2.2, -12.2); ctx.quadraticCurveTo(1.8, -13.2, 4.6, -11.2);
        ctx.stroke();
      }
    } else if (hs === 'short' || hs === 'white') {
      ctx.beginPath();
      ctx.moveTo(-9.8, 3.4);
      ctx.bezierCurveTo(-11.5, -10.4, -3.2, -14.4, 3.6, -12.8);
      ctx.bezierCurveTo(9.8, -11.2, 11.4, -5.8, 9.8, -2.8);
      ctx.lineTo(6.8, -5.2); ctx.lineTo(5.2, -3.2); ctx.lineTo(2.4, -5.8); ctx.lineTo(-1.2, -4.2);
      ctx.bezierCurveTo(-4.2, -1.8, -6.2, 0.5, -6.8, 3.6);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = hs === 'white' ? '#ffffff' : 'rgba(255,255,255,0.20)';
        ctx.lineWidth = 1.3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-4, -9.5); ctx.quadraticCurveTo(1, -11.2, 5.5, -8.2); ctx.stroke();
      }
    } else if (hs === 'huavudai_patriarch') {
      // Hứa Vũ Đại: Tóc chải ngược chững chạc, gáy dày vừa vặn, hai bên thái dương điểm bạc muối tiêu rõ nét
      ctx.beginPath();
      ctx.moveTo(-10.0, 3.8);
      ctx.bezierCurveTo(-11.8, -8.8, -4.8, -14.2, 4.2, -12.8);
      ctx.bezierCurveTo(9.8, -11.4, 11.2, -6.8, 9.2, -4.2);
      ctx.bezierCurveTo(4.6, -6.8, -1.5, -6.6, -4.4, -3.2);
      ctx.bezierCurveTo(-6.0, -1.0, -6.8, 1.8, -7.4, 4.2);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-7.2, -1.8); ctx.quadraticCurveTo(-5.8, -6.2, -2.0, -7.8); ctx.stroke();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(4.6, -9.2); ctx.quadraticCurveTo(7.6, -8.2, 9.0, -5.6); ctx.stroke();
      }
    } else if (hs === 'buzz' || hs === 'hoanganh_buzz' || hs === 'bandana') {
      // Phó Đặng Hoàng Anh: Tóc húi cua gọn sắc nét ôm hộp sọ + phần thái dương tỉa fade
      ctx.beginPath();
      ctx.moveTo(-9.6, 0.2);
      ctx.bezierCurveTo(-10.6, -12.0, 7.6, -13.6, 10.0, -3.6);
      ctx.lineTo(7.4, -5.6);
      ctx.bezierCurveTo(3.5, -7.2, -4.2, -6.4, -7.4, -2.2);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-3.8, -9.4); ctx.quadraticCurveTo(1.5, -10.6, 5.4, -8.0); ctx.stroke();
        // Vệt cắt sát đầu húi cua bên thái dương
        ctx.strokeStyle = 'rgba(15,23,42,0.45)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-6.2, -4.2); ctx.lineTo(-4.8, -5.6); ctx.moveTo(-4.4, -4.5); ctx.lineTo(-3.0, -5.8); ctx.stroke();
      }
    } else if (hs === 'bichlam_spiky' || hs === 'spiky') {
      // Đình Bích Lâm: Mái tóc xanh rêu dày nam tính vuốt dựng tầng tự nhiên (không xòe hình sao)
      ctx.beginPath();
      ctx.moveTo(-9.8, 3.6);
      ctx.lineTo(-12.6, 0.2); ctx.lineTo(-10.2, -3.4);
      ctx.lineTo(-12.8, -7.8); ctx.lineTo(-8.2, -9.6);
      ctx.lineTo(-5.8, -14.8); ctx.lineTo(-1.2, -11.8);
      ctx.lineTo(3.2, -15.4); ctx.lineTo(6.0, -10.8);
      ctx.lineTo(10.8, -11.4); ctx.lineTo(8.8, -6.8);
      ctx.lineTo(11.4, -3.2); ctx.lineTo(8.2, -2.6);
      ctx.lineTo(6.2, -5.8); ctx.lineTo(3.4, -2.4);
      ctx.bezierCurveTo(0.4, -5.6, -4.6, -1.8, -6.8, 4.2);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#0f291c'; ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(-6.2, -11.0); ctx.lineTo(-3.2, -9.5);
        ctx.moveTo(2.4, -12.6); ctx.lineTo(4.4, -9.6);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(134, 239, 172, 0.34)'; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(-3.8, -11.8); ctx.quadraticCurveTo(1.2, -13.2, 4.4, -10.8); ctx.stroke();
      }
    } else if (hs === 'dunghai_spiky') {
      // Phó Dung Hải: Mái tóc đen vuốt rối che trán ngạo nghễ + gáy tỉa nhọn sắc bén
      ctx.beginPath();
      ctx.moveTo(-9.8, 3.6);
      ctx.lineTo(-12.8, -1.2); ctx.lineTo(-10.4, -4.8);
      ctx.lineTo(-13.4, -9.6); ctx.lineTo(-7.0, -10.6);
      ctx.lineTo(-3.8, -14.8); ctx.lineTo(1.2, -11.6);
      ctx.lineTo(6.2, -14.2); ctx.lineTo(8.0, -8.8);
      ctx.lineTo(11.6, -6.6); ctx.lineTo(9.2, -2.8);
      ctx.lineTo(7.8, 0.4); ctx.lineTo(4.4, -3.6);
      ctx.lineTo(1.4, -0.4); ctx.lineTo(-1.4, -4.4);
      ctx.bezierCurveTo(-4.6, -2.2, -6.4, 1.0, -7.0, 4.0);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(148,163,184,0.34)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -11.0); ctx.quadraticCurveTo(1.8, -12.8, 6.0, -10.2); ctx.stroke();
      }
    } else if (hs === 'ponytail') {
      ctx.beginPath();
      ctx.moveTo(-9.6, 2.2);
      ctx.bezierCurveTo(-11.2, -9.5, 0.5, -13.5, 9.0, -5.8);
      ctx.bezierCurveTo(4.2, -6.5, -1.2, -5.5, -4.2, -1.0);
      ctx.bezierCurveTo(-6, 1, -7, 3, -7.5, 4);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.quadraticCurveTo(-18.5, -12.5, -24.5 + sw * 0.45, 4.5);
      ctx.quadraticCurveTo(-16, -1.5, -6, -4);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.fillStyle = st.scarfColor || '#22c55e';
        ctx.beginPath(); ctx.arc(-7, -8, 2.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = st.hair;
      }
    } else if (hs === 'giangmanh_topknot' || hs === 'silver_patriarch') {
      // Ngô Giang Mạnh: Tóc bạc chải mượt liền mạch vào búi tóc hình thang vương miện + Vòng trâm bạc lam
      ctx.beginPath();
      ctx.moveTo(-9.8, 3.2);
      ctx.bezierCurveTo(-11.4, -8.8, -5.8, -12.6, -4.2, -12.6);
      ctx.lineTo(-3.6, -17.2);
      ctx.quadraticCurveTo(-0.8, -18.2, 2.2, -17.0);
      ctx.lineTo(2.8, -12.2);
      ctx.lineTo(7.2, -10.6);
      ctx.bezierCurveTo(10.6, -8.8, 10.8, -5.2, 9.0, -4.0);
      ctx.bezierCurveTo(4.0, -6.4, -2.5, -6.0, -5.2, -2.0);
      ctx.lineTo(-7.2, 3.8);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-6.2, -7.8); ctx.quadraticCurveTo(-2.5, -10.2, 0.2, -12.4);
        ctx.moveTo(4.2, -9.0); ctx.quadraticCurveTo(1.6, -10.8, 0.4, -12.4);
        ctx.stroke();
        // Đai quan miện xanh đen viền bạc thanh tao ôm chân búi tóc
        ctx.fillStyle = '#0f2035';
        ctx.beginPath();
        ctx.moveTo(-4.4, -11.4); ctx.lineTo(2.9, -11.2); ctx.lineTo(2.5, -13.4); ctx.lineTo(-4.0, -13.6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 0.95; ctx.stroke();
        // Trâm ngọc lam xuyên ngang búi tóc
        ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-7.8, -15.4); ctx.lineTo(5.6, -14.2); ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(-7.8, -15.4, 1.25, 0, Math.PI * 2); ctx.fill();
      }
    } else if (hs === 'slicked') {
      // Phó Văn Anh: Tóc Pompadour đen bóng vuốt ngược dày bồng + 1 lọn tóc buông hờ trước trán (theo đúng concept art)
      ctx.beginPath();
      ctx.moveTo(-10.0, 3.8);
      ctx.bezierCurveTo(-12.8, -10.8, -2.4, -17.2, 7.2, -14.0);
      ctx.bezierCurveTo(12.2, -11.6, 12.6, -6.8, 9.8, -3.6);
      ctx.bezierCurveTo(6.6, -6.8, 1.2, -7.6, -3.6, -4.4);
      ctx.bezierCurveTo(-6.0, -2.6, -6.8, 1.0, -7.4, 4.2);
      ctx.closePath(); ctx.fill();
      // Lọn tóc rũ lãng tử vắt nhẹ qua trán phải
      ctx.beginPath();
      ctx.moveTo(5.6, -7.8);
      ctx.quadraticCurveTo(9.4, -6.4, 8.8, -2.6);
      ctx.quadraticCurveTo(7.4, -4.8, 4.2, -6.4);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(251,191,36,0.48)'; ctx.lineWidth = 1.15; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-6.2, -10.0); ctx.quadraticCurveTo(0.2, -14.0, 8.2, -10.2); ctx.stroke();
      }
    } else if (hs === 'windswept') {
      // Phó Tiến Đăng: Tóc đen dài gợn gai vuốt ngược gọn gàng hơn phía sau gáy + mái xù sắc bén
      ctx.beginPath();
      ctx.moveTo(-9.8, 3.6);
      ctx.lineTo(-14.8 + sw * 0.25, -1.6); ctx.lineTo(-11.4, -4.8);
      ctx.lineTo(-16.5 + sw * 0.35, -8.8); ctx.lineTo(-10.6, -9.6);
      ctx.lineTo(-13.8 + sw * 0.28, -13.8); ctx.lineTo(-5.5, -13.0);
      ctx.lineTo(1.8, -15.8); ctx.lineTo(5.8, -12.6);
      ctx.lineTo(11.4, -14.0); ctx.lineTo(9.4, -9.4);
      ctx.lineTo(12.6, -6.6); ctx.lineTo(9.4, -3.4);
      ctx.lineTo(6.8, -0.8); ctx.lineTo(3.8, -4.6);
      ctx.lineTo(0.8, -2.2); ctx.lineTo(-2.4, -5.0);
      ctx.bezierCurveTo(-4.8, -2.4, -6.2, 1.0, -7.2, 4.0);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(56,189,248,0.52)'; ctx.lineWidth = 1.15; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4.5, -11.2); ctx.quadraticCurveTo(1.8, -13.2, 7.6, -10.2);
        ctx.moveTo(-12.2 + sw * 0.22, -8.2); ctx.quadraticCurveTo(-9.0, -8.5, -6.2, -6.8);
        ctx.stroke();
      }
    } else if (hs === 'thienkhanh_topknot') {
      // Châu Ngọc Thiên Khánh: Búi tóc Đạo sĩ trên đỉnh đầu buộc dây đỏ + tóc mai rủ sắc cạnh
      ctx.beginPath();
      ctx.moveTo(-10.2, 1.5);
      ctx.quadraticCurveTo(-11.4, -7.2, -5.8, -11.8);
      ctx.quadraticCurveTo(0, -13.5, 6.8, -11.2);
      ctx.quadraticCurveTo(10.8, -7.8, 9.6, -2.5);
      ctx.lineTo(7.4, -4.6); ctx.lineTo(4.6, -1.8); ctx.lineTo(2.4, -5.0);
      ctx.lineTo(-0.8, -2.6); ctx.lineTo(-3.4, -5.4);
      ctx.quadraticCurveTo(-6.2, -1.5, -8.0, 4.8);
      ctx.closePath(); ctx.fill();
      // Búi tóc cao + dây buộc đỏ + trâm đồng
      ctx.beginPath(); ctx.ellipse(-1.4, -14.2, 4.2, 3.6, -0.15, 0, Math.PI * 2); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-4.4, -11.8); ctx.lineTo(1.6, -11.8); ctx.stroke();
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-6.2, -14.4); ctx.lineTo(3.4, -14.0); ctx.stroke();
      }
    }

    if (hs === 'bandana') {
      ctx.fillStyle = this._c(st, st.bandana);
      ctx.beginPath(); ctx.moveTo(-9.5, -5.8); ctx.lineTo(9.9, -6.6); ctx.lineTo(10.0, -3.3); ctx.lineTo(-9.6, -2.5); ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(-7, -4.6); ctx.lineTo(8, -5.2); ctx.stroke();
      }
    }

    // 5. Mặt nạ, Râu, Mũ bảo hộ, Sẹo
    if (st.mask) {
      ctx.fillStyle = this._c(st, st.mask);
      ctx.beginPath(); ctx.moveTo(-8.8, 1.8); ctx.lineTo(9.8, 0.8); ctx.lineTo(8.2, 10.8); ctx.lineTo(0, 12.4); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-6, 3.2); ctx.lineTo(8.5, 2.2); ctx.stroke();
      }
    }
    if (st.coinVeil) {
      // Mạng che nửa mặt dưới bằng chuỗi đồng xu cổ (Châu Ngọc Thiên Khánh)
      if (!isSolid) {
        ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(-7.2, 2.2); ctx.lineTo(9.0, 1.6); ctx.stroke();
        for (let r = 0; r < 3; r++) {
          const cols = 4 - (r === 2 ? 1 : 0);
          for (let c = 0; c < cols; c++) {
            const cx = 0.8 + c * 2.5 - (r === 2 ? -0.9 : 0);
            const cy = 3.2 + r * 3.1;
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath(); ctx.arc(cx, cy, 1.45, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#451a03'; ctx.lineWidth = 0.55; ctx.stroke();
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(cx - 0.35, cy - 0.35, 0.7, 0.7);
          }
        }
      } else {
        ctx.fillStyle = st._solid;
        ctx.beginPath(); ctx.moveTo(-6, 1.8); ctx.lineTo(9.2, 1.4); ctx.lineTo(7.4, 11.2); ctx.lineTo(-2, 10.6); ctx.closePath(); ctx.fill();
      }
    }
    if (st.ninjaHood) {
      ctx.fillStyle = this._c(st, '#090d16');
      ctx.beginPath(); ctx.ellipse(0, -1, 10.4, 11.2, 0, 0, Math.PI * 2); ctx.fill();
      if (!isSolid) {
        ctx.fillStyle = st.skin;
        ctx.beginPath(); ctx.ellipse(3.8, -1.2, 5.2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.moveTo(-5, 0.5); ctx.lineTo(8.5, 0); ctx.lineTo(7.2, 10); ctx.lineTo(0, 11.8); ctx.lineTo(-6, 8.5);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    if (st.beard) {
      const isSilver = hs === 'white' || hs === 'silver_patriarch' || hs === 'giangmanh_topknot';
      ctx.fillStyle = this._c(st, isSilver ? '#e5e7eb' : (st.beardColor || st.hair));
      if (isSilver) {
        // Ngô Giang Mạnh: Ria mép rủ dài + Râu bạc 3 chòm tách nét trang nghiêm
        ctx.beginPath();
        ctx.moveTo(0.2, 6.4); ctx.lineTo(8.4, 5.4);
        ctx.lineTo(6.6, 15.2); ctx.lineTo(4.4, 12.6);
        ctx.lineTo(3.2, 16.8); ctx.lineTo(1.6, 13.0);
        ctx.lineTo(0.4, 14.5);
        ctx.closePath(); ctx.fill();
        if (!isSolid) {
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.85; ctx.stroke();
          // Ria mép rủ hai bên khóe miệng
          ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.75; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(4.4, 3.6); ctx.quadraticCurveTo(7.6, 4.6, 8.8, 8.8); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(3.4, 3.6); ctx.quadraticCurveTo(1.2, 5.0, 0.0, 8.8); ctx.stroke();
          ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.85;
          ctx.beginPath(); ctx.moveTo(3.5, 7.6); ctx.lineTo(3.2, 14.6); ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.moveTo(0.8, 6.4); ctx.lineTo(7.4, 6.0); ctx.lineTo(6.0, 10.6); ctx.lineTo(1.6, 11.2); ctx.closePath(); ctx.fill();
      }
    }
    if (st.stubbleJaw && !isSolid) {
      // Râu dê/quai nón gọn gàng ôm dưới khóe miệng & chóp cằm Triệu Đình An
      ctx.strokeStyle = 'rgba(28, 22, 18, 0.72)'; ctx.lineWidth = 1.25; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(3.4, 3.8); ctx.quadraticCurveTo(5.6, 4.1, 7.6, 5.2); ctx.stroke();
      ctx.fillStyle = 'rgba(28, 22, 18, 0.56)';
      ctx.beginPath(); ctx.moveTo(3.0, 7.4); ctx.lineTo(7.4, 7.0); ctx.lineTo(6.2, 10.1); ctx.lineTo(2.8, 9.8); ctx.closePath(); ctx.fill();
    }

    if (st.helmet === 'golden_lion') {
      // Triệu Đình An: Mũ Phụng Hoàng chiến giáp vàng-đỏ có chùm lông đuôi ngựa đỏ rũ mềm mại + cánh giáp ôm thái dương
      ctx.fillStyle = this._c(st, '#dc2626');
      ctx.beginPath();
      ctx.moveTo(0.8, -14.2);
      ctx.bezierCurveTo(-8.5, -26.0, -22.5 + sw * 0.4, -20.5, -27.5 + sw * 0.65, -1.5);
      ctx.lineTo(-21.5 + sw * 0.5, -7.2);
      ctx.lineTo(-23.0 + sw * 0.45, 2.2);
      ctx.quadraticCurveTo(-17.8 + sw * 0.35, -10.0, -12.5 + sw * 0.25, -10.4);
      ctx.quadraticCurveTo(-6.8, -16.2, -1.0, -13.2);
      ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.strokeStyle = 'rgba(254, 202, 202, 0.38)'; ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.moveTo(-2.5, -17.0); ctx.quadraticCurveTo(-15.0, -21.5, -23.2 + sw * 0.45, -6.5); ctx.stroke();
      }
      // Chỏm đài sen vàng kim gắn lông mũ gọn đẹp
      ctx.fillStyle = this._c(st, '#facc15');
      ctx.beginPath(); ctx.moveTo(-2.6, -13.4); ctx.lineTo(0.6, -17.2); ctx.lineTo(3.6, -13.4); ctx.closePath(); ctx.fill();
      // Thân mũ trụ đỏ sẫm bọc khung vàng kim (nâng vành mũ thoáng hơn để rõ trán & ánh mắt trên cả HUD Portrait)
      ctx.fillStyle = this._c(st, '#991b1b');
      ctx.beginPath(); ctx.ellipse(0, -7.0, 10.4, 7.6, 0, Math.PI * 0.92, Math.PI * 2.08); ctx.fill();
      if (!isSolid) {
        const helFill = this._materialFill ? this._materialFill(ctx, st, 'gold', -9, -15, 9, -2, '#d97706') : '#d97706';
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = helFill;
        ctx.beginPath(); ctx.moveTo(-9.5, -7.0); ctx.lineTo(10.1, -7.0); ctx.lineTo(9.3, -4.6); ctx.lineTo(-8.9, -4.6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(4.8, -5.8, 1.65, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fef9c3'; ctx.lineWidth = 0.8; ctx.stroke();
        // Giáp má vàng bảo vệ thái dương & quai hàm (ôm lui nhẹ khỏi góc miệng)
        ctx.fillStyle = helFill;
        ctx.beginPath(); ctx.moveTo(-8.4, -4.8); ctx.lineTo(-4.4, 2.0); ctx.lineTo(-9.6, 1.6); ctx.closePath(); ctx.fill();
        // Cánh Phụng Hoàng vàng vuốt gọn xuôi theo dáng mũ
        ctx.fillStyle = '#fde047';
        ctx.beginPath(); ctx.moveTo(5.6, -9.0); ctx.quadraticCurveTo(10.2, -12.2, 11.4, -14.8); ctx.lineTo(8.8, -6.0); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-6.8, -9.0); ctx.quadraticCurveTo(-11.4, -12.2, -12.4, -14.8); ctx.lineTo(-8.4, -6.0); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = st._solid;
        ctx.beginPath(); ctx.moveTo(5.6, -9.0); ctx.lineTo(11.4, -14.8); ctx.lineTo(8.8, -6.0); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-6.8, -9.0); ctx.lineTo(-12.4, -14.8); ctx.lineTo(-8.4, -6.0); ctx.closePath(); ctx.fill();
      }
    } else if (st.helmet) {
      ctx.fillStyle = this._edge(st, 'rgba(0,0,0,0.55)');
      ctx.beginPath(); ctx.moveTo(-10.4, 1); ctx.bezierCurveTo(-12, -14, 9, -15, 10.4, -3); ctx.lineTo(-10.4, -1.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = this._c(st, st.helmet);
      ctx.beginPath(); ctx.moveTo(-9.6, 0); ctx.bezierCurveTo(-11, -13, 8, -14, 9.6, -3.4); ctx.lineTo(-9.6, -2.2); ctx.closePath(); ctx.fill();
      if (!isSolid) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.ellipse(-1, -9, 5, 1.8, -0.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (st.scar && !isSolid) {
      // Vết sẹo chiến trận vắt qua chân mày & gò má ngoài tránh che đồng tử mắt
      ctx.strokeStyle = 'rgba(136,24,24,0.88)'; ctx.lineWidth = 1.35; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(5.4, -6.4); ctx.lineTo(6.8, 3.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,210,185,0.34)'; ctx.lineWidth = 0.65;
      ctx.beginPath(); ctx.moveTo(5.9, -6.0); ctx.lineTo(7.2, 3.0); ctx.stroke();
    }

    // 6. Mắt Anime-Realist Sắc Sảo, Chân Mày Kiếm & Thần Thái Võ Giả (ẩn chi tiết màu trong chế độ Silhouette đen)
    if (!isSolid) {
      if (st.sunglasses) {
        // Kính râm mafia có gọng tai + ánh phản quang chéo
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.moveTo(-3.6, -0.8); ctx.lineTo(1.4, -1.4); ctx.stroke();
        ctx.fillStyle = '#090a0f';
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(1.2, -3.3, 8.4, 4.3, 1.2) : ctx.rect(1.2, -3.3, 8.4, 4.3); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.85; ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 245, 220, 0.58)'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.moveTo(3.2, -2.7); ctx.lineTo(7.4, 0.4); ctx.stroke();
      } else if (st.oniMask) {
        // Mặt nạ Quỷ Dạ Xoa Đỏ Hannya + Cặp sừng đỏ cong vút + Trăng lưỡi liềm vàng + Mắt quỷ rực hổ phách
        ctx.save();
        // Lọn mái tóc bạc xõa hai bên trán
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(-7.8, -8.5); ctx.quadraticCurveTo(-11.2, -1.0, -9.2, 8.5); ctx.lineTo(-5.2, 4.5); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(4.2, -10.8); ctx.quadraticCurveTo(9.8, -6.5, 9.6, 0.5); ctx.lineTo(5.8, -3.0); ctx.closePath(); ctx.fill();

        // Mặt nạ Đỏ Hannya góc cạnh che trọn nửa mặt + răng nanh
        const mGrad = ctx.createLinearGradient(-4, -8, 10, 11);
        mGrad.addColorStop(0, '#ef4444');
        mGrad.addColorStop(0.55, '#b91c1c');
        mGrad.addColorStop(1, '#450a0a');
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.moveTo(-3.6, -7.8);
        ctx.lineTo(7.8, -7.4);
        ctx.lineTo(10.6, -1.2);
        ctx.lineTo(9.4, 6.2);
        ctx.lineTo(5.2, 11.4);
        ctx.lineTo(-2.8, 9.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 1.2; ctx.stroke();

        // Miệng quỷ nhe nanh trắng sắc nhọn
        ctx.fillStyle = '#09090b';
        ctx.beginPath(); ctx.moveTo(2.0, 5.8); ctx.lineTo(9.2, 4.6); ctx.lineTo(8.0, 7.6); ctx.lineTo(2.4, 8.0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.moveTo(3.2, 5.6); ctx.lineTo(4.0, 7.2); ctx.lineTo(4.8, 5.4);
        ctx.moveTo(6.6, 5.0); ctx.lineTo(7.4, 7.4); ctx.lineTo(8.2, 4.8);
        ctx.fill();

        // Vầng trăng khuyết vàng kim trên trán mặt nạ
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(4.8, -5.0, 2.0, 0.4, Math.PI * 1.65); ctx.stroke();

        // Mắt quỷ hổ phách phát sáng xuyên qua khe mặt nạ
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.moveTo(1.8, -2.5); ctx.lineTo(7.8, -3.4); ctx.lineTo(6.8, -0.6); ctx.lineTo(2.4, -0.9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(5.4, -2.0, 0.8, 0, Math.PI * 2); ctx.fill();

        // Cặp sừng Quỷ Đỏ cong vút vươn cao lên trời
        if (st.oniHorns) {
          const drawHorn = (bx, by, tx, ty, cx1, cy1, wBase) => {
            const hGrad = ctx.createLinearGradient(bx, by, tx, ty);
            hGrad.addColorStop(0, '#7f1d1d');
            hGrad.addColorStop(0.55, '#dc2626');
            hGrad.addColorStop(1, '#fca5a5');
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.moveTo(bx - wBase, by);
            ctx.quadraticCurveTo(cx1, cy1, tx, ty);
            ctx.quadraticCurveTo(cx1 + wBase * 1.2, cy1 + 2, bx + wBase, by + 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 0.9; ctx.stroke();
          };
          drawHorn(-2.2, -9.2, -9.5, -24.5, -9.5, -16.2, 2.4);
          drawHorn(4.6, -9.4, 10.2, -26.0, 10.6, -17.5, 2.6);
        }
        ctx.restore();
      } else if (st.glowingEyes) {
        // Mắt rực sáng Cyan Tiến Đăng + viền mi mắt sắc sảo
        ctx.save();
        ctx.fillStyle = '#082f49';
        ctx.beginPath(); ctx.ellipse(4.6, -1.0, 3.4, 1.85, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ecfeff';
        ctx.beginPath(); ctx.ellipse(4.7, -1.0, 2.9, 1.45, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = st.glowingEyes;
        ctx.beginPath(); ctx.arc(5.3, -1.0, 1.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(4.8, -1.35, 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#020617'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.moveTo(1.2, -1.7); ctx.quadraticCurveTo(4.6, -3.2, 8.0, -1.3); ctx.stroke();
        ctx.restore();
      } else {
        // Củng mạc + mống mắt có đồng tử & 2 điểm bắt sáng + mi mắt trên/dưới
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.ellipse(4.5, -1.0, 3.0, 1.9, -0.06, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = st.eyeColor || '#0f172a';
        ctx.beginPath(); ctx.arc(5.2, -1.0, 1.45, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#020617';
        ctx.beginPath(); ctx.arc(5.35, -1.0, 0.74, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(4.65, -1.5, 0.64, 0, Math.PI * 2); ctx.fill();
        // Mi mắt trên sắc & nếp mí mắt dưới nhẹ
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.25;
        ctx.beginPath(); ctx.moveTo(1.3, -1.6); ctx.quadraticCurveTo(4.6, -3.2, 7.6, -1.2); ctx.stroke();
        ctx.strokeStyle = 'rgba(110,48,20,0.45)'; ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.moveTo(2.4, 0.9); ctx.quadraticCurveTo(4.8, 1.3, 6.8, 0.7); ctx.stroke();
      }

      if (st.glasses) {
        ctx.strokeStyle = 'rgba(180,205,235,0.9)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(4.6, -1, 4.6, 3.4, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0.2, -1.4); ctx.lineTo(0.4, -1.4); ctx.stroke();
        ctx.fillStyle = 'rgba(120,200,255,0.18)';
        ctx.beginPath(); ctx.ellipse(4.6, -1, 4.2, 3, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Chân mày kiếm uy nghi
      ctx.strokeStyle = (hs === 'white' || hs === 'silver_patriarch' || hs === 'giangmanh_topknot') ? '#e2e8f0' : st.hair;
      ctx.lineWidth = (st.archetype === 'patriarch_draped_suit' || st.archetype === 'phoenix_general') ? 2.0 : 1.75;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (o.angry) {
        ctx.moveTo(1.2, -5.0); ctx.lineTo(7.6, -2.5);
      } else {
        ctx.moveTo(1.4, -4.1); ctx.lineTo(7.4, -3.5);
      }
      ctx.stroke();

      // Sống mũi góc cạnh & Miệng biểu cảm theo nhân vật
      ctx.strokeStyle = 'rgba(105,46,18,0.65)'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(8.8, -0.9); ctx.lineTo(10.0, 1.7); ctx.lineTo(8.2, 2.3); ctx.stroke();
      if (!st.mask && !st.ninjaHood) {
        if (o.shout) {
          ctx.fillStyle = '#4a0d18';
          ctx.beginPath(); ctx.ellipse(5.4, 5.6, 2.9, 2.4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f8fafc'; ctx.fillRect(3.3, 3.7, 4.2, 1.1);
        } else if (st.archetype === 'shinobi_assassin') {
          // Nụ cười nửa miệng ngạo nghễ đặc trưng của Trần Dũng Hải
          ctx.strokeStyle = 'rgba(90,32,22,0.88)'; ctx.lineWidth = 1.25;
          ctx.beginPath(); ctx.moveTo(3.2, 5.9); ctx.quadraticCurveTo(5.6, 6.2, 7.8, 4.7); ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(90,32,22,0.85)'; ctx.lineWidth = 1.25;
          ctx.beginPath(); ctx.moveTo(3.2, 5.8); ctx.quadraticCurveTo(5.2, 5.9, 7.3, 5.4); ctx.stroke();
        }
      }
    }

    // Xì gà Habana ngậm trên miệng (Phó Văn Anh) với góc ngậm đằm tự nhiên, đầu lửa đỏ và khói bay
    if (st.cigar) {
      ctx.strokeStyle = this._c(st, '#5b3a1e'); ctx.lineWidth = 2.45; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(6.2, 5.7); ctx.lineTo(16.4, 6.2); ctx.stroke();
      if (!isSolid) {
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 0.85;
        ctx.beginPath(); ctx.moveTo(10.0, 5.9); ctx.lineTo(10.2, 4.5); ctx.stroke();
        const t = performance.now();
        ctx.fillStyle = `rgba(239,68,68,${0.78 + 0.22 * Math.sin(t * 0.012)})`;
        ctx.beginPath(); ctx.arc(16.7, 6.2, 1.45, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(226,232,240,0.38)'; ctx.lineWidth = 1.2;
        const wob = Math.sin(t * 0.004) * 2.2;
        ctx.beginPath(); ctx.moveTo(16, 3); ctx.bezierCurveTo(14 + wob, -2, 19 - wob, -5, 16 + wob, -10); ctx.stroke();
      }
    }
  }

  // ------------------------------------------------------------------ PORTRAIT (HUD / thoại / Thẻ Trang Phục)
  drawPortrait(canvas, type, flip, vovinamSkin = false, skinId = null) {
    if (!canvas || !canvas.getContext) return;
    const c = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const activeSkin = (typeof skinId === 'string' && skinId) ? skinId : (vovinamSkin ? 'vovinam' : 'default');
    const st = this.getStyle({ type: type || 'player', styleType: type || 'player', vovinamSkin: activeSkin === 'vovinam', equippedSkin: activeSkin });
    c.clearRect(0, 0, w, h);

    const bg = c.createRadialGradient(w * 0.5, h * 0.45, 4, w * 0.5, h * 0.5, w * 0.75);
    bg.addColorStop(0, this.rgba(activeSkin === 'vovinam' ? '#38bdf8' : st.aura, 0.62));
    bg.addColorStop(1, '#070a12');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);

    c.save();
    if (flip) { c.translate(w, 0); c.scale(-1, 1); }

    // Vai + cổ trang phục theo đúng archetype nhân vật
    const arch = st.archetype;
    const sg = c.createLinearGradient(0, h * 0.7, 0, h);
    if (st.dogFurSkin) {
      sg.addColorStop(0, '#f8fafc'); sg.addColorStop(1, '#cbd5e1');
    } else if (arch === 'mafia_overcoat' || arch === 'patriarch_draped_suit') {
      sg.addColorStop(0, st.coatColor || '#14171f'); sg.addColorStop(1, '#07090f');
    } else if (arch === 'phoenix_general') {
      sg.addColorStop(0, '#facc15'); sg.addColorStop(1, '#92400e');
    } else {
      sg.addColorStop(0, st.giL); sg.addColorStop(1, st.giD);
    }
    c.fillStyle = sg;
    c.beginPath();
    c.moveTo(w * 0.02, h); c.quadraticCurveTo(w * 0.06, h * 0.72, w * 0.32, h * 0.7);
    c.lineTo(w * 0.7, h * 0.7); c.quadraticCurveTo(w * 0.96, h * 0.72, w * 0.98, h); c.closePath(); c.fill();

    // Cổ + lớp áo trong tương ứng
    c.fillStyle = st.skinD; c.fillRect(w * 0.42, h * 0.58, w * 0.18, h * 0.16);
    c.fillStyle = st.bareVChest ? st.skin : (st.under || '#e5e7eb');
    c.beginPath(); c.moveTo(w * 0.36, h * 0.7); c.lineTo(w * 0.66, h * 0.7); c.lineTo(w * 0.51, h * 0.9); c.closePath(); c.fill();

    if (st.dogFurSkin) {
      c.strokeStyle = '#94a3b8'; c.lineWidth = w * 0.03;
      c.beginPath(); c.moveTo(w * 0.34, h * 0.72); c.lineTo(w * 0.51, h * 0.9); c.lineTo(w * 0.68, h * 0.72); c.stroke();
    } else if (arch === 'mafia_overcoat' || arch === 'patriarch_draped_suit' || st.suit) {
      c.strokeStyle = st.tieColor || '#d9a429'; c.lineWidth = w * 0.05;
      c.beginPath(); c.moveTo(w * 0.51, h * 0.72); c.lineTo(w * 0.51, h * 0.95); c.stroke();
      c.strokeStyle = st.vestColor || '#7f1d1d'; c.lineWidth = w * 0.04;
      c.beginPath(); c.moveTo(w * 0.34, h * 0.7); c.lineTo(w * 0.51, h * 0.92); c.lineTo(w * 0.68, h * 0.7); c.stroke();
    } else if (arch === 'shinobi_assassin' || st.crimsonScarf) {
      c.strokeStyle = st.scarfColor || '#b91c1c'; c.lineWidth = w * 0.11; c.lineCap = 'round';
      c.beginPath(); c.moveTo(w * 0.32, h * 0.71); c.quadraticCurveTo(w * 0.51, h * 0.80, w * 0.70, h * 0.71); c.stroke();
    } else if (arch === 'cyber_trench' || arch === 'patriarch_sword_robe') {
      c.strokeStyle = arch === 'cyber_trench' ? (st.coatTrim || '#e2e8f0') : '#cbd5e1';
      c.lineWidth = w * 0.032;
      c.beginPath(); c.moveTo(w * 0.34, h * 0.62); c.lineTo(w * 0.36, h * 0.78); c.lineTo(w * 0.66, h * 0.78); c.lineTo(w * 0.68, h * 0.62); c.stroke();
    } else {
      c.strokeStyle = arch === 'mountain_guardian' ? '#c2a060' : st.giL;
      c.lineWidth = w * 0.035;
      c.beginPath(); c.moveTo(w * 0.34, h * 0.7); c.lineTo(w * 0.58, h * 0.98); c.stroke();
      c.beginPath(); c.moveTo(w * 0.68, h * 0.7); c.lineTo(w * 0.44, h * 0.98); c.stroke();
    }

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
    const isNamCheo = (skinId === 'namcheo');
    const isHoXam = (skinId === 'hoxam');
    const isThanTrung = (skinId === 'thantrung');
    const isChoDoiNon = (skinId === 'chodoinon');
    const isThuongLuong = (skinId === 'thuongluong');
    const isNguTinh = (skinId === 'ngutinh');
    const isQuyDaXoa = (skinId === 'quydaxoa');
    const styleType = charObj.styleType || 'player';
    const dummy = {
      id: 'skin_card_' + charObj.id + '_' + skinId,
      type: styleType,
      styleType: styleType,
      charId: charObj.id,
      characterId: charObj.id,
      vovinamSkin: isVovinam,
      equippedSkin: skinId || 'default',
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
    if (isNamCheo) {
      bg.addColorStop(0, '#083344');
      bg.addColorStop(0.55, '#0e7490');
      bg.addColorStop(1, '#051923');
    } else if (isHoXam) {
      bg.addColorStop(0, '#334155');
      bg.addColorStop(0.55, '#1e293b');
      bg.addColorStop(1, '#090d16');
    } else if (isThanTrung) {
      bg.addColorStop(0, '#450a0a');
      bg.addColorStop(0.55, '#1e3a8a');
      bg.addColorStop(1, '#09090d');
    } else if (isChoDoiNon) {
      bg.addColorStop(0, '#7f1d1d');
      bg.addColorStop(0.55, '#271216');
      bg.addColorStop(1, '#09090b');
    } else if (isThuongLuong) {
      bg.addColorStop(0, '#042f2e');
      bg.addColorStop(0.5, '#0e7490');
      bg.addColorStop(1, '#08121c');
    } else if (isNguTinh) {
      bg.addColorStop(0, '#042f2e');
      bg.addColorStop(0.5, '#4c1d95');
      bg.addColorStop(1, '#050a14');
    } else if (isQuyDaXoa) {
      bg.addColorStop(0, '#450a0a');
      bg.addColorStop(0.52, '#991b1b');
      bg.addColorStop(1, '#09090b');
    } else if (isVovinam) {
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
