/**
 * tests/test_boss_targeting_and_weapon_throw.js
 * Kiểm tra toàn diện 3 bản vá quan trọng:
 *  1. Ném kiếm / vũ khí vào Boss (Đình Bích Lâm & toàn bộ Boss) không gây NaN tọa độ hay mất thực thể.
 *  2. Boss ưu tiên mục tiêu có % máu thấp hơn (hp / maxHp) thay vì máu tuyệt đối hay khoảng cách.
 *  3. Khi người chơi và đồng minh kẹp Boss ở giữa, Boss không bị xoay liên tục và luôn ra đòn trúng mục tiêu yếu % máu hơn.
 *  4. Màn hình tổng kết chiến thắng (RankingManager) khử trùng lặp phần thưởng và hiển thị đúng mục tiêu phụ.
 */

const assert = require('assert');

// Mock môi trường trình duyệt tối giản
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._store, k) ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};
global.performance = { now: () => Date.now() };

const mockElement = () => ({
  textContent: '',
  innerHTML: '',
  style: {},
  dataset: {},
  classList: {
    _set: new Set(),
    add(... names) { names.forEach((n) => this._set.add(n)); },
    remove(...names) { names.forEach((n) => this._set.delete(n)); },
    toggle(n, force) {
      if (force === undefined) {
        if (this._set.has(n)) { this._set.delete(n); return false; }
        this._set.add(n); return true;
      }
      if (force) this._set.add(n); else this._set.delete(n);
      return !!force;
    },
    contains(n) { return this._set.has(n); }
  },
  appendChild() {},
  insertBefore() {},
  addEventListener() {},
  querySelector() { return mockElement(); }
});

global.document = {
  getElementById: () => mockElement(),
  querySelector: () => mockElement(),
  createElement: () => mockElement(),
  body: { appendChild() {} }
};

window.audioManager = {
  playPunch() {}, playKick() {}, playPunchHit() {}, playHeavyHit() {}, playSlash() {}, playBlock() {},
  playHurt() {}, playClick() {}, playWhoosh() {}, playSwing() {},
  playWarning() {}, playDodge() {}, playPerfectDodge() {},
  playGong() {}, playExplosion() {}, playUltimateBurst() {}, playScissorClamp() {}
};

window.effectManager = {
  shakeOffsetX: 0,
  shakeOffsetY: 0,
  ghostTrails: [],
  particles: [],
  addFloatingText() {},
  createHitSparks() {},
  createEnergySparks() {},
  createDust() {},
  createGroundCrack() {},
  createShockRing() {},
  triggerFlash() {},
  triggerSlowMo() {},
  triggerScreenShake() {},
  addGhostTrail() {},
  renderWorld() {},
  renderScreen() {}
};

window.uiManager = {
  updateBossHp() {},
  updateBossPoise() {},
  updateWeaponHUD() {},
  setBossPhase() {},
  showAlertBanner() {}
};

window.stageManager = {
  stageWidth: 2400,
  renderBackground() {},
  renderForeground() {}
};

// Nạp hệ thống nhân vật, animation, combat, enemy, boss, vũ khí, camera, render và ranking
require('../js/entities/characters/bootstrap.js');
require('../js/entities/animation/animationData.js');
require('../js/entities/animation/animationBase.js');
require('../js/entities/animation/animationPose.js');
require('../js/entities/animation/animationRenderBase.js');
require('../js/entities/animation/animationWeapon.js');
require('../js/entities/animation/animationBody.js');
require('../js/entities/animation.js');
require('../js/combat/combat.js');
require('../js/core/save.js');
require('../js/entities/roster.js');
require('../js/world/story.js');
require('../js/entities/allySystem.js');
require('../js/entities/enemy/baseEnemy.js');
require('../js/entities/enemy/enemyVariants.js');
require('../js/entities/enemy/enemyBosses.js');
require('../js/entities/bosses2.js');
require('../js/combat/weapons.js');
require('../js/ui/ranking.js');

// Mock chuỗi kế thừa tối giản để test GameCamera + GameRender trực tiếp
window.GameWave = class {};
require('../js/core/gameCamera.js');
window.GameStory = window.GameCamera;
require('../js/core/gameRender.js');

