/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/scenery.js - Bối cảnh Parallax đa lớp cho 4 màn chơi (ghi đè StageManager.renderBackground)
 * Lớp: bầu trời/đường chân trời -> tường (0.6x) -> đạo cụ -> sàn -> ánh sáng additive -> sương.
 */
(function () {
  const FLOOR_Y = 510;
  const mod = (a, m) => ((a % m) + m) % m;
  const tileCache = {};

  // ---------------------------------------------------------------- TILES (vẽ 1 lần, lặp bằng pattern)
  function makeTile(kind) {
    if (tileCache[kind]) return tileCache[kind];
    const c = document.createElement('canvas');
    let g;
    if (kind === 'brick') {
      c.width = 72; c.height = 36; g = c.getContext('2d');
      g.fillStyle = '#2b1a22'; g.fillRect(0, 0, 72, 36);
      for (let r = 0; r < 2; r++) {
        const y = r * 18, off = r ? 18 : 0;
        for (let i = 0; i < 2; i++) {
          const x = off + i * 36;
          g.fillStyle = `rgba(${90 + (r * 17 + i * 31) % 40},${40 + (i * 13) % 20},${45 + (r * 9) % 20},0.35)`;
          g.fillRect(x + 1, y + 1, 34, 16);
        }
      }
      g.strokeStyle = 'rgba(8,4,8,0.75)'; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, 0.5); g.lineTo(72, 0.5); g.moveTo(0, 18.5); g.lineTo(72, 18.5);
      g.moveTo(0.5, 0); g.lineTo(0.5, 18); g.moveTo(36.5, 0); g.lineTo(36.5, 18);
      g.moveTo(18.5, 18); g.lineTo(18.5, 36); g.moveTo(54.5, 18); g.lineTo(54.5, 36);
      g.stroke();
    } else if (kind === 'steel') {
      c.width = 28; c.height = 8; g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 28, 0);
      gr.addColorStop(0, '#1b2538'); gr.addColorStop(0.5, '#33445f'); gr.addColorStop(1, '#1b2538');
      g.fillStyle = gr; g.fillRect(0, 0, 28, 8);
    } else if (kind === 'concrete') {
      c.width = 220; c.height = 120; g = c.getContext('2d');
      g.fillStyle = '#2a2326'; g.fillRect(0, 0, 220, 120);
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
        g.fillRect(Math.random() * 220, Math.random() * 120, 3 + Math.random() * 14, 2);
      }
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 3;
      g.strokeRect(1.5, 1.5, 217, 117);
      g.fillStyle = '#4a4044';
      [[8, 8], [212, 8], [8, 112], [212, 112]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); });
    } else if (kind === 'rock') {
      c.width = 160; c.height = 90; g = c.getContext('2d');
      g.fillStyle = '#26303a'; g.fillRect(0, 0, 160, 90);
      for (let i = 0; i < 26; i++) {
        g.fillStyle = `rgba(${60 + Math.random() * 60 | 0},${72 + Math.random() * 55 | 0},${84 + Math.random() * 50 | 0},0.5)`;
        const x = Math.random() * 150, y = Math.random() * 82;
        g.beginPath();
        g.moveTo(x, y); g.lineTo(x + 14 + Math.random() * 22, y + Math.random() * 8);
        g.lineTo(x + 10 + Math.random() * 20, y + 12 + Math.random() * 8); g.closePath(); g.fill();
      }
      g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, 0.5); g.lineTo(160, 0.5); g.moveTo(0.5, 0); g.lineTo(0.5, 90); g.stroke();
    } else { // marble
      c.width = 120; c.height = 120; g = c.getContext('2d');
      g.fillStyle = '#2a2217'; g.fillRect(0, 0, 120, 120);
      g.strokeStyle = 'rgba(255,215,120,0.12)'; g.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        g.beginPath(); g.moveTo(Math.random() * 120, 0);
        g.bezierCurveTo(Math.random() * 120, 40, Math.random() * 120, 80, Math.random() * 120, 120); g.stroke();
      }
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.strokeRect(1, 1, 118, 118);
    }
    tileCache[kind] = c;
    return c;
  }

  function fillPattern(ctx, kind, parallax, camX, y, h, w) {
    const tile = makeTile(kind);
    if (!tile._pat) {
      try { tile._pat = ctx.createPattern(tile, 'repeat'); } catch (_) {}
    }
    const pat = tile._pat || tile;
    const ox = -mod(camX * parallax, tile.width);
    ctx.save();
    ctx.translate(ox, y);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w + tile.width, h);
    ctx.restore();
  }

  function glow(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace('A', a));
    g.addColorStop(1, color.replace('A', 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const SCN = {
    // ---------------------------------------------------------------- SKY
    sky(ctx, id, w, h, cx) {
      const tops = {
        1: ['#05060d', '#2a1030'], 2: ['#070b14', '#1b2740'], 3: ['#0a0204', '#2b0b12'], 4: ['#0d0a05', '#2b2312'],
        5: ['#060406', '#231016'], 6: ['#03110c', '#0e2b20'], 7: ['#070a11', '#16223a'],
        8: ['#061018', '#1c3448'], 9: ['#0d0903', '#33260f'], 10: ['#120c03', '#3a2c10'], 11: ['#07070c', '#20222e']
      }[id] || ['#07080e', '#1c2130'];
      const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
      g.addColorStop(0, tops[0]); g.addColorStop(1, tops[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      if (id === 8 || id === 11) {
        // Mặt trăng lớn (Trăng bạc ở Thập Vạn Đại Sơn / Huyết Nguyệt ở Đoạn Nghĩa Đài)
        const moonX = w * 0.76 - cx * 0.03;
        const moonY = 105;
        glow(ctx, moonX, moonY, 150, id === 11 ? 'rgba(239,68,68,A)' : 'rgba(186,230,253,A)', 0.28);
        ctx.fillStyle = id === 11 ? 'rgba(254, 202, 202, 0.88)' : 'rgba(240, 249, 255, 0.9)';
        ctx.beginPath(); ctx.arc(moonX, moonY, 42, 0, Math.PI * 2); ctx.fill();

        // Dãy núi / vách đá xa (parallax 0.12)
        ctx.fillStyle = 'rgba(8, 14, 22, 0.9)';
        for (let i = 0; i < 10; i++) {
          const x = mod(i * 240 - cx * 0.12, w + 480) - 240;
          const bh = 120 + ((i * 61) % 150);
          ctx.beginPath();
          ctx.moveTo(x - 130, FLOOR_Y);
          ctx.lineTo(x, FLOOR_Y - bh);
          ctx.lineTo(x + 130, FLOOR_Y);
          ctx.closePath();
          ctx.fill();
        }
        return;
      }

      if (id !== 1) return;
      // Đường chân trời thành phố (parallax 0.08 / 0.18)
      for (let layer = 0; layer < 2; layer++) {
        const par = layer ? 0.18 : 0.08;
        ctx.fillStyle = layer ? '#0d0e1d' : '#0a0b17';
        for (let i = 0; i < 12; i++) {
          const x = mod(i * 190 - cx * par, w + 380) - 190;
          const bh = 150 + ((i * 53 + layer * 31) % 140) + layer * 40;
          ctx.fillRect(x, 330 - bh + layer * 60, 130, bh + 200);
          for (let r = 0; r < 6; r++) {
            for (let c2 = 0; c2 < 3; c2++) {
              if ((i * 7 + r * 3 + c2 + layer) % 4 === 0) {
                ctx.fillStyle = ((i + r) % 2) ? 'rgba(255,200,90,0.45)' : 'rgba(80,200,255,0.4)';
                ctx.fillRect(x + 18 + c2 * 34, 340 - bh + layer * 60 + r * 30, 12, 16);
              }
            }
          }
          ctx.fillStyle = layer ? '#0d0e1d' : '#0a0b17';
        }
      }
    },

    // ---------------------------------------------------------------- WALL
    wall(ctx, id, w, h, cx) {
      const top = id === 1 ? 170 : 90;
      const kind = { 1: 'brick', 2: 'steel', 3: 'concrete', 4: 'marble', 5: 'concrete', 6: 'steel', 7: 'concrete', 8: 'rock', 9: 'brick', 10: 'marble', 11: 'rock' }[id] || 'concrete';
      fillPattern(ctx, kind, 0.6, cx, top, FLOOR_Y - top, w);
      // Tối dần lên trên, tạo chiều sâu
      const g = ctx.createLinearGradient(0, top, 0, FLOOR_Y);
      g.addColorStop(0, 'rgba(0,0,0,0.78)'); g.addColorStop(0.6, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.05)');
      ctx.fillStyle = g; ctx.fillRect(0, top, w, FLOOR_Y - top);
      // Chân tường
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, FLOOR_Y - 10, w, 10);

      const par = 0.6;
      if (id === 1) {
        // Cửa sổ & cửa sắt
        for (let i = 0; i < 6; i++) {
          const x = mod(i * 340 - cx * par, w + 400) - 120;
          ctx.fillStyle = '#05060b'; ctx.fillRect(x, 215, 64, 92);
          const lit = i % 2 === 0;
          const gg = ctx.createLinearGradient(0, 215, 0, 307);
          gg.addColorStop(0, lit ? 'rgba(255,190,90,0.85)' : 'rgba(20,24,40,0.9)');
          gg.addColorStop(1, lit ? 'rgba(255,120,50,0.5)' : 'rgba(10,12,22,0.95)');
          ctx.fillStyle = gg; ctx.fillRect(x + 4, 219, 56, 84);
          ctx.strokeStyle = '#0a0a10'; ctx.lineWidth = 3; ctx.strokeRect(x + 2, 217, 60, 88);
          ctx.beginPath(); ctx.moveTo(x + 32, 217); ctx.lineTo(x + 32, 305); ctx.moveTo(x + 2, 261); ctx.lineTo(x + 62, 261); ctx.stroke();
          // Ống thoát nước
          ctx.fillStyle = '#16161e'; ctx.fillRect(x + 150, 170, 9, FLOOR_Y - 170);
          ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 152, 170, 2, FLOOR_Y - 170);
        }
      } else if (id === 2) {
        // Dầm thép ngang + đinh tán
        [130, 350].forEach((y) => {
          const g2 = ctx.createLinearGradient(0, y, 0, y + 22);
          g2.addColorStop(0, '#46566f'); g2.addColorStop(1, '#1a2231');
          ctx.fillStyle = g2; ctx.fillRect(0, y, w, 22);
          ctx.fillStyle = '#0e131c';
          for (let x = -mod(cx * par, 60); x < w; x += 60) { ctx.beginPath(); ctx.arc(x, y + 11, 2.4, 0, 7); ctx.fill(); }
        });
        // Cửa cuốn công nghiệp có sọc cảnh báo
        for (let i = 0; i < 3; i++) {
          const x = mod(i * 760 - cx * par, w + 900) - 200;
          ctx.fillStyle = '#111823'; ctx.fillRect(x, 190, 250, 320);
          for (let y = 196; y < 510; y += 14) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 6, y, 238, 2); }
          this.hazard(ctx, x - 12, 180, 274, 12);
        }
      } else if (id === 3) {
        // Hai đường ống chạy dọc hành lang
        [[150, '#5b3a3f'], [178, '#3b2a30']].forEach(([y, col]) => {
          ctx.fillStyle = col; ctx.fillRect(0, y, w, 14);
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, y + 2, w, 3);
          ctx.fillStyle = '#1b1215';
          for (let x = -mod(cx * par, 140); x < w; x += 140) ctx.fillRect(x, y - 3, 8, 20);
        });
        // Cửa kim loại
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 560 - cx * par, w + 700) - 150;
          ctx.fillStyle = '#18181f'; ctx.fillRect(x, 230, 120, 280);
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(x, 230, 120, 280);
          this.hazard(ctx, x, 222, 120, 8);
          ctx.fillStyle = 'rgba(255,40,80,0.8)'; ctx.fillRect(x + 100, 360, 8, 8);
        }
      } else if (id === 4 || id === 9 || id === 10) {
        // Cột đá cẩm thạch + biểu ngữ rồng
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 430 - cx * par, w + 600) - 130;
          const cg = ctx.createLinearGradient(x, 0, x + 56, 0);
          cg.addColorStop(0, '#15110a'); cg.addColorStop(0.5, '#5a4a2a'); cg.addColorStop(1, '#15110a');
          ctx.fillStyle = cg; ctx.fillRect(x, 90, 56, FLOOR_Y - 90);
          ctx.fillStyle = '#c59b27'; ctx.fillRect(x - 8, 90, 72, 14); ctx.fillRect(x - 8, FLOOR_Y - 16, 72, 16);
          // Biểu ngữ
          const bx = x + 110;
          ctx.fillStyle = '#6b0f1a'; ctx.beginPath();
          ctx.moveTo(bx, 120); ctx.lineTo(bx + 90, 120); ctx.lineTo(bx + 90, 330); ctx.lineTo(bx + 45, 300); ctx.lineTo(bx, 330); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.arc(bx + 45, 195, 24, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx + 30, 205); ctx.bezierCurveTo(bx + 30, 170, bx + 62, 215, bx + 60, 180); ctx.stroke();
        }
      } else if (id === 8) {
        // Thập Vạn Đại Sơn: Vách đá cổ thụ, rừng trúc đêm & thác sương mờ
        for (let i = 0; i < 7; i++) {
          const x = mod(i * 280 - cx * par, w + 560) - 140;
          // Thân trúc / tùng cổ thụ trong sương núi
          ctx.strokeStyle = 'rgba(20, 45, 38, 0.85)';
          ctx.lineWidth = 8;
          ctx.beginPath(); ctx.moveTo(x, 95); ctx.lineTo(x + 6, FLOOR_Y); ctx.stroke();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
          ctx.lineWidth = 2;
          for (let y = 140; y < FLOOR_Y; y += 54) {
            ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 10, y); ctx.stroke();
          }
          // Tán lá trúc sắc lẹm
          ctx.fillStyle = 'rgba(15, 38, 32, 0.85)';
          ctx.beginPath(); ctx.ellipse(x + 18, 135 + (i % 3) * 28, 48, 16, 0.25, 0, 7); ctx.fill();
        }
      } else if (id === 11) {
        // Đoạn Nghĩa Đài: Cổng đá cổ đổ nát & đại kỳ võ phái phần phật trong gió bão
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 460 - cx * par, w + 680) - 150;
          ctx.fillStyle = '#141722';
          ctx.fillRect(x, 120, 44, FLOOR_Y - 120);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, 120, 44, FLOOR_Y - 120);
          // Đại kỳ chiến trường rách tung bay
          const bx = x + 65;
          ctx.fillStyle = i % 2 === 0 ? '#450a0a' : '#0f172a';
          ctx.beginPath();
          ctx.moveTo(bx, 135);
          ctx.lineTo(bx + 76, 150);
          ctx.lineTo(bx + 64, 320);
          ctx.lineTo(bx + 32, 285);
          ctx.lineTo(bx, 335);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = i % 2 === 0 ? '#ef4444' : '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        // Tường kỹ thuật chuyên biệt cho Màn 5 (Đường ngầm), Màn 6 (Bến cảng), Màn 7 (Trạm trung chuyển)
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 470 - cx * par, w + 700) - 160;
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x, 128, 300, 10);
          ctx.fillStyle = '#141821'; ctx.fillRect(x + 30, 138, 14, FLOOR_Y - 138);
          ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x + 33, 138, 3, FLOOR_Y - 138);
          const on = (Math.sin(cx * 0.01 + i * 2.1) > -0.3);
          const lightCol = id === 5 ? 'rgba(239,68,68,0.9)' : (id === 6 ? 'rgba(52,211,153,0.9)' : 'rgba(56,189,248,0.9)');
          ctx.fillStyle = on ? lightCol : 'rgba(90,90,110,0.6)';
          ctx.beginPath(); ctx.arc(x + 150, 158, 9, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 144, 138, 12, 14);
          ctx.fillStyle = 'rgba(220,230,245,0.5)'; ctx.font = '700 13px Montserrat, sans-serif';
          const prefix = id === 5 ? 'HẦM NGẦM B-' : (id === 6 ? 'CẦU CẢNG C-' : 'TRẠM DỮ LIỆU S-');
          ctx.fillText(prefix + (i + 1), x + 175, 172);
        }
        for (let i = 0; i < 3; i++) {
          const x = mod(i * 620 - cx * par + 240, w + 800) - 180;
          ctx.fillStyle = '#0d1016'; ctx.fillRect(x, 250, 108, 260);
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3; ctx.strokeRect(x, 250, 108, 260);
          ctx.fillStyle = id === 5 ? 'rgba(248,113,113,0.65)' : 'rgba(120,220,160,0.6)';
          ctx.fillRect(x + 78, 366, 16, 34);
        }
      }
    },

    hazard(ctx, x, y, w, h) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = '#d4a017'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#111';
      for (let i = -h; i < w + h; i += h * 2) {
        ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.lineTo(x + i + h * 2, y); ctx.lineTo(x + i + h, y + h); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },

    // ---------------------------------------------------------------- PROPS (tọa độ thế giới, parallax 1.0)
    props(ctx, id, w, h, cx, t) {
      const draw = (wx, fn) => { const sx = wx - cx; if (sx > -260 && sx < w + 260) fn(sx); };
      if (id === 1) {
        // Biển neon (parallax 0.6)
        const signs = [['HẺM MƯA ĐỎ', '#ff2a4b'], ['VÕ ĐƯỜNG', '#00d2ff'], ['QUÁN ĐÊM', '#ff9f1c'], ['KHO 07', '#c77dff']];
        signs.forEach(([txt, col], i) => {
          const sx = mod(i * 520 - cx * 0.6 + 140, w + 800) - 220;
          const flick = 0.85 + 0.15 * Math.sin(t * 9 + i * 2) * (Math.sin(t * 1.3 + i) > 0.7 ? 1 : 0.2);
          ctx.save();
          ctx.font = '900 22px Cinzel, Montserrat, sans-serif';
          ctx.fillStyle = col; ctx.globalAlpha = flick;
          ctx.shadowColor = col; ctx.shadowBlur = 22;
          ctx.fillText(txt, sx, 205);
          ctx.restore();
          glow(ctx, sx + 60, 200, 130, col.replace('#', 'rgba(').length ? this.hexToRgbaTpl(col) : 'rgba(255,255,255,A)', 0.2 * flick);
        });
        // Thùng carton & thùng phuy
        [420, 1150, 1980].forEach((wx) => draw(wx, (sx) => {
          ctx.fillStyle = '#3a2a1c'; ctx.fillRect(sx, 462, 76, 56);
          ctx.strokeStyle = '#1c130b'; ctx.lineWidth = 2; ctx.strokeRect(sx, 462, 76, 56);
          ctx.beginPath(); ctx.moveTo(sx, 480); ctx.lineTo(sx + 76, 480); ctx.moveTo(sx + 38, 462); ctx.lineTo(sx + 38, 518); ctx.stroke();
          ctx.fillStyle = '#26303a'; ctx.fillRect(sx + 90, 452, 44, 66);
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sx + 94, 452, 6, 66);
          ctx.fillStyle = '#c1121f'; ctx.fillRect(sx + 90, 476, 44, 6);
        }));
      } else if (id === 2) {
        // Cụm container xếp tầng (parallax 0.8)
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 420 - cx * 0.8, w + 700) - 200;
          const cols = [['#8b2635', '#5d1a25'], ['#1f4e79', '#14334f'], ['#c27c0e', '#85550a']][i % 3];
          for (let lv = 0; lv < 2; lv++) {
            const y = 395 - lv * 92;
            ctx.fillStyle = cols[lv ? 1 : 0]; ctx.fillRect(x, y, 230, 88);
            ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
            for (let r = x + 14; r < x + 230; r += 14) { ctx.beginPath(); ctx.moveTo(r, y + 4); ctx.lineTo(r, y + 84); ctx.stroke(); }
            ctx.strokeRect(x, y, 230, 88);
          }
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '700 11px Montserrat, sans-serif'; ctx.fillText('VNM-' + (3140 + i * 77), x + 12, 412);
        }
      } else if (id === 5) {
        // CỬA THOÁT của nhiệm vụ chạy trốn (tọa độ 2380)
        const sx = 2380 - cx;
        if (sx > -300 && sx < w + 300) {
          const pulse = 0.6 + 0.4 * Math.sin(t * 5);
          ctx.fillStyle = '#0c1a12'; ctx.fillRect(sx - 74, 250, 148, 262);
          ctx.strokeStyle = `rgba(74,222,128,${pulse})`; ctx.lineWidth = 5;
          ctx.strokeRect(sx - 74, 250, 148, 262);
          // Nền sáng phía sau khung cửa
          const eg = ctx.createLinearGradient(sx, 260, sx, 510);
          eg.addColorStop(0, `rgba(74,222,128,${0.35 * pulse})`); eg.addColorStop(1, 'rgba(10,40,25,0.1)');
          ctx.fillStyle = eg; ctx.fillRect(sx - 66, 258, 132, 246);
          ctx.save();
          ctx.font = '900 20px Cinzel, Montserrat, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#4ade80'; ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 16;
          ctx.fillText('CỬA THOÁT', sx, 232);
          ctx.restore();
          // Vệt chỉ đường
          ctx.fillStyle = `rgba(74,222,128,${0.25 + 0.3 * pulse})`;
          for (let i = 0; i < 5; i++) {
            const ax = sx - 260 + i * 52;
            ctx.beginPath();
            ctx.moveTo(ax, 500); ctx.lineTo(ax + 26, 492); ctx.lineTo(ax + 26, 508); ctx.closePath(); ctx.fill();
          }
        }
        // Thùng hàng bỏ rơi dọc đường hầm
        [520, 1180, 1760].forEach((wx) => draw(wx, (p) => {
          ctx.fillStyle = '#33262a'; ctx.fillRect(p, 458, 74, 60);
          ctx.strokeStyle = '#140f11'; ctx.lineWidth = 2; ctx.strokeRect(p, 458, 74, 60);
          ctx.fillStyle = 'rgba(255,70,70,0.7)'; ctx.fillRect(p + 12, 474, 30, 7);
        }));
      } else if (id === 6) {
        // Cẩu container & phao bến
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 560 - cx * 0.85, w + 700) - 200;
          ctx.fillStyle = '#132320'; ctx.fillRect(x, 360, 210, 150);
          ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(x, 360, 210, 150);
          ctx.strokeStyle = 'rgba(74,222,128,0.55)'; ctx.lineWidth = 2;
          for (let r = x + 16; r < x + 210; r += 18) { ctx.beginPath(); ctx.moveTo(r, 366); ctx.lineTo(r, 504); ctx.stroke(); }
        }
        // Xích & móc treo
        ctx.strokeStyle = 'rgba(160,170,180,0.4)'; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const x = mod(i * 700 - cx * 0.7 + 120, w + 900) - 220;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18, 250); ctx.stroke();
          ctx.beginPath(); ctx.arc(x + 18, 264, 14, 0, 7); ctx.stroke();
        }
      } else if (id === 7) {
        // Rào chắn trạm & đèn kiểm soát
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 470 - cx * 0.8 + 60, w + 640) - 160;
          this.hazard(ctx, x, 470, 150, 16);
          ctx.fillStyle = '#10151f'; ctx.fillRect(x, 486, 150, 24);
          ctx.fillStyle = i % 2 ? 'rgba(0,210,255,0.9)' : 'rgba(255,80,80,0.75)';
          ctx.beginPath(); ctx.arc(x + 75, 448, 9, 0, 7); ctx.fill();
          ctx.fillStyle = '#0b0e14'; ctx.fillRect(x + 68, 457, 14, 14);
        }
        // Màn hình dữ liệu treo tường
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 540 - cx * 0.6 + 200, w + 700) - 180;
          ctx.fillStyle = '#05070c'; ctx.fillRect(x, 150, 132, 84);
          ctx.strokeStyle = 'rgba(0,210,255,0.55)'; ctx.lineWidth = 2; ctx.strokeRect(x, 150, 132, 84);
          ctx.fillStyle = 'rgba(0,210,255,0.75)';
          for (let r = 0; r < 5; r++) ctx.fillRect(x + 10, 162 + r * 13, 30 + ((i * 17 + r * 23) % 80), 5);
        }
      } else if (id === 8) {
        // Đá núi, mỏm đá & cọc ranh giới
        [380, 980, 1580, 2180].forEach((wx, i) => draw(wx, (p) => {
          ctx.fillStyle = '#1b262e';
          ctx.beginPath();
          ctx.moveTo(p - 54, 510); ctx.lineTo(p - 16, 510 - (60 + i * 18)); ctx.lineTo(p + 30, 510 - (34 + i * 10)); ctx.lineTo(p + 62, 510);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(125,211,252,0.25)'; ctx.lineWidth = 2; ctx.stroke();
        }));
        // Cọc ranh giới có dây xích
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 610 - cx * 0.9 + 90, w + 800) - 200;
          ctx.fillStyle = '#43331c'; ctx.fillRect(x, 380, 12, 130);
          ctx.fillStyle = '#d4a017'; ctx.fillRect(x - 3, 372, 18, 12);
          ctx.strokeStyle = 'rgba(212,160,23,0.55)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x + 12, 400); ctx.quadraticCurveTo(x + 70, 448, x + 128, 400); ctx.stroke();
        }
      } else if (id === 9 || id === 10) {
        // Lồng đèn triều phục & hàng cột nghi lễ
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 500 - cx * 0.7 + 140, w + 700) - 170;
          const sway = Math.sin(t * 1.4 + i) * 4;
          ctx.strokeStyle = 'rgba(212,160,23,0.6)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x + sway, 168); ctx.stroke();
          ctx.fillStyle = '#8f1d22';
          ctx.beginPath(); ctx.ellipse(x + sway, 194, 24, 30, 0, 0, 7); ctx.fill();
          ctx.fillStyle = `rgba(255,215,100,${0.55 + 0.3 * Math.sin(t * 4 + i)})`;
          ctx.beginPath(); ctx.ellipse(x + sway, 194, 12, 18, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#d4a017'; ctx.fillRect(x + sway - 3, 166, 6, 8);
        }
        // Rương & bệ thờ
        [640, 1460, 2260].forEach((wx) => draw(wx, (p) => {
          ctx.fillStyle = '#23190c'; ctx.fillRect(p, 456, 96, 62);
          ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 3; ctx.strokeRect(p, 456, 96, 62);
          ctx.fillStyle = 'rgba(255,215,0,0.7)'; ctx.fillRect(p + 38, 478, 20, 16);
        }));
      } else if (id === 11) {
        // Đá đứng trên Đoạn Nghĩa Đài + tro tàn bay
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 540 - cx * 0.85 + 180, w + 720) - 180;
          ctx.fillStyle = '#171a22';
          ctx.beginPath();
          ctx.moveTo(x, 510); ctx.lineTo(x + 6, 330 - (i % 3) * 34); ctx.lineTo(x + 34, 322 - (i % 3) * 34); ctx.lineTo(x + 40, 510);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(125,211,252,0.18)'; ctx.lineWidth = 2; ctx.stroke();
        }
        // Bia đá khắc tên
        const mx = 2260 - cx;
        if (mx > -240 && mx < w + 240) {
          ctx.fillStyle = '#1d2029'; ctx.fillRect(mx - 46, 320, 92, 190);
          ctx.strokeStyle = 'rgba(200,215,235,0.5)'; ctx.lineWidth = 3; ctx.strokeRect(mx - 46, 320, 92, 190);
          ctx.fillStyle = 'rgba(220,230,245,0.75)'; ctx.font = '800 15px Cinzel, Montserrat, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ĐOẠN', mx, 372); ctx.fillText('NGHĨA', mx, 394); ctx.fillText('ĐÀI', mx, 416);
          ctx.textAlign = 'start';
        }
      }
    },

    hexToRgbaTpl(hex) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},A)`;
    },

    // ---------------------------------------------------------------- FLOOR
    floor(ctx, id, w, h, cx, t) {
      const pal = {
        1: ['#1b1d27', '#07080d'], 2: ['#242a36', '#0a0d13'], 3: ['#241d20', '#080607'], 4: ['#2a2218', '#0a0805'],
        5: ['#1a1418', '#060405'], 6: ['#12211c', '#050b09'], 7: ['#1b2230', '#070a10'],
        8: ['#1c2a33', '#070d12'], 9: ['#2a231a', '#0a0806'], 10: ['#2a2218', '#0a0805'], 11: ['#1a1b22', '#06070a']
      }[id] || ['#1b1d27', '#07080d'];
      const g = ctx.createLinearGradient(0, FLOOR_Y, 0, h);
      g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
      ctx.fillStyle = g; ctx.fillRect(0, FLOOR_Y, w, h - FLOOR_Y);

      // Mép sàn sáng
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, FLOOR_Y, w, 3);

      // Đường phối cảnh
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      for (let x = -mod(cx, 90) - 90; x < w + 90; x += 90) {
        ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - 70 + (x - w / 2) * 0.25, h); ctx.stroke();
      }
      for (let i = 1; i < 5; i++) {
        const y = FLOOR_Y + Math.pow(i / 5, 1.6) * (h - FLOOR_Y);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      if (id === 1) {
        // Vũng nước phản chiếu neon
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 330 - cx, w + 500) - 150;
          const y = 575 + (i % 3) * 32;
          const pg = ctx.createRadialGradient(x, y, 4, x, y, 90);
          pg.addColorStop(0, i % 2 ? 'rgba(0,210,255,0.28)' : 'rgba(255,42,75,0.28)');
          pg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(x, y, 100, 18, 0, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.ellipse(x - 14, y - 3, 34, 3.5, 0, 0, 7); ctx.fill();
        }
      } else if (id === 2) {
        ctx.fillStyle = 'rgba(212,160,23,0.55)'; // vạch an toàn vàng
        for (let x = -mod(cx, 120); x < w; x += 120) ctx.fillRect(x, 548, 70, 5);
      } else if (id === 3) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let x = -mod(cx, 36); x < w; x += 36) { ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - 28, h); ctx.stroke(); }
      } else if (id === 5) {
        // Màn 5 (Đường Ngầm): Rãnh thoát nước sắt & vạch sơn phản quang khẩn cấp
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 522, w, 18);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        for (let x = -mod(cx, 24); x < w; x += 24) {
          ctx.beginPath(); ctx.moveTo(x, 522); ctx.lineTo(x, 540); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        for (let x = -mod(cx, 140); x < w; x += 140) ctx.fillRect(x, 560, 80, 4);
      } else if (id === 6) {
        // Màn 6 (Bến Cảng Đêm): Mép cầu cảng gỗ/thép + phản chiếu mặt nước xanh ngọc
        ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
        ctx.fillRect(0, FLOOR_Y, w, 14);
        this.hazard(ctx, -mod(cx, 64), FLOOR_Y + 12, w + 64, 7);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        for (let x = -mod(cx, 80); x < w; x += 80) {
          ctx.beginPath(); ctx.moveTo(x, FLOOR_Y + 20); ctx.lineTo(x - 35, h); ctx.stroke();
        }
      } else if (id === 7) {
        // Màn 7 (Trạm Dữ Liệu Ngầm): Sàn kim loại có đường mạch phát sáng xanh cyan
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 545); ctx.lineTo(w, 545);
        ctx.moveTo(0, 655); ctx.lineTo(w, 655);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 210, 255, 0.35)';
        for (let x = -mod(cx, 160); x < w; x += 160) {
          ctx.fillRect(x, 542, 36, 6);
          ctx.fillRect(x + 60, 652, 36, 6);
        }
      } else if (id === 8) {
        // Màn 8 (Thập Vạn Đại Sơn): Đường đá núi cổ kính & rêu phong sơn đạo
        for (let i = 0; i < 7; i++) {
          const x = mod(i * 220 - cx, w + 320) - 120;
          const y = 545 + (i % 3) * 38;
          ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
          ctx.beginPath(); ctx.ellipse(x, y, 68, 16, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.12)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else if (id === 11) {
        // Màn 11 (Đoạn Nghĩa Đài): Sàn đá cổ quyết chiến trên đỉnh vực dưới ánh trăng máu
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.24)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 536); ctx.lineTo(w, 536);
        ctx.moveTo(0, 672); ctx.lineTo(w, 672);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const x = mod(i * 260 - cx, w + 360) - 120;
          const y = 585 + (i % 2) * 34;
          const pg = ctx.createRadialGradient(x, y, 4, x, y, 85);
          pg.addColorStop(0, 'rgba(220, 38, 38, 0.22)');
          pg.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.ellipse(x, y, 90, 18, 0, 0, 7); ctx.fill();
        }
      } else {
        // Đại điện Gia tộc (Màn 4, 9, 10): Thảm đỏ viền hoàng kim uy nghiêm
        const rg = ctx.createLinearGradient(0, 535, 0, h);
        rg.addColorStop(0, '#5a0d17'); rg.addColorStop(1, '#2a050b');
        ctx.fillStyle = rg; ctx.fillRect(0, 535, w, h - 535);
        ctx.fillStyle = '#d4a017'; ctx.fillRect(0, 535, w, 3); ctx.fillRect(0, 680, w, 3);
      }
    },

    // ---------------------------------------------------------------- LIGHTS (additive)
    lights(ctx, id, w, h, cx, t) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (id === 1) {
        for (let i = 0; i < 3; i++) {
          const x = mod(i * 620 - cx * 0.9 + 200, w + 800) - 200;
          this.cone(ctx, x, 120, 120, 'rgba(255,200,120,A)', 0.2);
        }
      } else if (id === 2) {
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 380 - cx * 0.7 + 100, w + 600) - 150;
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 70); ctx.stroke();
          ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.moveTo(x - 26, 86); ctx.lineTo(x - 12, 66); ctx.lineTo(x + 12, 66); ctx.lineTo(x + 26, 86); ctx.closePath(); ctx.fill();
          this.cone(ctx, x, 86, 150, 'rgba(255,235,190,A)', 0.22);
        }
      } else if (id === 3) {
        for (let i = 0; i < 6; i++) {
          const x = mod(i * 300 - cx * 0.6 + 60, w + 500) - 100;
          const pulse = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.3);
          glow(ctx, x, 120, 110, 'rgba(255,30,70,A)', 0.12 + 0.3 * pulse);
          ctx.fillStyle = `rgba(255,60,90,${0.4 + 0.5 * pulse})`; ctx.fillRect(x - 9, 112, 18, 12);
        }
      } else {
        for (let i = 0; i < 3; i++) {
          const x = mod(i * 520 - cx * 0.6 + 120, w + 700) - 150;
          glow(ctx, x, 80, 200, 'rgba(255,210,100,A)', 0.2);
          ctx.fillStyle = 'rgba(255,225,140,0.85)';
          for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(x + k * 16, 78 + Math.abs(k) * 6, 3.4, 0, 7); ctx.fill(); }
        }
      }
      ctx.restore();

      // Sương thấp
      const fg = ctx.createLinearGradient(0, 420, 0, FLOOR_Y + 40);
      const col = id === 1 ? '120,120,170' : id === 4 ? '200,170,90' : '130,140,170';
      fg.addColorStop(0, `rgba(${col},0)`); fg.addColorStop(1, `rgba(${col},0.16)`);
      ctx.fillStyle = fg; ctx.fillRect(0, 420, w, 130);
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = `rgb(${col})`;
      for (let i = 0; i < 4; i++) {
        const x = mod(i * 400 + t * 22 - cx * 0.5, w + 600) - 300;
        ctx.beginPath(); ctx.ellipse(x, 520 + (i % 2) * 20, 260, 26, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
    },

    cone(ctx, x, y, spread, color, a) {
      const g = ctx.createLinearGradient(0, y, 0, FLOOR_Y + 60);
      g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y); ctx.lineTo(x + spread, FLOOR_Y + 60); ctx.lineTo(x - spread, FLOOR_Y + 60); ctx.closePath(); ctx.fill();
    },

    // ---------------------------------------------------------------- HOSTAGE (Màn 4)
    hostage(ctx, sm, camera) {
      if (!sm.hostage) {
        sm.hostage = { type: 'npc_huavudai', x: 2430, y: 560, z: 0, vx: 0, facing: -1, state: 'captive', animTime: 0, stateTimer: 0, stateDuration: 0, renderScale: 1.3, invincibleTimer: 0 };
      }
      const hs = sm.hostage;
      hs.animTime = performance.now() / 1000;
      const sx = hs.x - camera.x, sy = hs.y - camera.y;
      if (sx < -200 || sx > 1500) return;
      // Ghế + người bị trói
      ctx.fillStyle = '#1a1a22'; ctx.fillRect(sx - 20, sy - 36, 40, 8);
      window.skeletalRenderer.render(ctx, hs, camera);
      // Lồng sắt
      ctx.save();
      ctx.strokeStyle = 'rgba(200,210,225,0.85)'; ctx.lineWidth = 3;
      for (let b = -64; b <= 64; b += 16) { ctx.beginPath(); ctx.moveTo(sx + b, sy - 168); ctx.lineTo(sx + b, sy + 16); ctx.stroke(); }
      ctx.lineWidth = 5;
      ctx.strokeRect(sx - 68, sy - 172, 136, 192);
      ctx.restore();
      // Nhãn VIP
      ctx.save();
      ctx.font = '800 13px Montserrat, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
      ctx.fillText('HỨA VŨ ĐẠI', sx, sy - 186);
      ctx.restore();
    },

    // ---------------------------------------------------------------- VÕ ĐƯỜNG VOVINAM (Luyện võ & Khảo hạch)
    dojo(ctx, width, height, cx) {
      const w = width, h = height;
      const t = performance.now() / 1000;
      ctx.save();

      // 1. Tường gỗ võ đường truyền thống (Warm cedar panels)
      const gradWall = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
      gradWall.addColorStop(0, '#0a0f1d');
      gradWall.addColorStop(0.4, '#172238');
      gradWall.addColorStop(1, '#111827');
      ctx.fillStyle = gradWall;
      ctx.fillRect(0, 0, w, FLOOR_Y);

      // Cột đỏ & nẹp gỗ sơn son thếp vàng
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
      ctx.lineWidth = 4;
      for (let x = - (cx * 0.4 % 180); x < w + 200; x += 180) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, FLOOR_Y);
        ctx.stroke();

        // Đèn lồng treo tường phát sáng
        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.beginPath();
        ctx.arc(x, 140, 22 + Math.sin(t * 3 + x) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x - 7, 128, 14, 24);
      }

      // Khung hoành phi gỗ sơn son thếp vàng trang trọng phía trên khám thờ (dưới thanh HUD)
      const dojoCenterX = Math.round(w / 2 - (cx - 100) * 0.25);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(dojoCenterX - 280, 88, 560, 42);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(dojoCenterX - 280, 86, 560, 3);
      ctx.fillRect(dojoCenterX - 280, 129, 560, 3);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.strokeRect(dojoCenterX - 276, 90, 552, 38);

      // Hoành phi đại tự trung tâm: VIỆT VÕ ĐẠO — CƯƠNG NHU PHỐI TRIỂN
      ctx.font = '900 17px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
      ctx.shadowBlur = 12;
      ctx.fillText('🥋 VÕ ĐƯỜNG VIỆT VÕ ĐẠO — CƯƠNG NHU PHỐI TRIỂN 🥋', dojoCenterX, 115);
      ctx.shadowBlur = 0;

      // Hai câu đối biểu tượng Vovinam hai bên khám thờ
      ctx.font = '800 13px "Montserrat", sans-serif';
      // Trái: BÀN TAY THÉP
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(dojoCenterX - 340, 115, 32, 260);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(dojoCenterX - 340, 115, 32, 260);
      ctx.fillStyle = '#38bdf8';
      const textL = 'BÀNTAYTHÉP';
      for (let i = 0; i < textL.length; i++) {
        ctx.fillText(textL[i], dojoCenterX - 324, 145 + i * 22);
      }

      // Phải: TRÁI TIM TỪ ÁI
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(dojoCenterX + 310, 115, 32, 260);
      ctx.strokeRect(dojoCenterX + 310, 115, 32, 260);
      ctx.fillStyle = '#ffd700';
      const textR = 'TRÁITIMTỪÁI';
      for (let i = 0; i < textR.length; i++) {
        ctx.fillText(textR[i], dojoCenterX + 326, 145 + i * 22);
      }

      // Huy hiệu Vovinam trung tâm (Âm Dương Vovinam: Vàng - Xanh Dương)
      ctx.beginPath();
      ctx.arc(dojoCenterX, 220, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.font = '900 14px "Montserrat", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('VOVINAM', dojoCenterX, 215);
      ctx.font = '700 10px "Montserrat", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('VIỆT VÕ ĐẠO', dojoCenterX, 232);

      // Giá gác binh khí Vovinam (Đao, Côn) hai bên
      [-190, 190].forEach(off => {
        const rx = dojoCenterX + off;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(rx - 4, 280, 8, 180);
        ctx.fillRect(rx - 25, 320, 50, 6);
        ctx.fillRect(rx - 25, 370, 50, 6);
        ctx.fillRect(rx - 25, 420, 50, 6);
        // Côn gỗ / Kiếm
        ctx.fillStyle = '#d97706';
        ctx.fillRect(rx - 30, 314, 60, 4);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(rx - 35, 364, 70, 4);
      });

      // 2. Sàn gỗ võ đường sáng bóng (Polished Tatami Dojo Floor)
      const gradFloor = ctx.createLinearGradient(0, FLOOR_Y, 0, h);
      gradFloor.addColorStop(0, '#593219');
      gradFloor.addColorStop(0.3, '#78350f');
      gradFloor.addColorStop(1, '#451a03');
      ctx.fillStyle = gradFloor;
      ctx.fillRect(0, FLOOR_Y, w, h - FLOOR_Y);

      // Vạch thảm tập võ Vovinam (Võ đài hình vuông viền xanh dương)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 4;
      ctx.strokeRect(100 - cx, FLOOR_Y + 15, 1200, 160);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(180 - cx, FLOOR_Y + 35, 1040, 120);

      // Vân gỗ sàn phản chiếu ánh đèn
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.lineWidth = 1;
      for (let y = FLOOR_Y; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.restore();
    }
  };

  const TargetStageManager = (typeof StageManager !== 'undefined') ? StageManager : (window.StageManager || (window.stageManager && window.stageManager.constructor));

  TargetStageManager.prototype.renderBackground = function (ctx, camera, width, height) {
    if (window.game && (window.game.state === 'TRAINING' || (window.tutorialManager && window.tutorialManager.isActive && !window.tutorialManager.isIngame))) {
      SCN.dojo(ctx, width, height, camera.x);
      return;
    }
    const stage = this.getCurrentStage();
    const t = performance.now() / 1000;
    ctx.save();
    SCN.sky(ctx, stage.id, width, height, camera.x);
    SCN.wall(ctx, stage.id, width, height, camera.x);
    SCN.props(ctx, stage.id, width, height, camera.x, t);
    SCN.floor(ctx, stage.id, width, height, camera.x, t);
    if (stage.id === 4) SCN.hostage(ctx, this, camera);
    SCN.lights(ctx, stage.id, width, height, camera.x, t);
    ctx.restore();
  };

  // Lớp Tiền Cảnh Điện Ảnh 2.5D (Foreground Parallax 1.28x + Stage Atmospheric Vignette)
  TargetStageManager.prototype.renderForeground = function (ctx, camera, width, height) {
    if (window.game && (window.game.state === 'TRAINING' || (window.tutorialManager && window.tutorialManager.isActive && !window.tutorialManager.isIngame))) {
      return;
    }
    const stage = this.getCurrentStage();
    const id = stage ? stage.id : 1;
    const cx = camera ? camera.x : 0;
    const t = performance.now() / 1000;

    ctx.save();

    // 1. Các vật thể tiền cảnh mờ lướt qua trước ống kính (Parallax 1.28x)
    const fgPar = 1.28;
    for (let i = 0; i < 3; i++) {
      const fx = mod(i * 920 - cx * fgPar + 340, width + 1100) - 260;
      if (id === 8 || id === 11) {
        // Cành trúc / mỏm đá tiền cảnh mờ
        ctx.fillStyle = 'rgba(4, 9, 16, 0.55)';
        ctx.fillRect(fx, 0, 26, 180);
        ctx.beginPath();
        ctx.moveTo(fx, height);
        ctx.lineTo(fx + 42, height - 75);
        ctx.lineTo(fx + 95, height);
        ctx.closePath();
        ctx.fill();
      } else {
        // Bóng cột tiền cảnh / cáp treo phía trên & bóng lan can sát đáy màn hình
        ctx.fillStyle = 'rgba(3, 6, 14, 0.48)';
        ctx.fillRect(fx, 0, 38, 115);
        ctx.fillRect(fx - 12, height - 42, 62, 42);
      }
    }

    // 2. Sương mù / khói bụi tiền cảnh trôi nhẹ sát mặt đất (Parallax 1.35x)
    ctx.globalAlpha = 0.08;
    const mistCol = id === 11 ? '#ef4444' : (id === 8 ? '#38bdf8' : (id === 4 || id === 9 || id === 10 ? '#f59e0b' : '#94a3b8'));
    ctx.fillStyle = mistCol;
    for (let i = 0; i < 3; i++) {
      const mx = mod(i * 540 + t * 28 - cx * 1.35, width + 700) - 250;
      ctx.beginPath();
      ctx.ellipse(mx, height - 24, 240, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Viền tối ống kính điện ảnh nhẹ (Subtle Cinema Vignette)
    ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.36, width * 0.5, height * 0.5, width * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(2, 5, 12, 0.34)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  };
})();
