/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/enemy.js - AI đối thủ & 4 Boss nhiều giai đoạn
 * Quy ước: z < 0 = trên không. Đòn của địch chỉ gây sát thương ở pha ra đòn (sau thời gian báo trước).
 */

class BaseEnemy {
  constructor(x, y, type = 'thug', name = 'Lính Đánh Thuê') {
    this.id = 'enemy_' + Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.name = name;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.facing = -1;
    this.gravity = 1300;

    this.maxHp = 180;
    this.hp = 180;
    this.speed = 130;
    this.isDead = false;
    this.invincibleTimer = 0;
    this.isAttacking = false;

    this.state = 'idle';
    this.animTime = Math.random() * 3; // lệch pha để lính không nhún nhảy đồng loạt
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.attackCooldown = 0.8 + Math.random() * 0.6;
    this.hitTargets = new Set();

    // ==== Siêu giáp / chống spam: đòn nhẹ không đủ sức hạ thế đứng ====
    this.armorTimer = 0;      // gồng sau khi bị dồn đòn liên tiếp
    this.hitsTaken = 0;       // số đòn ăn liên tiếp trong cửa sổ ngắn
    this.hitWindowTimer = 0;
    this.breakThreshold = 4;  // bị liên tiếp bấy nhiêu đòn thì gồng lên phản công
    this.armorAll = false;    // boss: chỉ đòn quật ngã mới làm chùn bước
    this.followupChance = 0;  // xác suất tung đòn nối tiếp (chuỗi 2 nhịp)
    this.reactCooldown = 0;   // giới hạn nhịp "phản công khi người chơi ra đòn"

    // Khoảng cách ưa thích khi đánh (mỗi lính lệch một chút -> không dồn thành một cục)
    this.preferredDist = 74 + Math.random() * 30;
    // Cửa sổ sơ hở: boss lộ recovery -> người chơi trừng phạt được (sát thương tăng)
    this.weakWindow = 0;
    // Ngăn AI tấn công đồng loạt: chỉ tối đa vài kẻ được quyền ra đòn cùng lúc
    this.attackTokenHeld = false;
    // Giọng nói / câu nói trong trận (boss điện ảnh)
    this.tauntLines = [];
    this.tauntCooldown = 0;

    // Phân biệt va chạm: cờ knockback từ đòn đánh chiến đấu hợp lệ
    this.combatKnockbackTimer = 0;
    this.isKnockedBack = false;
    this._steerTimer = 0;
    this._steerDirY = 0;

    // ===== HỆ THỐNG POISE & CHỐNG VÒNG LẶP KNOCKDOWN CHO BOSS =====
    this.maxPoise = 120;
    this.poise = 120;
    this.poiseRegenDelay = 0;
    this.knockdownImmuneTimer = 0; // Thời gian miễn nhiễm quật ngã lặp lại sau khi đứng dậy

    // ===== HIỆU ỨNG TRẠNG THÁI TỪ VŨ KHÍ (VŨ KHÍ THẬT) =====
    this.stunTimer = 0;            // Thời gian bị choáng (từ Côn / Gậy)
    this.bleedTimer = 0;           // Thời gian duy trì xuất huyết (từ Mã Tấu)
    this.bleedTickTimer = 0;       // Bộ đếm chu kỳ nhảy sát thương xuất huyết (0.8s)
    this.bleedDmg = 0;             // Sát thương mỗi tick xuất huyết
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.invincibleTimer > 0) return;
    // Chống OTG / chém lúc đối thủ đang gục sàn hoặc đang trong animation đứng dậy
    if (this.state === 'knockdown' || this.state === 'getup') return;

    const hit = this.pendingHit || null;
    this.pendingHit = null;
    const weight = hit ? hit.weight : (isKnockdown ? 'heavy' : 'light');

    // ===== HỆ THỐNG QUY TẮC QUẬT NGÃ & POISE DÀNH CHO BOSS =====
    let bossCanKnockdown = false;
    if (this.isBoss) {
      this.poiseRegenDelay = 2.2;
      let poiseDmg = 16;
      if (weight === 'ultimate') poiseDmg = 80;
      else if (hit && hit.isCrit) poiseDmg = 50;
      else if (hit && hit.attackerState === 'air_punch') poiseDmg = 24; // Space + J Phi Quyền gây áp lực poise vừa phải
      else if (isKnockdown) poiseDmg = 42; // Space + K hoặc đòn nặng knockdown
      else if (weight === 'heavy') poiseDmg = 30;

      this.poise = Math.max(0, this.poise - poiseDmg);

      const isWeak = (this.weakWindow > 0);
      const isPoiseBroken = (this.poise <= 0);
      const isGuardBroken = !!this.guardBroken;
      const isUltimate = (weight === 'ultimate');
      const isLegCounter = !!(hit && hit.isLegCounter);

      // Boss chỉ bị quật ngã khi:
      // 1. Không nằm trong khoảng chống quật ngã lặp lại (knockdownImmuneTimer <= 0)
      // 2. VÀ thỏa mãn điều kiện chiến thuật: sơ hở trừng phạt, vỡ thế thủ, đòn tuyệt kỹ, hoặc counter chân
      if (this.knockdownImmuneTimer <= 0 && (isWeak || isPoiseBroken || isGuardBroken || isUltimate || isLegCounter)) {
        bossCanKnockdown = true;
        this.poise = this.maxPoise;
        this.guardBroken = false;
        if (isPoiseBroken && window.effectManager) {
          window.effectManager.addFloatingText('PHÁ THẾ THỦ — QUẬT NGÃ!', this.x, this.y - 165, 'counter');
        }
      } else {
        bossCanKnockdown = false;
        if (isKnockdown && window.effectManager) {
          if (this.knockdownImmuneTimer > 0) {
            window.effectManager.addFloatingText('TRỤ VỮNG!', this.x, this.y - 150, 'block');
          } else {
            window.effectManager.addFloatingText('THẾ ĐỨNG VỮNG (' + Math.round(this.poise) + '/' + this.maxPoise + ')', this.x, this.y - 150, 'stale');
          }
        }
      }
    }

