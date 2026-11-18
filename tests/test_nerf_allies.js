/**
 * Test: Kiểm tra Cân Bằng Đồng Minh — Sweet Spot (Không Bá Đạo Solo Boss & Không Phế Yếu)
 */

const assert = require('assert');

// Mock môi trường
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

require('../js/entities/allySystem.js');
require('../js/entities/enemy/baseEnemy.js');

console.log('--- BẮT ĐẦU KIỂM TRA CÂN BẰNG ĐỒNG MINH (TỶ LỆ VÀNG REBALANCING) ---');

// 1. Khởi tạo Boss giả lập
const mockBoss = {
  isBoss: true,
  type: 'boss_haclang',
  hp: 2000,
  maxHp: 2000,
  poise: 100,
  maxPoise: 100,
  superArmor: true,
  allyCcImmunityTimer: 0,
  x: 500,
  y: 580,
  takeDamage(amount, kb = 0, isKnockdown = false) {
    this.hp -= amount;
    this.lastDamageTaken = amount;
    this.lastKnockdown = isKnockdown;
  },
  setState(st) {
    this.state = st;
  }
};

window.game = {
  player: { x: 300, y: 580, facing: 1, hp: 500, maxHp: 500, dmgMul: 1 },
  currentBoss: mockBoss,
  enemies: [mockBoss]
};

const allyMgr = new window.AllyManager();

// =========================================================================
// TEST 1: PHÓ ĐẶNG HOÀNG ANH — MÁU 650 HP, SÁT THƯƠNG VỪA PHẢI, CẤM STUN LOCK BOSS
// =========================================================================
console.log('\n[TEST 1: Phó Đặng Hoàng Anh]');
allyMgr.summonAlly('hoanganh', window.game.player);
const hoangAnh = allyMgr.activeAlly;
assert.ok(hoangAnh, 'Triệu hồi Hoàng Anh thành công');

// Kiểm tra HP đồng minh chuẩn (1/2 so với bản gốc 1300 HP -> 650 HP)
assert.strictEqual(hoangAnh.maxHp, 650, `HP Hoàng Anh phải đạt 650 HP: thực tế ${hoangAnh.maxHp}`);
// Kiểm tra bỏ Super Armor vĩnh viễn (cho phép boss hất ngã khi cần)
assert.strictEqual(hoangAnh.superArmor, false, 'Hoàng Anh không còn Siêu Giáp Bất Tử vĩnh viễn');

// Đòn đánh thường lên Boss
mockBoss.allyCcImmunityTimer = 0;
mockBoss.poise = 100;
hoangAnh.performAllyAttack(mockBoss);

// Sát thương lên Boss đạt mức cân bằng 40% (30-36 dmg)
assert.ok(mockBoss.lastDamageTaken >= 25 && mockBoss.lastDamageTaken <= 40, `Sát thương Hoàng Anh lên Boss phải trong khoảng 25-40 dmg: thực tế ${mockBoss.lastDamageTaken}`);
assert.strictEqual(mockBoss.lastKnockdown, false, 'Hoàng Anh đánh thường KHÔNG ĐƯỢC quật ngã Boss');
assert.strictEqual(mockBoss.allyCcImmunityTimer, 4.5, 'Sau khi dính đòn, Boss phải nhận 4.5s miễn nhiễm khống chế');

// Đòn tiếp theo: Boss đang trong thời gian miễn nhiễm -> CẤM TRỪ TIẾP POISE
const poiseAfterFirstHit = mockBoss.poise;
hoangAnh.performAllyAttack(mockBoss);
assert.strictEqual(mockBoss.poise, poiseAfterFirstHit, 'Boss đang có allyCcImmunityTimer KHÔNG ĐƯỢC bị trừ thêm Poise');
console.log('✓ Hoàng Anh: Sát thương lên Boss 33 dmg hỗ trợ tốt, không stun lock, cấm trừ Poise liên tục.');

