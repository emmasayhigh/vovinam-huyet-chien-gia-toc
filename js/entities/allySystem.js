/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/allySystem.js - Hệ thống Đồng Minh Hỗ Trợ Thực Chiến & Chiêu Phối Hợp Co-op
 */

class SummonedAlly {
  constructor(charId, x, y) {
    this.charId = charId;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.state = 'idle'; // 'idle', 'walk', 'run', 'attack', 'coop', 'skill'
    this.animTime = 0;
    this.stateTimer = 0;
    this.stateDuration = 0.5;
    this.duration = 25.0; // 25 giây chiến đấu trên sân
    this.maxDuration = 25.0;
    this.hp = 800;
    this.maxHp = 800;
    this.isDead = false;
    this.coopCooldown = 0;
    this.specialTimer = 0;
    this.attackCooldown = 0;

    // Thiết lập chỉ số và kỹ năng theo từng nhân vật
    const defs = {
      hoanganh: {
        name: 'Đặng Hoàng Anh',
        title: 'Thần Cước Trấn Sơn',
        styleType: 'boss_hoanganh',
        speed: 190,
        dmg: 55,
        trait: 'rapid_strikes'
      },
      dunghai: {
        name: 'Phó Dung Hải',
        title: 'Song Đao Sát Thủ',
        styleType: 'boss_dunghai',
        speed: 175,
        dmg: 65,
        trait: 'guard_breaker'
      },
      mocdang: {
        name: 'Phó Mộc Đăng',
        title: 'Kiến Trúc Sư Thần Số',
        styleType: 'npc_mocdang',
        speed: 160,
        dmg: 45,
        trait: 'emp_control'
      },
      bichlam: {
        name: 'Đình Bích Lâm',
        title: 'Mãnh Tướng Bến Cảng',
        styleType: 'boss_bichlam',
        speed: 210,
        dmg: 48,
        trait: 'heal_speed_buff'
      },
      dinhan: {
        name: 'Triệu Đình An',
        title: 'Cận Vệ Thiết Bích',
        styleType: 'boss_dinhan',
        speed: 180,
        dmg: 52,
        trait: 'shield_taunt'
      },
      huavudai: {
        name: 'Hứa Vũ Đại',
        title: 'Ông Trùm Mạng Lưới',
        styleType: 'npc_huavudai',
        speed: 185,
        dmg: 50,
        trait: 'tactical_command'
      }
    };

    this.profile = defs[charId] || defs.hoanganh;
    this.characterKey = charId;
    this.characterId = charId;
    this.trait = this.profile.trait;
    this.styleType = this.profile.styleType;
    this.isAlly = true;
    this.type = 'ally';
  }

