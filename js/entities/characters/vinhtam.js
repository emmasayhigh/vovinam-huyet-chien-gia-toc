/**
 * BOSS CỐT TRUYỆN: TRIỆU VINH TÂM (Màn 10)
 * js/entities/characters/vinhtam.js
 */

(function () {
  window.CharacterRegistry.register({
    id: 'vinhtam',
    aliases: ['vinh tam', 'trieu_vinhtam', 'trieuvinhtam', 'Triệu Vinh Tâm'],

    appearance: {
      styleKey: 'boss_vinhtam',
      style: {
        scale: 1.44,
        skin: '#e8be96',
        hair: '#e2e8f0',
        hairStyle: 'white',
        gi: '#4a121a',
        pants: '#2a0a0f',
        belt: '#ffd700',
        dragon: true,
        beard: true,
        robe: true,
        aura: '#ffd700',
        under: '#6b1d28',
        shoes: 'dress',
        eyeColor: '#ffd700'
      }
    },

    dossier: {
      id: 'vinhtam',
      name: 'Triệu Vinh Tâm',
      title: 'THỦ LĨNH TRIỆU GIA',
      faction: 'trieu',
      styleType: 'boss_vinhtam',
      portrait: 'boss_vinhtam',
      playable: false,
      role: 'Thủ lĩnh Triệu gia, đối thủ chiến lược muốn chiếm toàn bộ hồ sơ bí mật.',
      motive: 'Kiểm soát thông tin để Triệu gia không bao giờ lại rơi vào thế yếu. Hắn tin quyền lực là cách duy nhất bảo vệ gia tộc.',
      bio: 'Vinh Tâm không lao vào đánh. Hắn điều khiển chiến trường bằng cận vệ, bẫy và những quyết định có tính toán. Mỗi giai đoạn là một nước cờ.',
      fightingStyle: 'Bình tĩnh, kỷ luật, phản đòn, chuyển giai đoạn khi máu giảm, dùng cận vệ để gây áp lực.',
      strengths: 'Parry (phản đòn) vô hiệu hóa đòn của người chơi, triệu hồi cận vệ, giai đoạn 3 đánh hung hãn hơn nhưng lộ sơ hở sau đòn mạnh.',
      weaknesses: 'Sau chuỗi đòn nặng là khoảng trống lớn — đó là cửa phản công duy nhất.',
      skills: [
        { name: 'Thủ Thế Triệu Gia', desc: 'Parry: vô hiệu hóa đòn đánh thường và phản đòn ngay lập tức.' },
        { name: 'Hàm Lệnh Tuyển Vệ', desc: 'Giai đoạn 2: gọi 2 cận vệ áp sát người chơi.' },
        { name: 'Liên Hoàn Kỷ Luật', desc: 'Chuỗi 2-3 đòn có nhịp đều, dễ đọc nhưng khó chịu khi dồn.' },
        { name: 'Lộ Sơ Hở', desc: 'Giai đoạn 3: đòn mạnh hơn nhưng recovery dài — trừng phạt được.' }
      ],
      ultimate: null,
      stats: { power: 4, speed: 3, defense: 4, technique: 5, range: 3 },
      relations: [
        { who: 'Triệu Đình An', rel: 'Cận vệ trung thành tuyệt đối' },
        { who: 'Hứa Vũ Đại', rel: 'Cùng muốn chiếm lấy hồ sơ bí mật' },
        { who: 'Ngô Giang Mạnh', rel: 'Coi là mối đe dọa lớn nhất' }
      ],
      events: [
        'Hồi IV: Đại Điện Triệu Gia — 3 giai đoạn',
        'Sau trận: lựa chọn về số phận Phó Dung Hải'
      ],
      unlock: { type: 'boss', text: 'Chỉ xuất hiện với tư cách boss (Màn 10)' }
    },

    combat: null
  });
})();