    const effectiveKnockdown = this.isBoss ? bossCanKnockdown : isKnockdown;

    this.hp = Math.max(0, this.hp - amount);
    // Bất tử ngắn tránh trùng frame
    this.invincibleTimer = effectiveKnockdown ? 0.45 : 0.05;

    // Đếm đòn liên tiếp để phát hiện "spam đánh thường"
    if (!hit || !hit.blocked) {
      this.hitsTaken++;
      this.hitWindowTimer = 1.5;
    }

    if (this.hp <= 0) {
      this.isDead = true;
      this.isAttacking = false;
      this.stunTimer = 0;
      this.vx = knockbackX * 1.6;
      this.vz = 200;
      this.combatKnockbackTimer = 0.8;
      this.isKnockedBack = true;
      this.setState('knockdown', 1.0);
      return;
    }

    // ===== SIÊU GIÁP (Poise) =====
    // Đòn quật ngã / bạo kích luôn hạ được thế đứng. Còn lại thì:
    //  - Đang ra đòn: cam kết đòn đánh, đòn nhẹ không ngắt được
    //  - Boss: cực kỳ vững, chỉ quật ngã mới làm chùn
    const interrupt = effectiveKnockdown || (!this.armorAll && (weight === 'ultimate' || (hit && hit.isCrit)));
    if (!interrupt) {
      // Đòn nhạt lực do spam liên tục: không đủ sức làm chùn bước, đối thủ đứng vững ăn đòn
      if (hit && hit.noFlinch) {
        this.vx = knockbackX * 0.35;
        return;
      }
      if (this.armorTimer > 0 || this.isAttacking) {
        // Ăn sát thương nhưng không chùn bước
        this.vx = knockbackX * 0.2;
        return;
      }
      if (hit && !hit.blocked && this.hitsTaken >= this.breakThreshold) {
        // Bị dồn quá nhiều: GỒNG lên — phản công ngay, không chùn
        this.hitsTaken = 0;
        this.armorTimer = 1.1;
        this.attackCooldown = Math.min(this.attackCooldown, 0.12);
        this.vx = knockbackX * 0.2;
        if (window.audioManager) window.audioManager.playBlock();
        if (window.effectManager) {
          window.effectManager.createHitSparks(this.x, this.y - 95, 9, false);
          window.effectManager.addFloatingText('GỒNG ĐỠ!', this.x, this.y - 150, 'block');
        }
        return;
      }
    }