  update(dt, player, enemies) {
    this.duration -= dt;
    if (this.duration <= 0) {
      this.isDead = true;
      return;
    }

    this.animTime += dt;
    this.stateTimer += dt;
    if (this.coopCooldown > 0) this.coopCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    this.specialTimer += dt;

    // Hiệu ứng đặc trưng liên tục
    if (this.charId === 'bichlam') {
      // Hồi máu nhẹ định kỳ cho người chơi (+12 HP mỗi 2.5s)
      if (this.specialTimer >= 2.5 && player && player.hp < player.maxHp) {
        this.specialTimer = 0;
        player.hp = Math.min(player.maxHp, player.hp + 12);
        if (window.uiManager) window.uiManager.updatePlayerHp(player.hp, player.maxHp);
        if (window.effectManager) {
          window.effectManager.addFloatingText('+12 HP', player.x, player.y - 150, 'heal');
          window.effectManager.createShockRing(player.x, player.y, '#34d399');
        }
      }
    } else if (this.charId === 'dinhan') {
      // Thiết bích khiên: tạo xung kích bảo vệ và hút đòn về phía mình
      if (this.specialTimer >= 3.2) {
        this.specialTimer = 0;
        if (window.effectManager) {
          window.effectManager.createShockRing(this.x, this.y, '#d4a017');
          window.effectManager.addFloatingText('THIẾT BÍCH KHIÊN!', this.x, this.y - 150, 'warn');
        }
        (enemies || []).forEach(e => {
          if (!e.isDead && Math.hypot(e.x - this.x, e.y - this.y) < 190) {
            e.takeDamage(35, Math.sign(e.x - this.x) * 6, false);
            if (typeof e.setState === 'function') e.setState('hurt', 0.5);
          }
        });
      }
    } else if (this.charId === 'huavudai') {
      // Chiến thuật mạng lưới ngầm: kích thích năng lượng & tăng sát thương
      if (this.specialTimer >= 4.0 && player) {
        this.specialTimer = 0;
        if (window.effectManager) {
          window.effectManager.createDust(player.x, player.y, 16, 25);
          window.effectManager.addFloatingText('CHIẾN THUẬT NGẦM +20% SÁT THƯƠNG!', player.x, player.y - 160, 'dodge');
        }
        player.dmgMul = (player.dmgMul || 1) * 1.2;
        setTimeout(() => { if (player) player.dmgMul = Math.max(1, (player.dmgMul || 1) / 1.2); }, 3000);
      }
    }

    // Nếu đang trong đòn đánh hoặc co-op, đợi hết animation
    if (this.state === 'attack' || this.state === 'coop') {
      if (this.stateTimer >= this.stateDuration) {
        this.state = 'idle';
        this.stateTimer = 0;
      }
      return;
    }

    if (!player) return;

    // AI Chiến thuật: Ưu tiên cứu người chơi nếu người chơi bị ép góc hoặc bị đánh ngã
    let targetEnemy = null;
    const isPlayerInDanger = (player.state === 'knockdown' || player.state === 'hurt' || (player.hp / player.maxHp < 0.3));

    // Tìm kẻ địch gần người chơi nhất nếu nguy hiểm, hoặc kẻ địch gần đồng minh
    const aliveEnemies = (enemies || []).filter(e => !e.isDead);
    if (isPlayerInDanger && aliveEnemies.length) {
      aliveEnemies.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
      targetEnemy = aliveEnemies[0];
    } else if (aliveEnemies.length) {
      aliveEnemies.sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y));
      targetEnemy = aliveEnemies[0];
    }

    if (targetEnemy) {
      const distToEnemy = Math.hypot(targetEnemy.x - this.x, targetEnemy.y - this.y);
      this.facing = (targetEnemy.x >= this.x) ? 1 : -1;

      if (distToEnemy > 90) {
        // Áp sát kẻ địch
        const dirX = Math.sign(targetEnemy.x - this.x);
        const dirY = Math.sign(targetEnemy.y - this.y);
        this.vx = dirX * this.profile.speed;
        this.vy = dirY * (this.profile.speed * 0.45);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.state = 'run';
      } else {
        // Tấn công kẻ địch
        this.vx = 0;
        this.vy = 0;
        if (this.attackCooldown <= 0) {
          this.performAllyAttack(targetEnemy);
        } else {
          this.state = 'idle';
        }
      }
    } else {
      // Không có địch: đi theo sau người chơi giữ cự ly ~110px
      const followX = player.x - player.facing * 110;
      const followY = player.y;
      const dist = Math.hypot(followX - this.x, followY - this.y);

      if (dist > 50) {
        const dirX = Math.sign(followX - this.x);
        const dirY = Math.sign(followY - this.y);
        this.facing = player.facing;
        this.x += dirX * this.profile.speed * 0.85 * dt;
        this.y += dirY * this.profile.speed * 0.45 * dt;
        this.state = 'walk';
      } else {
        this.facing = player.facing;
        this.state = 'idle';
      }
    }
  }

  performAllyAttack(target) {
    this.state = 'attack';
    this.stateTimer = 0;
    this.stateDuration = 0.55;
    this.attackCooldown = 1.1;

    let dmg = this.profile.dmg;
    if (this.charId === 'hoanganh') {
      // Hoàng Anh: Đòn cước bạt sơn gây choáng
      target.takeDamage(dmg, this.facing * 8, true);
      target.poise = Math.max(0, (target.poise || 50) - 35);
      if (window.audioManager) window.audioManager.playHeavyHit();
      if (window.effectManager) {
        window.effectManager.createShockRing(target.x, target.y, '#ffd700');
        window.effectManager.addFloatingText('SƠN CƯỚC!', this.x, this.y - 140, 'crit');
      }
    } else if (this.charId === 'dunghai') {
      // Dung Hải: Phá phòng thủ
      if (target.superArmor) target.superArmor = false;
      target.takeDamage(dmg, this.facing * 6, true);
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.effectManager) {
        window.effectManager.createHitSparks(target.x, target.y - 80, 15, true);
        window.effectManager.addFloatingText('PHÁ THỦ!', target.x, target.y - 140, 'warn');
      }
    } else if (this.charId === 'mocdang') {
      // Mộc Đăng: EMP Drone Stun
      target.takeDamage(dmg, 0, false);
      target.setState('hurt', 0.8);
      if (window.audioManager) window.audioManager.playChime();
      if (window.effectManager) {
        window.effectManager.createShockRing(target.x, target.y, '#00d2ff');
        window.effectManager.addFloatingText('XUNG ĐIỆN EMP!', target.x, target.y - 140, 'dodge');
      }
    } else if (this.charId === 'dinhan') {
      // Triệu Đình An: Chùy thép húc văng
      target.takeDamage(dmg, this.facing * 9, true);
      if (typeof target.setState === 'function') target.setState('knockdown', 1.4);
      if (window.audioManager) window.audioManager.playExplosion();
      if (window.effectManager) {
        window.effectManager.createShockRing(target.x, target.y, '#d4a017');
        window.effectManager.addFloatingText('XUNG KÍCH!', target.x, target.y - 140, 'crit');
      }
    } else if (this.charId === 'huavudai') {
      // Hứa Vũ Đại: Đòn xô đẩy áp sát
      target.takeDamage(dmg, this.facing * 7, false);
      if (window.audioManager) window.audioManager.playPunchHit();
      if (window.effectManager) {
        window.effectManager.createHitSparks(target.x, target.y - 70, 10, false);
        window.effectManager.addFloatingText('ĐẨY LÙI!', target.x, target.y - 140, 'heal');
      }
    } else {
      // Bích Lâm: Liên hoàn cước bạt phong
      target.takeDamage(dmg, this.facing * 5, true);
      if (window.audioManager) window.audioManager.playPunchHit();
      if (window.effectManager) {
        window.effectManager.createHitSparks(target.x, target.y - 80, 12, false);
      }
    }
  }

  triggerCoopAttack(player, target) {
    if (this.coopCooldown > 0 || !target || target.isDead) return;
    this.coopCooldown = 8.0;
    this.state = 'coop';
    this.stateTimer = 0;
    this.stateDuration = 0.7;

    // Dịch chuyển áp sát đối diện người chơi
    this.facing = -player.facing;
    this.x = target.x + player.facing * 75;
    this.y = target.y;

    // Đòn song sát cực mạnh
    const coopDmg = Math.round(180 * (player.dmgMul || 1));
    target.takeDamage(coopDmg, 0, true);
    if (typeof target.setState === 'function') {
      target.setState('knockdown', 2.2);
    }


    if (window.game) window.game.hitStop = 0.12;
    if (window.audioManager) {
      window.audioManager.playExplosion();
      window.audioManager.playGong(0.6);
    }
    if (window.effectManager) {
      window.effectManager.triggerFlash('#ffd700', 0.5);
      window.effectManager.triggerScreenShake(16, 0.4);
      window.effectManager.createShockRing(target.x, target.y, '#ffd700');
      window.effectManager.addFloatingText('SONG LONG XUẤT HẢI!', target.x, target.y - 180, 'crit');
      window.effectManager.addFloatingText(coopDmg, target.x, target.y - 130, 'crit');
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner('CO-OP ATTACK: SONG LONG XUẤT HẢI!');
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    if (sx < -100 || sx > 1280 + 100) return;

    // Nhãn tên và thanh thời gian tồn tại trên đầu đồng minh
    ctx.save();
    ctx.font = '800 11px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.fillText(`ĐỒNG MINH: ${this.profile.name.toUpperCase()}`, sx, sy - 145);

    // Thanh thời gian tồn tại (25s)
    const barW = 80;
    const barH = 5;
    const pct = Math.max(0, this.duration / this.maxDuration);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(sx - barW / 2, sy - 138, barW, barH);
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(sx - barW / 2, sy - 138, barW * pct, barH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - barW / 2, sy - 138, barW, barH);
    ctx.restore();
  }
}

