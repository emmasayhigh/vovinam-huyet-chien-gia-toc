/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/gameCamera.js - Camera look-ahead, duel framing, punch zoom va gioi han san khau.
 */

class GameCamera extends window.GameWave {
  // ==========================================================================
  // CẬP NHẬT CAMERA ĐIỆN ẢNH (LOOK-AHEAD, DUEL FRAMING, PUNCH ZOOM & BOUNDS)
  // ==========================================================================
  triggerCameraPunch(zoomScale = 1.055, duration = 0.18, worldX = null, worldY = null) {
    const fx = window.fxSettings;
    if (fx && fx.reduceShake) return;
    this.camPunchScale = Math.max(this.camPunchScale || 1.0, zoomScale);
    this.camPunchTimer = Math.max(this.camPunchTimer || 0, duration);
    this.camPunchMaxTimer = duration;
    this.camPunchX = worldX;
    this.camPunchY = worldY;
  }

  updateCamera(dt) {
    if (!this.player) return;
    if (!Number.isFinite(this.player.x)) this.player.x = (this.arenaLocked ? this.arenaMinX + 120 : 200);
    if (!Number.isFinite(this.player.y)) this.player.y = 575;
    if (!Number.isFinite(this.camera.x)) this.camera.x = Math.max(0, this.player.x - this.width * 0.4);
    if (!Number.isFinite(this.camera.y)) this.camera.y = 0;

    // Look-Ahead mượt theo hướng nhìn & căn khung hình đối kháng khi đấu Boss (DUEL)
    const facing = (this.player && this.player.facing) ? this.player.facing : 1;
    const lookAheadOffset = facing > 0 ? this.width * 0.36 : this.width * 0.44;
    let targetCameraX = this.player.x - lookAheadOffset;

    if (this.combatMode === 'DUEL' && this.currentBoss && !this.currentBoss.isDead && Number.isFinite(this.currentBoss.x)) {
      const midX = (this.player.x * 0.65 + this.currentBoss.x * 0.35);
      targetCameraX = midX - this.width * 0.42;
    }

    if (Number.isFinite(targetCameraX)) {
      // Lerp mượt mà
      this.camera.x += (targetCameraX - this.camera.x) * 6.5 * dt;
    }

    if (this.camPunchTimer > 0) {
      this.camPunchTimer = Math.max(0, this.camPunchTimer - dt);
    }

    // Giới hạn trong sàn đấu hoặc trong khu vực khóa Boss
    if (this.arenaLocked) {
      const maxCamX = Math.max(this.arenaMinX, this.arenaMaxX - this.width);
      this.camera.x = Math.max(this.arenaMinX, Math.min(maxCamX, this.camera.x));
      // Trong 2P Co-op: kéo nhân vật vào khung đấu trường mượt mà theo tốc độ khi Host vừa khóa Wave mới, tránh giật cục
      const minPx = this.arenaMinX + 30;
      const maxPx = this.arenaMaxX - 30;
      const isCoopOnline = !!(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'coop');
      if (this.player.x < minPx) {
        const diff = minPx - this.player.x;
        this.player.x += (isCoopOnline && diff > 24) ? Math.min(diff, Math.max(300, diff * 6) * dt) : diff;
      } else if (this.player.x > maxPx) {
        const diff = this.player.x - maxPx;
        this.player.x -= (isCoopOnline && diff > 24) ? Math.min(diff, Math.max(300, diff * 6) * dt) : diff;
      }
    } else {
      this.camera.x = Math.max(0, Math.min(this.camera.maxX, this.camera.x));
      this.player.x = Math.max(30, Math.min(window.stageManager.stageWidth - 30, this.player.x));
    }
  }

  // ==========================================================================
  // CHIẾN THẮNG & THẤT BẠI
  // ==========================================================================
}

window.GameCamera = GameCamera;
