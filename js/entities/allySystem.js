/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/entities/allySystem.js - Hệ thống Đồng Minh Hỗ Trợ Thực Chiến & Chiêu Phối Hợp Co-op.
 *
 * Hồ sơ kỹ năng, chỉ số và hiệu ứng chiến đấu của từng đồng minh được tách riêng trong js/entities/characters/*.js.
 */

if (!window.CharacterRegistry && typeof require === 'function') {
  try { require('./characters/bootstrap.js'); } catch (_) {}
}

const ALLY_PROFILES = window.CharacterRegistry
  ? window.CharacterRegistry.buildAllyProfilesMap()
  : {};
window.ALLY_PROFILES = ALLY_PROFILES;

function clearPlayerAllyBuffs(player) {
  if (!player) return;
  player.allyDmgBuff = 1.0;
  player.allyDmgReduction = 0;
  player.allyEnergyRate = 1.0;
  player.allyCounterBuff = 1.0;
  if (player.shieldHp) player.shieldHp = 0;
}

class SummonedAlly {
  constructor(charId, x, y) {
    this.charId = charId;
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.state = 'idle'; // 'idle', 'walk', 'run', 'attack', 'coop', 'skill', 'hurt', 'knockdown'
    this.animTime = 0;
    this.stateTimer = 0;
    this.stateDuration = 0.5;
    this.duration = Infinity;
    this.maxDuration = Infinity;
    this.isDead = false;
    this.invincibleTimer = 0;
    this.invulnerable = false;
    this.isEntering = false;
    this.entryTimer = 0;
    this.entryStartX = x;
    this.entryTargetX = x;
    this.entryDir = 1;
    this._lastEntryX = x;
    this.coopCooldown = 0;
    this.specialTimer = 0;
    this.attackCooldown = 0;
    this.fieldTime = 0;
    this.recallLockDuration = 5.0;
    this.exitMode = null;
    this.exitTimer = 0;
    this.vz = 0;

    this.profile = ALLY_PROFILES[charId] || ALLY_PROFILES.bichlam;
    const baseHp = Math.round((this.profile.hp || 1200) * 0.5); // Cân bằng: đồng minh có 1/2 máu gốc, hết máu sẽ rút lui
    this.hp = baseHp;
    this.maxHp = baseHp;
    this.isRetreating = false;
    this.characterKey = charId;
    this.characterId = charId;
    this.id = 'ally_' + charId;
    this.styleType = this.profile.styleType;
    this.isAlly = true;
    this.type = 'ally';

    if (window.CharacterRegistry) {
      window.CharacterRegistry.onAllySpawn(this);
    }
  }

  isInvulnerable() {
    return !!(this.isEntering || this.isRetreating || this.invulnerable || this.invincibleTimer > 0);
  }

  startEntryRun(startX, targetX, y) {
    this.entryStartX = startX;
    this.entryTargetX = targetX;
    this.x = startX;
    this._lastEntryX = startX;
    if (typeof y === 'number') this.y = y;
    this.entryDir = (targetX >= startX) ? 1 : -1;
    this.facing = this.entryDir;
    const runSpeed = 560;
    this.vx = this.entryDir * runSpeed;
    this.vy = 0;
    this.z = 0;
    this.vz = 0;
    this.state = 'run';
    this.isEntering = true;
    this.invulnerable = true;
    const dist = Math.abs(targetX - startX);
    this.entryTimer = Math.max(0.35, Math.min(0.75, dist / runSpeed));
    this.stateTimer = 0;
    this.stateDuration = this.entryTimer;
  }

  finishEntry(snapToTarget = true) {
    if (!this.isEntering) return;
    if (snapToTarget && typeof this.entryTargetX === 'number') {
      this.x = this.entryTargetX;
    }
    this._lastEntryX = this.x;
    this.isEntering = false;
    this.entryTimer = 0;
    this.invulnerable = false;
    this.vx = 0;
    this.vy = 0;
    if (this.state === 'run') {
      this.state = 'idle';
      this.stateTimer = 0;
    }
  }

