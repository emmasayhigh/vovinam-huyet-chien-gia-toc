/**
 * NHÂN VẬT HỖ TRỢ: PHÓ MỘC ĐĂNG
 * js/entities/characters/mocdang.js
 * Chứa toàn bộ: Hồ sơ, Ngoại hình & Kỹ năng Đồng minh Chi viện (EMP Drone).
 */

(function () {
  window.CharacterRegistry.register({
    id: 'mocdang',

    appearance: {
      styleKey: 'npc_mocdang',
      style: {
        scale: 1.3,
        skin: '#edd0b7',
        hair: '#1e293b',
        hairStyle: 'short',
        gi: '#0f293a',
        pants: '#0a1d24',
        belt: '#00d2ff',
        glasses: true,
        aura: '#00d2ff',
        under: '#e0f2fe',
        suit: true,
        shoes: 'dress'
      }
    },

    dossier: {
      id: 'mocdang',
      name: 'Phó Mộc Đăng',
      title: 'THIÊN TÀI CÔNG NGHỆ',
      faction: 'pho',
      styleType: 'npc_mocdang',
      portrait: 'npc_mocdang',
      playable: false,
      role: 'Người đứng đầu Phó gia — hỗ trợ chiến trường thay vì chiến đấu.',
      motive: 'Giữ hệ thống giám sát của họ Phó hoạt động, và đảm bảo hồ sơ không rơi vào tay kẻ không đủ năng lực sử dụng nó.',
      bio: 'Mộc Đăng không cần là võ sĩ giỏi nhất game. Hắn cung cấp thông tin chiến trường, mở khóa khu vực, phân tích điểm yếu boss và thay đổi điều kiện nhiệm vụ — xuất hiện đúng lúc, nói đúng điều cần nói, rồi biến mất.',
      fightingStyle: 'Không chiến đấu trực tiếp. Thử thách của hắn (nếu có) sẽ là chiến thuật, không phải là bản sao của Nghị.',
      strengths: 'Phân tích điểm yếu boss, cung cấp intel, mở cửa khu vực, hồi phục giữa màn.',
      weaknesses: 'Không thể tự vệ; mọi hỗ trợ của hắn đều cần người chơi sống đủ lâu để nhận.',
      skills: [
        { name: 'Phân Tích Điểm Yếu', desc: 'Chỉ ra cửa phản công của boss trước trận.' },
        { name: 'Mở Khu Vực', desc: 'Kích hoạt cửa khóa / điểm tiếp cận mới.' },
        { name: 'Hỗ Trợ Chiến Trường', desc: 'Hồi phục & buff sát thương tạm thời giữa màn.' }
      ],
      ultimate: null,
      stats: { power: 1, speed: 2, defense: 1, technique: 5, range: 5 },
      relations: [
        { who: 'Phó Đặng Hoàng Anh', rel: 'Cùng họ, khác cách nhìn' },
        { who: 'Phó Dung Hải', rel: 'Kẻ đã ký quyết định khai trừ' },
        { who: 'Ngô Giang Mạnh', rel: 'Kẻ thù không đội trời chung' }
      ],
      events: ['Xuất hiện ở Màn 7, 9, 10 như sự kiện hỗ trợ giữa màn'],
      unlock: { type: 'boss', text: 'Nhân vật hỗ trợ — không chơi được' }
    },

    combat: null,

    ally: {
      profile: {
        id: 'mocdang',
        name: 'Phó Mộc Đăng',
        title: 'Kiến Trúc Sư Thần Số',
        icon: '💻',
        role: 'Khống Chế & Tê Liệt',
        roleColor: '#00d2ff',
        styleType: 'npc_mocdang',
        speed: 180,
        dmg: 68,
        hp: 1100,
        quote: 'Cả thành phố này chạy bằng điện — và ta là kẻ nắm công tắc.',
        activeSkill: {
          name: 'Xung Điện EMP Drone',
          cd: '4.5s',
          desc: 'Phóng xung điện cao tần làm choáng lính thường 1.2s, giật điện và làm chậm Boss.'
        },
        passiveAura: {
          name: 'Tường Lửa Hack Mạng',
          desc: 'Làm chậm 25% tốc độ di chuyển của lính thường và giảm 20% sát thương AoE cho người chơi.'
        },
        coopSkill: {
          name: 'Sấm Chớp Thần Số',
          desc: 'Song sát phối hợp phóng điện từ gây sát thương bạo kích và quật ngã kẻ địch.'
        }
      },
      coopBaseDamage: 230,
      onUpdate(ally, dt, player, enemies) {
        (enemies || []).forEach((e) => {
          if (!e.isDead) {
            const isBossE = !!(e.isBoss || String(e.type || '').startsWith('boss_'));
            e.speedMul = isBossE ? 0.90 : 0.75;
          }
        });
        if (ally.specialTimer >= 4.5) {
          ally.specialTimer = 0;
          if (window.effectManager) {
            window.effectManager.createShockRing(ally.x, ally.y, '#00d2ff');
            window.effectManager.addFloatingText('XUNG ĐIỆN EMP QUẤY PHÁ!', ally.x, ally.y - 150, 'dodge');
          }
          (enemies || []).forEach((e) => {
            if (!e.isDead && Math.hypot(e.x - ally.x, e.y - ally.y) < 260) {
              const isBossE = !!(e.isBoss || String(e.type || '').startsWith('boss_'));
              if (isBossE) {
                e.takeDamage(32, 0, false);
                if (!e.allyCcImmunityTimer || e.allyCcImmunityTimer <= 0) {
                  e.speedMul = 0.85;
                  e.allyCcImmunityTimer = 4.5;
                }
              } else {
                e.takeDamage(50, 0, false);
                if (typeof e.setState === 'function') e.setState('hurt', 0.6);
              }
            }
          });
        }
      },
      onBasicAttack(ally, target, dmg, isBossTarget) {
        target.takeDamage(dmg, 0, false);
        if (!isBossTarget && typeof target.setState === 'function') target.setState('hurt', 0.8);
        if (window.audioManager) window.audioManager.playChime();
        if (window.effectManager) {
          window.effectManager.createShockRing(target.x, target.y, '#00d2ff');
          window.effectManager.addFloatingText('XUNG ĐIỆN EMP!', target.x, target.y - 140, 'dodge');
        }
      }
    }
  });
})();
