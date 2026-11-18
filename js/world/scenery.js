/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/world/scenery.js - Hệ thống Bối Cảnh Parallax Đa Lớp Điện Ảnh AAA (Cinematic Stage Scenery).
 * 
 * Kiến trúc 7 lớp kết xuất:
 * 1. Sky & Distant Parallax (0.04x - 0.15x): Bầu trời đa sắc, trăng khổng lồ, đường chân trời thành phố, cần cẩu cảng, vách núi sương mờ.
 * 2. Midground Wall & Architecture (0.55x - 0.75x): Tường gạch rêu phong, dây điện chằng chịt đặc trưng Việt Nam, cục nóng điều hòa, ban công, dầm thép, cột đình cổ.
 * 3. Authentic Cultural Props (1.0x): Biển neon chữ Việt sắc nét (Hủ tiếu, Cơm tấm, Võ đường), xe máy Cub/Dream, xe đẩy vỉa hè, ghế nhựa, thùng phuy, mộc nhân Vovinam.
 * 4. Wet Floor & Specular Reflections (1.0x): Mặt đường nhựa ướt phản chiếu vệt neon, vũng nước mưa gợn sóng, nắp cống đô thị bốc khói hơi nước ấm.
 * 5. Volumetric Lighting (Additive): Đèn đường nón sáng vàng ấm, đèn neon tỏa quầng sáng, đèn lồng đung đưa.
 * 6. Atmospheric Weather & Particles: Mưa xiên gió, bọt nước bắn, tro tàn bay, đom đóm, sương mù là là mặt đất.
 * 7. Foreground Parallax & Vignette (1.28x): Cáp treo, cành cây, lan can lướt qua ống kính, viền tối điện ảnh.
 */

