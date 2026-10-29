/**
 * VOVINAM: SÁT THẦN GIẢI CỨU HỨA VŨ ĐẠI
 * js/combat.js - Hitbox Collision, Combo System, Perfect Dodge & Damage Calculation
 */

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
      if (window.uiManager) {
        window.uiManager.updateCombo(this.comboCount, rank, this.comboTimer / this.maxComboTimer);
      }
    }
  }

  resetCombo() {
    this.comboCount = 0;
    this.comboTimer = 0;
    if (window.uiManager) {
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
  triggerPerfectDodge() {
    this.perfectDodgeCount++;
    this.isCounterWindow = true;
    // Thời gian phản đòn theo nhân vật đang chơi (Giang Mạnh có cửa sổ dài hơn)
    const p = window.game && window.game.player;
    this.counterTimer = (p && p.counterWindow) || 1.8;

    // Né thành công: cooldown 1.25s tính từ đúng thời điểm kích hoạt (không chờ animation)
    if (p) p.dodgeCooldown = Math.max(p.dodgeCooldown || 0, this.dodgeSuccessCooldown);

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
        window.effectManager.addFloatingText('NÉ HOÀN HẢO!', p.x, p.y - 175, 'dodge');
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
    if (Math.abs(attacker.y - defender.y) > 52) return false;

    // Tính toán vùng Hitbox của Attacker theo hướng quay mặt
    const facing = attacker.facing;
    const hitX = attacker.x + (attackData.offsetX || 40) * facing;
    const hitY = attacker.y + (attacker.z || 0) + (attackData.offsetY || -60);
    const hitWidth = attackData.width || 60;
    const hitHeight = attackData.height || 50;

    // Hurtbox của Defender (cao ~130px theo kích thước vẽ)
    const defHeight = defender.isBoss ? 150 : 130;
    const defWidth = 54;
    const defCenterX = defender.x;
    const defCenterY = defender.y + (defender.z || 0) - defHeight / 2;

    // AABB Collision Test
    const isColliding = (
      Math.abs(hitX - defCenterX) < (hitWidth / 2 + defWidth / 2) &&
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
      const isFacingAttacker = (attacker.x - defender.x) * defender.facing > 0;
      const isUncounterable = !!(attackData.uncounterable || attackData.isAoE || attackData.isUltimate);

      // Phải đứng quay mặt về phía đối thủ và trong cự ly chạm đòn (< 155px)
      if (isFacingAttacker && dist < 155) {
        if (isUncounterable) {
          // Đòn nặng/AoE/Nộ của boss: phá vỡ tư thế counter của người chơi!
          if (window.effectManager) {
            window.effectManager.addFloatingText('ĐÒN NẶNG — PHÁ COUNTER!', defender.x, defender.y - 170, 'warn');
            window.effectManager.triggerScreenShake(9, 0.25);
          }
          if (window.audioManager) window.audioManager.playWarning();
          defender.activeCounterWindow = 0;
          defender.counterSuccess = false;
          damage = Math.round(damage * 1.25);
        } else {
          // Phân loại đòn: Counter Tay bắt đòn tay, Counter Chân bắt đòn chân/húc
          const isLegAttack = !!(attackData.isKick || attackData.counterType === 'leg');
          const isHandAttack = !!(attackData.counterType === 'hand' || (!attackData.isKick && attackData.counterType !== 'leg'));
          const counterMatches = (defender.activeCounterType === 'hand' && isHandAttack) ||
                                 (defender.activeCounterType === 'leg' && isLegAttack);

          if (counterMatches) {
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
            if (window.game) window.game.hitStop = 0.085;
            attacker.hitJitterTimer = 0.12;
            if (window.effectManager) {
              window.effectManager.triggerFinisherMoment(
                attacker.x,
                attacker.y - 75,
                defender.activeCounterType === 'hand' ? 'PHẢN ĐÒN TAY VOVINAM' : 'PHẢN ĐÒN CHÂN VOVINAM',
                defender.activeCounterType === 'hand' ? '#38bdf8' : '#ffd700'
              );
            }

            defender.addEnergy(16);
            this.addFlow(defender.activeCounterType === 'leg' ? 24 : 18, true);

            if (defender.activeCounterType === 'hand') {
              // Phản đòn tay: Chỏ lật / Bắt tay bẻ khớp Vovinam
              defender.setState('counter_hand_strike', 0.36);
              const counterDmg = Math.round(75 * (defender.dmgMul || 1));
              attacker.pendingHit = { isHandCounter: true, weight: 'heavy' };
              attacker.takeDamage(counterDmg, defender.facing * 4, false);
              attacker.state = 'hurt';
              attacker.stateTimer = 0;
              attacker.stateDuration = 0.6; // Địch bị khựng lại
              if (attacker.isBoss) {
                attacker.weakWindow = 0.9; // Cửa sổ sơ hở 0.9s cho boss
              }
              if (window.audioManager) window.audioManager.playHeavyHit();
              if (window.effectManager) {
                window.effectManager.createHitSparks(attacker.x, attacker.y - 85, 18, true);
                window.effectManager.createShockRing(defender.x, defender.y, '#38bdf8');
                window.effectManager.addFloatingText('PHẢN ĐÒN TAY — VÕ THUẬT VOVINAM!', defender.x, defender.y - 175, 'counter');
                window.effectManager.addFloatingText(counterDmg, attacker.x, attacker.y - 130, 'crit');
              }
              if (window.uiManager) window.uiManager.showAlertBanner('VOVINAM HAND COUNTER!');
            } else {
              // Phản đòn chân: Gạt chân phá trụ / Quét ngã Vovinam
              defender.setState('counter_leg_strike', 0.44);
              const counterDmg = Math.round(88 * (defender.dmgMul || 1));
              attacker.pendingHit = { isLegCounter: true, weight: 'heavy' };
              if (attacker.isBoss) {
                // Boss bị choáng nặng, mở cửa sổ trừng phạt 1.2s
                attacker.takeDamage(counterDmg, defender.facing * 6, false);
                attacker.state = 'hurt';
                attacker.stateTimer = 0;
                attacker.stateDuration = 0.75;
                attacker.weakWindow = 1.2;
              } else {
                // Lính thường bị quét quật ngã xuống sàn
                attacker.combatKnockbackTimer = 0.7;
                attacker.isKnockedBack = true;
                attacker.takeDamage(counterDmg, defender.facing * 9, true);
              }
              if (window.audioManager) window.audioManager.playKick();
              if (window.effectManager) {
                window.effectManager.createGroundCrack(attacker.x, attacker.y, 80, '#ffd700');
                window.effectManager.createHitSparks(attacker.x, attacker.y - 50, 22, true);
                window.effectManager.createShockRing(defender.x, defender.y, '#ffd700');
                window.effectManager.addFloatingText('PHẢN ĐÒN CHÂN — QUÉT HẠ TRỌNG TÂM!', defender.x, defender.y - 175, 'counter');
                window.effectManager.addFloatingText(counterDmg, attacker.x, attacker.y - 130, 'crit');
              }
              if (window.uiManager) window.uiManager.showAlertBanner('VOVINAM LEG COUNTER!');
            }

            if (attacker.isBoss && window.uiManager && typeof window.uiManager.updateBossPoise === 'function') {
              window.uiManager.updateBossPoise(attacker.poise ?? 100, attacker.maxPoise ?? 100, attacker.weakWindow || 0);
            }
            this.registerHit(true, attacker, defender.activeCounterType === 'hand' ? 75 : 88, true);
            return; // Đòn tấn công của địch bị hóa giải hoàn toàn!
          } else {
            // Sai loại counter (dùng Counter Tay trước cú đá, hoặc Counter Chân trước cú đấm)!
            if (window.effectManager) {
              window.effectManager.addFloatingText('SAI THẾ COUNTER!', defender.x, defender.y - 165, 'stale');
            }
            defender.activeCounterWindow = 0;
          }
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
      const blocksLeft = Math.max(0, Math.ceil(defender.guardGauge / 16));
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) {
        window.effectManager.createHitSparks(attacker.x, attacker.y - 90, 16, true);
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
      // Hệ số phản đòn theo nhân vật (Giang Mạnh: 2.6)
      const bonus = (defender && typeof defender.counterBonus === 'number' && defender.type === 'player') ? defender.counterBonus : 1.85;
      damage = Math.round(damage * bonus);
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
        damage = Math.round(damage * 0.2); // Giảm 80% sát thương khi thủ
        const blocksLeft = defender.type === 'player' ? Math.max(0, Math.ceil((defender.guardGauge || 0) / 16)) : 0;
        const blockLabel = defender.type === 'player' ? ('ĐỠ ĐÒN [' + blocksLeft + '/6]') : 'BLOCKED';
        if (window.audioManager) window.audioManager.playBlock();
        if (window.effectManager) effectManager.addFloatingText(blockLabel, defender.x, defender.y - 100, 'block');
        // Thủ đúng lúc được tích năng lượng: phòng thủ chủ động có giá trị
        if (defender.type === 'player') {
          defender.addEnergy(2);
          if (window.tutorialManager && window.tutorialManager.isActive) {
            window.tutorialManager.recordAction('guard_held');
          }
          if (window.trainingManager && window.trainingManager.isActive) {
            window.trainingManager.recordAction('guard_held');
          }
        }
        defender.pendingHit = { weight: 'light', isCrit: false, blocked: true };
        defender.takeDamage(damage, 0, false);
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
        window.audioManager.playHeavyHit();
      } else if (attackData.isKick || weight === 'heavy') {
        window.audioManager.playKick();
      } else {
        window.audioManager.playPunch();
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
      window.effectManager.createHitSparks(sparkX, sparkY, sparkCount, isCrit || weight === 'ultimate');
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
      this.registerHit(true, defender, damage, isCrit);
      const energyGain = attackData.energyGain || 8;
      // Tuyệt kỹ tích chậm hơn (x0.4); đòn nhạt do spam gần như không tích được
      attacker.addEnergy(energyGain * 0.4 * (isCrit ? 1.5 : (noStagger ? 0.1 : 1.0)));
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

    const dur = duration || (isPlayerAttacking ? 1.4 : 0.8);
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
