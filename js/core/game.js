/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/game.js - Entry point cua game engine + He thong Dau Online (1v1 PvP & 2P Co-op).
 *
 * Thu tu load bat buoc:
 *   js/core/gameBase.js
 *   js/core/gameWave.js
 *   js/core/gameCamera.js
 *   js/core/gameFlow.js
 *   js/core/gameStory.js
 *   js/core/gameRender.js
 *   js/core/game.js  (file nay)
 */

// ============================================================================
// REMOTE PLAYER (VÕ SĨ TỪ XA TRONG CHẾ ĐỘ ONLINE 1V1 PVP & 2P CO-OP)
// ============================================================================
class RemotePlayer extends (window.Player || Object) {
  constructor(x = 920, y = 580) {
    super(x, y);
    this.id = 'remote_player';
    this.type = 'remote_player';
    this.isRemotePlayer = true;
    this.displayName = 'Võ Sĩ Đối Thủ';
    this.netTargetX = x;
    this.netTargetY = y;
    this.netTargetZ = 0;
    this.netVx = 0;
    this.netVy = 0;
    this.netVz = 0;
    this.comboStep = 0;
    this._optimisticHpLockTimer = 0;
    this._optimisticTargetHitSeq = 0;
    this._netRxAge = 0;
    this.remoteFiends = [];
    this.width = this.width || 50;
    this.height = this.height || 100;
    this._lastSyncDebuffs = { bleed: 0, burn: 0, chill: 0, stun: 0, armorBreak: 0 };
  }

  setCharacter(charId, skinId = 'default') {
    const ui = window.uiManager;
    const origSetHud = ui && ui.setCharacterHUD;
    if (ui && origSetHud) ui.setCharacterHUD = () => {};
    try {
      if (typeof super.setCharacter === 'function') {
        super.setCharacter(charId);
      }
    } finally {
      if (ui && origSetHud) ui.setCharacterHUD = origSetHud;
    }
    this.id = 'remote_player';
    this.type = 'remote_player';
    this.isRemotePlayer = true;
    const resolvedSkin = skinId || 'default';
    this.equippedSkin = resolvedSkin;
    this.isVovinamSkin = (this.charId === 'nghi' || resolvedSkin === 'vovinam');
    this.vovinamSkin = (resolvedSkin === 'vovinam');
    this.namcheoSkin = (resolvedSkin === 'namcheo');
    if (window.CharacterRegistry) {
      const def = window.CharacterRegistry.get(this.charId);
      if (def && def.appearance && def.appearance.skins && def.appearance.skins[resolvedSkin] && def.appearance.skins[resolvedSkin].styleKey) {
        this.styleType = def.appearance.skins[resolvedSkin].styleKey;
      }
    }
    return this;
  }

  resetForMatch(x, y, facing, charId, skinId) {
    this.setCharacter(charId || 'bichlam', skinId || 'default');
    this.x = x;
    this.y = y;
    this.z = 0;
    this.netTargetX = x;
    this.netTargetY = y;
    this.netTargetZ = 0;
    this.facing = facing || -1;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.netVx = 0;
    this.netVy = 0;
    this.netVz = 0;
    this.comboStep = 0;
    this._optimisticHpLockTimer = 0;
    this._optimisticTargetHitSeq = 0;
    this._netRxAge = 0;
    this.remoteFiends = [];
    this.hp = this.maxHp;
    this.energy = 0;
    this.stamina = this.maxStamina || 100;
    this.isDead = false;
    this.state = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.animTime = 0;
    this.invincibleTimer = 0;
    this.bleedTimer = 0;
    this.burnTimer = 0;
    this.chillTimer = 0;
    this.stunTimer = 0;
    this.armorBreakTimer = 0;
    this._lastSyncDebuffs = { bleed: 0, burn: 0, chill: 0, stun: 0, armorBreak: 0 };
  }

  addEnergy(amount) {
    const safeAmt = (typeof amount === 'number' && Number.isFinite(amount)) ? amount : 0;
    const max = (typeof this.maxEnergy === 'number' && Number.isFinite(this.maxEnergy) && this.maxEnergy >= 0) ? this.maxEnergy : 100;
    this.maxEnergy = max;
    this.energy = Math.max(0, Math.min(max, (this.energy || 0) + safeAmt));
  }

  consumeEnergy(amount) {
    const safeAmt = (typeof amount === 'number' && Number.isFinite(amount)) ? amount : 0;
    this.energy = Math.max(0, (this.energy || 0) - safeAmt);
  }

  static isAttackStateName(state) {
    if (typeof state !== 'string') return false;
    return state.startsWith('punch_') || state.startsWith('kick_') || state.startsWith('attack_') ||
      state.startsWith('ultimate_') || state.startsWith('wp_') || state.startsWith('boss_') ||
      ['uppercut', 'elbow_strike', 'hook_run', 'flying_kick', 'air_punch', 'scissor_grab',
       'counter_hand_strike', 'counter_leg_strike'].includes(state);
  }

  getWorldBounds() {
    const mgr = window.onlineManager;
    const g = window.game;
    if (mgr && mgr.mode === 'coop') {
      const stageW = (window.stageManager && window.stageManager.stageWidth) || 2600;
      const minX = (g && g.arenaLocked && Number.isFinite(g.arenaMinX)) ? (g.arenaMinX + 24) : 24;
      const maxX = (g && g.arenaLocked && Number.isFinite(g.arenaMaxX)) ? (g.arenaMaxX - 24) : (stageW - 24);
      return { minX, maxX: Math.max(minX + 100, maxX) };
    }
    return { minX: 78, maxX: 1202 };
  }

  _syncRemoteFiends(incomingFiends) {
    if (!Array.isArray(this.remoteFiends)) this.remoteFiends = [];
    const list = Array.isArray(incomingFiends) ? incomingFiends : [];
    const seenIds = new Set();
    const mgr = window.onlineManager;
    const em = window.effectManager;

    for (const rf of list) {
      if (!rf || !rf.id) continue;
      seenIds.add(rf.id);
      let existing = this.remoteFiends.find((f) => f && f.id === rf.id);
      if (!existing) {
        existing = {
          id: rf.id,
          x: Number(rf.x) || this.x || 0,
          y: Number(rf.y) || this.y || 580,
          _netTargetX: Number(rf.x) || this.x || 0,
          _netTargetY: Number(rf.y) || this.y || 580,
          facing: rf.facing >= 0 ? 1 : -1,
          life: Number(rf.life) || 4.5,
          maxLife: Number(rf.maxLife) || 4.5,
          slashTimer: rf.slash ? 0.28 : 0,
          seed: Math.random() * 10,
          _fromRemotePlayer: true
        };
        this.remoteFiends.push(existing);
        if (em && typeof em.createTaoistFiend === 'function') {
          const prevFlag = mgr ? mgr._applyingRemoteVfx : false;
          if (mgr) mgr._applyingRemoteVfx = true;
          try {
            em.createTaoistFiend(existing);
          } finally {
            if (mgr) mgr._applyingRemoteVfx = prevFlag;
          }
        }
      } else {
        if (Number.isFinite(rf.x)) existing._netTargetX = rf.x;
        if (Number.isFinite(rf.y)) existing._netTargetY = rf.y;
        if (rf.facing === 1 || rf.facing === -1) existing.facing = rf.facing;
        if (Number.isFinite(rf.life)) existing.life = Math.max(0.05, rf.life);
        if (Number.isFinite(rf.maxLife)) existing.maxLife = rf.maxLife;
        if (rf.slash) existing.slashTimer = Math.max(existing.slashTimer || 0, 0.26);
      }
    }

    for (let i = this.remoteFiends.length - 1; i >= 0; i--) {
      const f = this.remoteFiends[i];
      if (!f || (f.id && !seenIds.has(f.id))) {
        if (f) f.life = 0;
        this.remoteFiends.splice(i, 1);
      }
    }
  }

  applyRemoteState(s) {
    if (!s || typeof s !== 'object') return;
    this._netRxAge = 0;
    if (s.charId && (s.charId !== this.charId || (s.skinId || 'default') !== this.equippedSkin)) {
      this.setCharacter(s.charId, s.skinId || 'default');
    }
    if (s.name) this.displayName = String(s.name).slice(0, 24);
    if (Number.isFinite(s.x)) this.netTargetX = s.x;
    if (Number.isFinite(s.y)) this.netTargetY = s.y;
    if (Number.isFinite(s.z)) this.netTargetZ = s.z;
    if (Number.isFinite(s.vx)) this.netVx = s.vx;
    if (Number.isFinite(s.vy)) this.netVy = s.vy;
    this.netVz = Number.isFinite(s.vz) ? s.vz : 0;
    if (Math.hypot((this.x || 0) - this.netTargetX, (this.y || 0) - this.netTargetY) > 460) {
      this.x = this.netTargetX;
      this.y = this.netTargetY;
      this.z = this.netTargetZ;
    }
    if (s.facing === 1 || s.facing === -1) this.facing = s.facing;
    if (typeof s.state === 'string') {
      if (s.state !== this.state) {
        this.state = s.state;
        this.stateTimer = Number(s.stateTimer) || 0;
        this.stateDuration = Number(s.stateDuration) || 0.5;
        this.animTime = 0;
        this.comboStep = Number.isFinite(s.comboStep) ? s.comboStep : 0;
      } else if (Number.isFinite(s.comboStep) && s.comboStep !== this.comboStep) {
        this.stateTimer = Number(s.stateTimer) || 0;
        this.animTime = 0;
        this.comboStep = s.comboStep;
      }
      this.isAttacking = RemotePlayer.isAttackStateName(s.state);
    }
    if (Number.isFinite(s.maxHp) && s.maxHp > 0) this.maxHp = s.maxHp;
    if (Number.isFinite(s.hp)) {
      const incomingHp = Math.max(0, Math.min(this.maxHp, s.hp));
      const hasAck = Number.isFinite(s.ackHitSeq);
      const ackCoversPending = hasAck && s.ackHitSeq >= (this._optimisticTargetHitSeq || 0);
      if (ackCoversPending) {
        this._optimisticHpLockTimer = 0;
      }
      const waitingAck = hasAck && s.ackHitSeq < (this._optimisticTargetHitSeq || 0) && this._optimisticHpLockTimer > 0;
      const lockedHigher = this._optimisticHpLockTimer > 0 && incomingHp > this.hp;
      if (!waitingAck && !lockedHigher) {
        this.hp = incomingHp;
      }
    }
    if (Number.isFinite(s.energy)) this.energy = s.energy;
    if (Number.isFinite(s.stamina)) this.stamina = s.stamina;
    if (Number.isFinite(s.shieldHp)) this.shieldHp = s.shieldHp;
    this.isDead = (this._optimisticHpLockTimer > 0 && this.hp <= 0) ? true : (!!s.isDead || this.hp <= 0);
    if (s.weaponType) {
      this.weapon = { type: s.weaponType, dur: s.weaponDur || 1 };
    } else if (s.weaponType === null) {
      this.weapon = null;
    }
    if (Number.isFinite(s.bleedTimer)) this.bleedTimer = s.bleedTimer;
    if (Number.isFinite(s.burnTimer)) this.burnTimer = s.burnTimer;
    if (Number.isFinite(s.chillTimer)) this.chillTimer = s.chillTimer;
    if (Number.isFinite(s.stunTimer)) this.stunTimer = s.stunTimer;
    if (Number.isFinite(s.armorBreakTimer)) this.armorBreakTimer = s.armorBreakTimer;
    if (Number.isFinite(s.invincibleTimer)) this.invincibleTimer = s.invincibleTimer;
    if (Array.isArray(s.fiends)) {
      this._syncRemoteFiends(s.fiends);
    }
  }

  updateRemote(dt) {
    const step = Math.min(0.1, Math.max(0, dt || 0.016));
    this._netRxAge = (this._netRxAge || 0) + step;
    if (this._optimisticHpLockTimer > 0) {
      this._optimisticHpLockTimer = Math.max(0, this._optimisticHpLockTimer - step);
    }
    const bounds = this.getWorldBounds();
    const isMovingState = ['walk', 'run', 'dodge', 'flying_kick', 'air_punch'].includes(this.state);
    if (isMovingState && !this.isDead && this._netRxAge < 0.16) {
      const drWeight = Math.max(0, 1 - this._netRxAge / 0.16) * 0.55;
      if (this.netVx) {
        this.netTargetX = Math.max(bounds.minX, Math.min(bounds.maxX, (this.netTargetX || 0) + Math.max(-24, Math.min(24, this.netVx * step * drWeight))));
      }
      if (this.netVy) {
        this.netTargetY = Math.max(515, Math.min(640, (this.netTargetY || 580) + Math.max(-16, Math.min(16, this.netVy * step * drWeight))));
      }
    }
    if ((this.netTargetZ || 0) < 0 || this.netVz !== 0) {
      this.netTargetZ = (this.netTargetZ || 0) - (this.netVz || 0) * step;
      this.netVz = (this.netVz || 0) - 1300 * step;
      if (this.netTargetZ >= 0) {
        this.netTargetZ = 0;
        this.netVz = 0;
      }
    }
    const dist = Math.hypot((this.netTargetX || 0) - (this.x || 0), (this.netTargetY || 0) - (this.y || 0));
    const lerp = 1 - Math.exp(-(dist > 140 ? 18 : 14) * step);
    if (Number.isFinite(this.netTargetX)) this.x += (this.netTargetX - this.x) * lerp;
    if (Number.isFinite(this.netTargetY)) this.y += (this.netTargetY - this.y) * lerp;
    if (Number.isFinite(this.netTargetZ)) this.z += (this.netTargetZ - (this.z || 0)) * lerp;
    if (Array.isArray(this.remoteFiends) && this.remoteFiends.length > 0) {
      const fLerp = 1 - Math.exp(-16 * step);
      for (const rf of this.remoteFiends) {
        if (!rf) continue;
        if (Number.isFinite(rf._netTargetX)) rf.x += (rf._netTargetX - rf.x) * fLerp;
        if (Number.isFinite(rf._netTargetY)) rf.y += (rf._netTargetY - rf.y) * fLerp;
        if (rf.slashTimer > 0) rf.slashTimer = Math.max(0, rf.slashTimer - step);
        if (rf.life > 0) rf.life = Math.max(0.05, rf.life - step);
      }
    }
    this.animTime = (this.animTime || 0) + step;
    this.stateTimer = (this.stateTimer || 0) + step;
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - step);
    if (this.invincibleTimer > 0) this.invincibleTimer = Math.max(0, this.invincibleTimer - step);
    if (this.bleedTimer > 0) this.bleedTimer = Math.max(0, this.bleedTimer - step);
    if (this.burnTimer > 0) this.burnTimer = Math.max(0, this.burnTimer - step);
    if (this.chillTimer > 0) this.chillTimer = Math.max(0, this.chillTimer - step);
    if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - step);
    if (this.armorBreakTimer > 0) this.armorBreakTimer = Math.max(0, this.armorBreakTimer - step);
  }

  takeDamage(amount, knockbackX = 0, isKnockdown = false, opts = null) {
    const mgr = window.onlineManager;
    if (!mgr || !mgr.isActive || mgr.mode !== 'pvp') return;
    if (mgr._roundOver || (mgr._introLockTimer || 0) > 0) return;
    const bypassInv = !!(opts && opts.bypassInvincible);
    if (!bypassInv) {
      if (this.isDead || this.state === 'dodge' || this.state === 'knockdown' || this.state === 'getup' || (this.invincibleTimer || 0) > 0) return;
    } else if (this.isDead) {
      return;
    }

    const rawDmg = Math.max(1, Math.round(amount || 0));
    const isBlocked = !bypassInv && !isKnockdown && this.state === 'guard';
    const mitigation = (this.incomingDamageMul || 1) * (1 - Math.max(0, Math.min(0.85, this.damageReduction || 0))) * (isBlocked ? 0.2 : 1);
    const predictedDmg = Math.max(1, Math.round(rawDmg * mitigation));

    const bounds = this.getWorldBounds();
    const rttLock = Math.max(1.1, Math.min(2.2, ((mgr.pingMs || 220) * 3.0) / 1000));
    const hitSeq = ++mgr._lastSentHitSeq;
    this.hp = Math.max(0, (this.hp || 0) - predictedDmg);
    this._optimisticHpLockTimer = rttLock;
    this._optimisticTargetHitSeq = hitSeq;
    if (!bypassInv) {
      this.invincibleTimer = isBlocked ? 0.04 : 0.45;
      this.hitJitterTimer = 0.14;
      if (knockbackX) {
        this.netTargetX = Math.max(bounds.minX, Math.min(bounds.maxX, (this.netTargetX || this.x || 0) + Math.sign(knockbackX) * (isKnockdown ? 20 : 8)));
      }
      if (!isBlocked && !this.superArmor && !this.auraArmor) {
        this.state = isKnockdown ? 'knockdown' : 'hurt';
        this.stateTimer = 0;
      }
    }
    if (this.hp <= 0) this.isDead = true;

    if (window.audioManager && window.audioManager.playPunchHit && !bypassInv) {
      window.audioManager.playPunchHit();
    }
    if (window.effectManager && !bypassInv) {
      window.effectManager.createHitSparks(this.x, (this.y || 580) - 70, 10, isKnockdown);
      window.effectManager.addFloatingText(`-${predictedDmg}`, this.x, (this.y || 580) - 135, isKnockdown ? 'crit' : 'normal');
    }

    mgr.send({
      type: 'pvp_hit',
      hitSeq,
      damage: rawDmg,
      knockbackX: Number(knockbackX) || 0,
      isKnockdown: !!isKnockdown,
      bypassInvincible: bypassInv,
      attackerState: (window.game && window.game.player && window.game.player.state) || 'punch_straight'
    });
  }

  drawOverlay(ctx, camera, mode = 'pvp') {
    if (!ctx || !camera) return;
    const sx = this.x - camera.x;
    const sy = this.y + (this.z || 0) - camera.y;
    if (sx < -120 || sx > 1400) return;

    ctx.save();
    const isPvp = mode === 'pvp';
    const tag = isPvp ? '⚔️ ĐỐI THỦ' : '🤝 ĐỒNG ĐỘI';
    const tagColor = isPvp ? '#f87171' : '#38bdf8';
    const barW = 90;
    const barH = 6;
    const maxHp = Math.max(1, this.maxHp || 1000);
    const hpPct = Math.max(0, Math.min(1, (this.hp || 0) / maxHp));
    const damaged = this.hp < maxHp ||
      (this.bleedTimer > 0 || this.burnTimer > 0 || this.chillTimer > 0 || this.stunTimer > 0 || this.armorBreakTimer > 0);
    const labelY = damaged ? (sy - 166) : (sy - 154);

    ctx.font = '800 11px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.fillStyle = tagColor;
    ctx.fillText(`${tag}: ${(this.displayName || this.name || 'Võ Sĩ').toUpperCase()}`, sx, labelY);

    if (!damaged) {
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(sx - barW / 2, sy - 144, barW, barH);
      ctx.fillStyle = isPvp ? '#ef4444' : '#10b981';
      ctx.fillRect(sx - barW / 2, sy - 144, barW * hpPct, barH);
      ctx.strokeStyle = isPvp ? '#fca5a5' : '#7dd3fc';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - barW / 2, sy - 144, barW, barH);
      ctx.font = '700 9px Montserrat, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${Math.ceil(this.hp || 0)} / ${maxHp} HP`, sx, sy - 129);
    }
    ctx.restore();
  }
}