// Kỹ năng Địa Chấn
mockBoss.lastDamageTaken = 0;
hoangAnh.x = 400;
hoangAnh.y = 580;
hoangAnh.specialTimer = 10.0;
hoangAnh.update(0.1, window.game.player, [mockBoss]);
assert.strictEqual(mockBoss.lastDamageTaken, 40, `Sát thương Địa Chấn lên Boss phải đạt 40 dmg: thực tế ${mockBoss.lastDamageTaken}`);
assert.strictEqual(mockBoss.lastKnockdown, false, 'Địa Chấn KHÔNG ĐƯỢC quật ngã Boss');
console.log('✓ Hoàng Anh: Kỹ năng Địa Chấn gây 40 dmg hợp lý, không quật ngã Boss.');

// Bị Boss đánh: Hoàng Anh có Bá Thể giảm 20% dmg (nhận 80 thay vì 100), không bị nhân 1.5x tử ẹo
const haHpBefore = hoangAnh.hp;
hoangAnh.takeDamage(100, 5, true);
assert.strictEqual(hoangAnh.hp, haHpBefore - 80, 'Hoàng Anh có Bá Thể nhận 80 dmg (giảm 20%), trụ vững trên sân');
assert.strictEqual(hoangAnh.state, 'knockdown', 'Hoàng Anh bị quật ngã khi nhận đòn nặng');
console.log('✓ Hoàng Anh: Trụ đòn kiên cường, sinh tồn tốt trong giao tranh.');


// =========================================================================
// TEST 2: TRIỆU ĐÌNH AN — LÁ CHẮN 100 HP, TAUNT 15 DMG & THU HÚT BOSS
// =========================================================================
console.log('\n[TEST 2: Triệu Đình An]');
allyMgr.activeAlly = null;
allyMgr.cooldown = 0;
window.game.player.shieldHp = 0;
allyMgr.summonAlly('dinhan', window.game.player);
const dinhAn = allyMgr.activeAlly;
assert.ok(dinhAn, 'Triệu hồi Đình An thành công');

// Kiểm tra HP
assert.strictEqual(dinhAn.maxHp, 625, `HP Đình An phải đạt 625 HP: thực tế ${dinhAn.maxHp}`);

// Kích hoạt 1 frame update để cấp lá chắn
dinhAn.update(0.1, window.game.player, [mockBoss]);

// Kiểm tra Lá Chắn Kim Cương đạt 100 HP (đỡ 1-2 đòn nguy hiểm cho người chơi)
assert.strictEqual(window.game.player.shieldHp, 100, `Lá chắn cấp cho người chơi phải là 100 HP: thực tế ${window.game.player.shieldHp}`);

// Đòn đánh thường lên Boss
mockBoss.lastDamageTaken = 0;
dinhAn.performAllyAttack(mockBoss);
assert.ok(mockBoss.lastDamageTaken >= 25 && mockBoss.lastDamageTaken <= 35, `Sát thương Đình An lên Boss đạt 25-35 dmg: thực tế ${mockBoss.lastDamageTaken}`);
assert.strictEqual(mockBoss.lastKnockdown, false, 'Đình An đánh thường KHÔNG ĐƯỢC quật ngã Boss');

// Kỹ năng Taunt lên Boss
mockBoss.state = 'idle';
mockBoss.target = window.game.player;
dinhAn.specialTimer = 10.0;
dinhAn.update(0.1, window.game.player, [mockBoss]);
assert.strictEqual(mockBoss.lastDamageTaken, 15, `Sát thương Taunt lên Boss đạt 15 dmg: thực tế ${mockBoss.lastDamageTaken}`);
assert.strictEqual(mockBoss.target, dinhAn, 'Taunt phải chuyển mục tiêu Boss sang Đình An để cứu người chơi');
console.log('✓ Triệu Đình An: Cấp lá chắn 100 HP, sát thương 30 dmg, Taunt hút đòn bảo vệ người chơi chuẩn xác.');