  setState(state, duration = 0.5) {
    this.state = state;
    this.stateTimer = 0;
    this.stateDuration = duration;
    this.animTime = 0;
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false) {
    if (this.isDead || this.isInvulnerable()) {
      if (window.effectManager && (this.isEntering || this.isRetreating)) {
        window.effectManager.addFloatingText('🛡️ BẤT TỬ!', this.x, this.y - 140, 'dodge');
      }
      return;
    }

    let finalDamage = amount;
    if (window.CharacterRegistry) {
      finalDamage = window.CharacterRegistry.modifyAllyDamageTaken(this, finalDamage);
    }

    this.hp = Math.max(0, this.hp - finalDamage);

    if (window.effectManager) {
      window.effectManager.addFloatingText(`-${finalDamage}`, this.x, this.y - 140, 'hurt');
      window.effectManager.createHitSparks(this.x, this.y - 70, 8, false);
    }

    this.vx = knockbackX * 22;
    if (isKnockdown) {
      this.setState('knockdown', 1.0);
    } else {
      this.setState('hurt', 0.28);
    }

    if (this.hp <= 0) {
      this.retreat();
    }
  }

  // Thu hồi hoặc hết máu: đồng minh KHÔNG chết mà rời sân bằng cách chạy đi (bất tử suốt lúc chạy ra)
  retreat(reason = 'exhausted', forcedMode = null) {
    if (this.isDead) return;
    this.isDead = true;
    this.isEntering = false;
    this.isRetreating = true;
    this.invulnerable = true;
    this.invincibleTimer = 999;
    if (reason !== 'recalled') {
      this.hp = 0;
    }
    this.stateTimer = 0;
    this.stateDuration = 0.90;

    const mode = forcedMode || 'run';
    this.exitMode = mode;
    this.exitTimer = 0.90;
    if (mode === 'leap') {
      this.state = 'jump_up';
      this.vz = 880;
      this.z = -6;
      this.vx = -(this.facing || 1) * 140;
    } else {
      const camX = (window.game && window.game.camera && window.game.camera.x) || 0;
      const dir = (this.x - camX < 640) ? -1 : 1;
      this.facing = dir;
      this.state = 'run';
      this.vx = dir * 600;
      this.vz = 0;
      this.z = 0;
    }

    const game = window.game;
    clearPlayerAllyBuffs(game && game.player);

    if (window.audioManager && window.audioManager.playWhoosh) window.audioManager.playWhoosh();
    if (window.effectManager) {
      window.effectManager.createDust(this.x, this.y, 18);
      if (mode === 'leap' && typeof window.effectManager.createShockRing === 'function') {
        window.effectManager.createShockRing(this.x, this.y, '#00d2ff');
      }
      const msg = (reason === 'recalled')
        ? `${this.profile.name.toUpperCase()} RÚT VỀ!`
        : `${this.profile.name.toUpperCase()} KIỆT SỨC — RÚT LUI!`;
      window.effectManager.addFloatingText(msg, this.x, this.y - 160, reason === 'recalled' ? 'dodge' : 'warn');
    }
    if (window.uiManager && reason !== 'recalled') {
      window.uiManager.showAlertBanner(`${this.profile.name.toUpperCase()} BỊ THƯƠNG NẶNG, RÚT LUI! (SẼ TRỞ LẠI Ở TRẬN SAU)`);
    }
    const mgr = window.allyManager || window.allySystem;
    if (mgr) {
      if (mgr._cleanupTimer) {
        clearTimeout(mgr._cleanupTimer);
        mgr._cleanupTimer = null;
      }
      if (reason !== 'recalled') {
        mgr.cooldown = 30.0;
        mgr.gauge = 0;
      }
    }
  }

