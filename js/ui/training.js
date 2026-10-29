/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/training.js - Chế độ Luyện Võ chuyên sâu: 7 bài tập võ học & Luyện tự do
 */

class TrainingDummy extends BaseEnemy {
  constructor(x, y) {
    super(x, y, 'brawler', 'Mộc Nhân Võ Đường');
    this.maxHp = 1000;
    this.hp = 1000;
    this.isTrainingDummy = true;
    this.styleType = 'dummy_wood'; // Hình nhân gỗ mộc nhân võ đường
    this.attackMode = 'idle'; // 'idle', 'telegraph_hand', 'telegraph_leg', 'sparring', 'free', 'guard'
    this.telegraphTimer = 0;
    this.telegraphDuration = 1.3;
    this.telegraphState = 'idle'; // 'idle', 'telegraph', 'active'
    this.attackType = 'hand'; // 'hand' or 'leg'
    this.hasStruckThisCycle = false;
  }

  update(dt, player) {
    this.animTime += dt;
    this.stateTimer += dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    // Giảm bộ đếm rung/méo hình khi trúng đòn (trước đây không giảm nên hình nộm rung mãi)
    if (this.hitJitterTimer > 0) this.hitJitterTimer = Math.max(0, this.hitJitterTimer - dt);
    if (this.squashTimer > 0) this.squashTimer = Math.max(0, this.squashTimer - dt);
    if (this.combatKnockbackTimer > 0) {
      this.combatKnockbackTimer -= dt;
      if (this.combatKnockbackTimer <= 0) this.isKnockedBack = false;
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
      }
    }

    // Hiệu ứng Xuất Huyết (Bleed DoT từ Mã Tấu)
    if (this.bleedTimer > 0 && !this.isDead) {
      this.bleedTimer -= dt;
      this.bleedTickTimer = (this.bleedTickTimer || 0) - dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.8;
        const tickDmg = this.bleedDmg || 6;
        this.hp = Math.max(1, this.hp - tickDmg);
        if (window.trainingManager && typeof window.trainingManager.recordDummyDamage === 'function') {
          window.trainingManager.recordDummyDamage(tickDmg);
        }
        if (window.effectManager) {
          window.effectManager.addFloatingText(`-${tickDmg} 🩸`, this.x, (this.y || 580) + (this.z || 0) - 120, 'bleed');
          window.effectManager.createHitSparks(this.x, (this.y || 580) + (this.z || 0) - 65, 4, false);
        }
      }
    }

    // Vật lý Z (rơi và nảy khi bị đánh bay lên không)
    if (this.z < 0 || this.vz !== 0) {
      this.z -= this.vz * dt;
      this.vz -= this.gravity * dt;
      if (this.z >= 0) {
        this.z = 0;
        this.vz = 0;
        if (window.effectManager && this.state === 'knockdown') window.effectManager.createDust(this.x, this.y, 6);
      }
    }

    // Ma sát trượt và cập nhật tọa độ di chuyển mượt mà
    const friction = Math.exp(-12 * dt);
    this.vx *= friction;
    this.vy *= friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Giữ hình nộm trong giới hạn sàn đấu
    this.y = Math.max(510, Math.min(640, this.y));
    if (window.game && window.game.arenaLocked) {
      this.x = Math.max(window.game.arenaMinX + 28, Math.min(window.game.arenaMaxX - 28, this.x));
    }

    // Luôn tự động hồi phục máu cho hình nhân tập luyện
    if (this.hp < this.maxHp && !this.isDead) {
      this.hp = Math.min(this.maxHp, this.hp + 380 * dt);
    }

    // Nếu bị đánh ngã hoặc máu về 0 -> lập tức hồi sinh và đứng dậy
    if (this.isDead) {
      this.isDead = false;
      this.hp = this.maxHp;
      this.setState('getup', 0.8);
      return;
    }

    if (this.state === 'knockdown' || this.state === 'getup') {
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle', 1.0);
      }
      return;
    }

    if (this.state === 'hurt') {
      if (this.stunTimer > 0) {
        this.vx = 0;
        this.vy = 0;
        return;
      }
      if (this.stateTimer >= this.stateDuration) {
        this.setState('idle', 1.0);
      }
      return;
    }

    // Luôn quay mặt về phía người chơi
    if (player) {
      this.facing = (player.x >= this.x) ? 1 : -1;
    }

    if (this.stunTimer > 0) {
      this.isAttacking = false;
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // Điều khiển chu kỳ ra đòn chuẩn nhịp để người chơi tập né và phản đòn
    if (this.attackMode === 'telegraph_hand' || this.attackMode === 'telegraph_leg') {
      const neededType = (this.attackMode === 'telegraph_hand') ? 'hand' : 'leg';
      this.attackType = neededType;
      this.telegraphTimer += dt;

      if (this.telegraphState === 'idle') {
        if (this.telegraphTimer >= 1.0) {
          this.telegraphState = 'telegraph';
          this.telegraphTimer = 0;
          this.telegraphDuration = 1.3;
          this.hasStruckThisCycle = false;
          this.setState(neededType === 'hand' ? 'counter_hand_prep' : 'counter_leg_prep', 1.3);
          if (window.audioManager) window.audioManager.playWarning();
          if (window.effectManager) {
            window.effectManager.createShockRing(this.x, this.y, neededType === 'leg' ? '#ffd700' : '#ff3344');
          }
        }
      } else if (this.telegraphState === 'telegraph') {
        if (this.telegraphTimer >= this.telegraphDuration) {
          // Tung đòn thực sự trong cửa sổ active
          this.telegraphState = 'active';
          this.telegraphTimer = 0;
          this.hasStruckThisCycle = false;
          this.setState(neededType === 'hand' ? 'punch_straight' : 'kick_roundhouse', 0.55);
          this.isAttacking = true;
          if (window.audioManager) window.audioManager.playWhoosh();
        }
      } else if (this.telegraphState === 'active') {
        // Thực hiện va chạm đòn với người chơi để kích hoạt né / đỡ / phản đòn
        if (!this.hasStruckThisCycle && player && window.combatSystem) {
          this.hasStruckThisCycle = true;
          const hitData = {
            damage: 2,
            counterType: neededType,
            isKick: (neededType === 'leg'),
            width: 85,
            height: 50,
            offsetX: 40,
            offsetY: neededType === 'leg' ? -45 : -70
          };
          window.combatSystem.checkAttackHit(this, player, hitData);
        }

        if (this.telegraphTimer >= 0.5) {
          this.telegraphState = 'idle';
          this.telegraphTimer = 0;
          this.isAttacking = false;
          this.setState('idle', 1.0);
        }
      }
    } else if (this.attackMode === 'guard') {
      this.isAttacking = false;
      this.vx = 0;
      if (player) this.facing = (player.x >= this.x) ? 1 : -1;
      // Chỉ vào thế thủ một lần (không reset hoạt ảnh mỗi frame)
      if (this.state !== 'guard') this.setState('guard');
    } else if (this.attackMode === 'sparring' || this.attackMode === 'free') {
      this._updateSparring(dt, player, this.attackMode === 'free');
    } else {
      this.isAttacking = false;
      this.vx = 0;
      if (this.state !== 'idle') this.setState('idle');
    }
  }

  // Bộ đòn theo kiểu hình nộm: có vũ khí thì dùng đòn vũ khí thay vì đấm đá tay không
  getAttackKit() {
    const armed = {
      boss_hoanganh: { reach: 125, moves: [
        { state: 'boss_swing', dur: 0.55, dmg: 14, counterType: 'hand', w: 150, ox: 85, oy: -78 },
        { state: 'boss_thrust', dur: 0.45, dmg: 11, counterType: 'hand', w: 105, ox: 90, oy: -80 }
      ] },
      boss_dinhan: { reach: 115, moves: [
        { state: 'boss_swing', dur: 0.55, dmg: 14, counterType: 'hand', w: 135, ox: 80, oy: -78 },
        { state: 'boss_thrust', dur: 0.45, dmg: 11, counterType: 'hand', w: 100, ox: 80, oy: -80 }
      ] },
      boss_haclang: { reach: 105, moves: [
        { state: 'boss_swing', dur: 0.45, dmg: 12, counterType: 'hand', w: 125, ox: 70, oy: -78 },
        { state: 'boss_thrust', dur: 0.4, dmg: 10, counterType: 'hand', w: 95, ox: 70, oy: -80 }
      ] },
      enemy_baton: { reach: 100, moves: [
        { state: 'boss_swing', dur: 0.5, dmg: 10, counterType: 'hand', w: 110, ox: 65, oy: -78 }
      ] },
      enemy_blade: { reach: 100, moves: [
        { state: 'boss_swing', dur: 0.45, dmg: 11, counterType: 'hand', w: 110, ox: 65, oy: -78 },
        { state: 'boss_thrust', dur: 0.4, dmg: 9, counterType: 'hand', w: 90, ox: 65, oy: -80 }
      ] }
    };
    const kit = armed[this.styleType];
    if (kit) return kit;
    return { reach: 100, moves: [
      { state: 'punch_straight', dur: 0.55, dmg: 10, counterType: 'hand', w: 80, ox: 40, oy: -62 },
      { state: 'kick_roundhouse', dur: 0.55, dmg: 12, counterType: 'leg', kick: true, w: 85, ox: 45, oy: -45 }
    ] };
  }

  // Đối kháng chủ động (sparring) / giao đấu nhẹ (free): áp sát, căn hàng, gồng đòn rồi mới ra đòn
  _updateSparring(dt, player, gentle) {
    this.sparCooldown = (this.sparCooldown === undefined ? 1.0 : this.sparCooldown) - dt;
    if (!player) return;
    const kit = this.getAttackKit();

    // Đang ra đòn: đứng yên, trúng đòn ở giữa chu kỳ, hết chu kỳ thì thu thế
    if (this.isAttacking) {
      this.vx = 0; this.vy = 0;
      if (!this.hasStruckThisCycle && this.stateTimer >= this.stateDuration * 0.5) {
        this.hasStruckThisCycle = true;
        const m = this.curMove;
        if (m && window.combatSystem) {
          window.combatSystem.checkAttackHit(this, player, {
            damage: gentle ? Math.ceil(m.dmg * 0.6) : m.dmg,
            counterType: m.counterType,
            isKick: !!m.kick,
            width: m.w, height: 55, offsetX: m.ox, offsetY: m.oy
          });
        }
      }
      if (this.stateTimer >= this.stateDuration) {
        this.isAttacking = false;
        this.setState('idle');
        this.sparCooldown = gentle ? 3.0 : 1.3 + Math.random() * 0.6;
      }
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    this.facing = dx >= 0 ? 1 : -1;
    const inRange = Math.abs(dx) < kit.reach && Math.abs(dy) < 28;

    if (!inRange && !(gentle && Math.abs(dx) > 260)) {
      // Áp sát theo cả trục x và y để đòn trúng được người chơi
      const standOff = kit.reach * 0.8;
      const mx = Math.abs(dx) > standOff ? Math.sign(dx) : 0;
      const my = Math.abs(dy) > 12 ? Math.sign(dy) : 0;
      this.vx = mx * 125;
      this.vy = my * 85;
      if (mx || my) { if (this.state !== 'walk') this.setState('walk'); }
      else if (this.state !== 'idle') this.setState('idle');
    } else {
      this.vx = 0; this.vy = 0;
      if (this.state !== 'idle') this.setState('idle');
      if (inRange && this.sparCooldown <= 0) {
        const m = kit.moves[Math.floor(Math.random() * kit.moves.length)];
        this.curMove = m;
        this.hasStruckThisCycle = false;
        this.setState(m.state, m.dur);
        if (window.audioManager) window.audioManager.playWhoosh();
      }
    }
  }

  takeDamage(amount, knockback = 0, isKnockdown = false) {
    if (this.attackMode === 'guard') {
      amount *= 0.25;
      if (window.audioManager) window.audioManager.playBlock();
      if (window.effectManager) window.effectManager.addFloatingText('ĐỠ ĐÒN!', this.x, this.y - 120, 'dodge');
    }
    // Ghi nhận sát thương vào bộ đo telemetry võ đường
    if (window.trainingManager) {
      window.trainingManager.recordDummyDamage(amount);
    }
    super.takeDamage(amount, knockback, isKnockdown);
    this.invincibleTimer = 0.05; // Đặt cực ngắn để không bao giờ bị flash trắng liên tục
    // Hồi lại máu ngay lập tức để không bao giờ chết vĩnh viễn
    if (this.hp <= 0) {
      this.hp = this.maxHp;
      this.isDead = false;
    }
  }

  setDummyStyle(styleType, name) {
    this.styleType = styleType || 'dummy_wood';
    this.name = name || 'Mộc Nhân Võ Đường';
    this.hp = this.maxHp;
    this.isDead = false;
    this.hitJitterTimer = 0;
    this.squashTimer = 0;
    this.weapon = null;
    this.heldWeapon = null;
    this.armed = false;
  }
}

