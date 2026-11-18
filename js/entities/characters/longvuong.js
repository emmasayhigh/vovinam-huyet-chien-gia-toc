/**
 * BOSS CỐT TRUYỆN: LONG VƯƠNG (Màn 4)
 * js/entities/characters/longvuong.js
 */

(function () {
  window.CharacterRegistry.register({
    id: 'longvuong',

    appearance: {
      styleKey: 'boss_longvuong',
      style: {
        scale: 1.45,
        skin: '#f1cfa6',
        hair: '#e5e7eb',
        hairStyle: 'white',
        gi: '#15120f',
        pants: '#0d0b09',
        belt: '#eab308',
        dragon: true,
        beard: true,
        aura: '#facc15',
        under: '#7c5a10',
        shoes: 'dress',
        eyeColor: '#ca8a04'
      }
    },

    dossier: {
      id: 'longvuong',
      name: 'Long Vương',
      title: 'ÔNG TRÙM TỐI THƯỢNG',
      faction: 'hua',
      styleType: 'boss_longvuong',
      portrait: 'boss_longvuong',
      playable: false,
      role: 'Boss cuối Hồi I — kẻ bắt cóc Hứa Vũ Đại.',
      motive: 'Chiếm hồ sơ bí mật và loại bỏ mạng lưới ngầm của Hứa.',
      bio: 'Long Quyền của hắn từng quật ngã cả khu vực. Hắn không biết rằng mình chỉ là con tốt trong tay kẻ khác.',
      fightingStyle: '3 giai đoạn: kỷ luật → tốc độ → điên cuồng với tàn ảnh vàng.',
      strengths: 'Sát thương lớn, 3 giai đoạn.',
      weaknesses: 'Giai đoạn 3 hụt đòn là cơ hội.',
      skills: [
        { name: 'Long Quyền', desc: 'Chuỗi đấm uy lực.' },
        { name: 'Phi Long Đoạt', desc: 'Lao tới có tàn ảnh.' }
      ],
      ultimate: null,
      stats: { power: 5, speed: 3, defense: 4, technique: 3, range: 3 },
      relations: [
        { who: 'Hứa Vũ Đại', rel: 'Kẻ bị hắn bắt' },
        { who: 'Huyết Ảnh', rel: 'Cấp dưới' }
      ],
      events: ['Hồi I: Bị hạ — mở ra toàn bộ âm mưu'],
      unlock: { type: 'boss', text: 'Boss màn 4' }
    },

    combat: null
  });
})();
