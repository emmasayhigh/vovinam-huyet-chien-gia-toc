/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/tutorial/tutorialDummy.js - Vo su huong dan, phan don va telegraph.
 */

const SuperDummy = (typeof window.TrainingDummy !== 'undefined') ? window.TrainingDummy : window.BaseEnemy;

class TutorialDummy extends SuperDummy {
  constructor(x, y) {
    super(x, y, 'thug', 'Võ Sư Huấn Luyện (Sư Huynh)');
    this.maxHp = 9999;
    this.hp = 9999;
    this.isTutorialDummy = true;
    this.isTrainingDummy = true;
    this.styleType = 'enemy_brawler'; // Võ phục võ sư huấn luyện có hộ thủ và đai võ học
    this.attackMode = 'idle'; // 'idle', 'guard_practice', 'telegraph_dodge', 'telegraph_hand', 'telegraph_leg', 'free'
    this.telegraphTimer = 0;
    this.telegraphDuration = 1.3;
    this.telegraphState = 'idle'; // 'idle', 'windup', 'slowmo_active'
    this.slowMoTriggered = false;
    this.cooldownTimer = 0;
  }

  update(dt, player) {
    this.animTime += dt;
    this.stateTimer += dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);
    if (this.combatKnockbackTimer > 0) {
      this.combatKnockbackTimer -= dt;
      if (this.combatKnockbackTimer <= 0) this.isKnockedBack = false;
    }

    // Luôn tự động hồi phục máu tối đa
    if (this.hp < this.maxHp && !this.isDead) {
      this.hp = Math.min(this.maxHp, this.hp + 450 * dt);
    }

    if (this.isDead) {
      this.isDead = false;
      this.hp = this.maxHp;
      this.setState('getup', 0.8);
      return;
    }