class AllyManager {
  constructor() {
    this.gauge = 0; // 0 - 100%
    this.maxGauge = 100;
    this.activeAlly = null;
    this.cooldown = 0;
    this.cooldownMax = 35; // 35s hồi chiêu
    this.summonCooldown = 35;
    this.summonDuration = 25;
  }

  reset() {
    if (this.activeAlly) {
      if (window.effectManager) {
        window.effectManager.createDust(this.activeAlly.x, this.activeAlly.y, 10);
      }
      this.activeAlly = null;
    }
    this.cooldown = 0;
    this.gauge = 0;
    this.updateHUD();
  }

  isReady() {
    return this.canSummon();
  }

  chargeGauge(amount) {
    this.addGauge(amount);
  }

  isAnyAllyUnlocked() {
    const save = window.saveManager;
    if (!save) return true;
    const allies = save.data.allyAvailability || {};
    return Object.values(allies).some(Boolean);
  }

  getBestAvailableAlly() {
    const sel = this.selectedAllyId || (window.saveManager && window.saveManager.data && window.saveManager.data.selectedAlly);
    if (sel && sel !== 'auto') {
      if (sel === 'none') return null;
      return sel;
    }

    // Trong Võ Đường huấn luyện: Luôn có đồng môn chi viện để người chơi tập luyện gọi viện trợ
    if (window.trainingManager && window.trainingManager.isActive) {
      return 'bichlam';
    }

    const save = window.saveManager;
    if (!save) return 'bichlam';
    const allies = save.data.allyAvailability || {};
    const trust = save.data.characterTrust || {};

    if (allies.hoanganh && trust.hoanganh >= 50) return 'hoanganh';
    if (allies.dunghai && trust.dunghai >= 40) return 'dunghai';
    if (allies.mocdang && trust.mocdang >= 50) return 'mocdang';
    if (allies.dinhan) return 'dinhan';
    if (allies.huavudai) return 'huavudai';
    if (allies.bichlam) return 'bichlam';

    // Fallback: đồng minh nào có cờ true
    for (const [k, v] of Object.entries(allies)) {
      if (v) return k;
    }
    return 'bichlam';
  }

