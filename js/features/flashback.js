/**
 * VOVINAM: HUYẾT ÁN HỌ PHÓ — THE ERASED BLOODLINE
 * js/flashback.js - Màn Chơi Hồi Ức Tương Tác: "Đêm Bị Khai Trừ" (Playable Flashback)
 *
 * Người chơi điều khiển Phó Dung Hải trong đêm 7 năm trước tại Tổ Đình Họ Phó.
 * Gameplay: thâm nhập kho lưu trữ, né tuần tra bảo an, tương tác điểm vật chứng,
 * đưa ra lựa chọn định hình thứ Dung Hải mang theo vào đêm lưu đày.
 */

class FlashbackMission {
  constructor() {
    this.isActive = false;
    this.stageWidth = 2400;
    this.progress = 0; // 0: Start, 1: Searched Desk, 2: Eavesdropped, 3: Safe Choice, 4: Escaped
    this.interactPoints = [
      { id: 'desk', x: 620, label: 'BÀN TỔ TRƯỞNG', done: false, prompt: 'Khám xét ngăn kéo bí mật' },
      { id: 'screen', x: 1250, label: 'BÌNH PHONG GỖ MUN', done: false, prompt: 'Nghe lén hội đàm kín' },
      { id: 'safe', x: 1850, label: 'KÉT LƯỢNG TỬ', done: false, prompt: 'Quyết định thứ mang theo' }
    ];
    this.securityAlert = 0; // 0 to 100
    this.patrolGuards = [];
    this.flashbackChoice = null;
  }

  startMission() {
    this.isActive = true;
    this.progress = 0;
    this.securityAlert = 0;
    this.flashbackChoice = null;
    this.interactPoints.forEach(p => p.done = false);

    // Cấu hình game để chuyển sang chế độ hồi ức
    if (window.game) {
      window.game.state = 'PLAYING';
      // Ép nhân vật chơi là Dung Hải
      window.game.player.setCharacter('dunghai');
      window.game.player.reset(120, 580);
      window.game.enemies = [];
      window.game.currentBoss = null;
      window.game.arenaLocked = false;
      window.game.camera.x = 0;
      window.game.camera.maxX = this.stageWidth - window.game.width;

      // Sinh lính tuần tra tổ đình
      this.spawnPatrols();

      if (window.uiManager) {
        window.uiManager.hideAllModals();
        window.uiManager.showHUD();
        window.uiManager.setCharacterHUD(window.game.player);
        window.uiManager.setObjective('HỒI ỨC DUNG HẢI: THÂM NHẬP KHO LƯU TRỮ TRƯỚC KHI TRỜI SÁNG');
        window.uiManager.showToast('BẮT ĐẦU HỒI ỨC: ĐÊM BỊ KHAI TRỪ (7 NĂM TRƯỚC)');
      }
      if (window.audioManager) {
        window.audioManager.startStageBGM(7); // Dùng theme đêm mưa lạnh
      }

      // Thoại mở đầu hồi ức
      window.game.playInlineDialogue([
        {
          speaker: 'PHÓ DUNG HẢI (7 NĂM TRƯỚC)',
          role: 'CỰU THÀNH VIÊN GIA TỘC',
          avatar: 'dunghai',
          text: 'Mưa to quá... Lệnh khai trừ đã được dán lên đại sảnh. Mộc Đăng muốn tống khứ mình đi ngay trong đêm nay.'
        },
        {
          speaker: 'PHÓ DUNG HẢI (7 NĂM TRƯỚC)',
          role: 'CỰU THÀNH VIÊN GIA TỘC',
          avatar: 'dunghai',
          text: 'Mình không thể ra đi tay trắng. Trước khi rời khỏi Lục Gia Chủy, mình phải tìm ra ai là kẻ thực sự đã bán đứng anh Khắc Nghiệp!'
        }
      ]);
    }
  }

  spawnPatrols() {
    if (!window.game) return;
    this.patrolGuards = [];
    const positions = [850, 1500, 2050];
    positions.forEach(x => {
      const guard = new EnemyGuard(x, 560);
      guard.name = 'Vệ Sĩ Tổ Đình';
      guard.isPatrol = true;
      guard.patrolMinX = x - 180;
      guard.patrolMaxX = x + 180;
      guard.patrolSpeed = 90;
      guard.facing = -1;
      window.game.enemies.push(guard);
      this.patrolGuards.push(guard);
    });
  }

