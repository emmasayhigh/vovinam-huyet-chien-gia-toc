/**
 * NHÂN VẬT: CHÂU NGỌC THIÊN KHÁNH (HUYẾT TÀ ĐẠO SĨ — KIẾM XU THIÊU HỒN)
 * js/entities/characters/thienkhanh.js
 * Nguồn: Biên Niên Sử Gia Tộc Họ Phó: Huyết Chiến Đại Lục (Hồi 3 & Hồi 8)
 * Mở khóa: Siêu phẩm Độc Quyền Cửa Hàng Gia Tộc (12.000 Vàng)
 */

(function () {
  function igniteTarget(attacker, target, tickDmg = 14, duration = 3.6) {
    if (!target || target.isDead) return;
    if (window.combatSystem && typeof window.combatSystem.applyBurn === 'function') {
      window.combatSystem.applyBurn(target, !(attacker && attacker.isEnemy), tickDmg, duration);
    } else {
      target.burnTimer = Math.max(target.burnTimer || 0, duration);
      target.burnDmg = Math.max(target.burnDmg || 0, tickDmg);
      target.burnTickTimer = target.burnTickTimer || 0.25;
    }
  }

  function spawnTaoistFiend(owner, x, y, life = 6.5, dmg = 26) {
    if (!owner) return null;
    if (!Array.isArray(owner._summonedFiends)) owner._summonedFiends = [];
    // Tối đa 3 Âm Binh Hỏa cùng lúc: nếu đầy thì thay con cũ nhất
    while (owner._summonedFiends.length >= 3) {
      const oldest = owner._summonedFiends.shift();
      if (oldest) oldest.life = 0;
    }
    const fiend = {
      id: `fiend_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      x: x + (owner.facing || 1) * 44,
      y: y || 580,
      facing: owner.facing || 1,
      life,
      maxLife: life,
      dmg,
      attackCd: 0.05,
      slashTimer: 0,
      seed: Math.random() * 10
    };
    owner._summonedFiends.push(fiend);

    const fx = window.effectManager;
    if (fx) {
      if (typeof fx.createTaoistFiend === 'function') fx.createTaoistFiend(fiend);
      if (typeof fx.createShockRing === 'function') fx.createShockRing(fiend.x, fiend.y, '#dc2626');
      if (typeof fx.createHitSparks === 'function') fx.createHitSparks(fiend.x, fiend.y - 45, 10, true);
      if (typeof fx.addFloatingText === 'function') fx.addFloatingText('👹 TRIỆU HỒI HỎA ÂM BINH!', fiend.x, fiend.y - 120, 'crit');
    }
    return fiend;
  }

  function triggerHapTinhSiphon(player, target, hpGain = 14, energyGain = 4, bonusBurnDmg = 0) {
    if (!player || player.isDead || !player.passive_huyetAnHapTinh) return;
    if ((player._hapTinhHealCd || 0) <= 0) {
      player._hapTinhHealCd = 0.55;
      const healed = Math.min(Math.max(0, (player.maxHp || 960) - (player.hp || 0)), hpGain);
      player.hp = Math.min(player.maxHp || 960, (player.hp || 0) + hpGain);
      if (typeof player.addEnergy === 'function') player.addEnergy(energyGain);
      else player.energy = Math.min(player.maxEnergy || 100, (player.energy || 0) + energyGain);
      if (window.uiManager && typeof window.uiManager.updatePlayerHp === 'function') {
        window.uiManager.updatePlayerHp(player.hp, player.maxHp);
      }
      if (healed > 0 && window.effectManager && typeof window.effectManager.addFloatingText === 'function') {
        window.effectManager.addFloatingText(`🩸 +${healed} HP`, player.x, (player.y || 580) - 135, 'heal');
      }
    }
    if (bonusBurnDmg > 0 && target && !target.isDead && typeof target.takeDamage === 'function') {
      target._skipPassiveTrigger = true;
      try {
        if (target.isRemotePlayer) {
          target.takeDamage(bonusBurnDmg, 0, false, { bypassInvincible: true });
        } else {
          target.takeDamage(bonusBurnDmg, 0, false);
        }
      } finally {
        target._skipPassiveTrigger = false;
      }
    }
  }

  function getFiendTargets(player, passedEnemies = null) {
    const targets = [];
    const pushIfValid = (t) => {
      if (!t || t === player || t.isDead || (t.hp !== undefined && t.hp <= 0)) return;
      if (!targets.includes(t)) targets.push(t);
    };
    if (Array.isArray(passedEnemies)) {
      passedEnemies.forEach(pushIfValid);
    }
    if (window.game && Array.isArray(window.game.enemies)) {
      window.game.enemies.forEach(pushIfValid);
    }
    if (window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'pvp' && window.onlineManager.remotePlayer) {
      pushIfValid(window.onlineManager.remotePlayer);
    }
    if (window.game && window.game.remotePlayer) {
      pushIfValid(window.game.remotePlayer);
    }
    return targets;
  }

  function updateFiends(player, dt, passedEnemies = null) {
    if (!player || !Array.isArray(player._summonedFiends) || !player._summonedFiends.length) return;
    const targets = getFiendTargets(player, passedEnemies);
    const fx = window.effectManager;

    for (let i = player._summonedFiends.length - 1; i >= 0; i--) {
      const f = player._summonedFiends[i];
      f.life -= dt;
      if (f.slashTimer > 0) f.slashTimer = Math.max(0, f.slashTimer - dt);
      if (f.attackCd > 0) f.attackCd = Math.max(0, f.attackCd - dt);
      if (f.life <= 0) {
        player._summonedFiends.splice(i, 1);
        continue;
      }

      // Tìm kẻ địch / đối thủ PvP gần nhất để lao tới truy sát & thiêu đốt
      let nearest = null;
      let bestDist = Infinity;
      for (const t of targets) {
        const ty = t.y || 580;
        const d = Math.hypot((t.x || 0) - f.x, (ty - f.y) * 1.25);
        if (d < bestDist) {
          bestDist = d;
          nearest = t;
        }
      }

      if (nearest) {
        const tx = nearest.x || 0;
        const ty = nearest.y || 580;
        const dx = tx - f.x;
        const dy = ty - f.y;
        f.facing = dx >= 0 ? 1 : -1;
        const inAttackRange = Math.abs(dx) <= 76 && Math.abs(dy) <= 52;
        if (!inAttackRange) {
          const speed = 400;
          const dist = Math.hypot(dx, dy) || 1;
          f.x += (dx / dist) * speed * dt;
          f.y += (dy / dist) * (speed * 0.85) * dt;
          f.y = Math.max(500, Math.min(650, f.y));
        } else if (f.attackCd <= 0) {
          f.attackCd = 0.72;
          f.slashTimer = 0.28;
          const dmg = f.dmg || 26;
          const wasBurning = (nearest.burnTimer || 0) > 0;
          if (typeof nearest.takeDamage === 'function') {
            if (nearest.isRemotePlayer) {
              nearest.takeDamage(dmg, f.facing * 5, false, { bypassInvincible: true });
            } else {
              nearest.takeDamage(dmg, f.facing * 5, false);
            }
          } else {
            nearest.hp = Math.max(0, (nearest.hp || 0) - dmg);
            if ((nearest.hp || 0) <= 0 && !nearest.isDead) {
              nearest.hp = 0;
              nearest.isDead = true;
              nearest.isAttacking = false;
              if (typeof nearest.setState === 'function') nearest.setState('knockdown', 1.0);
            }
          }
          igniteTarget(player, nearest, 14, 3.4);
          if (wasBurning) {
            triggerHapTinhSiphon(player, nearest, 12, 3, 0);
          }
          if (fx) {
            if (typeof fx.createFlameCoinSlash === 'function') fx.createFlameCoinSlash(f.x + f.facing * 24, f.y - 44, f.facing, (Math.random() - 0.5) * 0.6, 52);
            if (typeof fx.createHitSparks === 'function') fx.createHitSparks(tx, ty - 64, 7, true);
            if (typeof fx.addFloatingText === 'function') fx.addFloatingText(`🔥 ÂM BINH TRẢM (-${dmg})`, tx, ty - 110, 'crit');
          }
        }
      } else {
        // Không có mục tiêu: lơ lửng hộ vệ bên cạnh Thiên Khánh
        const guardX = player.x - (player.facing || 1) * 58;
        const guardY = (player.y || 580) - 4;
        const dx = guardX - f.x;
        const dy = guardY - f.y;
        if (Math.hypot(dx, dy) > 12) {
          f.x += dx * Math.min(1, 5.5 * dt);
          f.y += dy * Math.min(1, 5.5 * dt);
        }
        f.facing = player.facing || 1;
      }
    }
  }

  window.CharacterRegistry.register({
    id: 'thienkhanh',
    uiSlotOrder: 9,

    // =========================================================================
    // 1. NGOẠI HÌNH & TRANG PHỤC (STYLE_DEFS)
    // =========================================================================
    appearance: {
      styleKey: 'boss_thienkhanh',
      style: {
        scale: 1.24,
        archetype: 'crimson_coin_taoist',
        rig: {
          shW: 11.4, waW: 8.0, hipW: 9.6, chestOut: 12.2,
          thighLen: 26, calfLen: 27, armUpper: 19, armFore: 18,
          spineH: 34.0, neckLen: 14.5, nShX: -4.8, nShY: -2.2, fShX: 4.8, fShY: -1.8,
          hipHalf: 3.8, footPad: 4, headScale: 0.80, limbBulk: 0.97, armBulk: 0.94
        },
        skin: '#f3d2bd',
        hair: '#090d16',
        hairStyle: 'thienkhanh_topknot',
        jawStyle: 'lean_angular',
        gi: '#881337',
        pants: '#475569',
        belt: '#090d16',
        aura: '#ef4444',
        under: '#1e293b',
        wideSleeves: true,
        coinVeil: true,
        taoistQuiver: true,
        weapon: 'coin_sword',
        shoes: 'bandage_wraps',
        glowingEyes: '#ef4444',
        eyeColor: '#dc2626'
      }
    },

    // =========================================================================
    // 2. HỒ SƠ CỐT TRUYỆN (ROSTER DOSSIER)
    // =========================================================================
    dossier: {
      id: 'thienkhanh',
      name: 'Châu Ngọc Thiên Khánh',
      title: 'TÀ SƯ BÙA NGẢI — KIẾM XU THIÊU HỒN',
      faction: 'trieugia',
      styleType: 'boss_thienkhanh',
      portrait: 'boss_thienkhanh',
      playable: true,
      role: 'Đệ tử phản đồ tinh nhuệ nhất từng rời Ngô Môn Quan trước thời Chiến tranh Vùng Vịnh — bậc thầy tà thuật bùa chú, vũ điệu Kiếm Xu Đồng Đỏ và thuật triệu hồi Âm Binh Lửa.',
      motive: 'Thao túng tam giác Gia tộc bằng tà thuật và trả món nợ huyết hải sau khi thất bại trước Ngô Nhị Linh Hạo và Phó Văn Anh tại căn cứ Ngụy trang Tây Hồ.',
      fightingStyle: 'Múa Kiếm Xu Đồng Cháy xé không khí với tầm quét rộng, khắc ấn Thiêu Đốt rút sinh lực liên tục và triệu hồi Hỏa Âm Binh truy sát mục tiêu.',
      strengths: 'Áp đảo chiến trường đa mục tiêu: Hỏa Âm Binh tự động đuổi theo kẻ địch gây sát thương kép và cộng dồn Thiêu Đốt cực rát.',
      weaknesses: 'Thân pháp thiên về tà thuật khiến giáp thịt khá mỏng (960 HP & nội tại Tà Thuật Phản Phệ nhận +10% sát thương phải chịu), cần tận dụng Huyết Ấn Hấp Tinh để hồi phục.',
      skills: [
        { name: 'Nghiệp Hỏa Thiêu Đốt (Nội Tại)', desc: 'Mỗi đòn Kiếm Xu đánh trúng đốt cháy mục tiêu bằng lửa âm phủ (🔥 Thiêu Đốt 3.0s, rút sinh lực liên tục).' },
        { name: 'Huyết Ấn Hấp Tinh (Nội Tại Mới)', desc: 'Đánh trúng hoặc Âm Binh cào kẻ địch đang Thiêu Đốt sẽ bùng nổ +12% hỏa sát, đồng thời hồi +12–16 HP và +3–5 Năng Lượng.' },
        { name: 'Tà Thuật Phản Phệ (Nhược Điểm)', desc: 'Cơ thể bị tà chú bào mòn nhẹ — chỉ nhận thêm +10% sát thương từ mọi đòn đánh phải chịu.' },
        { name: 'Triệu Hồi Hỏa Âm Binh (Tích Chiêu & W+U)', desc: 'Mỗi 4 nhát kiếm hoặc kích hoạt [W+U] (hồi 3.5s) / [U+J] gọi ngay Hỏa Âm Binh truy sát và thiêu đốt kẻ thù (tối đa 3 Âm Binh).' },
        { name: 'Bùa Lửa Hoán Ảnh [L]', desc: 'Lướt né hóa tàn ảnh hỏa phù gây cháy xung quanh vị trí cũ.' },
        { name: 'Huyết Đạo Luân Hồi Trảm [I]', desc: 'Tuyệt kỹ: Múa kiếm xu rực lửa triệu hồi đồng loạt 3 Hỏa Âm Binh và quét kiếm hỏa toàn màn hình.' }
      ],
      ultimate: { name: 'HUYẾT ĐẠO LUÂN HỒI TRẢM', desc: 'Xoay tít thanh Kiếm Xu Đồng rực cháy, triệu hồi 3 Hỏa Âm Binh âm ti và kết liễu bằng bão hỏa phù rực đỏ.' },
      stats: { power: 5, speed: 4, defense: 3, technique: 5, range: 5 },
      relations: [
        { who: 'Ngô Nhị Linh Hạo', rel: 'Kỳ phùng địch thủ — Từng bị Linh Hạo đánh tan tà trận trong Hồi III tại Ngô Môn Quan' },
        { who: 'Phó Văn Anh', rel: 'Kẻ tử thù — Người bóp chết âm mưu tráo thân phận tại Tây Hồ và ép Thiên Khánh đến bước đường cùng' },
        { who: 'Triệu Hoàng Châu', rel: 'Kẻ hợp tác ngầm trong mạng lưới buôn lậu và mưu sát Triệu Vinh Tâm' }
      ],
      events: [
        'Hồi III: Cuộc nổi loạn tà sư tại Ngô Môn Quan — Thiên Khánh thiêu rụi đàn tràng bùa chú bằng Kiếm Xu Đồng Đỏ trước khi bị Linh Hạo trục xuất.',
        'Hồi VIII: Xuất hiện tại Trại cá Koi Tây Hồ dưới vỏ bọc đạo sĩ ẩn danh để đoạt ấn tín Hoàng Kim nhưng bị Văn Anh và Linh Hạo hợp lực đập tan.'
      ],
      unlock: { type: 'shop', currency: 'gold', price: 12000, text: 'Siêu Phẩm Độc Quyền Cửa Hàng Gia Tộc (12.000 Vàng)' }
    },

    // =========================================================================
    // 3. THẺ CHỌN NHÂN VẬT & CỬA HÀNG (SIÊU ĐẮT 12.000 VÀNG)
    // =========================================================================
    uiSlot: {
      id: 'thienkhanh',
      slotName: 'THIÊN KHÁNH',
      fullName: 'CHÂU NGỌC THIÊN KHÁNH',
      title: 'TÀ SƯ BÙA NGẢI — KIẾM XU THIÊU HỒN',
      tagline: 'Múa Kiếm Xu Đồng Đỏ — Gọi Hỏa Âm Binh — Thiêu Đốt Bất Tận',
      element: '🔥',
      color: '#dc2626',
      image: 'assets/images/characters/char_thienkhanh.png',
      vovinamImage: 'assets/images/characters/char_thienkhanh_vovinam.png',
      shopUnlock: true,
      shopCurrency: 'gold',
      shopPrice: 12000,
      bio: 'Bậc thầy tà thuật bí ẩn nhất trong Đại Toàn Thư Gia Tộc Họ Phó — kẻ mang mặt nạ đồng xu cổ, khoác đạo bào huyết sắc và vung thanh Kiếm Xu Đồng cháy rực lửa địa ngục. Không chỉ múa kiếm linh hoạt như vũ điệu ma quái, Thiên Khánh còn triệu hồi đàn Hỏa Âm Binh lao ra vây hãm và thiêu đốt kẻ thù đến tận tro tàn.',
      stats: { power: 96, speed: 90, defense: 74, technique: 99 },
      skills: [
        { key: 'J / K', icon: '🗡️', name: 'Múa Kiếm Xu Hỏa Diễm', desc: 'Chuỗi múa Kiếm Xu tầm rộng kèm kiếm khí xu đồng rực lửa, khắc hiệu ứng Thiêu Đốt.' },
        { key: 'W + U', icon: '👹', name: 'Bùa Triệu Hồi Âm Binh', desc: 'Niệm bùa chú đỏ gọi ngay Hỏa Âm Binh lao ra tấn công và thiêu đốt kẻ địch gần nhất.' },
        { key: 'U+J / U+K', icon: '🔥', name: 'Phản Chú Hỏa Ngục', desc: 'Phản đòn tức thì gọi thêm 1 Hỏa Âm Binh hỗ trợ chiến đấu và bùng nổ hỏa luân.' },
        { key: 'I', icon: '🌋', name: 'Huyết Đạo Luân Hồi Trảm', desc: 'Tuyệt kỹ tối thượng: Múa kiếm xu hủy diệt + triệu hồi đội quân 3 Hỏa Âm Binh thiêu rụi chiến trường.' }
      ],
      passives: [
        { icon: '🔥', name: 'Nghiệp Hỏa Kiếm Xu', type: 'BỊ ĐỘNG', desc: 'Đòn Kiếm Xu đánh trúng đốt cháy mục tiêu bằng hiệu ứng 🔥 THIÊU ĐỐT (rút 12 ST/nhịp trong 3.0s).' },
        { icon: '👹', name: 'Quỷ Môn Triệu Hoán', type: 'BỊ ĐỘNG & [W+U]', desc: 'Mỗi đòn thứ 4 trong chuỗi hoặc [W+U] (hồi 3.5s) triệu hồi Hỏa Âm Binh đuổi chém & thiêu đốt kẻ thù (tối đa 3 Âm Binh).' },
        { icon: '🩸', name: 'Huyết Ấn Hấp Tinh', type: 'BỊ ĐỘNG MỚI', desc: 'Đánh hoặc Âm Binh cào trúng mục tiêu đang 🔥 THIÊU ĐỐT gây thêm hỏa sát, hồi +12–16 HP và +3–5 Năng Lượng.' },
        { icon: '⚠️', name: 'Tà Thuật Phản Phệ', type: 'NHƯỢC ĐIỂM', desc: 'Cơ thể chịu phản phệ tà thuật đã được tiết chế — chỉ nhận thêm +10% sát thương phải chịu.' }
      ],
      mechanic: 'Kiếm Xu + Hỏa Âm Binh truy sát + Huyết Ấn Hấp Tinh hồi phục — chỉ nhận +10% sát thương.',
      quote: '“Nghe tiếng đồng xu va nhau trong biển lửa chưa? Đó là khúc cầu siêu cho linh hồn ngươi đấy!”'
    },

    // =========================================================================
    // 4. CHỈ SỐ CHIẾN ĐẤU & SÁT THƯƠNG ĐÒN ĐÁNH
    // =========================================================================
    combat: {
      hp: 960,
      speed: 245,
      runSpeed: 392,
      jumpForce: 530,
      damage: 1.08,
      reach: 1.12,
      knockback: 1.10,
      energyGain: 1.12,
      finisher: 'counter',
      ultimateState: 'ultimate_precision',
      ultimateType: 'precision',
      comboMax: 4,
      counterBonus: 1.95,
      mechanic: 'Công Cao, Hấp Tinh Hồi Phục & Hỏa Âm Binh (tối đa 3) — Nhận +10% Sát Thương Phải Chịu'
    },

    moveOverrides: {
      punch_straight: { damage: 46, width: 98, knockback: 150, energyGain: 10 },
      punch_hook: { damage: 64, width: 112, knockback: 220, energyGain: 13 },
      kick_push: { damage: 66, width: 102, knockback: 260, isKick: true, counterType: 'leg', energyGain: 14 },
      kick_roundhouse: { damage: 94, width: 118, knockback: 420, knockdown: true, isKick: true, counterType: 'leg', energyGain: 18 },
      uppercut: { damage: 78, width: 105, knockback: 310, launch: true, energyGain: 16 },
      wk: { damage: 82, width: 110, knockback: 340, isKick: true, counterType: 'leg', energyGain: 16 }
    },

    // =========================================================================
    // 4b. HOẠT ẢNH MÚA KIẾM XU ĐỒNG (SWORD DANCE POSES)
    // =========================================================================
    animation: {
      signatureStates: ['ultimate_precision'],
      trailProfile: {
        primary: '#f97316',
        secondary: '#dc2626',
        core: '#fef08a',
        width: 11,
        dual: false,
        dodgeGhost: 'rgba(220, 38, 38, 0.55)'
      },
      skillCatalog: [
        { id: 'punch_straight', input: 'J', name: 'Hoành Xu Trảm', dur: 0.34, category: 'combo' },
        { id: 'punch_hook', input: 'J → J', name: 'Nghiệp Hỏa Kiếm Vũ', dur: 0.42, category: 'combo' },
        { id: 'kick_push', input: 'K', name: 'Phi Hạc Đạp Hỏa', dur: 0.50, category: 'combo' },
        { id: 'kick_roundhouse', input: 'K → K', name: 'Hồi Toàn Xu Kích', dur: 0.58, category: 'combo' },
        { id: 'wk', input: 'W + K', name: 'Đằng Không Phần Thiên', dur: 0.50, category: 'special' },
        { id: 'uppercut', input: 'W + J', name: 'Thăng Long Hỏa Kiếm', dur: 0.50, category: 'special' },
        { id: 'elbow_strike', input: 'S + J', name: 'Án Kiếm Xu Chú', dur: 0.44, category: 'special' },
        { id: 'kick_sweep', input: 'S + K', name: 'Tảo Địa Hỏa Viêm', dur: 0.62, category: 'special' },
        { id: 'dodge', input: 'L', name: 'Hỏa Phù Ảo Ảnh', dur: 0.28, category: 'defense' },
        { id: 'counter_hand_strike', input: 'U + J', name: 'Phản Chú: Gọi Quỷ Trảm', dur: 0.44, category: 'counter' },
        { id: 'counter_leg_strike', input: 'U + K', name: 'Phản Chú: Xích Hỏa Luân', dur: 0.48, category: 'counter' },
        { id: 'ultimate_precision', input: 'I', name: 'Tuyệt Kỹ: Huyết Đạo Luân Hồi Trảm', dur: 1.30, category: 'ultimate' }
      ],
      poses: {
        idle(P, { t }) {
          const b = Math.sin(t * 3.1);
          P.torso = 0.05 + 0.015 * b;
          P.head = -0.02 + 0.01 * b;
          P.hx = Math.sin(t * 1.5) * 0.6;
          P.lift = Math.sin(t * 3.1) * 1.0;
          P.nT = 0.34 + 0.02 * b; P.nS = -0.46 - 0.02 * b;
          P.fT = -0.28 - 0.02 * b; P.fS = 0.12 + 0.02 * b;
          // Tay phải cầm Kiếm Xu chếch ra trước sẵn sàng múa kiếm, tay trái kết kiếm ấn giơ cao
          P.nA = 0.36 + 0.04 * b; P.nE = 0.72 - 0.03 * b;
          P.fA = 1.25 + 0.04 * b; P.fE = 1.15;
          P.grip = -0.28;
          return true;
        },
        punch_straight(P, { U, p }) {
          // Chém ngang thanh Kiếm Xu rực lửa từ sau vút qua trước
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.56, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.45 - s.recover * 0.65);
          P.torso = 0.08 - 0.18 * s.windup + 0.20 * ex;
          P.hx = -3 * s.windup + 7 * ex;
          P.nA = U.lerp(1.48, -0.32, ex);
          P.nE = U.lerp(0.82, 0.08, ex);
          P.grip = U.lerp(0.25, -0.65, ex);
          P.fA = U.lerp(1.32, 0.85, ex); P.fE = 1.05;
          P.nT = 0.65; P.nS = -0.78; P.fT = -0.58; P.fS = 0.22;
          return true;
        },
        punch_hook(P, { U, p }) {
          // Múa kiếm xoay chéo nghịch tay + tay trái tung bùa
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.58, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.65);
          P.torso = 0.12 - 0.20 * s.windup + 0.18 * ex;
          P.nA = U.lerp(-0.45, 1.55, ex);
          P.nE = U.lerp(0.45, 0.12, ex);
          P.grip = U.lerp(-0.55, 0.35, ex);
          P.fA = 1.28; P.fE = 0.55;
          P.nT = 0.72; P.nS = -0.84; P.fT = -0.62; P.fS = 0.24;
          return true;
        },
        uppercut(P, { U, p }) {
          // Hất Kiếm Xu từ thấp chém vút lên trời mở vòng tròn lửa
          const s = U.stage5(p, { a: 0.18, c: 0.36, i: 0.56, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.5 - s.recover * 0.65);
          P.torso = -0.14 * ex; P.lift = -10 * ex;
          P.nA = U.lerp(-0.55, 2.35, ex); P.nE = U.lerp(0.95, 0.08, ex);
          P.grip = U.lerp(0.3, -0.4, ex);
          P.fA = 1.15; P.fE = 0.65;
          P.nT = 0.85; P.nS = -1.0; P.fT = -0.52; P.fS = 0.18;
          return true;
        },
        kick_roundhouse(P, { U, p }) {
          // Xoay người vung cả Kiếm Xu lẫn tà áo bào đỏ quét ngang
          const s = U.stage5(p, { a: 0.18, c: 0.38, i: 0.58, f: 0.82 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.48 - s.recover * 0.68);
          P.torso = U.lerp(0.24 * s.windup, -0.34, ex);
          P.lift = 4 * s.windup - 9 * ex;
          P.nT = U.lerp(0.65, 1.98, ex); P.nS = U.lerp(-1.45, 0.04, ex);
          P.fT = -0.38; P.fS = 0.16;
          P.nA = U.lerp(0.2, 1.38, ex); P.nE = 0.18; P.grip = -0.45;
          P.fA = -0.65 * ex; P.fE = 0.4;
          return true;
        },
        counter_hand_strike(P, { U, p }) {
          // Rút Kiếm Xu đâm xuyên kết ấn triệu hồi
          const s = U.stage5(p, { a: 0.16, c: 0.34, i: 0.54, f: 0.80 });
          const ex = Math.max(0, s.strike + s.overshoot * 0.52 - s.recover * 0.65);
          P.torso = 0.22 * ex; P.hx = 8 * ex;
          P.nA = U.lerp(-0.58, 1.32, ex); P.nE = U.lerp(1.25, 0.02, ex); P.grip = -0.42;
          P.fA = 1.65; P.fE = 0.42;
          P.nT = 0.88; P.nS = -0.94; P.fT = -0.74; P.fS = 0.22;
          return true;
        },
        ultimate_precision(P, { U, p }) {
          // Múa kiếm xu luân hồi liên hoàn trong bão lửa
          const s = U.stage5(p, { a: 0.12, c: 0.28, i: 0.72, f: 0.88 });
          const spinWave = Math.sin(p * Math.PI * 6);
          P.torso = 0.18 * spinWave;
          P.lift = -12 * Math.sin(Math.min(1, p * 1.4) * Math.PI);
          P.nA = 0.85 + 1.35 * spinWave; P.nE = 0.24; P.grip = -0.4 + 0.5 * spinWave;
          P.fA = 1.45 - 0.6 * spinWave; P.fE = 0.55;
          P.nT = 0.65 + 0.45 * Math.abs(spinWave); P.nS = -0.75;
          P.fT = -0.65; P.fS = 0.25;
          return true;
        }
      },
      emitSkillVFX(e, st, prevP, p, fx) {
        const cross = (t) => prevP < t && p >= t;
        const dir = e.facing || 1;
        const gx = e.x || 0, gy = e.y || 580;
        if (st === 'dodge' && cross(0.06)) {
          if (typeof fx.createFlameCoinSlash === 'function') fx.createFlameCoinSlash(gx, gy - 50, dir, 0.2, 54);
          fx.createHitSparks(gx, gy - 45, 9, true);
        } else if ((st === 'punch_straight' || st === 'punch_hook' || st === 'elbow_strike') && cross(0.32)) {
          if (typeof fx.createFlameCoinSlash === 'function') {
            fx.createFlameCoinSlash(gx + dir * 48, gy - 68, dir, st === 'punch_hook' ? -0.32 : 0.18, 72);
          }
        } else if ((st === 'uppercut' || st === 'kick_roundhouse' || st === 'wk') && cross(0.36)) {
          if (typeof fx.createFlameCoinSlash === 'function') {
            fx.createFlameCoinSlash(gx + dir * 52, gy - 72, dir, -0.55, 86);
          }
          fx.createHitSparks(gx + dir * 54, gy - 70, 10, true);
        } else if ((st === 'counter_hand_strike' || st === 'counter_leg_strike' || st === 'boss_riposte') && cross(0.30)) {
          if (typeof fx.createFlameCoinSlash === 'function') fx.createFlameCoinSlash(gx + dir * 56, gy - 66, dir, 0, 95);
          fx.createShockRing(gx + dir * 40, gy, '#dc2626');
        } else if (st === 'ultimate_precision') {
          if (cross(0.15) || cross(0.45) || cross(0.75)) {
            if (typeof fx.createFlameCoinSlash === 'function') {
              fx.createFlameCoinSlash(gx + dir * 56, gy - 72, dir, (p - 0.5) * 1.4, 118);
            }
          }
        }
      }
    },

    // =========================================================================
    // 5. NỘI TẠI THỰC CHIẾN (THIÊU ĐỐT & TRIỆU HỒI HỎA ÂM BINH)
    // =========================================================================
    passives: {
      onApply(player) {
        player.passive_nghiepHoaKiemXu = true;
        player.passive_trieuHoiAmBinh = true;
        player.passive_taThuatPhanPhe = true;
        player.passive_huyetAnHapTinh = true;
        player.incomingDamageMul = 1.10;
        player._summonedFiends = [];
        player._thienKhanhHitSeq = 0;
        player._fiendSummonFlashTimer = 0;
        player._fiendSummonCd = 0;
        player._hapTinhHealCd = 0;
      },
      onUpdate(player, dt, enemies) {
        if (player._fiendSummonCd > 0) player._fiendSummonCd = Math.max(0, player._fiendSummonCd - dt);
        if (player._fiendSummonFlashTimer > 0) player._fiendSummonFlashTimer = Math.max(0, player._fiendSummonFlashTimer - dt);
        if (player._hapTinhHealCd > 0) player._hapTinhHealCd = Math.max(0, player._hapTinhHealCd - dt);
        updateFiends(player, dt, enemies);
      },
      onDodge(player) {
        // Bùa lửa nổ nhẹ quanh chỗ cũ khi né [L], đốt cháy địch áp sát
        const enemies = getFiendTargets(player);
        for (const e of enemies) {
          if (Math.hypot(e.x - player.x, (e.y - player.y) * 1.35) <= 135) {
            igniteTarget(player, e, 12, 3.0);
          }
        }
      },
      onDodgeFollowup(player, btn) {
        if (btn === 'K') {
          player.startAttack('kick_roundhouse', 0.48, 220);
        } else {
          player.startAttack('punch_hook', 0.42, 260);
        }
        if (window.effectManager && typeof window.effectManager.createFlameCoinSlash === 'function') {
          window.effectManager.createFlameCoinSlash(player.x + (player.facing || 1) * 44, (player.y || 580) - 64, player.facing || 1, 0.15, 78);
        }
        return true;
      },
      onStanceSpecial(player) {
        // [W+U] Tà Sư Kết Ấn: Hồi chiêu 3.5s (trừ khi bật Không Hồi Chiêu trong Võ Đường)
        const noCd = !!(window.trainingManager && window.trainingManager.isActive && window.trainingManager.noCooldown);
        const curCd = Math.max(player._fiendSummonCd || 0, player.stanceSkillCooldown || 0);
        if (!noCd && curCd > 0) {
          if (window.uiManager && typeof window.uiManager.showToast === 'function') {
            window.uiManager.showToast(`⏳ Ấn Bùa Hỏa đang hồi (${Math.ceil(curCd)}s)!`);
          }
          return false;
        }
        player._fiendSummonCd = 3.5;
        player.stanceSkillCooldown = 3.5;
        player._fiendSummonFlashTimer = 0.55;
        spawnTaoistFiend(player, player.x, player.y, 6.2, 22);
        if (typeof player.addEnergy === 'function') player.addEnergy(8);
        return true;
      },
      onHandCounter(defender, attacker) {
        defender._fiendSummonFlashTimer = 0.55;
        spawnTaoistFiend(defender, defender.x, defender.y, 6.5, 22);
        if (attacker && !attacker.isDead) {
          igniteTarget(defender, attacker, 13, 3.5);
          attacker.stunTimer = Math.max(attacker.stunTimer || 0, 0.75);
        }
      },
      onLegCounter(defender, attacker) {
        if (attacker && !attacker.isDead) {
          igniteTarget(defender, attacker, 13, 3.5);
          attacker.slowTimer = Math.max(attacker.slowTimer || 0, 2.0);
          attacker.speedMul = Math.min(attacker.speedMul || 1, 0.45);
        }
        if (window.effectManager && typeof window.effectManager.createFlameCoinSlash === 'function') {
          window.effectManager.createFlameCoinSlash(defender.x + (defender.facing || 1) * 44, (defender.y || 580) - 65, defender.facing || 1, 0.25, 92);
        }
      },
      onAttackHit(attacker, defender) {
        if (!defender || defender.isDead || defender._skipPassiveTrigger) return;
        const alreadyBurning = (defender.burnTimer || 0) > 0;
        igniteTarget(attacker, defender, 12, 3.0);
        if (alreadyBurning) {
          triggerHapTinhSiphon(attacker, defender, 16, 5, 8);
        }
        const nextSeq = ((attacker._thienKhanhHitSeq || 0) + 1);
        if (nextSeq >= 4) {
          attacker._thienKhanhHitSeq = 0;
          attacker._fiendSummonFlashTimer = 0.55;
          spawnTaoistFiend(attacker, attacker.x, attacker.y, 6.0, 20);
        } else {
          attacker._thienKhanhHitSeq = nextSeq;
          attacker._fiendSummonFlashTimer = 0;
        }
      }
    },

    // =========================================================================
    // 6. TUYỆT KỸ THỰC CHIẾN (ULTIMATE: HUYẾT ĐẠO LUÂN HỒI TRẢM)
    // =========================================================================
    ultimateRuntime: {
      type: 'precision',
      cinematic: {
        title: 'CHÂU NGỌC THIÊN KHÁNH',
        ult: 'HUYẾT ĐẠO LUÂN HỒI TRẢM',
        color: '#dc2626',
        accent: '#facc15',
        style: 'fire',
        duration: 1.30
      },
      execute(player, st, dt, enemies, { p, hitEnemy }) {
        const fx = window.effectManager;
        const step = Math.floor(p * 4);
        if (step > 0 && step <= 3 && step !== player._ultStep) {
          player._ultStep = step;
          // Mỗi nhịp của Tuyệt Kỹ gọi 1 Hỏa Âm Binh lao ra chiến đấu!
          spawnTaoistFiend(player, player.x + (step - 2) * 32, player.y, 7.0, 24);

          let target = null;
          let min = 560;
          for (const e of enemies) {
            if (!e || e.isDead) continue;
            const d = Math.hypot(e.x - player.x, (e.y - player.y) * 1.4);
            if (d < min) { min = d; target = e; }
          }
          if (target) {
            if (fx) {
              fx.addGhostTrail(player, 'rgba(220, 38, 38, 0.85)');
              if (typeof fx.createFlameCoinSlash === 'function') {
                fx.createFlameCoinSlash(target.x, (target.y || 580) - 60, player.facing || 1, (step % 2 ? 0.35 : -0.35), 110);
              }
              fx.createShockRing(target.x, target.y, '#f97316');
            }
            const maxW = window.stageManager ? window.stageManager.stageWidth - 30 : 2570;
            player.x = Math.max(30, Math.min(maxW, target.x - (player.facing || 1) * 62));
            player.y = target.y;
            hitEnemy(target, 92, 10, false);
            igniteTarget(player, target, 14, 3.8);
          }
        }
        if (p >= 1) {
          if (fx) {
            fx.createUltimateBlast(player.x + (player.facing || 1) * 40, (player.y || 580) - 60, {
              primary: '#dc2626',
              secondary: '#facc15',
              flash: '#f97316'
            });
            fx.triggerScreenShake(18, 0.45);
          }
          for (const e of enemies) {
            if (e && !e.isDead && Math.hypot(e.x - player.x, (e.y - player.y) * 1.4) <= 280) {
              hitEnemy(e, 120, 16, true);
              igniteTarget(player, e, 16, 4.0);
            }
          }
          player.setState('idle');
        }
      }
    },

    // =========================================================================
    // 7. HỆ THỐNG ĐỒNG MINH CHI VIỆN (ALLY SUPPORT)
    // =========================================================================
    ally: {
      profile: {
        id: 'thienkhanh',
        name: 'Châu Ngọc Thiên Khánh',
        title: 'Tà Sư Bùa Ngải',
        icon: '🔥',
        role: 'Kiếm Xu & Triệu Hồi Âm Binh',
        roleColor: '#dc2626',
        styleType: 'boss_thienkhanh',
        speed: 225,
        dmg: 86,
        hp: 1080,
        quote: '“Nghe tiếng đồng xu va nhau trong biển lửa chưa?”',
        activeSkill: {
          name: 'Triệu Hoán Hỏa Âm Binh',
          cd: '5.5s',
          desc: 'Đốt cháy toàn bộ kẻ địch xung quanh bằng hiệu ứng Thiêu Đốt và phá rối đội hình.'
        },
        passiveAura: {
          name: 'Nghiệp Hỏa Bùa Ngải',
          desc: 'Cộng thêm +12% sát thương cho mọi đòn đánh của người chơi.'
        },
        coopSkill: {
          name: 'Song Kiếm Hỏa Ngục',
          desc: 'Vung Kiếm Xu thiêu rụi toàn bộ mục tiêu trong tầm rộng.'
        }
      },
      coopBaseDamage: 290,
      onUpdate(ally, dt, player, enemies) {
        if (player) {
          player.allyDamageBuff = Math.max(player.allyDamageBuff || 1, 1.12);
        }
        if (ally.specialTimer >= 5.5) {
          ally.specialTimer = 0;
          if (window.effectManager) {
            window.effectManager.createShockRing(ally.x, ally.y, '#dc2626');
            window.effectManager.addFloatingText('🔥 TÀ SƯ THIÊU ĐỐT!', ally.x, ally.y - 145, 'crit');
          }
          (enemies || []).forEach((e) => {
            if (e && !e.isDead && Math.hypot(e.x - ally.x, e.y - ally.y) <= 260) {
              e.takeDamage(54, 0, false);
              igniteTarget(ally, e, 14, 3.2);
            }
          });
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        target.takeDamage(dmg, isBossTarget ? 0 : ally.facing * 5, false);
        igniteTarget(ally, target, 12, 2.8);
        if (window.audioManager) window.audioManager.playPunchHit();
        if (window.effectManager) {
          window.effectManager.createHitSparks(target.x, target.y - 68, 9, true);
        }
      }
    }
  });
})();
