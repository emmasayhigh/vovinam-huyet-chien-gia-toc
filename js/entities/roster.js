/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/entities/roster.js - Hệ thống Phe Phái + Tổng hợp Hồ Sơ Nhân Vật từ js/entities/characters/*.js
 *
 * CHARACTERS[id].combat  : thông số dùng trực tiếp bởi Player (nhân vật chơi được)
 * CHARACTERS[id].*       : tiểu sử, động cơ, quan hệ, kỹ năng, điều kiện mở khóa
 * FACTIONS[id]           : biểu tượng, bảng màu, bối cảnh, kiểu đối thủ, nhiệm vụ, vai trò cốt truyện
 */

if (!window.CharacterRegistry && typeof require === 'function') {
  try { require('./characters/bootstrap.js'); } catch (_) {}
}

const FACTIONS = {
  vovinam: {
    id: 'vovinam',
    name: 'VIỆT VÕ ĐẠO — VOVINAM',
    short: 'VOVINAM',
    sigil: '★',
    colors: { primary: '#0088ff', secondary: '#38bdf8', dark: '#0a1b34', glow: 'rgba(0,136,255,0.55)' },
    arena: 'Võ đường & đường phố đêm',
    enemyStyle: 'Không có chiến trường riêng — Nghị chiến đấu một mình, dựa vào thân pháp và combo liên hoàn.',
    missions: ['Giải cứu Hứa Vũ Đại', 'Thoát khỏi căn cứ sau vụ tập kích'],
    influence: 'Là điểm cân bằng duy nhất giữa các gia tộc: không sở hữu tài nguyên, chỉ có lòng trung thành và sự thật.',
  },
  hua: {
    id: 'hua',
    name: 'MẠNG LƯỚI NGẦM — HỨA VŨ ĐẠI',
    short: 'HỨA VŨ ĐẠI',
    sigil: '◈',
    colors: { primary: '#c1121f', secondary: '#ff5a5f', dark: '#1b0d10', glow: 'rgba(193,18,31,0.5)' },
    arena: 'Bê tông, thép, đèn đỏ — kho lạnh, đường hầm, phòng giao dịch ngầm',
    enemyStyle: 'Lính đánh thuê, võ sĩ thân pháp, thiết giáp, sát thủ hắc ám (Hắc Lang, Thiết Quyền, Huyết Ảnh, Long Vương)',
    missions: ['Nhiệm vụ A: Giải cứu Hứa Vũ Đại', 'Nhiệm vụ B: Điều tra hồ sơ bị đánh cắp', 'Thoát khỏi căn cứ (nhiệm vụ phụ)'],
    influence: 'Xuất phát điểm của game và nơi người chơi khám phá bí mật đầu tiên. Hứa Vũ Đại giữ manh mối về hồ sơ.'
  },
  pho: {
    id: 'pho',
    name: 'HỌ PHÓ — ĐẾ CHẾ CÔNG NGHỆ',
    short: 'HỌ PHÓ',
    sigil: '⬡',
    colors: { primary: '#ffd700', secondary: '#00d2ff', dark: '#111318', glow: 'rgba(255,215,0,0.45)' },
    arena: 'Kiến trúc hiện đại, phòng chiến thuật, trạm quan sát, đèn vàng kim + xanh lạnh',
    enemyStyle: 'Công nghệ giám sát, vệ sĩ trang bị, Phó Dung Hải (phản trắc), Phó Đặng Hoàng Anh (trấn thủ sơn cước)',
    missions: ['Nhiệm vụ E: Truy tìm Phó Dung Hải', 'Nhiệm vụ D: Đối đầu Phó Đặng Hoàng Anh'],
    influence: 'Cung cấp thông tin, thiết bị, phân tích điểm yếu boss qua Phó Mộc Đăng — và cũng là nơi chứa nhiều xung đột nội bộ nhất.'
  },
  ngo: {
    id: 'ngo',
    name: 'HỌ NGÔ — THẾ LỰC BÓNG TỐI',
    short: 'HỌ NGÔ',
    sigil: '◆',
    colors: { primary: '#64748b', secondary: '#7dd3fc', dark: '#0c1118', glow: 'rgba(125,211,252,0.35)' },
    arena: 'Chiến trường ít ánh sáng, kiến trúc kín đáo, sương lạnh, đá đen ướt',
    enemyStyle: 'Sát thủ chính xác, ít di chuyển, phản công mạnh — Ngô Giang Mạnh và tay chân bóng tối',
    missions: ['Nhiệm vụ F: Đối thoại với Ngô Giang Mạnh'],
    influence: 'Tạo nhiệm vụ điều tra, đối đầu và lựa chọn khó khăn. Giang Mạnh không phải phản diện cuối cùng — hắn có thù riêng với họ Phó.'
  },
  trieu: {
    id: 'trieu',
    name: 'HỌ TRIỆU — CỰU HOÀNG TỘC',
    short: 'HỌ TRIỆU',
    sigil: '♛',
    colors: { primary: '#d4a017', secondary: '#c1121f', dark: '#1a1004', glow: 'rgba(212,160,23,0.5)' },
    arena: 'Đại điện, cột đá dát vàng, thảm đỏ viền vàng, ánh sáng vàng và chi tiết kiến trúc gia tộc',
    enemyStyle: 'Cận vệ phòng thủ chắc, chuỗi đòn nặng, nghi thức — Triệu Đình An trước Vinh Tâm',
    missions: ['Nhiệm vụ C: Vượt qua tuyến phòng thủ của Triệu gia'],
    influence: 'Các trận boss có tính nghi thức, phòng thủ và nhiều giai đoạn. Vinh Tâm muốn chiếm toàn bộ hồ sơ bí mật.'
  },
  doclap: {
    id: 'doclap',
    name: 'DU HIỆP — THẾ LỰC ĐỘC LẬP',
    short: 'ĐỘC LẬP',
    sigil: '✧',
    colors: { primary: '#22c55e', secondary: '#a3e635', dark: '#0b1a12', glow: 'rgba(34,197,94,0.4)' },
    arena: 'Bến cảng, kho ven sông, chỗ ở tạm bợ',
    enemyStyle: 'Không phe phái — đánh nhanh, áp sát, phản công và đẩy lùi',
    missions: ['Nhiệm vụ phụ: Thử thách của Đình Bích Lâm'],
    influence: 'Bích Lâm là đồng minh ngang tàng: anh ta đến vì tò mò, ở lại vì ghét sự giả trung thành.'
  }
};

const CHARACTERS = window.CharacterRegistry
  ? window.CharacterRegistry.buildCharactersMap()
  : {};

// Đồng bộ STYLE_DEFS cho toàn bộ nhân vật từ module riêng
if (typeof STYLE_DEFS !== 'undefined' && window.CharacterRegistry) {
  Object.assign(STYLE_DEFS, window.CharacterRegistry.buildStyleDefsMap());
  if (window.skeletalRenderer && window.skeletalRenderer._styles) {
    window.skeletalRenderer._styles = {};
  }
}

window.FACTIONS = FACTIONS;
window.CHARACTERS = CHARACTERS;