  canSummon() {
    if (window.trainingManager && window.trainingManager.isActive) return !this.activeAlly;
    return !this.activeAlly && this.cooldown <= 0 && this.gauge >= this.maxGauge;
  }

  summonAlly(forceCharId = null, customPlayer = null) {
    if (this.activeAlly) {
      if (window.uiManager) window.uiManager.showToast('ĐỒNG MINH HIỆN ĐANG CÓ MẶT TRÊN SÂN!');
      return false;
    }

    // Trong Võ Đường: bỏ qua hồi chiêu và nạp đầy thanh chi viện để người chơi tập luyện
    if (window.trainingManager && window.trainingManager.isActive) {
      this.cooldown = 0;
      this.gauge = this.maxGauge;
    }

    if (this.cooldown > 0) {
      if (window.uiManager) window.uiManager.showToast(`ĐỒNG MINH ĐANG HỒI CHIÊU (${Math.ceil(this.cooldown)}s)!`);
      return false;
    }

    const allyId = forceCharId || this.getBestAvailableAlly();
    if (!allyId) {
      if (window.uiManager) window.uiManager.showToast('CHƯA CÓ ĐỒNG MINH NÀO SẴN SÀNG — Hãy tiếp tục cốt truyện để kết giao!');
      return false;
    }

    const game = window.game;
    const player = customPlayer || (game && game.player);
    if (!player) return false;

    // Spawn đồng minh sau lưng người chơi
    const spawnX = player.x - (player.facing || 1) * 90;
    const spawnY = player.y;
    this.activeAlly = new SummonedAlly(allyId, spawnX, spawnY);
    this.gauge = 0;

    if (window.audioManager) {
      window.audioManager.playSkill();
      window.audioManager.playGong(0.5);
    }
    if (window.effectManager) {
      window.effectManager.triggerFlash('#00d2ff', 0.4);
      window.effectManager.createShockRing(spawnX, spawnY, '#00d2ff');
      window.effectManager.createDust(spawnX, spawnY, 20);
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`ĐỒNG MINH XUẤT TRẬN: ${this.activeAlly.profile.name.toUpperCase()}!`);
    }