console.log('=== BẮT ĐẦU TEST BOSS %HP TARGETING, CHỐNG KẸP XOAY VÒNG & NÉM KIẾM ===\n');

function createMockCtx() {
  const grad = { addColorStop() {} };
  return {
    save() {},
    restore() {},
    clearRect() {},
    translate() {},
    scale() {},
    rotate() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    bezierCurveTo() {},
    arc() {},
    ellipse() {},
    rect() {},
    roundRect() {},
    fill() {},
    stroke() {},
    fillRect() {},
    strokeRect() {},
    fillText() {},
    measureText(txt) { return { width: String(txt).length * 7 }; },
    createLinearGradient(...args) {
      for (const v of args) {
        if (!Number.isFinite(v)) throw new TypeError('Non-finite value passed to createLinearGradient');
      }
      return grad;
    },
    createRadialGradient(...args) {
      for (const v of args) {
        if (!Number.isFinite(v)) throw new TypeError('Non-finite value passed to createRadialGradient');
      }
      return grad;
    }
  };
}

// ============================================================================
// TEST 1: NÉM KIẾM (MÃ TẤU) & CÔN VÀO BOSS ĐÌNH BÍCH LÂM KHÔNG BỊ NaN / MẤT HÌNH
// ============================================================================
{
  const boss = new window.BossBichlam(520, 575);
  const player = {
    id: 'player_huavudai',
    type: 'player',
    characterId: 'huavudai',
    styleType: 'npc_huavudai',
    x: 450,
    y: 575,
    z: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    hp: 870,
    maxHp: 900,
    isDead: false,
    state: 'idle',
    animTime: 0,
    stateTimer: 0,
    stateDuration: 0.3,
    setState(s, d = 0.25) { this.state = s; this.stateDuration = d; this.stateTimer = 0; },
    takeDamage(dmg) { this.hp = Math.max(0, this.hp - dmg); }
  };

  window.allyManager.activeAlly = new window.SummonedAlly('dinhan', 400, 580);
  const ally = window.allyManager.activeAlly;
  ally.hp = 289;
  ally.maxHp = 625;

  const game = new window.GameRender();
  game.state = 'PLAYING';
  game.combatMode = 'DUEL';
  game.width = 1280;
  game.height = 720;
  game.camera = { x: 0, y: 0, maxX: 1200 };
  game.arenaLocked = true;
  game.arenaMinX = 0;
  game.arenaMaxX = 1280;
  game.player = player;
  game.currentBoss = boss;
  game.enemies = [boss];
  game.projectiles = [];
  game.bossZoom = 0;
  game.cineBar = 0;
  game.ctx = createMockCtx();
  window.game = game;
  window.game.requestAttackToken = () => true;

  // Trang bị Mã Tấu (blade) và ném thẳng vào Boss Đình Bích Lâm
  window.weaponSystem.reset(player);
  window.weaponSystem.setPlayerWeapon(player, 'blade', 6);
  const thrownOk = window.weaponSystem.throwWeapon(player, game.enemies);
  assert.strictEqual(thrownOk, true, 'Phải ném được Mã Tấu khi đang cầm trên tay');

  const hpBefore = boss.hp;
  for (let frame = 0; frame < 25; frame++) {
    const dt = 1 / 60;
    window.weaponSystem.update(dt, player, game.enemies);
    boss.update(dt, player, game.enemies);
    ally.update(dt, player, game.enemies);
    game.updateCamera(dt);
    game.render(); // Nếu camera.x hoặc boss.x bị NaN, createRadialGradient trong render() sẽ nổ lỗi ngay!
  }

  assert.ok(boss.hp < hpBefore, 'Boss Đình Bích Lâm phải nhận sát thương thực tế khi trúng kiếm phi');
  assert.ok(Number.isFinite(boss.x) && Number.isFinite(boss.y), 'Tọa độ Boss sau khi trúng kiếm phi phải hữu hạn (không NaN)');
  assert.ok(Number.isFinite(boss.vx) && Number.isFinite(boss.vy), 'Vận tốc Boss sau khi trúng kiếm phi phải hữu hạn');
  assert.ok(Number.isFinite(game.camera.x) && Number.isFinite(game.camera.y), 'Camera không được phép rơi vào NaN');
  assert.strictEqual(window.weaponSystem.drops.length, 1, 'Kiếm còn độ bền sau khi trúng Boss phải rơi ra đúng 1 vật phẩm (không bị nhân đôi)');

  // Kiểm tra trường hợp kiếm chỉ còn 1 độ bền -> vỡ nát khi trúng Boss, không sinh drop ma
  window.weaponSystem.reset(player);
  window.weaponSystem.setPlayerWeapon(player, 'blade', 1);
  window.weaponSystem.throwWeapon(player, game.enemies);
  for (let frame = 0; frame < 20; frame++) {
    window.weaponSystem.update(1 / 60, player, game.enemies);
    boss.update(1 / 60, player, game.enemies);
    game.updateCamera(1 / 60);
    game.render();
  }
  assert.strictEqual(window.weaponSystem.drops.length, 0, 'Kiếm hết độ bền vỡ nát khi trúng Boss không được rơi lại xuống đất');

  // Kiểm tra lớp bảo vệ tương thích ngược nếu có nơi truyền object vào takeDamage
  boss.invincibleTimer = 0;
  boss.state = 'idle';
  boss.takeDamage(50, { knockback: true, force: 320, critical: true });
  boss.update(1 / 60, player, game.enemies);
  assert.ok(Number.isFinite(boss.x) && Number.isFinite(boss.vx), 'Bảo vệ resolveKnockback phải chặn hoàn toàn NaN kể cả khi truyền object');

  console.log('✓ TEST 1: Ném kiếm vào Boss Đình Bích Lâm an toàn tuyệt đối (không NaN, không mất nhân vật/Boss)');
}