// ============================================================================
// ONLINE MANAGER (WEBSOCKET LOBBY, 1V1 PVP VÕ ĐÀI & 2P CO-OP ĐÁNH BOSS)
// ============================================================================
class OnlineManager {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.clientId = null;
    this.rooms = [];
    this.room = null;
    this.slot = 0;
    this.mode = 'pvp';
    this.stageId = 1;
    this.isActive = false;
    this.remotePlayer = null;
    this.pingMs = 0;
    this.playerName = 'Võ Sĩ Họ Phó';
    this.charId = 'nghi';
    this.skinId = 'default';
    this.allyId = 'auto';
    this.pvpScores = { p1: 0, p2: 0 };
    this.onlinePlayers = [];
    this.activeLobbyTab = 'rooms';
    this.quickMatchState = 'ready';
    this._qmStartMs = 0;
    this._qmTimerInterval = null;
    this._qmTimeoutMs = 45000;
    this._pendingPrivateRoomCode = null;
    this._pendingInviteData = null;
    this._nextNetId = 1;
    this._syncAccum = 0;
    this._enemySyncAccum = 0;
    this._hudSyncAccum = 0;
    this._pingTimer = 0;
    this._lastSentState = null;
    this._lastSentFacing = null;
    this._lastSentCombo = 0;
    this._lastSentX = null;
    this._lastSentY = null;
    this._lastSentZ = null;
    this._lastSentHp = null;
    this._lastSentFiendsSig = '';
    this._lastSentHitSeq = 0;
    this._lastRecvHitSeq = 0;
    this._coopHitSeq = 0;
    this._lastCoopHitAck = 0;
    this._lastCoopWaveIndex = 0;
    this._roundOver = false;
    this._rematchRequested = false;
    this._hooked = false;
    this._vfxHooked = false;
    this._applyingRemoteVfx = false;
    this._introLockTimer = 0;
    this._pendingInviteRoom = null;
    this._uiBound = false;
    this._testTransport = null;
  }

  normalizeServerUrls(raw) {
    let s = String(raw || '').trim();
    if (!s) return { httpBase: '', wsUrl: '' };
    if (!/^[a-z]+:\/\//i.test(s)) {
      const isLocal = /^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.)/i.test(s);
      s = (isLocal ? 'http://' : 'https://') + s;
    }
    s = s.replace(/\/+$/, '');
    const httpBase = s.replace(/^wss:/i, 'https:').replace(/^ws:/i, 'http:').replace(/\/ws$/i, '');
    const wsBase = httpBase.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    return { httpBase, wsUrl: `${wsBase}/ws` };
  }

  getDefaultWsUrl() {
    if (typeof window !== 'undefined' && window.location) {
      try {
        if (window.location.search) {
          const srvParam = new URLSearchParams(window.location.search).get('server');
          if (srvParam && srvParam.trim()) {
            const norm = this.normalizeServerUrls(srvParam);
            if (norm.httpBase && typeof localStorage !== 'undefined') {
              localStorage.setItem('vovinam_online_server_url', norm.httpBase);
            }
            return norm.wsUrl;
          }
        }
        if (typeof localStorage !== 'undefined') {
          const savedSrv = localStorage.getItem('vovinam_online_server_url');
          if (savedSrv && savedSrv.trim()) {
            const normSaved = this.normalizeServerUrls(savedSrv);
            const curOrigin = (window.location.origin || '').replace(/\/+$/, '');
            const isStaticSelf = Boolean(normSaved.httpBase && curOrigin && normSaved.httpBase === curOrigin && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || ''));
            if (!isStaticSelf) {
              return normSaved.wsUrl;
            }
          }
        }
      } catch (_) {}
      const defaultServer = (typeof window.VOVINAM_DEFAULT_SERVER_URL === 'string' && window.VOVINAM_DEFAULT_SERVER_URL.trim())
        ? window.VOVINAM_DEFAULT_SERVER_URL
        : ((window.location && window.location.host && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || ''))
          ? 'https://vovinam-huyet-chien-gia-toc.onrender.com'
          : '');
      if (defaultServer) {
        return this.normalizeServerUrls(defaultServer).wsUrl;
      }
      if (window.location.host) {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${proto}//${window.location.host}/ws`;
      }
    }
    return 'ws://localhost:3000/ws';
  }

  _el(id) {
    return (typeof document !== 'undefined' && typeof document.getElementById === 'function')
      ? document.getElementById(id)
      : null;
  }

  _toast(msg) {
    if (window.uiManager && typeof window.uiManager.showToast === 'function') {
      window.uiManager.showToast(msg);
    }
  }

  connect(customUrl = null) {
    if (typeof WebSocket === 'undefined') {
      this.updateConnectionUI('unavailable');
      return false;
    }
    const urlInput = this._el('online-server-url');
    const typedUrl = urlInput && urlInput.value.trim();
    const chosenRaw = customUrl || typedUrl || this.getDefaultWsUrl();
    const norm = this.normalizeServerUrls(chosenRaw);
    const rawUrl = norm.wsUrl || chosenRaw;
    if (urlInput && rawUrl) urlInput.value = rawUrl;
    if (typedUrl && norm.httpBase && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('vovinam_online_server_url', norm.httpBase);
      } catch (_) {}
    }

    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) {
      return true;
    }
    this.updateConnectionUI('connecting');

    try {
      const ws = new WebSocket(rawUrl);
      this.ws = ws;
      ws.onopen = () => {
        this.connected = true;
        this.updateConnectionUI('connected');
        this.readProfileInputs();
        this.send({
          type: 'hello',
          name: this.playerName,
          charId: this.charId,
          skinId: this.skinId,
          allyId: this.allyId
        });
        this.send({ type: 'list_rooms' });
        this.send({ type: 'list_online_players' });
        this.send({ type: 'ping_check', t: Date.now() });
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          this.handleServerMessage(msg);
        } catch (_) {}
      };
      ws.onerror = () => {
        this.connected = false;
        this.updateConnectionUI('error');
        if (this.quickMatchState === 'searching' || this.quickMatchState === 'connecting') {
          this.setQuickMatchState('lost', 'Mất kết nối tới máy chủ WebSocket');
        }
      };
      ws.onclose = () => {
        this.connected = false;
        if (this.ws === ws) this.ws = null;
        this.updateConnectionUI('disconnected');
        if (this.quickMatchState === 'searching' || this.quickMatchState === 'connecting') {
          this.setQuickMatchState('lost', 'Kết nối máy chủ bị ngắt');
        }
      };
      return true;
    } catch (_) {
      this.connected = false;
      this.updateConnectionUI('error');
      return false;
    }
  }

  disconnect() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.connected = false;
    this.updateConnectionUI('disconnected');
  }

  send(payload) {
    if (!payload) return false;
    if (typeof this._testTransport === 'function') {
      this._testTransport(payload);
      return true;
    }
    if (this.ws && this.ws.readyState === 1) {
      try {
        this.ws.send(JSON.stringify(payload));
        return true;
      } catch (_) {}
    }
    return false;
  }

  readProfileInputs() {
    const nameEl = this._el('online-player-name');
    const charEl = this._el('online-char-select');
    const skinEl = this._el('online-skin-select');
    const allyEl = this._el('online-ally-select');
    const stageEl = this._el('online-coop-stage');
    if (nameEl && nameEl.value.trim()) this.playerName = nameEl.value.trim().slice(0, 24);
    if (charEl && charEl.value) this.charId = charEl.value;
    if (this.charId === 'mocdang') {
      this.charId = 'nghi';
      if (charEl) charEl.value = 'nghi';
    }
    if (skinEl && skinEl.value) {
      this.skinId = (this.charId !== 'bichlam' && skinEl.value === 'namcheo') ? 'default' : skinEl.value;
      if (this.charId === 'nghi') this.skinId = 'default';
    }
    if (allyEl && allyEl.value) {
      this.allyId = (allyEl.value === this.charId) ? 'auto' : allyEl.value;
      if (allyEl.value !== this.allyId) allyEl.value = this.allyId;
    }
    if (stageEl && stageEl.value) this.stageId = Math.max(1, Math.min(20, Number(stageEl.value) || 1));
  }

  _getAllyMeta(allyId) {
    const id = allyId || 'auto';
    if (id === 'auto') return { id: 'auto', name: 'Tự Động' };
    if (id === 'none') return { id: 'none', name: 'Độc Hành' };
    const p = (window.ALLY_PROFILES && window.ALLY_PROFILES[id]) || null;
    if (p) return { id, name: p.name };
    const slots = window.CHAR_SLOTS || [];
    const s = slots.find((x) => x.id === id);
    return { id, name: (s && s.slotName) || id.toUpperCase() };
  }

  _getCharMeta(charId, skinId = 'default') {
    const cid = charId || 'nghi';
    const slots = window.CHAR_SLOTS || [];
    const slotObj = slots.find((s) => s.id === cid);
    const charDef = (window.CHARACTERS && window.CHARACTERS[cid]) || (window.CharacterRegistry && window.CharacterRegistry.get(cid)) || {};
    let avatar = (window.SkinRegistry && typeof window.SkinRegistry.resolveImage === 'function')
      ? window.SkinRegistry.resolveImage(slotObj || cid, skinId)
      : ((slotObj && slotObj.image) || 'assets/images/characters/char_hero_nghi.png');
    if (!window.SkinRegistry) {
      if (skinId === 'namcheo' && cid === 'bichlam') avatar = 'assets/images/characters/char_bichlam_namcheo.png';
      else if (skinId === 'vovinam' && cid !== 'nghi') avatar = `assets/images/characters/char_${cid}_vovinam.png`;
    }
    return {
      name: (charDef && charDef.name) || (slotObj && slotObj.name) || cid.toUpperCase(),
      title: (charDef && (charDef.title || charDef.role)) || (slotObj && slotObj.style) || 'Võ Sĩ Gia Tộc',
      tag: (slotObj && slotObj.tag) || 'VÕ ĐẠO',
      desc: (charDef && charDef.desc) || (slotObj && slotObj.desc) || 'Sẵn sàng nghênh chiến tại Đấu Trường Gia Tộc',
      avatar
    };
  }

  _populateSkinOptions(preferredSkin = null) {
    const charEl = this._el('online-char-select');
    const skinEl = this._el('online-skin-select');
    const charId = (charEl && charEl.value) || this.charId || 'nghi';
    if (!skinEl) return 'default';

    const list = (window.SkinRegistry && typeof window.SkinRegistry.getForCharacter === 'function')
      ? window.SkinRegistry.getForCharacter(charId)
      : [{ id: 'default', name: 'Mặc Định (Phàm Phẩm)' }];

    const sm = window.saveManager;
    const prevVal = preferredSkin || skinEl.value || this.skinId || 'default';
    skinEl.innerHTML = '';
    if (Array.isArray(skinEl.children)) skinEl.children.length = 0;
    let validSelected = 'default';

    for (const sk of list) {
      if (!sk || !sk.id) continue;
      const opt = (typeof document !== 'undefined' && typeof document.createElement === 'function')
        ? document.createElement('option')
        : { value: '', textContent: '', disabled: false };
      const isLocked = sk.id !== 'default' && sk.id !== 'vovinam' && sm && typeof sm.isSkinUnlocked === 'function' && !sm.isSkinUnlocked(charId, sk.id);
      opt.value = sk.id;
      opt.textContent = isLocked ? `${sk.name} (Chưa sở hữu)` : (sk.tier ? `${sk.name} (${sk.tier})` : sk.name);
      if (isLocked) opt.disabled = true;
      if (typeof skinEl.appendChild === 'function') skinEl.appendChild(opt);
      if (sk.id === prevVal && !isLocked) {
        validSelected = sk.id;
      }
    }
    if (!list.some((s) => s && s.id === validSelected)) {
      validSelected = (list[0] && list[0].id) || 'default';
    }
    skinEl.value = validSelected;
    this.skinId = validSelected;
    return validSelected;
  }

  _updateHeroShowcase() {
    this.readProfileInputs();
    const meta = this._getCharMeta(this.charId, this.skinId);
    const imgEl = this._el('online-hero-preview-img');
    const bgImgEl = this._el('online-hero-backdrop-img');
    const nameEl = this._el('online-hero-preview-name');
    const tagEl = this._el('online-hero-preview-tag');
    const descEl = this._el('online-hero-preview-desc');
    const streakEl = this._el('aov-win-streak');
    if (imgEl) imgEl.src = meta.avatar;
    if (bgImgEl) bgImgEl.src = meta.avatar;
    if (nameEl) nameEl.textContent = meta.name.toUpperCase();
    if (tagEl) tagEl.textContent = this.skinId !== 'default' ? `${meta.tag} • ${this.skinId.toUpperCase()}` : meta.tag;
    const allyMeta = this._getAllyMeta(this.allyId);
    if (descEl) descEl.textContent = `${meta.desc} • 🤝 Trợ chiến: ${allyMeta.name}`;
    if (streakEl && window.accountManager && window.accountManager.isLoggedIn() && window.accountManager.user) {
      streakEl.textContent = String(window.accountManager.user.pvpWins || 1);
    }
  }

  _populateCoopStages() {
    const stageEl = this._el('online-coop-stage');
    const defs = window.STAGE_DEFINITIONS;
    if (!stageEl || !defs || stageEl.__vov20Populated) return;
    stageEl.__vov20Populated = true;
    const prevVal = stageEl.value || String(this.stageId || 1);
    const ids = Object.keys(defs).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    if (!ids.length) return;
    stageEl.innerHTML = ids.map((id) => {
      const s = defs[id];
      const bossTag = s.bossName ? ` [🔥 BOSS: ${s.bossName}]` : (s.escape ? ' [🏃 TRỐN THOÁT]' : '');
      return `<option value="${id}">${s.title}${bossTag}</option>`;
    }).join('');
    stageEl.value = defs[Number(prevVal)] ? prevVal : String(ids[0]);
  }

  _appendChatMessage(senderName, text, isSystem = false) {
    const log = this._el('online-chat-log');
    if (!log) return;
    const row = document.createElement('div');
    row.className = isSystem ? 'opfp-chat-sys' : 'opfp-chat-msg';
    if (isSystem) {
      row.textContent = text;
    } else {
      const strong = document.createElement('strong');
      strong.textContent = `${senderName || 'Võ Sĩ'}: `;
      row.appendChild(strong);
      row.appendChild(document.createTextNode(String(text || '').slice(0, 90)));
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  sendQuickChat(text) {
    const clean = String(text || '').trim().slice(0, 90);
    if (!clean) return;
    this.readProfileInputs();
    this.send({ type: 'chat_emote', senderName: this.playerName, text: clean });
    this._appendChatMessage(this.playerName, clean, false);
  }

  setLobbyMode(mode) {
    this.mode = (mode === 'coop') ? 'coop' : 'pvp';
    const btnPvp = this._el('online-mode-pvp');
    const btnCoop = this._el('online-mode-coop');
    const stageRow = this._el('online-coop-stage-row');
    if (btnPvp && btnPvp.classList) btnPvp.classList.toggle('active', this.mode === 'pvp');
    if (btnCoop && btnCoop.classList) btnCoop.classList.toggle('active', this.mode === 'coop');
    if (stageRow && stageRow.classList) stageRow.classList.toggle('hidden', this.mode !== 'coop');
    if (this.room && this.slot === 1) {
      this.send({
        type: 'update_lobby',
        mode: this.mode,
        stageId: this.stageId,
        name: this.playerName,
        charId: this.charId,
        skinId: this.skinId,
        allyId: this.allyId
      });
    }
  }

  syncLobbyProfile() {
    this.readProfileInputs();
    if (window.saveManager && window.saveManager.data) {
      window.saveManager.data.selectedAlly = this.allyId;
    }
    if (this.room) {
      this.send({
        type: 'update_lobby',
        mode: this.mode,
        stageId: this.stageId,
        name: this.playerName,
        charId: this.charId,
        skinId: this.skinId,
        allyId: this.allyId
      });
    } else if (this.connected) {
      this.send({
        type: 'update_lobby',
        name: this.playerName,
        charId: this.charId,
        skinId: this.skinId,
        allyId: this.allyId
      });
    }
  }

  updateConnectionUI(status) {
    const pill = this._el('online-conn-status');
    const netLabel = this._el('online-profile-net-label');
    const pingEl = this._el('online-ping-badge');
    if (pingEl) {
      pingEl.textContent = (status === 'connected' && this.pingMs > 0) ? `Ping: ${this.pingMs} ms` : (status === 'connected' ? 'Ping: <10 ms' : 'Ping: -- ms');
    }
    if (!pill) return;
    if (pill.classList) pill.classList.remove('connected', 'error');
    if (status === 'connected') {
      pill.textContent = '🟢 Đã kết nối Server';
      if (pill.classList) pill.classList.add('connected');
      if (netLabel) netLabel.textContent = 'Trực tuyến';
    } else if (status === 'connecting') {
      pill.textContent = '🟡 Đang kết nối...';
      if (netLabel) netLabel.textContent = 'Đang kết nối';
    } else if (status === 'error') {
      const isStaticHost = (typeof window !== 'undefined' && window.location && /vercel\.app$/i.test(window.location.host || ''));
      pill.textContent = isStaticHost
        ? '🔴 Chưa nối Backend WS — Bấm ⚙️ Máy chủ để dán link Server'
        : '🔴 Không kết nối được (Hãy chạy npm start)';
      if (isStaticHost) {
        const cfgBar = this._el('online-server-config-bar');
        if (cfgBar && cfgBar.classList) cfgBar.classList.remove('hidden');
      }
      if (pill.classList) pill.classList.add('error');
      if (netLabel) netLabel.textContent = 'Mất kết nối';
    } else {
      pill.textContent = '⚪ Chưa kết nối';
      if (netLabel) netLabel.textContent = 'Ngoại tuyến';
    }
  }

  setOnlineSubtab(tab) {
    const valid = ['rooms', 'quickmatch', 'create', 'players'].includes(tab) ? tab : 'rooms';
    this.activeLobbyTab = valid;
    const views = {
      rooms: this._el('online-view-rooms'),
      quickmatch: this._el('online-view-quickmatch'),
      create: this._el('online-view-create'),
      players: this._el('online-view-players')
    };
    const btns = {
      rooms: this._el('btn-onltab-rooms'),
      quickmatch: this._el('btn-onltab-quickmatch'),
      create: this._el('btn-onltab-create'),
      players: this._el('btn-onltab-players')
    };
    Object.keys(views).forEach((k) => {
      if (views[k] && views[k].classList) views[k].classList.toggle('hidden', k !== valid);
      if (btns[k] && btns[k].classList) btns[k].classList.toggle('active', k === valid);
    });
    if (valid === 'rooms' && this.connected) this.send({ type: 'list_rooms' });
    if (valid === 'players' && this.connected) this.send({ type: 'list_online_players' });
  }

  _stopQmTimer() {
    if (this._qmTimerInterval) {
      clearInterval(this._qmTimerInterval);
      this._qmTimerInterval = null;
    }
  }

  setQuickMatchState(state, customDesc = null) {
    const s = state || 'ready';
    this.quickMatchState = s;
    const card = this._el('online-qm-card');
    const icon = this._el('online-qm-icon');
    const badge = this._el('online-qm-status-badge');
    const title = this._el('online-qm-status-title');
    const desc = this._el('online-qm-status-desc');
    const timerEl = this._el('online-qm-timer');
    const startBtn = this._el('btn-online-qm-start');
    const cancelBtn = this._el('btn-online-cancel-search');

    const metaMap = {
      ready: { icon: '⚡', badge: 'READY TO SEARCH', title: 'SẴN SÀNG TÌM TRẬN', desc: 'Chọn chế độ bên trái (1v1 Võ Đài hoặc 2P Co-op) rồi nhấn Bắt đầu để tìm đối thủ thời gian thực.' },
      searching: { icon: '📡', badge: 'SEARCHING FOR OPPONENT', title: 'ĐANG TÌM ĐỐI THỦ...', desc: 'Hệ thống đang quét sảnh đấu trực tuyến để ghép võ sĩ ngang tầm kỹ năng.' },
      found: { icon: '⚔️', badge: 'OPPONENT FOUND', title: 'ĐÃ TÌM THẤY ĐỐI THỦ!', desc: 'Đã khóa ghép cặp! Đang đưa hai võ sĩ vào phòng đấu...' },
      connecting: { icon: '🔗', badge: 'CONNECTING', title: 'ĐANG KẾT NỐI PHÒNG ĐẤU...', desc: 'Đang đồng bộ đội hình và trạng thái WebSocket...' },
      match_ready: { icon: '🔥', badge: 'MATCH READY', title: 'PHÒNG ĐẤU ĐÃ SẴN SÀNG!', desc: 'Hai võ sĩ đã hội tụ đủ. Chuẩn bị khai chiến!' },
      failed: { icon: '⏱️', badge: 'MATCHMAKING FAILED', title: 'GHÉP TRẬN KHÔNG THÀNH CÔNG', desc: 'Hiện chưa tìm thấy đối thủ phù hợp. Vui lòng thử lại hoặc Tạo Phòng!' },
      lost: { icon: '📡', badge: 'CONNECTION LOST', title: 'MẤT KẾT NỐI MÁY CHỦ', desc: 'Đường truyền tới máy chủ bị gián đoạn. Vui lòng kết nối lại.' },
      cancelled: { icon: '🛑', badge: 'SEARCH CANCELLED', title: 'ĐÃ HỦY TÌM TRẬN', desc: 'Bạn đã dừng tìm trận nhanh. Có thể bắt đầu lại bất cứ lúc nào.' }
    };
    const m = metaMap[s] || metaMap.ready;

    if (card) card.className = `online-qm-card state-${s}`;
    if (icon) icon.textContent = m.icon;
    if (badge) badge.textContent = m.badge;
    if (title) title.textContent = m.title;
    if (desc) desc.textContent = customDesc || m.desc;

    if (s === 'searching') {
      this._qmStartMs = Date.now();
      this._stopQmTimer();
      const tick = () => {
        if (this.quickMatchState !== 'searching') {
          this._stopQmTimer();
          return;
        }
        const elapsed = Date.now() - this._qmStartMs;
        const secTotal = Math.floor(elapsed / 1000);
        const mm = String(Math.floor(secTotal / 60)).padStart(2, '0');
        const ss = String(secTotal % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mm}:${ss}`;
        if (elapsed >= this._qmTimeoutMs) {
          this.send({ type: 'cancel_quick_match' });
          this.setQuickMatchState('failed', 'Hết thời gian chờ tìm đối thủ (45s). Bạn có thể thử lại hoặc Tạo Phòng công khai!');
        }
      };
      if (timerEl) timerEl.textContent = '00:00';
      this._qmTimerInterval = setInterval(tick, 1000);
    } else {
      this._stopQmTimer();
      if (s === 'ready' || s === 'cancelled') {
        if (timerEl) timerEl.textContent = '00:00';
      }
    }

    if (startBtn && startBtn.classList) {
      startBtn.classList.toggle('hidden', s === 'searching' || s === 'found' || s === 'connecting');
      startBtn.textContent = (s === 'failed' || s === 'lost' || s === 'cancelled') ? '↻ TÌM TRẬN LẠI' : '⚡ BẮT ĐẦU TÌM TRẬN';
    }
    if (cancelBtn && cancelBtn.classList) {
      cancelBtn.classList.toggle('hidden', s !== 'searching');
    }
  }

  startQuickMatch(modeOverride = null) {
    if (modeOverride === 'coop' || modeOverride === 'pvp') {
      this.setLobbyMode(modeOverride);
    }
    this.setOnlineSubtab('quickmatch');
    if (!this.connected && !this._testTransport) {
      this.setQuickMatchState('lost', 'Chưa kết nối Server! Chạy npm start rồi bấm KẾT NỐI.');
      this._toast('Chưa kết nối Server! Chạy npm start rồi bấm KẾT NỐI.');
      this.connect();
      return;
    }
    this.readProfileInputs();
    this.setQuickMatchState('searching');
    this.send({
      type: 'quick_match',
      mode: this.mode,
      stageId: this.stageId,
      name: this.playerName,
      charId: this.charId,
      skinId: this.skinId,
      allyId: this.allyId
    });
  }

  cancelQuickMatch() {
    if (this.quickMatchState !== 'searching') return;
    this.send({ type: 'cancel_quick_match' });
    this.room = null;
    this.slot = 0;
    this.setQuickMatchState('cancelled');
    this.renderRoomPanel();
  }

  submitCreateRoom() {
    if (!this.connected && !this._testTransport) {
      this._toast('Chưa kết nối Server! Chạy npm start rồi bấm KẾT NỐI.');
      this.connect();
      return;
    }
    this.readProfileInputs();
    const nameEl = this._el('online-create-room-name');
    const privEl = this._el('online-create-privacy');
    const passEl = this._el('online-create-password');
    const roomName = (nameEl && nameEl.value.trim()) ? nameEl.value.trim().slice(0, 32) : `Võ Đài của ${this.playerName}`;
    const isPrivate = !!(privEl && privEl.value === 'private');
    const password = (isPrivate && passEl && passEl.value.trim()) ? passEl.value.trim().slice(0, 12) : '';
    this.setQuickMatchState('ready');
    this.send({
      type: 'create_room',
      roomName,
      isPrivate,
      password,
      mode: this.mode,
      stageId: this.stageId,
      name: this.playerName,
      charId: this.charId,
      skinId: this.skinId,
      allyId: this.allyId
    });
  }

  renderOnlinePlayers() {
    const countBadge = this._el('online-player-count-badge');
    const peers = (this.onlinePlayers || []).filter((p) => p && p.id !== this.clientId);
    if (countBadge) countBadge.textContent = String((this.onlinePlayers || []).length);

    const renderInto = (container, emptyMsg, inRoomMode) => {
      if (!container) return;
      if (!peers.length) {
        container.innerHTML = `<div class="online-room-item"><span>${emptyMsg}</span></div>`;
        return;
      }
      container.innerHTML = '';
      for (const p of peers) {
        const row = document.createElement('div');
        row.className = 'online-room-item';
        const statusTxt = p.status === 'in_room' ? `Trong phòng #${p.roomCode || '?'}` : (p.status === 'searching' ? 'Đang tìm trận' : 'Đang rảnh tại Sảnh');
        row.innerHTML = `<span>🟢 <strong>${p.name}</strong> • ${this._getCharMeta(p.charId, p.skinId).name} • <em>${statusTxt}</em></span>`;
        if (this.room && (inRoomMode || p.status !== 'in_room')) {
          const invBtn = document.createElement('button');
          invBtn.type = 'button';
          invBtn.className = 'btn btn-sm btn-primary';
          invBtn.textContent = '📨 MỜI';
          invBtn.onclick = () => {
            this.send({ type: 'send_invite', targetClientId: p.id });
          };
          row.appendChild(invBtn);
        }
        container.appendChild(row);
      }
    };

    renderInto(this._el('online-players-list'), 'Hiện chỉ có mình bạn trong Sảnh — Hãy mở thêm tab hoặc mời bạn qua mạng LAN/Web!', false);
    renderInto(this._el('online-inroom-players-list'), 'Chưa có võ sĩ khác đang online — Bạn có thể dùng 🔗 SAO CHÉP LINK!', true);
  }

  async _fetchWebShareInfo() {
    const urlSpan = this._el('online-share-web-url');
    if (!urlSpan || typeof fetch !== 'function') return;
    try {
      const norm = this.normalizeServerUrls(this.getDefaultWsUrl());
      const infoEndpoint = norm.httpBase ? `${norm.httpBase}/api/online/info` : '/api/online/info';
      const res = await fetch(infoEndpoint);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ok) {
        const isLocal = (typeof window !== 'undefined' && window.location && /localhost|127\.0\.0\.1/.test(window.location.hostname || ''));
        const curPageUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? `${window.location.origin}/` : 'http://localhost:3000/';
        const bestUrl = (isLocal && Array.isArray(data.lanUrls) && data.lanUrls.length > 0)
          ? data.lanUrls[0]
          : (isLocal ? (data.currentUrl || curPageUrl) : curPageUrl);
        urlSpan.textContent = bestUrl;
        urlSpan.title = (isLocal && Array.isArray(data.lanUrls) && data.lanUrls.length > 0)
          ? `Địa chỉ LAN chơi chung: ${data.lanUrls.join(' | ')}`
          : bestUrl;
      }
    } catch (_) {}
  }

  renderRoomsList() {
    const listEl = this._el('online-rooms-list');
    const countPill = this._el('online-rooms-count-pill');
    if (!listEl) return;
    const waiting = (this.rooms || []).filter((r) => r && r.status === 'waiting');
    if (countPill) countPill.textContent = `${waiting.length} phòng`;
    if (!waiting.length) {
      listEl.innerHTML = `
        <div class="online-empty-arena">
          <span class="empty-arena-ico">⚔️</span>
          <strong>CHƯA CÓ LÔI ĐÀI ĐANG CHỜ</strong>
          <span>Mở lôi đài mới để rủ bạn bè hoặc ghép đối thủ trực tuyến ngay!</span>
          <div class="empty-arena-actions">
            <button id="btn-online-empty-create" type="button" class="btn btn-sm btn-primary">➕ TẠO PHÒNG NGAY</button>
            <button id="btn-online-empty-qm" type="button" class="btn btn-sm btn-secondary">⚡ TÌM NHANH</button>
          </div>
        </div>`;
      const btnEmptyCreate = this._el('btn-online-empty-create');
      if (btnEmptyCreate) btnEmptyCreate.onclick = () => this.setOnlineSubtab('create');
      const btnEmptyQm = this._el('btn-online-empty-qm');
      if (btnEmptyQm) btnEmptyQm.onclick = () => this.startQuickMatch();
      return;
    }
    listEl.innerHTML = '';
    for (const r of waiting) {
      const row = document.createElement('div');
      row.className = 'online-room-item online-room-card-pro';
      const isCoop = r.mode === 'coop';
      const modeBadge = isCoop
        ? `<span class="orcp-mode coop">🤝 CO-OP M${r.stageId || 1}</span>`
        : `<span class="orcp-mode pvp">⚔️ 1V1 PVP</span>`;
      const lockBadge = r.isPrivate ? '<span class="orcp-lock" title="Phòng riêng tư">🔒</span>' : '';
      const rTitle = r.roomName || `Võ Đài #${r.code}`;
      const occDots = r.playerCount >= 2 ? '●●' : '●○';
      row.innerHTML = `
        <div class="orcp-info">
          <div class="orcp-top">${modeBadge}${lockBadge}<strong class="orcp-title">${rTitle}</strong><span class="orcp-code">#${r.code}</span></div>
          <div class="orcp-sub">Chủ đài: <strong>${r.hostName}</strong> • <span class="orcp-occ">${occDots} ${r.playerCount}/2</span></div>
        </div>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-primary orcp-join-btn';
      btn.textContent = r.isPrivate && r.hasPassword ? '🔑 MỞ KHÓA' : 'VÀO ĐÀI ➔';
      btn.onclick = () => {
        if (r.isPrivate && r.hasPassword) {
          this._pendingPrivateRoomCode = r.code;
          const pBar = this._el('online-private-join-bar');
          const pCode = this._el('online-private-join-code');
          if (pCode) pCode.textContent = r.code;
          if (pBar && pBar.classList) pBar.classList.remove('hidden');
          return;
        }
        this.readProfileInputs();
        this.send({
          type: 'join_room',
          code: r.code,
          name: this.playerName,
          charId: this.charId,
          skinId: this.skinId,
          allyId: this.allyId
        });
      };
      row.appendChild(btn);
      listEl.appendChild(row);
    }
  }

  _syncInRoomLoadoutControls() {
    const charSel = this._el('online-inroom-char');
    const skinSel = this._el('online-inroom-skin');
    const allySel = this._el('online-inroom-ally');
    const srcChar = this._el('online-char-select');
    const srcAlly = this._el('online-ally-select');
    if (charSel && srcChar && !charSel.__vovSynced && srcChar.innerHTML) {
      charSel.__vovSynced = true;
      charSel.innerHTML = srcChar.innerHTML;
    }
    if (allySel && srcAlly && !allySel.__vovSynced && srcAlly.innerHTML) {
      allySel.__vovSynced = true;
      allySel.innerHTML = srcAlly.innerHTML;
    }
    if (charSel) charSel.value = this.charId;
    if (allySel) allySel.value = this.allyId;
    if (skinSel) {
      const list = (window.SkinRegistry && typeof window.SkinRegistry.getForCharacter === 'function')
        ? window.SkinRegistry.getForCharacter(this.charId)
        : [{ id: 'default', name: 'Mặc Định' }];
      skinSel.innerHTML = list.map((sk) => `<option value="${sk.id}">${sk.name}</option>`).join('');
      skinSel.value = list.some((s) => s.id === this.skinId) ? this.skinId : 'default';
    }
  }

  renderRoomPanel() {
    const browserPanel = this._el('online-browser-panel');
    const roomPanel = this._el('online-room-panel');
    const lobbyCard = this._el('online-lobby-card');
    const modal = this._el('online-modal');
    const lobbyGrid = (modal && typeof modal.querySelector === 'function') ? modal.querySelector('.aov-lobby-grid') : null;
    if (!browserPanel || !roomPanel) return;

    const waitingForMatchmaking = !!(
      this.room &&
      this.quickMatchState === 'searching' &&
      Array.isArray(this.room.players) &&
      this.room.players.length < 2
    );
    const inRoom = !!this.room && !waitingForMatchmaking;
    if (lobbyCard && lobbyCard.classList && typeof lobbyCard.classList.toggle === 'function') {
      lobbyCard.classList.toggle('in-room-screen', inRoom);
    }
    if (modal && modal.classList && typeof modal.classList.toggle === 'function') {
      modal.classList.toggle('in-room-screen', inRoom);
    }
    if (lobbyGrid && lobbyGrid.classList && typeof lobbyGrid.classList.toggle === 'function') {
      lobbyGrid.classList.toggle('hidden', inRoom);
    }

    if (!inRoom) {
      browserPanel.classList.remove('hidden');
      roomPanel.classList.add('hidden');
      return;
    }

    browserPanel.classList.add('hidden');
    roomPanel.classList.remove('hidden');

    const roomNameEl = this._el('online-room-name-display');
    const codeEl = this._el('online-room-code-display');
    const modeEl = this._el('online-room-mode-label');
    const privEl = this._el('online-room-privacy-tag');
    const p1El = this._el('online-slot-p1');
    const p2El = this._el('online-slot-p2');
    const readyBtn = this._el('btn-online-ready');
    const startBtn = this._el('btn-online-start-match');
    const readyHint = this._el('online-wr-ready-hint');

    if (roomNameEl) roomNameEl.textContent = this.room.roomName || `Võ Đài #${this.room.code || '----'}`;
    if (codeEl) codeEl.textContent = this.room.code || '----';
    if (modeEl) {
      modeEl.textContent = this.room.mode === 'coop'
        ? `🤝 2P Co-op Đánh Boss (Màn ${this.room.stageId || 1})`
        : '⚔️ 1v1 PvP Võ Đài';
    }
    if (privEl) {
      privEl.textContent = this.room.isPrivate ? '🔒 Riêng tư' : '🌐 Công khai';
    }

    const players = this.room.players || [];
    const p1 = players.find((p) => p.slot === 1);
    const p2 = players.find((p) => p.slot === 2);

    const charLabel = (cid) => {
      const c = window.CHARACTERS && window.CHARACTERS[cid];
      return c ? c.name : (cid || 'nghi');
    };
    const renderSlotCard = (player, isHostSlot) => {
      const meta = this._getCharMeta(player.charId, player.skinId);
      const allyMeta = this._getAllyMeta(player.allyId);
      const roleTag = isHostSlot ? '👑 CHỦ PHÒNG' : '⚔️ ĐỐI THỦ / ĐỒNG ĐỘI';
      const readyHtml = player.ready !== false
        ? '<span class="opfp-ready-pill ready">✓ SẴN SÀNG</span>'
        : '<span class="opfp-ready-pill not-ready">⏳ CHƯA SẴN SÀNG</span>';
      const skinLabel = player.skinId && player.skinId !== 'default' ? ` • Skin: ${player.skinId}` : '';
      return `<img class="opfp-slot-avatar" src="${meta.avatar}" alt="" style="color:${isHostSlot ? '#facc15' : '#38bdf8'}">
        <div class="opfp-slot-info">
          <div class="opfp-slot-head"><strong>${isHostSlot ? 'P1' : 'P2'}: ${player.name}</strong><span class="opfp-role-badge">${roleTag}</span></div>
          <span>${charLabel(player.charId)}${skinLabel} • 🤝 ${allyMeta.name}</span>
          <div class="opfp-slot-badges">🟢 Online ${readyHtml}</div>
        </div>`;
    };

    if (p1El) {
      p1El.className = p1 ? 'online-slot-card opfp-slot-card opfp-slot-p1 vov-wr-fighter-card' : 'online-slot-card opfp-slot-card opfp-slot-p1 vov-wr-fighter-card empty';
      p1El.innerHTML = p1 ? renderSlotCard(p1, true) : '<div class="opfp-slot-info"><strong>P1: Trống</strong></div>';
    }
    if (p2El) {
      p2El.className = p2 ? 'online-slot-card opfp-slot-card opfp-slot-p2 vov-wr-fighter-card' : 'online-slot-card opfp-slot-card opfp-slot-p2 vov-wr-fighter-card empty';
      p2El.innerHTML = p2
        ? renderSlotCard(p2, false)
        : '<div class="opfp-slot-info"><strong>P2: Đang chờ đối thủ...</strong><span>Gửi mã phòng, 🔗 SAO CHÉP LINK hoặc bấm 📨 MỜI ONLINE</span></div>';
    }

    const me = players.find((p) => p.slot === this.slot) || null;
    if (me) {
      this.charId = me.charId || this.charId;
      this.skinId = me.skinId || this.skinId;
      this.allyId = me.allyId || this.allyId;
    }
    this._syncInRoomLoadoutControls();

    const myReady = !me || me.ready !== false;
    if (readyBtn) {
      readyBtn.classList.toggle('active', myReady);
      readyBtn.textContent = myReady ? '✓ ĐÃ SẴN SÀNG' : '⏳ BẤM SẴN SÀNG';
    }
    const allReady = players.length >= 2 && players.every((p) => p.ready !== false);
    if (readyHint) {
      if (players.length < 2) readyHint.textContent = 'Đang chờ đủ 2 võ sĩ trong phòng để giao đấu...';
      else if (!allReady) readyHint.textContent = 'Chờ cả 2 võ sĩ nhấn [✓ SẴN SÀNG] để Chủ phòng bắt đầu!';
      else readyHint.textContent = '✓ Cả 2 võ sĩ đã sẵn sàng! Chủ phòng có thể khai chiến ngay!';
    }

    if (startBtn) {
      const canStart = this.slot === 1 && allReady;
      startBtn.disabled = !canStart;
      startBtn.textContent = this.slot === 1
        ? (allReady ? '🔥 BẮT ĐẦU TRẬN ĐẤU' : (players.length < 2 ? '⏳ CHỜ ĐỐI THỦ...' : '⏳ CHỜ SẴN SÀNG...'))
        : '⏳ CHỜ CHỦ PHÒNG BẮT ĐẦU...';
    }
  }

  openModal() {
    this.bindUI();
    const modal = this._el('online-modal');
    if (modal && modal.classList) modal.classList.remove('hidden');
    const urlEl = this._el('online-server-url');
    if (urlEl && !urlEl.value) urlEl.value = this.getDefaultWsUrl();

    if (window.saveManager && window.saveManager.data) {
      let savedChar = window.saveManager.data.selectedCharacter || 'nghi';
      if (savedChar === 'mocdang') savedChar = 'nghi';
      const savedAlly = window.saveManager.data.selectedAlly || 'auto';
      const charEl = this._el('online-char-select');
      const allyEl = this._el('online-ally-select');
      const eqSkin = (typeof window.saveManager.getEquippedSkin === 'function')
        ? (window.saveManager.getEquippedSkin(savedChar) || 'default')
        : 'default';
      if (charEl && !this.room) {
        charEl.value = savedChar;
      }
      if (allyEl && !this.room) {
        allyEl.value = (savedAlly === savedChar) ? 'auto' : savedAlly;
      }
      this._populateSkinOptions(!this.room ? eqSkin : null);
    } else {
      this._populateSkinOptions();
    }
    this._populateCoopStages();
    this.readProfileInputs();
    this._updateHeroShowcase();
    this.renderRoomsList();
    this.renderOnlinePlayers();
    this.renderRoomPanel();
    this._fetchWebShareInfo();
    this.connect();
  }

  closeModal() {
    this._stopQmTimer();
    const modal = this._el('online-modal');
    if (modal && modal.classList) modal.classList.add('hidden');
  }

  bindUI() {
    if (this._uiBound || typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const onlineBtn = this._el('btn-online-mode');
    const topOnlineBtn = this._el('btn-top-online');
    const modal = this._el('online-modal');
    if (!onlineBtn && !topOnlineBtn && !modal) return;
    this._uiBound = true;

    const bindClick = (id, fn) => {
      const el = this._el(id);
      if (!el || el.__vovOnlineBound || typeof el.addEventListener !== 'function') return;
      el.__vovOnlineBound = true;
      el.addEventListener('click', fn);
    };
    const bindChange = (id, fn) => {
      const el = this._el(id);
      if (!el || el.__vovOnlineBound || typeof el.addEventListener !== 'function') return;
      el.__vovOnlineBound = true;
      el.addEventListener('change', fn);
    };

    bindClick('btn-online-mode', () => this.openModal());
    bindClick('btn-top-online', () => this.openModal());
    bindClick('btn-online-close', () => this.closeModal());
    bindClick('btn-online-close-x', () => this.closeModal());
    bindClick('btn-online-reconnect', () => {
      this.disconnect();
      this.connect();
    });
    bindClick('btn-online-toggle-server', () => {
      const cfgBar = this._el('online-server-config-bar');
      if (cfgBar && cfgBar.classList) cfgBar.classList.toggle('hidden');
    });
    bindClick('btn-online-copy-web-url', () => {
      const urlSpan = this._el('online-share-web-url');
      let webUrl = (urlSpan && urlSpan.textContent) || (typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000/');
      try {
        const savedSrv = typeof localStorage !== 'undefined' ? localStorage.getItem('vovinam_online_server_url') : '';
        if (savedSrv && !webUrl.includes('server=')) {
          const u = new URL(webUrl);
          if (!savedSrv.startsWith(u.origin)) {
            u.searchParams.set('server', savedSrv);
            webUrl = u.toString();
          }
        }
      } catch (_) {}
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(webUrl).catch(() => {});
      }
      this._toast(`🌐 Đã sao chép Link Web: ${webUrl}`);
    });
    bindClick('online-mode-pvp', () => this.setLobbyMode('pvp'));
    bindClick('online-mode-coop', () => this.setLobbyMode('coop'));
    bindClick('btn-online-coop-quick', () => {
      this.setLobbyMode('coop');
      this.setOnlineSubtab('rooms');
      this._toast('🤝 Đã chuyển sang chế độ Hợp Tác 2P Co-op — chọn màn bên trái rồi Tìm Nhanh hoặc Tạo Phòng!');
    });
    bindChange('online-player-name', () => this.syncLobbyProfile());
    bindChange('online-char-select', () => {
      const eqSkin = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function' && this._el('online-char-select'))
        ? window.saveManager.getEquippedSkin(this._el('online-char-select').value)
        : 'default';
      this._populateSkinOptions(eqSkin);
      this._updateHeroShowcase();
      this.syncLobbyProfile();
    });
    bindChange('online-skin-select', () => { this._updateHeroShowcase(); this.syncLobbyProfile(); });
    bindChange('online-ally-select', () => { this._updateHeroShowcase(); this.syncLobbyProfile(); });
    bindChange('online-coop-stage', () => this.syncLobbyProfile());

    // Sub-navigation tabs in lobby
    bindClick('btn-onltab-rooms', () => this.setOnlineSubtab('rooms'));
    bindClick('btn-onltab-quickmatch', () => this.setOnlineSubtab('quickmatch'));
    bindClick('btn-onltab-create', () => this.setOnlineSubtab('create'));
    bindClick('btn-onltab-players', () => this.setOnlineSubtab('players'));

    // Quick Match controls
    bindClick('btn-online-qm-start', () => this.startQuickMatch());
    bindClick('btn-online-cancel-search', () => this.cancelQuickMatch());
    bindClick('btn-online-quick-match', () => this.startQuickMatch());

    // Create Room controls
    bindChange('online-create-privacy', () => {
      const priv = this._el('online-create-privacy');
      const pwRow = this._el('online-create-password-row');
      if (pwRow && pwRow.classList) pwRow.classList.toggle('hidden', !(priv && priv.value === 'private'));
    });
    bindClick('btn-online-create-room', () => this.setOnlineSubtab('create'));
    bindClick('btn-online-submit-create', () => this.submitCreateRoom());

    // Online Players refresh + Private password join bar
    bindClick('btn-online-refresh-players', () => this.send({ type: 'list_online_players' }));
    bindClick('btn-online-join-private-cancel', () => {
      this._pendingPrivateRoomCode = null;
      const pBar = this._el('online-private-join-bar');
      if (pBar && pBar.classList) pBar.classList.add('hidden');
    });
    bindClick('btn-online-join-private-confirm', () => {
      const code = this._pendingPrivateRoomCode || '';
      const passEl = this._el('online-join-password');
      const password = passEl ? passEl.value.trim() : '';
      if (!code) return;
      this.readProfileInputs();
      this.send({
        type: 'join_room',
        code,
        password,
        name: this.playerName,
        charId: this.charId,
        skinId: this.skinId,
        allyId: this.allyId
      });
    });

    // Incoming Room Invite Banner
    bindClick('btn-online-invite-accept', () => {
      const inv = this._pendingInviteData;
      this._pendingInviteData = null;
      const banner = this._el('online-invite-banner');
      if (banner && banner.classList) banner.classList.add('hidden');
      if (!inv || !inv.roomCode) return;
      this.readProfileInputs();
      this.send({
        type: 'join_room',
        code: inv.roomCode,
        viaInvite: true,
        name: this.playerName,
        charId: this.charId,
        skinId: this.skinId,
        allyId: this.allyId
      });
    });
    bindClick('btn-online-invite-decline', () => {
      this._pendingInviteData = null;
      const banner = this._el('online-invite-banner');
      if (banner && banner.classList) banner.classList.add('hidden');
    });

    // Waiting Room Ready, Invite Drawer & In-Room Loadout Switcher
    bindClick('btn-online-ready', () => {
      this.send({ type: 'toggle_ready' });
    });
    bindClick('btn-online-invite-modal', () => {
      const drawer = this._el('online-inroom-invite-drawer');
      if (drawer && drawer.classList) drawer.classList.toggle('hidden');
      this.send({ type: 'list_online_players' });
    });
    bindClick('btn-online-close-invite-drawer', () => {
      const drawer = this._el('online-inroom-invite-drawer');
      if (drawer && drawer.classList) drawer.classList.add('hidden');
    });
    bindChange('online-inroom-char', () => {
      const ch = this._el('online-inroom-char');
      const srcChar = this._el('online-char-select');
      if (ch && srcChar) {
        srcChar.value = ch.value;
        const eqSkin = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
          ? window.saveManager.getEquippedSkin(ch.value)
          : 'default';
        this._populateSkinOptions(eqSkin);
        this._updateHeroShowcase();
      }
      this.syncLobbyProfile();
    });
    bindChange('online-inroom-skin', () => {
      const sk = this._el('online-inroom-skin');
      const srcSkin = this._el('online-skin-select');
      if (sk && srcSkin) {
        srcSkin.value = sk.value;
        this._updateHeroShowcase();
      }
      this.syncLobbyProfile();
    });
    bindChange('online-inroom-ally', () => {
      const al = this._el('online-inroom-ally');
      const srcAlly = this._el('online-ally-select');
      if (al && srcAlly) {
        srcAlly.value = al.value;
        this._updateHeroShowcase();
      }
      this.syncLobbyProfile();
    });

    bindClick('btn-online-copy-invite', () => {
      const code = this.room && this.room.code;
      if (!code) return;
      const base = (typeof window !== 'undefined' && window.location && window.location.origin)
        ? `${window.location.origin}${window.location.pathname || '/'}`
        : '';
      const link = base ? `${base}?room=${code}` : code;
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).catch(() => {});
      }
      this._toast(`🔗 Đã sao chép link mời phòng #${code}!`);
      this._appendChatMessage('', `🔗 Link mời phòng: ${link}`, true);
    });

    bindClick('btn-online-chat-send', () => {
      const inp = this._el('online-chat-input');
      if (!inp) return;
      this.sendQuickChat(inp.value);
      inp.value = '';
    });
    const chatInp = this._el('online-chat-input');
    if (chatInp && !chatInp.__vovChatBound && typeof chatInp.addEventListener === 'function') {
      chatInp.__vovChatBound = true;
      chatInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendQuickChat(chatInp.value);
          chatInp.value = '';
        }
      });
    }
    if (typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.opfp-emote-btn').forEach((btn) => {
        if (btn.__vovEmoteBound) return;
        btn.__vovEmoteBound = true;
        btn.addEventListener('click', () => {
          this.sendQuickChat(btn.getAttribute('data-emote') || btn.textContent);
        });
      });
    }

    bindClick('btn-online-join-btn', () => {
      const codeEl = this._el('online-join-code');
      const code = codeEl ? codeEl.value.trim().toUpperCase() : '';
      if (!code) {
        this._toast('Vui lòng nhập Mã Phòng!');
        return;
      }
      this.readProfileInputs();
      this.send({
        type: 'join_room',
        code,
        name: this.playerName,
        charId: this.charId,
        skinId: this.skinId,
        allyId: this.allyId
      });
    });

    bindClick('btn-online-refresh-rooms', () => {
      this.send({ type: 'list_rooms' });
    });

    bindClick('btn-online-leave-room', () => {
      this.send({ type: 'leave_room' });
      this.room = null;
      this.slot = 0;
      this.setQuickMatchState('ready');
      this.renderRoomPanel();
    });

    bindClick('btn-online-start-match', () => {
      this.syncLobbyProfile();
      this.send({ type: 'start_match' });
    });

    bindClick('btn-online-rematch', () => {
      this.requestRematch();
    });

    bindClick('btn-online-leave-match', () => {
      this.leaveMatch(true);
    });
  }

  handleServerMessage(msg) {
    if (!msg || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'welcome': {
        this.clientId = msg.clientId || null;
        this.rooms = Array.isArray(msg.rooms) ? msg.rooms : [];
        if (Array.isArray(msg.players)) this.onlinePlayers = msg.players;
        this.renderRoomsList();
        this.renderOnlinePlayers();
        if (this._pendingInviteRoom) {
          const code = this._pendingInviteRoom;
          this._pendingInviteRoom = null;
          this.readProfileInputs();
          this.send({ type: 'join_room', code, viaInvite: true, name: this.playerName, charId: this.charId, skinId: this.skinId, allyId: this.allyId });
        }
        break;
      }
      case 'rooms_list': {
        this.rooms = Array.isArray(msg.rooms) ? msg.rooms : [];
        this.renderRoomsList();
        break;
      }
      case 'online_players': {
        this.onlinePlayers = Array.isArray(msg.players) ? msg.players : [];
        this.renderOnlinePlayers();
        break;
      }
      case 'search_cancelled': {
        this.room = null;
        this.slot = 0;
        this.setQuickMatchState('cancelled');
        this.renderRoomPanel();
        break;
      }
      case 'room_invite': {
        this._pendingInviteData = msg;
        const banner = this._el('online-invite-banner');
        const txt = this._el('online-invite-banner-text');
        if (txt) {
          const mLabel = msg.mode === 'coop' ? `2P Co-op Màn ${msg.stageId || 1}` : '1v1 Võ Đài';
          txt.textContent = `${msg.hostName || 'Võ sĩ'} mời bạn vào phòng "${msg.roomName || msg.roomCode}" (#${msg.roomCode} • ${mLabel})`;
        }
        if (banner && banner.classList) banner.classList.remove('hidden');
        this._toast(`📨 Nhận lời mời từ ${msg.hostName || 'Võ sĩ'} (Phòng #${msg.roomCode})`);
        break;
      }
      case 'invite_sent': {
        this._toast(`✓ Đã gửi lời mời tới ${msg.targetName || 'võ sĩ'}!`);
        break;
      }
      case 'room_joined': {
        this.room = msg.room || null;
        if (msg.slot) this.slot = msg.slot;
        if (this.room) {
          this.mode = this.room.mode === 'coop' ? 'coop' : 'pvp';
          this.stageId = this.room.stageId || 1;
          const pBar = this._el('online-private-join-bar');
          if (pBar && pBar.classList) pBar.classList.add('hidden');
          this._pendingPrivateRoomCode = null;
          if (this.quickMatchState === 'searching' && Array.isArray(this.room.players) && this.room.players.length >= 2) {
            this.setQuickMatchState('match_ready');
          }
        }
        this.renderRoomPanel();
        break;
      }
      case 'room_updated': {
        this.room = msg.room || this.room;
        if (this.room && Array.isArray(this.room.players) && this.clientId) {
          const me = this.room.players.find((p) => p.id === this.clientId);
          if (me) this.slot = me.slot;
        }
        if (this.room) {
          this.mode = this.room.mode === 'coop' ? 'coop' : 'pvp';
          this.stageId = this.room.stageId || 1;
          if (this.quickMatchState === 'searching' && Array.isArray(this.room.players) && this.room.players.length >= 2) {
            this.setQuickMatchState('match_ready');
          }
        }
        this.renderRoomPanel();
        break;
      }
      case 'peer_left': {
        this.room = msg.room || this.room;
        if (this.room && Array.isArray(this.room.players) && this.clientId) {
          const me = this.room.players.find((p) => p.id === this.clientId);
          if (me) this.slot = me.slot;
        }
        this._toast('Người chơi kia đã rời phòng!');
        if (this.isActive) {
          this.leaveMatch(false);
        }
        this.renderRoomPanel();
        break;
      }
      case 'match_started':
      case 'rematch_start': {
        this._resetRematchButton(false);
        this.room = msg.room || this.room;
        if (this.room) {
          this.mode = this.room.mode === 'coop' ? 'coop' : 'pvp';
          this.stageId = this.room.stageId || 1;
          if (this.room.scores) this.pvpScores = { ...this.room.scores };
        }
        this.closeModal();
        if (this.mode === 'coop') {
          this.startCoopMatch(this.room);
        } else {
          this.startPvPMatch(this.room);
        }
        break;
      }
      case 'player_state': {
        if (this.remotePlayer && msg.state) {
          this.remotePlayer.applyRemoteState(msg.state);
        }
        break;
      }
      case 'chat_emote': {
        const sender = msg.senderName || (Number(msg.fromSlot) === 1 ? 'P1' : 'P2');
        this._appendChatMessage(sender, msg.text || '', false);
        if (this.isActive && msg.text) {
          this._toast(`💬 ${sender}: ${msg.text}`);
        }
        break;
      }
      case 'vfx_event': {
        if (this.isActive) {
          this.applyRemoteVfx(msg);
        }
        break;
      }
      case 'pvp_hit': {
        const g = window.game;
        if (!this.isActive || this.mode !== 'pvp' || this._roundOver || (this._introLockTimer || 0) > 0 || !g || !g.player) break;
        if (Number.isFinite(msg.hitSeq)) {
          this._lastRecvHitSeq = Math.max(this._lastRecvHitSeq || 0, Number(msg.hitSeq));
        }
        this._syncAccum = 999;
        const p = g.player;
        if (msg.debuffs) {
          const nowMs = Date.now();
          if (msg.debuffs.bleedTimer > 0) p.bleedTimer = Math.max(p.bleedTimer || 0, msg.debuffs.bleedTimer);
          if (msg.debuffs.burnTimer > 0) p.burnTimer = Math.max(p.burnTimer || 0, msg.debuffs.burnTimer);
          if (msg.debuffs.chillTimer > 0) p.chillTimer = Math.max(p.chillTimer || 0, Math.min(2.2, msg.debuffs.chillTimer));
          if (msg.debuffs.frozenTimer > 0 && (p._freezeImmunityUntil || 0) <= nowMs) {
            const fDur = Math.min(0.85, msg.debuffs.frozenTimer);
            p.frozenTimer = Math.max(p.frozenTimer || 0, fDur);
            p._freezeImmunityUntil = nowMs + 7500;
          }
          if (msg.debuffs.stunTimer > 0 && (p._pvpStunImmunityUntil || 0) <= nowMs) {
            const sDur = Math.min(0.85, msg.debuffs.stunTimer);
            p.stunTimer = Math.max(p.stunTimer || 0, sDur);
            p._pvpStunImmunityUntil = nowMs + 7500;
            if (p.state !== 'knockdown' && p.state !== 'getup' && typeof p.setState === 'function') {
              p.setState('hurt', sDur);
            }
          }
          if (msg.debuffs.armorBreakTimer > 0) p.armorBreakTimer = Math.max(p.armorBreakTimer || 0, msg.debuffs.armorBreakTimer);
        }
        if ((msg.damage || 0) > 0) {
          if (msg.bypassInvincible && !p.isDead) {
            const dmg = Math.max(1, Math.round(msg.damage));
            p.hp = Math.max(0, (p.hp || 0) - dmg);
            if (window.uiManager && typeof window.uiManager.updatePlayerHp === 'function') {
              window.uiManager.updatePlayerHp(p.hp, p.maxHp);
            }
            if (p.hp <= 0 && typeof p.die === 'function') {
              p.die(msg.knockbackX || 0);
            }
          } else if (typeof p.takeDamage === 'function') {
            p.takeDamage(msg.damage, msg.knockbackX || 0, !!msg.isKnockdown);
          }
        }
        break;
      }
      case 'coop_hit_enemy': {
        const g = window.game;
        if (!this.isActive || this.mode !== 'coop' || !g || !Array.isArray(g.enemies)) break;
        if (Number.isFinite(msg.hitSeq)) {
          this._lastCoopHitAck = Math.max(this._lastCoopHitAck || 0, Number(msg.hitSeq));
        }
        const target = g.enemies.find((e) => e && e._netId === msg.netId);
        if (target && !target.isDead && typeof target.takeDamage === 'function') {
          target._applyingRemoteHit = true;
          // Guest đã kiểm tra i-frame cục bộ trước khi gửi đòn: không để i-frame của Host nuốt mất đòn đánh hợp lệ từ Guest
          if ((target.invincibleTimer || 0) < 1.2) target.invincibleTimer = 0;
          try {
            target.takeDamage(msg.damage || 0, msg.knockbackX || 0, !!msg.isKnockdown);
          } finally {
            target._applyingRemoteHit = false;
          }
          this._enemySyncAccum = 999;
        }
        break;
      }
      case 'coop_enemies_sync': {
        if (this.isActive && this.mode === 'coop' && this.slot !== 1) {
          this.applyCoopEnemiesSync(msg);
        }
        break;
      }
      case 'match_result': {
        if (msg.scores) this.pvpScores = { ...msg.scores };
        this._roundOver = true;
        const iWon = Number(msg.winnerSlot) === Number(this.slot);
        if (window.uiManager) {
          window.uiManager.showAlertBanner(iWon ? '🏆 CHIẾN THẮNG VÕ ĐÀI 1V1!' : '💥 THẤT BẠI — HẸN HIỆP SAU!');
        }
        if (window.effectManager && window.game && window.game.player) {
          window.effectManager.addFloatingText(
            iWon ? '🏆 THẮNG HIỆP!' : '💥 BẠI TRẬN!',
            window.game.player.x,
            window.game.player.y - 175,
            iWon ? 'crit' : 'warn'
          );
        }
        const rematchBtn = this._el('btn-online-rematch');
        if (rematchBtn) {
          if (rematchBtn.classList) rematchBtn.classList.remove('hidden');
          rematchBtn.disabled = false;
          rematchBtn.textContent = '🔄 ĐẤU LẠI';
        }
        this._rematchRequested = false;
        if (window.accountManager && typeof window.accountManager.recordPvPResult === 'function') {
          window.accountManager.recordPvPResult(iWon);
        }
        this.updateMatchBar();
        break;
      }
      case 'coop_stage_ended': {
        this._roundOver = true;
        if (!this._rematchRequested) {
          this._resetRematchButton(true);
        }
        break;
      }
      case 'rematch_request': {
        const peerLabel = this.mode === 'coop' ? 'Đồng đội' : 'Đối thủ';
        this._toast(`${peerLabel} đã sẵn sàng Đấu Lại — Nhấn [🔄 ĐẤU LẠI]!`);
        if (window.uiManager && typeof window.uiManager.showAlertBanner === 'function') {
          window.uiManager.showAlertBanner(`🔄 ${peerLabel.toUpperCase()} MỜI ĐẤU LẠI — BẤM [🔄 ĐẤU LẠI] ĐỂ VÀO TRẬN!`);
        }
        const rematchBtn = this._el('btn-online-rematch');
        if (rematchBtn) {
          if (rematchBtn.classList) rematchBtn.classList.remove('hidden');
          if (!this._rematchRequested) {
            rematchBtn.disabled = false;
            rematchBtn.textContent = '🔥 ĐẤU LẠI NGAY! (1/2)';
          }
        }
        break;
      }
      case 'pong_check': {
        if (msg.t) {
          this.pingMs = Math.max(1, Date.now() - Number(msg.t));
          const pingEl = this._el('online-ping-badge');
          if (pingEl) pingEl.textContent = `Ping: ${this.pingMs} ms`;
          this.updateMatchBar();
        }
        break;
      }
      case 'error_msg': {
        if (this._rematchRequested) {
          this._resetRematchButton(false);
        }
        if (msg.errorCode === 'WRONG_PASSWORD' && msg.roomCode) {
          this._pendingPrivateRoomCode = msg.roomCode;
          const pBar = this._el('online-private-join-bar');
          const pCode = this._el('online-private-join-code');
          if (pCode) pCode.textContent = msg.roomCode;
          if (pBar && pBar.classList) pBar.classList.remove('hidden');
        }
        if (this.quickMatchState === 'searching') {
          this.setQuickMatchState('failed', msg.message || 'Ghép trận không thành công.');
        }
        this._toast(msg.message || 'Lỗi kết nối Online!');
        break;
      }
    }
  }

  _startStageClean(stageId) {
    const g = window.game;
    if (!g) return;
    const tm = window.tutorialManager;
    const origIsNeeded = tm && tm.isTutorialNeeded;
    if (tm) tm.isTutorialNeeded = () => false;

    const sm = window.stageManager;
    if (sm && typeof sm.setStage === 'function') sm.setStage(stageId);
    const stage = sm && typeof sm.getCurrentStage === 'function' ? sm.getCurrentStage() : null;
    const origIntro = stage ? stage.introDialogue : null;
    const origBossDlg = stage ? stage.bossDialogue : null;
    if (stage) {
      stage.introDialogue = [];
      stage.bossDialogue = [];
    }

    try {
      g.startStage(stageId);
    } finally {
      if (tm && origIsNeeded) tm.isTutorialNeeded = origIsNeeded;
      if (stage) {
        stage.introDialogue = origIntro;
        stage.bossDialogue = origBossDlg;
      }
    }

    if (sm && typeof sm.cancelDialogue === 'function') sm.cancelDialogue();
    g.isBossCutsceneTriggered = true;
    g._onlinePauseOpen = false;
    g.state = 'PLAYING';
    if (window.uiManager) {
      window.uiManager.hideTitleScreen();
      if (typeof window.uiManager.hideDialogue === 'function') window.uiManager.hideDialogue();
      window.uiManager.showHUD();
    }
  }

  _configureLocalAndRemotePlayers(room, mode) {
    const g = window.game;
    if (!g || !g.player) return;
    const players = (room && Array.isArray(room.players)) ? room.players : [];
    const myInfo = players.find((p) => p.slot === this.slot) || {
      slot: this.slot || 1,
      name: this.playerName,
      charId: this.charId,
      skinId: this.skinId
    };
    const peerInfo = players.find((p) => p.slot !== (myInfo.slot || 1)) || {
      slot: (myInfo.slot === 1 ? 2 : 1),
      name: 'Đối Thủ Online',
      charId: myInfo.charId === 'bichlam' ? 'nghi' : 'bichlam',
      skinId: 'default'
    };

    let myChar = myInfo.charId || this.charId || 'nghi';
    if (myChar === 'mocdang') myChar = 'nghi';
    const mySkin = myInfo.skinId || this.skinId || 'default';
    g.player.setCharacter(myChar);
    g.player.equippedSkin = mySkin;
    g.player.isVovinamSkin = (myChar === 'nghi' || mySkin === 'vovinam');

    const myX = mode === 'pvp' ? (myInfo.slot === 2 ? 920 : 340) : (myInfo.slot === 2 ? 220 : 140);
    const myFacing = mode === 'pvp' ? (myInfo.slot === 2 ? -1 : 1) : 1;
    g.player.reset(myX, 580);
    if (typeof g.player.clearAllDebuffs === 'function') g.player.clearAllDebuffs();
    g.player.facing = myFacing;

    const peerX = mode === 'pvp' ? (myInfo.slot === 2 ? 340 : 920) : (myInfo.slot === 2 ? 140 : 220);
    const peerFacing = mode === 'pvp' ? (myInfo.slot === 2 ? 1 : -1) : 1;
    this.remotePlayer = new RemotePlayer(peerX, 580);
    this.remotePlayer.resetForMatch(peerX, 580, peerFacing, peerInfo.charId || 'bichlam', peerInfo.skinId || 'default');
    this.remotePlayer.displayName = peerInfo.name || 'Võ Sĩ';

    if (window.uiManager) {
      if (typeof window.uiManager.setCharacterHUD === 'function') window.uiManager.setCharacterHUD(g.player);
      if (typeof window.uiManager.updatePlayerHp === 'function') window.uiManager.updatePlayerHp(g.player.hp, g.player.maxHp);
      if (typeof window.uiManager.updatePlayerEnergy === 'function') window.uiManager.updatePlayerEnergy(g.player.energy, g.player.maxEnergy);
      if (typeof window.uiManager.updateSkillCooldowns === 'function') window.uiManager.updateSkillCooldowns(g.player);
    }
  }

  _resetRematchButton(show = false) {
    this._rematchRequested = false;
    const rematchBtn = this._el('btn-online-rematch');
    if (rematchBtn) {
      if (rematchBtn.classList) rematchBtn.classList.toggle('hidden', !show);
      rematchBtn.disabled = false;
      rematchBtn.textContent = '🔄 ĐẤU LẠI';
    }
  }

  requestRematch() {
    if (!this.isActive || !this.room) {
      this._toast('Trận đấu không còn hoạt động — Vui lòng vào lại phòng!');
      return false;
    }
    if (Array.isArray(this.room.players) && this.room.players.length < 2) {
      this._toast('Đối thủ/Đồng đội đã rời phòng — Hãy bấm RỜI TRẬN để tìm phòng mới!');
      return false;
    }
    if (this._rematchRequested) {
      this._toast('Đang chờ đối thủ/đồng đội xác nhận Đấu Lại...');
      return false;
    }
    this._rematchRequested = true;
    const rematchBtn = this._el('btn-online-rematch');
    if (rematchBtn) {
      if (rematchBtn.classList) rematchBtn.classList.remove('hidden');
      rematchBtn.disabled = true;
      rematchBtn.textContent = '⏳ CHỜ ĐỒNG Ý (1/2)';
    }
    if (window.uiManager) {
      if (typeof window.uiManager.hideGameOver === 'function') window.uiManager.hideGameOver();
      if (typeof window.uiManager.hideStageClear === 'function') window.uiManager.hideStageClear();
      if (typeof window.uiManager.hidePause === 'function') window.uiManager.hidePause();
    }
    if (window.game) window.game._onlinePauseOpen = false;
    this.send({ type: 'rematch_request' });
    this._toast('Đã gửi yêu cầu Đấu Lại — Chờ đối thủ/đồng đội xác nhận!');
    return true;
  }

  startPvPMatch(room = null) {
    const g = window.game;
    if (!g) return;
    this.installHooks();
    this.isActive = true;
    this.mode = 'pvp';
    this._roundOver = false;
    this._syncAccum = 0;
    this._enemySyncAccum = 0;
    this._lastSentState = null;
    this._lastSentFacing = null;
    this._lastSentCombo = 0;
    this._lastSentX = null;
    this._lastSentY = null;
    this._lastSentZ = null;
    this._lastSentHp = null;
    this._lastSentFiendsSig = '';
    this._lastSentHitSeq = 0;
    this._lastRecvHitSeq = 0;

    this._startStageClean(1);
    g._onlinePauseOpen = false;
    g.stageCompletedPending = false;
    g.stageElapsedTime = 0;
    g.enemies = [];
    g.currentBoss = null;
    g.activeWaves = [];
    g.projectiles = [];
    g.stageEvidence = null;
    if (window.propSystem) window.propSystem.props = [];
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    g.arenaLocked = true;
    g.arenaMinX = 60;
    g.arenaMaxX = 1220;
    g.combatMode = 'DUEL';
    g.camera.x = 0;
    g.camera.maxX = 0;

    this._configureLocalAndRemotePlayers(room || this.room, 'pvp');
    this.triggerVsSplash(room || this.room);

    if (window.uiManager) {
      window.uiManager.hideBossHUD();
      window.uiManager.setObjective('⚔️ ĐẤU VÕ ĐÀI 1V1 ONLINE — HẠ GỤC ĐỐI THỦ!');
      window.uiManager.showAlertBanner('⚔️ VÕ ĐÀI 1V1 BẮT ĐẦU!');
    }
    this._resetRematchButton(false);
    this.updateMatchBar();
  }

  startCoopMatch(room = null) {
    const g = window.game;
    if (!g) return;
    this.installHooks();
    this.isActive = true;
    this.mode = 'coop';
    this._roundOver = false;
    this._syncAccum = 0;
    this._enemySyncAccum = 0;
    this._nextNetId = 1;
    this._lastSentState = null;
    this._lastSentFacing = null;
    this._lastSentCombo = 0;
    this._lastSentX = null;
    this._lastSentY = null;
    this._lastSentZ = null;
    this._lastSentHp = null;
    this._lastSentFiendsSig = '';
    this._coopHitSeq = 0;
    this._lastCoopHitAck = 0;
    this._lastCoopWaveIndex = 0;

    const targetStage = Math.max(1, Math.min(20, Number((room && room.stageId) || this.stageId) || 1));
    this.stageId = targetStage;
    const myAlly = (this.allyId && this.allyId !== this.charId) ? this.allyId : 'auto';
    if (window.saveManager && typeof window.saveManager.setSelectedAlly === 'function') {
      window.saveManager.setSelectedAlly(myAlly);
    }
    if (window.allyManager) {
      window.allyManager.selectedAllyId = myAlly;
    }
    this._startStageClean(targetStage);
    g._onlinePauseOpen = false;
    g.stageCompletedPending = false;
    g.stageElapsedTime = 0;
    g.stageEvidence = null;
    if (this.slot === 2) {
      g.enemies = [];
      g.activeWaves = [];
    }

    this._configureLocalAndRemotePlayers(room || this.room, 'coop');
    const hudEl = this._el('hud');
    if (hudEl && hudEl.classList) hudEl.classList.remove('opfp-pvp-active');
    const arenaHud = this._el('online-pvp-arena-hud');
    if (arenaHud && arenaHud.classList) arenaHud.classList.add('hidden');

    if (window.uiManager) {
      window.uiManager.setObjective(`🤝 2P CO-OP MÀN ${targetStage} — HỢP LỰC HẠ BOSS!`);
      window.uiManager.showAlertBanner(`🤝 XUẤT TRẬN CO-OP MÀN ${targetStage}!`);
    }
    this._resetRematchButton(false);
    this.updateMatchBar();
  }

  triggerVsSplash(room = null) {
    const splash = this._el('online-vs-splash');
    if (!splash || !splash.classList || typeof splash.tagName !== 'string') {
      this._introLockTimer = 0;
      return;
    }
    const players = (room && Array.isArray(room.players)) ? room.players : [];
    const p1 = players.find((p) => p.slot === 1) || { slot: 1, name: this.slot === 1 ? this.playerName : (this.remotePlayer && this.remotePlayer.displayName) || 'P1', charId: this.slot === 1 ? this.charId : (this.remotePlayer && this.remotePlayer.charId) || 'nghi', skinId: this.skinId };
    const p2 = players.find((p) => p.slot === 2) || { slot: 2, name: this.slot === 2 ? this.playerName : (this.remotePlayer && this.remotePlayer.displayName) || 'P2', charId: this.slot === 2 ? this.charId : (this.remotePlayer && this.remotePlayer.charId) || 'bichlam', skinId: 'default' };
    const m1 = this._getCharMeta(p1.charId, p1.skinId);
    const m2 = this._getCharMeta(p2.charId, p2.skinId);
    const setTxt = (id, t) => { const e = this._el(id); if (e) e.textContent = t; };
    const setSrc = (id, s) => { const e = this._el(id); if (e) e.src = s; };
    setSrc('opfp-vs-p1-img', m1.avatar);
    setTxt('opfp-vs-p1-name', (p1.name || m1.name).toUpperCase());
    setTxt('opfp-vs-p1-title', m1.title);
    setSrc('opfp-vs-p2-img', m2.avatar);
    setTxt('opfp-vs-p2-name', (p2.name || m2.name).toUpperCase());
    setTxt('opfp-vs-p2-title', m2.title);
    setSrc('opfp-vs-foot-p1-img', m1.avatar);
    setTxt('opfp-vs-foot-p1-name', (p1.name || m1.name).toUpperCase());
    setSrc('opfp-vs-foot-p2-img', m2.avatar);
    setTxt('opfp-vs-foot-p2-name', (p2.name || m2.name).toUpperCase());
    setTxt('opfp-vs-countdown', '3');

    splash.classList.remove('hidden');
    this._introLockTimer = 2.4;
    if (this._vsTimerIds) this._vsTimerIds.forEach((tid) => clearTimeout(tid));
    this._vsTimerIds = [
      setTimeout(() => setTxt('opfp-vs-countdown', '2'), 650),
      setTimeout(() => setTxt('opfp-vs-countdown', '1'), 1300),
      setTimeout(() => setTxt('opfp-vs-countdown', 'CHIẾN!'), 1950),
      setTimeout(() => { splash.classList.add('hidden'); this._introLockTimer = 0; }, 2400)
    ];
  }

  leaveMatch(reopenLobby = true, opts = {}) {
    if (!opts.skipServerNotify && this.room) {
      this.send({ type: 'leave_room' });
    }
    this.isActive = false;
    this.room = null;
    this.slot = 0;
    this.remotePlayer = null;
    this._roundOver = false;
    this._introLockTimer = 0;
    this.pvpScores = { p1: 0, p2: 0 };
    this._resetRematchButton(false);
    if (this._vsTimerIds) {
      this._vsTimerIds.forEach((tid) => clearTimeout(tid));
      this._vsTimerIds = null;
    }
    if (this.quickMatchState !== 'ready') {
      this.setQuickMatchState('ready');
    }
    const bar = this._el('online-match-bar');
    if (bar && bar.classList) bar.classList.add('hidden');
    const arenaHud = this._el('online-pvp-arena-hud');
    if (arenaHud && arenaHud.classList) arenaHud.classList.add('hidden');
    const splash = this._el('online-vs-splash');
    if (splash && splash.classList) splash.classList.add('hidden');
    const hudEl = this._el('hud');
    if (hudEl && hudEl.classList) hudEl.classList.remove('opfp-pvp-active');
    if (window.game && window.game.player && typeof window.game.player.clearAllDebuffs === 'function') {
      window.game.player.clearAllDebuffs();
    }
    if (window.game && typeof window.game.returnToMenu === 'function') {
      window.game.returnToMenu();
    }
    if (reopenLobby) {
      this.openModal();
    }
  }

  updateMatchBar() {
    const bar = this._el('online-match-bar');
    const arenaHud = this._el('online-pvp-arena-hud');
    const hudEl = this._el('hud');
    if (!bar) return;
    const toggleClassIfChanged = (el, cls, shouldHave) => {
      if (!el || !el.classList || typeof el.classList.contains !== 'function') return;
      if (el.classList.contains(cls) !== !!shouldHave) {
        el.classList.toggle(cls, !!shouldHave);
      }
    };
    const setTxtIfChanged = (el, val) => {
      if (el && el.textContent !== val) el.textContent = val;
    };
    const setWidthIfChanged = (el, val) => {
      if (el && el.style && el.style.width !== val) el.style.width = val;
    };

    if (!this.isActive) {
      toggleClassIfChanged(bar, 'hidden', true);
      toggleClassIfChanged(arenaHud, 'hidden', true);
      toggleClassIfChanged(hudEl, 'opfp-pvp-active', false);
      return;
    }
    toggleClassIfChanged(bar, 'hidden', false);
    toggleClassIfChanged(bar, 'with-arena-hud', this.mode === 'pvp');
    toggleClassIfChanged(arenaHud, 'hidden', this.mode !== 'pvp');
    toggleClassIfChanged(hudEl, 'opfp-pvp-active', this.mode === 'pvp');

    const modeEl = this._el('online-hud-mode');
    const roomEl = this._el('online-hud-room');
    const scoreEl = this._el('online-hud-score');
    const pingEl = this._el('online-hud-ping');

    setTxtIfChanged(modeEl, this.mode === 'coop' ? `🤝 2P CO-OP MÀN ${this.stageId}` : '⚔️ 1v1 ĐẤU TRƯỜNG');
    setTxtIfChanged(roomEl, `PHÒNG: ${(this.room && this.room.code) || 'LOCAL'}`);
    if (scoreEl) {
      if (this.mode === 'pvp') {
        setTxtIfChanged(scoreEl, `TỶ SỐ ${this.pvpScores.p1 || 0} - ${this.pvpScores.p2 || 0}`);
      } else if (this.remotePlayer) {
        setTxtIfChanged(scoreEl, `ĐỒNG ĐỘI: ${Math.ceil(this.remotePlayer.hp || 0)}/${this.remotePlayer.maxHp || 1000} HP`);
      }
    }
    setTxtIfChanged(pingEl, `${this.pingMs || 0} ms`);

    if (this.mode === 'pvp' && arenaHud && window.game && window.game.player) {
      const g = window.game;
      const pLocal = g.player;
      const pRemote = this.remotePlayer;
      const p1 = this.slot === 1 ? pLocal : pRemote;
      const p2 = this.slot === 2 ? pLocal : pRemote;
      const syncSide = (prefix, ent, wins) => {
        if (!ent) return;
        const slotNum = (prefix === 'opfp-p1' ? 1 : 2);
        const isLocalSide = (this.slot === slotNum || (this.slot !== 1 && this.slot !== 2 && slotNum === 1));
        const sideEl = this._el(`${prefix}-side`);
        toggleClassIfChanged(sideEl, 'is-local-side', isLocalSide);
        toggleClassIfChanged(sideEl, 'is-enemy-side', !isLocalSide);
        const meta = this._getCharMeta(ent.charId, ent.equippedSkin);
        const av = this._el(`${prefix}-avatar`);
        const nm = this._el(`${prefix}-name`);
        const hp = this._el(`${prefix}-hp`);
        const ht = this._el(`${prefix}-hp-txt`);
        const en = this._el(`${prefix}-en`);
        const dt = this._el(`${prefix}-dots`);
        if (av && av.dataset && av.dataset.srcPath !== meta.avatar) {
          av.dataset.srcPath = meta.avatar;
          av.src = meta.avatar;
        } else if (av && !av.dataset && av.getAttribute && av.getAttribute('src') !== meta.avatar) {
          av.src = meta.avatar;
        }
        setTxtIfChanged(nm, this.slot === (prefix === 'opfp-p1' ? 1 : 2) ? this.playerName : (ent.displayName || meta.name));
        const maxH = Math.max(1, ent.maxHp || 1000);
        const curH = Math.max(0, Math.round(ent.hp || 0));
        setWidthIfChanged(hp, `${Math.max(0, Math.min(100, (curH / maxH) * 100))}%`);
        setTxtIfChanged(ht, `${curH}/${maxH}`);
        setWidthIfChanged(en, `${Math.max(0, Math.min(100, ((ent.energy || 0) / (ent.maxEnergy || 100)) * 100))}%`);
        setTxtIfChanged(dt, '●'.repeat(Math.min(5, wins || 0)));
      };
      syncSide('opfp-p1', p1, this.pvpScores.p1);
      syncSide('opfp-p2', p2, this.pvpScores.p2);
      const roundNum = (this.pvpScores.p1 || 0) + (this.pvpScores.p2 || 0) + 1;
      const roundEl = this._el('opfp-hud-round');
      const timerEl = this._el('opfp-hud-timer');
      const scEl = this._el('opfp-hud-score');
      setTxtIfChanged(roundEl, `HIỆP ${roundNum}`);
      setTxtIfChanged(timerEl, String(Math.max(0, 99 - Math.floor(g.stageElapsedTime || 0))).padStart(2, '0'));
      setTxtIfChanged(scEl, `${this.pvpScores.p1 || 0} - ${this.pvpScores.p2 || 0}`);
    }
  }

  _syncRemoteDebuffs() {
    const rp = this.remotePlayer;
    if (!rp || this.mode !== 'pvp') return;
    const prev = rp._lastSyncDebuffs || (rp._lastSyncDebuffs = {});
    const newlyApplied = {};
    let hasNew = false;
    const check = (key, field) => {
      const val = rp[field] || 0;
      if (val > (prev[key] || 0) + 0.15) {
        newlyApplied[field] = val;
        hasNew = true;
      }
      prev[key] = val;
    };
    check('bleed', 'bleedTimer');
    check('burn', 'burnTimer');
    check('chill', 'chillTimer');
    check('frozen', 'frozenTimer');
    check('stun', 'stunTimer');
    check('armorBreak', 'armorBreakTimer');
    if (hasNew) {
      this.send({ type: 'pvp_hit', damage: 0, debuffs: newlyApplied });
    }
  }

  update(dt) {
    if (!this.isActive) return;
    const g = window.game;
    if (!g || !g.player) return;

    if (this.remotePlayer && typeof this.remotePlayer.updateRemote === 'function') {
      this.remotePlayer.updateRemote(dt);
    }

    if (this.mode === 'coop' && this.slot !== 1 && Array.isArray(g.enemies)) {
      const step = Math.min(0.1, Math.max(0, dt || 0.016));
      const enemyLerp = 1 - Math.exp(-22 * step);
      for (const enemy of g.enemies) {
        if (!enemy) continue;
        if (enemy._optimisticHpLockTimer > 0) {
          enemy._optimisticHpLockTimer = Math.max(0, enemy._optimisticHpLockTimer - step);
        }
        if (Number.isFinite(enemy._netTargetX)) enemy.x += (enemy._netTargetX - enemy.x) * enemyLerp;
        if (Number.isFinite(enemy._netTargetY)) enemy.y += (enemy._netTargetY - enemy.y) * enemyLerp;
        if (Number.isFinite(enemy._netTargetZ)) enemy.z = (enemy.z || 0) + (enemy._netTargetZ - (enemy.z || 0)) * enemyLerp;
      }
    }

    this._syncRemoteDebuffs();

    if (this.mode === 'pvp' && !this._roundOver && g.player.hp <= 0) {
      this._roundOver = true;
      g.player.isDead = true;
      g.player.invincibleTimer = 999;
      const oppSlot = this.slot === 1 ? 2 : 1;
      this.send({ type: 'match_result', winnerSlot: oppSlot });
      const rematchBtn = this._el('btn-online-rematch');
      if (rematchBtn && rematchBtn.classList) rematchBtn.classList.remove('hidden');
    }

    const p = g.player;
    const curState = p.state || 'idle';
    const curFacing = p.facing || 1;
    const curCombo = p.comboStep || 0;
    const curX = Math.round(p.x || 0);
    const curY = Math.round(p.y || 580);
    const curZ = Math.round(p.z || 0);
    const curHp = Math.round(p.hp || 0);

    const activeFiends = Array.isArray(p._summonedFiends)
      ? p._summonedFiends
          .filter((f) => f && f.life > 0)
          .map((f) => ({
            id: f.id,
            x: Math.round(f.x || 0),
            y: Math.round(f.y || 580),
            facing: f.facing >= 0 ? 1 : -1,
            life: +Math.max(0.05, f.life || 0).toFixed(2),
            maxLife: +(f.maxLife || 6).toFixed(2),
            slash: (f.slashTimer || 0) > 0
          }))
      : [];
    const curFiendsSig = activeFiends.map((f) => `${f.id}:${f.slash ? 1 : 0}`).join('|');

    if (curState !== this._lastSentState || curFacing !== this._lastSentFacing || curCombo !== this._lastSentCombo || curFiendsSig !== this._lastSentFiendsSig) {
      this._syncAccum = 999;
    }

    const isStationaryIdle = curState === 'idle'
      && activeFiends.length === 0
      && curX === this._lastSentX
      && curY === this._lastSentY
      && curZ === this._lastSentZ
      && curHp === this._lastSentHp
      && !p.vx && !p.vy && !p.vz;
    const syncInterval = isStationaryIdle ? 0.12 : (activeFiends.length > 0 ? 0.036 : 0.028);

    this._syncAccum += dt;
    if (this._syncAccum >= syncInterval) {
      this._syncAccum = 0;
      if (!this.ws || (this.ws.bufferedAmount || 0) <= 16384) {
        this._lastSentState = curState;
        this._lastSentFacing = curFacing;
        this._lastSentCombo = curCombo;
        this._lastSentX = curX;
        this._lastSentY = curY;
        this._lastSentZ = curZ;
        this._lastSentHp = curHp;
        this._lastSentFiendsSig = curFiendsSig;
        this.send({
          type: 'player_state',
          state: {
            name: this.playerName,
            charId: p.charId,
            skinId: p.equippedSkin || 'default',
            x: curX,
            y: curY,
            z: curZ,
            vx: Math.round(p.vx || 0),
            vy: Math.round(p.vy || 0),
            vz: Math.round(p.vz || 0),
            facing: curFacing,
            state: curState,
            comboStep: curCombo,
            stateTimer: +(p.stateTimer || 0).toFixed(2),
            stateDuration: +(p.stateDuration || 0.5).toFixed(2),
            hp: curHp,
            maxHp: Math.round(p.maxHp || 1000),
            energy: Math.round(p.energy || 0),
            stamina: Math.round(p.stamina || 100),
            shieldHp: Math.round(p.shieldHp || 0),
            isDead: !!p.isDead,
            ackHitSeq: this._lastRecvHitSeq || 0,
            fiends: activeFiends,
            weaponType: p.weapon ? p.weapon.type : null,
            weaponDur: p.weapon ? p.weapon.dur : 0,
            bleedTimer: +(p.bleedTimer || 0).toFixed(2),
            burnTimer: +(p.burnTimer || 0).toFixed(2),
            chillTimer: +(p.chillTimer || 0).toFixed(2),
            stunTimer: +(p.stunTimer || 0).toFixed(2),
            armorBreakTimer: +(p.armorBreakTimer || 0).toFixed(2),
            invincibleTimer: +(p.invincibleTimer || 0).toFixed(2)
          }
        });
      }
    }

    if (this.mode === 'coop' && this.slot === 1) {
      this._enemySyncAccum += dt;
      if (this._enemySyncAccum >= 0.045) {
        this._enemySyncAccum = 0;
        if (!this.ws || (this.ws.bufferedAmount || 0) <= 16384) {
          const enemiesPayload = (g.enemies || []).map((e) => {
            if (!e._netId) e._netId = 'e_' + (this._nextNetId++);
            return {
              netId: e._netId,
              type: e.type || 'thug',
              name: e.name || 'Kẻ Địch',
              isBoss: !!e.isBoss,
              faction: e.faction || 'general',
              x: Math.round(e.x || 0),
              y: Math.round(e.y || 580),
              z: Math.round(e.z || 0),
              facing: e.facing || 1,
              state: e.state || 'idle',
              hp: Math.round(e.hp || 0),
              maxHp: Math.round(e.maxHp || 100),
              isDead: !!e.isDead,
              poise: Math.round(e.poise ?? 100),
              maxPoise: Math.round(e.maxPoise ?? 100),
              bleedTimer: +(e.bleedTimer || 0).toFixed(2),
              burnTimer: +(e.burnTimer || 0).toFixed(2),
              chillTimer: +(e.chillTimer || 0).toFixed(2),
              stunTimer: +(e.stunTimer || 0).toFixed(2),
              armorBreakTimer: +(e.armorBreakTimer || 0).toFixed(2),
              invincibleTimer: +(e.invincibleTimer || 0).toFixed(2)
            };
          });
          this.send({
            type: 'coop_enemies_sync',
            enemies: enemiesPayload,
            arenaLocked: !!g.arenaLocked,
            arenaMinX: g.arenaMinX,
            arenaMaxX: g.arenaMaxX,
            waveIndex: g.currentWaveIndex || 0,
            ackCoopHitSeq: this._lastCoopHitAck || 0,
            cleared: !!(g.stageCompletedPending || g.state === 'STAGE_CLEAR')
          });
        }
      }
    }

    this._pingTimer += dt;
    if (this._pingTimer >= 2.0) {
      this._pingTimer = 0;
      this.send({ type: 'ping_check', t: Date.now() });
    }

    this._hudSyncAccum = (this._hudSyncAccum || 0) + dt;
    if (this._hudSyncAccum >= 0.1) {
      this._hudSyncAccum = 0;
      this.updateMatchBar();
    }
  }

  applyCoopEnemiesSync(msg) {
    const g = window.game;
    if (!g || !Array.isArray(msg.enemies)) return;
    if (typeof msg.arenaLocked === 'boolean') g.arenaLocked = msg.arenaLocked;
    if (Number.isFinite(msg.arenaMinX)) g.arenaMinX = msg.arenaMinX;
    if (Number.isFinite(msg.arenaMaxX)) g.arenaMaxX = msg.arenaMaxX;

    const byId = new Map();
    for (const existing of g.enemies) {
      if (existing && existing._netId) byId.set(existing._netId, existing);
    }

    const nextList = [];
    for (const info of msg.enemies) {
      let enemy = byId.get(info.netId);
      let isNewEnemy = false;
      if (!enemy) {
        isNewEnemy = true;
        if (info.isBoss && window.stageManager) {
          const stData = window.stageManager.getCurrentStage();
          if (stData && stData.bossClass) {
            enemy = new stData.bossClass(info.x, info.y);
            enemy.isBoss = true;
            enemy.title = stData.bossTitle;
            g.currentBoss = enemy;
            if (window.uiManager) window.uiManager.showBossHUD(enemy);
          }
        }
        if (!enemy && typeof g.createEnemyInstance === 'function') {
          enemy = g.createEnemyInstance(info.type, info.x, info.y, info.faction);
        }
        if (!enemy && window.BaseEnemy) {
          enemy = new window.BaseEnemy(info.x, info.y, info.type, info.name);
        }
        if (enemy) {
          enemy._netId = info.netId;
          enemy._netTargetX = info.x;
          enemy._netTargetY = info.y;
          enemy._netTargetZ = info.z || 0;
          enemy._optimisticHpLockTimer = 0;
        }
      }
      if (!enemy) continue;

      enemy._netTargetX = info.x;
      enemy._netTargetY = info.y;
      enemy._netTargetZ = info.z || 0;
      if (isNewEnemy || Math.hypot((enemy.x || 0) - info.x, (enemy.y || 0) - info.y) > 360) {
        enemy.x = info.x;
        enemy.y = info.y;
        enemy.z = info.z || 0;
      }
      enemy.facing = info.facing || 1;
      enemy.state = info.state || 'idle';
      enemy.maxHp = info.maxHp;
      const hasCoopAck = Number.isFinite(msg.ackCoopHitSeq);
      const coopAckCovers = hasCoopAck && msg.ackCoopHitSeq >= (enemy._optimisticTargetHitSeq || 0);
      if (coopAckCovers) {
        enemy._optimisticHpLockTimer = 0;
      }
      const waitingCoopAck = hasCoopAck && msg.ackCoopHitSeq < (enemy._optimisticTargetHitSeq || 0) && enemy._optimisticHpLockTimer > 0;
      const lockedHigherEnemy = enemy._optimisticHpLockTimer > 0 && info.hp > enemy.hp;
      if (!waitingCoopAck && !lockedHigherEnemy) {
        enemy.hp = info.hp;
        enemy.isDead = !!info.isDead;
      }
      enemy.poise = info.poise;
      enemy.maxPoise = info.maxPoise;
      enemy.bleedTimer = info.bleedTimer || 0;
      enemy.burnTimer = info.burnTimer || 0;
      enemy.chillTimer = info.chillTimer || 0;
      enemy.stunTimer = info.stunTimer || 0;
      enemy.armorBreakTimer = info.armorBreakTimer || 0;
      if (Number.isFinite(info.invincibleTimer)) enemy.invincibleTimer = info.invincibleTimer;
      if (enemy.isBoss) {
        g.currentBoss = enemy;
        if (window.uiManager && typeof window.uiManager.updateBossHp === 'function') {
          window.uiManager.updateBossHp(enemy.hp, enemy.maxHp);
        }
      }
      nextList.push(enemy);
    }
    g.enemies = nextList;

    if (Number.isFinite(msg.waveIndex) && msg.waveIndex > (this._lastCoopWaveIndex || 0)) {
      this._lastCoopWaveIndex = msg.waveIndex;
      g.currentWaveIndex = msg.waveIndex;
      if (g.player && !g.player.isDead && g.player.maxHp > 0) {
        const newHp = Math.min(g.player.maxHp, (g.player.hp || 0) + g.player.maxHp * 0.25);
        g.player.hp = Math.round(newHp);
        if (window.uiManager && window.uiManager.updatePlayerHp) {
          window.uiManager.updatePlayerHp(g.player.hp, g.player.maxHp);
        }
        if (window.uiManager && window.uiManager.showAlertBanner) {
          window.uiManager.showAlertBanner('WAVE CLEARED — +25% HP');
        }
      }
    }

    if (msg.cleared && typeof g.triggerStageVictory === 'function' && !g.stageCompletedPending) {
      g.triggerStageVictory();
    }
  }

  applyRemoteVfx(msg) {
    const em = window.effectManager;
    const g = window.game;
    this._applyingRemoteVfx = true;
    try {
      switch (msg.kind) {
        case 'croc_bite':
          if (em && em.createCrocodileBite) em.createCrocodileBite(msg.x, msg.y, msg.dir || 1, msg.scale || 1);
          break;
        case 'taoist_fiend':
          if (em && em.createTaoistFiend) {
            if (msg.id && this.remotePlayer) {
              if (!Array.isArray(this.remotePlayer.remoteFiends)) this.remotePlayer.remoteFiends = [];
              let rf = this.remotePlayer.remoteFiends.find((f) => f && f.id === msg.id);
              if (rf) {
                rf._netTargetX = msg.x;
                rf._netTargetY = msg.y;
                rf.facing = msg.facing || 1;
                rf.slashTimer = Math.max(rf.slashTimer || 0, 0.22);
              } else {
                rf = {
                  id: msg.id,
                  x: msg.x,
                  y: msg.y,
                  _netTargetX: msg.x,
                  _netTargetY: msg.y,
                  facing: msg.facing || 1,
                  life: msg.life || 4.5,
                  maxLife: msg.maxLife || 4.5,
                  slashTimer: 0.2,
                  seed: Math.random() * 10,
                  _fromRemotePlayer: true
                };
                this.remotePlayer.remoteFiends.push(rf);
                em.createTaoistFiend(rf);
              }
            } else {
              em.createTaoistFiend({
                x: msg.x, y: msg.y, facing: msg.facing || 1,
                life: msg.life || 4.5, maxLife: msg.maxLife || 4.5, slashTimer: 0.2, seed: Math.random() * 10
              });
            }
          }
          break;
        case 'slash_arc':
          if (em && em.createSlashArc) em.createSlashArc(msg.x, msg.y, msg.dir || 1, msg.radius || 75, msg.color || '#38bdf8', msg.thickness || 4);
          break;
        case 'flame_coin':
          if (em && em.createFlameCoinSlash) em.createFlameCoinSlash(msg.x, msg.y, msg.dir || 1, msg.scale || 1);
          break;
        case 'shock_ring':
          if (em && em.createShockRing) em.createShockRing(msg.x, msg.y, msg.color || '#facc15', msg.maxRadius || 95);
          break;
        case 'ground_slam':
          if (em && em.createGroundSlam) em.createGroundSlam(msg.x, msg.y, msg.radius || 110);
          break;
        case 'dragon_uppercut':
          if (em && em.createDragonUppercut) em.createDragonUppercut(msg.x, msg.y, msg.dir || 1);
          break;
        case 'projectile':
          if (g && typeof g.spawnProjectile === 'function') {
            g.spawnProjectile(msg.x, msg.y, msg.vx || 0, msg.vy || 0, 0, this.remotePlayer || { isRemotePlayer: true }, msg.pType || 'knife');
          }
          break;
      }
    } finally {
      this._applyingRemoteVfx = false;
    }
  }

  installHooks() {
    if (!this._hooked && window.BaseEnemy && window.BaseEnemy.prototype && !window.BaseEnemy.prototype.__vovOnlineHooked) {
      this._hooked = true;
      window.BaseEnemy.prototype.__vovOnlineHooked = true;
      const origTakeDamage = window.BaseEnemy.prototype.takeDamage;
      window.BaseEnemy.prototype.takeDamage = function (amount, knockbackX = 0, isKnockdown = false) {
        const res = origTakeDamage.apply(this, arguments);
        const mgr = window.onlineManager;
        if (mgr && mgr.isActive && mgr.mode === 'coop' && !this._applyingRemoteHit && this._netId) {
          const hitSeq = ++mgr._coopHitSeq;
          this._optimisticHpLockTimer = Math.max(1.1, Math.min(2.2, ((mgr.pingMs || 220) * 3.0) / 1000));
          this._optimisticTargetHitSeq = hitSeq;
          mgr.send({
            type: 'coop_hit_enemy',
            hitSeq,
            netId: this._netId,
            damage: Number(amount) || 0,
            knockbackX: Number(knockbackX) || 0,
            isKnockdown: !!isKnockdown
          });
        }
        return res;
      };
    }

    // Đồng bộ hiệu ứng chiêu thức (VFX, Cá Sấu, Tiểu Quỷ, Vật Bay) sang máy đối thủ
    const em = window.effectManager;
    if (em && !this._vfxHooked && !em.__vovOnlineVfxHooked) {
      this._vfxHooked = true;
      em.__vovOnlineVfxHooked = true;
      const om = this;
      const wrapEm = (methodName, makePayload) => {
        const orig = em[methodName];
        if (typeof orig !== 'function') return;
        em[methodName] = function (...args) {
          const out = orig.apply(this, args);
          if (om.isActive && !om._applyingRemoteVfx) {
            const payload = makePayload(...args);
            if (payload) om.send({ type: 'vfx_event', ...payload });
          }
          return out;
        };
      };
      wrapEm('createCrocodileBite', (x, y, dir, scale) => ({ kind: 'croc_bite', x: Math.round(x), y: Math.round(y), dir: dir || 1, scale: scale || 1 }));
      wrapEm('createTaoistFiend', (fiend) => fiend ? ({ kind: 'taoist_fiend', id: fiend.id, x: Math.round(fiend.x), y: Math.round(fiend.y), facing: fiend.facing || 1, life: fiend.life || 4.5, maxLife: fiend.maxLife || 4.5 }) : null);
      wrapEm('createSlashArc', (x, y, dir, radius, color, thickness) => ({ kind: 'slash_arc', x: Math.round(x), y: Math.round(y), dir: dir || 1, radius, color, thickness }));
      wrapEm('createFlameCoinSlash', (x, y, dir, scale) => ({ kind: 'flame_coin', x: Math.round(x), y: Math.round(y), dir: dir || 1, scale: scale || 1 }));
      wrapEm('createShockRing', (x, y, color, maxRadius) => ({ kind: 'shock_ring', x: Math.round(x), y: Math.round(y), color, maxRadius }));
      wrapEm('createGroundSlam', (x, y, radius) => ({ kind: 'ground_slam', x: Math.round(x), y: Math.round(y), radius }));
      wrapEm('createDragonUppercut', (x, y, dir) => ({ kind: 'dragon_uppercut', x: Math.round(x), y: Math.round(y), dir: dir || 1 }));
    }

    if (typeof Game !== 'undefined' && Game.prototype && !Game.prototype.__vovOnlineProjHooked) {
      Game.prototype.__vovOnlineProjHooked = true;
      const origSpawnProj = Game.prototype.spawnProjectile;
      if (typeof origSpawnProj === 'function') {
        Game.prototype.spawnProjectile = function (x, y, vx, vy, damage, owner, type) {
          const out = origSpawnProj.apply(this, arguments);
          const om = window.onlineManager;
          if (om && om.isActive && !om._applyingRemoteVfx && owner === this.player) {
            om.send({ type: 'vfx_event', kind: 'projectile', x: Math.round(x), y: Math.round(y), vx: Math.round(vx || 0), vy: Math.round(vy || 0), pType: type || 'knife' });
          }
          return out;
        };
      }
    }
  }
}

