/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/gameRender.js - Ve projectiles, toan bo scene va vat chung dieu tra.
 */

class GameRender extends window.GameStory {
  // Vẽ vật bay (ném môi trường) — không cần ảnh, vẽ bằng canvas thuần
  renderProjectiles() {
    if (!this.projectiles.length) return;
    const ctx = this.ctx;
    for (const p of this.projectiles) {
      const sx = p.x - this.camera.x;
      const sy = p.y - this.camera.y;
      if (sx < -60 || sx > this.width + 60) continue;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.rot);
      ctx.fillStyle = '#8a919c';
      ctx.fillRect(-13, -9, 26, 18);
      ctx.strokeStyle = '#41474f';
      ctx.lineWidth = 2;
      ctx.strokeRect(-13, -9, 26, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-13, -9, 26, 4);
      ctx.restore();
      // Vệt chuyển động
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#c9d2dd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx - Math.sign(p.vx) * 14, sy);
      ctx.lineTo(sx - Math.sign(p.vx) * 52, sy + 4);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ==========================================================================
  // RENDER HÌNH ẢNH TOÀN BỘ GAME
  // ==========================================================================
  render() {
    const inMenu = this.state === 'MENU';
    if (inMenu) {
      const ts = document.getElementById('title-screen');
      if (ts && !ts.classList.contains('hidden')) {
        // Màn hình chính đang hiển thị lớp phủ riêng: bỏ qua vẽ ngầm trên gameCanvas để tiết kiệm GPU/CPU
        return;
      }
      this.camera.x = 0;
      this.camera.y = 0;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Rung màn hình khi có chấn động
    this.ctx.save();
    if (window.effectManager) {
      this.ctx.translate(window.effectManager.shakeOffsetX, window.effectManager.shakeOffsetY);
    }

    // Zoom điện ảnh khi boss ra mắt (lùi về tự nhiên theo thời gian)
    if (this.bossZoom > 0.01 && this.bossIntroTarget) {
      const b = this.bossIntroTarget;
      const z = 1 + 0.42 * this.bossZoom;
      const bx = Math.max(this.width * 0.26, Math.min(this.width * 0.74, b.x - this.camera.x));
      const by = Math.max(this.height * 0.26, Math.min(this.height * 0.74, (b.y + (b.z || 0)) - 95));
      this.ctx.translate(this.width / 2, this.height / 2);
      this.ctx.scale(z, z);
      this.ctx.translate(-bx, -by);
    } else if ((this.camPunchTimer || 0) > 0) {
      // Camera Punch Zoom khi tung đòn Chí mạng / Phản đòn / Kẹp cổ Vovinam
      const p = this.camPunchTimer / (this.camPunchMaxTimer || 0.18);
      const ease = Math.sin(p * Math.PI);
      const z = 1 + ((this.camPunchScale || 1.05) - 1) * ease;
      const fx = this.camPunchX != null ? Math.max(this.width * 0.25, Math.min(this.width * 0.75, this.camPunchX - this.camera.x)) : this.width * 0.5;
      const fy = this.camPunchY != null ? Math.max(this.height * 0.25, Math.min(this.height * 0.75, this.camPunchY - this.camera.y - 70)) : this.height * 0.55;
      this.ctx.translate(fx, fy);
      this.ctx.scale(z, z);
      this.ctx.translate(-fx, -fy);
    }

    // 1. Vẽ Bối cảnh Parallax theo màn chơi
    if (window.stageManager) {
      window.stageManager.renderBackground(this.ctx, this.camera, this.width, this.height);
    }

    // 1b. Vẽ Vũ khí rơi trên nền đất
    if (window.weaponSystem && !inMenu) {
      window.weaponSystem.render(this.ctx, this.camera);
    }

    // 1c. Vẽ Vật thể tương tác sân khấu (thùng hàng, thùng phuy, mảnh vỡ)
    if (window.propSystem && !inMenu) {
      window.propSystem.render(this.ctx, this.camera);
    }

    // 2. Sắp xếp chiều sâu (2.5D Depth Sorting theo tọa độ Y)
    const renderList = inMenu ? [this.titleHero] : [this.player, ...this.enemies];
    if (!inMenu && window.allyManager && window.allyManager.activeAlly) {
      renderList.push(window.allyManager.activeAlly);
    }
    renderList.sort((a, b) => a.y - b.y);

    // 3. Vẽ Tàn Ảnh (Ghost Trails)
    if (window.effectManager && window.skeletalRenderer) {
      for (const ghost of window.effectManager.ghostTrails) {
        this.ctx.save();
        this.ctx.globalAlpha = ghost.alpha;
        window.skeletalRenderer.render(this.ctx, ghost, this.camera);
        this.ctx.restore();
      }
    }

    // 4. Vẽ Các Thực Thể Khung Xương (Ngô Nhất Nghị, Lính, Boss)
    if (window.skeletalRenderer) {
      for (const entity of renderList) {
        window.skeletalRenderer.render(this.ctx, entity, this.camera);
      }
    }

    // 5. Vẽ Hiệu Ứng Thế Giới (Tia lửa, sóng chấn động, chữ số sát thương)
    if (window.effectManager) {
      window.effectManager.renderWorld(this.ctx, this.camera);
    }

    // 5b. Vẽ vật bay (đá/gạch môi trường)
    this.renderProjectiles();

    // 5c. Vẽ Vật Chứng Khám Phá trên mặt sân khấu
    this.renderStageEvidence(this.ctx, this.camera);

    // 5d. Vẽ Hồi ức nếu đang kích hoạt
    if (window.flashbackMission && window.flashbackMission.isActive) {
      window.flashbackMission.render(this.ctx, this.camera);
    }

    // 5e. Vẽ HUD gợi ý nhặt vũ khí [E] và độ bền
    if (window.weaponSystem && !inMenu) {
      window.weaponSystem.renderHud(this.ctx, this.camera, this.player);
    }

    // 5f. Vẽ Đồng Minh trên sân
    if (window.allyManager && !inMenu) {
      window.allyManager.draw(this.ctx, this.camera);
    }

    // 5g. Vẽ Lớp Tiền Cảnh Điện Ảnh 2.5D (Foreground Parallax 1.28x)
    if (window.stageManager && typeof window.stageManager.renderForeground === 'function' && !inMenu) {
      window.stageManager.renderForeground(this.ctx, this.camera, this.width, this.height);
    }

    this.ctx.restore(); // Khôi phục rung màn hình & camera zoom

    // 6. Vẽ Hiệu Ứng Lớp Phủ Màn Hình (Mưa, chớp flash)
    if (window.effectManager) {
      window.effectManager.renderScreen(this.ctx, this.width, this.height);
    }

    // 7. Vignette điện ảnh
    const vg = this.ctx.createRadialGradient(this.width / 2, this.height / 2, this.height * 0.45, this.width / 2, this.height / 2, this.width * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    this.ctx.fillStyle = vg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 8. Letterbox khi đang thoại
    if (this.cineBar > 0.01) {
      const bh = 64 * this.cineBar;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.width, bh);
      this.ctx.fillRect(0, this.height - bh, this.width, bh);
    }
  }

  // ==========================================================================
  // HỆ THỐNG ĐIỀU TRA & VẬT CHỨNG TRÊN SÂN KHẤU (INVESTIGATION PICKUPS)
  // ==========================================================================
  collectStageEvidence() {
    if (!this.stageEvidence || this.stageEvidence.collected) return;
    this.stageEvidence.collected = true;
    const docId = this.stageEvidence.id;
    const inv = window.investigationManager;

    if (inv) {
      inv.collectEvidence(docId);
      // Hiển thị hộp thoại quyết định quyền nắm giữ (Custody Choice)
      if (window.menuManager && window.menuManager.showCustodyModal) {
        window.menuManager.showCustodyModal(docId);
      }
    }
  }

  renderStageEvidence(ctx, camera) {
    if (!this.stageEvidence || this.stageEvidence.collected) return;
    const ev = this.stageEvidence;
    const sx = ev.x - camera.x;
    if (sx < -80 || sx > this.width + 80) return;

    ctx.save();
    ctx.translate(sx, ev.y);

    // Hiệu ứng phát sáng lấp lánh (pulsing gold/cyan aura)
    const pulse = Math.sin(performance.now() * 0.005) * 0.25 + 0.75;
    const grad = ctx.createRadialGradient(0, -25, 2, 0, -25, 45);
    grad.addColorStop(0, 'rgba(255, 215, 0, ' + (0.5 * pulse) + ')');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -25, 45, 0, Math.PI * 2);
    ctx.fill();

    // Hòm tài liệu / Túi hồ sơ có dấu sáp đỏ
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-16, -36, 32, 24);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -36, 32, 24);

    // Nắp phong bì
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.moveTo(-16, -36);
    ctx.lineTo(0, -22);
    ctx.lineTo(16, -36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Con dấu niêm phong sáp đỏ
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, -22, 5, 0, Math.PI * 2);
    ctx.fill();

    // Chỉ dẫn nút bấm khi ở gần
    if (Math.abs(this.player.x - ev.x) < 95) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fillText('[J] hoặc [E]: THU THẬP MANH MỐI', 0, -50);
      ctx.fillStyle = '#fef08a';
      ctx.font = '600 10px Montserrat, sans-serif';
      ctx.fillText(ev.doc ? ev.doc.typeName.toUpperCase() : 'VẬT CHỨNG', 0, -64);
    }

    ctx.restore();
  }
}

window.GameRender = GameRender;