  update(dt) {
    if (!this.isActive || !window.game) return;
    const player = window.game.player;

    // Kiểm tra tương tác với 3 điểm vật chứng
    this.interactPoints.forEach(p => {
      if (!p.done && Math.abs(player.x - p.x) < 70 && Math.abs(player.y - 560) < 60) {
        // Hiển thị prompt
        this.activePrompt = p;
        // Bấm J hoặc phím hành động để kích hoạt
        if (window.input && (window.input.isActionJustPressed('punch') || window.input.isActionJustPressed('dodge') || window.input.isKeyJustPressed('KeyE'))) {
          this.triggerInteractPoint(p);
        }
      }
    });

    // Cảnh báo an ninh nếu đánh lính tuần tra hoặc đi gần
    this.patrolGuards.forEach(g => {
      if (!g.isDead && Math.abs(player.x - g.x) < 140) {
        this.securityAlert = Math.min(100, this.securityAlert + dt * 15);
      }
    });

    // Đến cửa thoát (x > 2250) sau khi đã xong safe
    if (player.x > 2250 && this.interactPoints.find(p => p.id === 'safe').done) {
      this.finishMission();
    }
  }

  triggerInteractPoint(p) {
    p.done = true;
    if (window.audioManager) window.audioManager.playChime();

    if (p.id === 'desk') {
      window.game.playInlineDialogue([
        {
          speaker: 'PHÓ DUNG HẢI',
          role: 'ĐANG ĐIỀU TRA',
          avatar: 'dunghai',
          text: 'Ngăn kéo bị khóa... (Bẻ khóa). Đây rồi! Bản thảo Lệnh Khai Trừ! Dấu mộc đỏ đã đóng từ ngày 14, nhưng hôm nay mới là ngày 19!'
        },
        {
          speaker: 'PHÓ DUNG HẢI',
          role: 'ĐANG ĐIỀU TRA',
          avatar: 'dunghai',
          text: 'Mộc Đăng đã lên kế hoạch trục xuất mình từ trước khi vụ lộ dữ liệu xảy ra! Hắn dựng bẫy để biến mình thành kẻ phản bội!'
        }
      ], () => {
        if (window.investigationManager) {
          window.investigationManager.collectEvidence('DOC_EXPULSION_ORDER');
        }
        if (window.uiManager) window.uiManager.setObjective('TIẾN ĐẾN BÌNH PHONG: NGHE LÉN CUỘC HỘI ĐÀM KÍN');
      });
    } else if (p.id === 'screen') {
      window.game.playInlineDialogue([
        {
          speaker: 'GIỌNG NÓI PHÍA SAU BÌNH PHONG (MỘC ĐĂNG)',
          role: 'MẬT ĐÀM',
          avatar: 'mocdang',
          text: '...ông Hứa, mọi việc đã theo đúng thỏa thuận. Dung Hải sẽ nhận hết tội danh đánh cắp tài liệu. Sáng mai cảnh sát kinh tế sẽ ập vào văn phòng của hắn.'
        },
        {
          speaker: 'GIỌNG NÓI LẠNH LÙNG (HỨA VŨ ĐẠI)',
          role: 'MẠNG LƯỚI NGẦM',
          avatar: 'huavudai',
          text: 'Rất dứt khoát. Nhưng còn Hoàng Anh trên Thập Vạn Đại Sơn thì sao? Thằng đó không dễ bị bịt miệng đâu.'
        },
        {
          speaker: 'PHÓ MỘC ĐĂNG',
          role: 'MẬT ĐÀM',
          avatar: 'mocdang',
          text: 'Hoàng Anh chỉ biết cầm cuốc giữ đất. Tôi sẽ gửi cho hắn tin rằng Dung Hải đã ám hại anh Khắc Nghiệp. Hắn sẽ căm ghét Dung Hải đến tận xương tủy.'
        },
        {
          speaker: 'PHÓ DUNG HẢI',
          role: 'PHẪN NỘ',
          avatar: 'dunghai',
          text: '(Siết chặt nắm tay) Lũ khốn... Các người dám bôi nhọ tôi trước mặt Hoàng Anh! Tôi thề sẽ có ngày bắt các người phải trả giá!'
        }
      ], () => {
        if (window.investigationManager) {
          window.investigationManager.collectEvidence('DOC_LETTER_TORN');
        }
        if (window.uiManager) window.uiManager.setObjective('MỞ KÉT LƯỢNG TỬ VÀ CHỌN THỨ MANG THEO KHI TRỐN CHẠY');
      });
    } else if (p.id === 'safe') {
      // Đưa ra quyết định cuối cùng của hồi ức
      if (window.uiManager) {
        window.uiManager.showChoice({
          label: 'QUYẾT ĐỊNH ĐÊM KHAI TRỪ',
          question: 'Chuông báo động vang lên ngoài hành lang! Tiếng bước chân bảo an đang ập tới. Dung Hải chỉ kịp làm một việc:',
          options: [
            { id: 'take_core_draft', text: 'CỨU LẤY BẢN SAO HẠCH TÂM VI MẠCH', desc: 'Mang theo bằng chứng gốc về thành quả của anh Khắc Nghiệp để không bị Mộc Đăng tiêu hủy.' },
            { id: 'burn_logs', text: 'PHÓNG HỎA ĐỐT MÁY CHỦ GIÁM SÁT', desc: 'Xóa dấu vết trốn chạy của bản thân và ngăn Mộc Đăng theo dõi đường đi của mình.' },
            { id: 'leave_curse', text: 'ĐỂ LẠI BỨC HUYẾT THƯ CẢNH BÁO HOÀNG ANH', desc: 'Bỏ lại lời cảnh báo gửi lên đỉnh núi, chấp nhận bản thân lưu vong trong nghèo khó.' }
          ]
        }, (chosenId) => {
          this.flashbackChoice = chosenId;
          const sm = window.saveManager;
          if (sm) {
            this.recordFlashbackChoice(chosenId);
          }
          window.game.playInlineDialogue([
            {
              speaker: 'PHÓ DUNG HẢI',
              role: 'TRỐN THOÁT',
              avatar: 'dunghai',
              text: 'Xong rồi! Cửa thoát hiểm phía trước! Phải chạy ngay ra ngoài cơn mưa đêm!'
            }
          ], () => {
            if (window.uiManager) window.uiManager.setObjective('CHẠY VƯỢT QUA CỬA THOÁT HIỂM VỀ PHÍA PHẢI ĐỂ THOÁT!');
          });
        });
      }
    }
  }