class Game extends window.GameRender {
  updatePlaying(dt) {
    const om = window.onlineManager;
    if (om && om.isActive && om.mode === 'pvp') {
      if (om._introLockTimer > 0) {
        om._introLockTimer = Math.max(0, om._introLockTimer - dt);
        if (this.player && (this.player.z < 0 || this.player.vz !== 0) && typeof this.player.update === 'function') {
          this.player.update(dt, []);
        }
        if (om.remotePlayer && typeof om.remotePlayer.updateRemote === 'function') om.remotePlayer.updateRemote(dt);
        om.update(dt);
        this.updateCamera(dt);
        return;
      }
      this.stageElapsedTime += dt;
      if (window.combatSystem) window.combatSystem.update(dt);
      const targets = (om.remotePlayer && !om.remotePlayer.isDead) ? [om.remotePlayer] : [];
      this.player.update(dt, targets);
      om.update(dt);
      if (this.stageElapsedTime >= 99 && !om._roundOver && om.slot === 1 && om.remotePlayer) {
        const myRatio = (this.player.hp || 0) / Math.max(1, this.player.maxHp || 1);
        const oppRatio = (om.remotePlayer.hp || 0) / Math.max(1, om.remotePlayer.maxHp || 1);
        om._roundOver = true;
        om.send({ type: 'match_result', winnerSlot: myRatio >= oppRatio ? 1 : 2 });
      }

      if (this.player) {
        this.player.x = Math.max(this.arenaMinX + 18, Math.min(this.arenaMaxX - 18, this.player.x));
        this.player.y = Math.max(515, Math.min(640, this.player.y));
      }
      if (om.remotePlayer && !this.player.isDead && !om.remotePlayer.isDead && this.player.state !== 'scissor_kick') {
        const dx = this.player.x - om.remotePlayer.x;
        const dy = this.player.y - om.remotePlayer.y;
        if (Math.abs(dx) < 32 && Math.abs(dy) < 16) {
          const pushX = (32 - Math.abs(dx)) * 0.45;
          const sign = dx >= 0 ? 1 : -1;
          this.player.x += sign * pushX;
        }
      }
      this.updateCamera(dt);
      return;
    }

    super.updatePlaying(dt);
    if (om && om.isActive && om.mode === 'coop') {
      om.update(dt);
    }
  }

