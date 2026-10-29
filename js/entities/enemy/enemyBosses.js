/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/enemy/enemyBosses.js - Bon boss chinh cua chien dich.
 */

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
          : new window.BaseEnemy(this.x + 180, this.y, 'thug', 'Lính Đao Phủ');
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
          : new window.BaseEnemy(this.x + 140, this.y, 'guard', 'Hộ Vệ Hoàng Kim');
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


window.BossHacLang = BossHacLang;
window.BossThietQuyen = BossThietQuyen;
window.BossHuyetAnh = BossHuyetAnh;
window.BossLongVuong = BossLongVuong;