  recordFlashbackChoice(choiceId) {
    const sm = window.saveManager;
    if (!sm) return;
    if (!Array.isArray(sm.data.flashbackChoices)) sm.data.flashbackChoices = [];
    sm.data.flashbackChoices.push(choiceId);

    if (choiceId === 'take_core_draft') {
      window.investigationManager.adjustTrust('dunghai', +20, 'Mang theo vật chứng hạch tâm');
      window.investigationManager.collectEvidence('DOC_CIPHER_CORE');
      sm.unlockAchievement('flashback_core');
    } else if (choiceId === 'burn_logs') {
      window.investigationManager.adjustTrust('mocdang', -20, 'Phá hủy hệ thống máy chủ của Mộc Đăng');
      window.investigationManager.adjustTrust('dunghai', +10, 'Bảo toàn mạng sống');
    } else if (choiceId === 'leave_curse') {
      window.investigationManager.adjustTrust('hoanganh', +25, 'Hoàng Anh nhận được lời cảnh báo sớm');
    }
    sm.persist();
  }

  finishMission() {
    this.isActive = false;
    if (window.audioManager) {
      window.audioManager.stopBGM();
      window.audioManager.playVictory();
    }
    if (window.saveManager) {
      window.saveManager.unlockAchievement('flashback_clear');
      window.saveManager.completeMission('flashback_dunghai');
    }

    if (window.uiManager) {
      window.uiManager.showToast('HOÀN THÀNH HỒI ỨC: ĐÊM BỊ KHAI TRỪ!');
    }

    // Kết thúc và trở về Biên Niên Sử hoặc Màn Hình Chính
    setTimeout(() => {
      if (window.game) {
        window.game.state = 'MENU';
        // Khôi phục nhân vật mặc định
        const savedChar = (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
        window.game.player.setCharacter(savedChar);
        if (window.uiManager) {
          window.uiManager.hideHUD();
          window.uiManager.showTitleScreen();
        }
        if (window.menuManager && window.menuManager.showChronicles) {
          window.menuManager.showChronicles();
        }
      }
    }, 1500);
  }

  render(ctx, camera) {
    if (!this.isActive) return;
    // Vẽ các điểm tương tác trên mặt đất
    const camX = camera.x;
    this.interactPoints.forEach(p => {
      const sx = p.x - camX;
      if (sx < -100 || sx > 1380) return;

      ctx.save();
      ctx.translate(sx, 480);

      // Cột ánh sáng vàng nhạt
      const grad = ctx.createLinearGradient(0, -90, 0, 40);
      grad.addColorStop(0, p.done ? 'rgba(74, 222, 128, 0)' : 'rgba(255, 215, 0, 0)');
      grad.addColorStop(1, p.done ? 'rgba(74, 222, 128, 0.35)' : 'rgba(255, 215, 0, 0.45)');
      ctx.fillStyle = grad;
      ctx.fillRect(-25, -90, 50, 130);

      // Biểu tượng tương tác
      ctx.fillStyle = p.done ? '#4ade80' : '#ffd700';
      ctx.beginPath();
      ctx.arc(0, -10, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a0f19';
      ctx.font = 'bold 12px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.done ? '✓' : '!', 0, -10);

      // Nhãn
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px Montserrat, sans-serif';
      ctx.fillText(p.label, 0, -35);

      if (!p.done && Math.abs(window.game.player.x - p.x) < 80) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '600 10px Montserrat, sans-serif';
        ctx.fillText(`[J] hoặc [E]: ${p.prompt}`, 0, 25);
      }

      ctx.restore();
    });
  }
}

window.FlashbackMission = FlashbackMission;
window.flashbackMission = new FlashbackMission();