(function () {
  const FLOOR_Y = 510;
  const mod = (a, m) => ((a % m) + m) % m;
  const tileCache = {};

  // ==========================================================================
  // 0. CÁC HÀM TIỆN ÍCH TOÀN CỤC TRONG MODULE (Pure Static Helpers - No 'this')
  // ==========================================================================
  function hexToRgbaTpl(hex) {
    if (!hex || typeof hex !== 'string') return 'rgba(255,255,255,A)';
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return `rgba(${r},${g},${b},A)`;
    }
    const n = parseInt(clean, 16);
    if (isNaN(n)) return 'rgba(255,255,255,A)';
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},A)`;
  }

  function glow(ctx, x, y, r, color, a) {
    const colStr = (color && color.includes('A')) ? color : hexToRgbaTpl(color);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colStr.replace('A', a));
    g.addColorStop(1, colStr.replace('A', '0'));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function cone(ctx, x, y, spread, color, a) {
    const colStr = (color && color.includes('A')) ? color : hexToRgbaTpl(color);
    const g = ctx.createLinearGradient(0, y, 0, FLOOR_Y + 70);
    g.addColorStop(0, colStr.replace('A', a));
    g.addColorStop(1, colStr.replace('A', '0'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x + spread, FLOOR_Y + 70);
    ctx.lineTo(x - spread, FLOOR_Y + 70);
    ctx.closePath();
    ctx.fill();
  }

  function hazard(ctx, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.rect === 'function') {
      ctx.rect(x, y, w, h);
    } else {
      ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
    }
    ctx.clip();
    ctx.fillStyle = '#facc15'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#0f172a';
    for (let i = -h * 2; i < w + h * 2; i += h * 2) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.lineTo(x + i + h * 2, y); ctx.lineTo(x + i + h, y + h);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================================================
  // 1. TẠO TILE PATTERN ĐỘC QUYỀN (Cached Procedural Textures)
  // ==========================================================================
  function makeTile(kind) {
    if (tileCache[kind]) return tileCache[kind];
    const c = document.createElement('canvas');
    let g;

    if (kind === 'brick') {
      // Tường gạch hẻm phố cổ rêu phong, có vân gạch nứt và lớp trát rêu ẩm
      c.width = 80; c.height = 40; g = c.getContext('2d');
      g.fillStyle = '#22151b'; g.fillRect(0, 0, 80, 40);
      for (let r = 0; r < 2; r++) {
        const y = r * 20, off = r ? 20 : 0;
        for (let i = 0; i < 2; i++) {
          const x = off + i * 40;
          const tone = (r * 13 + i * 29) % 35;
          g.fillStyle = `rgb(${75 + tone}, ${32 + (tone * 0.4 | 0)}, ${38 + (tone * 0.3 | 0)})`;
          g.fillRect(x + 1, y + 1, 38, 18);
          // Mảng rêu xanh ẩm mốc ở góc gạch
          if ((r + i) % 2 === 0) {
            g.fillStyle = 'rgba(34, 75, 45, 0.45)';
            g.fillRect(x + 2, y + 13, 14, 5);
          }
        }
      }
      g.strokeStyle = 'rgba(10, 6, 10, 0.85)'; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, 0.5); g.lineTo(80, 0.5); g.moveTo(0, 20.5); g.lineTo(80, 20.5);
      g.moveTo(0.5, 0); g.lineTo(0.5, 20); g.moveTo(40.5, 0); g.lineTo(40.5, 20);
      g.moveTo(20.5, 20); g.lineTo(20.5, 40); g.moveTo(60.5, 20); g.lineTo(60.5, 40);
      g.stroke();

    } else if (kind === 'steel') {
      // Tấm thép dập gân kim loại công nghiệp (Industrial diamond plate)
      c.width = 48; c.height = 24; g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 48, 0);
      gr.addColorStop(0, '#151c28'); gr.addColorStop(0.5, '#2b394f'); gr.addColorStop(1, '#151c28');
      g.fillStyle = gr; g.fillRect(0, 0, 48, 24);
      g.strokeStyle = 'rgba(255, 255, 255, 0.15)'; g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(6, 12); g.lineTo(18, 6); g.moveTo(6, 12); g.lineTo(18, 18);
      g.moveTo(30, 12); g.lineTo(42, 6); g.moveTo(30, 12); g.lineTo(42, 18);
      g.stroke();
      g.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      g.strokeRect(0.5, 0.5, 47, 23);

    } else if (kind === 'concrete') {
      // Khối bê tông cốt thép đô thị rạn nứt
      c.width = 240; c.height = 120; g = c.getContext('2d');
      g.fillStyle = '#23252e'; g.fillRect(0, 0, 240, 120);
      for (let i = 0; i < 110; i++) {
        g.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.04})`;
        g.fillRect(Math.random() * 240, Math.random() * 120, 2 + Math.random() * 12, 1.5);
      }
      g.strokeStyle = 'rgba(10, 12, 18, 0.65)'; g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(40, 30); g.lineTo(65, 45); g.lineTo(85, 42); g.lineTo(110, 60);
      g.moveTo(170, 75); g.lineTo(195, 90); g.lineTo(210, 85);
      g.stroke();
      g.strokeStyle = 'rgba(0, 0, 0, 0.7)'; g.lineWidth = 3;
      g.strokeRect(1.5, 1.5, 237, 117);
      g.fillStyle = '#3a404d';
      [[10, 10], [230, 10], [10, 110], [230, 110]].forEach(([x, y]) => {
        g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
      });

    } else if (kind === 'rock') {
      // Đá núi tự nhiên Thập Vạn Đại Sơn / Đoạn Nghĩa Đài
      c.width = 180; c.height = 100; g = c.getContext('2d');
      g.fillStyle = '#1e2631'; g.fillRect(0, 0, 180, 100);
      for (let i = 0; i < 35; i++) {
        g.fillStyle = `rgba(${50 + (Math.random() * 50 | 0)}, ${65 + (Math.random() * 50 | 0)}, ${80 + (Math.random() * 50 | 0)}, 0.45)`;
        const x = Math.random() * 160, y = Math.random() * 90;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 20 + Math.random() * 25, y + Math.random() * 10);
        g.lineTo(x + 12 + Math.random() * 20, y + 16 + Math.random() * 10);
        g.closePath(); g.fill();
      }
      g.strokeStyle = 'rgba(0, 0, 0, 0.6)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, 0.5); g.lineTo(180, 0.5); g.moveTo(0.5, 0); g.lineTo(0.5, 100); g.stroke();

    } else if (kind === 'subway') {
      // Gạch men trắng bóng ga ngầm vát cạnh (Beveled subway tiles)
      c.width = 60; c.height = 30; g = c.getContext('2d');
      g.fillStyle = '#1e232d'; g.fillRect(0, 0, 60, 30);
      for (let r = 0; r < 2; r++) {
        const y = r * 15, off = r ? 15 : 0;
        for (let i = 0; i < 2; i++) {
          const x = off + i * 30;
          g.fillStyle = '#2f3847'; g.fillRect(x + 1, y + 1, 28, 13);
          g.fillStyle = 'rgba(255, 255, 255, 0.12)'; g.fillRect(x + 1, y + 1, 28, 2); g.fillRect(x + 1, y + 1, 2, 13);
          g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.fillRect(x + 1, y + 12, 28, 2); g.fillRect(x + 27, y + 1, 2, 13);
        }
      }
      g.strokeStyle = '#0f131a'; g.lineWidth = 1;
      g.strokeRect(0.5, 0.5, 59, 29);

    } else { // marble - Đá cẩm thạch đại sảnh hoàng gia họ Phó
      c.width = 160; c.height = 160; g = c.getContext('2d');
      g.fillStyle = '#231c15'; g.fillRect(0, 0, 160, 160);
      g.strokeStyle = 'rgba(245, 158, 11, 0.15)'; g.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        g.beginPath(); g.moveTo(Math.random() * 160, 0);
        g.bezierCurveTo(Math.random() * 160, 50, Math.random() * 160, 110, Math.random() * 160, 160);
        g.stroke();
      }
      g.strokeStyle = 'rgba(0, 0, 0, 0.55)'; g.lineWidth = 2.5; g.strokeRect(1, 1, 158, 158);
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

  // ==========================================================================
  // 2. KẾT XUẤT 7 LỚP BỐI CẢNH (SCN SYSTEM)
  // ==========================================================================
  const SCN = {
    hexToRgbaTpl,
    glow,
    cone,
    hazard,

    // ------------------------------------------------------------------------
    // 1. SKY & DISTANT HORIZON (BẦU TRỜI & ĐƯỜNG CHÂN TRỜI ĐÔ THỊ ĐA LỚP)
    // ------------------------------------------------------------------------
    sky(ctx, id, w, h, cx) {
      const p1 = cx * 0.05;

      // Gradient bầu trời theo phong cách cinematic
      const skyGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
      if (id === 1 || id === 7) {
        // Hẻm mưa đêm Sài Gòn: Xanh chàm đậm chuyển tím đen
        skyGrad.addColorStop(0, '#0a0d18');
        skyGrad.addColorStop(0.5, '#161b2e');
        skyGrad.addColorStop(1, '#231e2c');
      } else if (id === 2 || id === 5) {
        // Cảng thép & Ga ngầm: Xám thép công nghiệp
        skyGrad.addColorStop(0, '#06090f');
        skyGrad.addColorStop(0.6, '#131b26');
        skyGrad.addColorStop(1, '#1b2433');
      } else if (id === 4 || id === 9 || id === 10) {
        // Đại bản doanh họ Phó: Vàng hổ phách sẫm & đỏ rượu vương giả
        skyGrad.addColorStop(0, '#120b08');
        skyGrad.addColorStop(0.55, '#261612');
        skyGrad.addColorStop(1, '#3a1f18');
      } else if (id === 8) {
        // Đoạn Nghĩa Đài: Xanh ngọc lam u tịch trên đỉnh núi
        skyGrad.addColorStop(0, '#040b12');
        skyGrad.addColorStop(0.6, '#0d1f2d');
        skyGrad.addColorStop(1, '#142c3d');
      } else if (id === 11) {
        // Huyết Chiến Gia Tộc: Đỏ thẫm báo thù nghẹt thở
        skyGrad.addColorStop(0, '#1c0507');
        skyGrad.addColorStop(0.5, '#3b0a0e');
        skyGrad.addColorStop(1, '#571015');
      } else {
        skyGrad.addColorStop(0, '#080c14');
        skyGrad.addColorStop(0.6, '#141d2c');
        skyGrad.addColorStop(1, '#1f2a3c');
      }

      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, FLOOR_Y);

      // Ngôi sao lấp lánh ở tầng trời xa
      if (id === 1 || id === 7 || id === 8) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        for (let s = 0; s < 25; s++) {
          const sx = mod(s * 73 - p1 * 0.3, w);
          const sy = 25 + (s * 37) % 110;
          const sz = (s % 3 === 0) ? 1.5 : 1.0;
          ctx.fillRect(sx, sy, sz, sz);
        }
      }

      // Mặt trăng khổng lồ (Màn 8: Nguyệt Lạc, Màn 11: Huyết Nguyệt)
      if (id === 8 || id === 11) {
        const moonX = mod(880 - p1 * 0.2, w + 400) - 100;
        const moonY = 85;
        const moonCol = id === 11 ? '#ef4444' : '#e2e8f0';
        glow(ctx, moonX, moonY, 70, moonCol, 0.25);
        ctx.fillStyle = moonCol;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = id === 11 ? '#7f1d1d' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(moonX - 8, moonY - 6, 8, 0, Math.PI * 2);
        ctx.arc(moonX + 12, moonY + 8, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // Đường chân trời các tòa nhà chọc trời xa xăm (Skyline Parallax 0.08x)
      ctx.fillStyle = (id === 11) ? '#180709' : ((id === 4 || id === 10) ? '#18100c' : '#0c101a');
      const bCount = 18;
      for (let i = 0; i < bCount; i++) {
        const bx = mod(i * 120 - cx * 0.08, w + 240) - 120;
        const bw = 85;
        const bh = 140 + ((i * 47) % 120);
        ctx.fillRect(bx, FLOOR_Y - bh, bw, bh);

        // Đèn đỏ tín hiệu hàng không nhấp nháy trên đỉnh tháp
        if (i % 3 === 0) {
          const blink = Math.sin(performance.now() * 0.005 + i) > 0.3;
          ctx.fillStyle = blink ? '#ef4444' : '#551111';
          ctx.fillRect(bx + bw / 2 - 1.5, FLOOR_Y - bh - 8, 3, 8);
          ctx.beginPath(); ctx.arc(bx + bw / 2, FLOOR_Y - bh - 8, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = (id === 11) ? '#180709' : '#0c101a';
        }

        // Cửa sổ các tòa cao ốc sáng mờ
        ctx.fillStyle = (i % 2 === 0) ? 'rgba(254, 240, 138, 0.12)' : 'rgba(56, 189, 248, 0.12)';
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            if ((r + c + i) % 2 === 0) {
              ctx.fillRect(bx + 12 + c * 22, FLOOR_Y - bh + 20 + r * 26, 8, 12);
            }
          }
        }
        ctx.fillStyle = (id === 11) ? '#180709' : '#0c101a';
      }
    },

    // ------------------------------------------------------------------------
    // 2. MIDGROUND WALL & ARCHITECTURE (KIẾN TRÚC TƯỜNG, DÂY ĐIỆN, CỤC NÓNG)
    // ------------------------------------------------------------------------
    wall(ctx, id, w, h, cx) {
      const par = 0.60;
      const kindMap = {
        1: 'brick', 2: 'steel', 3: 'concrete', 4: 'marble', 5: 'subway',
        6: 'brick', 7: 'brick', 8: 'rock', 9: 'marble', 10: 'marble', 11: 'rock'
      };
      const kind = kindMap[id] || 'brick';

      // Phủ texture nền tường chính
      fillPattern(ctx, kind, par, cx, 140, FLOOR_Y - 140, w);

      // Gradient đổ bóng từ trần mái nhà xuống mặt đường
      const roofShadow = ctx.createLinearGradient(0, 140, 0, 260);
      roofShadow.addColorStop(0, 'rgba(3, 5, 10, 0.85)');
      roofShadow.addColorStop(1, 'rgba(3, 5, 10, 0)');
      ctx.fillStyle = roofShadow;
      ctx.fillRect(0, 140, w, 120);

      // Mái hiên / Gờ ban công bê tông chạy ngang tường
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 136, w, 8);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 142, w, 2);

      // --- MÀN 1: HẺM PHỐ SÀI GÒN / HÀ NỘI ĐẶC TRƯNG ---
      if (id === 1 || id === 7) {
        // Cửa sổ cổ điển chấn song sắt & Cục nóng điều hòa A/C
        for (let i = 0; i < 6; i++) {
          const x = mod(i * 380 - cx * par + 80, w + 500) - 120;

          // Khung cửa sổ gỗ có chấn song
          ctx.fillStyle = '#0a0d14'; ctx.fillRect(x, 195, 52, 70);
          ctx.strokeStyle = '#334155'; ctx.lineWidth = 3; ctx.strokeRect(x, 195, 52, 70);
          // Ánh đèn vàng ấm le lói qua rèm cửa sổ
          const lightOn = (i % 2 === 0);
          ctx.fillStyle = lightOn ? 'rgba(251, 191, 36, 0.22)' : 'rgba(15, 23, 42, 0.8)';
          ctx.fillRect(x + 3, 198, 46, 64);
          // Song cửa sổ
          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 26, 195); ctx.lineTo(x + 26, 265);
          ctx.moveTo(x, 230); ctx.lineTo(x + 52, 230);
          ctx.stroke();

          // Cục nóng máy lạnh A/C kim loại kèm quạt tản nhiệt
          const acX = x + 75;
          const acY = 230;
          ctx.fillStyle = '#cbd5e1'; ctx.fillRect(acX, acY, 44, 32);
          ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.strokeRect(acX, acY, 44, 32);
          // Lưới quạt tròn
          ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(acX + 16, acY + 16, 11, 0, Math.PI * 2); ctx.fill();
          // Cánh quạt quay nhẹ
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
          const aRot = (performance.now() / 1000) * 8 + i;
          ctx.beginPath();
          ctx.moveTo(acX + 16 - Math.cos(aRot) * 9, acY + 16 - Math.sin(aRot) * 9);
          ctx.lineTo(acX + 16 + Math.cos(aRot) * 9, acY + 16 + Math.sin(aRot) * 9);
          ctx.stroke();
          // Giá đỡ sắt chữ L dưới cục nóng
          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(acX + 4, acY + 32); ctx.lineTo(acX + 4, acY + 42); ctx.lineTo(acX + 18, acY + 32);
          ctx.moveTo(acX + 38, acY + 32); ctx.lineTo(acX + 38, acY + 42); ctx.lineTo(acX + 24, acY + 32);
          ctx.stroke();

          // Ống thoát nước mưa PVC Tiền Phong màu xám xanh
          ctx.fillStyle = '#1e293b'; ctx.fillRect(x + 148, 160, 10, FLOOR_Y - 160);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'; ctx.fillRect(x + 150, 160, 2.5, FLOOR_Y - 160);
          // Đai ôm ống kim loại
          ctx.fillStyle = '#475569';
          for (let py = 190; py < FLOOR_Y; py += 70) {
            ctx.fillRect(x + 146, py, 14, 4);
          }
        }

        // Dây điện & cáp viễn thông chằng chịt đặc trưng Việt Nam
        ctx.strokeStyle = '#05070d'; ctx.lineWidth = 2.2;
        for (let cable = 0; cable < 4; cable++) {
          const cy1 = 168 + cable * 14;
          const cy2 = 175 + cable * 16;
          ctx.beginPath();
          ctx.moveTo(0, cy1);
          for (let px = 0; px < w + 200; px += 220) {
            const sag = 28 + (cable * 6) % 18;
            ctx.quadraticCurveTo(px + 110, cy1 + sag, px + 220, cy2);
          }
          ctx.stroke();
        }

        // Hộp công tơ điện và cuộn dây cáp treo trên tường
        for (let i = 0; i < 4; i++) {
          const boxX = mod(i * 540 - cx * par + 180, w + 600) - 150;
          ctx.fillStyle = '#334155';
          ctx.fillRect(boxX, 290, 24, 34);
          ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.strokeRect(boxX, 290, 24, 34);
          ctx.fillStyle = '#ef4444'; ctx.fillRect(boxX + 5, 298, 4, 4);
          ctx.fillStyle = '#22c55e'; ctx.fillRect(boxX + 13, 298, 4, 4);
        }

      // --- MÀN 2: NHÀ KHO THÉP (DẦM CHỮ I, CỬA CUỐN CÔNG NGHIỆP, CẢNH BÁO NGUY HIỂM) ---
      } else if (id === 2) {
        [125, 345].forEach((y) => {
          const sg = ctx.createLinearGradient(0, y, 0, y + 26);
          sg.addColorStop(0, '#475569'); sg.addColorStop(0.5, '#1e293b'); sg.addColorStop(1, '#0f172a');
          ctx.fillStyle = sg; ctx.fillRect(0, y, w, 26);
          ctx.fillStyle = '#0f172a';
          for (let x = -mod(cx * par, 55); x < w + 60; x += 55) {
            ctx.beginPath(); ctx.arc(x, y + 13, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x - 1, y + 11, 2, 2); ctx.fillStyle = '#0f172a';
          }
        });

        for (let i = 0; i < 4; i++) {
          const x = mod(i * 520 - cx * par + 40, w + 700) - 150;
          ctx.fillStyle = '#1e2430'; ctx.fillRect(x, 185, 270, 325);
          ctx.strokeStyle = '#0b0f17'; ctx.lineWidth = 4; ctx.strokeRect(x, 185, 270, 325);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'; ctx.lineWidth = 1.5;
          for (let y = 195; y < FLOOR_Y; y += 12) {
            ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 266, y); ctx.stroke();
          }
          hazard(ctx, x - 15, 172, 300, 14);
        }

      // --- MÀN 3: BOONGKE NGẦM (ỐNG DẪN ÁP SUẤT, CÒI XOAY, CỬA THÉP NẶNG) ---
      } else if (id === 3) {
        [160, 240].forEach((y, idx) => {
          ctx.fillStyle = idx === 0 ? '#b91c1c' : '#0284c7';
          ctx.fillRect(0, y, w, 16);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'; ctx.fillRect(0, y + 2, w, 4);
          for (let x = -mod(cx * par, 120); x < w + 120; x += 120) {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(x - 4, y - 3, 8, 22);
          }
        });
        for (let i = 0; i < 4; i++) {
          const x = mod(i * 580 - cx * par, w + 750) - 160;
          ctx.fillStyle = '#1e1b24'; ctx.fillRect(x, 220, 130, 290);
          ctx.strokeStyle = '#050406'; ctx.lineWidth = 4; ctx.strokeRect(x, 220, 130, 290);
          hazard(ctx, x, 212, 130, 9);
          const beaconOn = (Math.sin(performance.now() * 0.006 + i * 1.5) > 0);
          ctx.fillStyle = beaconOn ? '#ef4444' : '#450a0a';
          ctx.beginPath(); ctx.arc(x + 65, 198, 8, 0, Math.PI * 2); ctx.fill();
        }

      // --- MÀN 4, 9, 10: ĐẠI ĐIỆN HOÀNG GIA / ĐỀN THỜ THƯỢNG VÕ ---
      } else if (id === 4 || id === 9 || id === 10) {
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 440 - cx * par, w + 650) - 140;
          const cg = ctx.createLinearGradient(x, 0, x + 64, 0);
          cg.addColorStop(0, '#1c0a0e'); cg.addColorStop(0.5, '#7f1d1d'); cg.addColorStop(1, '#1c0a0e');
          ctx.fillStyle = cg; ctx.fillRect(x, 85, 64, FLOOR_Y - 85);
          ctx.fillStyle = '#d4af37';
          ctx.fillRect(x - 8, 85, 80, 16); ctx.fillRect(x - 8, FLOOR_Y - 20, 80, 20);
          ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 8, 85, 80, 16); ctx.strokeRect(x - 8, FLOOR_Y - 20, 80, 20);

          const bx = x + 120;
          ctx.fillStyle = '#5c0b14'; ctx.beginPath();
          ctx.moveTo(bx, 115); ctx.lineTo(bx + 96, 115); ctx.lineTo(bx + 96, 335); ctx.lineTo(bx + 48, 305); ctx.lineTo(bx, 335);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.arc(bx + 48, 195, 26, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#facc15';
          ctx.font = '900 16px Cinzel, serif'; ctx.textAlign = 'center';
          ctx.fillText('VÕ', bx + 48, 202);
          ctx.textAlign = 'start';
        }

      // --- MÀN 6: VÕ ĐƯỜNG VOVINAM CỔ KÍNH ---
      } else if (id === 6) {
        for (let i = 0; i < 6; i++) {
          const x = mod(i * 360 - cx * par, w + 500) - 120;
          ctx.fillStyle = '#1e1610'; ctx.fillRect(x, 85, 24, FLOOR_Y - 85);
          ctx.fillStyle = '#b45309'; ctx.fillRect(x + 2, 85, 4, FLOOR_Y - 85);
          if (i % 2 === 0) {
            ctx.fillStyle = '#fef3c7'; ctx.fillRect(x + 85, 165, 80, 130);
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(x + 85, 165, 80, 130);
            ctx.fillStyle = '#1c1917'; ctx.font = '900 24px "Times New Roman", serif'; ctx.textAlign = 'center';
            ctx.fillText('ĐẠO', x + 125, 235);
            ctx.textAlign = 'start';
          }
        }
      }
    },

    // ------------------------------------------------------------------------
    // 3. AUTHENTIC PROPS & NEON STREET SIGNS (BIỂN NEON VIỆT NAM, XE MÁY, ĐẠO CỤ)
    // ------------------------------------------------------------------------
    props(ctx, id, w, h, cx, t) {
      const draw = (wx, fn) => {
        const sx = wx - cx;
        if (sx > -300 && sx < w + 300) fn(sx);
      };

      // --- MÀN 1: CON HẺM MƯA ĐỎ ---
      if (id === 1) {
        // Biển hiệu Neon chữ Việt (Đặt ở x: 580, 1280, 1980, 2680 để không đè lên HUD)
        const vnSigns = [
          { text: 'HỦ TIẾU GIA TRUYỀN', sub: 'MỞ CẢ ĐÊM', col: '#ff2a4b', x: 580 },
          { text: 'CƠM TẤM SƯỜN BÌ CHẢ', sub: 'ĐẶC SẢN SÀI GÒN', col: '#f59e0b', x: 1280 },
          { text: 'VÕ ĐƯỜNG VOVINAM', sub: 'VIỆT VÕ ĐẠO', col: '#00d2ff', x: 1980 },
          { text: 'TIỆM VÀNG KIM TÂN', sub: 'UY TÍN 30 NĂM', col: '#10b981', x: 2680 }
        ];

        vnSigns.forEach((s, i) => {
          const sx = mod(s.x - cx * 0.6, w + 1100) - 220;
          const flick = 0.88 + 0.12 * Math.sin(t * 8 + i * 2.3) * (Math.sin(t * 1.5 + i) > 0.65 ? 1 : 0.15);

          // Khung bảng hiệu sắt & dây điện câu vào bảng (Tọa độ Y=175-233 hoàn toàn thoáng)
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.fillRect(sx - 14, 175, 230, 58);
          ctx.strokeStyle = s.col; ctx.lineWidth = 2.5;
          ctx.strokeRect(sx - 14, 175, 230, 58);

          // Dây treo khung sắt
          ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx + 15, 175); ctx.lineTo(sx + 15, 135);
          ctx.moveTo(sx + 185, 175); ctx.lineTo(sx + 185, 135);
          ctx.stroke();

          // Chữ Neon chính
          ctx.font = '900 15px "Montserrat", sans-serif';
          ctx.fillStyle = s.col;
          ctx.globalAlpha = flick;
          ctx.shadowColor = s.col;
          ctx.shadowBlur = 18;
          ctx.fillText(s.text, sx + 6, 202);

          // Dòng chữ phụ nhỏ
          ctx.font = '700 9.5px "Montserrat", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.fillText(s.sub, sx + 32, 222);
          ctx.restore();

          // Quầng sáng Neon lan tỏa trên tường (Ambient Bloom)
          glow(ctx, sx + 100, 205, 140, hexToRgbaTpl(s.col), 0.22 * flick);
        });

        // Xe máy Honda Dream/Cub cũ dựng chân chống nghiêng bên tường
        [720, 1540, 2380].forEach((wx, i) => draw(wx, (sx) => {
          ctx.save();
          const colMoto = (i % 2 === 0) ? '#881337' : '#1e3a5f';
          // Bánh xe căm sắt
          ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(sx, 485, 16, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(sx + 52, 485, 16, 0, Math.PI * 2); ctx.stroke();
          // Căm xe
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx - 14, 485); ctx.lineTo(sx + 14, 485);
          ctx.moveTo(sx, 471); ctx.lineTo(sx, 499);
          ctx.moveTo(sx + 38, 485); ctx.lineTo(sx + 66, 485);
          ctx.stroke();
          // Khung sườn xe & yếm trắng
          ctx.fillStyle = colMoto; ctx.fillRect(sx + 14, 465, 26, 15);
          ctx.fillStyle = '#f8fafc'; ctx.fillRect(sx + 18, 455, 12, 22);
          // Yên xe đen
          ctx.fillStyle = '#020617'; ctx.fillRect(sx + 10, 458, 28, 7);
          // Ghi-đông & đèn pha tròn
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(sx + 40, 465); ctx.lineTo(sx + 44, 442); ctx.lineTo(sx + 48, 440); ctx.stroke();
          ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(sx + 48, 445, 4, 0, Math.PI * 2); ctx.fill();
          // Chân chống nghiêng
          ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(sx + 24, 480); ctx.lineTo(sx + 18, 508); ctx.stroke();
          ctx.restore();
        }));

        // Bàn ghế nhựa cóc vỉa hè & thùng xốp quán đêm
        [980, 1820].forEach((wx) => draw(wx, (sx) => {
          // Bàn nhựa đỏ
          ctx.fillStyle = '#dc2626'; ctx.fillRect(sx, 472, 34, 4);
          ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx + 4, 476); ctx.lineTo(sx + 2, 508);
          ctx.moveTo(sx + 30, 476); ctx.lineTo(sx + 32, 508);
          ctx.stroke();
          // 2 ghế nhựa con hai bên
          [-14, 38].forEach((off) => {
            ctx.fillStyle = '#2563eb'; ctx.fillRect(sx + off, 484, 14, 3);
            ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx + off + 2, 487); ctx.lineTo(sx + off + 1, 508);
            ctx.moveTo(sx + off + 12, 487); ctx.lineTo(sx + off + 13, 508);
            ctx.stroke();
          });
          // Ca trà đá vỉa hè
          ctx.fillStyle = '#fef08a'; ctx.fillRect(sx + 12, 464, 8, 8);
        }));

        // Xe đẩy hủ tiếu gõ / bánh mì inox
        draw(2280, (sx) => {
          ctx.fillStyle = '#94a3b8'; ctx.fillRect(sx, 440, 68, 62);
          ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.strokeRect(sx, 440, 68, 62);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fillRect(sx + 6, 444, 56, 26);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath(); ctx.arc(sx + 14, 504, 8, 0, Math.PI * 2); ctx.arc(sx + 54, 504, 8, 0, Math.PI * 2); ctx.fill();
        });

      // --- MÀN 6: VÕ ĐƯỜNG VOVINAM (MỘC NHÂN, GIÁ BINH KHÍ, TRỐNG TRẬN) ---
      } else if (id === 6) {
        [420, 1180, 1840].forEach((wx) => draw(wx, (sx) => {
          // Thân mộc nhân gỗ căm xe
          ctx.fillStyle = '#78350f'; ctx.fillRect(sx - 7, 340, 14, 168);
          ctx.fillStyle = '#92400e'; ctx.fillRect(sx - 5, 340, 4, 168);
          // Các tay đòn gỗ mộc nhân
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx - 28, 385, 24, 7); ctx.fillRect(sx + 4, 400, 24, 7);
          ctx.fillRect(sx - 24, 440, 22, 8);
          // Chân mộc nhân uốn cong
          ctx.strokeStyle = '#78350f'; ctx.lineWidth = 9;
          ctx.beginPath(); ctx.moveTo(sx, 465); ctx.lineTo(sx + 18, 490); ctx.lineTo(sx + 8, 508); ctx.stroke();
        }));

        [780, 1540].forEach((wx) => draw(wx, (sx) => {
          ctx.fillStyle = '#451a03'; ctx.fillRect(sx, 370, 75, 138);
          ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2; ctx.strokeRect(sx, 370, 75, 138);
          // Song luyện đao & côn nhị khúc gác trên giá
          ctx.fillStyle = '#cbd5e1'; ctx.fillRect(sx + 8, 385, 60, 4);
          ctx.fillStyle = '#e2e8f0'; ctx.fillRect(sx + 8, 415, 60, 4);
          ctx.fillStyle = '#d97706'; ctx.fillRect(sx + 8, 445, 60, 5);
        }));
      }
    },

    // ------------------------------------------------------------------------
    // 4. WET FLOOR & SPECULAR REFLECTIONS (MẶT ĐƯỜNG NHỰA ƯỚT & PHẢN CHIẾU NEON)
    // ------------------------------------------------------------------------
    floor(ctx, id, w, h, cx, t) {
      const palMap = {
        1: ['#283144', '#151926'], 
        2: ['#252d3d', '#141824'], 
        3: ['#272228', '#141116'],
        4: ['#2c241c', '#16110c'], 
        5: ['#201d24', '#100e12'], 
        6: ['#3a2417', '#1c1008'],
        7: ['#222a3a', '#111620'], 
        8: ['#243340', '#121b22'], 
        9: ['#2e251a', '#171109'],
        10: ['#2c241c', '#16110c'], 
        11: ['#222430', '#101118']
      };

      const pal = palMap[id] || palMap[1];
      const floorH = h - FLOOR_Y;

      // Nền sàn chính gradient sâu
      const fg = ctx.createLinearGradient(0, FLOOR_Y, 0, h);
      fg.addColorStop(0, pal[0]);
      fg.addColorStop(1, pal[1]);
      ctx.fillStyle = fg;
      ctx.fillRect(0, FLOOR_Y, w, floorH);

      // Gờ mép vỉa hè đá granit xám trắng có sọc phản quang
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, FLOOR_Y, w, 7);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(0, FLOOR_Y, w, 2);

      // Đường phối cảnh sàn 2.5D (Perspective Floor Tiles)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.lineWidth = 1;
      for (let x = -mod(cx, 85) - 85; x < w + 85; x += 85) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y);
        ctx.lineTo(x - 75 + (x - w / 2) * 0.28, h);
        ctx.stroke();
      }
      for (let i = 1; i <= 5; i++) {
        const y = FLOOR_Y + Math.pow(i / 5, 1.55) * floorH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Vạch kẻ đường phố phản quang mờ
      if (id === 1 || id === 7) {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([40, 35]);
        ctx.beginPath();
        ctx.moveTo(0, FLOOR_Y + 95);
        ctx.lineTo(w, FLOOR_Y + 95);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- MÀN 1: MẶT ĐƯỜNG ƯỚT MƯA PHẢN CHIẾU NEON & NẮP CỐNG BỐC HƠI ---
      if (id === 1) {
        // Vệt phản chiếu ánh neon nhòe thẳng đứng xuống mặt đường ướt (Specular Neon Sheens)
        const neonSources = [
          { x: 580, col: 'rgba(255, 42, 75, A)' },
          { x: 1280, col: 'rgba(245, 158, 11, A)' },
          { x: 1980, col: 'rgba(0, 210, 255, A)' },
          { x: 2680, col: 'rgba(16, 185, 129, A)' }
        ];

        neonSources.forEach((src) => {
          const sx = mod(src.x - cx * 0.6 + 80, w + 1100) - 150;
          const sheenG = ctx.createLinearGradient(sx, FLOOR_Y, sx, h);
          sheenG.addColorStop(0, src.col.replace('A', '0.22'));
          sheenG.addColorStop(0.5, src.col.replace('A', '0.08'));
          sheenG.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sheenG;
          ctx.fillRect(sx - 35, FLOOR_Y, 70, floorH);
        });

        // Vũng nước mưa đọng trên mặt đường có gợn sóng lan tỏa
        const puddles = [
          { x: 380, y: 555, rw: 75, rh: 16 },
          { x: 920, y: 615, rw: 110, rh: 22 },
          { x: 1480, y: 545, rw: 85, rh: 18 },
          { x: 2150, y: 625, rw: 125, rh: 24 }
        ];

        puddles.forEach((p, idx) => {
          const px = mod(p.x - cx + 150, w + 600) - 150;
          ctx.save();
          // Lòng vũng nước phản chiếu bầu trời
          ctx.fillStyle = 'rgba(0, 210, 255, 0.08)';
          ctx.beginPath(); ctx.ellipse(px, p.y, p.rw, p.rh, 0, 0, Math.PI * 2); ctx.fill();
          // Viền vũng nước
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'; ctx.lineWidth = 1.2; ctx.stroke();
          // Vòng sóng nước gợn lan tỏa
          const ripP = (t * 1.8 + idx * 0.7) % 1;
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 * (1 - ripP)})`;
          ctx.beginPath();
          ctx.ellipse(px, p.y, p.rw * 0.3 + ripP * p.rw * 0.65, p.rh * 0.3 + ripP * p.rh * 0.65, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });

        // Nắp cống thoát nước đô thị gang tròn bốc hơi nước ấm
        [680, 1740].forEach((wx, i) => {
          const sx = mod(wx - cx + 100, w + 700) - 100;
          const sy = 585 + i * 20;
          ctx.save();
          ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.ellipse(sx, sy, 32, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(sx, sy, 22, 6.5, 0, 0, Math.PI * 2);
          ctx.moveTo(sx - 26, sy); ctx.lineTo(sx + 26, sy);
          ctx.stroke();

          // Cụm hơi nước ấm bốc lên từ nắp cống
          ctx.fillStyle = 'rgba(226, 232, 240, 0.07)';
          for (let s = 0; s < 3; s++) {
            const stmP = (t * 0.6 + s * 0.33 + i) % 1;
            const steamX = sx + Math.sin(t * 2 + s) * 12;
            const steamY = sy - stmP * 65;
            const steamR = 12 + stmP * 24;
            ctx.beginPath(); ctx.arc(steamX, steamY, steamR, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        });

      // --- MÀN 6: SÀN GỖ VÕ ĐƯỜNG TRUYỀN THỐNG ---
      } else if (id === 6) {
        ctx.strokeStyle = '#1c1008'; ctx.lineWidth = 2;
        for (let x = -mod(cx, 110) - 110; x < w + 110; x += 110) {
          ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x, h); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
        ctx.fillRect(0, FLOOR_Y + 20, w, 6);
      }
    },

    // ------------------------------------------------------------------------
    // 5. VOLUMETRIC LIGHTING (ĐÈN ĐƯỜNG NÓN SÁNG, AMBIENT BLOOM)
    // ------------------------------------------------------------------------
    lights(ctx, id, w, h, cx, t) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      if (id === 1 || id === 7) {
        // Đèn đường cong đô thị chiếu luồng sáng vàng nón ấm xuống vỉa hè
        [320, 1080, 1860, 2580].forEach((wx) => {
          const sx = wx - cx;
          if (sx > -200 && sx < w + 200) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            // Cột đèn kim loại cong
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(sx, FLOOR_Y); ctx.lineTo(sx, 130);
            ctx.quadraticCurveTo(sx, 75, sx + 35, 78);
            ctx.stroke();
            // Chao đèn
            ctx.fillStyle = '#334155'; ctx.fillRect(sx + 24, 76, 22, 10);
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(sx + 35, 86, 6, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // Nón sáng hình nón chiếu xuống mặt đường
            cone(ctx, sx + 35, 88, 160, 'rgba(254, 240, 138, A)', 0.24);
          }
        });
      } else if (id === 4 || id === 9 || id === 10) {
        // Đèn lồng đỏ hoàng kim đung đưa
        for (let i = 0; i < 5; i++) {
          const x = mod(i * 380 - cx * 0.6 + 60, w + 500) - 100;
          cone(ctx, x, 75, 140, 'rgba(254, 215, 170, A)', 0.22);
        }
      }

      ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 6. VÕ ĐƯỜNG HUẤN LUYỆN CHÍNH THỐNG (DEDICATED VOVINAM TRAINING DOJO)
    // ------------------------------------------------------------------------
    dojo(ctx, width, height, cx) {
      const w = width, h = height;
      const t = performance.now() / 1000;
      ctx.save();

      // 1. Tường gỗ gụ/pơ-mu võ đường truyền thống
      const gradWall = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
      gradWall.addColorStop(0, '#0c1322');
      gradWall.addColorStop(0.35, '#1b253b');
      gradWall.addColorStop(1, '#111827');
      ctx.fillStyle = gradWall;
      ctx.fillRect(0, 0, w, FLOOR_Y);

      // Cột gỗ sơn son và nẹp tường trang nghiêm
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
      ctx.lineWidth = 4;
      for (let x = -mod(cx * 0.35, 180); x < w + 200; x += 180) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FLOOR_Y); ctx.stroke();
      }

      // Xà ngang gỗ trên đỉnh tường
      ctx.fillStyle = '#1c130b'; ctx.fillRect(0, 0, w, 28);
      ctx.fillStyle = '#b45309'; ctx.fillRect(0, 26, w, 3);

      // Đèn lồng lụa Hội An treo trên xà nhà tỏa sáng ấm áp
      for (let x = -mod(cx * 0.35 - 90, 180); x < w + 200; x += 180) {
        // Dây treo
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, 28); ctx.lineTo(x, 82); ctx.stroke();
        // Quả lồng đèn hình quả trám màu cam hổ phách
        const pulse = Math.sin(t * 3 + x) * 2;
        glow(ctx, x, 102, 38 + pulse, 'rgba(245, 158, 11, A)', 0.25);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.ellipse(x, 102, 14, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5; ctx.stroke();
        // Nan đèn lồng
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 82); ctx.lineTo(x, 122);
        ctx.stroke();
        // Tua rua đỏ buông thõng
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, 122); ctx.lineTo(x + Math.sin(t * 2 + x) * 2, 138); ctx.stroke();
      }

      // 2. KHUNG HOÀNH PHI CHÍNH ĐIỆN (Tọa độ X trung tâm theo góc nhìn)
      const dojoCenterX = Math.round(w / 2 - (cx - 100) * 0.20);

      // Hoành phi sơn son thếp vàng: VIỆT VÕ ĐẠO — CƯƠNG NHU PHỐI TRIỂN
      const plaqueW = 540;
      const plaqueH = 46;
      const plaqueX = dojoCenterX - plaqueW / 2;
      const plaqueY = 55;

      ctx.fillStyle = '#0f172a'; ctx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH);
      ctx.fillStyle = '#b45309'; ctx.fillRect(plaqueX - 4, plaqueY - 4, plaqueW + 8, 4);
      ctx.fillRect(plaqueX - 4, plaqueY + plaqueH, plaqueW + 8, 4);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.strokeRect(plaqueX, plaqueY, plaqueW, plaqueH);

      ctx.font = '900 17px "Cinzel", "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'; ctx.shadowBlur = 12;
      ctx.fillText('🥋 VIỆT VÕ ĐẠO — CƯƠNG NHU PHỐI TRIỂN 🥋', dojoCenterX, plaqueY + 30);
      ctx.shadowBlur = 0;

      // 3. PHÙ ĐIÊU ÂM DƯƠNG VOVINAM CHÍNH THỐNG (Tuyệt đối không vẽ vòng tròn xanh trơ trọi)
      const emblemY = 185;
      const embR = 44;

      // Hào quang vàng kim bao quanh phù điêu
      glow(ctx, dojoCenterX, emblemY, 80, 'rgba(255, 215, 0, A)', 0.28);

      // Khung tròn gỗ thếp vàng viền hoa sen
      ctx.beginPath(); ctx.arc(dojoCenterX, emblemY, embR + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f'; ctx.fill();
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3.5; ctx.stroke();

      // Nửa Đỏ (Dương - Nhu khí) bên phải
      ctx.beginPath();
      ctx.arc(dojoCenterX, emblemY, embR, -Math.PI / 2, Math.PI / 2, false);
      ctx.arc(dojoCenterX, emblemY + embR / 2, embR / 2, Math.PI / 2, -Math.PI / 2, true);
      ctx.arc(dojoCenterX, emblemY - embR / 2, embR / 2, Math.PI / 2, -Math.PI / 2, false);
      ctx.closePath();
      ctx.fillStyle = '#dc2626'; ctx.fill();

      // Nửa Xanh (Âm - Cương khí Vovinam) bên trái
      ctx.beginPath();
      ctx.arc(dojoCenterX, emblemY, embR, Math.PI / 2, -Math.PI / 2, false);
      ctx.arc(dojoCenterX, emblemY - embR / 2, embR / 2, -Math.PI / 2, Math.PI / 2, true);
      ctx.arc(dojoCenterX, emblemY + embR / 2, embR / 2, -Math.PI / 2, Math.PI / 2, false);
      ctx.closePath();
      ctx.fillStyle = '#0284c7'; ctx.fill();

      // Hai điểm nhãn Âm Dương thếp vàng
      ctx.beginPath(); ctx.arc(dojoCenterX, emblemY - embR / 2, 6, 0, Math.PI * 2); ctx.fillStyle = '#ffd700'; ctx.fill();
      ctx.beginPath(); ctx.arc(dojoCenterX, emblemY + embR / 2, 6, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();

      // Viền kim loại mạ vàng chốt giữa
      ctx.beginPath(); ctx.arc(dojoCenterX, emblemY, embR, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.stroke();

      // 4. HAI CÂU ĐỐI VÕ ĐẠO (BÀN TAY THÉP - TRÁI TIM TỪ ÁI)
      // Đặt ở dojoCenterX - 220 và dojoCenterX + 220, HOÀN TOÀN KHÔNG ĐÈ LÊN HUD BÊN TRÁI
      const coupletW = 34;
      const coupletH = 195;
      const coupletY = 110;

      // Câu đối trái: BÀN TAY THÉP
      const leftColX = dojoCenterX - 240;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'; ctx.fillRect(leftColX, coupletY, coupletW, coupletH);
      ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2.5; ctx.strokeRect(leftColX, coupletY, coupletW, coupletH);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1; ctx.strokeRect(leftColX + 3, coupletY + 3, coupletW - 6, coupletH - 6);
      ctx.font = '900 12px "Montserrat", sans-serif';
      ctx.fillStyle = '#38bdf8'; ctx.textAlign = 'center';
      ['B', 'À', 'N', 'T', 'A', 'Y', 'T', 'H', 'É', 'P'].forEach((ch, idx) => {
        ctx.fillText(ch, leftColX + coupletW / 2, coupletY + 22 + idx * 18);
      });

      // Câu đối phải: TRÁI TIM TỪ ÁI
      const rightColX = dojoCenterX + 206;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'; ctx.fillRect(rightColX, coupletY, coupletW, coupletH);
      ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2.5; ctx.strokeRect(rightColX, coupletY, coupletW, coupletH);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1; ctx.strokeRect(rightColX + 3, coupletY + 3, coupletW - 6, coupletH - 6);
      ctx.font = '900 12px "Montserrat", sans-serif';
      ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
      ['T', 'R', 'Á', 'I', 'T', 'I', 'M', 'T', 'Ừ', 'Á', 'I'].forEach((ch, idx) => {
        ctx.fillText(ch, rightColX + coupletW / 2, coupletY + 22 + idx * 16.5);
      });

      // Giá gác binh khí Vovinam (Đao, Côn) hai bên góc võ đường
      [-360, 360].forEach(off => {
        const rx = dojoCenterX + off;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(rx - 4, 280, 8, 180);
        ctx.fillRect(rx - 25, 320, 50, 6);
        ctx.fillRect(rx - 25, 370, 50, 6);
        ctx.fillRect(rx - 25, 420, 50, 6);
        ctx.fillStyle = '#d97706'; ctx.fillRect(rx - 30, 314, 60, 4);
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(rx - 35, 364, 70, 4);
      });

      // 5. SÀN GỖ TATAMI VÕ ĐƯỜNG SÁNG BÓNG (Polished Dojo Floor)
      const gradFloor = ctx.createLinearGradient(0, FLOOR_Y, 0, h);
      gradFloor.addColorStop(0, '#54321d');
      gradFloor.addColorStop(0.35, '#3b1f11');
      gradFloor.addColorStop(1, '#241209');
      ctx.fillStyle = gradFloor;
      ctx.fillRect(0, FLOOR_Y, w, h - FLOOR_Y);

      // Gờ mép sàn gỗ đánh bóng
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(0, FLOOR_Y, w, 4);

      // Vạch thảm tập võ Vovinam (Hình chữ nhật viền xanh Vovinam & vàng kim)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 4;
      ctx.strokeRect(120 - cx * 0.35, FLOOR_Y + 15, 1160, 160);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(190 - cx * 0.35, FLOOR_Y + 32, 1020, 126);

      // Kẻ các thớ gỗ parquet sàn 2.5D
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 1;
      for (let y = FLOOR_Y; y < h; y += 18) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      ctx.restore();
    },

    // ------------------------------------------------------------------------
    // 7. CON TẮC GIẢI CỨU HỨA VŨ ĐẠI (MÀN 4)
    // ------------------------------------------------------------------------
    hostage(ctx, sm, camera) {
      if (!sm.hostage) {
        sm.hostage = {
          type: 'npc_huavudai', x: 2430, y: 560, z: 0, vx: 0, facing: -1,
          state: 'captive', animTime: 0, stateTimer: 0, stateDuration: 0,
          renderScale: 1.3, invincibleTimer: 0
        };
      }
      const hs = sm.hostage;
      const sx = hs.x - camera.x, sy = hs.y - camera.y;
      if (sx < -200 || sx > 1600) return;

      ctx.save();
      // Khung lồng sắt giam giữ Hứa Vũ Đại
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 4;
      ctx.strokeRect(sx - 45, sy - 145, 90, 150);
      for (let bar = -32; bar <= 32; bar += 16) {
        ctx.beginPath(); ctx.moveTo(sx + bar, sy - 145); ctx.lineTo(sx + bar, sy + 5); ctx.stroke();
      }
      ctx.fillStyle = '#ef4444'; ctx.fillRect(sx - 12, sy - 158, 24, 14);
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.strokeRect(sx - 12, sy - 158, 24, 14);

      // Vẽ nhân vật Hứa Vũ Đại bị trói
      if (window.skeletalRenderer) window.skeletalRenderer.render(ctx, hs, camera);

      ctx.font = '800 13px Montserrat, sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
      ctx.fillText('HỨA VŨ ĐẠI (ĐANG BỊ GIAM GIỮ)', sx, sy - 186);
      ctx.restore();
    }
  };

  // ==========================================================================
  // GẮN VÀO STAGE MANAGER (Hook to Global StageManager & StageManagerRenderer)
  // ==========================================================================
  const fnRenderBg = function (ctx, camera, width, height) {
    if (window.game && (window.game.state === 'TRAINING' || window.game.state === 'TUTORIAL' || (window.tutorialManager && window.tutorialManager.isActive && !window.tutorialManager.isIngame))) {
      SCN.dojo(ctx, width, height, camera ? camera.x : 0);
      return;
    }
    const stage = (this && typeof this.getCurrentStage === 'function') ? this.getCurrentStage() : (window.stageManager && typeof window.stageManager.getCurrentStage === 'function' ? window.stageManager.getCurrentStage() : { id: 1, palette: {} });
    const stageId = stage ? (stage.sceneryId || stage.id || 1) : 1;
    const t = performance.now() / 1000;
    const camX = camera ? camera.x : 0;
    ctx.save();
    SCN.sky(ctx, stageId, width, height, camX);
    SCN.wall(ctx, stageId, width, height, camX);
    SCN.props(ctx, stageId, width, height, camX, t);
    SCN.floor(ctx, stageId, width, height, camX, t);
    if (stageId === 4 && this) SCN.hostage(ctx, this, camera);
    SCN.lights(ctx, stageId, width, height, camX, t);
    ctx.restore();
  };

  const fnRenderFg = function (ctx, camera, width, height) {
    if (window.game && (window.game.state === 'TRAINING' || window.game.state === 'TUTORIAL' || (window.tutorialManager && window.tutorialManager.isActive && !window.tutorialManager.isIngame))) {
      return;
    }
    const stage = (this && typeof this.getCurrentStage === 'function') ? this.getCurrentStage() : (window.stageManager && typeof window.stageManager.getCurrentStage === 'function' ? window.stageManager.getCurrentStage() : { id: 1 });
    const id = stage ? (stage.sceneryId || stage.id || 1) : 1;
    const cx = camera ? camera.x : 0;
    const t = performance.now() / 1000;

    ctx.save();

    // 1. DÂY CÁP ĐIỆN VÀ LAN CAN LƯỚT NHANH TRƯỚC ỐNG KÍNH (Parallax 1.28x)
    const fgPar = 1.28;
    for (let i = 0; i < 3; i++) {
      const fx = mod(i * 960 - cx * fgPar + 340, width + 1150) - 260;
      if (id === 8 || id === 11) {
        ctx.fillStyle = 'rgba(4, 9, 16, 0.65)';
        ctx.fillRect(fx, 0, 28, 190);
        ctx.beginPath();
        ctx.moveTo(fx, height); ctx.lineTo(fx + 46, height - 85); ctx.lineTo(fx + 105, height);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(3, 6, 14, 0.55)';
        ctx.fillRect(fx, 0, 42, 130);
        ctx.fillRect(fx - 14, height - 48, 70, 48);
      }
    }

    // 2. LÀN SƯƠNG MỜ LƠ LỬNG SÁT MẶT ĐẤT (Parallax 1.35x)
    ctx.globalAlpha = 0.09;
    const mistCol = id === 11 ? '#ef4444' : (id === 8 ? '#38bdf8' : (id === 4 || id === 9 || id === 10 ? '#f59e0b' : '#94a3b8'));
    ctx.fillStyle = mistCol;
    for (let i = 0; i < 4; i++) {
      const mx = mod(i * 500 + t * 30 - cx * 1.35, width + 750) - 260;
      ctx.beginPath();
      ctx.ellipse(mx, height - 28, 250, 32, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vignette được vẽ 1 lần tại GameRender.render() để tránh vẽ chồng 2 lớp toàn màn hình mỗi frame
    ctx.restore();
  };

  // Xuất hàm toàn cục và gắn vào mọi lớp quản lý sân khấu
  window._renderSceneryBackground = fnRenderBg;
  window._renderSceneryForeground = fnRenderFg;

  if (window.stageManager) {
    window.stageManager.renderBackground = fnRenderBg;
    window.stageManager.renderForeground = fnRenderFg;
  }
  if (typeof StageManager !== 'undefined') {
    StageManager.prototype.renderBackground = fnRenderBg;
    StageManager.prototype.renderForeground = fnRenderFg;
  }
  if (typeof StageManagerRenderer !== 'undefined') {
    StageManagerRenderer.prototype.renderBackground = fnRenderBg;
    StageManagerRenderer.prototype.renderForeground = fnRenderFg;
  }
  if (window.StageManagerRenderer) {
    window.StageManagerRenderer.prototype.renderBackground = fnRenderBg;
    window.StageManagerRenderer.prototype.renderForeground = fnRenderFg;
  }
  if (window.StageManagerBase) {
    window.StageManagerBase.prototype.renderBackground = fnRenderBg;
    window.StageManagerBase.prototype.renderForeground = fnRenderFg;
  }
})();