  updateRetreatAnimation(dt) {
    this.exitTimer = Math.max(0, (this.exitTimer || 0) - dt);
    this.animTime += dt;
    this.stateTimer += dt;
    this.x += (this.vx || 0) * dt;
    if (this.exitMode === 'leap') {
      this.z -= (this.vz || 880) * dt;
    }
    if (window.effectManager && Math.random() < 0.5 && typeof window.effectManager.addGhostTrail === 'function') {
      window.effectManager.addGhostTrail(this, 'rgba(0, 210, 255, 0.45)');
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.hp = 0;
    this.state = 'knockdown';
    this.stateTimer = 0;
    this.stateDuration = 1.2;

    const game = window.game;
    clearPlayerAllyBuffs(game && game.player);

    if (window.audioManager) {
      window.audioManager.playHeavyHit();
    }
    if (window.effectManager) {
      window.effectManager.triggerFlash('#ef4444', 0.35);
      window.effectManager.createShockRing(this.x, this.y, '#ef4444');
      window.effectManager.addFloatingText(`ĐỒNG MINH ${this.profile.name.toUpperCase()} ĐÃ GỤC NGÃ!`, this.x, this.y - 160, 'warn');
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`ĐỒNG MINH ĐÃ GỤC NGÃ: ${this.profile.name.toUpperCase()}!`);
    }

    const mgr = window.allyManager || window.allySystem;
    if (mgr) {
      mgr.cooldown = 30.0;
      mgr.gauge = 0;
      if (mgr._cleanupTimer) clearTimeout(mgr._cleanupTimer);
      mgr._cleanupTimer = setTimeout(() => {
        if (mgr.activeAlly === this) mgr.activeAlly = null;
      }, 1200);
    }
  }