  checkWaveProgress(dt) {
    const om = window.onlineManager;
    if (om && om.isActive && om.mode === 'coop' && om.slot === 2) return;
    return super.checkWaveProgress(dt);
  }

  triggerGameOver() {
    const om = window.onlineManager;
    if (om && om.isActive && om.mode === 'pvp') return;
    return super.triggerGameOver();
  }

  collectStageEvidence() {
    const om = window.onlineManager;
    if (om && om.isActive) return false;
    return super.collectStageEvidence();
  }

  render() {
    const om = window.onlineManager;
    const hasRemote = !!(om && om.isActive && om.remotePlayer && this.state !== 'MENU');
    if (!hasRemote) {
      return super.render();
    }

    const origEnemies = this.enemies;
    this.enemies = [...origEnemies, om.remotePlayer];
    try {
      super.render();
    } finally {
      this.enemies = origEnemies;
    }

    if (this.ctx && om.remotePlayer && typeof om.remotePlayer.drawOverlay === 'function') {
      om.remotePlayer.drawOverlay(this.ctx, this.camera, om.mode);
    }
  }
}

// Global Game Engine & Online Multiplayer Singletons
const onlineManager = new OnlineManager();
window.RemotePlayer = RemotePlayer;
window.OnlineManager = OnlineManager;
window.onlineManager = onlineManager;

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    onlineManager.bindUI();
    onlineManager.installHooks();
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const inviteCode = new URLSearchParams(window.location.search).get('room');
      if (inviteCode && inviteCode.trim()) {
        onlineManager._pendingInviteRoom = inviteCode.trim().toUpperCase().slice(0, 6);
        const inp = document.getElementById('online-join-code');
        if (inp) inp.value = onlineManager._pendingInviteRoom;
        onlineManager.openModal();
      }
    }
  });
}

const game = new Game();
window.Game = Game;
window.game = game;