    if (this.state === 'knockdown' || this.state === 'getup') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle', 1.0);
      }
      return;
    }

    if (this.state === 'hurt') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle', 1.0);
      }
      return;
    }

    // Luôn quay mặt về phía người chơi
    if (player) {
      this.facing = (player.x >= this.x) ? 1 : -1;
    }

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
      return;
    }

    // Điều khiển chu kỳ ra đòn chuẩn nhịp để người chơi tập né và phản đòn
    if (this.attackMode === 'telegraph_dodge' || this.attackMode === 'telegraph_hand' || this.attackMode === 'telegraph_leg') {
      const isLeg = (this.attackMode === 'telegraph_leg');
      const counterType = isLeg ? 'leg' : 'hand';

      // Sư Huynh tự động bước tới áp sát nếu người chơi đứng quá xa (giữ khoảng cách 110-130px)
      if (player && this.telegraphState === 'idle') {
        const distX = Math.abs(player.x - this.x);
        const distY = Math.abs(player.y - this.y);
        if (distX > 140 || distY > 20) {
          const dirX = (player.x > this.x) ? 1 : -1;
          const dirY = (player.y > this.y) ? 1 : -1;
          this.vx = (distX > 115) ? dirX * 130 : 0;
          this.vy = (distY > 15) ? dirY * 90 : 0;
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          this.setState('walk');
          return;
        } else {
          this.vx = 0;
          this.vy = 0;
        }
      }

      this.telegraphTimer += dt;

      if (this.telegraphState === 'idle') {
        if (this.telegraphTimer >= 1.2) {
          this.telegraphState = 'windup';
          this.telegraphTimer = 0;
          this.slowMoTriggered = false;
          this.hasStruckThisCycle = false;

          // Cảnh báo thị giác & thính giác đòn đánh chuẩn bị tới
          this.setState(isLeg ? 'counter_leg_prep' : 'counter_hand_prep', 0.5);
          if (window.audioManager && typeof window.audioManager.playWarning === 'function') {
            window.audioManager.playWarning();
          }
          if (window.effectManager) {
            window.effectManager.createShockRing(this.x, this.y, '#ef4444');
            window.effectManager.addFloatingText('CHUẨN BỊ ĐÒN!', this.x, this.y - 150, 'warn');
          }
        }
      } else if (this.telegraphState === 'windup') {
        // Sau 0.5s chuẩn bị: Kích hoạt Bullet-Time Slow Motion và Callout Alert!
        if (this.telegraphTimer >= 0.5 && !this.slowMoTriggered) {
          this.slowMoTriggered = true;
          this.telegraphState = 'slowmo_active';
          this.telegraphTimer = 0;
          this.hasStruckThisCycle = false;

          // Bắt đầu chuỗi vung đòn thực tế
          this.setState(isLeg ? 'kick_roundhouse' : 'punch_straight', 0.85);
          this.isAttacking = true;

          // Làm chậm thời gian chuẩn phong cách điện ảnh AAA
          if (window.effectManager && typeof window.effectManager.triggerSlowMo === 'function') {
            window.effectManager.triggerSlowMo(0.12, 0.8);
          }

          // Hiện Callout Banner trực diện
          if (window.tutorialManager) {
            let prompt = '⚡ [L] HOẶC [SHIFT] — NÉ HOÀN HẢO NGAY!';
            if (this.attackMode === 'telegraph_hand') prompt = '⚡ [U] + [J] — CHỎ LẬT BẺ KHỚP TAY!';
            else if (this.attackMode === 'telegraph_leg') prompt = '⚡ [U] + [K] — GẠT CƯỚC QUẬT NGÃ!';
            window.tutorialManager.showSlowMoAlert(prompt);
          }
        }
      } else if (this.telegraphState === 'slowmo_active') {
        // Tung đòn thực sự chạm hitbox người chơi
        if (!this.hasStruckThisCycle && player && window.combatSystem) {
          this.hasStruckThisCycle = true;
          window.combatSystem.checkAttackHit(this, player, {
            damage: 1,
            counterType: counterType,
            isKick: isLeg,
            width: 85,
            height: 50,
            offsetX: 42,
            offsetY: isLeg ? -45 : -75
          });
        }

        // Cửa sổ tấn công diễn ra trong lúc slow-mo
        if (this.telegraphTimer >= 0.75) {
          this.telegraphState = 'idle';
          this.telegraphTimer = 0;
          this.isAttacking = false;
          this.cooldownTimer = 1.2;
          this.setState('idle', 1.0);

          if (window.tutorialManager) {
            window.tutorialManager.hideSlowMoAlert();
          }
        }
      }
    } else if (this.attackMode === 'guard_practice') {
      // Tập thế thủ: Sư huynh bước tới đấm nhẹ nhàng vào thế thủ của người chơi
      if (player && (Math.abs(player.x - this.x) > 135 || Math.abs(player.y - this.y) > 20)) {
        const dirX = (player.x > this.x) ? 1 : -1;
        const dirY = (player.y > this.y) ? 1 : -1;
        this.vx = (Math.abs(player.x - this.x) > 115) ? dirX * 130 : 0;
        this.vy = (Math.abs(player.y - this.y) > 15) ? dirY * 90 : 0;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.setState('walk');
        return;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
      this.telegraphTimer += dt;
      if (this.telegraphTimer >= 2.0 && player) {
        this.telegraphTimer = 0;
        this.setState('punch', 0.5);
        this.isAttacking = true;
        if (window.combatSystem) {
          window.combatSystem.checkAttackHit(this, player, {
            damage: 1,
            counterType: 'hand',
            isKick: false,
            width: 80,
            height: 45,
            offsetX: 40,
            offsetY: -70
          });
        }
        if (window.audioManager && typeof window.audioManager.playWhoosh === 'function') {
          window.audioManager.playWhoosh();
        }
      } else if (this.telegraphTimer >= 0.5 && this.isAttacking) {
        this.isAttacking = false;
      }
    } else {
      this.isAttacking = false;
    }
  }

  takeDamage(amount, knockback, isCrit) {
    super.takeDamage(amount, knockback, isCrit);
    this.invincibleTimer = 0.05;
    this.hp = this.maxHp;
    this.isDead = false;

    // Khi bị đánh trúng hoặc counter thành công: kết thúc slow-mo ngay lập tức
    if (window.tutorialManager) {
      window.tutorialManager.hideSlowMoAlert();
    }
  }
}

window.TutorialDummy = TutorialDummy;
