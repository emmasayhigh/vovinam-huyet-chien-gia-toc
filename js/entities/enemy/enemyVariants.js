/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/enemy/enemyVariants.js - Cac bien the dich nhe: ne don va thu.
 */

class EnemyDodger extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'enemy_dodger', 'Võ Sĩ Thân Pháp');
    this.maxHp = 210;
    this.hp = 210;
    this.speed = 190;
    this.evadeCooldown = 0;
    this.breakThreshold = 4;   // né giỏi, ít chịu đòn liên tiếp
    this.followupChance = 0.25; // chân pháp nhanh: đá vòng cầu rồi đá tiếp
  }

  updateAI(dt, player) {
    if (this.evadeCooldown > 0) this.evadeCooldown -= dt;

    if (this.state === 'dodge') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }

    // Lùi né khi người chơi dồn đòn sát mặt (có thời gian hồi rõ ràng)
    if ((this.state === 'idle' || this.state === 'walk') && this.evadeCooldown <= 0 &&
        ['punch_straight', 'punch_hook', 'kick_push'].includes(player.state) &&
        Math.abs(player.x - this.x) < 95 && Math.random() < 0.05) {
      this.vx = -this.facing * 330;
      this.evadeCooldown = 2.2;
      this.setState('dodge', 0.28);
      if (window.audioManager) window.audioManager.playDodge();
      return;
    }
    super.updateAI(dt, player);
  }

  startAttackSequence(player) {
    this.setState('kick_roundhouse', 0.32);
    this.vx = this.facing * 140;
  }

  checkAttackPlayer(player) {
    const attackData = { damage: 31, offsetX: 58, offsetY: -75, width: 76, height: 55, knockback: 7, isKick: true, counterType: 'leg' };
    this.deliverAttackHit(player, attackData);
  }
}

// ============================================================================
// VÕ SĨ THIẾT GIÁP (đỡ đòn phía trước, lộ sơ hở sau khi đỡ)
// ============================================================================
class EnemyGuard extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'enemy_guard', 'Võ Sĩ Thiết Giáp');
    this.maxHp = 280;
    this.hp = 280;
    this.speed = 110;
    this.guardCooldown = 0;
    this.breakThreshold = 5;   // giáp dày: chịu lâu hơn mới gồng
    this.followupChance = 0.3; // đấm móc rồi đấm tiếp
  }

  updateAI(dt, player) {
    if (this.guardCooldown > 0) this.guardCooldown -= dt;

    if (this.state === 'guard') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        this.guardCooldown = 1.6; // sơ hở sau khi hạ thủ
      }
      return;
    }

    const playerAttacking = ['punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse'].includes(player.state);
    if ((this.state === 'idle' || this.state === 'walk') && this.guardCooldown <= 0 &&
        Math.abs(player.x - this.x) < 100 && playerAttacking && Math.random() < 0.08) {
      this.setState('guard', 0.7);
      return;
    }
    super.updateAI(dt, player);
  }

  startAttackSequence(player) {
    this.setState('punch_hook', 0.35);
    this.vx = this.facing * 110;
  }

  checkAttackPlayer(player) {
    const attackData = { damage: 36, offsetX: 55, offsetY: -80, width: 66, height: 55, knockback: 6, counterType: 'hand' };
    this.deliverAttackHit(player, attackData);
  }
}

// ============================================================================
// BOSS MÀN 1: ĐAO THỦ HẮC LANG (3 GIAI ĐOẠN — THĂM DÒ / SONG ĐAO / CUỒNG SÁT)
// ============================================================================

window.EnemyDodger = EnemyDodger;
window.EnemyGuard = EnemyGuard;
