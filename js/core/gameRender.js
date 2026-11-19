/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/gameRender.js - Ve projectiles, toan bo scene va vat chung dieu tra.
 */

class GameRender extends window.GameStory {
  // Vẽ vật bay: phi tiêu 4 cánh (Kẻ Ném) / phi đao kunai (boss) — vẽ bằng canvas thuần
  renderProjectiles() {
    if (!this.projectiles.length) return;
    const ctx = this.ctx;
    for (const p of this.projectiles) {
      const sx = p.x - this.camera.x;
      const sy = p.y - this.camera.y;
      if (sx < -60 || sx > this.width + 60) continue;
      const dir = Math.sign(p.vx) || 1;
      const isBoss = !!(p.owner && (p.owner.isBoss || String(p.owner.type || '').startsWith('boss_')));
      const col = isBoss ? '#f43f5e' : '#38bdf8';

      // Vệt sáng đuôi (gradient mờ dần)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const tg = ctx.createLinearGradient(sx, sy, sx - dir * 70, sy);
      tg.addColorStop(0, isBoss ? 'rgba(244,63,94,0.55)' : 'rgba(56,189,248,0.55)');
      tg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = tg; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - dir * 70, sy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - dir * 44, sy); ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(sx, sy);
      ctx.shadowColor = col; ctx.shadowBlur = 14;
      if (isBoss) {
        // Phi đao kunai: lưỡi lá, vòng kéo ở đuôi, dây đỏ
        ctx.rotate(dir > 0 ? 0 : Math.PI);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, -6); ctx.lineTo(22, 0); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
        const bg = ctx.createLinearGradient(0, -5, 0, 5);
        bg.addColorStop(0, '#f8fafc'); bg.addColorStop(0.5, '#cbd5e1'); bg.addColorStop(1, '#64748b');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, -4.4); ctx.lineTo(21, 0); ctx.lineTo(0, 4.4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(30,41,59,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(19, 0); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-8, 0); ctx.stroke();
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1.8;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-13 + k * 2, -2.2); ctx.lineTo(-12 + k * 2, 2.2); ctx.stroke(); }
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-18, 0, 4, 0, Math.PI * 2); ctx.stroke();
      } else {
        // Phi tiêu 4 cánh xoay tít
        ctx.rotate(p.rot);
        const blade = (r) => {
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = i * Math.PI / 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.32, Math.sin(a + Math.PI / 4) * r * 0.32);
          }
          ctx.closePath();
        };
        ctx.fillStyle = '#0f172a'; blade(17); ctx.fill();
        const sg = ctx.createRadialGradient(-3, -3, 1, 0, 0, 15);
        sg.addColorStop(0, '#f8fafc'); sg.addColorStop(0.6, '#94a3b8'); sg.addColorStop(1, '#475569');
        ctx.fillStyle = sg; blade(15); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
        blade(15); ctx.stroke();
        ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, Math.PI * 2); ctx.fill();
      }
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
    if (!Number.isFinite(this.camera.x)) this.camera.x = 0;
    if (!Number.isFinite(this.camera.y)) this.camera.y = 0;

    // Rung màn hình khi có chấn động
    this.ctx.save();
    if (window.effectManager) {
      const shX = Number.isFinite(window.effectManager.shakeOffsetX) ? window.effectManager.shakeOffsetX : 0;
      const shY = Number.isFinite(window.effectManager.shakeOffsetY) ? window.effectManager.shakeOffsetY : 0;
      this.ctx.translate(shX, shY);
    }

    // Zoom điện ảnh khi boss ra mắt (lùi về tự nhiên theo thời gian)
    if (this.bossZoom > 0.01 && this.bossIntroTarget && Number.isFinite(this.bossIntroTarget.x) && Number.isFinite(this.bossIntroTarget.y)) {
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

    // 1c. Vẽ Vật thể tương tác sân khấu (thùng hàng, thùng phuy, mảnh vỡ — không vẽ trong Võ đường / Tân thủ)
    if (window.propSystem && !inMenu && this.state !== 'TRAINING' && this.state !== 'TUTORIAL') {
      window.propSystem.render(this.ctx, this.camera);
    }

    // 1d. Vẽ Vòng Bùa Cảnh Báo (Bùa Hỏa Thiêu Hồn)
    if (!inMenu && Array.isArray(this._activeHazards) && this._activeHazards.length > 0) {
      const ctx = this.ctx;
      const camX = this.camera ? this.camera.x : 0;
      ctx.save();
      for (const hz of this._activeHazards) {
        const sx = hz.x - camX;
        const sy = hz.y;
        const ratio = Math.max(0, Math.min(1, 1 - hz.timer / (hz.maxTimer || 1.35)));
        ctx.beginPath();
        ctx.ellipse(sx, sy, hz.radius, hz.radius * 0.42, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.14 + ratio * 0.28})`;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(251, 146, 60, ${0.65 + ratio * 0.35})`;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(sx, sy, hz.radius * ratio, hz.radius * 0.42 * ratio, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Sắp xếp chiều sâu (2.5D Depth Sorting theo tọa độ Y)
    const rawList = inMenu ? [this.titleHero] : [this.player, ...this.enemies];
    if (!inMenu && window.allyManager) {
      if (window.allyManager.activeAlly) rawList.push(window.allyManager.activeAlly);
      if (window.allyManager.retreatingAlly) rawList.push(window.allyManager.retreatingAlly);
    }
    const renderList = rawList.filter((e) => e && Number.isFinite(e.x) && Number.isFinite(e.y));
    renderList.sort((a, b) => a.y - b.y);

    // 3. Vẽ Tàn Ảnh (Ghost Trails)
    if (window.effectManager && window.skeletalRenderer) {
      for (const ghost of window.effectManager.ghostTrails) {
        if (!ghost || !Number.isFinite(ghost.x) || !Number.isFinite(ghost.y)) continue;
        this.ctx.save();
        try {
          this.ctx.globalAlpha = ghost.alpha;
          window.skeletalRenderer.render(this.ctx, ghost, this.camera);
        } catch (err) {
          console.error('[Render Ghost Error]', err);
        }
        this.ctx.restore();
      }
    }

    // 4. Vẽ Các Thực Thể Khung Xương (Ngô Nhất Nghị, Lính, Boss)
    if (window.skeletalRenderer) {
      for (const entity of renderList) {
        this.ctx.save();
        try {
          window.skeletalRenderer.render(this.ctx, entity, this.camera);
        } catch (err) {
          console.error('[Render Entity Error]', err);
        }
        this.ctx.restore();
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

    // 7. Vignette điện ảnh (cache 1 lần theo kích thước màn hình)
    if (!this._vignetteGrad || this._vignetteW !== this.width || this._vignetteH !== this.height) {
      const vg = this.ctx.createRadialGradient(this.width / 2, this.height / 2, this.height * 0.45, this.width / 2, this.height / 2, this.width * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      this._vignetteGrad = vg;
      this._vignetteW = this.width;
      this._vignetteH = this.height;
    }
    this.ctx.fillStyle = this._vignetteGrad;
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
    if (window.onlineManager && window.onlineManager.isActive) return false;
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
    if (window.onlineManager && window.onlineManager.isActive) return;
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