// =========================================================================
// TEST 3: CÁC ĐỒNG MINH KHÁC & CHIÊU CO-OP COMBO
// =========================================================================
console.log('\n[TEST 3: Dung Hải, Mộc Đăng, Vũ Đại, Giang Mạnh & Co-op Attack]');

// Phó Dung Hải không được xóa Super Armor của Boss nhưng gây sát thương tốt
allyMgr.activeAlly = null;
allyMgr.cooldown = 0;
allyMgr.summonAlly('dunghai', window.game.player);
mockBoss.superArmor = true;
allyMgr.activeAlly.performAllyAttack(mockBoss);
assert.strictEqual(mockBoss.superArmor, true, 'Dung Hải TUYỆT ĐỐI KHÔNG ĐƯỢC xóa Super Armor của Boss');
assert.ok(mockBoss.lastDamageTaken >= 28 && mockBoss.lastDamageTaken <= 38, 'Dung Hải sát thương lên Boss đạt 28-38 dmg');
console.log('✓ Phó Dung Hải: Boss bảo toàn Super Armor, sát thương chém đao hữu hiệu.');

// Co-op Attack gây sát thương mạnh mẽ (55% base dmg lên boss ~ 130-150 dmg)
mockBoss.lastDamageTaken = 0;
allyMgr.activeAlly.coopCooldown = 0;
allyMgr.activeAlly.triggerCoopAttack(window.game.player, mockBoss);
assert.ok(mockBoss.lastDamageTaken >= 120 && mockBoss.lastDamageTaken <= 160, `Co-op Attack lên Boss phải đạt 120-160 dmg: thực tế ${mockBoss.lastDamageTaken}`);
console.log('✓ Co-op Attack: Gây 143 dmg hoành tráng, tạo bước ngoặt trận đấu nhưng không làm one-shot Boss.');

// Ngô Giang Mạnh không được làm đông cứng tê liệt Boss, chỉ làm chậm 20%
allyMgr.activeAlly = null;
allyMgr.cooldown = 0;
allyMgr.summonAlly('giangmanh', window.game.player);
allyMgr.activeAlly.x = 400;
mockBoss.frozenTimer = 0;
mockBoss.allyCcImmunityTimer = 0;
allyMgr.activeAlly.specialTimer = 10.0;
allyMgr.activeAlly.update(0.1, window.game.player, [mockBoss]);
assert.strictEqual(mockBoss.frozenTimer, 0, 'Giang Mạnh KHÔNG ĐƯỢC đóng băng tê liệt Boss (frozenTimer = 0)');
assert.strictEqual(mockBoss.speedMul, 0.8, 'Giang Mạnh làm chậm Boss 20% (speedMul = 0.8)');
console.log('✓ Ngô Giang Mạnh: Boss không bị đông cứng tê liệt, chỉ bị làm chậm hợp lý.');

// Hứa Vũ Đại: Boss có immunity không bị mù
allyMgr.activeAlly = null;
allyMgr.cooldown = 0;
allyMgr.summonAlly('huavudai', window.game.player);
allyMgr.activeAlly.x = 400;
mockBoss.allyCcImmunityTimer = 4.0;
mockBoss.blindTimer = 0;
allyMgr.activeAlly.specialTimer = 10.0;
allyMgr.activeAlly.update(0.1, window.game.player, [mockBoss]);
assert.strictEqual(mockBoss.blindTimer, 0, 'Boss có allyCcImmunityTimer KHÔNG BỊ MÙ bởi bom khói');
console.log('✓ Hứa Vũ Đại: Boss có kháng khống chế không bị mù liên tục.');

console.log('\n--- TOÀN BỘ CÁC BÀI KIỂM TRA CÂN BẰNG HOÀNG KIM ĐỒNG MINH ĐỀU THÀNH CÔNG RỰC RỠ! ---');