// ============================================================================
// TEST 2: BOSS ƯU TIÊN ĐÁNH NGƯỜI CÓ % MÁU THẤP HƠN (ĐÚNG VÍ DỤ CỦA NGƯỜI DÙNG)
// ============================================================================
{
  const boss = new window.BossLongVuong(500, 575);
  boss.attackCooldown = 0;

  // Ví dụ thực tế: Hỗ trợ còn 500 máu nhưng là 90% máu (500 / 555), đứng sát Boss (x = 450)
  // Người chơi còn 800 máu nhưng chỉ còn 80% máu (800 / 1000), đứng xa hơn (x = 580)
  const player = {
    id: 'player_1',
    type: 'player',
    x: 580,
    y: 575,
    z: 0,
    hp: 800,
    maxHp: 1000, // 80%
    isDead: false,
    state: 'idle',
    invincibleTimer: 0,
    takeDamage(dmg) { this.hp = Math.max(0, this.hp - dmg); }
  };

  const ally = new window.SummonedAlly('dinhan', 450, 575);
  ally.maxHp = 555;
  ally.hp = 500; // ~90.09%
  window.allyManager.activeAlly = ally;
  window.game = { player, requestAttackToken: () => true };

  const chosen1 = boss.selectCombatTarget(player);
  assert.strictEqual(chosen1, player, 'Boss phải chọn Người Chơi (80% máu) thay vì Hỗ Trợ (90% máu dù chỉ 500 HP)');
  assert.strictEqual(boss.targetAlly, false, 'targetAlly phải là false khi Người Chơi có % máu thấp hơn');

  // Ngược lại: Hỗ trợ tụt xuống 40% máu (222 / 555), Người chơi còn 80% máu (800 / 1000)
  ally.hp = 222; // 40%
  const chosen2 = boss.selectCombatTarget(player);
  assert.strictEqual(chosen2, ally, 'Khi Hỗ Trợ tụt xuống 40% máu (< 80% của Người Chơi), Boss phải lập tức chuyển sang đánh Hỗ Trợ');
  assert.strictEqual(boss.targetAlly, true, 'targetAlly phải là true khi Hỗ Trợ có % máu thấp hơn');

  console.log('✓ TEST 2: Boss ưu tiên chính xác mục tiêu có % máu thấp hơn khi khoảng cách xấp xỉ nhau');

  // ==========================================================================
  // TEST 2.1: "ƯU TIÊN THẰNG GẦN HƠN MỚI ĐẾN % MÁU"
  // (Ví dụ Người Chơi ở cự ly cận chiến 60px đang đánh Boss, Đồng Minh ở xa 300px)
  // Boss KHÔNG được bỏ rơi Người Chơi trước mặt để chạy đi tìm Đồng Minh xa dù Đồng Minh ít máu hơn!
  // ==========================================================================
  boss._targetLockTimer = 0;
  player.x = 560; // pDist = 60px
  player.hp = 850;
  player.maxHp = 1000; // 85% HP
  ally.x = 800; // aDist = 300px
  ally.hp = 250;
  ally.maxHp = 555; // ~45% HP (ít % máu hơn nhưng ở rất xa)

  const chosenClose = boss.selectCombatTarget(player);
  assert.strictEqual(chosenClose, player, 'Boss phải ưu tiên Người Chơi ở gần (60px) thay vì chạy sang Đồng Minh ở xa (300px) dù Đồng Minh ít % máu hơn');
  assert.strictEqual(boss.targetAlly, false, 'targetAlly phải là false khi Người Chơi gần hơn hẳn');
  console.log('✓ TEST 2.1: "Ưu tiên thằng nào gần hơn mới đến % máu" hoạt động chuẩn xác (Người chơi 60px được chọn trước Đồng minh 300px)');

  // ==========================================================================
  // TEST 2.2: "NẾU CẢ 2 THẰNG ĐỀU XA THÌ ĐUỔI THEO THẰNG % MÁU ÍT HƠN"
  // (Cả 2 đều cách Boss >= 180px: Người chơi cách 240px [80% HP], Đồng Minh cách 300px [35% HP])
  // ==========================================================================
  boss._targetLockTimer = 0;
  player.x = 260; // pDist = 240px (xa)
  player.hp = 800;
  player.maxHp = 1000; // 80% HP
  ally.x = 800; // aDist = 300px (xa)
  ally.hp = 194;
  ally.maxHp = 555; // 35% HP

  const chosenFarWounded = boss.selectCombatTarget(player);
  assert.strictEqual(chosenFarWounded, ally, 'Khi cả 2 đều ở xa, Boss phải đuổi theo Đồng Minh có % máu ít hơn (35% < 80%)');
  assert.strictEqual(boss.targetAlly, true, 'targetAlly phải là true khi truy đuổi mục tiêu yếu máu ở xa');
  console.log('✓ TEST 2.2: "Nếu cả 2 thằng đều xa thì đuổi theo thằng % máu ít hơn" hoạt động chuẩn xác (Đồng minh 35% máu được săn lùng)');

  // ==========================================================================
  // TEST 2.3: "NẾU 2 THẰNG ĐỀU ÍT MÁU THÌ ĐUỔI THEO THẰNG GẦN HƠN"
  // (Cả 2 đều <= 40% HP: Người chơi 25% HP ở cự ly 70px, Đồng minh 15% HP ở cự ly 180px)
  // Boss dứt điểm mục tiêu ở gần hơn!
  // ==========================================================================
  boss._targetLockTimer = 0;
  player.x = 570; // pDist = 70px
  player.hp = 250;
  player.maxHp = 1000; // 25% HP (ít máu)
  ally.x = 680; // aDist = 180px
  ally.hp = 83;
  ally.maxHp = 555; // 15% HP (cũng ít máu)

  const chosenLowHpCloser = boss.selectCombatTarget(player);
  assert.strictEqual(chosenLowHpCloser, player, 'Khi cả 2 đều ít máu, Boss phải đuổi theo Người Chơi gần hơn (70px vs 180px)');
  assert.strictEqual(boss.targetAlly, false, 'targetAlly phải là false khi ưu tiên kết liễu mục tiêu gần hơn');
  console.log('✓ TEST 2.3: "Nếu 2 thằng đều ít máu thì đuổi theo thằng gần hơn" hoạt động chuẩn xác (Người chơi 70px được ưu tiên kết liễu)');
}

