/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/bosses2.js - 6 boss điện ảnh mới (mỗi boss một cơ chế chiến đấu riêng)
 *
 *  - BossBichlam    : áp sát liên tục + hiệp ước (không cần giết)
 *  - BossDungHai    : nhịp bất quy tắc, hủy đòn dối, ném đồ môi trường, hội thoại giữa trận
 *  - BossHoangAnh   : chậm nhưng mạnh, super armor, AoE mặt đất, chuỗi liên hoàn 3 đòn
 *  - BossDinhAn     : phòng thủ chắc, chuỗi đòn nặng, bị phá thế bởi unblockable
 *  - BossVinhTam    : parry phản đòn, triệu hồi cận vệ, 3 giai đoạn có sơ hở rõ
 *  - BossGiangManh  : quan sát thói quen chiến đấu, trừng phạt combo lặp, né ngang + áp sát
 */

const CHAIN_HOANG_ANN = ['boss_chain1', 'boss_chain2', 'boss_chain3'];

// ============================================================================
// ĐÌNH BÍCH LÂM — Trận thử thách ở Bến Cảng (hạ 30% máu -> hiệp ước)
// ============================================================================
class BossBichlam extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_bichlam', 'Đình Bích Lâm');
    this.maxHp = 2600;
    this.hp = 2600;
    this.speed = 245;
    this.phase = 1;
    this.preferredDist = 70;
    this.isBoss = true;
    this.truceEnabled = true;
    this.truceAt = 0.3;
    this.truceTriggered = false;
    this.tauntLines = [
      'Nhanh đấy... nhưng vẫn chưa đủ!',
      'Đứng yên lại đi, tôi không cắn đâu!',
      'Hứa Vũ Đại trả bao nhiêu cho anh?'
    ];
    this.comboCount = 0;
    this.maxPoise = 120;
    this.poise = 120;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    super.takeDamage(amount, knockbackX * 0.4, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;
    if (this.hp < this.maxHp * 0.55 && this.phase === 1) this.setPhase(2);
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();
    const r = Math.random();
    if (this.comboCount >= 2 || r < 0.28) {
      // Đẩy lùi khi bị dồn — phản công khoảng cách
      this.setState('kick_push', 0.34);
      this.vx = this.facing * 220;
      this.comboCount = 0;
      this.attackCooldown = 0.55 + Math.random() * 0.5;
    } else if (r < 0.55) {
      this.setState('boss_upper', 0.34);
      this.vx = this.facing * 240;
      this.comboCount++;
      this.attackCooldown = 0.35 + Math.random() * 0.3;
    } else {
      this.setState('punch_hook', 0.3);
      this.vx = this.facing * 260;
      this.comboCount++;
      this.attackCooldown = 0.3 + Math.random() * 0.35;
    }
    if (this.tauntCooldown <= 0 && Math.random() < 0.22) {
      this.taunt(this.tauntLines[Math.floor(Math.random() * this.tauntLines.length)]);
      this.tauntCooldown = 7;
    }
  }

  checkAttackPlayer(player) {
    const d = this.phase === 2 ? 40 : 34;
    let attackData;
    if (this.state === 'boss_upper') {
      attackData = { damage: d + 10, offsetX: 58, offsetY: -80, width: 78, height: 70, knockback: 10, knockdown: true, counterType: 'hand', weight: 'heavy' };
    } else if (this.state === 'kick_push') {
      attackData = { damage: d, offsetX: 62, offsetY: -60, width: 90, height: 55, knockback: 16, isKick: true, counterType: 'leg', weight: 'heavy' };
    } else {
      attackData = { damage: d, offsetX: 54, offsetY: -82, width: 70, height: 55, knockback: 8, counterType: 'hand', weight: 'light' };
    }
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// PHÓ DUNG HẢI — Nhịp bất quy tắc, hủy đòn dối, ném đồ, hội thoại tâm lý
// ============================================================================
class BossDungHai extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_dunghai', 'Phó Dung Hải');
    this.maxHp = 3000;
    this.hp = 3000;
    this.speed = 235;
    this.phase = 1;
    this.preferredDist = 105;
    this.isBoss = true;
    this.feintActive = false;
    this.pendingThrow = false;
    this.motiveRevealed = false;
    this.tauntLines = [
      'Anh vẫn nghĩ Hứa Vũ Đại nói thật à?',
      'Người sửa hồ sơ không phải tôi.',
      'Mộc Đăng ký quyết định khai trừ tôi... đọc lại đi.',
      'Trung thành với kẻ nói dối — đó là kỹ năng hay thói quen?'
    ];
    this.maxPoise = 150;
    this.poise = 150;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    super.takeDamage(amount, knockbackX * 0.4, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;
    if (this.hp < this.maxHp * 0.65 && this.phase === 1) this.setPhase(2);
    else if (this.hp < this.maxHp * 0.35 && this.phase === 2) {
      this.setPhase(3);
      this.revealMotive();
    }
  }

  // Giai đoạn cuối: hé lộ động cơ thật sự qua hội thoại giữa trận (gameplay event)
  revealMotive() {
    if (this.motiveRevealed) return;
    this.motiveRevealed = true;
    const self = this;
    if (window.game && window.game.playInlineDialogue) {
      window.game.playInlineDialogue([
        { speaker: 'PHÓ DUNG HẢI', role: 'KẺ BỊ KHAI TRỪ', avatar: 'dunghai',
          text: 'Hai mươi năm trước, chính cha của Mộc Đăng tạo ra hồ sơ này... và cha tôi ký tên xóa nó.' },
        { speaker: 'PHÓ DUNG HẢI', role: 'KẺ BỊ KHAI TRỪ', avatar: 'dunghai',
          text: 'Tôi không bán đứng ai, Nghị. Tôi chỉ là kẻ duy nhất còn giữ bản gốc — nên họ biến tôi thành phản trắc.' },
        { speaker: 'NGÔ NHẤT NGHỊ', role: 'SÁT THẦN VIỆT VÕ ĐẠO', avatar: 'nghi',
          text: 'Nếu anh nói thật... thì cả hai chúng ta đều đang đánh nhau vì một lời nói dối.' }
      ], () => {
        self.taunt('Đánh tiếp đi. Lần này cậu biết mình đang đánh vì cái gì.');
        if (window.effectManager) window.effectManager.triggerFlash('#a3e635', 0.5);
      });
    }
  }

  // Nhịp tấn công KHÔNG cố định — thời gian hồi rộng, đôi khi rất nhanh
  updateAI(dt, player) {
    if (['hurt', 'knockdown', 'getup'].includes(this.state)) {
      super.updateAI(dt, player);
      return;
    }

    if (this.state === 'boss_taunt') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        this.attackCooldown = 0.3 + Math.random() * 0.6;
      }
      return;
    }

    if (this.state === 'dodge') {
      // Hủy đòn dối: vừa né xong là lao vào bằng đòn thật
      if (this.stateTimer >= this.stateDuration) {
        this.setState('boss_stab', 0.3);
        this.vx = this.facing * 320;
        if (window.audioManager) window.audioManager.playWhoosh();
      }
      return;
    }

    if (this.isAttacking && this.stateTimer >= this.stateDuration) {
      const wasThrow = this.state === 'boss_throw';
      this.setState('idle');
      // Hồi siêu nhanh -> siêu chậm, hoàn toàn ngẫu nhiên
      this.attackCooldown = 0.35 + Math.random() * (this.phase >= 2 ? 1.2 : 1.8);
      if (wasThrow) this.openWeakWindow(0.7);
      else if (Math.random() < 0.45) this.openWeakWindow(0.65);
      return;
    }

    super.updateAI(dt, player);
  }

  startAttackSequence(player) {
    const r = Math.random();

    // Dừng lại nói chuyện (yếu tố tâm lý — hắn đứng yên nên trừng phạt được)
    if (this.tauntCooldown <= 0 && r < 0.18) {
      this.setState('boss_taunt', 1.3);
      this.taunt(this.tauntLines[Math.floor(Math.random() * this.tauntLines.length)]);
      this.tauntCooldown = 8;
      return;
    }

    // Ném đồ môi trường (cấu rỉa từ xa)
    if (r < 0.34) {
      this.setState('boss_throw', 0.5);
      this.pendingThrow = true;
      if (window.audioManager) window.audioManager.playWhoosh();
      return;
    }

    // Hủy đòn dối: vung nửa chừng rồi biến mất sang ngang
    if (r < 0.58) {
      this.setState('punch_hook', 0.42);
      this.feintActive = true;
      return;
    }

    if (r < 0.8) {
      this.setState('boss_stab', 0.32);
      this.vx = this.facing * 300;
    } else {
      this.setState('kick_roundhouse', 0.36);
      this.vx = this.facing * 200;
    }
    if (window.audioManager) window.audioManager.playWarning();
  }

  update(dt, player, allEnemies = []) {
    // Hủy đòn dối ngay giữa chuỗi ra đòn
    if (this.feintActive && this.isAttacking && this.stateTimer >= this.stateDuration * 0.4) {
      this.feintActive = false;
      this.setState('dodge', 0.26);
      this.vy = (Math.random() < 0.5 ? -1 : 1) * 190;
      this.vx = -this.facing * 160;
      if (window.audioManager) window.audioManager.playDodge();
      if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(163,230,53,0.55)');
    }

    // Ném trúng lúc активный khung hình
    if (this.pendingThrow && window.AnimUtil && AnimUtil.isActive(this)) {
      this.pendingThrow = false;
      if (window.game && window.game.spawnProjectile) {
        window.game.spawnProjectile(this.x + this.facing * 40, this.y - 90, this.facing, 520, 34, this);
      }
    }

    super.update(dt, player, allEnemies);
  }

  checkAttackPlayer(player) {
    const d = this.phase === 3 ? 52 : (this.phase === 2 ? 44 : 38);
    let attackData;
    switch (this.state) {
      case 'boss_stab':
        attackData = { damage: d, offsetX: 66, offsetY: -80, width: 78, height: 50, knockback: 12, counterType: 'hand', weight: 'heavy' }; break;
      case 'kick_roundhouse':
        attackData = { damage: d + 6, offsetX: 64, offsetY: -80, width: 92, height: 60, knockback: 14, knockdown: true, isKick: true, counterType: 'leg', weight: 'heavy' }; break;
      case 'punch_hook':
        attackData = { damage: d, offsetX: 56, offsetY: -84, width: 72, height: 55, knockback: 9, counterType: 'hand', weight: 'light' }; break;
      default:
        attackData = { damage: d, offsetX: 56, offsetY: -82, width: 72, height: 55, knockback: 9, counterType: 'hand', weight: 'light' };
    }
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// PHÓ ĐẶNG HOÀNG ANH — Chậm mà mạnh, super armor, AoE mặt đất, chuỗi 3 đòn
// ============================================================================
class BossHoangAnh extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_hoanganh', 'Phó Đặng Hoàng Anh');
    this.maxHp = 4200;
    this.hp = 4200;
    this.speed = 118;
    this.phase = 1;
    this.preferredDist = 120;
    this.isBoss = true;
    this.superArmorOn = false;
    this.armorThreshold = 62;
    this.slamPending = 0;
    this.chainStep = 0;
    this.name = 'Phó Đặng Hoàng Anh';
    this.tauntLines = [
      'Ranh giới này là của tôi.',
      'Ngươi đánh như mưa — tôi đứng như đá.',
      'Ai trả tiền cho ngươi đến đây?'
    ];
    this.maxPoise = 175;
    this.poise = 175;
  }

  dieLike(knockbackX) {
    this.isDead = true;
    this.isAttacking = false;
    this.vx = knockbackX * 1.6;
    this.vz = 200;
    this.setState('knockdown', 1.0);
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.invincibleTimer > 0) return;
    const counter = window.combatSystem && window.combatSystem.isCounterWindow;
    const unblockable = counter; // phản đòn hoàn hảo luôn xuyên được armor

    // SUPER ARMOR (giai đoạn 2+): đòn nhẹ không làm hắn chùn bước
    if (this.superArmorOn && amount < this.armorThreshold && !isKnockdown && !unblockable) {
      const reduced = Math.max(1, Math.round(amount * 0.45));
      this.hp = Math.max(0, this.hp - reduced);
      if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
      if (window.effectManager) {
        window.effectManager.createHitSparks(this.x + this.facing * -10, this.y - 95, 5, false);
        window.effectManager.addFloatingText('CHỊU ĐÒN', this.x, this.y - 150, 'block');
        window.effectManager.triggerScreenShake(3, 0.12);
      }
      if (window.audioManager) window.audioManager.playBlock();
      if (this.hp <= 0) this.dieLike(knockbackX);
      else this.checkPhase();
      return;
    }

    super.takeDamage(amount, knockbackX * 0.3, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;
    this.checkPhase();
  }

  checkPhase() {
    if (this.hp < this.maxHp * 0.6 && this.phase === 1) {
      this.setPhase(2);
      this.superArmorOn = true;
      this.speed = 138;
      this.preferredDist = 108;
    } else if (this.hp < this.maxHp * 0.3 && this.phase === 2) {
      this.setPhase(3);
      this.speed = 155;
      this.preferredDist = 95;
      if (this.tauntLines.length) this.taunt('Đủ rồi. Ta sẽ kết thúc trên nền đá này.');
    }
  }

  update(dt, player, allEnemies = []) {
    // Đập mặt đất: AoE chỉ an toàn khi người chơi đang ở trên không
    if (this.slamPending > 0) {
      this.slamPending -= dt;
      if (this.slamPending <= 0 && !this.isDead) {
        if (window.effectManager) {
          window.effectManager.createShockRing(this.x, this.y, '#7dd3fc');
          window.effectManager.createDust(this.x, this.y, 22, 160);
          window.effectManager.createGroundCrack(this.x, this.y, 120, '#38bdf8');
          window.effectManager.triggerScreenShake(16, 0.45);
        }
        if (window.audioManager) window.audioManager.playScissorClamp();
        if (player.z === 0 && Math.abs(player.x - this.x) < 210 && Math.abs(player.y - this.y) < 70) {
          player.takeDamage(70, Math.sign(player.x - this.x) * 11, true);
        }
        this.openWeakWindow(1.15);
      }
    }
    super.update(dt, player, allEnemies);
  }

  updateAI(dt, player) {
    if (['hurt', 'knockdown', 'getup'].includes(this.state)) {
      super.updateAI(dt, player);
      return;
    }

    // Chuỗi liên hoàn 3 đòn (giai đoạn 3)
    if (CHAIN_HOANG_ANN.includes(this.state)) {
      this.runChain(dt, player);
      return;
    }

    // Kết thúc một đòn -> lùi về giữ khoảng cách + lộ sơ hở
    if (this.isAttacking && this.stateTimer >= this.stateDuration) {
      this.setState('idle');
      this.attackCooldown = (this.phase >= 3 ? 0.6 : 0.95) + Math.random() * 0.5;
      this.openWeakWindow(0.95);
      this.vx = -this.facing * 95;
      if (this.tauntCooldown <= 0 && Math.random() < 0.25) {
        this.taunt(this.tauntLines[Math.floor(Math.random() * this.tauntLines.length)]);
        this.tauntCooldown = 9;
      }
      return;
    }

    super.updateAI(dt, player);
  }

  runChain(dt, player) {
    if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackPlayer(player);
    if (this.stateTimer >= this.stateDuration) {
      this.chainStep++;
      if (this.chainStep === 2) {
        this.setState('boss_chain2', 0.36);
        this.vx = this.facing * 130;
      } else if (this.chainStep === 3) {
        this.setState('boss_chain3', 0.46);
        this.vx = this.facing * 160;
        if (window.audioManager) window.audioManager.playWarning();
        if (window.effectManager) {
          window.effectManager.addGhostTrail(this, 'rgba(125,211,252,0.5)');
          window.effectManager.createGroundCrack(this.x + this.facing * 60, this.y, 85, '#38bdf8');
        }
      } else {
        // Hết chuỗi -> khoảng trống lớn nhất của hắn
        this.setState('idle');
        this.attackCooldown = 1.0 + Math.random() * 0.5;
        this.chainStep = 0;
        this.openWeakWindow(1.35);
        this.vx = -this.facing * 120;
        if (window.uiManager) window.uiManager.showAlertBanner('KHOẢNG TRỐNG!');
      }
    }
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();
    const r = Math.random();

    if (this.phase >= 2 && r < 0.26) {
      // Đập mặt đất — né bằng cách nhảy
      this.setState('boss_slam', 0.62);
      this.slamPending = 0.62 * 1.45 * 0.55;
      return;
    }
    if (this.phase >= 3 && r < 0.58) {
      this.chainStep = 1;
      this.setState('boss_chain1', 0.34);
      this.vx = this.facing * 110;
      return;
    }
    if (r < 0.55) {
      this.setState('boss_swing', 0.55);
      this.vx = this.facing * 60;
    } else {
      this.setState('boss_thrust', 0.42);
      this.vx = this.facing * 150;
    }
  }

  checkAttackPlayer(player) {
    let attackData;
    switch (this.state) {
      case 'boss_swing':
        attackData = { damage: 62, offsetX: 96, offsetY: -78, width: 156, height: 78, knockback: 20, knockdown: true, counterType: 'hand', weight: 'heavy' }; break;
      case 'boss_thrust':
        attackData = { damage: 50, offsetX: 98, offsetY: -80, width: 96, height: 55, knockback: 14, counterType: 'hand', weight: 'heavy' }; break;
      case 'boss_chain2':
        attackData = { damage: 58, offsetX: 78, offsetY: -84, width: 108, height: 62, knockback: 14, counterType: 'hand', weight: 'heavy' }; break;
      case 'boss_chain3':
        attackData = { damage: 76, offsetX: 88, offsetY: -74, width: 128, height: 76, knockback: 24, knockdown: true, isKick: true, counterType: 'leg', weight: 'ultimate' }; break;
      case 'boss_chain1':
      default:
        attackData = { damage: 52, offsetX: 82, offsetY: -82, width: 104, height: 60, knockback: 12, counterType: 'hand', weight: 'heavy' };
    }
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// TRIỆU ĐÌNH AN — Thủ chắc, chuỗi đòn nặng, chiếm không gian
// ============================================================================
class BossDinhAn extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_dinhan', 'Triệu Đình An');
    this.maxHp = 3200;
    this.hp = 3200;
    this.speed = 122;
    this.phase = 1;
    this.preferredDist = 88;
    this.isBoss = true;
    this.guardCooldown = 0;
    this.chainStep = 0;
    this.damageReduction = 0.4;
    this.tauntLines = [
      'Qua được ta, mới vào được đại điện.',
      'Sức mạnh của ngươi... chưa đủ.',
      'Ta đã đứng đây mười năm.'
    ];
    this.maxPoise = 160;
    this.poise = 160;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.invincibleTimer > 0) return;
    const counter = window.combatSystem && window.combatSystem.isCounterWindow;
    // Phản đòn hoàn hảo & unblockable không bị giảm
    let actual = amount;
    if (!counter && !isKnockdown) actual = Math.max(1, Math.round(amount * (1 - this.damageReduction)));
    super.takeDamage(actual, knockbackX * 0.3, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;
    if (this.hp < this.maxHp * 0.55 && this.phase === 1) this.setPhase(2);
    else if (this.hp < this.maxHp * 0.25 && this.phase === 2) this.setPhase(3);
  }

  updateAI(dt, player) {
    if (['hurt', 'knockdown', 'getup'].includes(this.state)) {
      super.updateAI(dt, player);
      return;
    }

    // Thủ thế: chặn đòn thường, nhưng hạ thủ là lộ sơ hở
    if (this.state === 'guard') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        this.guardCooldown = 2.2;
        this.openWeakWindow(0.8);
      }
      return;
    }

    if (CHAIN_HOANG_ANN.includes(this.state)) { this.runHeavyChain(dt, player); return; }

    if (this.isAttacking && this.stateTimer >= this.stateDuration) {
      this.setState('idle');
      this.attackCooldown = 0.8 + Math.random() * 0.6;
      this.openWeakWindow(0.9);
      return;
    }

    if (this.guardCooldown > 0) this.guardCooldown -= dt;

    const playerAttacking = typeof player.state === 'string' &&
      ['punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse', 'flying_kick'].includes(player.state);
    if ((this.state === 'idle' || this.state === 'walk') && this.guardCooldown <= 0 &&
        Math.abs(player.x - this.x) < 115 && playerAttacking && Math.random() < 0.12) {
      this.setState('guard', 0.95);
      if (window.audioManager) window.audioManager.playBlock();
      return;
    }

    super.updateAI(dt, player);
  }

  runHeavyChain(dt, player) {
    if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackPlayer(player);
    if (this.stateTimer >= this.stateDuration) {
      this.chainStep++;
      if (this.chainStep === 2) {
        this.setState('boss_chain2', 0.44);
        this.vx = this.facing * 130;
      } else if (this.chainStep === 3) {
        this.setState('boss_chain3', 0.55);
        this.vx = this.facing * 170;
        if (window.audioManager) window.audioManager.playWarning();
        if (window.effectManager) {
          window.effectManager.createGroundCrack(this.x + this.facing * 70, this.y, 85, '#d4a017');
          window.effectManager.createDust(this.x + this.facing * 70, this.y, 16, 70);
        }
      } else {
        this.setState('idle');
        this.chainStep = 0;
        this.attackCooldown = 1.1 + Math.random() * 0.5;
        this.openWeakWindow(1.25);
        if (window.uiManager) window.uiManager.showAlertBanner('HẠ THỦ — TRỪNG PHẠM!');
      }
    }
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();
    const r = Math.random();
    if (this.phase >= 2 && r < 0.5) {
      this.chainStep = 1;
      this.setState('boss_chain1', 0.42);
      this.vx = this.facing * 100;
      return;
    }
    if (this.phase >= 3 && r < 0.72) {
      this.setState('boss_bash', 0.5);
      this.vx = this.facing * 300;
      return;
    }
    this.setState(r < 0.5 ? 'boss_heavy1' : 'punch_hook', 0.4);
    this.vx = this.facing * 130;
  }

  checkAttackPlayer(player) {
    const d = this.phase === 3 ? 60 : (this.phase === 2 ? 50 : 42);
    let attackData;
    switch (this.state) {
      case 'boss_chain2':
        attackData = { damage: d + 6, offsetX: 74, offsetY: -84, width: 104, height: 64, knockback: 18, counterType: 'hand', weight: 'heavy' }; break;
      case 'boss_chain3':
        attackData = { damage: d + 16, offsetX: 84, offsetY: -72, width: 122, height: 78, knockback: 26, knockdown: true, isKick: true, counterType: 'leg', weight: 'ultimate' }; break;
      case 'boss_bash':
        attackData = { damage: d + 10, offsetX: 72, offsetY: -86, width: 110, height: 70, knockback: 28, knockdown: true, unblockable: true, uncounterable: true, counterType: 'none', weight: 'ultimate' }; break;
      case 'boss_heavy1':
        attackData = { damage: d, offsetX: 66, offsetY: -84, width: 92, height: 60, knockback: 14, counterType: 'hand', weight: 'heavy' }; break;
      default:
        attackData = { damage: d - 8, offsetX: 58, offsetY: -84, width: 84, height: 58, knockback: 12, counterType: 'hand', weight: 'heavy' };
    }
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// TRIỆU VĨNH TÂM — Parry, triệu hồi cận vệ, 3 giai đoạn
// ============================================================================
class BossVinhTam extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_vinhtam', 'Triệu Vinh Tâm');
    this.maxHp = 3600;
    this.hp = 3600;
    this.speed = 172;
    this.phase = 1;
    this.preferredDist = 96;
    this.isBoss = true;
    this.summonCooldown = 6;
    this.guardCount = 0;
    this.tauntLines = [
      'Đại điện này chưa từng rơi vào tay kẻ bên ngoài.',
      'Ngươi đánh vì ai? Vì một kẻ không nói thật?',
      'Tính toán... đó là thứ tay chân các ngươi không có.'
    ];
    this.maxPoise = 140;
    this.poise = 140;
  }

  // PARRY: vô hiệu hóa đòn đánh thường rồi phản đòn ngay
  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.invincibleTimer > 0) return;

    if (this.state === 'boss_parry') {
      this.invincibleTimer = 0.35;
      this.setState('boss_riposte', 0.34);
      this.vx = this.facing * 230;
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) {
        window.effectManager.triggerSlowMo(0.3, 0.22);
        window.effectManager.triggerFlash('#ffd700', 0.35);
        window.effectManager.createHitSparks(this.x, this.y - 95, 14, true);
        window.effectManager.createGroundCrack(this.x + this.facing * 40, this.y, 70, '#ffd700');
        window.effectManager.addFloatingText('PHẢN ĐÒN!', this.x, this.y - 150, 'counter');
      }
      if (window.uiManager) window.uiManager.showAlertBanner('PHẢN ĐÒN TRIỆU GIA!');
      return;
    }

    super.takeDamage(amount, knockbackX * 0.3, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;

    if (this.hp < this.maxHp * 0.65 && this.phase === 1) {
      this.setPhase(2);
      this.summonGuards();
      this.summonCooldown = 13;
    } else if (this.hp < this.maxHp * 0.3 && this.phase === 2) {
      this.setPhase(3);
      this.speed = 200;
      if (window.uiManager) window.uiManager.showAlertBanner('HÀM LÔNG — HẾT CỜ ĐỜI');
    }
  }

  summonGuards() {
    if (!window.game || !window.game.spawnMinionAt) return;
    window.game.spawnMinionAt('guard', this.x - 150, Math.max(510, this.y - 30));
    window.game.spawnMinionAt('guard', this.x - 60, Math.min(640, this.y + 45));
    if (window.effectManager) window.effectManager.triggerFlash('#ffd700', 0.45);
    if (window.audioManager) window.audioManager.playWarning();
    this.taunt('Tuyển vệ — áp sát hắn.');
    this.guardCount++;
  }

  update(dt, player, allEnemies = []) {
    if (this.phase >= 2) {
      this.summonCooldown -= dt;
      const guardsAlive = (allEnemies || []).filter((e) => !e.isDead && !e.isBoss && e.type === 'enemy_guard').length;
      if (this.summonCooldown <= 0 && guardsAlive < 2 && !this.isDead && this.state !== 'boss_taunt') {
        this.summonCooldown = 15;
        this.summonGuards();
      }
    }
    super.update(dt, player, allEnemies);
  }

  updateAI(dt, player) {
    if (['hurt', 'knockdown', 'getup'].includes(this.state)) {
      super.updateAI(dt, player);
      return;
    }

    if (this.state === 'boss_parry') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        this.attackCooldown = 0.5 + Math.random() * 0.4;
      }
      return;
    }

    if (this.isAttacking && this.stateTimer >= this.stateDuration) {
      this.setState('idle');
      // Giai đoạn 3: hung hãn hơn nhưng để lộ sơ hở sau mỗi đòn nặng
      if (this.phase === 3) {
        this.attackCooldown = 0.4 + Math.random() * 0.5;
        this.openWeakWindow(1.05);
        if (Math.random() < 0.45 && window.uiManager) window.uiManager.showAlertBanner('SƠ HỞ!');
      } else {
        this.attackCooldown = 0.7 + Math.random() * 0.7;
        if (Math.random() < 0.3) this.openWeakWindow(0.7);
      }
      return;
    }

    const dist = Math.hypot(player.x - this.x, (player.y - this.y) * 1.4);
    // Đôi khi vào thế thủ để PARRY (chỉ khi người chơi đang ở cự ly tấn công)
    if (!player.isDead && dist < 130 && Math.abs(player.y - this.y) < 55 &&
        this.attackCooldown > 0.25 && Math.random() < 0.045) {
      this.setState('boss_parry', 0.75);
      if (window.audioManager) window.audioManager.playClick();
      return;
    }

    // Khi rảnh rỗi: nói một câu (nhân vật có cá tính)
    if (this.tauntCooldown <= 0 && (this.state === 'idle') && Math.random() < 0.012) {
      this.taunt(this.tauntLines[Math.floor(Math.random() * this.tauntLines.length)]);
      this.tauntCooldown = 10;
      return;
    }

    super.updateAI(dt, player);
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();
    const r = Math.random();
    if (this.phase >= 3 && r < 0.4) {
      this.setState('boss_chain1', 0.3);
      this.chainStep = 1;
      this.chainActive = true;
      this.vx = this.facing * 200;
      return;
    }
    if (r < 0.5) {
      this.setState('punch_straight', 0.3);
      this.vx = this.facing * 210;
    } else if (r < 0.8) {
      this.setState('punch_hook', 0.34);
      this.vx = this.facing * 180;
    } else {
      this.setState('kick_roundhouse', 0.4);
      this.vx = this.facing * 170;
    }
  }

  checkAttackPlayer(player) {
    const d = this.phase === 3 ? 58 : (this.phase === 2 ? 48 : 40);
    let attackData;
    switch (this.state) {
      case 'boss_riposte':
        attackData = { damage: d + 14, offsetX: 64, offsetY: -84, width: 92, height: 60, knockback: 20, knockdown: true, counterType: 'hand', weight: 'ultimate' }; break;
      case 'kick_roundhouse':
        attackData = { damage: d + 6, offsetX: 64, offsetY: -80, width: 94, height: 60, knockback: 14, knockdown: true, isKick: true, counterType: 'leg', weight: 'heavy' }; break;
      case 'punch_straight':
        attackData = { damage: d, offsetX: 56, offsetY: -82, width: 74, height: 54, knockback: 10, counterType: 'hand', weight: 'light' }; break;
      case 'boss_chain2':
      case 'boss_chain3':
      case 'punch_hook':
      default:
        attackData = { damage: d + 4, offsetX: 58, offsetY: -84, width: 80, height: 56, knockback: 12, counterType: 'hand', weight: 'heavy' };
    }
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

// ============================================================================
// NGÔ GIANG MẠNH — Đọc thói quen, trừng phạt combo lặp, né ngang + áp sát
// ============================================================================
class BossGiangManh extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'boss_giangmanh', 'Ngô Giang Mạnh');
    this.maxHp = 3800;
    this.hp = 3800;
    this.speed = 212;
    this.phase = 1;
    this.preferredDist = 92;
    this.isBoss = true;
    this.sidestepCd = 0;
    this.patternReady = false;
    this.counterBonus = false;
    this.ambushCd = 4;
    this.observedMove = null;
    this.tauntLines = [
      'Cậu lặp lại chiêu thứ ba rồi.',
      'Họ Phó, họ Triệu, họ Hứa — đều nói dối.',
      'Trung thành với kẻ chưa từng nói thật à?'
    ];
    this.maxPoise = 150;
    this.poise = 150;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    super.takeDamage(amount, knockbackX * 0.3, isKnockdown);
    if (window.uiManager) window.uiManager.updateBossHp(this.hp, this.maxHp);
    if (this.isDead) return;
    if (this.hp < this.maxHp * 0.6 && this.phase === 1) this.setPhase(2);
    else if (this.hp < this.maxHp * 0.28 && this.phase === 2) this.setPhase(3);
  }

  // Đọc THÓI QUEN (không đọc đầu vào tương lai): đếm các đòn người chơi hay dùng
  analyzeHabit(player) {
    const log = (window.combatSystem && window.combatSystem.playerMoveLog) || [];
    const recent = log.slice(-8);
    const count = {};
    recent.forEach((m) => { count[m] = (count[m] || 0) + 1; });
    let best = null, bestN = 0;
    Object.keys(count).forEach((k) => { if (count[k] > bestN) { bestN = count[k]; best = k; } });
    this.observedMove = best;
    this.patternReady = bestN >= 3;
  }

  updateAI(dt, player) {
    if (['hurt', 'knockdown', 'getup'].includes(this.state)) {
      super.updateAI(dt, player);
      return;
    }

    if (this.sidestepCd > 0) this.sidestepCd -= dt;
    if (this.ambushCd > 0) this.ambushCd -= dt;

    // Né ngang rồi phản công trừng phạt
    if (this.state === 'dodge') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('boss_riposte', 0.32);
        this.vx = this.facing * 300;
        this.counterBonus = true;
        if (window.audioManager) window.audioManager.playWhoosh();
        if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(125,211,252,0.6)');
        if (window.uiManager) window.uiManager.showAlertBanner('TRỪNG PHẠT THÓI QUEN!');
      }
      return;
    }

    if (this.isAttacking && this.stateTimer >= this.stateDuration) {
      this.setState('idle');
      this.attackCooldown = this.phase === 3 ? 0.45 + Math.random() * 0.6 : 0.7 + Math.random() * 0.8;
      if (Math.random() < 0.35) this.openWeakWindow(0.7);
      return;
    }

    this.analyzeHabit(player);

    const dist = Math.hypot(player.x - this.x, (player.y - this.y) * 1.4);
    const playerAttacking = typeof player.state === 'string' &&
      ['punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse', 'flying_kick'].includes(player.state);

    // Phản ứng khi người chơi LẶP LẠI một đòn quá nhiều (có cooldown, xác suất — không né mọi đòn)
    if (playerAttacking && dist < 125 && this.sidestepCd <= 0 && this.patternReady && Math.random() < 0.3) {
      this.sidestepCd = 2.4;
      this.setState('dodge', 0.3);
      this.vy = (player.y <= this.y ? 1 : -1) * 175;
      this.vx = this.facing * 40;
      this.invincibleTimer = Math.max(this.invincibleTimer, 0.18);
      if (window.audioManager) window.audioManager.playDodge();
      return;
    }

    // Áp sát bất ngờ
    if (!player.isDead && this.phase >= 2 && this.ambushCd <= 0 && dist > 200 && dist < 420 && Math.random() < 0.02) {
      this.ambushCd = 7;
      this.setState('boss_dash', 0.4);
      this.vx = Math.sign(player.x - this.x) * 520;
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(125,211,252,0.5)');
      return;
    }

    if (this.tauntCooldown <= 0 && this.state === 'idle' && Math.random() < 0.01) {
      this.taunt(this.tauntLines[Math.floor(Math.random() * this.tauntLines.length)]);
      this.tauntCooldown = 11;
      return;
    }

    super.updateAI(dt, player);
  }

  startAttackSequence(player) {
    if (window.audioManager) window.audioManager.playWarning();
    const r = Math.random();
    if (r < 0.4) {
      this.setState('punch_straight', 0.27);
      this.vx = this.facing * 240;
    } else if (r < 0.7) {
      this.setState('punch_hook', 0.32);
      this.vx = this.facing * 200;
    } else {
      this.setState('kick_roundhouse', 0.4);
      this.vx = this.facing * 190;
    }
  }

  checkAttackPlayer(player) {
    const base = this.phase === 3 ? 54 : (this.phase === 2 ? 46 : 40);
    let attackData;
    if (this.state === 'boss_riposte') {
      const dmg = Math.round((this.counterBonus ? base * 1.6 : base) + 14);
      this.counterBonus = false;
      attackData = { damage: dmg, offsetX: 62, offsetY: -82, width: 92, height: 60, knockback: 22, knockdown: true, counterType: 'hand', weight: 'ultimate' };
    } else if (this.state === 'boss_dash') {
      attackData = { damage: base + 6, offsetX: 70, offsetY: -80, width: 104, height: 62, knockback: 18, isKick: true, counterType: 'leg', weight: 'heavy' };
    } else if (this.state === 'kick_roundhouse') {
      attackData = { damage: base + 4, offsetX: 64, offsetY: -80, width: 92, height: 60, knockback: 14, knockdown: true, isKick: true, counterType: 'leg', weight: 'heavy' };
    } else if (this.state === 'punch_hook') {
      attackData = { damage: base, offsetX: 56, offsetY: -84, width: 76, height: 56, knockback: 11, counterType: 'hand', weight: 'light' };
    } else {
      attackData = { damage: base - 6, offsetX: 54, offsetY: -82, width: 72, height: 54, knockback: 9, counterType: 'hand', weight: 'light' };
    }
    window.combatSystem.checkAttackHit(this, player, attackData);
  }
}

window.BossBichlam = BossBichlam;
window.BossDungHai = BossDungHai;
window.BossHoangAnh = BossHoangAnh;
window.BossDinhAn = BossDinhAn;
window.BossVinhTam = BossVinhTam;
window.BossGiangManh = BossGiangManh;
