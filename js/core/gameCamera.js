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
    // Look-Ahead mượt theo hướng nhìn & căn khung hình đối kháng khi đấu Boss (DUEL)
    const facing = (this.player && this.player.facing) ? this.player.facing : 1;
    const lookAheadOffset = facing > 0 ? this.width * 0.36 : this.width * 0.44;
    let targetCameraX = this.player.x - lookAheadOffset;

    if (this.combatMode === 'DUEL' && this.currentBoss && !this.currentBoss.isDead) {
      const midX = (this.player.x * 0.65 + this.currentBoss.x * 0.35);
      targetCameraX = midX - this.width * 0.42;
    }

    // Lerp mượt mà
    this.camera.x += (targetCameraX - this.camera.x) * 6.5 * dt;

    if (this.camPunchTimer > 0) {
      this.camPunchTimer = Math.max(0, this.camPunchTimer - dt);
    }

    // Giới hạn trong sàn đấu hoặc trong khu vực khóa Boss
    if (this.arenaLocked) {
      const maxCamX = Math.max(this.arenaMinX, this.arenaMaxX - this.width);
      this.camera.x = Math.max(this.arenaMinX, Math.min(maxCamX, this.camera.x));
      // Không cho nhân vật chạy ra ngoài ranh giới sàn đấu (đến được cả 2 đầu sân)
      this.player.x = Math.max(this.arenaMinX + 30, Math.min(this.arenaMaxX - 30, this.player.x));
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