  update(dt, player, enemies) {
    if (this.isDead) return;
    this.fieldTime = (this.fieldTime || 0) + dt;

    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

    if (this.isEntering) {
      const movedManually = typeof this._lastEntryX === 'number' && Math.abs(this.x - this._lastEntryX) > 1;
      if (movedManually || this.specialTimer >= 4.5) {
        this.finishEntry(false);
      } else {
        this.animTime += dt;
        this.stateTimer += dt;
        this.entryTimer -= dt;
        if (this.coopCooldown > 0) this.coopCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        this.specialTimer += dt;
        if (window.CharacterRegistry) {
          window.CharacterRegistry.updateAllySkill(this, dt, player, enemies);
        }
        this.x += (this.vx || 0) * dt;
        this._lastEntryX = this.x;
        this.state = 'run';
        this.invulnerable = true;
        if (window.effectManager && Math.random() < 0.45 && typeof window.effectManager.addGhostTrail === 'function') {
          window.effectManager.addGhostTrail(this, 'rgba(0, 210, 255, 0.40)');
        }
        const reached = (this.entryDir > 0 && this.x >= this.entryTargetX) ||
          (this.entryDir < 0 && this.x <= this.entryTargetX) ||
          this.entryTimer <= 0;
        if (reached) {
          this.finishEntry(true);
          if (player) this.facing = player.facing || 1;
        }
        return;
      }
    }

    if (this.state === 'hurt') {
      this.stateTimer += dt;
      if (this.stateTimer >= this.stateDuration) {
        this.state = 'idle';
        this.stateTimer = 0;
      }
      return;
    }

    if (this.state === 'knockdown') {
      this.stateTimer += dt;
      if (this.stateTimer >= this.stateDuration) {
        this.state = 'idle';
        this.stateTimer = 0;
        this.invincibleTimer = 0.5;
      }
      return;
    }

    this.animTime += dt;
    this.stateTimer += dt;
    if (this.coopCooldown > 0) this.coopCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    this.specialTimer += dt;

    // Kỹ năng định kỳ & hào quang riêng của từng đồng minh (từ module nhân vật)
    if (window.CharacterRegistry) {
      window.CharacterRegistry.updateAllySkill(this, dt, player, enemies);
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

    const aliveEnemies = (enemies || []).filter((e) => !e.isDead);
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
        const dirX = Math.sign(targetEnemy.x - this.x);
        const dirY = Math.sign(targetEnemy.y - this.y);
        this.vx = dirX * this.profile.speed;
        this.vy = dirY * (this.profile.speed * 0.45);
        this.x += this.vx * dt;
        this.y = Math.max(515, Math.min(638, this.y + this.vy * dt));
        this.state = 'run';
      } else {
        this.vx = 0;
        this.vy = 0;
        if (this.attackCooldown <= 0) {
          this.performAllyAttack(targetEnemy);
        } else {
          this.state = 'idle';
        }
      }
    } else {
      const followX = player.x - player.facing * 110;
      const followY = player.y;
      const dist = Math.hypot(followX - this.x, followY - this.y);

      if (dist > 50) {
        const dirX = Math.sign(followX - this.x);
        const dirY = Math.sign(followY - this.y);
        this.facing = player.facing;
        this.x += dirX * this.profile.speed * 0.85 * dt;
        this.y = Math.max(515, Math.min(638, this.y + dirY * this.profile.speed * 0.45 * dt));
        this.state = 'walk';
      } else {
        this.facing = player.facing;
        this.state = 'idle';
      }
    }
  }

  performAllyAttack(target) {
    if (this.isEntering) {
      const movedManually = typeof this._lastEntryX === 'number' && Math.abs(this.x - this._lastEntryX) > 1;
      this.finishEntry(!movedManually);
    }
    this.state = 'attack';
    this.stateTimer = 0;
    this.stateDuration = 0.55;
    this.attackCooldown = 1.35;

    const isBossTarget = !!(target.isBoss || String(target.type || '').startsWith('boss_'));
    const rawDmg = this.profile.dmg || 75;
    const dmg = isBossTarget ? Math.max(16, Math.round(rawDmg * 0.40)) : rawDmg;

    if (window.CharacterRegistry && window.CharacterRegistry.performAllyAttack(this, target, dmg, isBossTarget)) {
      return;
    }

    target.takeDamage(dmg, isBossTarget ? 0 : this.facing * 5, !isBossTarget);
    if (window.audioManager) window.audioManager.playPunchHit();
    if (window.effectManager) {
      window.effectManager.createHitSparks(target.x, target.y - 80, 12, false);
    }
  }

  triggerCoopAttack(player, target) {
    if (this.coopCooldown > 0 || !target || target.isDead) return;
    if (this.isEntering) {
      const movedManually = typeof this._lastEntryX === 'number' && Math.abs(this.x - this._lastEntryX) > 1;
      this.finishEntry(!movedManually);
    }
    this.coopCooldown = 8.0;
    this.state = 'coop';
    this.stateTimer = 0;
    this.stateDuration = 0.7;

    this.facing = -player.facing;
    this.x = target.x + player.facing * 75;
    this.y = target.y;

    const coopInfo = this.profile.coopSkill || { name: 'SONG LONG XUẤT HẢI' };
    const isBossTarget = !!(target.isBoss || String(target.type || '').startsWith('boss_'));
    const baseDmg = window.CharacterRegistry
      ? window.CharacterRegistry.getAllyCoopBaseDamage(this, player, target)
      : 240;

    const effectiveBase = isBossTarget ? Math.round(baseDmg * 0.55) : baseDmg;
    const coopDmg = Math.round(effectiveBase * (player.dmgMul || 1));
    target.takeDamage(coopDmg, 0, !isBossTarget);
    if (!isBossTarget && typeof target.setState === 'function') {
      target.setState('knockdown', 2.0);
    }

    if (window.game) window.game.hitStop = 0.15;
    if (window.audioManager) {
      window.audioManager.playExplosion();
      window.audioManager.playGong(0.7);
    }
    if (window.effectManager) {
      window.effectManager.triggerFlash(this.profile.roleColor || '#ffd700', 0.5);
      window.effectManager.triggerScreenShake(18, 0.45);
      window.effectManager.createShockRing(target.x, target.y, this.profile.roleColor || '#ffd700');
      window.effectManager.addFloatingText(`CO-OP: ${coopInfo.name.toUpperCase()}!`, target.x, target.y - 180, 'crit');
      window.effectManager.addFloatingText(coopDmg, target.x, target.y - 130, 'crit');
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`CO-OP TẤN CÔNG: ${coopInfo.name.toUpperCase()} (${coopDmg} DMG)!`);
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y + (this.z || 0) - camera.y;
    if (sx < -100 || sx > 1280 + 100) return;

    const isInvulnPhase = !!(this.isEntering || this.isRetreating);

    ctx.save();
    ctx.font = '800 11px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isInvulnPhase ? '#7dd3fc' : '#ffffff';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.fillText(`ĐỒNG MINH: ${this.profile.name.toUpperCase()}${isInvulnPhase ? ' • BẤT TỬ' : ''}`, sx, sy - 146);

    const barW = 86;
    const barH = 6;
    const hpPct = Math.max(0, Math.min(1, this.hp / this.maxHp));
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(sx - barW / 2, sy - 138, barW, barH);
    ctx.fillStyle = isInvulnPhase ? '#38bdf8' : (hpPct > 0.5 ? '#10b981' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444'));
    ctx.fillRect(sx - barW / 2, sy - 138, barW * hpPct, barH);
    ctx.strokeStyle = isInvulnPhase ? '#38bdf8' : '#ffffff';
    ctx.lineWidth = isInvulnPhase ? 1.5 : 1;
    ctx.strokeRect(sx - barW / 2, sy - 138, barW, barH);

    ctx.font = '700 9px Montserrat, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(isInvulnPhase ? '🛡️ BẤT TỬ' : `${Math.ceil(this.hp)} / ${this.maxHp} HP`, sx, sy - 128);
    ctx.restore();
  }
}

