/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/entities/characters/characterRegistry.js
 *
 * Trung tâm quản lý kiến trúc Nhân Vật Theo Module (1 Nhân Vật = 1 File Độc Lập).
 * Mỗi nhân vật tự đăng ký toàn bộ:
 *   1. Hồ sơ & cốt truyện (dossier -> window.CHARACTERS)
 *   2. Thẻ chọn tướng & 4 nội tại UI (uiSlot -> window.CHAR_SLOTS)
 *   3. Ngoại hình & trang phục (appearance -> window.STYLE_DEFS + Vovinam skin)
 *   4. Tư thế xương hoạt ảnh đặc trưng (animation.initPose & animation.poses)
 *   5. Chỉ số chiến đấu, bảng sát thương đòn đánh, đòn kết liễu, nội tại, tuyệt kỹ (combat, moveOverrides, finisher, passives, ultimateRuntime)
 *   6. Dữ liệu & kỹ năng Đồng Minh Chi Viện (ally -> window.ALLY_PROFILES + AI/Co-op hooks)
 */

(function () {
  const BASE_MOVES = {
    punch_straight:  { damage: 40,  offsetX: 52, offsetY: -80,  width: 60,  height: 45, knockback: 160, counterType: 'hand', energyGain: 8 },
    punch_hook:      { damage: 55,  offsetX: 52, offsetY: -85,  width: 66,  height: 50, knockback: 240, counterType: 'hand', energyGain: 12 },
    kick_push:       { damage: 65,  offsetX: 60, offsetY: -60,  width: 74,  height: 50, knockback: 380, isKick: true, counterType: 'leg', energyGain: 14 },
    kick_roundhouse: { damage: 85,  offsetX: 62, offsetY: -80,  width: 90,  height: 60, knockback: 480, knockdown: true, isKick: true, counterType: 'leg', energyGain: 18 },
    flying_kick:     { damage: 120, offsetX: 62, offsetY: -60,  width: 80,  height: 55, knockback: 580, knockdown: true, isKick: true, counterType: 'leg', energyGain: 22 },
    elbow_strike:    { damage: 76,  offsetX: 42, offsetY: -88,  width: 48,  height: 52, knockback: 280, unblockable: true, weight: 'heavy', counterType: 'hand', energyGain: 14 },
    uppercut:        { damage: 82,  offsetX: 48, offsetY: -102, width: 56,  height: 80, knockback: 260, knockdown: true, weight: 'heavy', counterType: 'hand', energyGain: 16 },
    kick_sweep:      { damage: 70,  offsetX: 66, offsetY: -22,  width: 104, height: 42, knockback: 340, knockdown: true, unblockable: true, isKick: true, weight: 'heavy', counterType: 'leg', energyGain: 16 },
    air_punch:       { damage: 65,  offsetX: 56, offsetY: -70,  width: 62,  height: 48, knockback: 300, knockdown: true, weight: 'medium', counterType: 'hand', energyGain: 12 },
    hook_run:        { damage: 68,  offsetX: 58, offsetY: -84,  width: 72,  height: 54, knockback: 430, knockdown: true, weight: 'heavy', counterType: 'hand', energyGain: 16 }
  };

  const BASE_FINISHERS = {
    shove: {
      state: 'kick_push', dur: 0.6, lunge: 250, shake: false,
      attack: { damage: 65, offsetX: 66, offsetY: -70, width: 108, height: 66, knockback: 620, weight: 'heavy', energyGain: 16, unblockable: true }
    },
    heavy: {
      state: 'kick_roundhouse', dur: 0.74, lunge: 170, shake: true,
      attack: { damage: 130, offsetX: 70, offsetY: -80, width: 106, height: 72, knockback: 300, knockdown: true, weight: 'ultimate', energyGain: 20, unblockable: true }
    },
    rush: {
      state: 'flying_kick', dur: 0.62, lunge: 540, shake: false,
      attack: { damage: 105, offsetX: 70, offsetY: -70, width: 100, height: 62, knockback: 340, weight: 'heavy', energyGain: 18 }
    },
    bash: {
      state: 'boss_bash', dur: 0.7, lunge: 470, shake: true,
      attack: { damage: 120, offsetX: 74, offsetY: -84, width: 118, height: 72, knockback: 470, knockdown: true, weight: 'ultimate', energyGain: 20, unblockable: true }
    },
    counter: {
      state: 'boss_riposte', dur: 0.55, lunge: 330, shake: false,
      attack: { damage: 125, offsetX: 64, offsetY: -84, width: 98, height: 62, knockback: 320, knockdown: true, weight: 'heavy', energyGain: 22 }
    }
  };

  const PASSIVE_FLAG_KEYS = [
    'passive_cuongNhu', 'passive_batKhuat', 'passive_phanChau',
    'passive_lucChien', 'passive_phiThan', 'passive_phanTrao',
    'passive_tramTinh', 'passive_hacLongShield', '_hacLongShieldUsed', 'passive_thietTruong', 'passive_mangLuoi',
    'passive_thietBich', 'passive_phungHoang', 'passive_khienKich', 'passive_trongChuy',
    'passive_thapVan', 'passive_cuocSat', 'passive_dapNat', 'passive_nhamThach',
    'passive_huyenAnh', 'passive_huyetDao', 'passive_huAnh', 'passive_amKhi',
    'passive_nhatKiem', 'passive_hanBang', 'passive_batBai', 'passive_bangThan',
    'passive_nhanNgocHuyet', 'passive_hachTamXichHuyet', '_xichHuyetArmorTriggered', 'passive_longBoChanThien', 'passive_baKhiTocTruong',
    'passive_hanNguyetSongTuyet', 'passive_bangTinhHoMenh', 'passive_nguyetAnhBoPhap', 'passive_tuyetSatDoanNghia',
    'passive_hoSoSaoKe', 'passive_laChanThanhKhoan', 'passive_tanAnhTheThan', 'passive_bayNguocTayHo', '_quantumShieldTimer', '_lastMaMove'
  ];

  class CharacterRegistrySystem {
    constructor() {
      this.modules = {};
      this.aliases = {};
      this.styleToChar = {};
      this.order = [];
      this.BASE_MOVES = BASE_MOVES;
      this.BASE_FINISHERS = BASE_FINISHERS;
    }

    register(def) {
      if (!def || !def.id) return;
      this.modules[def.id] = def;
      if (!this.order.includes(def.id)) {
        this.order.push(def.id);
      }
      const styleKey = (def.appearance && def.appearance.styleKey) || (def.dossier && def.dossier.styleType);
      if (styleKey) {
        this.styleToChar[styleKey] = def.id;
      }
      if (Array.isArray(def.aliases)) {
        for (const al of def.aliases) {
          this.aliases[al] = def.id;
        }
      }
      // Đồng bộ nóng vào các bảng global nếu đã khởi tạo
      if (window.STYLE_DEFS && styleKey && def.appearance && def.appearance.style) {
        window.STYLE_DEFS[styleKey] = Object.assign({}, def.appearance.style);
        if (window.skeletalRenderer && window.skeletalRenderer._styles) {
          window.skeletalRenderer._styles = {};
        }
      }
      if (window.CHARACTERS && def.dossier) {
        const entry = this.buildRosterEntry(def);
        window.CHARACTERS[def.id] = entry;
        if (Array.isArray(def.aliases)) {
          for (const al of def.aliases) window.CHARACTERS[al] = entry;
        }
      }
      if (window.ALLY_PROFILES && def.ally && def.ally.profile) {
        window.ALLY_PROFILES[def.id] = Object.assign({}, def.ally.profile);
      }
    }

    get(idOrAlias) {
      if (!idOrAlias) return null;
      const canonical = this.aliases[idOrAlias] || idOrAlias;
      return this.modules[canonical] || null;
    }

    getEquippedSkin(entity) {
      if (!entity) return 'default';
      const id = entity.charId || entity.characterId || entity.characterKey;
      if (id === 'nghi') return 'default';
      if (typeof entity.equippedSkin === 'string' && entity.equippedSkin) return entity.equippedSkin;
      if (entity.vovinamSkin === true || entity.isVovinamSkin === true) return 'vovinam';
      if (entity.namcheoSkin === true) return 'namcheo';
      if (id && window.saveManager && typeof window.saveManager.getEquippedSkin === 'function') {
        return window.saveManager.getEquippedSkin(id);
      }
      if (id && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function') {
        if (window.saveManager.isSkinEquipped(id, 'namcheo')) return 'namcheo';
        if (window.saveManager.isSkinEquipped(id, 'vovinam')) return 'vovinam';
      }
      return 'default';
    }

    isVovinamEquipped(entity) {
      if (!entity) return false;
      const id = entity.charId || entity.characterId || entity.characterKey;
      if (id === 'nghi') return true;
      return this.getEquippedSkin(entity) === 'vovinam';
    }

    resolveDefinitionForPlayer(player) {
      if (!player) return this.get('nghi');
      const id = player.charId || player.characterId || 'nghi';
      return this.get(id) || this.get('nghi');
    }

    resolveForEntity(entity) {
      if (!entity) return null;
      const directId = entity.charId || entity.characterId || entity.characterKey;
      if (directId && this.get(directId)) return this.get(directId);
      const stKey = entity.styleType || entity.type;
      if (stKey && this.styleToChar[stKey]) return this.get(this.styleToChar[stKey]);
      return null;
    }

    buildRosterEntry(def) {
      return Object.assign({}, def.dossier, {
        combat: def.combat ? Object.assign({}, def.combat) : null
      });
    }

    buildCharactersMap() {
      const out = {};
      for (const id of this.order) {
        const def = this.modules[id];
        if (!def || !def.dossier) continue;
        const entry = this.buildRosterEntry(def);
        out[id] = entry;
        if (Array.isArray(def.aliases)) {
          for (const al of def.aliases) out[al] = entry;
        }
      }
      return out;
    }

    buildStyleDefsMap() {
      const out = {};
      for (const id of this.order) {
        const def = this.modules[id];
        if (!def || !def.appearance || !def.appearance.styleKey || !def.appearance.style) continue;
        out[def.appearance.styleKey] = Object.assign({}, def.appearance.style);
      }
      return out;
    }

    buildCharSlotsList() {
      const slots = [];
      for (const id of this.order) {
        const def = this.modules[id];
        if (def && def.uiSlot) {
          slots.push(def);
        }
      }
      slots.sort((a, b) => (a.uiSlotOrder ?? 99) - (b.uiSlotOrder ?? 99));
      return slots.map((d) => Object.assign({}, d.uiSlot));
    }

    buildAllyProfilesMap() {
      const out = {};
      for (const id of this.order) {
        const def = this.modules[id];
        if (def && def.ally && def.ally.profile) {
          out[id] = Object.assign({}, def.ally.profile);
        }
      }
      return out;
    }

    getVovinamSkinOverrides(charId, baseStyle) {
      const def = this.get(charId);
      const defaults = {
        archetype: 'vovinam_master',
        gi: '#234a9c',
        giD: '#152e66',
        giL: '#3b82f6',
        pants: '#214594',
        pantsD: '#132a5e',
        belt: (baseStyle && baseStyle.belt === '#f8fafc') ? '#f8fafc' : '#151821',
        beltD: '#090b10',
        beltTrim: '#eab308',
        cuffTrim: '#9b2226',
        legStripe: '#d4a017',
        thighDragon: true,
        bareVChest: true,
        patch: true,
        nameTag: true,
        suit: false,
        coat: false,
        drapedOvercoat: false,
        cyberTrench: false,
        cape: false,
        robe: false,
        highCollar: false,
        armor: false,
        furMantle: false,
        wovenHat: false,
        wideSleeves: false,
        crimsonScarf: false,
        scarf: false,
        sleeveless: false,
        vest: false,
        tactical: false,
        ninja: false,
        ninjaHood: false,
        mask: false,
        helmet: false,
        shield: false,
        weapon: null,
        quantumGauntlets: false,
        heavyShoulders: false,
        shinGuards: false,
        cigar: false,
        cane: false,
        gloves: null,
        leatherBelt: false,
        stripedWraps: false,
        mountainWraps: false,
        shinobiArmor: false,
        cuffRedEmbroidery: false,
        bareBiceps: false,
        signetRings: false,
        stubbleJaw: false,
        shoes: 'kungfu',
        aura: (baseStyle && baseStyle.aura) || '#38bdf8'
      };
      // Skin Vovinam chỉ đổi võ phục mặc bên ngoài, giữ nguyên vũ khí chiến đấu riêng của từng tướng
      if (baseStyle) {
        if (baseStyle.weapon) defaults.weapon = baseStyle.weapon;
        if (baseStyle.weaponLen) defaults.weaponLen = baseStyle.weaponLen;
        if (baseStyle.shield) defaults.shield = true;
        if (baseStyle.frostBlade) defaults.frostBlade = true;
        if (baseStyle.cane) defaults.cane = true;
        if (baseStyle.quantumGauntlets) defaults.quantumGauntlets = true;
        if (baseStyle.cigar) defaults.cigar = true;
      }
      if (def && def.appearance && def.appearance.vovinamSkin) {
        return Object.assign(defaults, def.appearance.vovinamSkin);
      }
      return defaults;
    }

    getCustomSkinOverrides(charId, skinId, baseStyle) {
      if (!skinId || skinId === 'default') return null;
      if (skinId === 'vovinam') {
        return this.getVovinamSkinOverrides(charId, baseStyle);
      }
      const def = this.get(charId);
      const skinStyle = def && def.appearance && def.appearance.skins && def.appearance.skins[skinId];
      if (!skinStyle) return null;
      return Object.assign({}, baseStyle || {}, skinStyle);
    }

    // ------------------------------------------------------------------------
    // POSE XƯƠNG HOẠT ẢNH THEO TỪNG NHÂN VẬT
    // ------------------------------------------------------------------------
    initEntityPose(P, entity, ctx) {
      const def = this.resolveForEntity(entity);
      if (def && def.animation && typeof def.animation.initPose === 'function') {
        def.animation.initPose(P, ctx);
      }
    }

    applyEntityPose(P, entity, st, ctx) {
      const def = this.resolveForEntity(entity);
      const effectiveState = (entity && entity._moveVariant === 'wk' && st !== 'scissor_kick') ? 'wk' : st;
      if (def && def.animation && def.animation.poses && typeof def.animation.poses[effectiveState] === 'function') {
        const handled = def.animation.poses[effectiveState](P, ctx);
        if (handled !== false) return true;
      }
      if (effectiveState === 'wk' && def && def.animation && def.animation.poses && typeof def.animation.poses.kick_push === 'function') {
        const handled = def.animation.poses.kick_push(P, ctx);
        if (handled !== false) return true;
      }
      // Dự phòng cho các trạng thái đặc trưng (như ultimate_slam, ultimate_bash, boss_chain1..3)
      // khi thực thể trong bài test không truyền charId tường minh
      for (const id of this.order) {
        const other = this.modules[id];
        if (other === def || !other || !other.animation || !other.animation.signatureStates) continue;
        if (other.animation.signatureStates.includes(effectiveState) && other.animation.poses && typeof other.animation.poses[effectiveState] === 'function') {
          const handled = other.animation.poses[effectiveState](P, ctx);
          if (handled !== false) return true;
        }
      }
      return false;
    }

    // ------------------------------------------------------------------------
    // NỘI TẠI, ĐÒN ĐÁNH, FINISHER & TUYỆT KỸ CỦA PLAYER
    // ------------------------------------------------------------------------
    resetPassiveState(player) {
      for (const k of PASSIVE_FLAG_KEYS) {
        player[k] = false;
      }
      player.dodgeIframeMul = 1;
      player.incomingDamageMul = 1.0;
      if (typeof player.clearAuraArmor === 'function') player.clearAuraArmor();
      player.superArmor = false;
      player.superArmorTimer = 0;
      player._baseSuperArmor = false;
      player._xichHuyetArmorTriggered = false;
      player._thienKhanhHitSeq = 0;
      player._fiendSummonCd = 0;
      player._fiendSummonFlashTimer = 0;
      player._hapTinhHealCd = 0;

      // Phục hồi chỉ số gốc trước khi áp dụng nội tại (chống lỗi nhân chồng chỉ số khi gọi lại applySelectedPassives)
      if (typeof player._baseSpeed === 'number') player.speed = player._baseSpeed;
      if (typeof player._baseRunSpeed === 'number') player.runSpeed = player._baseRunSpeed;
      if (typeof player._baseDmgMul === 'number') player.dmgMul = player._baseDmgMul;
      if (typeof player._baseReachMul === 'number') player.reachMul = player._baseReachMul;
      if (typeof player._baseKbMul === 'number') player.kbMul = player._baseKbMul;
      if (typeof player._baseComboMax === 'number') player.comboMax = player._baseComboMax;
      if (typeof player._baseDamageReduction === 'number') player.damageReduction = player._baseDamageReduction;
      if (typeof player._baseCounterBonus === 'number') player.counterBonus = player._baseCounterBonus;
      player._quantumShieldTimer = 0;
      player._lastMaMove = null;
      player._prevHitMove = null;
      player._prevComboBtn = null;
      player._isCrossComboHit = false;
      player._dodgeFollowupTimer = 0;
      player.stanceSkillCooldown = 0;
    }

    applyPassives(player) {
      this.resetPassiveState(player);
      const def = this.resolveDefinitionForPlayer(player);
      if (def && def.passives && typeof def.passives.onApply === 'function') {
        def.passives.onApply(player);
      }
    }

    updatePassives(player, dt, enemies) {
      const def = this.resolveDefinitionForPlayer(player);
      if (def && def.passives && typeof def.passives.onUpdate === 'function') {
        def.passives.onUpdate(player, dt, enemies);
      }
    }

    onBeforeTakeDamage(player, dmgCtx) {
      const def = this.resolveDefinitionForPlayer(player);
      if (def && def.passives && typeof def.passives.onBeforeTakeDamage === 'function') {
        return def.passives.onBeforeTakeDamage(player, dmgCtx);
      }
      return null;
    }

    tryInputCancel(player, input) {
      const def = this.resolveDefinitionForPlayer(player);
      if (def && def.passives && typeof def.passives.onInputCancel === 'function') {
        return !!def.passives.onInputCancel(player, input);
      }
      return false;
    }

    onDodge(player, dodgeCtx) {
      const def = this.resolveDefinitionForPlayer(player);
      if (def && def.passives && typeof def.passives.onDodge === 'function') {
        def.passives.onDodge(player, dodgeCtx);
      }
    }

    onGuardReflect(defender, attacker, blockedDamage) {
      const def = this.resolveDefinitionForPlayer(defender);
      if (def && def.passives && typeof def.passives.onGuardReflect === 'function') {
        def.passives.onGuardReflect(defender, attacker, blockedDamage);
      }
    }

    onHandCounter(defender, attacker, combatSystem) {
      const def = this.resolveDefinitionForPlayer(defender);
      if (def && def.passives && typeof def.passives.onHandCounter === 'function') {
        def.passives.onHandCounter(defender, attacker, combatSystem);
      }
    }

    onLegCounter(defender, attacker, combatSystem) {
      const def = this.resolveDefinitionForPlayer(defender);
      if (def && def.passives) {
        if (typeof def.passives.onLegCounter === 'function') {
          def.passives.onLegCounter(defender, attacker, combatSystem);
        } else if (typeof def.passives.onHandCounter === 'function') {
          def.passives.onHandCounter(defender, attacker, combatSystem);
        }
      }
    }

    tryStanceSpecial(player, enemies) {
      if (!player || player.isDead || (player.stanceSkillCooldown || 0) > 0 || (player.exhaustTimer || 0) > 0) return false;
      const def = this.resolveDefinitionForPlayer(player);
      if (def && def.passives && typeof def.passives.onStanceSpecial === 'function') {
        const prevStamina = player.stamina || 0;
        const used = !!def.passives.onStanceSpecial(player, enemies);
        if (used) {
          if (!(player.stanceSkillCooldown > 0)) {
            player.stanceSkillCooldown = 6.0;
          }
          if ((player.stamina || 0) <= prevStamina) {
            player.stamina = Math.max(0, (player.stamina || 0) - 12);
          }
          return true;
        }
      }
      return false;
    }

    tryDodgeFollowup(player, button, enemies) {
      if (!player || player.isDead) return false;
      const def = this.resolveDefinitionForPlayer(player);
      if (def && def.passives && typeof def.passives.onDodgeFollowup === 'function') {
        return !!def.passives.onDodgeFollowup(player, button, enemies);
      }
      return false;
    }

    onAttackHit(attacker, defender, attackData, combatSystem) {
      if (!attacker) return;
      const effectiveMove = attacker._moveVariant === 'wk' ? 'wk' : (attacker.state || 'attack');
      const hitCtx = {
        effectiveMove,
        prevMove: attacker._prevHitMove || null,
        isCrossCombo: !!attacker._isCrossComboHit
      };
      const def = this.resolveDefinitionForPlayer(attacker);
      if (def && def.passives && typeof def.passives.onAttackHit === 'function') {
        def.passives.onAttackHit(attacker, defender, attackData, combatSystem, hitCtx);
      }
      attacker._prevHitMove = effectiveMove;
    }

    getMoveAttackData(player, state) {
      const base = BASE_MOVES[state];
      if (!base) return null;
      const def = this.resolveDefinitionForPlayer(player);
      const isWkVariant = (state === 'kick_push' && player && player._moveVariant === 'wk');
      const over = (def && def.moveOverrides && ((isWkVariant && def.moveOverrides.wk) || def.moveOverrides[state])) || null;
      const data = Object.assign({}, base, over || {});

      const allyBuff = (typeof player.allyDmgBuff === 'number' && player.allyDmgBuff > 0) ? player.allyDmgBuff : 1;
      data.damage = Math.round(data.damage * (player.dmgMul || 1) * allyBuff);
      data.width = Math.round(data.width * (player.reachMul || 1));
      data.offsetX = Math.round(data.offsetX * Math.max(1, player.reachMul || 1));
      data.knockback = Math.round(data.knockback * (player.kbMul || 1));
      data.energyGain = Math.round((data.energyGain || 8) * (player.energyMul || 1));
      return data;
    }

    getFinisherConfig(player) {
      const def = this.resolveDefinitionForPlayer(player);
      const base = BASE_FINISHERS[player.finisher] || BASE_FINISHERS.heavy;
      if (def && def.finisher && def.finisher.state) {
        return Object.assign({}, base, def.finisher);
      }
      return base;
    }

    getFinisherAttackData(player) {
      const def = this.resolveDefinitionForPlayer(player);
      const baseCfg = BASE_FINISHERS[player.finisher];
      if (!baseCfg && !(def && def.finisher && def.finisher.attack)) return null;
      const raw = Object.assign({}, baseCfg ? baseCfg.attack : {}, (def && def.finisher && def.finisher.attack) || {});
      const allyBuff = (typeof player.allyDmgBuff === 'number' && player.allyDmgBuff > 0) ? player.allyDmgBuff : 1;
      return Object.assign({}, raw, {
        damage: Math.round((raw.damage || 100) * (player.dmgMul || 1) * allyBuff),
        width: (raw.width || 100) * (player.reachMul || 1),
        knockback: (raw.knockback || 300) * (player.kbMul || 1)
      });
    }

    getUltimateCinematic(charId, player) {
      const targetId = (player && (player.charId || player.characterId)) || charId || 'nghi';
      const def = this.get(targetId) || this.get('nghi');
      const skinId = player ? this.getEquippedSkin(player) : ((window.saveManager && typeof window.saveManager.getEquippedSkin === 'function') ? window.saveManager.getEquippedSkin(targetId) : 'default');
      if (def && def.ultimateRuntime) {
        if (def.ultimateRuntime.skinCinematics && def.ultimateRuntime.skinCinematics[skinId]) {
          return def.ultimateRuntime.skinCinematics[skinId];
        }
        if (def.ultimateRuntime.cinematic) {
          return def.ultimateRuntime.cinematic;
        }
      }
      return {
        title: 'NGÔ NHẤT NGHỊ',
        ult: 'LONG HỔ XUẤT SƠN',
        color: '#00f0ff',
        accent: '#ffd700',
        style: 'lightning',
        duration: 1.4
      };
    }

    runUltimate(player, st, dt, enemies, helpers) {
      let def = this.resolveDefinitionForPlayer(player);
      if (!def || !def.ultimateRuntime || (def.combat && def.combat.ultimateState !== st && def.ultimateRuntime.type !== player.ultimateType)) {
        for (const id of this.order) {
          const cand = this.modules[id];
          if (cand && cand.combat && (cand.combat.ultimateState === st || cand.combat.ultimateType === player.ultimateType)) {
            def = cand;
            break;
          }
        }
      }
      if (def && def.ultimateRuntime && typeof def.ultimateRuntime.execute === 'function') {
        def.ultimateRuntime.execute(player, st, dt, enemies, helpers);
        return true;
      }
      return false;
    }

    // ------------------------------------------------------------------------
    // HỆ THỐNG ĐỒNG MINH CHI VIỆN (ALLY HOOKS)
    // ------------------------------------------------------------------------
    onAllySpawn(ally) {
      const def = this.get(ally.charId);
      if (def && def.ally && typeof def.ally.onSpawn === 'function') {
        def.ally.onSpawn(ally);
      }
    }

    modifyAllyDamageTaken(ally, amount) {
      const def = this.get(ally.charId);
      if (def && def.ally && typeof def.ally.modifyDamageTaken === 'function') {
        return def.ally.modifyDamageTaken(ally, amount);
      }
      return amount;
    }

    updateAllySkill(ally, dt, player, enemies) {
      const def = this.get(ally.charId);
      if (def && def.ally && typeof def.ally.onUpdate === 'function') {
        def.ally.onUpdate(ally, dt, player, enemies);
      }
    }

    performAllyAttack(ally, target, dmg, isBossTarget) {
      const def = this.get(ally.charId) || this.get('bichlam');
      if (def && def.ally && typeof def.ally.onBasicAttack === 'function') {
        def.ally.onBasicAttack(ally, target, dmg, isBossTarget);
        return true;
      }
      return false;
    }

    getAllyCoopBaseDamage(ally, player, target) {
      const def = this.get(ally.charId);
      if (def && def.ally) {
        if (typeof def.ally.onCoop === 'function') {
          def.ally.onCoop(ally, player, target);
        }
        if (typeof def.ally.coopBaseDamage === 'number') {
          return def.ally.coopBaseDamage;
        }
      }
      return 240;
    }

    // ------------------------------------------------------------------------
    // HỆ THỐNG CHOREOGRAPHY & VFX KỸ NĂNG RIÊNG CHO 9 NHÂN VẬT
    // ------------------------------------------------------------------------
    getTrailProfile(entity, st) {
      const def = this.resolveForEntity(entity);
      const id = def ? def.id : 'nghi';
      const skinId = this.getEquippedSkin(entity);
      if (def && def.animation && def.animation.skinTrailProfiles && def.animation.skinTrailProfiles[skinId]) {
        return def.animation.skinTrailProfiles[skinId];
      }
      if (def && def.animation && def.animation.trailProfile) {
        return def.animation.trailProfile;
      }
      const fallback = (st && st.aura) || '#00f0ff';
      return { id, primary: fallback, core: '#ffffff', width: 11, dual: false, style: 'martial' };
    }

    getSparkColors(entity) {
      const tp = this.getTrailProfile(entity, null);
      if (tp && tp.primary) {
        return { base: tp.primary, alt: tp.secondary || tp.core || '#ffffff' };
      }
      return null;
    }

    emitSkillVFX(entity, st, prevP, p, fx, enemies) {
      if (!entity || !fx || !st) return;
      if (entity._disableVfx || window._disableSkillVfx) return;
      const effectiveSt = (entity._moveVariant === 'wk' && st !== 'scissor_kick') ? 'wk' : st;
      const def = this.resolveForEntity(entity);
      if (def && def.animation && typeof def.animation.emitSkillVFX === 'function') {
        def.animation.emitSkillVFX(entity, effectiveSt, prevP, p, fx, enemies);
        return;
      }
      // Dự phòng nhẹ nếu nhân vật chưa đăng ký hook riêng
      const cross = (t) => prevP < t && p >= t;
      if (cross(0.38) && window.ATTACK_STATES && window.ATTACK_STATES.has(effectiveSt)) {
        const dir = entity.facing || 1;
        fx.createShockRing(entity.x + dir * 24, (entity.y || 580) + (entity.z || 0) - 60, '#38bdf8');
      }
    }

    getSkillCatalog(charId) {
      const def = this.get(charId) || this.get('nghi');
      const id = def ? def.id : 'nghi';
      const combat = (def && def.combat) || {};
      const fin = (def && def.finisher) || BASE_FINISHERS[combat.finisher || 'heavy'] || BASE_FINISHERS.heavy;
      const ultState = combat.ultimateState || 'ultimate_flurry';
      const ultInfo = (def && def.dossier && def.dossier.ultimate) || {};
      const ultCin = (def && def.ultimateRuntime && def.ultimateRuntime.cinematic) || { ult: ultInfo.name || 'TUYỆT KỸ', duration: 1.4 };

      const customCatalog = (def && def.animation && Array.isArray(def.animation.skillCatalog))
        ? def.animation.skillCatalog
        : null;
      if (customCatalog) return customCatalog;

      return [
        { id: 'punch_straight', input: 'J', name: 'Liên Kích Nhẹ 1', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Liên Kích Nhẹ 2', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Đá Nặng 1', dur: 0.52, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Đá Nặng 2', dur: 0.60, category: 'combo' },
        { id: 'uppercut', input: 'W + J', name: 'Chiêu Lên', dur: 0.52, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Chiêu Cận Chiến', dur: 0.46, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Quét Hạ Bộ', dur: 0.66, category: 'special' },
        { id: 'hook_run', input: 'Shift + J', name: 'Đột Kích Chạy', dur: 0.48, category: 'special' },
        { id: 'air_punch', input: 'Space + J', name: 'Phi Quyền Không Trung', dur: 0.38, category: 'aerial' },
        { id: 'flying_kick', input: 'Space + K', name: 'Phi Cước Không Trung', dur: 0.55, category: 'aerial' },
        { id: 'dodge', input: 'L', name: 'Né Đòn Đặc Trưng', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Đòn Tay', dur: 0.42, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Đòn Chân', dur: 0.48, category: 'counter' },
        { id: fin.state || 'boss_bash', input: 'Finisher', name: fin.name || 'Kết Liễu Đặc Trưng', dur: fin.dur || 0.68, category: 'finisher' },
        { id: ultState, input: 'I', name: ultCin.ult || ultInfo.name || 'Tuyệt Kỹ Tối Thượng', dur: ultCin.duration || 1.4, category: 'ultimate' }
      ];
    }

    /**
     * Tra cứu tên chiêu thức thực tế của nhân vật đang điều khiển (tự động kế thừa Ngô Nhất Nghị nếu mặc Võ Phục Vovinam).
     */
    getSkillMoveLabel(player, moveId, fallback) {
      const def = this.resolveDefinitionForPlayer(player) || this.get(player && (player.charId || player.characterId)) || this.get('nghi');
      const catalog = (def && def.animation && Array.isArray(def.animation.skillCatalog))
        ? def.animation.skillCatalog
        : this.getSkillCatalog(def ? def.id : 'nghi');
      const entry = catalog.find((item) => item && item.id === moveId);
      const rawName = (entry && entry.name) ? entry.name : (fallback || '');
      if (!rawName) return '';
      const cleaned = rawName.replace(/^(?:Phản Đòn:\s*|Bộ Pháp:\s*|Tuyệt Kỹ:\s*)/i, '').trim();
      return cleaned.toUpperCase();
    }

    /**
     * Tính toán trạng thái Nội Tại & Tích Tầng hiển thị trực tiếp trên HUD dưới thanh Máu/Năng Lượng.
     */
    getPassiveHudStatus(player, enemies) {
      const charId = (player && (player.charId || player.characterId)) || 'nghi';
      const skinId = this.getEquippedSkin(player);
      const list = Array.isArray(enemies)
        ? enemies
        : ((typeof window !== 'undefined' && window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : []);

      let target = (player && player._lastDamagedEnemy && !player._lastDamagedEnemy.isDead && player._lastDamagedEnemy.hp > 0)
        ? player._lastDamagedEnemy
        : null;
      if (!target && list.length > 0 && player) {
        let bestDist = Infinity;
        for (const e of list) {
          if (!e || e.isDead || e.hp <= 0) continue;
          const d = Math.hypot((e.x || 0) - (player.x || 0), (e.y || 0) - (player.y || 0));
          if (d < bestDist) {
            bestDist = d;
            target = e;
          }
        }
      }

      const combo = (typeof window !== 'undefined' && window.combatSystem && typeof window.combatSystem.comboCount === 'number')
        ? window.combatSystem.comboCount
        : ((player && (player.comboCount || player.comboStep)) || 0);
      const hpRatio = (player && player.maxHp > 0) ? (player.hp / player.maxHp) : 1;
      const hasAura = !!(player && player.auraArmor && (player.auraArmorTimer || 0) > 0);

      const BADGE_META = {
        nghi:      { wu: 'TỤ KHÍ',    hand: 'GẠT QUYỀN', leg: 'GẠT TRỤ',   dodge: 'NÉ BỘ' },
        bichlam:   { wu: 'CUỒNG PHONG', hand: 'HUYẾT TRẢO', leg: 'SONG CƯỚC', dodge: 'PHI THÂN' },
        huavudai:  { wu: 'KIM TIỀN',  hand: 'TRẤN GẬY',  leg: 'QUÉT GẬY',  dodge: 'THOÁI BỘ' },
        dinhan:    { wu: 'CỐ THỦ',    hand: 'KHIÊN KÍCH', leg: 'HỔ PHÙ',   dodge: 'TRỤ TẤN' },
        hoanganh:  { wu: 'CHẤN ĐỊA',  hand: 'BỔ CUỐC',   leg: 'TRẤN ĐÁ',   dodge: 'ĐỘC NGƯU' },
        dunghai:   { wu: 'KHÓI MÙ',   hand: 'ÁM KHÍ',    leg: 'CẮT GÂN',   dodge: 'THẾ THÂN' },
        giangmanh: { wu: 'KIẾM QUYẾT', hand: 'PHONG SƯƠNG', leg: 'TOÁI BĂNG', dodge: 'BĂNG BỘ' },
        vananh:    { wu: 'HABANA',    hand: 'GÍ SÚNG',   leg: 'BẺ KHỚP',   dodge: 'KHÓI LƯỚT' },
        tiendang:  { wu: 'QUÉT M&A',  hand: 'BẪY NGƯỢC', leg: 'CẮT TẦN SỐ', dodge: 'TÀN ẢNH' },
        thienkhanh:{ wu: 'TRIỆU HỒI', hand: 'HỎA CHÚ',   leg: 'QUỶ TRẢO',   dodge: 'HỎA ĐỘN' }
      };
      const meta = BADGE_META[charId] || BADGE_META.nghi;

      let out = {
        icon: '☯️',
        name: 'CƯƠNG NHU PHỐI TRIỂN',
        pipsMax: 5,
        pipsFilled: 0,
        statusText: 'COMBO 0/5',
        isBuffActive: false,
        accentColor: '#38bdf8'
      };

      if (charId === 'nghi') {
        const mod5 = combo > 0 ? (combo % 5 || 5) : 0;
        const speedOn = !!(player && player._cuongNhuSpeedTimer > 0);
        out = {
          icon: '☯️',
          name: 'CƯƠNG NHU PHỐI TRIỂN',
          pipsMax: 5,
          pipsFilled: speedOn ? 5 : mod5,
          statusText: speedOn
            ? `⚡ TỐC +15% (${player._cuongNhuSpeedTimer.toFixed(1)}s)`
            : (hasAura ? `🛡️ GIÁP (${player.auraArmorTimer.toFixed(1)}s)` : `COMBO ${mod5}/5`),
          isBuffActive: speedOn || hasAura,
          accentColor: '#38bdf8'
        };
      } else if (charId === 'bichlam') {
        const isNamCheo = (skinId === 'namcheo');
        const surgeOn = !!(player && player._windSurgeTimer > 0);
        const lowHp = hpRatio < 0.5;
        out = {
          icon: isNamCheo ? '🌊' : '🌪️',
          name: isNamCheo ? 'THỦY BÁ ÔNG NĂM CHÈO' : 'CUỒNG PHONG LỤC CHIẾN',
          pipsMax: 4,
          pipsFilled: surgeOn ? 4 : (lowHp ? 3 : Math.min(4, combo % 5)),
          statusText: surgeOn
            ? `${isNamCheo ? '🌊 THỦY TRIỀU' : '🌪️ CUỒNG PHONG'} (${player._windSurgeTimer.toFixed(1)}s)`
            : (lowHp ? '🔥 LỤC CHIẾN -20% ST' : (player && player.nextHitCrit ? '⚡ ĐÒN KẾ BẠO KÍCH' : (isNamCheo ? 'CHỜ ĐẠP SÓNG' : 'SẴN SÀNG XUNG KÍCH'))),
          isBuffActive: surgeOn || lowHp || !!(player && player.nextHitCrit),
          accentColor: isNamCheo ? '#0ea5e9' : '#10b981'
        };
      } else if (charId === 'huavudai') {
        const shieldReady = !(player && player._hacLongShieldUsed);
        const regenProgress = Math.min(3, Math.floor(((player && player._energyRegenTimer) || 0) / 2.7));
        out = {
          icon: '🐉',
          name: 'HẮC LONG HỘ THỂ',
          pipsMax: 3,
          pipsFilled: (shieldReady ? 1 : 0) + (hasAura ? 2 : regenProgress),
          statusText: hasAura
            ? `🛡️ BẤT HOẠI (${player.auraArmorTimer.toFixed(1)}s)`
            : (shieldReady ? '🛡️ HỘ THỂ SẴN SÀNG' : '⚡ ĐÃ KÍCH HỘ THỂ'),
          isBuffActive: hasAura || shieldReady,
          accentColor: '#ef4444'
        };
      } else if (charId === 'dinhan') {
        const guardVal = (player && typeof player.guardGauge === 'number') ? player.guardGauge : 100;
        const guardMax = (player && player.maxGuardGauge) || 100;
        const guardPct = Math.max(0, Math.min(100, Math.round((guardVal / guardMax) * 100)));
        out = {
          icon: '🛡️',
          name: 'THIẾT BÍCH KHIÊN',
          pipsMax: 4,
          pipsFilled: Math.max(0, Math.min(4, Math.round((guardVal / guardMax) * 4))),
          statusText: hasAura
            ? `🟡 KIM CANG (${player.auraArmorTimer.toFixed(1)}s)`
            : `🛡️ KHIÊN ${guardPct}%`,
          isBuffActive: hasAura || guardPct >= 75,
          accentColor: '#f59e0b'
        };
      } else if (charId === 'hoanganh') {
        const sinceHit = ((player && player.attackClock) || 0) - ((player && player._lastDamagedAt) || -99);
        const healing = !!(player && player.state === 'idle' && player.stateTimer >= 2.0 && sinceHit >= 2.0 && player.hp < player.maxHp);
        out = {
          icon: '⛰️',
          name: 'NHAM THẠCH ĐẠI SƠN',
          pipsMax: 3,
          pipsFilled: hasAura ? Math.min(3, player.auraArmorHits || 3) : (healing ? 3 : (hpRatio < 1 ? 2 : 3)),
          statusText: hasAura
            ? `🔴 BÁ THỂ (${player.auraArmorHits || 1} ĐÒN)`
            : (healing ? '♻️ HỒI +25 HP/s' : (hpRatio < 1 ? '⏳ ĐỨNG YÊN 2s HỒI' : '⛰️ SƠN LỰC TOÀN VẸN')),
          isBuffActive: hasAura || healing,
          accentColor: '#d97706'
        };
      } else if (charId === 'dunghai') {
        const critReady = !!(player && player.nextHitCrit);
        out = {
          icon: '🩸',
          name: 'HUYẾT ẢNH ÁM KHÍ',
          pipsMax: 3,
          pipsFilled: critReady ? 3 : (hasAura ? 3 : Math.min(3, combo % 4)),
          statusText: critReady
            ? '🎯 ĐÒN KẾ BẠO KÍCH'
            : (hasAura ? `💨 ẨN THÂN (${player.auraArmorTimer.toFixed(1)}s)` : '💨 HƯ ẢNH SẴN SÀNG'),
          isBuffActive: critReady || hasAura,
          accentColor: '#f43f5e'
        };
      } else if (charId === 'giangmanh') {
        const critReady = !!(player && player.nextHitCrit);
        const step = combo > 0 ? (combo % 4 || 4) : 0;
        out = {
          icon: '❄️',
          name: 'HÀN BĂNG KIẾM PHÁP',
          pipsMax: 4,
          pipsFilled: (critReady || hasAura) ? 4 : step,
          statusText: hasAura
            ? `🛡️ BĂNG GIÁP (${player.auraArmorTimer.toFixed(1)}s)`
            : (critReady ? '⚔️ ĐÒN KẾ XUYÊN GIÁP' : `⚔️ KIẾM Ý ${step}/4`),
          isBuffActive: critReady || hasAura,
          accentColor: '#38bdf8'
        };
      } else if (charId === 'vananh') {
        const critReady = !!(player && player.nextHitCrit);
        const triggered = !!(player && player._xichHuyetArmorTriggered);
        const hitsLeft = hasAura ? Math.min(5, player.auraArmorHits || 0) : (triggered ? 0 : 5);
        out = {
          icon: '🥃',
          name: 'HẬU PHƯƠNG THÉP',
          pipsMax: 5,
          pipsFilled: critReady ? 5 : hitsLeft,
          statusText: critReady
            ? '💥 ĐẠN BẠO KÍCH SẴN SÀNG'
            : (hasAura ? `🛡️ GIÁP THÉP ${player.auraArmorHits || 1}` : (triggered ? '🔫 ĐÃ KÍCH HẬU PHƯƠNG' : '💎 SẴN SÀNG (<45% HP)')),
          isBuffActive: critReady || hasAura,
          accentColor: '#eab308'
        };
      } else if (charId === 'tiendang') {
        const shieldOn = !!(player && player._quantumShieldTimer > 0);
        const critReady = !!(player && player.nextHitCrit);
        const step = combo > 0 ? (combo % 3 || 3) : 0;
        out = {
          icon: '⚡',
          name: 'TIÊN PHONG TÁC CHIẾN',
          pipsMax: 3,
          pipsFilled: (shieldOn || critReady) ? 3 : step,
          statusText: shieldOn
            ? `🛡️ LÁ CHẮN (${player._quantumShieldTimer.toFixed(1)}s)`
            : (critReady ? '⚡ ĐÒN KẾ BẠO KÍCH' : `⚡ XUNG LƯỢNG ${step}/3`),
          isBuffActive: shieldOn || critReady,
          accentColor: '#22d3ee'
        };
      } else if (charId === 'thienkhanh') {
        const fiends = (player && Array.isArray(player._summonedFiends)) ? player._summonedFiends.filter(f => f && f.life > 0).length : 0;
        const seq = Math.max(0, Math.min(3, (player && player._thienKhanhHitSeq) || 0));
        const justSummoned = !!(player && (player._fiendSummonFlashTimer || 0) > 0);
        const pipsFilled = justSummoned ? 4 : seq;
        const stepLabel = justSummoned ? '4/4' : `${seq}/4`;
        out = {
          icon: '🔥',
          name: 'HỎA XU TÀ CHÚ',
          pipsMax: 4,
          pipsFilled,
          statusText: fiends > 0
            ? `👹 ${fiends}/3 • TÀ CHÚ ${stepLabel} • +10%`
            : `TÀ CHÚ ${stepLabel} • +10% ST NHẬN`,
          isBuffActive: fiends > 0 || justSummoned || hasAura,
          accentColor: '#ef4444'
        };
      }

      out.wuLabel = (charId === 'bichlam' && skinId === 'namcheo') ? 'THỦY TRIỀU' : meta.wu;
      out.handCounterLabel = (charId === 'bichlam' && skinId === 'namcheo') ? 'MÁI CHÈO' : meta.hand;
      out.legCounterLabel = (charId === 'bichlam' && skinId === 'namcheo') ? 'ĐẠP SÓNG' : meta.leg;
      out.dodgeLabel = (charId === 'bichlam' && skinId === 'namcheo') ? 'LƯỚT SÓNG' : meta.dodge;
      out.selfDebuffs = this.getEntityDebuffs(player);
      out.targetDebuffs = target ? this.getEntityDebuffs(target) : [];
      return out;
    }

    /**
     * Liệt kê toàn bộ hiệu ứng bất lợi (Debuff / Trạng thái khống chế / Tích tầng) đang tồn tại trên thực thể.
     */
    getEntityDebuffs(entity) {
      if (!entity || entity.isDead) return [];
      const list = [];
      const isPlayer = entity.type === 'player';

      if (entity.frozenTimer > 0) {
        list.push({
          id: 'frozen',
          icon: '🧊',
          name: 'ĐÓNG BĂNG',
          shortText: entity.frozenTimer.toFixed(1) + 's',
          timer: entity.frozenTimer,
          color: '#38bdf8',
          bg: 'rgba(2, 132, 199, 0.30)',
          isSelfDebuff: isPlayer
        });
      }
      if (entity.stunTimer > 0 && !(entity.frozenTimer > 0)) {
        list.push({
          id: 'stun',
          icon: '💫',
          name: 'CHOÁNG',
          shortText: entity.stunTimer.toFixed(1) + 's',
          timer: entity.stunTimer,
          color: '#facc15',
          bg: 'rgba(202, 138, 4, 0.30)',
          isSelfDebuff: isPlayer
        });
      }
      if (entity.guardBreakTimer > 0 || entity.state === 'guard_break') {
        const gbRem = entity.guardBreakTimer > 0
          ? entity.guardBreakTimer
          : Math.max(0, (entity.stateDuration || 0) - (entity.stateTimer || 0));
        list.push({
          id: 'guard_break',
          icon: '💔',
          name: 'BỂ THỦ',
          shortText: gbRem.toFixed(1) + 's',
          timer: gbRem,
          color: '#fb923c',
          bg: 'rgba(234, 88, 12, 0.32)',
          isSelfDebuff: isPlayer
        });
      }
      if (entity.bleedTimer > 0) {
        list.push({
          id: 'bleed',
          icon: '🩸',
          name: 'XUẤT HUYẾT',
          shortText: entity.bleedTimer.toFixed(1) + 's',
          timer: entity.bleedTimer,
          color: '#fb7185',
          bg: 'rgba(225, 29, 72, 0.30)',
          isSelfDebuff: isPlayer
        });
      }
      if (entity.burnTimer > 0) {
        list.push({
          id: 'burn',
          icon: '🔥',
          name: 'THIÊU ĐỐT',
          shortText: entity.burnTimer.toFixed(1) + 's',
          timer: entity.burnTimer,
          color: '#f97316',
          bg: 'rgba(234, 88, 12, 0.34)',
          isSelfDebuff: isPlayer
        });
      }
      if (entity.blindTimer > 0) {
        list.push({
          id: 'blind',
          icon: '💨',
          name: 'MÙ ĐÒN',
          shortText: entity.blindTimer.toFixed(1) + 's',
          timer: entity.blindTimer,
          color: '#c084fc',
          bg: 'rgba(147, 51, 234, 0.30)',
          isSelfDebuff: isPlayer
        });
      }
      if (entity.exhaustTimer > 0) {
        list.push({
          id: 'exhaust',
          icon: '🥵',
          name: 'KIỆT SỨC',
          shortText: entity.exhaustTimer.toFixed(1) + 's',
          timer: entity.exhaustTimer,
          color: '#f97316',
          bg: 'rgba(194, 65, 12, 0.32)',
          isSelfDebuff: isPlayer
        });
      }
      if (entity.slowTimer > 0) {
        list.push({
          id: 'slow',
          icon: '🐌',
          name: 'LÀM CHẬM',
          shortText: entity.slowTimer.toFixed(1) + 's',
          timer: entity.slowTimer,
          color: '#7dd3fc',
          bg: 'rgba(3, 105, 161, 0.28)',
          isSelfDebuff: isPlayer
        });
      }
      if (isPlayer && (entity.spamStack || 0) >= 3 && ((entity.attackClock || 0) - (entity._lastHitAt || -99)) < 0.85) {
        const pctLoss = Math.max(10, Math.round((1 - (entity._attackMul !== undefined ? entity._attackMul : 0.6)) * 100));
        list.push({
          id: 'stale',
          icon: '⚠️',
          name: 'NHẠT LỰC',
          shortText: '-' + pctLoss + '%',
          timer: 0,
          color: '#fbbf24',
          bg: 'rgba(180, 83, 9, 0.28)',
          isSelfDebuff: true
        });
      }
      if (!isPlayer) {
        if (entity.isBoss && entity.weakWindow > 0) {
          list.push({
            id: 'weak',
            icon: '⚡',
            name: 'SƠ HỞ',
            shortText: entity.weakWindow.toFixed(1) + 's',
            timer: entity.weakWindow,
            color: '#00f0ff',
            bg: 'rgba(6, 182, 212, 0.30)',
            isSelfDebuff: false
          });
        }
        if ((entity._maMarks || 0) > 0) {
          list.push({
            id: 'ma_marks',
            icon: '📂',
            name: 'SAO KÊ',
            shortText: entity._maMarks + '/3',
            stack: entity._maMarks,
            color: '#22d3ee',
            bg: 'rgba(8, 145, 178, 0.28)',
            isSelfDebuff: false
          });
        }
        if ((entity._frostStacks || 0) > 0 && !(entity.frozenTimer > 0)) {
          list.push({
            id: 'frost_stacks',
            icon: '❄️',
            name: 'HÀN KHÍ',
            shortText: entity._frostStacks + '/4',
            stack: entity._frostStacks,
            color: '#7dd3fc',
            bg: 'rgba(14, 116, 144, 0.28)',
            isSelfDebuff: false
          });
        }
      }
      return list;
    }
  }

  if (!window.CharacterRegistry) {
    window.CharacterRegistry = new CharacterRegistrySystem();
  }
})();