    // Thông báo cho hệ thống luyện võ nếu đang tập
    if (window.trainingManager && window.trainingManager.isActive) {
      window.trainingManager.recordAction('ally_summon');
    }

    return true;
  }

  addGauge(amount) {
    if (this.activeAlly) return;
    this.gauge = Math.min(this.maxGauge, this.gauge + amount);
    this.updateHUD();
  }

  update(dt, player, enemies) {
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.updateHUD();
    }

    if (this.activeAlly) {
      this.activeAlly.update(dt, player, enemies);
      if (this.activeAlly.isDead) {
        // Rời sân
        if (window.effectManager) {
          window.effectManager.createDust(this.activeAlly.x, this.activeAlly.y, 15);
        }
        this.activeAlly = null;
        this.cooldown = this.cooldownMax;
        if (window.uiManager) window.uiManager.showToast('ĐỒNG MINH ĐÃ RÚT LUI KHỎI CHIẾN TRƯỜNG!');
      }
      this.updateHUD();
    }
  }

  checkCoopTrigger(player, attackerHitbox) {
    if (!this.activeAlly || this.activeAlly.coopCooldown > 0) return false;
    const dist = Math.hypot(this.activeAlly.x - player.x, this.activeAlly.y - player.y);

    // Nếu người chơi và đồng minh đứng gần nhau trong cự ly 140px và người chơi đang ra đòn nặng/combo
    if (dist < 140 && window.game && window.game.enemies) {
      const nearest = window.game.enemies.find(e => !e.isDead && Math.hypot(e.x - player.x, e.y - player.y) < 130);
      if (nearest) {
        this.activeAlly.triggerCoopAttack(player, nearest);
        return true;
      }
    }
    return false;
  }


  updateHUD() {
    const badge = document.getElementById('ally-ready-badge');
    if (!badge) return;

    const allyId = this.getBestAvailableAlly();
    const allyDef = (allyId && window.CHARACTERS && window.CHARACTERS[allyId]) ? window.CHARACTERS[allyId] : null;
    const allyName = allyDef ? allyDef.name : 'ĐỒNG MINH';

    if (this.activeAlly) {
      badge.classList.remove('hidden');
      badge.textContent = `🤝 ${this.activeAlly.profile.name.toUpperCase()} ĐANG HỖ TRỢ: ${Math.ceil(this.activeAlly.duration)}S`;
      badge.className = 'ally-badge active';
    } else if (this.canSummon()) {
      badge.classList.remove('hidden');
      badge.textContent = `🤝 ${allyName.toUpperCase()} SẴN SÀNG! [PHÍM H]`;
      badge.className = 'ally-badge ready';
    } else if (this.cooldown > 0) {
      badge.classList.remove('hidden');
      badge.textContent = `🤝 HỒI CHIÊU ĐỒNG MINH: ${Math.ceil(this.cooldown)}S`;
      badge.className = 'ally-badge cooldown';
    } else {
      badge.classList.add('hidden');
    }
  }

  draw(ctx, camera) {
    if (this.activeAlly) {
      this.activeAlly.draw(ctx, camera);
    }
  }
}

const allyManager = new AllyManager();
window.AllyManager = AllyManager;
window.allyManager = allyManager;
