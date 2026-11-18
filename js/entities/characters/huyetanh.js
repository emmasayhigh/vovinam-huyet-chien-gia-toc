/**
 * BOSS CỐT TRUYỆN: ĐỘI TRƯỞNG HUYẾT ẢNH (Màn 3)
 * js/entities/characters/huyetanh.js
 */

(function () {
  window.CharacterRegistry.register({
    id: 'huyetanh',

    appearance: {
      styleKey: 'boss_huyetanh',
      style: {
        scale: 1.4,
        skin: '#efc9ae',
        hair: '#1a0000',
        hairStyle: 'spiky',
        gi: '#5a0f1c',
        pants: '#2b0610',
        belt: '#e11d48',
        weapon: 'twin_daggers',
        mask: '#c9184a',
        aura: '#ff0055',
        under: '#2b0610',
        shoes: 'kungfu',
        glowingEyes: '#ff0055'
      }
    },

    dossier: {
      id: 'huyetanh',
      name: 'Đội Trưởng Huyết Ảnh',
      title: 'SÁT THỦ 3 GIAI ĐOẠN',
      faction: 'hua',
      styleType: 'boss_huyetanh',
      portrait: 'boss_huyetanh',
      playable: false,
      role: 'Boss tuyến truyện ban đầu — được nâng cấp thành đối thủ có chiến thuật và liên kết với vụ bắt cóc.',
      motive: 'Hắn là kẻ nhận lệnh trực tiếp từ Long Vương: bắt Hứa Vũ Đại vì hồ sơ, không vì tiền.',
      bio: 'Huyết Ảnh không phải lính đánh thuê thường. Ba thức của hắn được thiết kế để kết liễu trong hành lang hẹp — và hắn biết chính xác Nghị đang tìm thứ gì.',
      fightingStyle: 'Ba giai đoạn: thăm dò → dồn tốc → phòng thủ chặt (chỉ nhận 50% sát thương nếu không bị Perfect Counter).',
      strengths: 'Tốc độ, ghost trail, giai đoạn 3 phòng thủ chặt.',
      weaknesses: 'Perfect Counter vô hiệu hóa giảm sát thương giai đoạn 3.',
      skills: [
        { name: 'Thức 1 — Thăm Dò', desc: 'Chuỗi đấm móc cơ bản, dò nhịp người chơi.' },
        { name: 'Thức 2 — Dồn Tốc', desc: 'Lao tới bằng đá vòng cầu có tàn ảnh.' },
        { name: 'Thức 3 — Huyết Ngục', desc: 'Chịu 50% sát thương thường — trừ khi bị phản đòn hoàn hảo.' }
      ],
      ultimate: null,
      stats: { power: 4, speed: 5, defense: 3, technique: 4, range: 3 },
      relations: [
        { who: 'Long Vương', rel: 'Sếp trực tiếp — người ra lệnh bắt Hứa Vũ Đại' },
        { who: 'Ngô Nhất Nghị', rel: 'Mục tiêu cần tiêu diệt' }
      ],
      events: ['Hồi I: Hành lang tử thủ — liên kết trực tiếp với vụ bắt cóc'],
      unlock: { type: 'boss', text: 'Boss màn 3' }
    },

    combat: null
  });
})();
