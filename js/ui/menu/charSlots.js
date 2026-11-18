/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/ui/menu/charSlots.js - Tổng hợp dữ liệu thẻ nhân vật cho màn Chọn Nhân Vật từ js/entities/characters/*.js.
 *
 * Mỗi nhân vật chơi được tự khai báo thẻ `uiSlot` trong file riêng của mình.
 */

if (!window.CharacterRegistry && typeof require === 'function') {
  try { require('../../entities/characters/bootstrap.js'); } catch (_) {}
}

const COMING_SOON_SLOT = {
  id: 'coming_soon',
  slotName: 'SẮP RA MẮT',
  fullName: 'CHIẾN BINH BÍ ẨN',
  title: 'KHÓA ĐẶC BIỆT',
  tagline: 'Đang thức tỉnh trong bóng tối...',
  element: '🔒',
  color: '#64748b',
  image: '',
  bio: 'Cao thủ bí ẩn đến từ phân nhánh Vovinam cổ truyền. Nhân vật này sẽ được khai mở trong các bản cập nhật sự kiện tiếp theo của Huyết Chiến Gia Tộc.',
  stats: { power: 99, speed: 99, defense: 99, technique: 99 },
  skills: [
    { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' },
    { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' },
    { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' },
    { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' }
  ],
  passives: [
    { icon: '🔒', name: 'Bí Kỹ Ẩn 1', type: 'BỊ ĐỘNG', desc: 'Chưa được giải mã.' },
    { icon: '🔒', name: 'Bí Kỹ Ẩn 2', type: 'BỊ ĐỘNG', desc: 'Chưa được giải mã.' },
    { icon: '🔒', name: 'Bí Kỹ Ẩn 3', type: 'CHỦ ĐỘNG', desc: 'Chưa được giải mã.' },
    { icon: '🔒', name: 'Bí Kỹ Ẩn 4', type: 'BỊ ĐỘNG', desc: 'Chưa được giải mã.' }
  ],
  mechanic: 'Bí kỹ chưa được giải mã.',
  quote: '“Sức mạnh thực sự cần thời gian để thức tỉnh.”',
  isLocked: true
};

const CHAR_SLOTS = [
  ...(window.CharacterRegistry ? window.CharacterRegistry.buildCharSlotsList() : []),
  COMING_SOON_SLOT
];

window.CHAR_SLOTS = CHAR_SLOTS;