// =========================================================================
// DANH SÁCH TOÀN BỘ 7 CAO THỦ LUYỆN VÕ (100% MỞ KHÓA TRONG VÕ ĐƯỜNG)
// =========================================================================
const TRAINING_CHARACTERS = [
  {
    id: 'nghi',
    name: 'Ngô Nhất Nghị',
    title: 'Sát Thần Việt Võ Đạo',
    faction: 'Vovinam',
    badge: '★ VOVINAM',
    icon: '🥋',
    color: '#00d2ff',
    image: 'assets/images/characters/char_hero_nghi.png',
    desc: 'Đòn chân kẹp cổ, combo liên hoàn, chưởng sấm sét'
  },
  {
    id: 'dinhan',
    name: 'Triệu Đình An',
    title: 'Thiết Bích Cận Vệ',
    faction: 'Họ Triệu',
    badge: '♛ TRIỆU GIA',
    icon: '🛡️',
    color: '#d4a017',
    image: 'assets/images/characters/char_dinhan.png',
    desc: 'Kim Cang Hộ Thể, Đỡ đòn phản chấn, Thủ cực kỳ vững'
  },
  {
    id: 'hoanganh',
    name: 'Phó Đặng Hoàng Anh',
    title: 'Trấn Thủ Đại Sơn',
    faction: 'Họ Phó',
    badge: '⬡ PHÓ GIA',
    icon: '⛰️',
    color: '#f59e0b',
    image: 'assets/images/characters/char_hoanganh.png',
    desc: 'Trường đao trảm lôi, Super Armor càn quét diện rộng'
  },
  {
    id: 'bichlam',
    name: 'Đình Bích Lâm',
    title: 'Đồng Minh Ngang Tàng',
    faction: 'Du Hiệp',
    badge: '✧ DU HIỆP',
    icon: '🌪️',
    color: '#22c55e',
    image: 'assets/images/characters/char_bichlam.png',
    desc: 'Cuồng phong quyền cước, áp sát tốc độ, phản công đẩy văng'
  },
  {
    id: 'dunghai',
    name: 'Phó Dung Hải',
    title: 'Kẻ Bị Khai Trừ',
    faction: 'Độc Hành',
    badge: '⬡ ĐỘC HÀNH',
    icon: '🗡️',
    color: '#84cc16',
    image: 'assets/images/characters/char_dunghai.png',
    desc: 'Song đao xuất huyết, phi tiêu tầm xa, biến ảo khôn lường'
  },
  {
    id: 'huavudai',
    name: 'Hứa Vũ Đại',
    title: 'Ông Trùm Mạng Lưới Ngầm',
    faction: 'Hứa Gia',
    badge: '◈ HỨA GIA',
    icon: '👑',
    color: '#ef4444',
    image: 'assets/images/characters/char_huavudai.png',
    desc: 'Quyền trượng trấn áp, hào quang lãnh tụ, triệu hồi hỏa lực'
  },
  {
    id: 'giangmanh',
    name: 'Ngô Giang Mạnh',
    title: 'Gia Chủ Bóng Tối',
    faction: 'Họ Ngô',
    badge: '◆ NGÔ GIA',
    icon: '❄️',
    color: '#38bdf8',
    image: 'assets/images/characters/char_giangmanh.png',
    desc: 'Thiết sa chưởng, kiếm khí băng hàn, phản công trừng phạt'
  }
];
if (typeof window !== 'undefined') {
  window.TRAINING_CHARACTERS = TRAINING_CHARACTERS;
}

