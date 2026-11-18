/**
 * BOSS CỐT TRUYỆN: ĐAO THỦ HẮC LANG (Màn 1)
 * js/entities/characters/haclang.js
 */

(function () {
  window.CharacterRegistry.register({
    id: 'haclang',

    appearance: {
      styleKey: 'boss_haclang',
      style: {
        scale: 1.4,
        skin: '#dcae82',
        hair: '#2a1a1a',
        hairStyle: 'bandana',
        gi: '#2a1217',
        pants: '#1c0d10',
        belt: '#9b111e',
        weapon: 'machete',
        aura: '#ff2244',
        under: '#4a2128',
        bandana: '#c1121f',
        shoes: 'combat',
        eyeColor: '#ef4444'
      }
    },

    dossier: {
      id: 'haclang',
      name: 'Đao Thủ Hắc Lang',
      title: 'THỦ LĨNH CỬA NGÕ',
      faction: 'hua',
      styleType: 'boss_haclang',
      portrait: 'boss_haclang',
      playable: false,
      role: 'Boss màn 1 — thủ lĩnh cửa ngõ căn cứ.',
      motive: 'Không cho ai lọt vào khu giam Hứa Vũ Đại.',
      bio: 'Song đao của Hắc Lang là tấm vé vào mạng lưới ngầm. Hắn tin Nghị chỉ là một thằng võ sĩ ảo tưởng.',
      fightingStyle: 'Song đao, 2 giai đoạn, chuyển sang đá tống áp sát khi máu giảm.',
      strengths: 'Tốc độ và tầm vũ khí.',
      weaknesses: 'Không có phòng thủ — chỉ công.',
      skills: [
        { name: 'Song Đao Liên Hoàn', desc: 'Chuỗi chém liên tục.' },
        { name: 'Áp Sát Giai Đoạn 2', desc: 'Lao tới bằng đá tống.' }
      ],
      ultimate: null,
      stats: { power: 3, speed: 4, defense: 2, technique: 3, range: 4 },
      relations: [{ who: 'Long Vương', rel: 'Cấp dưới' }],
      events: ['Hồi I: Cửa ngõ căn cứ'],
      unlock: { type: 'boss', text: 'Boss màn 1' }
    },

    combat: null
  });
})();
