/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/gameWave.js - Wave director, spawn quai, reinforcement, attack token va vat bay.
 */

class GameWave extends window.GameBase {
  // ==========================================================================
  // FACTORY TẠO INSTANCE KẺ ĐỊCH HOÀN CHỈNH
  // Đầy đủ HP, AI, animation, hitbox, damage, collision theo đúng archetype
  // ==========================================================================
  createEnemyInstance(type, x, y, faction = 'general') {
    let enemy = null;
    if (type === 'dodger') {
      enemy = new EnemyDodger(x, y);
    } else if (type === 'guard') {
      enemy = new EnemyGuard(x, y);
    } else if (type === 'baton' && typeof EnemyBaton !== 'undefined') {
      enemy = new EnemyBaton(x, y, faction);
    } else if (type === 'blade' && typeof EnemyBlade !== 'undefined') {
      enemy = new EnemyBlade(x, y, faction);
    } else if (type === 'shield' && typeof EnemyShield !== 'undefined') {
      enemy = new EnemyShield(x, y, faction);
    } else if (type === 'armored' && typeof EnemyArmored !== 'undefined') {
      enemy = new EnemyArmored(x, y, faction);
    } else if (type === 'thrower' && typeof EnemyThrower !== 'undefined') {
      enemy = new EnemyThrower(x, y, faction);
    } else if (type === 'brawler' && typeof EnemyBrawler !== 'undefined') {
      enemy = new EnemyBrawler(x, y, faction);
    } else if (type === 'grabber' && typeof EnemyGrabber !== 'undefined') {
      enemy = new EnemyGrabber(x, y, faction);
    } else if (type === 'medic' && typeof EnemyMedic !== 'undefined') {
      enemy = new EnemyMedic(x, y, faction);
    } else {
      enemy = new BaseEnemy(x, y, type || 'thug', 'Lính Đánh Thuê');
      if (faction) enemy.faction = faction;
    }
    return enemy;
  }

  // Tìm vị trí sinh địch hợp lệ trong đấu trường: không kẹt vật cản, không đè người chơi
  findValidSpawnPosition(preferredX, preferredY) {
    let x = preferredX;
    let y = preferredY || (540 + Math.random() * 80);

    const minX = this.arenaLocked ? (this.arenaMinX + 50) : 50;
    const maxX = this.arenaLocked ? (this.arenaMaxX - 50) : (window.stageManager ? window.stageManager.stageWidth - 50 : 2550);
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(520, Math.min(630, y));

    // Không spawn trực tiếp lên người chơi
    if (this.player && Math.abs(x - this.player.x) < 85) {
      if (x < this.player.x) {
        x = Math.max(minX, this.player.x - 130);
      } else {
        x = Math.min(maxX, this.player.x + 130);
      }
    }

    // Tránh vật cản trong sân (thùng gỗ, rào chắn)
    if (window.propSystem && window.propSystem.props) {
      for (const prop of window.propSystem.props) {
        if (!prop.destroyed && Math.hypot(x - prop.x, y - prop.y) < 70) {
          x = (x <= prop.x) ? Math.max(minX, prop.x - 85) : Math.min(maxX, prop.x + 85);
          y = (y <= prop.y) ? Math.max(520, prop.y - 45) : Math.min(630, prop.y + 45);
        }
      }
    }

    return { x, y };
  }

