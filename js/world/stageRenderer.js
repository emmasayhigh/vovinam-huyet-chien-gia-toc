/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/world/stageRenderer.js - Ve background parallax da lop theo tung man.
 *
 * Nhan du lieu tu StageManagerBase (window.STAGE_DEFINITIONS) va khong
 * chua logic gameplay. Tach rieng de de chinh sua hinh anh tung man.
 */

class StageManagerRenderer extends window.StageManagerBase {
  // ==========================================================================
  // VẼ BỐI CẢNH PARALLAX ĐA LỚP TRÊN CANVAS THEO TỪNG MÀN
  // ==========================================================================
  renderBackground(ctx, camera, width, height) {
    const stage = this.getCurrentStage();
    const camX = camera.x;

    ctx.save();

    // 1. LỚP BẦU TRỜI & ĐƯỜNG CHÂN TRỜI XA (Parallax 0.1x)
    const p1 = camX * 0.08;
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, stage.palette.sky);
    bgGrad.addColorStop(0.7, stage.palette.mid);
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Vẽ tòa nhà / cấu trúc xa xăm
    ctx.fillStyle = stage.palette.mid;
    for (let i = 0; i < 15; i++) {
      const bX = (i * 180 - p1) % (width + 360) - 180;
      const bW = 120;
      const bH = 220 + (i % 4) * 60;
      ctx.fillRect(bX, 320 - bH, bW, bH);

      // Cửa sổ tòa nhà
      ctx.fillStyle = (i % 2 === 0) ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 210, 255, 0.15)';
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if ((r + c + i) % 3 === 0) {
            ctx.fillRect(bX + 16 + c * 32, 330 - bH + 20 + r * 35, 12, 18);
          }
        }
      }
      ctx.fillStyle = stage.palette.mid;
    }

    // 2. LỚP CẢNH GIỮA (Parallax 0.35x - Đèn Neon, Ống Thông Gió, Container)
    const p2 = camX * 0.35;
    if (stage.id === 1) {
      // Màn 1: Biển hiệu Neon Việt Nam trong hẻm
      this.renderNeonSigns(ctx, p2, width);
    } else if (stage.id === 2) {
      // Màn 2: Container và đèn cần cẩu
      this.renderWarehouseContainers(ctx, p2, width);
    } else if (stage.id === 3) {
      // Màn 3: Đèn còi cảnh báo boongke ngầm
      this.renderBunkerCorridor(ctx, p2, width);
    } else if (stage.id === 4) {
      // Màn 4: Trụ cột dát vàng và LỒNG GIAM HỨA VŨ ĐẠI
      this.renderVaultAndHostage(ctx, p2, width, camX);
    }

    // 3. LỚP SÀN CHIẾN ĐẤU (Parallax 1.0x - Camera thực)
    const floorY = 510;
    const floorH = height - floorY;

    // Mặt sàn chính
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
    floorGrad.addColorStop(0, stage.palette.ground);
    floorGrad.addColorStop(1, '#080a0e');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, width, floorH);

    // Kẻ vạch gạch lát / viền đường bê tông
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = - (camX % 80); x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x - 50, height);
      ctx.stroke();
    }

    // Vũng nước phản chiếu ánh neon ở Màn 1
    if (stage.id === 1) {
      ctx.fillStyle = 'rgba(255, 42, 75, 0.12)';
      for (let i = 0; i < 4; i++) {
        const px = (i * 320 - camX * 0.8) % (width + 400) - 100;
        ctx.beginPath();
        ctx.ellipse(px, 570 + (i % 2) * 30, 70, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // Biển hiệu Neon Hẻm Mưa Đỏ
  renderNeonSigns(ctx, p2, width) {
    const signs = ['HẺM MƯA ĐỎ', 'VÕ ĐƯỜNG BẮC NAM', 'QUÁN ĐÊM', 'KHO 07'];
    for (let i = 0; i < signs.length; i++) {
      const sx = (i * 500 - p2) % (width + 800) - 200;
      ctx.save();
      ctx.font = '900 20px "Cinzel", "Montserrat", sans-serif';
      ctx.fillStyle = (i % 2 === 0) ? '#ff2a4b' : '#00d2ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      ctx.fillText(signs[i], sx, 260);
      ctx.restore();
    }
  }

  // Nhà kho Thép Màn 2
  renderWarehouseContainers(ctx, p2, width) {
    for (let i = 0; i < 6; i++) {
      const cx = (i * 380 - p2) % (width + 600) - 150;
      ctx.fillStyle = (i % 2 === 0) ? '#243b55' : '#8b2635';
      ctx.fillRect(cx, 340, 220, 170);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(cx, 340, 220, 170);

      // Nhãn cảnh báo vàng đen
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(cx + 20, 360, 40, 15);
    }
  }

  // Hành lang Boongke Màn 3
  renderBunkerCorridor(ctx, p2, width) {
    for (let i = 0; i < 8; i++) {
      const lx = (i * 280 - p2) % (width + 400) - 100;
      // Đèn cảnh báo đỏ xoay
      ctx.fillStyle = 'rgba(255, 0, 85, 0.25)';
      ctx.beginPath();
      ctx.arc(lx, 320, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff0055';
      ctx.fillRect(lx - 8, 310, 16, 12);
    }
  }

  // Phòng Giao Dịch Ngầm & Lồng Giam Hứa Vũ Đại Màn 4
  renderVaultAndHostage(ctx, p2, width, camX) {
    // Trụ vàng kim
    for (let i = 0; i < 5; i++) {
      const px = (i * 450 - p2) % (width + 600) - 100;
      ctx.fillStyle = 'rgba(218, 165, 32, 0.4)';
      ctx.fillRect(px, 200, 50, 310);
    }

    // LỒNG GIAM ÔNG TRÙM HỨA VŨ ĐẠI (ở tọa độ x = 2400 của màn khấu)
    const cageScreenX = 2400 - camX;
    if (cageScreenX > -200 && cageScreenX < width + 200) {
      ctx.save();
      ctx.translate(cageScreenX, 480);

      // Khung lồng sắt
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.strokeRect(-40, -90, 80, 100);
      for (let bar = -30; bar <= 30; bar += 15) {
        ctx.beginPath();
        ctx.moveTo(bar, -90);
        ctx.lineTo(bar, 10);
        ctx.stroke();
      }

      // Hình tượng Hứa Vũ Đại bị trói ngồi trên ghế
      ctx.fillStyle = '#1e293b'; // Áo vest đen
      ctx.fillRect(-12, -45, 24, 30);
      ctx.fillStyle = '#f5c69b'; // Đầu
      ctx.beginPath();
      ctx.arc(0, -58, 8, 0, Math.PI * 2);
      ctx.fill();

      // Nhãn tên VIP
      ctx.font = '800 12px "Montserrat", sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.fillText('HỨA VŨ ĐẠI', 0, -100);

      ctx.restore();
    }
  }
}

window.StageManagerRenderer = StageManagerRenderer;
