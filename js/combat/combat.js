/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/combat.js - Hitbox Collision, Combo System, Perfect Dodge & Damage Calculation
 */

if (!window.CharacterRegistry && typeof require === 'function') {
  try { require('../entities/characters/bootstrap.js'); } catch (_) {}
}

class CombatSystem {
  constructor() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.maxComboTimer = 2.2; // 2.2 giây để nối combo
    this.maxComboInStage = 0;
    this.totalHits = 0;
    this.perfectDodgeCount = 0;
    this.perfectCounterCount = 0;

    // Trạng thái Counter window
    this.isCounterWindow = false;
    this.counterTimer = 0;

    // ===== HỒI CHIÊU COUNTER L (L = né; né đúng nhịp mở cửa sổ phản đòn) =====
    // Cooldown bắt đầu ngay khi né được kích hoạt, không chờ animation kết thúc.
    this.dodgeSuccessCooldown = 1.25; // Perfect Dodge / Counter thành công
    this.dodgeFailCooldown = 0.70;    // Né hụt (không có đòn địch để né đúng nhịp)

    // ===== FLOW (0 - 100) =====
    this.flow = 0;
    this.flowMax = 100;
    this._flowFullAnnounced = false;

    // ===== OVERDRIVE =====
    this.overdriveTimer = 0;
    this.overdriveDuration = 8;
    this.overdriveDamageMul = 1.15;

    // ===== NỐI COMBO -> KỸ NĂNG (0.8s) =====
    this.skillLinkTimer = 0;
    this.skillLinkWindow = 0.8;
    this.skillLinkToken = 0;
    this._skillToken = 0;
    this._skillFlowGained = 0;

    // ===== COMBO M1 4 HIT =====
    this.m1ComboHits = 0;
    this.m1ComboTimer = 0;

    // ===== NÂNG CẤP THEO PHIÊN CHƠI =====
    this.upgradeDefs = [
      { id: 'finisherMastery', name: 'TINH THÔNG KẾT LIỄU', desc: 'Đòn kết thúc combo gây thêm 15% sát thương.' },
      { id: 'counterSpecialist', name: 'CHUYÊN GIA PHẢN ĐÒN', desc: 'Mỗi cú Perfect Counter nhận thêm 10 Flow.' },
      { id: 'skillLink', name: 'LIÊN KẾT KỸ NĂNG', desc: 'Kỹ năng tung trong 0.8s sau combo hoàn chỉnh gây thêm 12% sát thương.' },
      { id: 'ironWill', name: 'Ý CHÍ SẮT ĐÁ', desc: 'Một lần mỗi trận: khi HP dưới 20%, tạo lá chắn bằng 15% HP tối đa trong 2s.' },
      { id: 'overdriveExtension', name: 'GIA TỐC OVERDRIVE', desc: 'Overdrive kéo dài thêm 1.5s (không tăng sát thương).' }
    ];
    this.upgrades = {
      finisherMastery: false,
      counterSpecialist: false,
      skillLink: false,
      ironWill: false,
      overdriveExtension: false
    };