// ============================================================================
// TEST 3: CHỐNG XOAY VÒNG LIÊN TỤC & ĐẢM BẢO TẤN CÔNG KHI BỊ KẸP GIỮA (CẢ 10 BOSS)
// ============================================================================
{
  const BossClasses = [
    window.BossHacLang,
    window.BossThietQuyen,
    window.BossHuyetAnh,
    window.BossLongVuong,
    window.BossBichlam,
    window.BossDungHai,
    window.BossHoangAnh,
    window.BossDinhAn,
    window.BossVinhTam,
    window.BossGiangManh
  ];

  for (const BossCls of BossClasses) {
    const boss = new BossCls(500, 575);
    boss.attackCooldown = 0.05;

    // Kẹp Boss ở giữa: Người chơi bên trái (x = 445, 95% HP), Đồng minh bên phải (x = 555, 45% HP)
    const player = {
      id: 'player_sandwich',
      type: 'player',
      x: 445,
      y: 575,
      z: 0,
      facing: 1,
      hp: 950,
      maxHp: 1000, // 95%
      isDead: false,
      state: 'idle',
      invincibleTimer: 0,
      activeCounterWindow: 0,
      takeDamage(dmg) { this.hp = Math.max(0, this.hp - dmg); }
    };

    const ally = new window.SummonedAlly('dinhan', 555, 575);
    ally.maxHp = 600;
    ally.hp = 270; // 45% (yếu % máu hơn Player)
    const initialAllyHp = ally.hp;

    window.allyManager.activeAlly = ally;
    window.game = {
      player,
      enemies: [boss],
      arenaLocked: true,
      arenaMinX: 100,
      arenaMaxX: 1100,
      requestAttackToken: () => true,
      spawnProjectile() {},
      spawnMinionAt() {}
    };

    let facingFlips = 0;
    let prevFacing = null;
    let attackedAtLeastOnce = false;

    for (let f = 0; f < 100; f++) {
      // Giữ 2 bên liên tục kẹp sát Boss ở khoảng cách cận chiến 55px
      player.x = boss.x - 55;
      ally.x = boss.x + 55;
      ally.invincibleTimer = 0;

      boss.update(1 / 60, player, [boss]);
      if (prevFacing !== null && boss.facing !== prevFacing) {
        facingFlips++;
      }
      prevFacing = boss.facing;
      if (boss.isAttacking || (boss.state && boss.state !== 'idle' && boss.state !== 'walk')) {
        attackedAtLeastOnce = true;
      }
    }

    assert.ok(
      facingFlips <= 2,
      `${boss.name} bị xoay mặt quá nhiều lần (${facingFlips}) khi bị kẹp ở giữa`
    );
    assert.strictEqual(
      attackedAtLeastOnce,
      true,
      `${boss.name} phải chủ động ra đòn khi bị kẹp giữa thay vì lùi lặp vô tận`
    );
    assert.strictEqual(
      boss.facing,
      1,
      `${boss.name} phải khóa hướng nhìn về phía Đồng Minh yếu % máu hơn (bên phải, facing = 1)`
    );

    // Đảm bảo đòn đánh cận chiến của Boss thực sự gây sát thương lên Đồng Minh (không đánh nhầm người phía sau lưng)
    boss.x = 500;
    boss.y = 575;
    player.x = 445;
    player.y = 575;
    const playerHpBeforeCheck = player.hp;
    ally.x = 555;
    ally.y = 575;
    ally.hp = initialAllyHp;
    ally.invincibleTimer = 0;
    boss.facing = 1;
    boss.targetAlly = true;
    boss.currentTarget = ally;
    boss.setState('punch_hook', 0.35);
    boss.checkAttackPlayer(player);
    assert.ok(
      ally.hp < initialAllyHp,
      `${boss.name}.checkAttackPlayer phải gây sát thương thực sự lên Đồng Minh đang bị nhắm tới`
    );
    assert.strictEqual(
      player.hp,
      playerHpBeforeCheck,
      `${boss.name}.checkAttackPlayer không được đánh trúng Người Chơi đang đứng phía sau lưng`
    );
  }

  console.log('✓ TEST 3: Cả 10 Boss đều không bị xoay liên tục khi bị kẹp giữa, khóa đúng người yếu % máu hơn và đánh trúng Đồng Minh');
}

