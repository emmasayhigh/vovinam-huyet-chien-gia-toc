/**
 * BOSS CỐT TRUYỆN: VÕ SĨ THIẾT QUYỀN (Màn 2)
 * js/entities/characters/thietquyen.js
 */

(function () {
  window.CharacterRegistry.register({
    id: 'thietquyen',

    appearance: {
      styleKey: 'boss_thietquyen',
      style: {
        scale: 1.5,
        skin: '#c99a70',
        hair: '#1a1a1a',
        hairStyle: 'buzz',
        gi: '#2f3640',
        pants: '#20252c',
        belt: '#d4a017',
        gauntlet: true,
        armor: true,
        scar: true,
        aura: '#ffd700',
        under: '#4b5563',
        shoes: 'wraps',
        eyeColor: '#eab308'
      }
    },

    dossier: {
      id: 'thietquyen',
      name: 'Võ Sĩ Thiết Quyền',
      title: 'ĐẤU SĨ BỌC THÉP',
      faction: 'hua',
      styleType: 'boss_thietquyen',
      portrait: 'boss_thietquyen',
      playable: false,
      role: 'Boss màn 2 — nhà kho thép.',
      motive: 'Chứng minh nắm đấm thép mạnh hơn võ biểu diễn.',
      bio: 'Giáp trụ dày, tay bọc thép, và một niềm tin rất đơn giản: ai mạnh hơn thì sống.',
      fightingStyle: 'Đấm móc nặng + đập sàn diện rộng (né bằng cách nhảy).',
      strengths: 'Giáp dày, AoE mặt đất.',
      weaknesses: 'Chậm, telegraph dài.',
      skills: [
        { name: 'Đấm Thép', desc: 'Sát thương cao, knockdown.' },
        { name: 'Đập Sàn', desc: 'AoE — nhảy là né.' }
      ],
      ultimate: null,
      stats: { power: 4, speed: 2, defense: 5, technique: 2, range: 3 },
      relations: [{ who: 'Long Vương', rel: 'Thuê mướn' }],
      events: ['Hồi I: Nhà kho thép'],
      unlock: { type: 'boss', text: 'Boss màn 2' }
    },

    combat: null
  });
})();