class TrainingManager {
  constructor() {
    this.isActive = false;
    this.mode = 'free'; // Mặc định 'free' (tự do) | 'drill' (khảo hạch)
    this.currentDrillIndex = 0;
    this.dummy = null;
    this.drillProgress = 0;
    this.drillTarget = 1;
    this.overlay = null;
    this.noCooldown = false;
    this.playerGodMode = true; // Bất tử cho người chơi trong võ đường
    this.isMenuCollapsed = false;
    this.selectedTrainingChar = null;

    // Chống ghi nhận trùng lặp / nhảy cóc bài tập khi đánh dồn dập
    this._drillTransitioning = false;
    this._drillTransitionTimer = null;
    this.drillGraceTimer = 0;

    // Đo lường sát thương & combo (Fighting Game Telemetry)
    this.lastDamage = 0;
    this.currentComboDamage = 0;
    this.maxComboDamage = 0;
    this.maxComboHits = 0;

    // Bắt sự kiện bàn phím toàn cục:
    // [C]: Bật / Tắt menu tùy biến
    // [R]: Đặt lại vị trí đấu trường (Reset Position)
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.repeat) return; // Chống spam khi giữ phím
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        if (e.code === 'Escape') {
          e.target.blur();
        }
        return;
      }
      if (e.code === 'KeyC') {
        e.preventDefault();
        this.toggleMenuCollapse();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.resetPositions();
      }
    });

    // Định nghĩa 7 bài tập võ thuật
    this.drills = [
      {
        id: 'drill_move_attack',
        title: 'BÀI 1: DI CHUYỂN & TẤN CÔNG CƠ BẢN',
        desc: 'Làm quen bộ pháp và đòn quyền cước Vovinam.',
        keys: '<kbd>A</kbd> <kbd>D</kbd> <kbd>W</kbd> <kbd>S</kbd> + Đấm <kbd>J</kbd> (3 lần) & Đá <kbd>K</kbd> (3 lần)',
        target: 6,
        type: 'combo_count',
        dummyMode: 'idle',
        hint: 'Bấm W/S để di chuyển theo chiều sâu sàn đấu. Bấm J để đấm thẳng, K để đá tống.'
      },
      {
        id: 'drill_dodge',
        title: 'BÀI 2: NÉ THÂN PHÁP (PERFECT DODGE)',
        desc: 'Nhìn nhịp chuẩn bị của đối thủ, bấm Né đúng lúc để kích hoạt Thân Pháp Vô Lỗi.',
        keys: 'Bấm <kbd>L</kbd> (hoặc <kbd>Shift</kbd>) khi thanh nhịp chuyển sang VÙNG HOÀN HẢO',
        target: 3,
        type: 'dodge_count',
        dummyMode: 'telegraph_hand',
        hint: 'Khi mộc nhân chuẩn bị vung tay (thanh đỏ đầy), bấm L ngay tức thì để né hoàn hảo!'
      },
      {
        id: 'drill_counter_hand',
        title: 'BÀI 3: ĐỠ & PHẢN ĐÒN TAY VOVINAM',
        desc: 'Đón đầu đòn đấm của đối thủ bằng thế bắt tay / chỏ lật phá thế.',
        keys: 'Nhấn <kbd>U</kbd> + <kbd>J</kbd> khi mộc nhân vung đòn tay',
        target: 2,
        type: 'counter_hand_count',
        dummyMode: 'telegraph_hand',
        hint: 'Quan sát vệt sáng tay đối thủ, bấm đồng thời U và J để phản đòn tay.'
      },
      {
        id: 'drill_counter_leg',
        title: 'BÀI 4: GẠT & PHẢN ĐÒN CHÂN VOVINAM',
        desc: 'Gạt cước đối thủ và quét ngã phá trụ cực kỳ uy lực.',
        keys: 'Nhấn <kbd>U</kbd> + <kbd>K</kbd> khi mộc nhân vung đòn chân',
        target: 2,
        type: 'counter_leg_count',
        dummyMode: 'telegraph_leg',
        hint: 'Quan sát mộc nhân chuẩn bị đá quét, nhấn U và K để gạt chân quét ngã!'
      },
      {
        id: 'drill_combos',
        title: 'BÀI 5: BỘ PHÁP LIÊN HOÀN COMBO',
        desc: 'Thực hiện các chuỗi liên hoàn quyền cước: J -> J -> K hoặc J -> K -> K.',
        keys: '<kbd>J</kbd> → <kbd>J</kbd> → <kbd>K</kbd> (Liên Hoàn Quyền Cước)',
        target: 2,
        type: 'combos_executed',
        dummyMode: 'idle',
        hint: 'Đánh nhịp nhàng từng đòn một để chuỗi combo kết nối dứt khoát!'
      },
      {
        id: 'drill_ultimate',
        title: 'BÀI 6: TUYỆT KỸ VOVINAM (LONG HỔ XUẤT SƠN)',
        desc: 'Tập trung nội lực Vovinam và giải phóng toàn bộ sát thương hủy diệt.',
        keys: 'Nhấn <kbd>I</kbd> khi thanh năng lượng sáng rực 100%',
        target: 1,
        type: 'ultimate_hit',
        dummyMode: 'idle',
        hint: 'Thanh năng lượng đã được nạp đầy sẵn. Nhấn phím I để kích hoạt tuyệt kỹ!'
      },
      {
        id: 'drill_ally',
        title: 'BÀI 7: GỌI ĐỒNG MINH HỖ TRỢ CHIẾN ĐẤU',
        desc: 'Hợp đồng tác chiến cùng chiến hữu trên chiến trường.',
        keys: 'Nhấn <kbd>H</kbd> hoặc <kbd>T</kbd> để triệu hồi đồng minh chi viện',
        target: 1,
        type: 'ally_summon',
        dummyMode: 'idle',
        hint: 'Bấm phím H hoặc T để đồng minh xuất trận cùng bạn tung đòn liên kết!'
      }
    ];

    this.stats = {
      punches: 0,
      kicks: 0,
      dodges: 0,
      countersHand: 0,
      countersLeg: 0,
      combosDone: 0,
      ultimates: 0,
      alliesCalled: 0
    };
  }

  showModeSelectModal() {
    let modal = document.getElementById('training-mode-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'training-mode-modal';
      modal.className = 'modal-overlay hidden';
      document.body.appendChild(modal);
    }

    const savedChar = (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    if (!this.selectedTrainingChar) {
      this.selectedTrainingChar = savedChar;
    }
    const activeChar = this.selectedTrainingChar;

    modal.innerHTML = `
      <div class="modal-card wide-card training-mode-modal-card">
        <div class="training-modal-header">
          <div class="t-modal-title-wrap">
            <span class="t-modal-badge">🥋 VÕ ĐƯỜNG VOVINAM</span>
            <h2 class="modal-title t-modal-title">CHỌN CHẾ ĐỘ & VÕ SĨ LUYỆN TẬP</h2>
          </div>
          <button id="btn-close-training-modal-x" class="modal-close-icon" title="Đóng [ESC]">✕</button>
        </div>

        <!-- 1. Bảng Chọn Toàn Bộ 7 Cao Thủ Võ Thuật -->
        <div class="training-char-pick-section">
          <div class="t-char-section-header">
            <div class="t-char-section-title-wrap">
              <span class="t-char-section-icon">🥋</span>
              <div>
                <span class="t-char-section-title">CHỌN VÕ SĨ XUẤT TRẬN</span>
                <span class="t-char-section-sub">Mở khóa 100% toàn bộ 7 võ sĩ — Thử nghiệm đòn thế tự do không giới hạn</span>
              </div>
            </div>
            <span class="t-char-badge-full">FULL 7 CAO THỦ ⚡</span>
          </div>

          <div class="training-char-grid" id="training-char-grid">
            ${TRAINING_CHARACTERS.map(c => {
              const isSel = (c.id === activeChar);
              return `
                <div class="t-char-pick-card ${isSel ? 'selected' : ''}" data-char-id="${c.id}" style="--char-theme: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <div class="t-char-avatar-wrap">
                    <img src="${c.image}" alt="${c.name}" class="t-char-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="t-char-avatar-fallback" style="display:none;">${c.icon}</div>
                    <span class="t-char-faction-pill" style="border-color: ${c.color}; color: ${c.color};">${c.badge}</span>
                  </div>
                  <div class="t-char-card-body">
                    <div class="t-char-card-name" style="color: ${c.color};">${c.name}</div>
                    <div class="t-char-card-title">${c.title}</div>
                    <div class="t-char-card-desc">${c.desc}</div>
                  </div>
                  <div class="t-char-card-status">
                    ${isSel ? '<span class="status-active">✓ ĐANG CHỌN</span>' : '<span class="status-idle">CHỌN VÕ SĨ</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <p class="t-modal-subtitle" style="margin-top: 14px;">Tùy chọn hình thức rèn luyện theo mong muốn của bạn:</p>

        <div class="training-mode-cards-grid">
          <!-- Chế độ 1: Luyện Tập Tự Do (Sandbox) -->
          <div class="training-mode-pick-card free-pick">
            <div class="mode-pick-header">
              <span class="mode-pill-badge gold">⚡ KHUYÊN DÙNG</span>
              <span class="mode-pick-icon">⚡</span>
            </div>
            <h3 class="mode-pick-title">LUYỆN TẬP TỰ DO</h3>
            <p class="mode-pick-desc">Vào thẳng võ đường tự do không bị ép làm lại các bài tập. Thử combo, đổi bất kỳ hình nộm hay Boss nào, bật Không Hồi Chiêu & Bất Tử.</p>
            <ul class="mode-pick-bullets">
              <li>✓ Tự do điều khiển mọi võ sĩ & thử combo</li>
              <li>✓ Chỉnh hành vi hình nộm: Đứng yên, Đỡ đòn, Đối kháng 🥊</li>
              <li>✓ Bật/Tắt Không Hồi Chiêu & Bất Tử tùy ý</li>
              <li>✓ Bảng đo lường sát thương & kỷ lục chuỗi Combo</li>
            </ul>
            <button id="btn-modal-start-free" class="btn btn-primary mode-start-btn">
              VÀO LUYỆN TỰ DO ⚡
            </button>
          </div>

          <!-- Chế độ 2: 7 Bài Khảo Hạch Võ Thuật -->
          <div class="training-mode-pick-card drill-pick">
            <div class="mode-pick-header">
              <span class="mode-pill-badge cyan">🥋 7 BÀI TẬP</span>
              <span class="mode-pick-icon">🥋</span>
            </div>
            <h3 class="mode-pick-title">7 BÀI KHẢO HẠCH VÕ THUẬT</h3>
            <p class="mode-pick-desc">Rèn luyện chuyên sâu 7 kỹ năng võ thuật chuẩn mực: Quyền cước, Né hoàn hảo, Phản đòn tay/chân [U+J / U+K], Combo, Tuyệt kỹ nộ và Triệu hồi viện trợ.</p>
            <div class="modal-drill-select-box">
              <label for="modal-drill-select">CHỌN BÀI TẬP BẮT ĐẦU:</label>
              <select id="modal-drill-select" class="training-select">
                ${this.drills.map((d, i) => `
                  <option value="${i}" ${i === this.currentDrillIndex ? 'selected' : ''}>
                    ${d.title}
                  </option>
                `).join('')}
              </select>
            </div>
            <button id="btn-modal-start-drill" class="btn btn-secondary mode-start-btn">
              BẮT ĐẦU KHẢO HẠCH 🥋
            </button>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 14px; justify-content: flex-end;">
          <button id="btn-close-training-modal-btn" class="btn btn-ghost btn-sm">ĐÓNG [ESC]</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    // Sự kiện chọn võ sĩ trong bảng 7 cao thủ
    const charCards = (typeof modal.querySelectorAll === 'function') ? modal.querySelectorAll('.t-char-pick-card') : [];
    charCards.forEach(card => {
      card.addEventListener('click', () => {
        const charId = card.getAttribute('data-char-id');
        if (!charId) return;
        this.selectedTrainingChar = charId;
        if (window.saveManager) {
          window.saveManager.data.selectedCharacter = charId;
          window.saveManager.persist();
        }
        charCards.forEach(c => {
          c.classList.remove('selected');
          const st = c.querySelector('.t-char-card-status');
          if (st) st.innerHTML = '<span class="status-idle">CHỌN VÕ SĨ</span>';
        });
        card.classList.add('selected');
        const st = card.querySelector('.t-char-card-status');
        if (st) st.innerHTML = '<span class="status-active">✓ ĐANG CHỌN</span>';
        if (window.audioManager) {
          if (typeof window.audioManager.playSkill === 'function') window.audioManager.playSkill();
        }
      });
    });

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    const btnCloseX = modal.querySelector('#btn-close-training-modal-x');
    if (btnCloseX) btnCloseX.addEventListener('click', closeModal);
    const btnCloseBtn = modal.querySelector('#btn-close-training-modal-btn');
    if (btnCloseBtn) btnCloseBtn.addEventListener('click', closeModal);

    const btnStartFree = modal.querySelector('#btn-modal-start-free');
    if (btnStartFree) {
      btnStartFree.addEventListener('click', () => {
        closeModal();
        if (window.menuManager) window.menuManager.hideAll();
        if (window.uiManager) window.uiManager.hideTitleScreen();
        this.startTraining('free', 0, this.selectedTrainingChar);
      });
    }

    const btnStartDrill = modal.querySelector('#btn-modal-start-drill');
    const selDrill = modal.querySelector('#modal-drill-select');
    if (btnStartDrill) {
      btnStartDrill.addEventListener('click', () => {
        const idx = selDrill ? parseInt(selDrill.value, 10) : 0;
        closeModal();
        if (window.menuManager) window.menuManager.hideAll();
        if (window.uiManager) window.uiManager.hideTitleScreen();
        this.startTraining('drill', idx, this.selectedTrainingChar);
      });
    }
  }

  startTraining(mode = 'free', drillIndex = 0, charId = null) {
    this.isActive = true;
    this.mode = mode;
    this.currentDrillIndex = typeof drillIndex === 'number' ? drillIndex : 0;
    this.drillProgress = 0;
    this._drillTransitioning = false;
    if (this._drillTransitionTimer) {
      clearTimeout(this._drillTransitionTimer);
      this._drillTransitionTimer = null;
    }
    this.drillGraceTimer = 0.2;
    this.playerGodMode = true; // Luôn bảo hộ người chơi an toàn trong võ đường
    this.lastDamage = 0;
    this.currentComboDamage = 0;
    this.maxComboDamage = 0;
    this.maxComboHits = 0;

    // Reset sạch sẽ đồng minh nếu có từ trước
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }

    const game = window.game;
    if (!game) return;

    // Tắt mưa hoàn toàn trong võ đường
    if (window.effectManager) {
      window.effectManager.isRaining = false;
      window.effectManager.rainDrops = [];
    }

    // Chọn nhân vật xuất trận trong võ đường (ưu tiên charId -> selectedTrainingChar -> saveManager -> 'nghi')
    const targetChar = charId || this.selectedTrainingChar || (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    this.selectedTrainingChar = targetChar;
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = targetChar;
      window.saveManager.persist();
    }

    if (game.player) {
      if (typeof game.player.setCharacter === 'function') game.player.setCharacter(targetChar);
      if (typeof game.player.reset === 'function') game.player.reset(360, 580);
      else { game.player.x = 360; game.player.y = 580; }
      game.player.facing = 1;
      game.player.hp = game.player.maxHp || 1000;
      game.player.energy = 100;
      game.player.guardGauge = 100;
      game.player.dodgeCooldown = 0;
      game.player.counterCooldown = 0;
      game.player.counterHandCooldown = 0;
      game.player.counterLegCooldown = 0;
    }

    // Cập nhật mục tiêu và banner Bái Tổ Vovinam
    if (window.uiManager) {
      window.uiManager.hideTitleScreen();
      window.uiManager.showHUD();
      window.uiManager.hideBossHUD();
      if (game.player) window.uiManager.setCharacterHUD(game.player);
      window.uiManager.setObjective(this.mode === 'free' ? '⚡ VÕ ĐƯỜNG VOVINAM — LUYỆN TẬP TỰ DO' : '🥋 VÕ ĐƯỜNG VOVINAM — KHẢO HẠCH VÕ HỌC');
      window.uiManager.showAlertBanner('🥋 BÀN TAY THÉP ĐẶT LÊN TRÁI TIM TỪ ÁI');
    }

    game.state = 'TRAINING';
    game.arenaLocked = true;
    game.arenaMinX = 50;
    game.arenaMaxX = 1400;

    // Sinh Mộc Nhân ở cự ly vàng đối luyện (cách người chơi 140px)
    this.dummy = new TrainingDummy(500, 580);
    this.dummy.facing = -1;
    game.enemies = [this.dummy];
    game.currentBoss = null;

    // Reset Camera
    game.camera.x = 0;
    game.camera.y = 0;

    if (this.mode === 'drill') {
      this.setupDrill(this.currentDrillIndex);
    } else {
      this.dummy.attackMode = 'idle';
      this.updateOverlayUI();
    }
    this.showOverlay();

    if (window.audioManager) {
      window.audioManager.setBGMIntensity(0.8);
      window.audioManager.playSkill();
      if (typeof window.audioManager.playVovinamKiai === 'function') {
        window.audioManager.playVovinamKiai('salute');
      }
    }
  }

  switchToFreeMode() {
    this.mode = 'free';
    if (this.dummy) {
      this.dummy.attackMode = 'idle';
      this.dummy.state = 'idle';
    }
    if (window.uiManager) {
      window.uiManager.hideBossHUD();
      window.uiManager.setObjective('⚡ VÕ ĐƯỜNG VOVINAM — LUYỆN TẬP TỰ DO');
      window.uiManager.showToast('⚡ Đã chuyển sang: Luyện Tập Tự Do');
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
    this.updateOverlayUI();
  }

  switchToDrillMode(drillIndex = 0) {
    this.mode = 'drill';
    this.setupDrill(typeof drillIndex === 'number' ? drillIndex : this.currentDrillIndex);
    if (window.uiManager) {
      window.uiManager.hideBossHUD();
      window.uiManager.setObjective('🥋 VÕ ĐƯỜNG VOVINAM — KHẢO HẠCH VÕ HỌC');
      window.uiManager.showToast(`🥋 Đã chuyển sang: 7 Bài Khảo Hạch (${this.drills[this.currentDrillIndex].title})`);
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      window.audioManager.playChime();
    }
  }

  resetPositions() {
    const game = window.game;
    if (!game) return;
    const p = game.player;
    if (p) {
      p.x = 360;
      p.y = 580;
      p.z = 0;
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
      p.facing = 1;
      p.state = 'idle';
      p.stateTimer = 0;
      p.stateDuration = 0;
      p.isAttacking = false;
      if (p.hitTargets && typeof p.hitTargets.clear === 'function') p.hitTargets.clear();
      p.hp = p.maxHp || 100;
      if (this.noCooldown) p.energy = p.maxEnergy || 100;
      if (window.uiManager) {
        window.uiManager.updatePlayerHp(p.hp, p.maxHp || 100);
        window.uiManager.updatePlayerEnergy(p.energy, p.maxEnergy || 100);
      }
    }
    if (this.dummy) {
      this.dummy.x = 500;
      this.dummy.y = 580;
      this.dummy.z = 0;
      this.dummy.vx = 0;
      this.dummy.vy = 0;
      this.dummy.vz = 0;
      this.dummy.facing = -1;
      this.dummy.state = 'idle';
      this.dummy.stateTimer = 0;
      this.dummy.stateDuration = 0;
      this.dummy.isAttacking = false;
      this.dummy.isDead = false;
      this.dummy.hp = this.dummy.maxHp;
      this.dummy.invincibleTimer = 0;
      this.dummy.telegraphTimer = 0;
      this.dummy.telegraphState = 'idle';
      this.dummy.stunTimer = 0;
      this.dummy.bleedTimer = 0;
      this.dummy.bleedTickTimer = 0;
      this.dummy.bleedDmg = 0;
    }
    if (game.camera) {
      game.camera.x = 0;
      game.camera.y = 0;
    }
    if (window.effectManager) {
      window.effectManager.createShockRing(360, 580, '#00d2ff');
      window.effectManager.createShockRing(500, 580, '#ffd700');
      window.effectManager.addFloatingText('ĐẶT LẠI VỊ TRÍ [R]', 430, 480, 'heal');
    }
    if (window.audioManager && typeof window.audioManager.playWhoosh === 'function') {
      window.audioManager.playWhoosh();
    }
    this.currentComboDamage = 0;
    this.updateOverlayUI();
  }

  recordDummyDamage(amount) {
    const dmg = Math.round(amount || 0);
    this.lastDamage = dmg;
    this.currentComboDamage += dmg;
    if (this.currentComboDamage > this.maxComboDamage) {
      this.maxComboDamage = this.currentComboDamage;
    }

    const currentHits = (window.combatSystem && window.combatSystem.comboCount) ? window.combatSystem.comboCount : 1;
    if (currentHits > this.maxComboHits) {
      this.maxComboHits = currentHits;
    }

    // Cập nhật ngay lập tức các phần tử DOM telemetry nếu đang hiển thị
    const elLast = document.getElementById('telemetry-last-dmg');
    if (elLast) elLast.textContent = this.lastDamage;
    const elCombo = document.getElementById('telemetry-combo-dmg');
    if (elCombo) elCombo.textContent = this.currentComboDamage;
    const elMax = document.getElementById('telemetry-max-combo');
    if (elMax) elMax.textContent = `${this.maxComboHits} Hits (${this.maxComboDamage} dmg)`;
  }

  setupDrill(index) {
    if (this._drillTransitionTimer) {
      clearTimeout(this._drillTransitionTimer);
      this._drillTransitionTimer = null;
    }
    this._drillTransitioning = false;
    this.drillGraceTimer = 0.25;

    if (index >= this.drills.length) {
      this.finishAllDrills();
      return;
    }

    this.currentDrillIndex = index;
    const drill = this.drills[index];
    this.drillProgress = 0;
    this.drillTarget = drill.target;

    const game = window.game;
    if (game && game.player) {
      if (typeof game.player.reset === 'function') {
        game.player.reset(360, 580);
      } else {
        game.player.x = 360;
        game.player.y = 580;
      }
      game.player.facing = 1;
      game.player.hp = game.player.maxHp || 100;
      game.player.comboStep = 0;
      game.player.queuedCombo = false;
      if (game.player.hitTargets && typeof game.player.hitTargets.clear === 'function') {
        game.player.hitTargets.clear();
      }
    }

    // Xóa bộ đệm phím để các đòn bấm ở bài trước không rơi sang bài mới
    if (window.input) {
      if (typeof window.input.clearAll === 'function') {
        window.input.clearAll();
      } else {
        window.input.actionBuffer = [];
        window.input.justPressed = {};
        window.input.keys = {};
      }
    }

    if (this.dummy) {
      this.dummy.x = 500;
      this.dummy.y = 580;
      this.dummy.facing = -1;
      this.dummy.attackMode = drill.dummyMode;
      this.dummy.telegraphTimer = 0;
      this.dummy.telegraphState = 'idle';
      this.dummy.invincibleTimer = 0;
      this.dummy.hitJitterTimer = 0;
      this.dummy.squashTimer = 0;
      this.dummy.state = 'idle';
      this.dummy.hp = this.dummy.maxHp;
      this.dummy.isDead = false;
      this.dummy.isAttacking = false;
      this.dummy.hasStruckThisCycle = false;
      this.dummy.stunTimer = 0;
      this.dummy.bleedTimer = 0;
      this.dummy.bleedTickTimer = 0;
      this.dummy.bleedDmg = 0;
      // Đánh dấu người chơi đã hit dummy cho đòn hiện tại (nếu đang vung dở) để không tính vào bài mới
      if (game && game.player && game.player.hitTargets && typeof game.player.hitTargets.add === 'function') {
        game.player.hitTargets.add(this.dummy.id);
      }
    }

    // Đặc biệt ở bài tuyệt kỹ: nạp đầy năng lượng
    if (drill.id === 'drill_ultimate' && window.game && window.game.player) {
      window.game.player.energy = window.game.player.maxEnergy;
      if (window.uiManager) window.uiManager.updatePlayerEnergy(100, 100);
    }

    // Đặc biệt ở bài đồng minh: mở tạm đồng minh để tập
    if (drill.id === 'drill_ally') {
      if (window.game) window.game.allyCooldown = 0;
      if (window.allyManager) {
        if (typeof window.allyManager.reset === 'function') window.allyManager.reset();
        window.allyManager.gauge = 100;
        window.allyManager.isReady = true;
        window.allyManager.updateHUD();
      }
    } else {
      // Các bài khác: thu hồi đồng minh nếu còn sót
      if (window.allyManager && typeof window.allyManager.reset === 'function') {
        window.allyManager.reset();
      }
    }

    this.updateOverlayUI();
  }

  recordAction(actionType, detail = {}) {
    if (!this.isActive) return;
    if (this._drillTransitioning || this.drillGraceTimer > 0) return;
    const drill = this.drills[this.currentDrillIndex];

    if (this.mode === 'drill' && drill) {
      let matched = false;

      if (drill.id === 'drill_move_attack') {
        if (actionType === 'punch' || actionType === 'kick') {
          this.drillProgress++;
          matched = true;
        }
      } else if (drill.id === 'drill_dodge' && actionType === 'perfect_dodge') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_counter_hand' && actionType === 'counter_hand') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_counter_leg' && actionType === 'counter_leg') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_combos' && actionType === 'combo_finished') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_ultimate' && actionType === 'ultimate_hit') {
        this.drillProgress++;
        matched = true;
      } else if (drill.id === 'drill_ally' && actionType === 'ally_summon') {
        this.drillProgress++;
        matched = true;
      }

      if (matched) {
        this.drillProgress = Math.min(this.drillTarget, this.drillProgress);
        if (window.effectManager) {
          window.effectManager.addFloatingText(`TIẾN ĐỘ: ${this.drillProgress}/${this.drillTarget}`, window.game.player.x, window.game.player.y - 140, 'heal');
        }
        if (window.audioManager) window.audioManager.playChime();
        this.updateOverlayUI();

        if (this.drillProgress >= this.drillTarget) {
          this.completeCurrentDrill();
        }
      }
    }
  }

  completeCurrentDrill() {
    if (this._drillTransitioning) return;
    this._drillTransitioning = true;
    this.drillProgress = this.drillTarget;

    const drill = this.drills[this.currentDrillIndex];
    if (window.saveManager) {
      window.saveManager.recordTrainingDrill(drill.id);
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner(`HOÀN THÀNH: ${drill.title}`);
    }
    if (window.audioManager) {
      window.audioManager.playVictory();
    }

    if (this._drillTransitionTimer) clearTimeout(this._drillTransitionTimer);
    this._drillTransitionTimer = setTimeout(() => {
      this._drillTransitionTimer = null;
      if (this.isActive && this.mode === 'drill') {
        this.setupDrill(this.currentDrillIndex + 1);
      }
    }, 1400);
  }

  finishAllDrills() {
    this.mode = 'free';
    if (window.saveManager) {
      window.saveManager.unlockTrainingFree();
      window.saveManager.unlockAchievement('training_master');
    }
    if (this.dummy) {
      this.dummy.attackMode = 'free';
    }
    if (window.uiManager) {
      window.uiManager.showAlertBanner('TỐT NGHIỆP LUYỆN VÕ — MỞ KHÓA LUYỆN TỰ DO!');
    }
    this.updateOverlayUI();
  }

  skipToFreeTraining() {
    if (window.saveManager) {
      window.saveManager.unlockTrainingFree();
    }
    this.finishAllDrills();
  }

  quitTraining() {
    this.isActive = false;
    this.noCooldown = false;
    this._drillTransitioning = false;
    if (this._drillTransitionTimer) {
      clearTimeout(this._drillTransitionTimer);
      this._drillTransitionTimer = null;
    }
    this.drillGraceTimer = 0;
    if (window.allyManager && typeof window.allyManager.reset === 'function') {
      window.allyManager.reset();
    }
    this.hideOverlay();
    const game = window.game;
    if (game) {
      if (typeof game.returnToMenu === 'function') {
        game.returnToMenu();
      } else {
        game.state = 'MENU';
        game.previousState = 'MENU';
        game.enemies = [];
        game.currentBoss = null;
        game.arenaLocked = false;
        if (window.uiManager) {
          window.uiManager.hideBossHUD();
          window.uiManager.showTitleScreen();
        }
        if (window.audioManager) {
          window.audioManager.stopBGM();
        }
      }
    }
  }

  setNoCooldown(enabled) {
    this.noCooldown = !!enabled;
    const p = window.game && window.game.player;
    if (this.noCooldown && p) {
      p.energy = p.maxEnergy;
      p.dodgeCooldown = 0;
      p.counterCooldown = 0;
      if (window.uiManager) window.uiManager.updatePlayerEnergy(p.energy, p.maxEnergy);
    }
    if (this.noCooldown && window.allyManager) {
      window.allyManager.cooldown = 0;
      window.allyManager.gauge = window.allyManager.maxGauge;
      window.allyManager.updateHUD();
    }
    if (window.uiManager) {
      window.uiManager.showToast(this.noCooldown ? '⚡ KHÔNG HỒI CHIÊU: ĐÃ BẬT' : '⚡ KHÔNG HỒI CHIÊU: ĐÃ TẮT');
    }
    this.updateOverlayUI();
  }

  setPlayerGodMode(enabled) {
    this.playerGodMode = !!enabled;
    const p = window.game && window.game.player;
    if (this.playerGodMode && p) {
      p.hp = p.maxHp;
      if (window.uiManager) window.uiManager.updatePlayerHp(p.hp, p.maxHp);
    }
    if (window.uiManager) {
      window.uiManager.showToast(this.playerGodMode ? '🩸 BẤT TỬ NGƯỜI CHƠI: ĐÃ BẬT' : '🩸 BẤT TỬ NGƯỜI CHƠI: ĐÃ TẮT');
    }
    this.updateOverlayUI();
  }

  setPlayerCharacter(charId) {
    if (!window.game || !window.game.player) return;
    const p = window.game.player;
    this.selectedTrainingChar = charId;
    p.setCharacter(charId);
    p.hp = p.maxHp;
    p.energy = p.maxEnergy;
    p.guardGauge = 100;
    p.dodgeCooldown = 0;
    p.counterCooldown = 0;
    p.counterHandCooldown = 0;
    p.counterLegCooldown = 0;
    p.kickCooldown = 0;
    p.isAttacking = false;
    p.state = 'idle';
    p.stateTimer = 0;
    p.stateDuration = 0;

    if (window.uiManager) {
      window.uiManager.setCharacterHUD(p);
      window.uiManager.updatePlayerHp(p.hp, p.maxHp);
      window.uiManager.updatePlayerEnergy(p.energy, p.maxEnergy);
    }
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = charId;
      window.saveManager.persist();
    }
    const cMeta = TRAINING_CHARACTERS.find(c => c.id === charId);
    const cName = cMeta ? `${cMeta.name} (${cMeta.title})` : ((window.CHARACTERS && window.CHARACTERS[charId]) ? window.CHARACTERS[charId].name : charId);
    if (window.uiManager) window.uiManager.showToast(`🥋 Đã xuất trận: ${cName}!`);
    if (window.audioManager) {
      if (typeof window.audioManager.playSkill === 'function') window.audioManager.playSkill();
      if (typeof window.audioManager.playVovinamKiai === 'function') window.audioManager.playVovinamKiai('special');
    }
    this.updateOverlayUI();
  }

  setDummyArchetype(typeId) {
    if (!this.dummy) return;
    const names = {
      dummy_wood: 'Mộc Nhân Gỗ Võ Đường',
      thug: 'Côn Đồ Đường Phố',
      enemy_guard: 'Vệ Binh Giáp Trụ',
      enemy_dodger: 'Sát Thủ Thân Pháp',
      enemy_baton: 'Côn Đồ Gậy Điện',
      enemy_blade: 'Sát Thủ Mã Tấu',
      enemy_shield: 'Vệ Binh Khiên Bạo Động',
      boss_haclang: 'Boss Hắc Lang',
      boss_thietquyen: 'Boss Thiết Quyền',
      boss_hoanganh: 'Boss Phó Đặng Hoàng Anh',
      boss_dinhan: 'Boss Triệu Đình An',
      boss_longvuong: 'Boss Long Vương'
    };
    this.dummy.setDummyStyle(typeId, names[typeId] || 'Hình Nộm Thử Nghiệm');
    if (window.uiManager) {
      window.uiManager.hideBossHUD();
      window.uiManager.showToast(`Hình nộm đổi thành: ${names[typeId] || typeId}`);
    }
  }

  toggleMenuCollapse(forceState) {
    if (typeof forceState === 'boolean') {
      this.isMenuCollapsed = forceState;
    } else {
      this.isMenuCollapsed = !this.isMenuCollapsed;
    }
    this.updateOverlayUI();
    if (window.audioManager) {
      if (typeof window.audioManager.playSkill === 'function') window.audioManager.playSkill();
      else if (typeof window.audioManager.playWhoosh === 'function') window.audioManager.playWhoosh();
    }
  }

  showOverlay() {
    let el = document.getElementById('training-hud-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'training-hud-overlay';
      el.className = 'training-overlay';
      document.getElementById('ui-layer').appendChild(el);
    }
    el.classList.remove('hidden');
    this.overlay = el;
    this.updateOverlayUI();
  }

  hideOverlay() {
    const el = document.getElementById('training-hud-overlay');
    if (el) el.classList.add('hidden');
  }

  updateOverlayUI() {
    if (!this.overlay) return;
    const isDrill = (this.mode === 'drill');
    const drill = this.drills[this.currentDrillIndex];
    const curChar = (window.game && window.game.player && window.game.player.characterId) || this.selectedTrainingChar || (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    const activeHero = TRAINING_CHARACTERS.find(c => c.id === curChar) || TRAINING_CHARACTERS[0];

    // Trạng thái thu gọn (Collapsed): Hiển thị nút floating dock nhỏ gọn, không chắn màn hình
    if (this.isMenuCollapsed) {
      this.overlay.classList.add('collapsed');
      this.overlay.innerHTML = `
        <div class="training-floating-dock">
          <button id="btn-expand-training-menu" class="btn-training-expand-pill" title="Mở bảng tùy biến luyện võ (Phím tắt: [C])">
            <span class="pill-badge-glow"></span>
            <span class="pill-icon">${isDrill ? '🥋' : '⚡'}</span>
            <div class="pill-content">
              <span class="pill-title">${isDrill ? `BÀI ${this.currentDrillIndex + 1}: ${drill ? drill.title : 'HUẤN LUYỆN'}` : 'LUYỆN TẬP TỰ DO'}</span>
              <span class="pill-subtitle">Bấm để mở lại menu <kbd>[C]</kbd></span>
            </div>
            <span class="pill-chevron">🔼</span>
          </button>
        </div>
      `;
      const btnExpand = this.overlay.querySelector('#btn-expand-training-menu');
      if (btnExpand) btnExpand.addEventListener('click', () => this.toggleMenuCollapse(false));
      return;
    }

    this.overlay.classList.remove('collapsed');

    // Khung giao diện chính với Segmented Tabs chuyển đổi chế độ
    if (isDrill && drill) {
      this.overlay.innerHTML = `
        <div class="training-card free-training-card">
          <!-- 4 Góc đồng triện hoa văn cổ truyền Việt Nam -->
          <span class="vovinam-corner corner-tl"></span>
          <span class="vovinam-corner corner-tr"></span>
          <span class="vovinam-corner corner-bl"></span>
          <span class="vovinam-corner corner-br"></span>

          <div class="training-header">
            <div class="training-header-left">
              <span class="training-tag gold">⚡ VÕ ĐƯỜNG VOVINAM</span>
              <span class="training-step">BÀI ${this.currentDrillIndex + 1} / ${this.drills.length}</span>
            </div>
            <button id="btn-collapse-training-menu" class="btn-training-header-toggle" title="Thu gọn menu để không che tầm nhìn (Phím tắt: [C])">
              <span class="btn-toggle-icon">➖</span>
              <span class="btn-toggle-text">THU GỌN [C]</span>
            </button>
          </div>
          <div class="vovinam-sub-motto">CƯƠNG NHU PHỐI TRIỂN • VIỆT VÕ ĐẠO</div>

          <!-- Thanh Tabs chuyển đổi nhanh chế độ -->
          <div class="training-mode-tabs">
            <button id="tab-mode-free" class="t-mode-tab" title="Chuyển sang chế độ Luyện Tự Do (Sandbox)">
              <span class="tab-icon">⚡</span>
              <span class="tab-text">LUYỆN TẬP TỰ DO</span>
            </button>
            <button id="tab-mode-drills" class="t-mode-tab active" title="Đang ở chế độ Khảo Hạch 7 Bài Tập">
              <span class="tab-icon">🥋</span>
              <span class="tab-text">7 BÀI KHẢO HẠCH</span>
            </button>
          </div>

          <!-- Thanh Đổi Nhanh 7 Võ Sĩ Trong Trận -->
          <div class="training-quick-roster-bar" title="Đổi nhanh võ sĩ đang luyện tập">
            <div class="quick-roster-header">
              <span class="quick-roster-label">VÕ SĨ XUẤT TRẬN:</span>
              <span class="active-hero-badge" style="color: ${activeHero.color}; border-color: ${activeHero.color}60; background: ${activeHero.color}1c;">
                ${activeHero.icon} ${activeHero.name}
              </span>
            </div>
            <div class="quick-roster-pills">
              ${TRAINING_CHARACTERS.map(c => `
                <button class="quick-char-pill ${c.id === curChar ? 'active' : ''}" data-char-id="${c.id}" style="--pill-color: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <span class="pill-icon">${c.icon}</span>
                  <span class="pill-name">${c.name.split(' ').slice(-1)[0]}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Dropdown chọn nhanh bài tập bất kỳ -->
          <div class="training-drill-select-row">
            <label class="drill-select-label" for="training-drill-select">CHUYỂN BÀI TẬP:</label>
            <select id="training-drill-select" class="training-select">
              ${this.drills.map((d, i) => `
                <option value="${i}" ${i === this.currentDrillIndex ? 'selected' : ''}>
                  ${d.title}
                </option>
              `).join('')}
            </select>
          </div>

          <h2 class="training-title">${drill.title}</h2>
          <p class="training-desc">${drill.desc}</p>
          <div class="training-keys-box">
            <span class="keys-label">THỰC HIỆN:</span>
            <span class="keys-content">${drill.keys}</span>
          </div>

          <!-- Thanh tiến độ bài tập -->
          <div class="training-progress-row">
            <div class="t-bar-shell">
              <div class="t-bar-fill" style="width: ${(this.drillProgress / this.drillTarget) * 100}%"></div>
            </div>
            <span class="t-progress-text">${this.drillProgress} / ${this.drillTarget}</span>
          </div>

          <!-- Thanh Timing nếu là bài né / phản đòn -->
          ${(drill.id === 'drill_dodge' || drill.id === 'drill_counter_hand' || drill.id === 'drill_counter_leg') ? `
            <div class="training-timing-box">
              <span class="timing-label">NHỊP ĐÒN ĐỐI THỦ:</span>
              <div class="timing-meter-wrap">
                <div id="training-timing-meter" class="timing-meter"></div>
                <div class="perfect-window-marker">VÙNG HOÀN HẢO</div>
              </div>
            </div>
          ` : ''}

          <div class="training-hint">💡 ${drill.hint}</div>

          <div class="training-actions">
            <button id="btn-training-skip-drill" class="btn btn-primary btn-sm">BÀI TIẾP THEO ⏩</button>
            <button id="btn-training-reset-pos" class="btn btn-secondary btn-sm" title="Đặt lại vị trí nhân vật về xuất phát (Phím tắt: [R])">🔄 ĐẶT LẠI [R]</button>
            <button id="btn-collapse-training-menu-bottom" class="btn btn-ghost btn-sm" title="Thu gọn bảng hướng dẫn">👁️ ẨN BẢNG [C]</button>
            <button id="btn-training-quit" class="btn btn-ghost btn-sm btn-quit">✕ RỜI VÕ ĐƯỜNG</button>
          </div>
        </div>
      `;

      // Event bindings cho Drill mode
      const btnCollapse = this.overlay.querySelector('#btn-collapse-training-menu');
      if (btnCollapse) btnCollapse.addEventListener('click', () => this.toggleMenuCollapse(true));
      const btnCollapseBottom = this.overlay.querySelector('#btn-collapse-training-menu-bottom');
      if (btnCollapseBottom) btnCollapseBottom.addEventListener('click', () => this.toggleMenuCollapse(true));

      const tabFree = this.overlay.querySelector('#tab-mode-free');
      if (tabFree) tabFree.addEventListener('click', () => this.switchToFreeMode());

      // Quick character pills click
      const quickPillsDrill = (typeof this.overlay.querySelectorAll === 'function') ? this.overlay.querySelectorAll('.quick-char-pill') : [];
      quickPillsDrill.forEach(pill => {
        pill.addEventListener('click', () => {
          const charId = pill.getAttribute('data-char-id');
          if (charId) this.setPlayerCharacter(charId);
        });
      });

      const selDrill = this.overlay.querySelector('#training-drill-select');
      if (selDrill) {
        selDrill.addEventListener('change', (e) => {
          this.setupDrill(parseInt(e.target.value, 10));
        });
      }

      const btnSkip = this.overlay.querySelector('#btn-training-skip-drill');
      if (btnSkip) btnSkip.addEventListener('click', () => this.setupDrill(this.currentDrillIndex + 1));
      const btnResetPos = this.overlay.querySelector('#btn-training-reset-pos');
      if (btnResetPos) btnResetPos.addEventListener('click', () => this.resetPositions());
      const btnQuit = this.overlay.querySelector('#btn-training-quit');
      if (btnQuit) btnQuit.addEventListener('click', () => this.quitTraining());
    } else {
      // Chế độ luyện tự do vô tận (Free Sandbox Mode)
      const curDummyStyle = (this.dummy && this.dummy.styleType) || 'dummy_wood';
      const curDummyMode = (this.dummy && this.dummy.attackMode) || 'idle';

      this.overlay.innerHTML = `
        <div class="training-card free-training-card">
          <!-- 4 Góc đồng triện hoa văn cổ truyền Việt Nam -->
          <span class="vovinam-corner corner-tl"></span>
          <span class="vovinam-corner corner-tr"></span>
          <span class="vovinam-corner corner-bl"></span>
          <span class="vovinam-corner corner-br"></span>

          <!-- 1. Header mộc bản võ phái Vovinam -->
          <div class="training-header">
            <div class="training-header-left">
              <span class="training-tag gold">⚡ VÕ ĐƯỜNG VOVINAM</span>
            </div>
            <button id="btn-collapse-training-menu" class="btn-training-header-toggle" title="Thu gọn bảng tùy chỉnh (Phím tắt: [C])">
              <span class="btn-toggle-icon">➖</span>
              <span class="btn-toggle-text">THU GỌN [C]</span>
            </button>
          </div>
          <div class="vovinam-sub-motto">CƯƠNG NHU PHỐI TRIỂN • VIỆT VÕ ĐẠO</div>

          <!-- 2. Tabs chuyển đổi chế độ chuẩn xác -->
          <div class="training-mode-tabs">
            <button id="tab-mode-free" class="t-mode-tab active" title="Đang ở chế độ Luyện Tự Do">
              <span class="tab-icon">⚡</span>
              <span class="tab-text">LUYỆN TẬP TỰ DO</span>
            </button>
            <button id="tab-mode-drills" class="t-mode-tab" title="Chuyển sang 7 Bài Khảo Hạch">
              <span class="tab-icon">🥋</span>
              <span class="tab-text">7 BÀI KHẢO HẠCH</span>
            </button>
          </div>

          <!-- 3. Hàng Thẻ Bài 7 Môn Đệ (Quick Roster) -->
          <div class="training-quick-roster-bar" title="Đổi nhanh võ sĩ đang luyện tập">
            <div class="quick-roster-header">
              <span class="quick-roster-label">VÕ SĨ XUẤT TRẬN:</span>
              <span class="active-hero-badge" style="color: ${activeHero.color}; border-color: ${activeHero.color}60; background: ${activeHero.color}1c;">
                ${activeHero.icon} ${activeHero.name}
              </span>
            </div>
            <div class="quick-roster-pills">
              ${TRAINING_CHARACTERS.map(c => `
                <button class="quick-char-pill ${c.id === curChar ? 'active' : ''}" data-char-id="${c.id}" style="--pill-color: ${c.color};" title="${c.name} — ${c.title}&#10;${c.desc}">
                  <span class="pill-icon">${c.icon}</span>
                  <span class="pill-name">${c.name.split(' ').slice(-1)[0]}</span>
                </button>
              `).join('')}
            </div>
            <select id="training-player-char" style="display:none;" aria-hidden="true">
              ${TRAINING_CHARACTERS.map(c => `
                <option value="${c.id}" ${c.id === curChar ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- 4. Lưới điều khiển 2 Trụ Cột Võ Thuật: Đối Thủ & Công Phu Hộ Thân -->
          <div class="training-grid-controls">
            <!-- Cột Trái: Cấu hình Đối Thủ Hình Nộm -->
            <div class="training-panel-card">
              <div class="panel-card-title">
                <span class="panel-icon">⚔️</span>
                <span>HÌNH NỘM TẬP ĐÒN</span>
              </div>
              <div class="panel-control-row">
                <label for="training-dummy-char" class="control-label">Nhân vật:</label>
                <select id="training-dummy-char" class="training-select">
                  <option value="dummy_wood">Mộc Nhân Gỗ Võ Đường</option>
                  <option value="thug">Côn Đồ Đường Phố</option>
                  <option value="enemy_guard">Vệ Binh Giáp Trụ</option>
                  <option value="enemy_dodger">Sát Thủ Thân Pháp</option>
                  <option value="enemy_baton">Côn Đồ Gậy Điện</option>
                  <option value="enemy_blade">Sát Thủ Mã Tấu</option>
                  <option value="enemy_shield">Vệ Binh Khiên Bạo Động</option>
                  <option value="boss_haclang">Boss Hắc Lang</option>
                  <option value="boss_thietquyen">Boss Thiết Quyền</option>
                  <option value="boss_hoanganh">Boss Hoàng Anh</option>
                  <option value="boss_dinhan">Boss Đình An</option>
                  <option value="boss_longvuong">Boss Long Vương</option>
                </select>
              </div>
              <div class="panel-control-row">
                <label for="training-dummy-behavior" class="control-label">Hành vi:</label>
                <select id="training-dummy-behavior" class="training-select">
                  <option value="idle">Đứng yên chịu đòn</option>
                  <option value="guard">Thủ thế (Luyện phá thủ)</option>
                  <option value="telegraph_hand">Tấn công tay: Đấm [U+J]</option>
                  <option value="telegraph_leg">Tấn công chân: Đá [U+K]</option>
                  <option value="sparring">Đối kháng chủ động 🥊</option>
                  <option value="free">Giao đấu tự do nhẹ nhàng</option>
                </select>
              </div>
            </div>

            <!-- Cột Phải: Trạng Thái Võ Học (Ấn Triện Võ Thuật) -->
            <div class="training-panel-card">
              <div class="panel-card-title">
                <span class="panel-icon">🥋</span>
                <span>CÔNG PHU HỘ THÂN</span>
              </div>
              <div class="training-switches-group">
                <button id="btn-training-no-cd" class="training-switch-btn ${this.noCooldown ? 'active' : ''}" title="Bật/Tắt nạp đầy tuyệt kỹ & hồi chiêu tức thì">
                  <span class="switch-left">
                    <span class="switch-ico">⚡</span>
                    <span class="switch-name">HỒI CHIÊU 0S</span>
                  </span>
                  <span class="switch-badge ${this.noCooldown ? 'on' : 'off'}">${this.noCooldown ? 'BẬT' : 'TẮT'}</span>
                </button>
                <button id="btn-training-god-mode" class="training-switch-btn ${this.playerGodMode ? 'active' : ''}" title="Bảo hộ người chơi không chết khi giao đấu">
                  <span class="switch-left">
                    <span class="switch-ico">🩸</span>
                    <span class="switch-name">BẢO HỘ BẤT TỬ</span>
                  </span>
                  <span class="switch-badge ${this.playerGodMode ? 'on' : 'off'}">${this.playerGodMode ? 'BẬT' : 'TẮT'}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 5. Bia Đo Kình Lực & Sát Thương (Martial Telemetry Plaque) -->
          <div class="training-telemetry-box">
            <div class="telemetry-pill">
              <span class="telemetry-label">💥 NGOẠI KÌNH</span>
              <span id="telemetry-last-dmg" class="telemetry-val">${this.lastDamage}</span>
            </div>
            <div class="telemetry-pill">
              <span class="telemetry-label">🔥 LIÊN HOÀN</span>
              <span id="telemetry-combo-dmg" class="telemetry-val">${this.currentComboDamage}</span>
            </div>
            <div class="telemetry-pill highlight">
              <span class="telemetry-label">🏆 ĐỈNH CÔNG</span>
              <span id="telemetry-max-combo" class="telemetry-val">${this.maxComboHits} Hits (${this.maxComboDamage} dmg)</span>
            </div>
          </div>

          <!-- 6. Thanh 4 Lệnh Bài Hành Động -->
          <div class="training-actions">
            <button id="btn-training-reset-pos" class="btn btn-secondary btn-sm" title="Đặt lại thế tấn xuất phát (Phím tắt: [R])">
              🔄 ĐẶT LẠI [R]
            </button>
            <button id="btn-training-refill-energy" class="btn btn-primary btn-sm" title="Nạp đầy 100% Năng lượng Khí Công Vovinam">
              ⚡ NẠP ĐẦY KHÍ
            </button>
            <button id="btn-collapse-training-menu-bottom" class="btn btn-ghost btn-sm" title="Ẩn mộc bản tùy chỉnh (Phím tắt: [C])">
              👁️ ẨN BẢNG [C]
            </button>
            <button id="btn-training-quit" class="btn btn-ghost btn-sm btn-quit" title="Rời Võ Đường về màn hình chính">
              ✕ RỜI VÕ ĐƯỜNG
            </button>
          </div>
        </div>
      `;
      const btnCollapse = this.overlay.querySelector('#btn-collapse-training-menu');
      if (btnCollapse) btnCollapse.addEventListener('click', () => this.toggleMenuCollapse(true));
      const btnCollapseBottom = this.overlay.querySelector('#btn-collapse-training-menu-bottom');
      if (btnCollapseBottom) btnCollapseBottom.addEventListener('click', () => this.toggleMenuCollapse(true));

      const tabDrills = this.overlay.querySelector('#tab-mode-drills');
      if (tabDrills) tabDrills.addEventListener('click', () => this.switchToDrillMode(0));

      // Quick character pills click
      const quickPillsFree = (typeof this.overlay.querySelectorAll === 'function') ? this.overlay.querySelectorAll('.quick-char-pill') : [];
      quickPillsFree.forEach(pill => {
        pill.addEventListener('click', () => {
          const charId = pill.getAttribute('data-char-id');
          if (charId) this.setPlayerCharacter(charId);
        });
      });

      // Binding behavior select
      const selBehavior = this.overlay.querySelector('#training-dummy-behavior');
      if (selBehavior && this.dummy) {
        selBehavior.value = curDummyMode;
        selBehavior.addEventListener('change', (e) => {
          if (this.dummy) {
            this.dummy.attackMode = e.target.value;
            this.dummy.isAttacking = false;
            this.dummy.vx = 0; this.dummy.vy = 0;
            this.dummy.telegraphState = 'idle';
            this.dummy.telegraphTimer = 0;
            this.dummy.sparCooldown = 1.0;
            this.dummy.setState('idle');
            if (window.uiManager) window.uiManager.showToast(`Hành vi hình nộm: ${selBehavior.options[selBehavior.selectedIndex].text}`);
          }
        });
      }

      // Binding player character select
      const selPlayerChar = this.overlay.querySelector('#training-player-char');
      if (selPlayerChar) {
        selPlayerChar.value = curChar;
        selPlayerChar.addEventListener('change', (e) => {
          this.setPlayerCharacter(e.target.value);
        });
      }

      // Binding dummy character select
      const selDummyChar = this.overlay.querySelector('#training-dummy-char');
      if (selDummyChar && this.dummy) {
        selDummyChar.value = curDummyStyle;
        selDummyChar.addEventListener('change', (e) => {
          this.setDummyArchetype(e.target.value);
        });
      }

      // Binding no-cooldown toggle
      const btnNoCd = this.overlay.querySelector('#btn-training-no-cd');
      if (btnNoCd) {
        btnNoCd.addEventListener('click', () => {
          this.setNoCooldown(!this.noCooldown);
        });
      }

      // Binding god-mode toggle
      const btnGodMode = this.overlay.querySelector('#btn-training-god-mode');
      if (btnGodMode) {
        btnGodMode.addEventListener('click', () => {
          this.setPlayerGodMode(!this.playerGodMode);
        });
      }

      // Binding reset positions button
      const btnResetPos = this.overlay.querySelector('#btn-training-reset-pos');
      if (btnResetPos) {
        btnResetPos.addEventListener('click', () => {
          this.resetPositions();
        });
      }

      const btnRefill = this.overlay.querySelector('#btn-training-refill-energy');
      if (btnRefill && window.game && window.game.player) {
        btnRefill.addEventListener('click', () => {
          window.game.player.energy = window.game.player.maxEnergy;
          if (window.uiManager) window.uiManager.updatePlayerEnergy(100, 100);
          if (window.uiManager) window.uiManager.showToast('Đã nạp đầy năng lượng Vovinam!');
        });
      }

      const btnQuit = this.overlay.querySelector('#btn-training-quit');
      if (btnQuit) btnQuit.addEventListener('click', () => this.quitTraining());
    }
  }

  update(dt) {
    if (!this.isActive || !this.dummy) return;
    const inp = window.input;
    const player = window.game && window.game.player;
    const drill = this.drills[this.currentDrillIndex];

    // Duy trì bất tử cho người chơi nếu bật God Mode
    if (this.playerGodMode && player && player.hp < player.maxHp) {
      player.hp = player.maxHp;
      if (window.uiManager) window.uiManager.updatePlayerHp(player.hp, player.maxHp);
    }

    // Áp dụng Không Hồi Chiêu nếu được bật
    if (this.noCooldown) {
      if (player) {
        player.energy = player.maxEnergy;
        player.dodgeCooldown = 0;
        player.counterCooldown = 0;
        if (window.uiManager) {
          window.uiManager.updatePlayerEnergy(player.energy, player.maxEnergy);
          const cdDodge = document.getElementById('cd-dodge-text'); if (cdDodge) cdDodge.textContent = 'SẴN SÀNG';
          const cdHand = document.getElementById('cd-counter-hand-text'); if (cdHand) cdHand.textContent = 'SẴN SÀNG';
          const cdLeg = document.getElementById('cd-counter-leg-text'); if (cdLeg) cdLeg.textContent = 'SẴN SÀNG';
        }
      }
      if (window.allyManager) {
        window.allyManager.cooldown = 0;
        window.allyManager.gauge = window.allyManager.maxGauge;
        window.allyManager.updateHUD();
      }
    }

    // Giảm thời gian đệm bảo vệ chuyển bài
    if (this.drillGraceTimer > 0) {
      this.drillGraceTimer = Math.max(0, this.drillGraceTimer - dt);
    }

    // Reset chuỗi combo telemetry khi đòn đánh ngắt quãng
    if (window.combatSystem && window.combatSystem.comboCount === 0 && this.currentComboDamage > 0) {
      this.currentComboDamage = 0;
      const elCombo = document.getElementById('telemetry-combo-dmg');
      if (elCombo) elCombo.textContent = '0';
    }

    // Cập nhật thanh timing động nếu đang ở bài né hoặc phản đòn
    const meter = document.getElementById('training-timing-meter');
    if (meter && (this.dummy.attackMode === 'telegraph_hand' || this.dummy.attackMode === 'telegraph_leg')) {
      if (this.dummy.telegraphState === 'telegraph') {
        const pct = Math.min(100, (this.dummy.telegraphTimer / this.dummy.telegraphDuration) * 100);
        meter.style.width = pct + '%';
        meter.style.background = (pct > 70) ? '#ffd700' : '#ff3344';
      } else if (this.dummy.telegraphState === 'active') {
        meter.style.width = '100%';
        meter.style.background = '#00d2ff';
      } else {
        meter.style.width = '0%';
      }
    }

    // Cơ chế an toàn phát hiện hành vi trực tiếp nếu combat event bị miss
    if (this.mode === 'drill' && !this._drillTransitioning && this.drillGraceTimer <= 0 && drill && inp && player) {
      if (drill.id === 'drill_dodge') {
        // Bấm né (L hoặc Shift) khi dummy đang chuẩn bị hoặc vung đòn
        const isDodgeKey = (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('dodge')) ||
                           (typeof inp.isKeyJustPressed === 'function' && (inp.isKeyJustPressed('KeyL') || inp.isKeyJustPressed('ShiftLeft') || inp.isKeyJustPressed('ShiftRight')));
        if (isDodgeKey) {
          const isTimingWindow = (this.dummy.telegraphState === 'active') || 
                                 (this.dummy.telegraphState === 'telegraph' && this.dummy.telegraphTimer >= this.dummy.telegraphDuration * 0.6);
          if (isTimingWindow) {
            this.recordAction('perfect_dodge');
          }
        }
      } else if (drill.id === 'drill_counter_hand') {
        const isCounterHand = (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('counter_hand')) ||
                              (inp.isDown('KeyU') && (inp.isDown('KeyJ') || inp.punch));
        if (isCounterHand && (this.dummy.telegraphState === 'active' || (this.dummy.telegraphState === 'telegraph' && this.dummy.telegraphTimer >= this.dummy.telegraphDuration * 0.6))) {
          if (!this._lastCounterHandTime || performance.now() - this._lastCounterHandTime > 750) {
            this._lastCounterHandTime = performance.now();
            this.recordAction('counter_hand');
          }
        }
      } else if (drill.id === 'drill_counter_leg') {
        const isCounterLeg = (typeof inp.isActionJustPressed === 'function' && inp.isActionJustPressed('counter_leg')) ||
                              (inp.isDown('KeyU') && (inp.isDown('KeyK') || inp.kick));
        if (isCounterLeg && (this.dummy.telegraphState === 'active' || (this.dummy.telegraphState === 'telegraph' && this.dummy.telegraphTimer >= this.dummy.telegraphDuration * 0.6))) {
          if (!this._lastCounterLegTime || performance.now() - this._lastCounterLegTime > 750) {
            this._lastCounterLegTime = performance.now();
            this.recordAction('counter_leg');
          }
        }
      }
    }
  }
}

const trainingManager = new TrainingManager();
window.TrainingManager = TrainingManager;
window.trainingManager = trainingManager;
window.TrainingDummy = TrainingDummy;