// ============================================================================
// TEST 3.2: CHỐNG GÓC CHẾT KHI NGƯỜI CHƠI ĐỨNG LỆCH LÀN Y & SÁT THÂN (CẢ 10 BOSS)
// ============================================================================
{
  const BossClasses = [
    window.BossHacLang,
    window.BossThietQuyen,
    window.BossHuyetAnh,
    window.BossLongVuong,
    window.BossBichlam,
    window.BossDungHai,
    window.BossHoangAnh,
    window.BossDinhAn,
    window.BossVinhTam,
    window.BossGiangManh
  ];

  for (const BossCls of BossClasses) {
    const boss = new BossCls(500, 560);
    boss.attackCooldown = 0.05;
    window.allyManager.activeAlly = null;

    const initialHp = 1000;
    const player = {
      id: 'player_y_offset',
      type: 'player',
      x: 504, // Gần như trùng X với Boss (+4px)
      y: 616, // Lệch xuống +56px theo trục chiều sâu Y
      z: 0,
      facing: 1,
      hp: initialHp,
      maxHp: initialHp,
      isDead: false,
      state: 'idle',
      invincibleTimer: 0,
      activeCounterWindow: 0,
      takeDamage(dmg) { this.hp = Math.max(0, this.hp - dmg); }
    };

    window.game = {
      player,
      enemies: [boss],
      arenaLocked: true,
      arenaMinX: 100,
      arenaMaxX: 1100,
      requestAttackToken: () => true,
      spawnProjectile() {},
      spawnMinionAt() {}
    };

    for (let f = 0; f < 300; f++) {
      player.invincibleTimer = 0;
      boss.update(1 / 60, player, [boss]);
      if (player.hp < initialHp) break;
    }

    assert.ok(
      player.hp < initialHp,
      `${boss.name} phải tự khép làn Y và đánh trúng khi người chơi đứng lệch Y sát thân (x=504, y=616 vs boss y=560, player.hp=${player.hp})`
    );
  }

  console.log('✓ TEST 3.2: Cả 10 Boss đều tự khép làn Y và đánh trúng khi người chơi đứng lệch làn dọc sát thân');
}