class AllyManager {
  constructor() {
    this.gauge = 0; // 0 - 100%
    this.maxGauge = 100;
    this.activeAlly = null;
    this.retreatingAlly = null;
    this.cooldown = 0;
    this.cooldownMax = 35;
    this.summonCooldown = 35;
    this.summonDuration = 25;
    this._cleanupTimer = null;
  }

  reset() {
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    if (this.activeAlly) {
      if (window.effectManager) {
        window.effectManager.createDust(this.activeAlly.x, this.activeAlly.y, 10);
      }
      this.activeAlly = null;
    }
    this.retreatingAlly = null;
    if (window.game && window.game.player) {
      clearPlayerAllyBuffs(window.game.player);
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
    const allAllyKeys = Object.keys(ALLY_PROFILES);
    return allAllyKeys.some((k) => save.isAllyUnlocked(k));
  }

  getBestAvailableAlly(excludeHeroId = null) {
    const currentHeroId = excludeHeroId
      || (window.game && window.game.player && (window.game.player.charId || window.game.player.characterId))
      || (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter)
      || 'nghi';

    const sel = this.selectedAllyId || (window.saveManager && window.saveManager.data && window.saveManager.data.selectedAlly);
    if (sel && sel !== 'auto') {
      if (sel === 'none') return null;
      if (sel !== currentHeroId && ALLY_PROFILES[sel]) {
        return sel;
      }
    }

    if (window.trainingManager && window.trainingManager.isActive) {
      return currentHeroId === 'bichlam' ? 'hoanganh' : 'bichlam';
    }

    const save = window.saveManager;
    if (!save) return currentHeroId === 'bichlam' ? 'hoanganh' : 'bichlam';
    const trust = (save.data && save.data.characterTrust) || {};

    const priorityCandidates = [
      { id: 'giangmanh', minTrust: 0 },
      { id: 'hoanganh', minTrust: 40 },
      { id: 'dunghai', minTrust: 30 },
      { id: 'mocdang', minTrust: 0 },
      { id: 'dinhan', minTrust: 0 },
      { id: 'huavudai', minTrust: 0 },
      { id: 'bichlam', minTrust: 0 }
    ];

    for (const c of priorityCandidates) {
      if (c.id === currentHeroId) continue;
      if (save.isAllyUnlocked(c.id) && (trust[c.id] || 0) >= c.minTrust) {
        return c.id;
      }
    }

    const allAllyKeys = Object.keys(ALLY_PROFILES);
    for (const k of allAllyKeys) {
      if (k === currentHeroId) continue;
      if (save.isAllyUnlocked(k)) return k;
    }

    return currentHeroId === 'bichlam' ? 'hoanganh' : 'bichlam';
  }

  canSummon() {
    if (window.trainingManager && window.trainingManager.isActive) return !this.activeAlly;
    return !this.activeAlly && this.cooldown <= 0 && this.gauge >= this.maxGauge;
  }

  canRecall() {
    return !!(this.activeAlly && !this.activeAlly.isDead && (this.activeAlly.fieldTime || 0) >= (this.activeAlly.recallLockDuration || 5.0));
  }

  recallAlly(forcedExitMode = null) {
    if (!this.activeAlly || this.activeAlly.isDead) return false;
    const lockDur = this.activeAlly.recallLockDuration || 5.0;
    const elapsed = this.activeAlly.fieldTime || 0;
    if (elapsed < lockDur) {
      const waitSec = Math.max(1, Math.ceil(lockDur - elapsed));
      if (window.uiManager) {
        window.uiManager.showToast(`⏳ ĐỢI ${waitSec}S NỮA MỚI THU HỒI ĐƯỢC ĐỒNG MINH!`);
      }
      if (window.effectManager) {
        window.effectManager.addFloatingText(`⏳ CÒN ${waitSec}S MỚI THU VỀ ĐƯỢC!`, this.activeAlly.x, this.activeAlly.y - 155, 'stale');
      }
      return false;
    }
    const ally = this.activeAlly;
    ally.retreat('recalled', forcedExitMode);
    this.retreatingAlly = ally;
    this.activeAlly = null;
    this.cooldown = 12.0;
    this.updateHUD();
    return true;
  }

  summonAlly(forceCharId = null, customPlayer = null) {
    if (this.activeAlly) {
      return this.recallAlly();
    }

    if (window.trainingManager && window.trainingManager.isActive) {
      this.cooldown = 0;
      this.gauge = this.maxGauge;
    }

    if (this.cooldown > 0) {
      if (window.uiManager) window.uiManager.showToast(`ĐỒNG MINH ĐANG HỒI CHIÊU (${Math.ceil(this.cooldown)}s)!`);
      return false;
    }

    const game = window.game;
    const player = customPlayer || (game && game.player);
    if (!player) return false;

    const currentHeroId = (player && (player.charId || player.characterId))
      || (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter)
      || 'nghi';

    let allyId = forceCharId;
    if (allyId && (allyId === currentHeroId || !ALLY_PROFILES[allyId])) {
      allyId = null;
    }
    if (!allyId) {
      allyId = this.getBestAvailableAlly(currentHeroId);
    }
    if (allyId === currentHeroId) {
      allyId = this.getBestAvailableAlly(currentHeroId);
    }

    if (!allyId) {
      if (window.uiManager) window.uiManager.showToast('CHƯA CÓ ĐỒNG MINH NÀO SẴN SÀNG — Hãy tiếp tục cốt truyện để kết giao!');
      return false;
    }

    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }

    const stageW = window.stageManager ? window.stageManager.stageWidth : 2600;
    const targetX = Math.max(35, Math.min(stageW - 35, player.x - (player.facing || 1) * 90));
    const spawnY = Math.max(515, Math.min(638, player.y || 580));
    const pFacing = (player.facing || 1) >= 0 ? 1 : -1;
    const camX = (window.game && window.game.camera && typeof window.game.camera.x === 'number') ? window.game.camera.x : null;
    let startX = targetX - pFacing * 240;
    if (camX !== null) {
      startX = pFacing > 0 ? Math.min(startX, camX - 40) : Math.max(startX, camX + 1320);
    }
    if (Math.abs(targetX - startX) < 160) startX = targetX - pFacing * 220;
    if (Math.abs(targetX - startX) > 340) startX = targetX - Math.sign(targetX - startX) * 320;
    this.activeAlly = new SummonedAlly(allyId, targetX, spawnY);
    this.activeAlly.startEntryRun(startX, targetX, spawnY);
    this.gauge = 0;

    if (window.audioManager) {
      window.audioManager.playSkill();
      window.audioManager.playGong(0.5);
    }
    if (window.effectManager) {
      window.effectManager.triggerFlash('#00d2ff', 0.4);
      window.effectManager.createShockRing(targetX, spawnY, '#00d2ff');
      window.effectManager.createDust(startX, spawnY, 20);
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`ĐỒNG MINH XUẤT TRẬN: ${this.activeAlly.profile.name.toUpperCase()}!`);
    }

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
        if (window.effectManager) {
          window.effectManager.createDust(this.activeAlly.x, this.activeAlly.y, 15);
        }
        this.retreatingAlly = this.activeAlly;
        this.activeAlly = null;
        if (!this.retreatingAlly.isRetreating) {
          this.cooldown = this.cooldownMax;
        }
        if (window.uiManager) window.uiManager.showToast('ĐỒNG MINH ĐÃ RÚT LUI KHỎI CHIẾN TRƯỜNG!');
      }
      this.updateHUD();
    }

    if (this.retreatingAlly) {
      if (typeof this.retreatingAlly.updateRetreatAnimation === 'function') {
        this.retreatingAlly.updateRetreatAnimation(dt);
      }
      if ((this.retreatingAlly.exitTimer || 0) <= 0) {
        this.retreatingAlly = null;
      }
    }
  }

  checkCoopTrigger(player) {
    if (!this.activeAlly || this.activeAlly.coopCooldown > 0) return false;
    const dist = Math.hypot(this.activeAlly.x - player.x, this.activeAlly.y - player.y);

    if (dist < 140 && window.game && window.game.enemies) {
      const nearest = window.game.enemies.find((e) => !e.isDead && Math.hypot(e.x - player.x, e.y - player.y) < 130);
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

    const currentHeroId = (window.game && window.game.player && (window.game.player.charId || window.game.player.characterId))
      || (window.saveManager && window.saveManager.data && window.saveManager.data.selectedCharacter)
      || 'nghi';
    const allyId = this.getBestAvailableAlly(currentHeroId);
    const allyDef = (allyId && window.CHARACTERS && window.CHARACTERS[allyId]) ? window.CHARACTERS[allyId] : null;
    const allyName = allyDef ? allyDef.name : 'ĐỒNG MINH';

    if (this.activeAlly) {
      const waitSec = Math.max(0, Math.ceil((this.activeAlly.recallLockDuration || 5.0) - (this.activeAlly.fieldTime || 0)));
      const recallHint = waitSec > 0 ? `THU VỀ SAU ${waitSec}S` : '[H] THU VỀ';
      badge.classList.remove('hidden');
      badge.textContent = `🤝 ${this.activeAlly.profile.name.toUpperCase()} (${Math.ceil(this.activeAlly.hp)}/${this.activeAlly.maxHp} HP) • ${recallHint}`;
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
    if (this.retreatingAlly) {
      this.retreatingAlly.draw(ctx, camera);
    }
  }
}

const allyManager = new AllyManager();
window.SummonedAlly = SummonedAlly;
window.AllyManager = AllyManager;
window.allyManager = allyManager;
window.allySystem = allyManager;