  // KÍCH HOẠT SỰ KIỆN TIẾP VIỆN — SPAWN KẺ ĐỊCH THẬT SỰ
  triggerReinforcementEvent(event) {
    if (!event || event.triggered) return [];
    event.triggered = true;
    if (event.id) this.triggeredReinforcementIds.add(event.id);

    // Tín hiệu cảnh báo: banner ngắn + âm thanh cảnh báo + chớp màn hình nhẹ
    const bannerText = event.bannerText || 'ENEMY REINFORCEMENTS INCOMING';
    if (window.uiManager) window.uiManager.showAlertBanner(bannerText);
    if (window.audioManager) window.audioManager.playWarning();
    if (window.effectManager) {
      window.effectManager.triggerFlash('#ff2a4b', 0.35);
      window.effectManager.triggerScreenShake(6, 0.25);
    }

    const spawned = [];
    const entries = event.enemies || [];
    const isRequired = (event.isRequired !== false);

    for (const group of entries) {
      const count = group.count || 1;
      const spacing = group.spacing || 90;
      const baseSpawnX = (event.spawnSide === 'left')
        ? (this.arenaMinX + 80)
        : ((event.spawnSide === 'right' || !event.spawnSide) ? (this.arenaMaxX - 80) : (this.player ? this.player.x + 220 : 1200));

      for (let i = 0; i < count; i++) {
        const rawX = (event.spawnSide === 'left') ? (baseSpawnX + i * spacing) : (baseSpawnX - i * spacing);
        const rawY = 535 + (i % 3) * 35;
        const validPos = this.findValidSpawnPosition(rawX, rawY);

        const enemy = this.createEnemyInstance(group.type, validPos.x, validPos.y, group.faction);
        // Địch tiếp viện tự động hướng mặt và di chuyển áp sát giao chiến với người chơi
        if (this.player) {
          enemy.facing = (this.player.x >= enemy.x) ? 1 : -1;
          enemy.vx = enemy.facing * (enemy.speed || 120) * 0.75;
          enemy.setState('walk');
        }

        this.enemies.push(enemy);
        if (isRequired) {
          this.currentWaveRequiredEnemies.push(enemy);
        }
        spawned.push(enemy);

        if (window.effectManager) {
          window.effectManager.addFloatingText('TIẾP VIỆN!', enemy.x, enemy.y - 145, 'warn');
          window.effectManager.createShockRing(enemy.x, enemy.y, '#ff2a4b');
          window.effectManager.createDust(enemy.x, enemy.y, 10, 45);
        }
      }
    }

    return spawned;
  }

  // ==========================================================================
  // QUẢN LÝ TIẾN TRÌNH CÁC ĐỢT KẺ ĐỊCH (WAVES & BOSS)
  // ==========================================================================
  checkWaveProgress() {
    if (this.state === 'TUTORIAL' || this.state === 'TRAINING') return;
    const stageData = window.stageManager.getCurrentStage();
    const waves = stageData.waves;

    // 1. Quản lý đợt lính quần chiến hiện tại
    if (this.currentWaveActive) {
      this.currentWaveTime = (this.currentWaveTime || 0) + 0.016;
      const required = this.currentWaveRequiredEnemies;
      const aliveRequired = required.filter((e) => !e.isDead);

      // Kích hoạt sự kiện tiếp viện nếu điều kiện thỏa mãn
      if (this.currentWaveReinforcements && this.currentWaveReinforcements.length > 0) {
        for (const rEvent of this.currentWaveReinforcements) {
          if (!rEvent.triggered && !this.triggeredReinforcementIds.has(rEvent.id)) {
            let shouldTrigger = false;
            if (rEvent.trigger === 'time' || rEvent.delay) {
              shouldTrigger = this.currentWaveTime >= (rEvent.delay || 5.0);
            } else if (rEvent.trigger === 'hp_threshold') {
              const totalHp = required.reduce((sum, e) => sum + e.maxHp, 0);
              const curHp = required.reduce((sum, e) => sum + Math.max(0, e.hp), 0);
              shouldTrigger = (curHp / Math.max(1, totalHp)) <= (rEvent.threshold || 0.4);
            } else {
              // Mặc định: kích hoạt khi số lính còn sống <= threshold
              const thresh = (rEvent.threshold !== undefined) ? rEvent.threshold : 1;
              shouldTrigger = (aliveRequired.length <= thresh);
            }

            if (shouldTrigger) {
              this.triggerReinforcementEvent(rEvent);
            }
          }
        }
      }

      // Toàn bộ kẻ địch bắt buộc (kể cả tiếp viện) phải bị tiêu diệt
      const allCleared = required.length > 0 && required.every((e) => e.isDead);
      if (allCleared) {
        this.currentWaveActive = false;
        this.arenaLocked = false;
        const waveJustCleared = this.currentWaveIndex;
        this.currentWaveIndex++;

        // HỒI 25% MÁU SAU MỖI ĐỢT QUẦN CHIẾN: newHealth = min(maxHealth, currentHealth + maxHealth * 0.25)
        if (!this.clearedWaveIndices.has(waveJustCleared)) {
          this.clearedWaveIndices.add(waveJustCleared);

          const maxHealth = this.player.maxHp;
          const currentHealth = this.player.hp;
          const newHealth = Math.min(maxHealth, currentHealth + maxHealth * 0.25);
          const healedAmount = Math.round(newHealth - currentHealth);
          this.player.hp = Math.round(newHealth);

          if (window.uiManager && window.uiManager.updatePlayerHp) {
            window.uiManager.updatePlayerHp(this.player.hp, this.player.maxHp);
          }

          if (window.uiManager) {
            window.uiManager.showAlertBanner('WAVE CLEARED — +25% HP');
          }
          if (window.audioManager) {
            window.audioManager.playSkill();
          }
          if (window.effectManager) {
            window.effectManager.createShockRing(this.player.x, this.player.y, '#4ade80');
            if (healedAmount > 0) {
              window.effectManager.addFloatingText('+' + healedAmount + ' HP', this.player.x, this.player.y - 140, 'heal');
            } else {
              window.effectManager.addFloatingText('HP ĐÃ ĐẦY', this.player.x, this.player.y - 140, 'heal');
            }
          }
        }

        // Mở lối đi tiếp sang khu vực kế tiếp
        if (this.currentWaveIndex < waves.length) {
          if (window.audioManager) window.audioManager.playClick();
        }
      }
      return;
    }

    // 2. Kích hoạt đợt kế tiếp khi người chơi đi vào vùng kích hoạt
    if (this.currentWaveIndex < waves.length) {
      const wave = waves[this.currentWaveIndex];

      if (this.player.x >= wave.spawnX - 450) {
        if (wave.isBossWave) {
          if (!this.isBossSpawned) {
            this.spawnBossWave(wave, stageData);
          }
        } else {
          this.currentWaveActive = true;
          this.currentWaveTime = 0;
          this.combatMode = 'CROWD';
          this.currentWaveRequiredEnemies = this.spawnMinionWave(wave);

          // Đăng ký danh sách tiếp viện của đợt này
          this.currentWaveReinforcements = (wave.reinforcements || []).map((r, idx) => ({
            ...r,
            id: r.id || `wave_${this.currentWaveIndex}_r_${idx}`,
            triggered: false
          }));

          // Khóa khu vực chiến đấu của đợt này (Encounter Boundary)
          this.arenaLocked = true;
          this.arenaMinX = (this.currentWaveIndex === 0) ? 20 : (waves[this.currentWaveIndex - 1].spawnX + 100);
          this.arenaMaxX = Math.min(window.stageManager.stageWidth - 20, wave.spawnX + 480);
        }
      }
    }
  }