// ============================================================================
// TEST 4: BẢNG XẾP HẠNG CHIẾN THẮNG (RANKING) KHỬ TRÙNG LẶP & CHUẨN CÔNG THỨC
// ============================================================================
{
  const res = window.rankingManager.calculateScore(4, {
    timeSec: 98,
    hpPercent: 5,
    maxCombo: 19,
    totalHits: 96,
    perfectDodges: 2,
    perfectCounters: 0,
    sideDone: false
  });

  assert.strictEqual(res.rank, 'A', 'Điểm ~17,030 ở Màn 4 phải đạt hạng A');
  assert.strictEqual(res.rankName, 'TINH NHUỆ', 'Tên hạng gọn gàng, không lặp (A)');
  assert.strictEqual(res.sideObjectiveDesc, 'Đạt hạng S', 'Mô tả mục tiêu phụ không còn bị lặp "Đạt hạng S (S)"');

  const charMentions = res.rewards.filter((r) => /hứa vũ đại/i.test(r.text));
  assert.strictEqual(charMentions.length, 1, 'Tên nhân vật mở khóa Hứa Vũ Đại chỉ xuất hiện đúng 1 lần trong phần thưởng');
  assert.ok(res.rewards.some((r) => r.type === 'story' && r.text === 'Mở Hồi II'), 'Phần thưởng cốt truyện giữ lại gọn "Mở Hồi II"');

  console.log('✓ TEST 4: Bảng xếp hạng chiến thắng tính điểm chuẩn xác và khử sạch phần thưởng trùng lặp');
}

console.log('\n=== TẤT CẢ BÀI TEST ĐỀU VƯỢT QUA XUẤT SẮC! ===');