    // Đòn đánh chiến đấu hợp lệ gây knockback: đánh dấu cờ knockback để va đập môi trường
    if (effectiveKnockdown) {
      this.stunTimer = 0;
      this.vx = knockbackX * 1.4;
      this.vz = 220;
      if (Math.abs(knockbackX) > 0) {
        this.combatKnockbackTimer = 0.65;
        this.isKnockedBack = true;
      }
      this.setState('knockdown', 0.8);
    } else {
      this.vx = knockbackX;
      if (Math.abs(knockbackX) > 100) {
        this.combatKnockbackTimer = 0.45;
        this.isKnockedBack = true;
      }
      this.setState('hurt', 0.28);
    }
  }

  // Thuật toán né chướng ngại vật cục bộ (Local Obstacle Avoidance)
  // Kiểm tra đường di chuyển phía trước, nếu có vật cản thì đổi hướng mượt mà, không rung lắc
  avoidObstacles(desiredVx, desiredVy, player) {
    if (!window.propSystem || !window.propSystem.props || window.propSystem.props.length === 0) {
      return { vx: desiredVx, vy: desiredVy };
    }

    const forwardLook = 55;
    const checkX = this.x + Math.sign(desiredVx || this.facing || 1) * forwardLook;
    const checkY = this.y + (desiredVy * 0.15);

    let obstacleFound = null;
    for (const p of window.propSystem.props) {
      if (!p.isSolid) continue;
      const hw = (p.width / 2) + 26;
      const hh = 26;
      if (Math.abs(checkX - p.x) < hw && Math.abs(checkY - p.y) < hh) {
        obstacleFound = p;
        break;
      }
    }

    if (obstacleFound) {
      // Có vật cản phía trước! Tính toán hướng né vòng tránh theo trục Y
      if (this._steerTimer <= 0) {
        this._steerTimer = 0.45; // Giữ hướng né ít nhất 0.45s để tránh rung lắc qua lại
        // Ưu tiên hướng né hợp lý dựa trên vị trí người chơi và ranh giới sàn đấu (510 - 640)
        if (this.y <= obstacleFound.y) {
          this._steerDirY = (this.y > 525) ? -1 : 1;
        } else {
          this._steerDirY = (this.y < 625) ? 1 : -1;
        }
      }
      return {
        vx: desiredVx * 0.25, // Giảm tốc tiến để không đâm sầm vào thùng
        vy: this._steerDirY * this.speed * 0.85
      };
    }

    return { vx: desiredVx, vy: desiredVy };
  }

  setState(newState, duration = 0) {
    // Trạng thái lặp lại mỗi frame (walk/idle) không được reset hoạt ảnh
    if (this.state === newState && duration === 0) return;
    // Trạng thái ra đòn = mọi trạng thái có trong ATTACK_STATES (bao gồm đòn mới của boss)
    const isAtk = (typeof ATTACK_STATES !== 'undefined' && ATTACK_STATES.has(newState)) ||
      ['punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse', 'boss_slash', 'boss_slam'].includes(newState);
    // Kéo dài thời gian gồng để người chơi kịp đọc đòn (dấu hiệu báo trước)
    if (isAtk && duration > 0) duration *= 1.45;
    this.state = newState;
    this.stateTimer = 0;
    this.stateDuration = duration;
    this.animTime = 0;
    this.hitTargets.clear();
    this.isAttacking = isAtk;
  }

  update(dt, player, allEnemies = []) {
    this.animTime += dt;
    this.stateTimer += dt;

    if (this.combatKnockbackTimer > 0) {
      this.combatKnockbackTimer -= dt;
      if (this.combatKnockbackTimer <= 0) this.isKnockedBack = false;
    }
    if (this._steerTimer > 0) this._steerTimer -= dt;

    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.armorTimer > 0) this.armorTimer -= dt;
    if (this.hitWindowTimer > 0) {
      this.hitWindowTimer -= dt;
      if (this.hitWindowTimer <= 0) this.hitsTaken = 0;
    }
    if (this.weakWindow > 0) this.weakWindow -= dt;
    if (this.reactCooldown > 0) this.reactCooldown -= dt;
    if (this.tauntCooldown > 0) this.tauntCooldown -= dt;
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);

    // Hiệu ứng Choáng Váng (Stun từ Côn / Gậy)
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      if (this.state !== 'knockdown' && this.state !== 'getup') {
        this.vx = 0;
        this.vy = 0;
        if (window.effectManager && Math.random() < 0.25) {
          window.effectManager.createEnergySparks(this.x, (this.y || 580) + (this.z || 0) - 85, 2);
        }
      }
      if (this.stunTimer <= 0 && this.state === 'hurt') {
        this.setState('idle');
      }
    }

    // Hiệu ứng Xuất Huyết (Bleed DoT từ Mã Tấu)
    if (this.bleedTimer > 0 && !this.isDead) {
      this.bleedTimer -= dt;
      this.bleedTickTimer = (this.bleedTickTimer || 0) - dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.8;
        const tickDmg = this.bleedDmg || 6;
        this.hp = Math.max(0, this.hp - tickDmg);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🩸`, this.x, (this.y || 580) + (this.z || 0) - 120, 'bleed');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 65, 4, false);
        }
        if (this.hp <= 0) {
          this.isDead = true;
          this.isAttacking = false;
          this.stunTimer = 0;
          this.setState('knockdown', 1.0);
          return;
        }
      }
    }

    if (this.knockdownImmuneTimer > 0) this.knockdownImmuneTimer -= dt;
    if (this.poiseRegenDelay > 0) {
      this.poiseRegenDelay -= dt;
    } else if (this.isBoss && this.poise < this.maxPoise && !this.isDead && this.state !== 'knockdown' && this.state !== 'getup') {
      this.poise = Math.min(this.maxPoise, this.poise + 24 * dt);
    }
    if (this.isBoss && window.uiManager && typeof window.uiManager.updateBossPoise === 'function') {
      window.uiManager.updateBossPoise(this.poise, this.maxPoise, this.weakWindow);
    }

    // Đang bị Ngô Nhất Nghị kẹp cổ: đứng yên chịu trận
    if (!this.isDead && player.grabbedTarget === this && player.state === 'scissor_kick' && !player.scissorHitDone) {
      this.setState('hurt', 0.35);
      return;
    }

    // Giãn cách bầy đàn (Crowd Separation): phân tán thông minh, chống chụm đông đè lên cùng 1 tọa độ
    if (allEnemies && allEnemies.length > 1 && !this.isDead && this.z === 0) {
      for (let i = 0; i < allEnemies.length; i++) {
        const other = allEnemies[i];
        if (other !== this && !other.isDead) {
          const dx = this.x - other.x;
          const dy = (this.y - other.y) * 1.4;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 70) {
            const push = (70 - dist) * 5.2;
            this.x += (dx / dist) * push * dt;
            this.y += (dy / dist) * push * 0.8 * dt;
          } else if (dist === 0) {
            // Trùng khít tọa độ: tách ngẫu nhiên để không xếp lớp lên nhau
            this.x += (Math.random() - 0.5) * 40 * dt;
            this.y += (Math.random() - 0.5) * 24 * dt;
          }
        }
      }
    }

    // Vật lý Z (z âm = trên không, vz > 0 = đang bay lên)
    if (this.z < 0 || this.vz !== 0) {
      this.z -= this.vz * dt;
      this.vz -= this.gravity * dt;
      if (this.z >= 0) {
        this.z = 0;
        this.vz = 0;
        if (window.effectManager && this.state === 'knockdown') window.effectManager.createDust(this.x, this.y, 6);
      }
    }

    const friction = Math.exp(-12 * dt);
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.isDead) return;

    this.y = Math.max(510, Math.min(640, this.y));

    // Giữ kẻ địch trong ranh giới chiến đấu hợp lệ (không chạy ra ngoài map/arena)
    if (window.game && window.game.arenaLocked) {
      this.x = Math.max(window.game.arenaMinX + 28, Math.min(window.game.arenaMaxX - 28, this.x));
    } else if (window.stageManager) {
      this.x = Math.max(28, Math.min(window.stageManager.stageWidth - 28, this.x));
    }

    if (['idle', 'walk'].includes(this.state) && !this.holdFacing && !this.isAttacking) {
      this.facing = (player.x > this.x) ? 1 : -1;
    }

    this.updateAI(dt, player);
  }

  updateAI(dt, player) {
    if (this.stunTimer > 0) {
      this.vx = 0;
      this.vy = 0;
      this.isAttacking = false;
      if (this.state !== 'knockdown' && this.state !== 'getup' && this.state !== 'hurt') {
        this.setState('hurt', this.stunTimer);
      }
      return;
    }
    if (this.state === 'hurt') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }
    if (this.state === 'knockdown') {
      this.invincibleTimer = Math.max(this.invincibleTimer, 0.15);
      if (this.stateTimer >= this.stateDuration && !this.isDead && this.z === 0) {
        this.setState('getup', 0.45);
        this.invincibleTimer = 0.45;
      }
      return;
    }
    if (this.state === 'getup') {
      this.invincibleTimer = Math.max(this.invincibleTimer, 0.05);
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        if (this.isBoss) {
          this.knockdownImmuneTimer = 3.5;
          this.poise = this.maxPoise;
        }
      }
      return;
    }

    // Đang tung đòn: chỉ gây sát thương khi tay/chân đã duỗi ra (khóa hướng trong thời gian ra đòn)
    if (this.isAttacking) {
      if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackPlayer(player);
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        this.attackCooldown = 0.65 + Math.random() * 0.55;
        // Đòn nối tiếp: chuỗi 2 nhịp như võ sĩ thật — buộc người chơi phải đỡ/né
        if (this.followupChance > 0 && !player.isDead && Math.random() < this.followupChance &&
            Math.abs(player.x - this.x) < 160 && Math.abs(player.y - this.y) < 52) {
          this.attackCooldown = 0.14;
        }
      }
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy * 1.4);
    const targetDist = this.preferredDist || 78;

    // ĐỌC HÀNH VI NGƯỜI CHƠI (CHẾ ĐỘ ĐẤU VÕ CỦA BOSS — không đọc trước input tương lai)
    if (this.isBoss && window.combatSystem && window.combatSystem.playerMoveLog) {
      const log = window.combatSystem.playerMoveLog;
      const recent = log.slice(-6);
      let fkCount = 0;
      for (const m of recent) if (m === 'flying_kick') fkCount++;

      // Nhận diện thói quen: người chơi spam Space + K liên tục
      if (fkCount >= 2 && player.state === 'flying_kick' && Math.abs(dx) < 220 && Math.abs(dy) < 55) {
        if (Math.random() < 0.45 && this.reactCooldown <= 0) {
          this.reactCooldown = 1.5;
          // Dạt trục Y hoặc lùi thế phòng thủ để tránh đòn phi cước
          this.vx = -this.facing * this.speed * 0.75;
          this.vy = (dy >= 0 ? -1 : 1) * 75;
          this.setState('walk');
          return;
        }
      }

      // Trừng phạt sơ hở khi người chơi tiếp đất whiff (đánh hụt) hoặc khi người chơi lặp lại thói quen spam phi cước (fkCount >= 2)
      // Nếu người chơi đá trúng đích hợp lệ (không spam), không bị đối thủ trừng phạt vô lý
      const isRepeatedSpam = (fkCount >= 2);
      const isWhiffLanding = (!player.kickHasHit && !player.airPunchHasHit);
      if (player.state === 'landing' && (isRepeatedSpam || isWhiffLanding) && Math.abs(dx) < 135 && Math.abs(dy) < 45 && this.attackCooldown > 0.1) {
        this.attackCooldown = 0.08;
      }
    }


    // Phản ứng: người chơi đang cam kết ra đòn ở cự ly gần -> tranh thủ phản công
    const playerAttacking = (typeof ATTACK_STATES !== 'undefined') && ATTACK_STATES.has(player.state);
    if (playerAttacking && this.reactCooldown <= 0 && !player.isDead && Math.abs(dx) < 125 && Math.abs(dy) < 46) {
      this.reactCooldown = 1.7 + Math.random() * 0.9;
      this.attackCooldown = Math.min(this.attackCooldown, 0.18);
    }

    // Di chuyển có kỷ luật: Tiến thăm dò hoặc Áp sát có kiểm soát khi người chơi liên tục lùi
    if (dist > targetDist + 18) {
      const angle = Math.atan2(dy, dx);
      // Nếu người chơi liên tục chạy lùi: Boss tăng áp lực có kiểm soát (không teleport, không vô lý)
      const isPlayerFleeing = (player.state === 'run' && (player.x - this.x) * player.facing > 0);
      const moveSpeed = isPlayerFleeing ? this.speed * 1.2 : this.speed;

      const rawVx = Math.cos(angle) * moveSpeed;
      const rawVy = Math.sin(angle) * moveSpeed * 0.7;
      const nav = this.avoidObstacles(rawVx, rawVy, player);
      this.vx = nav.vx;
      this.vy = nav.vy;
      this.setState('walk');
    } else if (dist < targetDist - 24) {
      // Lùi giữ khoảng cách (Backpedal — vẫn quay mặt về phía đối thủ)
      const angle = Math.atan2(-dy, -dx);
      const rawVx = Math.cos(angle) * this.speed * 0.55;
      const rawVy = Math.sin(angle) * this.speed * 0.4;
      const nav = this.avoidObstacles(rawVx, rawVy, player);
      this.vx = nav.vx;
      this.vy = nav.vy;
      this.facing = (player.x > this.x) ? 1 : -1;
      this.setState('walk');
    } else if (this.attackCooldown <= 0 && !player.isDead && Math.abs(dy) < 40) {
      // Xin "suất" ra đòn: chống AI dồn cục cùng tấn công một lúc
      if (window.game && !window.game.requestAttackToken(this)) {
        this.setState('idle');
      } else {
        this.startAttackSequence(player);
      }
    } else {
      this.setState('idle');
    }
  }

  startAttackSequence(player) {
    this.facing = (player.x > this.x) ? 1 : -1;
    this.setState('punch_straight', 0.28);
    this.vx = this.facing * 90;
  }

  // Boss/phụ huynh gọi để nói một câu giữa trận (dùng floating text)
  taunt(text) {
    if (!text || this.isDead) return;
    if (window.effectManager) window.effectManager.addFloatingText(text, this.x, this.y - 170, 'taunt');
    if (window.audioManager) window.audioManager.playClick();
  }

  // Đánh dấu cửa phản công (weak point window)
  openWeakWindow(duration = 1.0) {
    this.weakWindow = duration;
  }

  // Chuyển giai đoạn boss (HUD + banner + âm thanh + rung)
  setPhase(n) {
    this.phase = n;
    // Càng về giai đoạn sau càng tung đòn dồn dập
    this.followupChance = Math.max(this.followupChance || 0, 0.18 + 0.14 * n);
    if (window.uiManager) {
      window.uiManager.setBossPhase(n);
      window.uiManager.showAlertBanner('GIAI ĐOẠN ' + n);
    }
    if (window.audioManager) window.audioManager.playWarning();
    if (window.effectManager) {
      window.effectManager.triggerFlash(n >= 3 ? '#ff2a4b' : '#ffd700', 0.45);
      window.effectManager.triggerScreenShake(n >= 3 ? 14 : 9, 0.35);
    }
  }

  checkAttackPlayer(player) {
    const isKick = /kick|sweep/.test(this.state || '');
    const attackData = {
      damage: 21,
      offsetX: 52,
      offsetY: -80,
      width: 60,
      height: 45,
      knockback: 5,
      isKick,
      counterType: isKick ? 'leg' : 'hand'
    };
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// VÕ SĨ THÂN PHÁP (hay lùi né khi bị dồn đòn)
// ============================================================================
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
    window.combatSystem.checkAttackHit(this, player, attackData);
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
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// BOSS MÀN 1: ĐAO THỦ HẮC LANG (3 GIAI ĐOẠN — THĂM DÒ / SONG ĐAO / CUỒNG SÁT)
// ============================================================================
class BossHacLang extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_haclang', 'Đao Thủ Hắc Lang');
    this.maxHp = 1350;
    this.hp = 1350;
    this.speed = 175;
    this.phase = 1;
    this.isBoss = true;
    this.armorAll = true;
    this.followupChance = 0.25;
    this.preferredDist = 85;
    this.diveAttackPending = false;
    this.maxPoise = 130;
    this.poise = 130;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    super.takeDamage(amount, knockbackX * 0.35, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;

    // Chuyển giai đoạn 2 (33% - 66% HP)
    if (this.hp < this.maxHp * 0.66 && this.phase === 1) {
      this.phase = 2;
      this.speed = 225;
      this.followupChance = 0.45;
      if (window.audioManager) window.audioManager.playWarning();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ff0033', 0.5);
        window.effectManager.triggerScreenShake(10, 0.3);
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(2);
        window.uiManager.showAlertBanner('HẮC LANG: SONG ĐAO PHONG MA!');
      }
    }
    // Chuyển giai đoạn 3 (<33% HP)
    else if (this.hp < this.maxHp * 0.33 && this.phase === 2) {
      this.phase = 3;
      this.speed = 255;
      this.followupChance = 0.65;
      if (window.audioManager) {
        window.audioManager.playWarning();
        window.audioManager.playGong(0.5);
      }
      if (window.effectManager) {
        window.effectManager.triggerFlash('#991b1b', 0.65);
        window.effectManager.triggerScreenShake(15, 0.5);
        window.effectManager.createDust(this.x, this.y, 25, 90);
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(3);
        window.uiManager.showAlertBanner('HẮC LANG: CUỒNG ĐAO HUYẾT TRẬN!');
      }
      // Sinh thêm một lính hỗ trợ
      if (window.game && window.game.enemies) {
        const minion = (typeof EnemyBlade !== 'undefined')
          ? new EnemyBlade(this.x + 180, this.y, 'huavudai')
          : new BaseEnemy(this.x + 180, this.y, 'thug', 'Lính Đao Phủ');
        window.game.enemies.push(minion);
      }
    }
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();

    if (this.phase === 3) {
      // Giai đoạn 3: Nhảy chém cắm đao xuống sàn tạo AoE chấn động (UNCOUNTERABLE — Phải nhảy hoặc né!)
      if (Math.random() < 0.48) {
        this.vz = 360;
        this.z = -2;
        this.vx = this.facing * 340;
        this.diveAttackPending = true;
        this.setState('flying_kick', 0.62);
        if (window.effectManager) {
          window.effectManager.addGhostTrail(this, 'rgba(239, 68, 68, 0.85)');
          window.effectManager.triggerFlash('#ef4444', 0.25);
          window.effectManager.addFloatingText('CẢNH BÁO ĐÒN ĐÁP SÀN!', this.x, this.y - 170, 'warn');
        }
        return;
      }
      // Chuỗi cuồng đao chém dồn (Counter tay được)
      this.vx = this.facing * 360;
      this.setState('punch_hook', 0.28);
    } else if (this.phase === 2) {
      // Giai đoạn 2: Lướt chém song đao hoặc đá tống
      this.vx = this.facing * 290;
      this.setState(Math.random() < 0.5 ? 'kick_push' : 'punch_hook', 0.32);
      if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(239, 68, 68, 0.45)');
    } else {
      // Giai đoạn 1: Đao đơn thăm dò nhịp (Counter tay)
      this.vx = this.facing * 160;
      this.setState('punch_straight', 0.35);
    }
  }

  update(dt, player) {
    // Khi chạm đất sau cú chém cắm đao (Phase 3 Dive Attack)
    if (this.diveAttackPending && this.z >= 0) {
      this.diveAttackPending = false;
      this.z = 0; this.vz = 0;
      if (window.audioManager) window.audioManager.playHeavyHit();
      if (window.effectManager) {
        window.effectManager.createShockRing(this.x, this.y, '#ef4444');
        window.effectManager.createGroundCrack(this.x, this.y, 110, '#dc2626');
        window.effectManager.createDust(this.x, this.y, 16, 75);
        window.effectManager.triggerScreenShake(12, 0.35);
      }
      // Đòn AoE đập sàn: người chơi ở trên mặt đất nhận sát thương (nhảy lên là né được)
      if (player.z === 0 && Math.abs(player.x - this.x) < 140 && Math.abs(player.y - this.y) < 55) {
        player.takeDamage(56, this.facing * 10, true);
      }
      // CỬA SỔ PHẢN CÔNG: Đao bị găm xuống sàn 0.95s -> người chơi trừng phạt!
      this.weakWindow = 0.95;
      if (window.effectManager) {
        window.effectManager.addFloatingText('ĐAO GĂM SÀN — PHẢN CÔNG!', this.x, this.y - 150, 'counter');
      }
    }
    super.update(dt, player);
  }

  checkAttackPlayer(player) {
    const isKick = this.state === 'kick_push';
    const damage = (this.phase === 3) ? 58 : ((this.phase === 2) ? 46 : 34);
    const attackData = {
      damage,
      offsetX: 70, offsetY: -85,
      width: (this.phase === 3) ? 98 : 85, height: 60,
      knockback: (this.phase === 3) ? 11 : 7,
      knockdown: this.phase >= 2,
      isKick,
      counterType: isKick ? 'leg' : 'hand',
      weight: (this.phase === 3) ? 'ultimate' : (this.phase === 2 ? 'heavy' : 'light')
    };
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// BOSS MÀN 2: VÕ SĨ THIẾT QUYỀN (3 GIAI ĐOẠN — THÉP ĐỠ / ĐỊA CHẤN / BẤT HOẠI KIM CANG)
// ============================================================================
class BossThietQuyen extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_thietquyen', 'Võ Sĩ Thiết Quyền');
    this.maxHp = 2000;
    this.hp = 2000;
    this.speed = 130;
    this.phase = 1;
    this.isBoss = true;
    this.slamPending = 0;
    this.armorAll = true;
    this.followupChance = 0.3;
    this.preferredDist = 72;
    this.maxPoise = 180;
    this.poise = 180;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    // Phase 3: Giáp bọc thép giảm thêm 25% sát thương nhận vào
    if (this.phase === 3 && !window.combatSystem.isCounterWindow && !this.weakWindow) {
      amount = Math.round(amount * 0.75);
    }

    super.takeDamage(amount, knockbackX * 0.25, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;

    // Chuyển giai đoạn 2 (33% - 66% HP)
    if (this.hp < this.maxHp * 0.66 && this.phase === 1) {
      this.phase = 2;
      this.speed = 150;
      this.followupChance = 0.5;
      if (window.audioManager) window.audioManager.playWarning();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ffd700', 0.5);
        window.effectManager.triggerScreenShake(12, 0.4);
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(2);
        window.uiManager.showAlertBanner('THIẾT QUYỀN: ĐỊA CHẤN TẦM RỘNG!');
      }
    }
    // Chuyển giai đoạn 3 (<33% HP)
    else if (this.hp < this.maxHp * 0.33 && this.phase === 2) {
      this.phase = 3;
      this.speed = 170;
      this.followupChance = 0.75;
      if (window.audioManager) {
        window.audioManager.playWarning();
        window.audioManager.playExplosion();
      }
      if (window.effectManager) {
        window.effectManager.triggerFlash('#f59e0b', 0.7);
        window.effectManager.triggerScreenShake(18, 0.6);
        window.effectManager.createShockRing(this.x, this.y, '#ffd700');
        window.effectManager.createShockRing(this.x, this.y, '#ffffff');
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(3);
        window.uiManager.showAlertBanner('THIẾT QUYỀN: BẤT HOẠI KIM CANG!');
      }
      // Rung chấn làm hư hại các thùng hàng xung quanh
      if (window.propSystem && window.propSystem.props) {
        for (const p of window.propSystem.props) {
          if (p.isSolid && Math.abs(p.x - this.x) < 320) p.takeDamage(30, Math.sign(p.x - this.x), 'heavy');
        }
      }
    }
  }

  update(dt, player) {
    // Đòn đập sàn địa chấn: UNCOUNTERABLE — nhảy lên là né được
    if (this.slamPending > 0) {
      this.slamPending -= dt;
      if (this.slamPending <= 0 && !this.isDead) {
        if (window.effectManager) {
          window.effectManager.createShockRing(this.x, this.y, '#ffd700');
          window.effectManager.createDust(this.x, this.y, 18, 120);
          window.effectManager.createGroundCrack(this.x, this.y, 110, '#ffd700');
          window.effectManager.triggerScreenShake(12, 0.35);
        }
        if (window.audioManager) window.audioManager.playHeavyHit();
        if (player.z === 0 && Math.abs(player.x - this.x) < 195 && Math.abs(player.y - this.y) < 60) {
          player.takeDamage(55, Math.sign(player.x - this.x) * 9, true);
        }
        // Sau cú đập sàn, mở cửa sổ sơ hở 0.85s để người chơi phản công
        this.weakWindow = 0.85;
        if (window.effectManager) {
          window.effectManager.addFloatingText('SƠ HỞ SAU ĐỊA CHẤN!', this.x, this.y - 150, 'counter');
        }
        // Thùng hàng gần chấn động nhận sát thương
        if (window.propSystem) {
          window.propSystem.checkAttackHit(this, { damage: 40, weight: 'heavy', width: 220, height: 70, offsetX: 0, offsetY: -30 });
        }
      }
    }
    super.update(dt, player);
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();

    if (this.phase === 3) {
      // Giai đoạn 3: Cuồng bạo 3 hit liên tiếp phá thủ
      this.setState('punch_hook', 0.3);
      this.vx = this.facing * 200;
      if (Math.random() < 0.5) {
        this.slamPending = 0.3;
      }
    } else if (this.phase === 2) {
      if (Math.random() < 0.55) {
        this.setState('kick_push', 0.45);
        this.slamPending = 0.45 * 1.45 * 0.5;
      } else {
        this.setState('punch_hook', 0.35);
        this.vx = this.facing * 130;
      }
    } else {
      this.setState('punch_straight', 0.38);
      this.vx = this.facing * 100;
    }
  }

  checkAttackPlayer(player) {
    const isKick = this.state === 'kick_push';
    const damage = (this.phase === 3) ? 72 : ((this.phase === 2) ? 58 : 42);
    const attackData = {
      damage,
      offsetX: 72, offsetY: -85,
      width: 96, height: 65,
      knockback: (this.phase === 3) ? 12 : 8,
      knockdown: this.phase >= 2,
      isKick,
      counterType: isKick ? 'leg' : 'hand',
      weight: (this.phase === 3) ? 'ultimate' : 'heavy'
    };
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// BOSS MÀN 3: ĐỘI TRƯỞNG HUYẾT ẢNH (3 GIAI ĐOẠN — ÁM SÁT / TÀN ẢNH / PHẢN TRẢM)
// ============================================================================
class BossHuyetAnh extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_huyetanh', 'Đội Trưởng Huyết Ảnh');
    this.maxHp = 2600;
    this.hp = 2600;
    this.speed = 210;
    this.phase = 1;
    this.isBoss = true;
    this.armorAll = true;
    this.followupChance = 0.35;
    this.counterStanceTimer = 0;
    this.preferredDist = 95;
    this.maxPoise = 120;
    this.poise = 120;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    // Nếu người chơi bất cẩn đánh vào lúc Huyết Ảnh đang trong tư thế Phản Trảm (Phase 3)
    if (this.phase === 3 && this.counterStanceTimer > 0) {
      this.counterStanceTimer = 0;
      if (window.audioManager) window.audioManager.playPerfectDodge();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ff0055', 0.4);
        window.effectManager.triggerSlowMo(0.25, 0.3);
        window.effectManager.addFloatingText('PHẢN TRẢM — DỊCH CHUYỂN!', this.x, this.y - 150, 'counter');
      }
      // Dịch chuyển ra sau lưng người chơi và chém chí mạng!
      const p = window.game && window.game.player;
      if (p) {
        this.x = p.x - p.facing * 55;
        this.facing = p.facing;
        this.setState('punch_hook', 0.25);
        p.takeDamage(65, p.facing * 8, true);
      }
      return;
    }

    // Giai đoạn 3 phòng thủ chặt: chỉ nhận 60% sát thương trừ khi phản đòn
    let actual = amount;
    if (this.phase === 3 && !window.combatSystem.isCounterWindow) actual = Math.round(amount * 0.6);

    super.takeDamage(actual, knockbackX * 0.3, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;

    if (this.hp < this.maxHp * 0.66 && this.phase === 1) {
      this.phase = 2;
      this.speed = 270;
      this.followupChance = 0.52;
      if (window.audioManager) window.audioManager.playWarning();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#c9184a', 0.5);
        window.effectManager.triggerScreenShake(11, 0.35);
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(2);
        window.uiManager.showAlertBanner('HUYẾT ẢNH: HUYẾT VŨ PHÂN THÂN!');
      }
    } else if (this.hp < this.maxHp * 0.33 && this.phase === 2) {
      this.phase = 3;
      this.speed = 240;
      this.followupChance = 0.7;
      if (window.audioManager) {
        window.audioManager.playWarning();
        window.audioManager.playGong(0.6);
      }
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ff0055', 0.65);
        window.effectManager.triggerScreenShake(16, 0.5);
        window.effectManager.createDust(this.x, this.y, 30, 100);
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(3);
        window.uiManager.showAlertBanner('HUYẾT ẢNH: HUYẾT NGỤC PHẢN TRẢM!');
      }
    }
  }

  update(dt, player) {
    if (this.counterStanceTimer > 0) {
      this.counterStanceTimer -= dt;
      if (this.counterStanceTimer <= 0 && this.state === 'guard') {
        this.setState('idle');
        // Sau khi hạ thế thủ -> lộ sơ hở 0.8s!
        this.weakWindow = 0.8;
        if (window.effectManager) {
          window.effectManager.addFloatingText('SƠ HỞ — TẤN CÔNG!', this.x, this.y - 145, 'counter');
        }
      }
    }
    super.update(dt, player);
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();

    if (this.phase === 3) {
      // 35% cơ hội vào thế thủ Phản Trảm (dụ người chơi đánh trúng)
      if (Math.random() < 0.35 && this.counterStanceTimer <= 0) {
        this.counterStanceTimer = 1.1;
        this.setState('guard', 1.1);
        if (window.effectManager) {
          window.effectManager.addFloatingText('THỦ THẾ PHẢN TRẢM!', this.x, this.y - 150, 'warn');
        }
        return;
      }
      this.vx = this.facing * 380;
      this.setState('punch_straight', 0.26);
      if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(255, 0, 85, 0.75)');
    } else if (this.phase === 2) {
      this.vx = this.facing * 360;
      this.setState('kick_roundhouse', 0.34);
      if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(255, 0, 85, 0.55)');
    } else {
      this.setState('punch_hook', 0.32);
      this.vx = this.facing * 160;
    }
  }

  checkAttackPlayer(player) {
    const isKick = this.state === 'kick_roundhouse';
    const damage = (this.phase === 3) ? 75 : ((this.phase === 2) ? 58 : 44);
    const attackData = {
      damage,
      offsetX: 72, offsetY: -85,
      width: 92, height: 60,
      knockback: (this.phase === 3) ? 10 : 7,
      knockdown: this.phase >= 2,
      isKick,
      counterType: isKick ? 'leg' : 'hand',
      weight: (this.phase === 3) ? 'ultimate' : 'heavy'
    };
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// BOSS MÀN 4: LONG VƯƠNG (3 GIAI ĐOẠN — LONG CHƯỞNG / KIM LONG / CUỒNG LONG QUYẾT TỬ)
// ============================================================================
class BossLongVuong extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_longvuong', 'Long Vương');
    this.maxHp = 3400;
    this.hp = 3400;
    this.speed = 220;
    this.phase = 1;
    this.isBoss = true;
    this.armorAll = true;
    this.followupChance = 0.3;
    this.preferredDist = 110;
    this.maxPoise = 160;
    this.poise = 160;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    super.takeDamage(amount, knockbackX * 0.18, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;

    if (this.hp < this.maxHp * 0.66 && this.phase === 1) {
      this.phase = 2;
      this.speed = 270;
      this.followupChance = 0.52;
      if (window.audioManager) {
        window.audioManager.playWarning();
        window.audioManager.playGong(0.6);
      }
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ffd700', 0.6);
        window.effectManager.triggerScreenShake(14, 0.4);
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(2);
        window.uiManager.showAlertBanner('LONG VƯƠNG: KIM LONG XUẤT HẢI!');
      }
      // Sinh hộ vệ khiên giáp bảo vệ
      if (window.game && window.game.enemies) {
        const guard = (typeof EnemyShield !== 'undefined')
          ? new EnemyShield(this.x + 140, this.y, 'trieu')
          : new BaseEnemy(this.x + 140, this.y, 'guard', 'Hộ Vệ Hoàng Kim');
        window.game.enemies.push(guard);
      }
    } else if (this.hp < this.maxHp * 0.33 && this.phase === 2) {
      this.phase = 3;
      this.speed = 310;
      this.followupChance = 0.75;
      if (window.audioManager) window.audioManager.playUltimateBurst();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ffffff', 0.7);
        window.effectManager.triggerScreenShake(20, 0.7);
        window.effectManager.createGroundCrack(this.x, this.y, 140, '#ffd700');
      }
      if (window.uiManager) {
        window.uiManager.setBossPhase(3);
        window.uiManager.showAlertBanner('LONG VƯƠNG: CUỒNG LONG QUYẾT TỬ!');
      }
    }
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();

    if (this.phase === 3) {
      // Giai đoạn 3: Cuồng Long Liên Hoàn phá sàn (UNCOUNTERABLE — đòn tối thượng)
      this.vx = this.facing * 440;
      this.setState('kick_roundhouse', 0.38);
      if (window.effectManager) {
        window.effectManager.addGhostTrail(this, 'rgba(255, 215, 0, 0.85)');
        window.effectManager.createShockRing(this.x + this.facing * 50, this.y, '#ffd700');
        window.effectManager.createGroundCrack(this.x + this.facing * 50, this.y, 105, '#ffd700');
        window.effectManager.addFloatingText('CUỒNG LONG — NÉ NGAY!', this.x, this.y - 170, 'warn');
      }
      // Cửa sổ sơ hở sau cú đá cuồng long
      this.weakWindow = 0.95;
    } else if (this.phase === 2) {
      // Giai đoạn 2: Kim Long chưởng phóng sóng khí
      this.vx = this.facing * 300;
      this.setState('punch_straight', 0.28);
      if (window.effectManager) {
        window.effectManager.createShockRing(this.x + this.facing * 40, this.y, '#facc15');
      }
      if (window.game && typeof window.game.spawnProjectile === 'function' && Math.random() < 0.4) {
        window.game.spawnProjectile(this.x + this.facing * 30, this.y - 60, this.facing, 480, 32, this);
      }
    } else {
      // Giai đoạn 1: Đẩy Long Chưởng cự ly an toàn
      this.vx = this.facing * 190;
      this.setState('punch_hook', 0.32);
    }
  }

  checkAttackPlayer(player) {
    const isKick = this.state === 'kick_roundhouse';
    const isCuongLong = (this.phase === 3 && isKick);
    const damage = (this.phase === 3) ? 92 : ((this.phase === 2) ? 68 : 50);
    const attackData = {
      damage,
      offsetX: 76,
      offsetY: -85,
      width: (this.phase === 3) ? 110 : 96,
      height: 65,
      knockback: (this.phase === 3) ? 14 : 9,
      knockdown: this.phase >= 2,
      unblockable: isCuongLong,
      uncounterable: isCuongLong,
      isKick,
      counterType: isCuongLong ? 'none' : (isKick ? 'leg' : 'hand'),
      weight: (this.phase === 3) ? 'ultimate' : 'heavy'
    };
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

window.BaseEnemy = BaseEnemy;
window.EnemyDodger = EnemyDodger;
window.EnemyGuard = EnemyGuard;
window.BossHacLang = BossHacLang;
window.BossThietQuyen = BossThietQuyen;
window.BossHuyetAnh = BossHuyetAnh;
window.BossLongVuong = BossLongVuong;