  spawnMinionWave(wave) {
    const spawned = [];
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        const spawnX = wave.spawnX + i * group.spacing;
        const spawnY = 540 + (i % 3) * 35;
        const enemy = this.createEnemyInstance(group.type, spawnX, spawnY, group.faction);
        spawned.push(enemy);
        this.enemies.push(enemy);
      }
    }
    return spawned;
  }

  spawnBossWave(wave, stageData) {
    this.isBossSpawned = true;
    this.combatMode = 'DUEL';
    this.arenaLocked = true;

    // SỬA LỖI MẤT NỬA MAP: Sân đấu Boss mở rộng toàn bộ chiều rộng từ cổng vào đến hết mép phải map
    const waves = stageData.waves || [];
    this.arenaMinX = (waves.length > 1) ? Math.max(20, waves[waves.length - 2].spawnX + 100) : 20;
    this.arenaMaxX = window.stageManager.stageWidth - 20;

    // Sinh Boss
    const BossClass = stageData.bossClass;
    const boss = new BossClass(wave.spawnX + 220, 570);
    boss.isBoss = true;
    boss.title = stageData.bossTitle;
    this.currentBoss = boss;
    this.enemies.push(boss);

    // Sinh lính hỗ trợ nếu có
    if (wave.enemies && wave.enemies.length > 0) {
      this.spawnMinionWave(wave);
    }

    // Hiển thị Boss HUD + màn ra mắt điện ảnh
    if (window.uiManager) {
      window.uiManager.showBossHUD(boss);
      window.uiManager.showBossIntro(boss);
    }
    if (window.audioManager) {
      window.audioManager.playGong(0.4);
      window.audioManager.setBGMIntensity(1.3);
    }
    if (window.effectManager) {
      window.effectManager.triggerFlash('#ffffff', 0.35);
      window.effectManager.triggerScreenShake(10, 0.3);
    }
    // Zoom camera chậm lại về phía boss trong lúc ra mắt
    this.bossZoom = 1;
    this.bossIntroTarget = boss;

    // ĐẶC BIỆT MÀN 7: Cuộc gặp tại nơi ẩn náu — không lập tức đánh boss mà có 3 lựa chọn
    if (stageData.id === 7 && !this.isBossCutsceneTriggered) {
      this.triggerStage7DungHaiEncounter(stageData, wave);
      return;
    }

    // Thoại gặp Boss — chờ bảng tên boss chạy xong mới bắt đầu để 2 lớp điện ảnh không đè lên nhau
    if (stageData.bossDialogue && stageData.bossDialogue.length > 0 && !this.isBossCutsceneTriggered) {
      this.isBossCutsceneTriggered = true;
      this.state = 'CUTSCENE';
      const playBossDialogue = () => {
        // Nếu đang tạm dừng thì chờ, tránh cắt ngang màn pause
        if (this.state === 'PAUSED') { this.later(playBossDialogue, 400); return; }
        // Người chơi đã thoát về menu trong lúc chờ -> không phát thoại nữa
        if (this.state !== 'CUTSCENE') return;
        window.stageManager.playDialogueSequence(stageData.bossDialogue, () => {
          this.state = 'PLAYING';
        });
      };
      this.later(playBossDialogue, 2300);
    }

    this.currentWaveIndex++;
  }

  // ==========================================================================
  // HỆ THỐNG MỚI: TOKEN RA ĐÒN / SINH ĐỊCH / ĐẠN / THOẠI GIỮA TRẬN
  // ==========================================================================
  // Xin "suất" ra đòn: tối đa maxAttackTokens địch được đánh cùng lúc (boss luôn được ưu tiên)
  requestAttackToken(enemy) {
    if (!enemy) return false;
    if (enemy.isBoss) return true;
    this.pruneAttackTokens();
    if (this.attackTokens.has(enemy)) return true;
    if (this.attackTokens.size >= this.maxAttackTokens) return false;
    this.attackTokens.set(enemy, { grant: this.stageElapsedTime });
    return true;
  }

  pruneAttackTokens() {
    if (!this.attackTokens.size) return;
    for (const [enemy, rec] of this.attackTokens) {
      const dead = enemy.isDead;
      const justGranted = this.stageElapsedTime - (rec.grant || 0) < 0.5;
      const busy = enemy.isAttacking;
      if (dead || (!busy && !justGranted)) this.attackTokens.delete(enemy);
    }
  }

  // Sinh một lính thường ở tọa độ tùy ý (Vinh Tâm gọi cận vệ giữa trận hoặc chi viện)
  spawnMinionAt(type, x, y, faction = 'general', isRequired = false) {
    const enemy = this.createEnemyInstance(type, x, y, faction);
    this.enemies.push(enemy);
    if (isRequired && this.currentWaveActive) {
      this.currentWaveRequiredEnemies.push(enemy);
    }
    if (window.effectManager) window.effectManager.createDust(x, y, 8);
    return enemy;
  }

  // Cứu cánh của màn trốn thoát: kẻ đuổi theo sinh sau lưng người chơi
  spawnChasers() {
    const alive = this.enemies.filter((e) => !e.isDead).length;
    if (alive >= 5) return;
    const px = this.player.x;
    const sx = Math.max(80, px - 320 - Math.random() * 120);
    const type = Math.random() < 0.4 ? 'dodger' : 'thug';
    this.spawnMinionAt(type, sx, 530 + Math.random() * 90);
    if (window.audioManager) window.audioManager.playWarning();
  }

  // Vật bay (đá/gạch Dung Hải ném) — va chạm với người chơi
  spawnProjectile(x, y, dirX, speed, damage, owner) {
    this.projectiles.push({
      x, y, z: 0, vx: (dirX >= 0 ? 1 : -1) * speed, vy: 0,
      damage: damage || 30, owner: owner || null, life: 2.4, rot: 0
    });
    if (window.audioManager) window.audioManager.playWhoosh();
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.rot += dt * 12;
      p.life -= dt;

      const hitPlayer = !this.player.isDead &&
        Math.abs(p.x - this.player.x) < 44 &&
        Math.abs(p.y - 30 - (this.player.y - 60)) < 70 &&
        this.player.z > -70;

      if (hitPlayer) {
        this.player.takeDamage(p.damage, Math.sign(p.vx) * 9, false);
        if (window.effectManager) window.effectManager.createHitSparks(p.x, p.y, 10, false);
        this.projectiles.splice(i, 1);
        continue;
      }
      if (p.life <= 0 || p.x < -100 || p.x > window.stageManager.stageWidth + 100) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // Thoại nảy sinh NGAY GIỮA trận đấu (không cần đợt địch mới)
}

window.GameWave = GameWave;