    // Nhật ký đòn của người chơi (boss Giang Mạnh quan sát THÓI QUEN, không đọc đầu vào)
    this.playerMoveLog = [];
    // Số lần trừng phạt được sơ hở của boss trong màn này
    this.weakPunishes = 0;
  }

  // Overdrive đang hoạt động? (dùng cho damage pipeline và hiệu ứng)
  get overdriveActive() {
    return this.overdriveTimer > 0;
  }

  hasUpgrade(id) {
    return !!(this.upgrades && this.upgrades[id]);
  }

  // Reset mỗi màn: Flow, Overdrive, cửa sổ nối skill... nhưng GIỮ nâng cấp của phiên chơi.
  resetStageStats() {
    this.comboCount = 0;
    this.comboTimer = 0;
    this.maxComboInStage = 0;
    this.totalHits = 0;
    this.perfectDodgeCount = 0;
    this.perfectCounterCount = 0;
    this.isCounterWindow = false;
    this.counterTimer = 0;
    this.playerMoveLog = [];
    this.weakPunishes = 0;

    this.flow = 0;
    this._flowFullAnnounced = false;
    this.overdriveTimer = 0;
    this.skillLinkTimer = 0;
    this.skillLinkToken = 0;
    this._skillFlowGained = 0;
    this.m1ComboHits = 0;
    this.m1ComboTimer = 0;

    if (window.uiManager) {
      if (window.uiManager.updateFlow) window.uiManager.updateFlow(0, this.flowMax);
      if (window.uiManager.updateOverdriveTimer) window.uiManager.updateOverdriveTimer(0);
      if (window.uiManager.updateDodgeCooldown) window.uiManager.updateDodgeCooldown(0);
    }
  }

  // Reset toàn bộ nâng cấp khi bắt đầu một lượt chơi mới.
  resetRunUpgrades() {
    for (const id in this.upgrades) this.upgrades[id] = false;
  }

  update(dt) {
    // Giảm thời gian duy trì combo
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    // Cửa sổ trừng phạt phản đòn (Perfect Counter Window)
    if (this.counterTimer > 0) {
      this.counterTimer -= dt;
      if (this.counterTimer <= 0) {
        this.isCounterWindow = false;
      }
    }

    // Cửa sổ nối combo -> kỹ năng
    if (this.skillLinkTimer > 0) {
      this.skillLinkTimer = Math.max(0, this.skillLinkTimer - dt);
    }

    // Đếm combo M1 4 hit (chỉ reset khi đã quá nhịp nối)
    if (this.m1ComboTimer > 0) {
      this.m1ComboTimer -= dt;
      if (this.m1ComboTimer <= 0) this.m1ComboHits = 0;
    }

    // Overdrive: đếm ngược, tự kết thúc đúng thời điểm
    if (this.overdriveTimer > 0) {
      this.overdriveTimer -= dt;
      if (this.overdriveTimer <= 0) {
        this.endOverdrive(true);
      } else if (window.uiManager && window.uiManager.updateOverdriveTimer) {
        window.uiManager.updateOverdriveTimer(this.overdriveTimer);
      }
    }
  }

  // ==========================================================================
  // FLOW (Đã dọn dẹp theo yêu cầu)
  // ==========================================================================
  addFlow(amount, announce = false) {
    return 0;
  }

  // Một cú M1 trúng đích: +4 Flow, mỗi cú vung chỉ tính 1 lần dù trúng nhiều địch.
  registerM1Hit(attacker) {
    if (!attacker || attacker.type !== 'player') return;
    const swingId = attacker._swingId || 0;
    if (attacker._flowSwingId === swingId) return;
    attacker._flowSwingId = swingId;

    // Vẫn đếm combo khi đang Overdrive (để mở cửa sổ Skill Link),
    // nhưng addFlow tự chặn cộng Flow trong Overdrive.
    this.m1ComboHits = (this.m1ComboTimer > 0) ? this.m1ComboHits + 1 : 1;
    this.m1ComboTimer = 1.4;
    this.addFlow(4);

    // Hoàn tất combo M1 4 hit: +4 Flow và mở 0.8s nối kỹ năng
    if (this.m1ComboHits >= 4) {
      this.addFlow(4);
      this.m1ComboHits = 0;
      this.skillLinkTimer = this.skillLinkWindow;
      if (window.effectManager && attacker) {
        window.effectManager.addFloatingText('LIÊN KẾT KỸ NĂNG!', attacker.x, attacker.y - 195, 'weak');
      }
    }
  }

  // Bắt đầu một lần dùng kỹ năng: chốt token để chỉ cộng Flow/scale đúng lần đó.
  beginSkillUse(player) {
    this._skillToken++;
    this._skillFlowGained = 0;
    if (player) player._skillToken = this._skillToken;
    // Skill Link: chỉ kích hoạt nếu đang trong 0.8s sau combo hoàn chỉnh.
    this.skillLinkToken = (this.skillLinkTimer > 0) ? this._skillToken : 0;
    if (this.skillLinkTimer > 0) this.skillLinkTimer = 0; // tiêu thụ cửa sổ
  }

  // Mỗi event sát thương của kỹ năng: +5 Flow, tối đa +15/lần kích hoạt.
  registerSkillHit(player) {
    if (this.overdriveTimer > 0) return;
    if (this._skillFlowGained >= 15) return;
    this._skillFlowGained += 5;
    this.addFlow(5);
  }

  // ==========================================================================
  // SCALE SÁT THƯƠNG NGƯỜI CHƠI (chỉ áp dụng ĐÚNG MỘT LẦN cho mỗi đòn)
  // ==========================================================================
  scalePlayerDamage(attacker, base, kind = 'basic') {
    if (!attacker || attacker.type !== 'player') return Math.round(base);
    let dmg = base;
    if (this.overdriveTimer > 0) dmg *= this.overdriveDamageMul;
    if (kind === 'finisher' && this.hasUpgrade('finisherMastery')) dmg *= 1.15;
    if (kind === 'skill' && this.hasUpgrade('skillLink') &&
        this.skillLinkToken > 0 && attacker._skillToken === this.skillLinkToken) {
      dmg *= 1.12;
    }
    return Math.max(1, Math.round(dmg));
  }

  // ==========================================================================
  // OVERDRIVE (Đã dọn dẹp theo yêu cầu)
  // ==========================================================================
  tryActivateOverdrive() {
    return false;
  }

  endOverdrive(showFeedback = true) {
    const wasActive = this.overdriveTimer > 0;
    this.overdriveTimer = 0;
    if (window.uiManager && window.uiManager.updateOverdriveTimer) {
      window.uiManager.updateOverdriveTimer(0);
    }
    if (!wasActive || !showFeedback) return;
    const p = window.game && window.game.player;
    if (window.audioManager) window.audioManager.playOverdriveEnd();
    if (window.effectManager && p) {
      window.effectManager.createOverdriveSparks(p.x, p.y - 60, 16);
      window.effectManager.addFloatingText('OVERDRIVE KẾT THÚC', p.x, p.y - 185, 'stale');
    }
  }

  // ==========================================================================
  // NÂNG CẤP
  // ==========================================================================
  getUpgradeChoices(count = 3) {
    const pool = this.upgradeDefs.filter((u) => !this.upgrades[u.id]);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  applyUpgrade(id) {
    if (!id || !(id in this.upgrades)) return false;
    if (this.upgrades[id]) return false;
    this.upgrades[id] = true;
    if (id === 'ironWill' && window.game && window.game.player) {
      window.game.player.ironWillUsed = false;
    }
    return true;
  }

  // Tăng Đòn Đánh Combo Hợp Lệ (Không tự cộng khi đánh hụt)
  registerHit(isPlayerHit, target, damage, isCrit = false) {
    if (isPlayerHit) {
      this.totalHits++;
      this.comboCount++;
      this.comboTimer = this.maxComboTimer;

      if (this.comboCount > this.maxComboInStage) {
        this.maxComboInStage = this.comboCount;
      }

      // Đánh giá cấp độ combo Vovinam
      const rank = this.getComboRank(this.comboCount);

      // Cập nhật giao diện HUD Combo
      if (window.uiManager && typeof window.uiManager.updateCombo === 'function') {
        window.uiManager.updateCombo(this.comboCount, rank, this.comboTimer / this.maxComboTimer);
      }
    }
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    if (window.uiManager && typeof window.uiManager.hideCombo === 'function') {
      window.uiManager.hideCombo();
    }
  }

  getComboRank(hits) {
    if (hits >= 10) return 'VOVINAM MASTER';
    if (hits >= 6) return 'SÁT THẦN';
    if (hits >= 4) return 'CAO THỦ';
    if (hits >= 2) return 'HỌC ĐỒ';
    return '';
  }

  // Kích Hoạt Né Đòn Hoàn Hảo (Perfect Dodge)
  triggerPerfectDodge(targetPlayer = null) {
    this.perfectDodgeCount++;
    this.isCounterWindow = true;
    // Thời gian phản đòn theo nhân vật đang chơi (Giang Mạnh có cửa sổ dài hơn)
    const p = targetPlayer || (window.game && window.game.player);
    this.counterTimer = (p && p.counterWindow) || 1.8;

    // Né thành công bằng [L]: giảm 50% thời gian hồi chiêu hiện tại của Né & các chiêu đang hồi
    if (p) {
      const curDodgeCd = (typeof p.dodgeCooldown === 'number' && p.dodgeCooldown > 0)
        ? p.dodgeCooldown
        : (p.maxDodgeCooldown || 8.0);
      p.dodgeCooldown = +(curDodgeCd * 0.5).toFixed(2);
      if (typeof p.counterHandCooldown === 'number' && p.counterHandCooldown > 0) {
        p.counterHandCooldown = +(p.counterHandCooldown * 0.5).toFixed(2);
      }
      if (typeof p.counterLegCooldown === 'number' && p.counterLegCooldown > 0) {
        p.counterLegCooldown = +(p.counterLegCooldown * 0.5).toFixed(2);
      }
      if (typeof p.stanceSkillCooldown === 'number' && p.stanceSkillCooldown > 0) {
        p.stanceSkillCooldown = +(p.stanceSkillCooldown * 0.5).toFixed(2);
      }
    }

    // Perfect Dodge = +12 Flow (Counter khi đánh trúng trong cửa sổ = +28 ở resolveHit)
    this.addFlow(12, true);

    if (window.audioManager) {
      window.audioManager.playPerfectDodge();
    }

    if (window.effectManager) {
      window.effectManager.triggerSlowMo(0.25, 0.4);
      window.effectManager.triggerFlash('#00d2ff', 0.4);
      if (p) {
        window.effectManager.createShockRing(p.x, p.y, '#00d2ff');
        window.effectManager.addFloatingText('NÉ HOÀN HẢO! (-50% HỒI CHIÊU)', p.x, p.y - 175, 'dodge');
      }
    }

    if (window.uiManager) {
      window.uiManager.showAlertBanner('PERFECT DODGE!');
    }
    if (window.tutorialManager && window.tutorialManager.isActive) {
      window.tutorialManager.recordAction('perfect_dodge');
    }
    if (window.trainingManager && window.trainingManager.isActive) {
      window.trainingManager.recordAction('perfect_dodge');
    }
  }

  /**
   * Kiểm Tra Va Chạm Hitbox Đòn Đánh Với Hurtbox Của Đối Thủ
   * @param {Object} attacker - Người ra đòn
   * @param {Object} defender - Người nhận đòn
   * @param {Object} attackData - Thông số đòn đánh (tầm đánh, sát thương, lực đẩy)
   */
  checkAttackHit(attacker, defender, attackData) {
    // Nếu đối thủ đã chết hoặc đang trong thời gian bất tử
    if (defender.isDead || defender.invincibleTimer > 0) return false;

    // Đòn đánh đã trúng mục tiêu này rồi (Mỗi đòn chỉ gây sát thương 1 lần trên 1 mục tiêu)
    if (attacker.hitTargets && attacker.hitTargets.has(defender.id)) return false;

    // Khiên giáp đứng giữa có thể che đồng đội phía sau (giới hạn cự ly + hướng, xem weapons.js)
    if (window.weaponSystem && window.weaponSystem.tryShieldIntercept(this, attacker, defender, attackData)) return true;

    // Chỉ trúng khi hai bên đứng cùng "làn" chiều sâu (2.5D)
    if (Math.abs(attacker.y - defender.y) > 58) return false;

    // Tính toán vùng Hitbox của Attacker theo hướng quay mặt (mở rộng vào tới tâm attacker.x để không bị điểm mù sát thân, không lan ra sau lưng)
    const facing = attacker.facing || 1;
    const rawOffsetX = attackData.offsetX !== undefined ? attackData.offsetX : 40;
    const hitY = attacker.y + (attacker.z || 0) + (attackData.offsetY || -60);
    const hitWidth = attackData.width || 60;
    const hitHeight = attackData.height || 50;
    const rawHalfW = hitWidth / 2;
    const reachFront = Math.max(rawOffsetX + rawHalfW, rawHalfW);
    const reachBack = Math.min(0, rawOffsetX - rawHalfW);
    const boxMinX = facing >= 0 ? (attacker.x + reachBack) : (attacker.x - reachFront);
    const boxMaxX = facing >= 0 ? (attacker.x + reachFront) : (attacker.x - reachBack);
    const hitX = (boxMinX + boxMaxX) * 0.5;
    const effHalfW = (boxMaxX - boxMinX) * 0.5;

    // Hurtbox của Defender (cao ~130px theo kích thước vẽ)
    const defHeight = defender.isBoss ? 150 : 130;
    const defWidth = 54;
    const defCenterX = defender.x;
    const defCenterY = defender.y + (defender.z || 0) - defHeight / 2;

    // Kẻ địch khi ra đòn đồng thời quét trúng cả Đối phương / Đồng Minh nếu đứng trong vùng đánh
    if (attacker.type !== 'player' && !this._checkingAlly) {
      const ally = (window.allyManager && window.allyManager.activeAlly) || (window.allySystem && window.allySystem.activeAlly);
      const otherTarget = (defender === ally) ? (window.game && window.game.player) : ally;
      if (otherTarget && !otherTarget.isDead) {
        this._checkingAlly = true;
        try {
          this.checkAttackHit(attacker, otherTarget, attackData);
        } finally {
          this._checkingAlly = false;
        }
      }
    }

    // AABB Collision Test
    const isColliding = (
      Math.abs(hitX - defCenterX) < (effHalfW + defWidth / 2) &&
      Math.abs(hitY - defCenterY) < (hitHeight / 2 + defHeight / 2)
    );

    if (isColliding) {
      // Đánh dấu mục tiêu đã bị trúng đòn
      if (!attacker.hitTargets) attacker.hitTargets = new Set();
      attacker.hitTargets.add(defender.id);

      // Ghi nhật ký đòn người chơi (boss Giang Mạnh phân tích thói quen)
      if (attacker.type === 'player' && typeof attacker.state === 'string') {
        this.playerMoveLog.push(attacker.state);
        if (this.playerMoveLog.length > 24) this.playerMoveLog.shift();
      }

      // Xử lý Né Tránh / Đỡ Đòn / Trúng Đòn
      this.resolveHit(attacker, defender, attackData);
      return true;
    }

    return false;
  }

  /**
   * Tính Toán Sát Thương, Hiệu Ứng Bật Lùi, Choáng Và Năng Lượng
   * Phân biệt trọng lượng đòn: light / heavy / ultimate -> hit-stop, âm thanh, rung hình khác nhau
   */
  resolveHit(attacker, defender, attackData) {
    const isPlayerAttacking = (attacker.type === 'player');
    let damage = attackData.damage || 20;
    let isCrit = false;
    let isWeakPunish = false;
    const weight = attackData.weight || (attackData.knockdown ? 'heavy' : 'light');

    // ===== ĐỐI PHƯƠNG LÀ ĐỒNG MINH HỖ TRỢ (ALLY) =====
    if (defender.isAlly || defender.type === 'ally') {
      let dmg = attackData.damage || 25;
      if (typeof defender.takeDamage === 'function') {
        const kb = Math.sign(defender.x - attacker.x) * (attackData.knockback ? 8 : 4);
        defender.takeDamage(dmg, kb, !!attackData.knockdown);
      }
      this.registerHit(false, defender, dmg, false);
      if (window.audioManager) window.audioManager.playPunchHit();
      return;
    }

    // ===== NHỊP RA ĐÒN (chống spam): đánh dồn dập liên tục -> lực nhạt dần =====
    let staleHit = false;
    if (isPlayerAttacking && typeof attacker.applyHitRhythm === 'function') {
      const mul = attacker.applyHitRhythm();
      if (mul < 1) damage = Math.max(1, Math.round(damage * mul));
      staleHit = mul <= 0.6;
    }

    // ===== HỆ THỐNG PHẢN ĐÒN VOVINAM CHỦ ĐỘNG: U + J (TAY) & U + K (CHÂN) =====
    if (!isPlayerAttacking && defender.type === 'player' &&
        (defender.state === 'counter_hand_prep' || defender.state === 'counter_leg_prep') &&
        defender.activeCounterWindow > 0) {
      
      const dist = Math.hypot(attacker.x - defender.x, (attacker.y - defender.y) * 1.5);
      // Tự động xoay mặt về hướng đối thủ nếu trong cự ly chạm đòn để counter không bị hụt hướng
      if (dist < 235 && attacker.x !== defender.x) {
        defender.facing = Math.sign(attacker.x - defender.x) || defender.facing;
      }
      const isFacingAttacker = (attacker.x - defender.x) * defender.facing >= 0;

      // CẢ HAI THẾ COUNTER (U+J VÀ U+K) ĐỀU ĐỠ VÀ PHẢN ĐÒN THÀNH CÔNG TRƯỚC MỌI ĐÒN ĐÁNH
      // (ĐỠ ĐƯỢC CẢ ĐÒN ĐẤM, ĐÁ, ĐÒN NẶNG BOSS, UNCOUNTERABLE, VŨ KHÍ & AOE)!
      if (dist < 235) {
        const counterMatches = (defender.activeCounterType === 'hand' || defender.activeCounterType === 'leg');

        if (counterMatches) {
          // Phản đòn thành công lập tức phá vỡ Bá Thể Đỏ (Red Hyper Armor) của kẻ địch!
          if (attacker.auraArmor === 'red') {
            attacker.clearAuraArmor();
            if (window.effectManager) {
              window.effectManager.addFloatingText('💥 PHẢN ĐÒN PHÁ BÁ THỂ ĐỎ!', attacker.x, attacker.y - 180, 'warn');
              window.effectManager.createShockRing(attacker.x, attacker.y, '#ef4444');
            }
          }
            // ===== COUNTER VOVINAM THÀNH CÔNG! =====
            defender.counterSuccess = true;
            defender.activeCounterWindow = 0;
            this.perfectCounterCount++;
            if (window.tutorialManager && window.tutorialManager.isActive) {
              if (defender.activeCounterType === 'hand') {
                window.tutorialManager.recordAction('counter_hand');
              } else if (defender.activeCounterType === 'leg') {
                window.tutorialManager.recordAction('counter_leg');
              }
            }
            if (window.trainingManager && window.trainingManager.isActive) {
              if (defender.activeCounterType === 'hand') {
                window.trainingManager.recordAction('counter_hand');
              } else if (defender.activeCounterType === 'leg') {
                window.trainingManager.recordAction('counter_leg');
              }
            }
            if (window.audioManager && typeof window.audioManager.playVovinamKiai === 'function') {
              window.audioManager.playVovinamKiai('counter', defender.characterId || 'nghi');
            }
            if (window.saveManager) {
              window.saveManager.unlockAchievement('counter_master');
            }

            // Micro Hit-stop & Visual/Audio Feedback
            if (window.game) window.game.hitStop = 0.09;
            attacker.hitJitterTimer = 0.14;

            if (defender.activeCounterType === 'hand') {
              // ===== U+J: PHẢN ĐÒN TAY THEO TỪNG NHÂN VẬT =====
              defender.setState('counter_hand_strike', 0.36);
              defender._lastDamagedEnemy = attacker;
              const counterDmg = Math.round(90 * (defender.dmgMul || 1) * (defender.counterBonus || 1) * (defender.allyCounterBuff || 1));
              attacker.pendingHit = { isHandCounter: true, weight: 'heavy' };
              attacker.takeDamage(counterDmg, defender.facing * 6, false);
              attacker.state = 'hurt';
              attacker.stateTimer = 0;
              attacker.stateDuration = 0.65; // Tê liệt chấn động
              if (attacker.isBoss) {
                attacker.weakWindow = 1.1;
                attacker.poise = Math.max(0, (attacker.poise || 120) - 35);
              }
              defender.addEnergy(25); // Nạp nộ khí
              this.addFlow(25, true);

              // === NỘI TẠI KÍCH HOẠT KHI COUNTER TAY (TỪ MODULE NHÂN VẬT) ===
              if (window.CharacterRegistry) {
                const hpBeforeHandCounter = attacker.isRemotePlayer ? (attacker.hp || 0) : null;
                window.CharacterRegistry.onHandCounter(defender, attacker, this);
                if (attacker.isRemotePlayer && hpBeforeHandCounter !== null && attacker.hp < hpBeforeHandCounter &&
                    window.onlineManager && window.onlineManager.isActive) {
                  attacker._optimisticHpLockTimer = 0.6;
                  window.onlineManager.send({ type: 'pvp_hit', damage: Math.round(hpBeforeHandCounter - attacker.hp), bypassInvincible: true });
                }
              }

              const _handLabel = (window.CharacterRegistry && window.CharacterRegistry.getSkillMoveLabel)
                ? window.CharacterRegistry.getSkillMoveLabel(defender, 'counter_hand_strike', 'GẠT QUYỀN PHẢN CHƯỞNG')
                : 'GẠT QUYỀN PHẢN CHƯỞNG';
              if (window.audioManager) window.audioManager.playHeavyHit();
              if (window.effectManager) {
                const _tp = (window.CharacterRegistry && window.CharacterRegistry.getTrailProfile) ? window.CharacterRegistry.getTrailProfile(defender, 'counter_hand_strike') : null;
                const _cHand = (_tp && _tp.primary) ? _tp.primary : '#00d2ff';
                window.effectManager.triggerFinisherMoment(attacker.x, attacker.y - 75, _handLabel, _cHand);
                const _handSparks = (window.CharacterRegistry && window.CharacterRegistry.getSparkColors) ? window.CharacterRegistry.getSparkColors(defender) : _cHand;
                window.effectManager.createHitSparks(attacker.x, attacker.y - 85, 26, true, _handSparks);
                window.effectManager.createShockRing(defender.x, defender.y, _cHand);
                window.effectManager.triggerScreenShake(8, 0.22);
                window.effectManager.addFloatingText('⚡ ' + _handLabel + '!', defender.x, defender.y - 175, 'counter');
                window.effectManager.addFloatingText(counterDmg, attacker.x, attacker.y - 130, 'crit');
              }
              if (window.uiManager) window.uiManager.showAlertBanner('⚡ ' + _handLabel + '!');
            } else {
              // ===== U+K: PHẢN ĐÒN CHÂN THEO TỪNG NHÂN VẬT =====
              defender.setState('counter_leg_strike', 0.44);
              defender._lastDamagedEnemy = attacker;
              const counterDmg = Math.round(110 * (defender.dmgMul || 1) * (defender.counterBonus || 1) * (defender.allyCounterBuff || 1));
              attacker.pendingHit = { isLegCounter: true, weight: 'heavy' };
              defender.addEnergy(20);
              this.addFlow(30, true);

              // === NỘI TẠI KÍCH HOẠT KHI COUNTER CHÂN (TỪ MODULE NHÂN VẬT) ===
              if (window.CharacterRegistry) {
                const hpBeforeLegCounter = attacker.isRemotePlayer ? (attacker.hp || 0) : null;
                window.CharacterRegistry.onLegCounter(defender, attacker, this);
                if (attacker.isRemotePlayer && hpBeforeLegCounter !== null && attacker.hp < hpBeforeLegCounter &&
                    window.onlineManager && window.onlineManager.isActive) {
                  attacker._optimisticHpLockTimer = 0.6;
                  window.onlineManager.send({ type: 'pvp_hit', damage: Math.round(hpBeforeLegCounter - attacker.hp), bypassInvincible: true });
                }
              }

              if (attacker.isBoss) {
                // Boss bị quét choáng, sụt 60 điểm Poise và mở cửa sơ hở
                attacker.takeDamage(counterDmg, defender.facing * 8, false);
                attacker.state = 'hurt';
                attacker.stateTimer = 0;
                attacker.stateDuration = 0.75;
                attacker.weakWindow = 1.4;
                attacker.poise = Math.max(0, (attacker.poise || 120) - 60);
              } else {
                // Lính thường bị quét hất tung lên không trung và quật ngã
                attacker.combatKnockbackTimer = 0.75;
                attacker.isKnockedBack = true;
                attacker.vz = 260; // Hất tung lên không
                attacker.takeDamage(counterDmg, defender.facing * 12, true);
              }

              const _legLabel = (window.CharacterRegistry && window.CharacterRegistry.getSkillMoveLabel)
                ? window.CharacterRegistry.getSkillMoveLabel(defender, 'counter_leg_strike', 'GẠT TRỤ TRIỆT CƯỚC')
                : 'GẠT TRỤ TRIỆT CƯỚC';
              if (window.audioManager) window.audioManager.playKick();
              if (window.effectManager) {
                const _tpL = (window.CharacterRegistry && window.CharacterRegistry.getTrailProfile) ? window.CharacterRegistry.getTrailProfile(defender, 'counter_leg_strike') : null;
                const _cLeg = (_tpL && (_tpL.secondary || _tpL.primary)) ? (_tpL.secondary || _tpL.primary) : '#ffd700';
                window.effectManager.triggerFinisherMoment(attacker.x, attacker.y - 75, _legLabel, _cLeg);
                window.effectManager.createGroundCrack(attacker.x, attacker.y, 110, _cLeg);
                const _legSparks = (window.CharacterRegistry && window.CharacterRegistry.getSparkColors) ? window.CharacterRegistry.getSparkColors(defender) : _cLeg;
                window.effectManager.createHitSparks(attacker.x, attacker.y - 50, 28, true, _legSparks);
                window.effectManager.createShockRing(defender.x, defender.y, _cLeg);
                window.effectManager.triggerScreenShake(12, 0.28);
                window.effectManager.addFloatingText('🌪️ ' + _legLabel + '!', defender.x, defender.y - 175, 'counter');
                window.effectManager.addFloatingText(counterDmg, attacker.x, attacker.y - 130, 'crit');
              }
              if (window.uiManager) window.uiManager.showAlertBanner('🌪️ ' + _legLabel + '!');
            }

            if (attacker.isBoss && window.uiManager && typeof window.uiManager.updateBossPoise === 'function') {
              window.uiManager.updateBossPoise(attacker.poise ?? 100, attacker.maxPoise ?? 100, attacker.weakWindow || 0);
            }
            this.registerHit(true, attacker, defender.activeCounterType === 'hand' ? 90 : 110, true);
            return; // Đòn tấn công của địch bị hóa giải hoàn toàn!
          }
        }
      }
    // Đòn đỡ có phản kích — cơ chế riêng của nhân vật thủ thế (Triệu Đình An khi chơi được)
    // Giới hạn số lần đỡ / phản kích qua Guard Gauge (tối đa 5-7 đòn liên tiếp)
    if (!isPlayerAttacking && defender.type === 'player' && defender.state === 'guard' && defender.mechRiposte) {
      const guardCost = (weight === 'heavy' || weight === 'ultimate') ? 28 : 16;
      const isBroken = defender.consumeGuard ? defender.consumeGuard(guardCost) : false;
      if (isBroken) {
        // Vỡ thế phòng thủ! Bị bể thủ và nhận sát thương trừng phạt (+30%)
        damage = Math.round((attackData.damage || 20) * 1.3);
        const kb = (attackData.knockback || 4) * attacker.facing * 0.6;
        defender.takeDamage(damage, kb, false);
        if (defender.type === 'player' && defender.guardBreakTimer > 0) {
          defender.state = 'guard_break';
          defender.stateDuration = defender.guardBreakTimer;
        }
        return;
      }

      const riposteDmg = Math.round((attackData.damage || 20) * 1.15);
      attacker.takeDamage(riposteDmg, -defender.facing * 14, false);
      defender.addEnergy(8);
      if (window.CharacterRegistry) {
        window.CharacterRegistry.onGuardReflect(defender, attacker, riposteDmg);
      }
      const blocksLeft = Math.max(0, Math.ceil(defender.guardGauge / 16));
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) {
        const _riposteSparks = (window.CharacterRegistry && window.CharacterRegistry.getSparkColors) ? window.CharacterRegistry.getSparkColors(defender) : null;
        window.effectManager.createHitSparks(attacker.x, attacker.y - 90, 16, true, _riposteSparks);
        window.effectManager.addFloatingText('PHẢN CHỦNG! [' + blocksLeft + '/6]', attacker.x, attacker.y - 140, 'counter');
        window.effectManager.triggerScreenShake(7, 0.2);
      }
      if (window.uiManager && typeof window.uiManager.showAlertBanner === 'function') {
        window.uiManager.showAlertBanner('PHẢN CHỦNG! (' + blocksLeft + '/6)');
      }
      return;
    }

    // Nếu đang trong cửa sổ Perfect Counter
    if (isPlayerAttacking && this.isCounterWindow) {
      // Hệ số phản đòn chuẩn của người chơi (attacker); trong PvP giới hạn tối đa 1.85x để cân bằng
      const rawBonus = (attacker && typeof attacker.counterBonus === 'number') ? attacker.counterBonus : 1.85;
      const bonus = (defender && defender.isRemotePlayer) ? Math.min(rawBonus, 1.85) : rawBonus;
      const allyCounterMul = (attacker && typeof attacker.allyCounterBuff === 'number' && attacker.allyCounterBuff > 0) ? attacker.allyCounterBuff : 1.0;
      damage = Math.round(damage * bonus * allyCounterMul);
      isCrit = true;
      this.isCounterWindow = false; // Tiêu thụ counter window
      if (window.uiManager) {
        window.uiManager.showAlertBanner('PERFECT COUNTER!');
      }
    }

    // Boss lộ sơ hở (recovery window) -> trừng phạt được, sát thương tăng
    if (isPlayerAttacking && !isCrit && typeof defender.weakWindow === 'number' && defender.weakWindow > 0) {
      damage = Math.round(damage * 1.4);
      isWeakPunish = true;
      this.weakPunishes++;
    }

    // Ghi nhận đòn không chiến của người chơi đã chạm đích (kể cả trúng trực diện hay bị đối thủ đỡ đòn)
    if (isPlayerAttacking) {
      if (attacker.state === 'flying_kick') {
        attacker.kickHasHit = true;
      }
      if (attacker.state === 'air_punch') {
        attacker.airPunchHasHit = true;
      }
    }

    // Nếu đối thủ đang Thủ (Guard) — chỉ chặn được đòn tới từ phía mặt (địch bị đánh từ sau lưng không được thủ)
    const isPvpFight = !!(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp');
    const isPvpTarget = !!(defender && defender.isRemotePlayer);
    const guardBehind = defender.type !== 'player' && Math.sign(attacker.x - defender.x) !== (defender.facing || 1);
    if (defender.state === 'guard' && !guardBehind) {
      // Đòn chân kẹp Vovinam, tuyệt kỹ hoặc Perfect Counter không thể bị đỡ!
      if (attackData.unblockable || isCrit) {
        damage = Math.round(damage * 1.2);
        defender.guardBroken = true;
        if (defender.type === 'player' && typeof defender.triggerGuardBreak === 'function') {
          defender.triggerGuardBreak();
        }
      } else {
        if (defender.type === 'player') {
          const guardCost = (weight === 'heavy') ? 28 : (weight === 'ultimate' ? 42 : 16);
          const isBroken = defender.consumeGuard ? defender.consumeGuard(guardCost) : false;
          if (isBroken) {
            damage = Math.round(damage * 1.3);
            const kb = (attackData.knockback || 4) * attacker.facing * 0.6;
            defender.takeDamage(damage, kb, false);
            if (defender.guardBreakTimer > 0) {
              defender.state = 'guard_break';
              defender.stateDuration = defender.guardBreakTimer;
            }
            return;
          }
        }
        const rawDamageForRemote = damage;
        if (!isPvpTarget) {
          damage = Math.round(damage * 0.2); // Giảm 80% sát thương khi thủ
        }
        const blocksLeft = defender.type === 'player' ? Math.max(0, Math.ceil((defender.guardGauge || 0) / 16)) : 0;
        const blockLabel = defender.type === 'player' ? ('ĐỠ ĐÒN [' + blocksLeft + '/6]') : 'BLOCKED';
        if (window.audioManager) window.audioManager.playBlock();
        if (window.effectManager) effectManager.addFloatingText(blockLabel, defender.x, defender.y - 100, 'block');
        if (isPlayerAttacking && isPvpTarget && typeof attacker.addEnergy === 'function') {
          attacker.addEnergy(3); // Ép thủ trong PvP vẫn tích nhẹ Nộ
        }
        // Thủ đúng lúc được tích năng lượng: phòng thủ chủ động có giá trị
        if (defender.type === 'player') {
          defender.addEnergy(isPvpFight ? 6 : 2);
          // Nội tại phản chấn khi giữ thế thủ (VD: Triệu Đình An — Phụng Hoàng Hộ Tâm)
          if (window.CharacterRegistry) {
            window.CharacterRegistry.onGuardReflect(defender, attacker, damage);
          }
          if (window.tutorialManager && window.tutorialManager.isActive) {
            window.tutorialManager.recordAction('guard_held');
          }
          if (window.trainingManager && window.trainingManager.isActive) {
            window.trainingManager.recordAction('guard_held');
          }
        }
        defender.pendingHit = { weight: 'light', isCrit: false, blocked: true };
        defender.takeDamage(isPvpTarget ? rawDamageForRemote : damage, 0, false);
        return;
      }
    }

    // Đòn của boss có trọng lượng cao: người chơi bị đánh trúng sẽ mất nhiều khoảng trống hơn
    const knockbackMul = (weight === 'ultimate' ? 1.5 : (weight === 'heavy' ? 1.2 : 1));
    const knockback = (attackData.knockback || 4) * attacker.facing * (isPlayerAttacking ? 1 : knockbackMul);
    // Đòn "nhạt lực" do spam liên tục: gây sát thương nhưng không đủ lực làm choáng/quật ngã
    const noStagger = (staleHit || !!attackData.noStagger) && !isCrit && !isWeakPunish;
    const isKnockdown = !!attackData.knockdown && !noStagger;

    if (isPlayerAttacking && isKnockdown) {
      defender.combatKnockbackTimer = 0.65;
      defender.isKnockedBack = true;
    }


    // Bích Lâm: Phi Thân Lạc Bộ (Next Hit Crit)
    if (isPlayerAttacking && attacker.nextHitCrit) {
      damage = Math.round(damage * 1.8);
      isCrit = true;
      attacker.nextHitCrit = false;
      if (window.effectManager) {
        window.effectManager.addFloatingText('BẠO KÍCH XUYÊN PHÁ!', defender.x, defender.y - 150, 'crit');
      }
    }

    // Ghi thông tin đòn đánh để đối thủ xử lý siêu giáp (poise) chính xác
    defender.pendingHit = {
      weight: noStagger ? 'light' : weight, isCrit, knockdown: isKnockdown, noFlinch: noStagger, blocked: false,
      fromX: attacker.x, unblockable: !!attackData.unblockable,
      attackerState: attacker.state
    };
    defender.takeDamage(damage, knockback, isKnockdown);
    if (defender.isBoss && window.uiManager && typeof window.uiManager.updateBossPoise === 'function') {
      window.uiManager.updateBossPoise(defender.poise ?? 100, defender.maxPoise ?? 100, defender.weakWindow || 0);
    }

    // Kích hoạt hiệu ứng kỹ năng đặc biệt của vũ khí (Mã tấu: Xuất Huyết / Côn: Choáng)
    if (!defender.isDead && attackData.weaponEffect) {
      if (attackData.weaponEffect === 'bleed') {
        const chance = (attackData.bleedChance !== undefined) ? attackData.bleedChance : (isPlayerAttacking ? 0.35 : 0.25);
        if (Math.random() < chance) {
          this.applyBleed(defender, isPlayerAttacking, attackData.bleedDmg);
          if (isPlayerAttacking && window.saveManager) {
            window.saveManager.unlockAchievement('bleed_master');
          }
        }
      } else if (attackData.weaponEffect === 'stun') {
        const chance = (attackData.stunChance !== undefined) ? attackData.stunChance : (isPlayerAttacking ? 0.30 : 0.20);
        if (Math.random() < chance) {
          this.applyStun(defender, isPlayerAttacking, attackData.stunDuration, attackData.bossPoiseDmg);
          if (isPlayerAttacking && window.saveManager) {
            window.saveManager.unlockAchievement('stun_master');
          }
        }
      }
    }

    // Âm thanh phân biệt theo trọng lượng đòn
    if (window.audioManager) {
      if (weight === 'ultimate') {
        if (typeof window.audioManager.playHeavyHit === 'function') window.audioManager.playHeavyHit();
      } else if (attackData.isKick || weight === 'heavy') {
        if (typeof window.audioManager.playKick === 'function') window.audioManager.playKick();
      } else {
        if (typeof window.audioManager.playPunch === 'function') window.audioManager.playPunch();
      }
    }

    // Hiệu ứng hình ảnh (Tia lửa, rung màn hình định hướng, Camera Punch) theo trọng lượng đòn
    if (window.effectManager) {
      const sparkX = defender.x - attacker.facing * 10;
      const sparkY = defender.y + (defender.z || 0) - 85;
      const soft = noStagger ? 0.45 : 1;
      const sparkCount = Math.max(2, Math.round((isCrit ? 22 : (weight === 'ultimate' ? 26 : (weight === 'heavy' ? 17 : 8))) * soft));
      // Đòn nhẹ không rung camera; đòn trung bình/nặng rung có kiểm soát theo hướng đòn
      const shakeAmt = Math.round((isCrit ? 7 : (weight === 'ultimate' ? 8 : (weight === 'heavy' ? 4.5 : 0))) * soft);
      const sparkColors = (window.CharacterRegistry && window.CharacterRegistry.getSparkColors) ? window.CharacterRegistry.getSparkColors(attacker) : null;
      window.effectManager.createHitSparks(sparkX, sparkY, sparkCount, isCrit || weight === 'ultimate', sparkColors);
      if (shakeAmt > 0) window.effectManager.triggerScreenShake(shakeAmt, isCrit ? 0.22 : 0.15, attacker.facing || 1, 0);
      if ((isCrit || weight === 'ultimate') && window.game && typeof window.game.triggerCameraPunch === 'function') {
        window.game.triggerCameraPunch(isCrit ? 1.055 : 1.045, 0.18, defender.x, defender.y);
      }
      if (isCrit) {
        // Perfect Counter: vòng sóng + chữ riêng, khác hẳn đòn thường
        window.effectManager.createShockRing(defender.x, defender.y, '#ff2244');
        window.effectManager.addFloatingText('PHẢN ĐÒN!', defender.x, defender.y + (defender.z || 0) - 175, 'counter');
      }
      window.effectManager.addFloatingText(
        damage,
        defender.x,
        defender.y + (defender.z || 0) - 130,
        isCrit ? 'crit' : (isWeakPunish ? 'weak' : (noStagger ? 'stale' : 'normal'))
      );
      if (isWeakPunish) {
        window.effectManager.addFloatingText('SƠ HỞ!', defender.x, defender.y + (defender.z || 0) - 160, 'weak');
      }
      if (isKnockdown && (weight === 'ultimate' || (weight === 'heavy' && isCrit))) {
        window.effectManager.createGroundCrack(defender.x, defender.y, 75, '#38bdf8');
      }
    }

    // Target Hit-Jitter & Micro Hit-stop: mục tiêu trúng đòn rung tại chỗ trong khoảnh khắc khựng lực
    if (!noStagger) {
      defender.hitJitterTimer = isCrit ? 0.095 : (weight === 'ultimate' ? 0.095 : (weight === 'heavy' ? 0.065 : 0.032));
    }
    if (window.game && isPlayerAttacking && !noStagger && !attacker._hitStopThisAttack) {
      attacker._hitStopThisAttack = true;
      if (isCrit) window.game.hitStop = 0.065;
      else if (weight === 'ultimate') window.game.hitStop = 0.085;
      else if (weight === 'heavy') window.game.hitStop = 0.045;
      else window.game.hitStop = 0.024;
    }

    // Ghi nhận combo & hồi năng lượng Vovinam cho nhân vật chơi được
    if (isPlayerAttacking) {
      attacker._lastDamagedEnemy = defender;
      this.registerHit(true, defender, damage, isCrit);
      const energyGain = (typeof attackData.energyGain === 'number' && Number.isFinite(attackData.energyGain)) ? attackData.energyGain : 8;
      // PvP đối đầu 1v1 chỉ có 1 mục tiêu nên tích Nộ x2.5 lần PvE để kịp tung Tuyệt Kỹ trong hiệp
      const pvpMult = (isPvpTarget || isPvpFight) ? 2.5 : 1.0;
      attacker.addEnergy(energyGain * 0.4 * pvpMult * (isCrit ? 1.5 : (noStagger ? 0.1 : 1.0)));

      // === KÍCH HOẠT NỘI TẠI THỰC CHIẾN KHI ĐÒN ĐÁNH TRÚNG ĐÍCH (TỪ MODULE NHÂN VẬT) ===
      if (window.CharacterRegistry) {
        const hpBeforePassive = defender.isRemotePlayer ? (defender.hp || 0) : null;
        window.CharacterRegistry.onAttackHit(attacker, defender, attackData, this);
        if (defender.isRemotePlayer && hpBeforePassive !== null && defender.hp < hpBeforePassive &&
            window.onlineManager && window.onlineManager.isActive) {
          defender._optimisticHpLockTimer = 0.6;
          window.onlineManager.send({
            type: 'pvp_hit',
            damage: Math.round(hpBeforePassive - defender.hp),
            bypassInvincible: true
          });
        }
      }
    }
  }

  /**
   * Áp dụng hiệu ứng Xuất Huyết (Bleed DoT) từ Mã Tấu
   * Thời gian 2.5s, nhảy tick mỗi 0.8s (~3 ticks). Không cộng dồn vô hạn mà làm mới thời gian.
   */
  applyBleed(target, isPlayerAttacking, customDmg) {
    if (!target || target.isDead) return;
    const tickDmg = customDmg || (isPlayerAttacking ? (6 + Math.floor(Math.random() * 3)) : (2 + Math.floor(Math.random() * 2)));
    const wasBleeding = (target.bleedTimer > 0);
    target.bleedTimer = 2.5;
    target.bleedTickTimer = 0.8;
    target.bleedDmg = wasBleeding ? Math.max(target.bleedDmg || 0, tickDmg) : tickDmg;

    if (!wasBleeding && window.effectManager) {
      window.effectManager.addFloatingText('XUẤT HUYẾT! 🩸', target.x, (target.y || 580) + (target.z || 0) - 150, 'bleed');
      window.effectManager.createHitSparks(target.x, (target.y || 580) + (target.z || 0) - 70, 8, false);
    }
    if (window.audioManager && typeof window.audioManager.playHurt === 'function') {
      window.audioManager.playHurt();
    }
  }

  /**
   * Áp dụng hiệu ứng Thiêu Đốt (Burn DoT từ Kiếm Xu & Âm Binh của Thiên Khánh)
   */
  applyBurn(target, isPlayerAttacking = true, customDmg = 10, duration = 3.2) {
    if (!target || target.isDead) return;
    const tickDmg = customDmg || (isPlayerAttacking ? 10 : 5);
    const wasBurning = (target.burnTimer > 0);
    target.burnTimer = Math.max(target.burnTimer || 0, duration || 3.2);
    if (!wasBurning || !target.burnTickTimer || target.burnTickTimer <= 0) {
      target.burnTickTimer = 0.7;
    }
    target.burnDmg = wasBurning ? Math.max(target.burnDmg || 0, tickDmg) : tickDmg;

    if (!wasBurning && window.effectManager) {
      window.effectManager.addFloatingText('THIÊU ĐỐT! 🔥', target.x, (target.y || 580) + (target.z || 0) - 155, 'crit');
      window.effectManager.createHitSparks(target.x, (target.y || 580) + (target.z || 0) - 70, 10, true);
    }
  }

  /**
   * Áp dụng hiệu ứng Choáng Váng (Stun) từ Côn/Gậy
   * - Quái thường / Hình nộm: Choáng 1.2s - 1.5s, ngừng mọi hành động.
   * - Boss: Không bị perma-stun; thay vào đó chịu khựng micro-stagger 0.6s và hao 25 Poise.
   * - Người chơi: Choáng 0.8s nếu bị địch đập trúng.
   */
  applyStun(target, isPlayerAttacking, duration, bossPoiseDmg) {
    if (!target || target.isDead) return;
    if (target.isBoss) {
      const poiseCost = bossPoiseDmg || 25;
      target.poise = Math.max(0, (target.poise ?? 100) - poiseCost);
      target.weakWindow = Math.max(target.weakWindow || 0, 0.6);
      if (window.effectManager) {
        window.effectManager.addFloatingText('CHOÁNG! (-' + poiseCost + ' POISE) 💫', target.x, (target.y || 580) + (target.z || 0) - 150, 'stun');
        window.effectManager.createShockRing(target.x, target.y || 580, '#f59e0b');
      }
      if (window.audioManager && typeof window.audioManager.playHeavyHit === 'function') {
        window.audioManager.playHeavyHit();
      }
      if (window.uiManager && typeof window.uiManager.updateBossPoise === 'function') {
        window.uiManager.updateBossPoise(target.poise, target.maxPoise ?? 100, target.weakWindow);
      }
      return;
    }

    let dur = duration || (isPlayerAttacking ? 1.4 : 0.8);
    // Boss có kháng choáng cao (Boss Poise Resistence): tối đa chỉ bị khựng 0.35s, không thể bị đóng băng dài
    if (target.isBoss) {
      dur = Math.min(dur, 0.35);
    }
    target.stunTimer = Math.max(target.stunTimer || 0, dur);
    target.vx = 0;
    target.vy = 0;
    target.isAttacking = false;
    if (target.atk) {
      target.atk = null;
      target._wpActive = false;
      target._tele = false;
    }
    if (target.state !== 'knockdown' && target.state !== 'getup') {
      target.setState('hurt', target.stunTimer);
    }
    if (window.effectManager) {
      const label = (target.type === 'player') ? 'BỊ CHOÁNG! 💫' : 'CHOÁNG VÁNG! 💫';
      window.effectManager.addFloatingText(label, target.x, (target.y || 580) + (target.z || 0) - 150, 'stun');
      window.effectManager.createShockRing(target.x, target.y || 580, '#f59e0b');
    }
    if (window.audioManager && typeof window.audioManager.playHeavyHit === 'function') {
      window.audioManager.playHeavyHit();
    }
  }
}

// Global Combat Instance
const combatSystem = new CombatSystem();
window.combatSystem = combatSystem;
