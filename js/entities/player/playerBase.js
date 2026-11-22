/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/player/playerBase.js - Trang thai, di chuyen, the luc, guard va update.
 */

(function () {
if (!window.CharacterRegistry && typeof require === 'function') {
  try { require('../characters/bootstrap.js'); } catch (_) {}
}
class PlayerBase {
  constructor(x = 150, y = 580) {
    this.id = 'player_nghi';
    this.type = 'player';
    this.name = 'Ngô Nhất Nghị';

    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0; // vận tốc hướng LÊN (dương = bay lên)
    this.facing = 1;
    this.speed = 230;
    this.runSpeed = 380;
    this.jumpForce = 520;
    this.gravity = 1300;

    this.maxHp = 1000;
    this.hp = 1000;
    this.energy = 0;
    this.maxEnergy = 100;
    this.isDead = false;
    this.invincibleTimer = 0;

    this.state = 'idle';
    this.animTime = 0;
    this.stateTimer = 0;
    this.stateDuration = 0;

    // Combo: comboStep = số đòn đã nối trong chuỗi hiện tại
    this.comboStep = 0;
    this.comboWindowTimer = 0;
    this.hitTargets = new Set();

    this.grabbedTarget = null;
    this.scissorHitDone = false;
    this.perfectDodgeDone = false;

    // ==== Thông số nhân vật chơi được (xem CHARACTERS[id].combat trong roster.js) ====
    this.charId = 'nghi';
    this.characterId = 'nghi';
    this.title = 'SÁT THẦN VIỆT VÕ ĐẠO';
    this.styleType = 'player';
    this.dmgMul = 1;         // hệ số sát thương
    this.reachMul = 1;       // hệ số tầm đánh
    this.kbMul = 1;          // hệ số lực đẩy
    this.energyMul = 1;      // hệ số hồi năng lượng
    this.finisher = 'scissor';
    this.ultimateState = 'ultimate_flurry';
    this.ultimateType = 'flurry';
    this.comboMax = 3;       // số đòn tối đa trong một chuỗi
    this.superArmor = false;
    this.armorThreshold = 55;

    // ===== HỆ THỐNG 3 TẦNG GIÁP HÀO QUANG (3-TIER ARMOR AURAS) =====
    // 'red'   = Bá Thể Cương Kình (không choáng, không ngã, có thể bị phá vỡ sau N đòn/ngưỡng HP)
    // 'gold'  = Kim Cang Bất Khuất (không choáng, không ngã, giảm 35% DMG, BẤT KHẢ PHÁ)
    // 'white' = Bất Hoại Thân Pháp (BẤT TỬ HOÀN TOÀN 0 DMG, miễn nhiễm khống chế)
    this.auraArmor = null;
    this.auraArmorTimer = 0;
    this.auraArmorHp = 0;
    this.auraArmorMaxHp = 0;
    this.auraArmorHits = 0;
    this.damageReduction = 0;
    this.counterBonus = 1.85;  // hệ số sát thương Perfect Counter
    this.counterWindow = 1.8;  // thời gian cửa sổ phản đòn (giây)
    this.mechRiposte = false;  // đỡ đòn -> phản kích (Đình An / Giang Mạnh)

    this._finisherState = null; // trạng thái finisher đang tung
    this._ultFlags = 0;
    this._ultData = {};

    // Nhịp ra đòn (chống spam): spamStack càng cao thì đòn càng nhạt lực
    this.attackClock = 0;        // đồng hồ thời gian chiến đấu (không bị reset theo state)
    this.spamStack = 0;          // số đòn đánh dồn dập liên tiếp
    this._attackMul = 1;         // hệ số lực đòn hiện tại
    this._lastHitAt = -99;       // thời điểm đòn cuối trúng đích
    this._rhythmApplied = false; // đã tính nhịp cho cú vung hiện tại chưa
    this._warnedAt = -99;        // lần cuối hiện cảnh báo "nhạt lực"
    this._ultStep = 0;
    this._ultHitDone = false;
    this._ultInit = false;
    this.maxStamina = 100;
    this.stamina = 100;          // thể lực: mỗi đòn đánh tiêu hao, đá tốn hơn đấm
    this.kickCooldown = 0;       // hồi chiêu giữa các đòn đá (chống spam K)
    this.maxKickCooldown = 0.28;
    this.kickHasHit = false;     // ghi nhận đòn đá bay đã trúng mục tiêu (để phân biệt tiếp đất chuẩn vs whiff)
    this.airPunchCooldown = 0;   // hồi chiêu giữa các đòn phi quyền Space + J (0.5s chống spam)
    this.airPunchHasHit = false; // ghi nhận phi quyền đã trúng đích
    this.lastAerialAttack = null; // lưu vết đòn không chiến gần nhất để đảm bảo landing recovery bắt buộc
    this._lastKickWarnAt = -99;
    this._lastAtkAt = -99;
    this._staminaShownAt = -99;

    // ===== HỒI CHIÊU & CƠ CHẾ KỸ NĂNG L VÀ COUNTER VÕ THUẬT VOVINAM =====
    this.dodgeCooldown = 0;           // hồi chiêu né L (8.0s chuẩn chống spam)
    this.maxDodgeCooldown = 8.0;
    this._lastDodgeWarnAt = -99;

    this.counterHandCooldown = 0;     // hồi chiêu Counter Tay U+J (2.5s)
    this.maxCounterHandCooldown = 2.5;

    this.counterLegCooldown = 0;      // hồi chiêu Counter Chân U+K (3.5s)
    this.maxCounterLegCooldown = 3.5;

    this.activeCounterWindow = 0;     // cửa sổ bắt đòn đang hoạt động (0.22s)
    this.activeCounterType = null;    // 'hand' | 'leg'
    this.counterSuccess = false;      // đã bắt đòn thành công
    this._lastCounterWarnAt = -99;

    // ===== HỆ THỐNG THẾ THỦ & ĐỘ BỀN KHIÊN (GUARD GAUGE / BLOCK LIMIT) =====
    this.maxGuardGauge = 100;
    this.guardGauge = 100;            // 100 điểm: mỗi đòn đỡ tốn 16 điểm (tối đa 5-7 đòn liên tiếp)
    this.guardBreakTimer = 0;         // thời gian choáng khi bể thủ (1.35s)
    this.maxGuardBreakDuration = 1.35;
    this.lastGuardHitTime = -99;      // thời điểm cuối bị đánh khi thủ
    this.guardRegenRate = 24;         // hồi 24 điểm/giây khi buông thủ
    this.guardRegenDelay = 0.9;       // trễ 0.9s sau đòn đánh cuối mới bắt đầu hồi
    this._lastGuardWarnAt = -99;

    // ===== HIỆU ỨNG TRẠNG THÁI TỪ VŨ KHÍ & ĐỒNG MINH =====
    this.stunTimer = 0;               // Choáng váng từ Côn (khóa điều khiển)
    this.bleedTimer = 0;              // Xuất huyết từ Mã tấu
    this.bleedTickTimer = 0;
    this.bleedDmg = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.burnDmg = 0;
    this.chillTimer = 0;
    this.slowTimer = 0;
    this.frozenTimer = 0;
    this.blindTimer = 0;
    this.armorBreakTimer = 0;
    this._frostStacks = 0;
    this.chillStacks = 0;
    this._freezeImmunityUntil = 0;
    this._pvpStunImmunityUntil = 0;
    this.speedMul = 1.0;
    this.shieldHp = 0;
    this.allyDmgBuff = 1.0;
    this.allyDmgReduction = 0;
    this.allyEnergyRate = 1.0;
    this.allyCounterBuff = 1.0;
    this.nextHitCrit = false;
    this.stanceSkillCooldown = 0;
    this._dodgeFollowupTimer = 0;
    this._prevComboBtn = null;
    this._prevHitMove = null;
    this._isCrossComboHit = false;
    this._lastDamagedEnemy = null;
    this.attackDurationMul = 1.0;
    this._baseAttackDurationMul = 1.0;

    this._baseSpeed = this.speed;
    this._baseRunSpeed = this.runSpeed;
    this._baseDmgMul = this.dmgMul;
    this._baseReachMul = this.reachMul;
    this._baseKbMul = this.kbMul;
    this._baseComboMax = this.comboMax;
    this._baseDamageReduction = this.damageReduction;
    this._baseCounterBonus = this.counterBonus;
    this.maxDodgeCooldown = 8.0;
    this._baseMaxDodgeCooldown = this.maxDodgeCooldown;
    this.noWhiffStun = false;
    this.incomingDamageMul = 1.0;
    this._summonedFiends = [];
    this._fiendSummonCd = 0;
  }

  // ==========================================================================
  // CHỌN NHÂN VẬT CHƠI ĐƯỢC (mỗi nhân vật một bộ chỉ số & phong cách riêng)
  // ==========================================================================
  setCharacter(charId) {
    this._summonedFiends = [];
    this._fiendSummonCd = 0;
    this.incomingDamageMul = 1.0;
    this.passive_nghiepHoaKiemXu = false;
    this.passive_trieuHoiAmBinh = false;
    this.passive_taThuatPhanPhe = false;
    const list = window.CHARACTERS || (window.CharacterRegistry ? window.CharacterRegistry.buildCharactersMap() : {});
    const c = list[charId] && list[charId].playable ? list[charId] : list.nghi;
    const combat = (c && c.combat) || (list.nghi && list.nghi.combat) || {};

    this.charId = (c && c.id) || 'nghi';
    this.characterId = this.charId;
    this.id = 'player_' + this.charId;
    this.name = (c && c.name) || 'Ngô Nhất Nghị';
    this.title = (c && c.title) || 'SÁT THẦN VIỆT VÕ ĐẠO';
    this.styleType = (c && c.styleType) || 'player';

    // Trang phục (Võ Phục Vovinam / Skin đặc biệt): chỉ thay đổi ngoại hình & hiệu ứng, giữ nguyên chỉ số gốc của nhân vật
    let equippedSkin = (window.saveManager && typeof window.saveManager.getEquippedSkin === 'function')
      ? window.saveManager.getEquippedSkin(this.charId)
      : ((this.charId !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(this.charId, 'vovinam')) ? 'vovinam' : 'default');
    if (this.charId === 'nghi' && equippedSkin === 'vovinam') equippedSkin = 'default';
    this.equippedSkin = equippedSkin;
    this.isVovinamSkin = (this.charId === 'nghi' ? equippedSkin === 'default' : equippedSkin === 'vovinam');

    this.maxHp = combat.hp || 1000;
    this.hp = this.maxHp;
    this.speed = combat.speed || 230;
    this.runSpeed = combat.runSpeed || 380;
    this.jumpForce = combat.jumpForce || 520;

    this.dmgMul = combat.damage || 1;
    this.reachMul = combat.reach || 1;
    this.kbMul = combat.knockback || 1;
    this.energyMul = combat.energyGain || 1;
    this.finisher = combat.finisher || 'scissor';
    this.ultimateState = combat.ultimateState || 'ultimate_flurry';
    this.ultimateType = combat.ultimateType || 'flurry';
    this.comboMax = combat.comboMax || 3;
    this.superArmor = !!combat.superArmor;
    this.armorThreshold = combat.armorThreshold || 55;
    this.damageReduction = combat.damageReduction || 0;
    this.counterBonus = combat.counterBonus || 1.85;
    this.counterWindow = combat.counterWindow || 1.8;
    this.mechRiposte = (this.finisher === 'bash' || this.finisher === 'counter');
    this.attackDurationMul = combat.attackDurationMul || 1.0;
    this.maxKickCooldown = combat.maxKickCooldown || 0.28;
    this.noWhiffStun = !!combat.noWhiffStun;

    // Lưu mốc chỉ số cơ bản để applySelectedPassives() không bao giờ nhân chồng chỉ số khi gọi lặp
    this._baseSpeed = this.speed;
    this._baseRunSpeed = this.runSpeed;
    this._baseDmgMul = this.dmgMul;
    this._baseReachMul = this.reachMul;
    this._baseKbMul = this.kbMul;
    this._baseComboMax = this.comboMax;
    this._baseDamageReduction = this.damageReduction;
    this._baseCounterBonus = this.counterBonus;
    this._baseAttackDurationMul = this.attackDurationMul;
    this.maxDodgeCooldown = 8.0;
    this._baseMaxDodgeCooldown = this.maxDodgeCooldown;
    this._lastDamagedEnemy = null;

    this.maxEnergy = 100;
    this.energy = 0;
    this.isDead = false;
    this.invincibleTimer = 0;
    this.state = 'idle';
    this.stateTimer = 0;
    this.stateDuration = 0;
    this._finisherState = null;
    this._pose = null;
    this._trail = [];
    if (Array.isArray(this._summonedFiends)) {
      for (const f of this._summonedFiends) {
        if (f) f.life = 0;
      }
    }
    this._summonedFiends = [];
    this._activeNguTinhUltFx = null;
    this._fiendSummonCd = 0;

    this.applySelectedPassives();

    if (window.uiManager) {
      window.uiManager.setCharacterHUD(this);
    }
    return this;
  }

  // ==========================================================================
  // KÍCH HOẠT TOÀN DIỆN 4 NỘI TẠI VÕ THUẬT THEO TỪNG MODULE NHÂN VẬT
  // ==========================================================================
  applySelectedPassives() {
    if (window.CharacterRegistry) {
      window.CharacterRegistry.applyPassives(this);
    }
  }

  reset(x = 150, y = 580) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.facing = 1;
    this.hp = this.maxHp;
    this.maxEnergy = 100;
    this.energy = 0;
    this.isDead = false;
    this.invincibleTimer = 0;
    this.state = 'idle';
    this.animTime = 0;
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.comboStep = 0;
    this.comboWindowTimer = 0;
    this.hitTargets.clear();
    this.grabbedTarget = null;
    this.scissorHitDone = false;
    this.clearAuraArmor();
    this._pose = null;
    this._trail = [];
    if (Array.isArray(this._summonedFiends)) {
      for (const f of this._summonedFiends) {
        if (f) f.life = 0;
      }
    }
    this._summonedFiends = [];
    this._activeNguTinhUltFx = null;
    this._fiendSummonCd = 0;
    // Nhịp ra đòn (chống spam): đánh dồn dập thì lực nhạt dần
    this.attackClock = 0;
    this.spamStack = 0;
    this._attackMul = 1;
    this._lastHitAt = -99;
    this._rhythmApplied = false;
    this.stamina = this.maxStamina;
    this.exhaustTimer = 0;
    this.kickCooldown = 0;
    this.kickHasHit = false;
    this.airPunchCooldown = 0;
    this.airPunchHasHit = false;
    this.lastAerialAttack = null;
    this.dodgeCooldown = 0;
    this.counterHandCooldown = 0;
    this.counterLegCooldown = 0;
    this.activeCounterWindow = 0;
    this.activeCounterType = null;
    this.counterSuccess = false;
    this.guardGauge = this.maxGuardGauge;
    this.lastGuardHitTime = -99;
    this.clearAllDebuffs();
    this._xichHuyetArmorTriggered = false;
    this._thienKhanhHitSeq = 0;
    this._fiendSummonFlashTimer = 0;
    this._hapTinhHealCd = 0;
    this._hacLongShieldUsed = false;
    this._energyRegenTimer = 0;
    this._pvpRageRegenAcc = 0;
    this.shieldHp = 0;
    this.allyDmgBuff = 1.0;
    this.allyDmgReduction = 0;
    this.allyEnergyRate = 1.0;
    this.allyCounterBuff = 1.0;
    this.nextHitCrit = false;
    this.stanceSkillCooldown = 0;
    this._dodgeFollowupTimer = 0;
    this._prevComboBtn = null;
    this._prevHitMove = null;
    this._isCrossComboHit = false;
    this._lastDamagedEnemy = null;
    this.attackDurationMul = 1.0;
    this._baseAttackDurationMul = 1.0;
    this.superArmorTimer = 0;
    this.superArmor = !!this._baseSuperArmor;
  }

  // Xóa sạch mọi hiệu ứng xấu & cờ trạng thái giữa các trận/hiệp
  clearAllDebuffs() {
    this.stunTimer = 0;
    this.bleedTimer = 0;
    this.bleedTickTimer = 0;
    this.bleedDmg = 0;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.burnDmg = 0;
    this.chillTimer = 0;
    this.slowTimer = 0;
    this.frozenTimer = 0;
    this.blindTimer = 0;
    this.armorBreakTimer = 0;
    this.guardBreakTimer = 0;
    this.exhaustTimer = 0;
    this.speedMul = 1.0;
    this.hitJitterTimer = 0;
    if (window.uiManager) {
      window.uiManager._lastHudDebuffsSig = null;
    }
  }

  // Tiêu hao thanh giữ thủ (Guard Gauge). Trả về true nếu bể thủ (Guard Break)

  consumeGuard(amount) {
    this.guardGauge = Math.max(0, this.guardGauge - amount);
    this.lastGuardHitTime = this.attackClock;
    if (this.guardGauge <= 0) {
      this.triggerGuardBreak();
      return true;
    }
    return false;
  }

  // Kích hoạt trạng thái Bể Thủ (Guard Break)
  triggerGuardBreak() {
    this.guardGauge = 0;
    this.guardBreakTimer = this.maxGuardBreakDuration;
    this.invincibleTimer = 0; // Không có i-frame để đối phương trừng phạt sơ hở
    this.vx = -this.facing * 100;
    this.setState('guard_break', this.maxGuardBreakDuration);
    if (window.audioManager) {
      window.audioManager.playHeavyHit();
      if (typeof window.audioManager.playGong === 'function') window.audioManager.playGong(0.7);
    }
    if (window.effectManager) {
      window.effectManager.triggerScreenShake(14, 0.35);
      window.effectManager.triggerFlash('#ef4444', 0.45);
      window.effectManager.createShockRing(this.x, this.y, '#ef4444');
      window.effectManager.createHitSparks(this.x, this.y - 85, 24, true);
      window.effectManager.addFloatingText('BỂ THỦ! (GUARD BREAK)', this.x, this.y - 170, 'counter');
    }
    if (window.uiManager && typeof window.uiManager.showAlertBanner === 'function') {
      window.uiManager.showAlertBanner('BỂ THỦ! VỠ THẾ PHÒNG NGỰ!');
    }
  }

  addEnergy(amount) {
    const safeAmt = (typeof amount === 'number' && Number.isFinite(amount)) ? amount : 0;
    const rate = (typeof this.allyEnergyRate === 'number' && Number.isFinite(this.allyEnergyRate) && this.allyEnergyRate > 0) ? this.allyEnergyRate : 1;
    const cur = (typeof this.energy === 'number' && Number.isFinite(this.energy)) ? this.energy : 0;
    const max = (typeof this.maxEnergy === 'number' && Number.isFinite(this.maxEnergy) && this.maxEnergy >= 0) ? this.maxEnergy : 100;
    this.maxEnergy = max;
    this.energy = Math.max(0, Math.min(max, cur + safeAmt * rate));
    if (window.uiManager) window.uiManager.updatePlayerEnergy(this.energy, this.maxEnergy);
  }

  consumeEnergy(amount) {
    const safeAmt = (typeof amount === 'number' && Number.isFinite(amount)) ? amount : 0;
    const cur = (typeof this.energy === 'number' && Number.isFinite(this.energy)) ? this.energy : 0;
    const max = (typeof this.maxEnergy === 'number' && Number.isFinite(this.maxEnergy) && this.maxEnergy >= 0) ? this.maxEnergy : 100;
    this.maxEnergy = max;
    this.energy = Math.max(0, cur - safeAmt);
    if (window.uiManager) window.uiManager.updatePlayerEnergy(this.energy, this.maxEnergy);
  }


  die(knockbackX = 0) {
    if (this.isDead) return;
    if (window.trainingManager && window.trainingManager.isActive) {
      this.hp = this.maxHp;
      this.isDead = false;
      this.setState('idle', 0.2);
      if (window.uiManager) window.uiManager.updatePlayerHp(this.hp, this.maxHp);
      return;
    }
    this.isDead = true;
    this.vx = knockbackX * 1.5;
    this.vz = 200;
    this.setState('knockdown', 1.2);
    if (window.audioManager) window.audioManager.playDefeat();
    if (window.game) {
      if (typeof window.game.scheduleGameOver === 'function') window.game.scheduleGameOver(900);
      else setTimeout(() => window.game.triggerGameOver(), 900);
    }
  }

  setState(newState, duration = 0) {
    // Trạng thái di chuyển lặp lại mỗi frame không được reset hoạt ảnh
    if (this.state === newState && duration === 0) return;
    this.state = newState;
    this.stateTimer = 0;
    this.stateDuration = duration;
    this.animTime = 0;
    this._prevSkillP = -0.01;
    this._moveVariant = null;
    this.hitTargets.clear();
    this._hitStopThisAttack = false;
    this._rhythmApplied = false; // mỗi cú vung chỉ tính nhịp 1 lần
    if (newState === 'dodge') {
      this.perfectDodgeDone = false;
      this._dodgeFollowupTimer = 0.45;
    }
  }

  // ==========================================================================
  // UPDATE MỖI FRAME
  update(dt, enemies = []) {
    this.animTime += dt;
    this.attackClock += dt;
    this.stateTimer += dt;

    if (this.invincibleTimer > 0) this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
    if (this.exhaustTimer > 0) this.exhaustTimer = Math.max(0, this.exhaustTimer - dt);
    if (this.kickCooldown > 0) this.kickCooldown = Math.max(0, this.kickCooldown - dt);
    if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this.stanceSkillCooldown > 0) this.stanceSkillCooldown = Math.max(0, this.stanceSkillCooldown - dt);
    if (this._dodgeFollowupTimer > 0) this._dodgeFollowupTimer = Math.max(0, this._dodgeFollowupTimer - dt);
    if (this.counterHandCooldown > 0) this.counterHandCooldown = Math.max(0, this.counterHandCooldown - dt);
    if (this.counterLegCooldown > 0) this.counterLegCooldown = Math.max(0, this.counterLegCooldown - dt);
    if (this.activeCounterWindow > 0) this.activeCounterWindow = Math.max(0, this.activeCounterWindow - dt);

    // Cập nhật Hào Quang Giáp (3-Tier Armor Auras)
    if (this.auraArmorTimer > 0) {
      this.auraArmorTimer = Math.max(0, this.auraArmorTimer - dt);
      if (this.auraArmorTimer <= 0) {
        this.clearAuraArmor();
      }
    }

    // Cập nhật đếm lùi Siêu Giáp (Super Armor) tạm thời từ Counter (Nghi)
    if (this.superArmorTimer > 0) {
      this.superArmorTimer = Math.max(0, this.superArmorTimer - dt);
      if (this.superArmorTimer <= 0) {
        this.superArmor = !!this._baseSuperArmor;
      }
    }

    // Cập nhật nội tại định kỳ của nhân vật đang chơi (Mạng Lưới Chi Viện, Nham Thạch Hồi Phục...)
    if (window.CharacterRegistry && !this.isDead) {
      window.CharacterRegistry.updatePassives(this, dt, enemies);
    }

    // Hồi Nộ (Khí Phách Chiến Đấu) trong PvP 1v1 để bảo đảm người chơi kịp tích đủ Tuyệt Kỹ mỗi hiệp
    if (!this.isDead && !this.isRemotePlayer && window.onlineManager && window.onlineManager.isActive &&
        window.onlineManager.mode === 'pvp' && !window.onlineManager._roundOver && (window.onlineManager._introLockTimer || 0) <= 0) {
      this._pvpRageRegenAcc = (this._pvpRageRegenAcc || 0) + 2.0 * dt;
      if (this._pvpRageRegenAcc >= 0.5) {
        const chunk = Math.floor(this._pvpRageRegenAcc * 2) / 2;
        this._pvpRageRegenAcc -= chunk;
        this.addEnergy(chunk);
      }
    }

    // Hồi thể lực khi ngừng ra đòn đủ 0.5s (nếu đang kiệt sức thì hồi chậm hơn)
    if (this.stamina < this.maxStamina && this.attackClock - this._lastAtkAt > 0.5) {
      this.stamina = Math.min(this.maxStamina, this.stamina + (this.exhaustTimer > 0 ? 18 : 38) * dt);
    }
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= dt;
      if (this.comboWindowTimer <= 0) this.comboStep = 0;
    }

    // ===== HỆ THỐNG THẾ THỦ & HỒI PHỤC KHIÊN (GUARD GAUGE REGEN & BREAK RECOVERY) =====
    if (this.guardBreakTimer > 0) {
      this.guardBreakTimer = Math.max(0, this.guardBreakTimer - dt);
      if (this.guardBreakTimer <= 0) {
        this.guardBreakTimer = 0;
        this.guardGauge = Math.round(this.maxGuardGauge * 0.4); // Hồi phục 40% độ bền khiên sau khi hết choáng
        if (this.state === 'guard_break') {
          this.setState('idle');
        }
      }
    } else if (this.state !== 'guard' && this.state !== 'guard_break') {
      if (this.guardGauge < this.maxGuardGauge && (this.attackClock - this.lastGuardHitTime) > this.guardRegenDelay) {
        this.guardGauge = Math.min(this.maxGuardGauge, this.guardGauge + this.guardRegenRate * dt);
      }
    }

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
        if (window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp') {
          this.invincibleTimer = Math.max(this.invincibleTimer || 0, 0.25);
        }
      }
    }

    // Hiệu ứng Xuất Huyết (Bleed DoT từ Mã Tấu)
    if (this.bleedTimer > 0 && !this.isDead) {
      this.bleedTimer -= dt;
      this.bleedTickTimer = (this.bleedTickTimer || 0) - dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.8;
        const tickDmg = this.bleedDmg || 2;
        this.hp = Math.max(0, this.hp - tickDmg);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🩸`, this.x, (this.y || 580) + (this.z || 0) - 120, 'bleed');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 65, 4, false);
        }
        if (window.uiManager) {
          window.uiManager.updatePlayerHp(this.hp, this.maxHp);
        }
        if (this.hp <= 0) {
          this.die(0);
          return;
        }
      }
    }

    // Hiệu ứng Thiêu Đốt (Burn DoT từ PvP Online / Kiếm Xu)
    if (this.burnTimer > 0 && !this.isDead) {
      this.burnTimer = Math.max(0, this.burnTimer - dt);
      this.burnTickTimer = (this.burnTickTimer || 0) - dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.7;
        const tickDmg = this.burnDmg || 6;
        this.hp = Math.max(0, this.hp - tickDmg);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🔥`, this.x, (this.y || 580) + (this.z || 0) - 132, 'crit');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 70, 5, true);
        }
        if (window.uiManager) {
          window.uiManager.updatePlayerHp(this.hp, this.maxHp);
        }
        if (this.hp <= 0) {
          this.die(0);
          return;
        }
      }
    }

    // Giảm dần các hiệu ứng bất lợi khác (Lạnh, Làm chậm, Đóng băng, Mù đòn, Phá giáp)
    if (this.frozenTimer > 0) this.frozenTimer = Math.max(0, this.frozenTimer - dt);
    if (this.blindTimer > 0) this.blindTimer = Math.max(0, this.blindTimer - dt);
    if (this.armorBreakTimer > 0) this.armorBreakTimer = Math.max(0, this.armorBreakTimer - dt);
    if (this.chillTimer > 0) this.chillTimer = Math.max(0, this.chillTimer - dt);
    if (this.slowTimer > 0) this.slowTimer = Math.max(0, this.slowTimer - dt);
    if ((this.slowTimer || 0) <= 0 && (this.chillTimer || 0) <= 0 && (this.frozenTimer || 0) <= 0) {
      this.speedMul = 1.0;
    }

    // Trọng lực (z âm = trên không)
    if (this.z < 0 || this.vz !== 0) {
      this.z -= this.vz * dt;
      this.vz -= this.gravity * dt;
      if (this.z >= 0) {
        this.z = 0;
        this.vz = 0;
        this.squashTimer = 0.16;
        this.squashType = 'land';
        if (this.state === 'flying_kick' || (this.state === 'jump_fall' && this.lastAerialAttack === 'flying_kick')) {
          // STATE MACHINE TIẾP ĐẤT CHO ĐÁ BAY SPACE + K (CHỐNG SPAM)
          // Đòn trúng đích: recovery chuẩn 0.55s; Ngô Nhất Nghị (noWhiffStun) tiếp đất nhẹ 0.08s không bị khựng khi hụt.
          const recDuration = this.noWhiffStun ? 0.08 : (this.kickHasHit ? 0.55 : 0.75);
          this.vx *= 0.35; // Giảm đà lao về phía trước khi tiếp đất
          this.setState('landing', recDuration);
          if (window.effectManager) {
            window.effectManager.createDust(this.x, this.y, 10, 45);
            if (!this.kickHasHit && !this.noWhiffStun) {
              window.effectManager.addFloatingText('HỤT ĐÒN — HỒI PHỤC!', this.x, this.y - 145, 'stale');
            }
          }
          this.lastAerialAttack = null;
        } else if (this.state === 'air_punch' || (this.state === 'jump_fall' && this.lastAerialAttack === 'air_punch')) {
          // STATE MACHINE TIẾP ĐẤT CHO PHI QUYỀN SPACE + J (CHỐNG SPAM)
          // Đòn trúng đích: recovery 0.24s nhanh nhẹn; Ngô Nhất Nghị (noWhiffStun) tiếp đất nhẹ 0.08s.
          const recDuration = this.noWhiffStun ? 0.08 : (this.airPunchHasHit ? 0.24 : 0.44);
          this.vx *= 0.30;
          this.setState('landing', recDuration);
          if (window.effectManager) {
            window.effectManager.createDust(this.x, this.y, 8, 35);
            if (!this.airPunchHasHit && !this.noWhiffStun) {
              window.effectManager.addFloatingText('HỤT ĐÒN — HỒI PHỤC!', this.x, this.y - 145, 'stale');
            }
          }
          this.lastAerialAttack = null;
        } else if (['jump_up', 'jump_fall'].includes(this.state)) {
          this.setState('idle');
          this.lastAerialAttack = null;
        }
        if (window.effectManager) window.effectManager.createDust(this.x, this.y, 8);
      }
    }

    // Ma sát mặt đất theo delta time
    if (this.z === 0) {
      const f = Math.exp(-12 * dt);
      this.vx *= f;
      this.vy *= f;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.y = Math.max(510, Math.min(640, this.y));

    // Đồng bộ hồi chiêu lên UI mỗi frame
    if (window.uiManager && window.uiManager.updateSkillCooldowns) {
      window.uiManager.updateSkillCooldowns(this);
    }
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);
    if (!this.isDead && this.hp > 0 && this.hp / this.maxHp <= 0.25) {
      this._lowHpBeatTimer = (this._lowHpBeatTimer || 0) - dt;
      if (this._lowHpBeatTimer <= 0) {
        this._lowHpBeatTimer = 0.85;
        if (window.audioManager && typeof window.audioManager.playLowHpPulse === 'function') {
          window.audioManager.playLowHpPulse();
        }
      }
    }

    this.updateStateLogic(dt, enemies);
  }

  updateStateLogic(dt, enemies) {
    if (this.isDead) {
      if (this.state !== 'knockdown') this.setState('knockdown', 1.2);
      return;
    }
    const st = this.state;
    const p = window.AnimUtil ? AnimUtil.progress(this) : 0;

    // Điều khiển VFX theo 5 giai đoạn dựa trên tiến trình p của từng nhân vật (không phụ thuộc setTimeout)
    if (window.CharacterRegistry && window.effectManager && st !== 'idle' && st !== 'walk' && st !== 'run' && st !== 'hurt' && st !== 'knockdown' && st !== 'getup') {
      const prevP = typeof this._prevSkillP === 'number' ? this._prevSkillP : -0.01;
      if (p >= prevP) {
        window.CharacterRegistry.emitSkillVFX(this, st, prevP, p, window.effectManager, enemies);
      }
      this._prevSkillP = p;
    }

    if (st === 'hurt') {
      if (this.stunTimer > 0) {
        this.vx = 0;
        this.vy = 0;
        return;
      }
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }
    if (st === 'knockdown') {
      if (this.stateTimer >= this.stateDuration && (this.z || 0) === 0) {
        this.setState('getup', 0.28);
        this.invincibleTimer = 0.65; // Miễn nhiễm sát thương toàn diện khi đang đứng dậy
      }
      return;
    }
    if (st === 'getup') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle');
        this.invincibleTimer = Math.max(this.invincibleTimer || 0, 0.45); // Tặng thêm 0.45s i-frame Wake-Up an toàn tuyệt đối
      }
      return;
    }
    if (st === 'guard_break') {
      if (this.guardBreakTimer <= 0 || this.stateTimer >= this.stateDuration) {
        this.guardBreakTimer = 0;
        this.guardGauge = Math.max(this.guardGauge, Math.round(this.maxGuardGauge * 0.4));
        this.setState('idle');
      }
      return;
    }

    // Hồi phục sau khi tiếp đất (Landing Recovery của Space + K / Space + J)
    if (st === 'landing') {
      // Đòn trúng đích (Hit-confirm) hoặc Ngô Nhất Nghị (noWhiffStun): tiếp đất vững chãi sau 0.08s là có thể hồi về idle ngay
      if ((this.kickHasHit || this.airPunchHasHit || this.noWhiffStun) && this.stateTimer >= 0.08) {
        this.kickHasHit = false;
        this.airPunchHasHit = false;
        this.setState('idle');
        return;
      }
      if (this.stateTimer >= this.stateDuration) {
        this.kickHasHit = false;
        this.airPunchHasHit = false;
        this.setState('idle');
      }
      return;
    }

    // Thủ thế Counter Vovinam U+J và U+K (Chờ đón đòn trong cửa sổ counter)
    if (st === 'counter_hand_prep' || st === 'counter_leg_prep') {
      if (this.activeCounterWindow <= 0 && !this.counterSuccess) {
        if (this.noWhiffStun) {
          this.setState('idle');
        } else {
          // Hết thời gian cửa sổ mà không bắt được đòn -> Chịu phạt Whiff Recovery!
          const isHand = (st === 'counter_hand_prep');
          this.setState(isHand ? 'counter_hand_recovery' : 'counter_leg_recovery', isHand ? 0.28 : 0.32);
          if (window.effectManager) {
            window.effectManager.addFloatingText('HỤT COUNTER!', this.x, this.y - 150, 'stale');
          }
        }
      }
      return;
    }

    // Hồi phục khi Counter hụt (Whiff Recovery — đối thủ có cửa sổ trừng phạt)
    if (st === 'counter_hand_recovery' || st === 'counter_leg_recovery') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }

    // Đòn phản công Vovinam khi Counter thành công (Active strike)
    if (st === 'counter_hand_strike' || st === 'counter_leg_strike') {
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }

    // Né tránh
    if (st === 'dodge') {
      this.invincibleTimer = Math.max(this.invincibleTimer, 0.1);
      if (window.effectManager && Math.random() < 0.45) {
        const prof = window.CharacterRegistry && window.CharacterRegistry.getTrailProfile
          ? window.CharacterRegistry.getTrailProfile(this)
          : null;
        window.effectManager.addGhostTrail(this, (prof && prof.dodgeGhost) || 'rgba(56, 189, 248, 0.45)');
      }
      if (!this.perfectDodgeDone) this.checkPerfectDodgeOpportunity(enemies);
      if (this.stateTimer >= 0.12 && this._dodgeFollowupTimer > 0 && window.input && (window.input.peek('KeyJ') || window.input.peek('KeyK'))) {
        this.setState('idle');
        this.handlePlayerInput(enemies);
        return;
      }
      if (this.stateTimer >= this.stateDuration) this.setState('idle');
      return;
    }

    // Đòn chân kẹp biểu diễn
    if (st === 'scissor_kick') {
      const target = this.grabbedTarget;
      if (target && !target.isDead) {
        target.x = this.x + this.facing * 28;
        target.y = this.y;
        target.z = Math.min(0, this.z + 10);
        target.vx = 0;
        if (p > 0.6 && !this.scissorHitDone) {
          this.scissorHitDone = true;
          if (window.audioManager) {
            window.audioManager.playScissorClamp();
            if (typeof window.audioManager.playVovinamKiai === 'function') {
              window.audioManager.playVovinamKiai('scissor', this.characterId || 'nghi');
            }
          }
          if (window.saveManager) {
            window.saveManager.unlockAchievement('scissor_master');
          }
          if (window.effectManager) {
            window.effectManager.triggerFinisherMoment(target.x, target.y - 35, 'ĐÒN CHÂN SỐ 7: KẸP CỔ', '#00f0ff', '#ffd700');
            window.effectManager.createGroundCrack(target.x, target.y, 90, '#ffd700');
            window.effectManager.createShockRing(target.x, target.y - 40, '#ffd700');
            window.effectManager.createDust(target.x, target.y, 18);
            window.effectManager.addFloatingText('🥋 ĐÒN CHÂN SỐ 7: KẸP CỔ QUẬT NGÃ!', target.x, target.y - 175, 'ultimate');
          }
          target.hitJitterTimer = 0.12;
          target.takeDamage(240, this.facing * 6, true);
          this.addEnergy(Math.round(8 * this.energyMul));
          if (window.combatSystem) window.combatSystem.registerHit(true, target, 240, true);
          if (window.game) window.game.hitStop = 0.085;
        }
      }
      if (this.stateTimer >= this.stateDuration) {
        this.grabbedTarget = null;
        this.scissorHitDone = false;
        this.setState('idle');
      }
      return;
    }

    // ==== TUYỆT KỸ (mỗi nhân vật một kiểu riêng — xem runUltimate) ====
    if (typeof st === 'string' && st.indexOf('ultimate_') === 0) {
      this.runUltimate(st, dt, enemies);
      return;
    }

    // ==== FINISHER riêng của nhân vật (Xô Bật / Nặng / Lao Tới / Húc / Phản Kích) ====
    if (this._finisherState && st === this._finisherState) {
      if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackCollision(enemies);
      if (this.stateTimer >= this.stateDuration) {
        this._finisherState = null;
        this.comboWindowTimer = 0.6;
        this.setState(this.z < 0 ? 'jump_fall' : 'idle');
      }
      return;
    }

    // ==== ĐÒN VŨ KHÍ NHẶT ĐƯỢC ====
    if (typeof st === 'string' && st.indexOf('wp_') === 0) {
      if (window.weaponSystem) {
        window.weaponSystem.updatePlayerAttack(this, dt, enemies);
      }
      return;
    }

    // Các đòn đấm / đá: nối combo mượt mà ngay sau khi đòn trước chạm đích
    if (['punch_straight', 'punch_hook', 'kick_push', 'kick_roundhouse', 'flying_kick', 'air_punch', 'hook_run', 'elbow_strike', 'kick_sweep', 'uppercut'].includes(st)) {
      if (window.AnimUtil && AnimUtil.isActive(this)) this.checkAttackCollision(enemies);

      // Đá bay: nếu chạm đất thì Z-physics đã đưa vào 'landing'; nếu hết thời gian trên không thì rơi tự do
      if (st === 'flying_kick') {
        if (this.z >= 0) {
          const recDuration = this.noWhiffStun ? 0.08 : (this.kickHasHit ? 0.55 : 0.75);
          this.setState('landing', recDuration);
          this.lastAerialAttack = null;
        } else if (this.stateTimer >= this.stateDuration) {
          this.setState('jump_fall');
        }
        return;
      }
      if (st === 'air_punch') {
        if (this.z >= 0) {
          const recDuration = this.noWhiffStun ? 0.08 : (this.airPunchHasHit ? 0.24 : 0.44);
          this.setState('landing', recDuration);
          this.lastAerialAttack = null;
        } else if (this.stateTimer >= this.stateDuration) {
          this.setState('jump_fall');
        }
        return;
      }

      // Đòn nặng (chỏ / quét trụ / móc lên): cam kết tới hết đòn, riêng nhân vật miễn khựng hụt chiêu được thoát sớm từ 75% trở đi
      if (st === 'elbow_strike' || st === 'kick_sweep' || st === 'uppercut') {
        const earlyHeavy = this.noWhiffStun && p > 0.75 && window.input && (window.input.peek('KeyL') || window.input.peek('Space') || window.input.block);
        if (earlyHeavy || this.stateTimer >= this.stateDuration) {
          this.comboWindowTimer = 0.6;
          this.setState('idle');
        }
        return;
      }

      // Đòn nhẹ: HIT-CONFIRM (Ngô Nhất Nghị miễn khựng khi hụt chiêu luôn được nối/ngắt mượt từ 52%)
      const hitConfirm = this.hitTargets.size > 0 || !!this.noWhiffStun;
      const cancelAt = hitConfirm ? 0.52 : 0.8;
      const canChain = p > cancelAt && (window.input.peek('KeyJ') || window.input.peek('KeyK'));
      const canEscape = p > (hitConfirm ? 0.6 : 0.86) && (window.input.block || window.input.peek('KeyL') || window.input.peek('Space'));
      if (canChain || canEscape || this.stateTimer >= this.stateDuration) {
        this.comboWindowTimer = 0.6;
        this.setState('idle');
        if (canChain) this.handlePlayerInput(enemies);
      }
      return;
    }

    this.handlePlayerInput(enemies);
  }

  startAttack(state, duration, lunge) {
    this._rhythmApplied = false;
    this.vx = this.facing * lunge;
    this.comboWindowTimer = 0.9;
    const durMul = this.attackDurationMul || 1.0;
    const scaledDuration = +(duration * durMul).toFixed(3);
    this.setState(state, scaledDuration);
    if (window.audioManager) window.audioManager.playWhoosh();
    this.spendStamina(state);
    if (window.allyManager) window.allyManager.checkCoopTrigger(this);
  }


  // ==========================================================================
  // THỂ LỰC: mỗi đòn tiêu hao thể lực — đá tốn hơn đấm, đòn thế tốn nhiều nhất
  // Hết thể lực -> KIỆT SỨC: không thể ra đòn trong 0.8s (thanh thể lực hiển thị trên đầu)
  // ==========================================================================
  spendStamina(state) {
    const COST = {
      punch_straight: 6, punch_hook: 8, air_punch: 10, elbow_strike: 12, hook_run: 14,
      kick_push: 13, kick_roundhouse: 16, boss_bash: 16, boss_riposte: 14, kick_sweep: 20, uppercut: 18, flying_kick: 15
    };
    const cost = COST[state] || 10;
    this._lastAtkAt = this.attackClock;
    this._staminaShownAt = this.attackClock;
    this.stamina -= cost;
    if (/kick|sweep/.test(state)) {
      this.kickCooldown = (state === 'flying_kick') ? 0.6 : this.maxKickCooldown;
    }
    if (this.stamina <= 0) {
      if (this.noWhiffStun) {
        this.stamina = 40;
        this.exhaustTimer = 0;
      } else {
        this.stamina = 28;
        this.exhaustTimer = 0.8;
        this.comboStep = 0;
        if (window.effectManager) {
          window.effectManager.addFloatingText('KIỆT SỨC!', this.x, this.y - 190, 'warn');
          window.effectManager.createDust(this.x, this.y, 8, 40);
        }
        if (window.audioManager) window.audioManager.playBlock();
      }
    }
  }

  // ==========================================================================
  // NHỊP RA ĐÒN (chống spam đánh thường)
  //  - Mỗi đòn TRÚNG ĐÍCH trong vòng 0.8s kể từ đòn trước -> lực nhạt dần (đá tính gấp đôi)
  //  - Nghỉ trên 0.8s (né / đỡ / di chuyển / chờ) -> hồi dần
  //  - Quá nhạt (<= 60%) -> đòn mất khả năng gây choáng & quật ngã
  // ==========================================================================
  applyHitRhythm() {
    if (this._rhythmApplied) return this._attackMul === undefined ? 1 : this._attackMul;
    this._rhythmApplied = true;

    const RHYTHM = [1, 1, 0.8, 0.6, 0.42, 0.3, 0.22];
    const gap = this.attackClock - this._lastHitAt;
    this._lastHitAt = this.attackClock;
    const isKick = /kick|sweep/.test(this.state || '');
    const add = isKick ? 2 : 1;
    this.spamStack = gap > 0.8 ? Math.max(0, (this.spamStack || 0) - 2) : Math.min(6, (this.spamStack || 0) + add);
    this._attackMul = RHYTHM[this.spamStack];

    if (this._attackMul <= 0.6 && this.attackClock - this._warnedAt > 2.6) {
      this._warnedAt = this.attackClock;
      if (window.effectManager) {
        window.effectManager.addFloatingText('ĐÒN NHẠT DẦN — NGHỈ LẤY LỰC!', this.x, this.y - 175, 'warn');
      }
    }
    return this._attackMul;
  }

  // ==========================================================================
  // TUYỆT KỸ CHUNG CHO TOÀN BỘ NHÂN VẬT CHƠI ĐƯỢC
  //  flurry / slam / rush / precision / command / feint / bash
  // ==========================================================================

  findClosestEnemy(enemies, range = 70) {
    let closest = null;
    let minDist = range;
    for (const enemy of enemies) {
      if (!enemy.isDead) {
        const dist = Math.hypot(enemy.x - this.x, (enemy.y - this.y) * 1.4);
        if (dist < minDist && (enemy.x - this.x) * this.facing > -20) {
          minDist = dist;
          closest = enemy;
        }
      }
    }
    return closest;
  }

  // ==========================================================================
  // HỆ THỐNG 3 TẦNG GIÁP HÀO QUANG (3-TIER ARMOR AURAS)
  // 'red'   = Bá Thể Cương Kình (Kháng choáng/ngã, nhận sát thương, có thể bị phá)
  // 'gold'  = Kim Cang Bất Khuất (Kháng choáng/ngã, giảm 35% DMG, BẤT KHẢ PHÁ)
  // 'white' = Bất Hoại Thân Pháp (BẤT TỬ HOÀN TOÀN 0 DMG, kháng mọi hiệu ứng)
  // ==========================================================================
  setAuraArmor(type, duration = 3.0, hp = 100, hits = 5) {
    this.auraArmor = type;
    this.auraArmorTimer = duration;
    this.auraArmorHp = hp;
    this.auraArmorMaxHp = hp;
    this.auraArmorHits = hits;
    if (window.effectManager) {
      const py = (this.y || 580) + (this.z || 0);
      if (type === 'red') {
        window.effectManager.addFloatingText('🔴 BÁ THỂ CƯƠNG KÌNH!', this.x, py - 170, 'ultimate');
        window.effectManager.createShockRing(this.x, this.y || 580, '#ef4444');
      } else if (type === 'gold') {
        window.effectManager.addFloatingText('🟡 KIM CANG BẤT KHUẤT!', this.x, py - 170, 'heal');
        window.effectManager.createShockRing(this.x, this.y || 580, '#ffd700');
      } else if (type === 'white') {
        window.effectManager.addFloatingText('⚪ BẤT HOẠI THÂN PHÁP (BẤT TỬ)!', this.x, py - 170, 'dodge');
        window.effectManager.createShockRing(this.x, this.y || 580, '#ffffff');
      }
    }
  }

  clearAuraArmor() {
    this.auraArmor = null;
    this.auraArmorTimer = 0;
    this.auraArmorHp = 0;
    this.auraArmorMaxHp = 0;
    this.auraArmorHits = 0;
  }

  hasAuraArmor(type) {
    if (type) return this.auraArmor === type && this.auraArmorTimer > 0;
    return !!this.auraArmor && this.auraArmorTimer > 0;
  }
}

window.PlayerBase = PlayerBase;
})();
