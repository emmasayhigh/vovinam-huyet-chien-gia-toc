/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/core/gameStory.js - Thoai giua tran, hiep uoc, chi vien dong minh va man 7.
 */

class GameStory extends window.GameFlow {
  // Thoại nảy sinh NGAY GIỮA trận đấu (không cần đợt địch mới)
  playInlineDialogue(list, onDone) {
    if (!list || !list.length) { if (onDone) onDone(); return; }

    // Nếu đang tạm dừng trong menu Pause (ESC), hoãn lại cho đến khi tiếp tục
    if (this.state === 'PAUSED') {
      this.later(() => this.playInlineDialogue(list, onDone), 300);
      return;
    }

    this.state = 'CUTSCENE';
    const resume = () => {
      this.state = 'PLAYING';
      if (onDone) onDone();
    };

    if (window.stageManager && typeof window.stageManager.playDialogueSequence === 'function') {
      window.stageManager.playDialogueSequence(list, resume);
    } else {
      resume();
    }
  }

  // Hiệp ước với Đình Bích Lâm (không cần giết anh ta)
  triggerTruce() {
    const boss = this.currentBoss;
    boss.truceTriggered = true;
    boss.setState('idle', 0);
    boss.vx = 0;
    this.state = 'CUTSCENE';
    if (window.audioManager) window.audioManager.setBGMIntensity(1);
    window.stageManager.playDialogueSequence([
      { speaker: 'ĐÌNH BÍCH LÂM', role: 'ĐỒNG MINH NGANG TÀNG', avatar: 'bichlam',
        text: 'Được... đủ rồi. Anh đánh không phải để chứng tỏ trung thành — vậy thì tôi tin anh một lần.' },
      { speaker: 'ĐÌNH BÍCH LÂM', role: 'ĐỒNG MINH NGANG TÀNG', avatar: 'bichlam',
        text: 'Bản gốc danh sách liên hệ từng nằm ở bến cảng này. Kẻ bị xóa tên là người họ Phó — và người ra lệnh xóa thì vẫn đang ngồi trên ghế.' },
      { speaker: 'NGÔ NHẤT NGHỊ', role: 'SÁT THẦN VIỆT VÕ ĐẠO', avatar: 'nghi',
        text: 'Cảm ơn. Nếu sau này tôi cần một đồng minh không biết nói dối — tôi sẽ tìm anh.' }
    ], () => {
      if (window.saveManager) {
        window.saveManager.unlockAchievement('truce_bichlam');
        window.saveManager.completeMission('truce_bichlam');
      }
      if (window.uiManager) window.uiManager.showToast('THÀNH TÍCH: HIỆP ƯỚC GIỮA HAI NGƯỜI');
      // Kết thúc trận đấu mà không cần hạ gục
      boss.isDead = true;
      boss.setState('knockdown', 1.2);
      this.triggerStageVictory();
    });
  }

  // ==========================================================================
  // HỆ THỐNG CHI VIỆN ĐỒNG MINH VOVINAM / HỌ PHÓ (ALLY SUMMON)
  // ==========================================================================
  triggerAllySupport() {
    if (window.allyManager) {
      const ok = window.allyManager.summonAlly();
      if (ok) {
        this.allyCooldown = window.allyManager.cooldown;
      }
      return;
    }

    const sm = window.saveManager;
    if (!sm) return;
    const allies = sm.data.allyAvailability || {};
    const trust = sm.data.characterTrust || {};

    if (this.allyCooldown > 0) {
      if (window.uiManager) window.uiManager.showToast(`ĐỒNG MINH ĐANG HỒI CHIÊU (${Math.ceil(this.allyCooldown)}s)`);
      return;
    }

    let activeAlly = (window.allyManager && window.allyManager.selectedAllyId) || null;
    if (!activeAlly) {
      if (allies.hoanganh && trust.hoanganh >= 55) activeAlly = 'hoanganh';
      else if (allies.dunghai && trust.dunghai >= 45) activeAlly = 'dunghai';
      else if (allies.mocdang && trust.mocdang >= 65) activeAlly = 'mocdang';
      else if (allies.bichlam) activeAlly = 'bichlam';
      else if (window.trainingManager && window.trainingManager.isActive) activeAlly = 'bichlam';
    }

    if (!activeAlly) {
      if (window.uiManager) window.uiManager.showToast('CHƯA CÓ ĐỒNG MINH NÀO SẴN SÀNG CHI VIỆN!');
      return;
    }

    this.allyCooldown = 14;
    if (window.saveManager) {
      window.saveManager.unlockAchievement('ally_master');
    }

    if (activeAlly === 'hoanganh') {
      if (window.audioManager) {
        window.audioManager.playExplosion();
        window.audioManager.playGong(0.6);
      }
      if (window.effectManager) {
        window.effectManager.triggerFlash('#ffd700', 0.45);
        window.effectManager.triggerScreenShake(22, 0.6);
        window.effectManager.createDust(this.player.x, 560, 35);
      }
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: HOÀNG ANH — SƠN THẠCH TRẤN ĐỊA!');
      this.enemies.forEach(e => {
        if (!e.isDead) {
          e.takeDamage(130, 0, true);
          e.setState('knockdown', 2.8);
        }
      });
    } else if (activeAlly === 'dunghai') {
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#a3e635', 0.5);
      }
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: DUNG HẢI — KHÓI SƯƠNG NGHI BINH!');
      if (this.currentBoss) {
        this.currentBoss.superArmor = false;
        this.currentBoss.attackCooldown = 4.5;
        this.currentBoss.setState('idle', 0);
      }
    } else if (activeAlly === 'mocdang') {
      if (window.audioManager) window.audioManager.playChime();
      if (window.effectManager) {
        window.effectManager.triggerFlash('#00d2ff', 0.4);
      }
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: MỘC ĐĂNG — HACK DRONE & XUNG ĐIỆN EMP!');
      this.player.energy = this.player.maxEnergy;
      if (window.uiManager) window.uiManager.updatePlayerEnergy(this.player.energy, this.player.maxEnergy);
    } else if (activeAlly === 'bichlam') {
      if (window.audioManager) window.audioManager.playWhoosh();
      if (window.uiManager) window.uiManager.showToast('CHI VIỆN: ĐÌNH BÍCH LÂM — XUYÊN TẦN LIÊN KẾT!');
      this.enemies.forEach(e => {
        if (!e.isDead) {
          e.takeDamage(160, this.player.facing * 16, true);
        }
      });
    }
  }

  updateAllyHUD() {
    if (window.allyManager) {
      window.allyManager.updateHUD();
      return;
    }
    const badge = document.getElementById('ally-ready-badge');
    if (!badge || !window.saveManager) return;
    const sm = window.saveManager;
    const allies = sm.data.allyAvailability || {};
    const hasAny = Object.values(allies).some(Boolean);
    if (hasAny) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  // ==========================================================================
  // ĐẶC BIỆT MÀN 7: CUỘC GẶP TẠI NƠI ẨN NÁU CỦA PHÓ DUNG HẢI
  // ==========================================================================
  triggerStage7DungHaiEncounter(stageData, wave) {
    this.isBossCutsceneTriggered = true;
    this.state = 'CUTSCENE';

    const inv = window.investigationManager;
    const hasExpulsion = inv && inv.isFound('DOC_EXPULSION_ORDER');
    const hasLetter = inv && inv.isFound('DOC_LETTER_TORN');
    const canConfront = hasExpulsion || hasLetter;

    const options = [
      {
        id: 'trust',
        text: 'A. TIN DUNG HẢI TẠM THỜI',
        desc: 'Nghị hạ thế thủ, nghe hết câu chuyện về đêm lưu đày và chấp nhận hiệp ước ngầm.'
      },
      {
        id: 'subdue',
        text: 'B. TRUY BẮT DUNG HẢI',
        desc: 'Vào trận chiến: khống chế Dung Hải bằng đòn Vovinam mà không lấy mạng hắn.'
      }
    ];

    if (canConfront) {
      options.push({
        id: 'confront',
        text: 'C. ĐỐI CHẤT BẰNG CHỨNG [ĐẶC BIỆT]',
        desc: 'Đưa ra lệnh khai trừ bị sửa ngày tháng và thư mật để ép Dung Hải tiết lộ tầng sự thật sâu nhất.'
      });
    }

    window.stageManager.playDialogueSequence(stageData.bossDialogue, () => {
      window.uiManager.showChoice({
        label: 'CUỘC GẶP TẠI NƠI ẨN NÁU — PHÓ DUNG HẢI',
        question: 'Dung Hải đứng dựa lưng vào tủ điện, song đao giấu sau vạt áo rách. Ánh mắt hắn đầy hoài nghi và giằng xé:',
        options
      }, (optId) => {
        if (optId === 'trust') {
          if (inv) {
            inv.adjustTrust('dunghai', +30, 'Bạn chọn lắng nghe thay vì bạo lực');
            inv.adjustTrust('mocdang', -15, 'Mộc Đăng phát hiện bạn không chấp hành lệnh');
            inv.collectEvidence('DOC_AUDIO_MOCDANG');
          }
          this.playInlineDialogue([
            {
              speaker: 'PHÓ DUNG HẢI', role: 'KẺ BỊ KHAI TRỪ', avatar: 'dunghai',
              text: 'Cậu không giống những con chó săn khác của Hứa Vũ Đại. Cầm lấy chiếc bộ đàm này — nó có đoạn ghi âm Mộc Đăng muốn thủ tiêu cả hai chúng ta.'
            },
            {
              speaker: 'NGÔ NHẤT NGHỊ', role: 'SÁT THẦN VIỆT VÕ ĐẠO', avatar: 'nghi',
              text: 'Tôi sẽ lên Thập Vạn Đại Sơn tìm Hoàng Anh để đối chứng. Rời khỏi thành phố đi trước khi người của Mộc Đăng đến.'
            }
          ], () => {
            if (window.saveManager) {
              window.saveManager.unlockCharacter('dunghai');
              window.saveManager.unlockAlly('dunghai');
            }
            this.triggerStageVictory();
          });
        } else if (optId === 'confront') {
          if (inv) {
            inv.adjustTrust('dunghai', +40, 'Bạn chứng minh được sự ngụy tạo của lệnh khai trừ');
            inv.collectEvidence('DOC_AUDIO_MOCDANG');
            inv.ensureState(window.saveManager);
            if (window.saveManager && window.saveManager.data && window.saveManager.data.allyAvailability) {
              window.saveManager.data.allyAvailability.dunghai = true;
            }
          }
          this.playInlineDialogue([
            {
              speaker: 'NGÔ NHẤT NGHỊ', role: 'ĐỐI CHẤT', avatar: 'nghi',
              text: 'Nhìn cho kỹ: Lệnh khai trừ anh đề ngày 14, nhưng kho dữ liệu bị tấn công ngày 19. Mộc Đăng đã chuẩn bị bản án này từ trước.'
            },
            {
              speaker: 'PHÓ DUNG HẢI', role: 'KINH NGẠC', avatar: 'dunghai',
              text: 'Cái gì?! (Nhìn vào bản sao văn bản) Con số 14... Mộc Đăng... Thằng khốn nạn đó! Vậy ra cái bẫy này đã giăng sẵn từ đầu!'
            },
            {
              speaker: 'PHÓ DUNG HẢI', role: 'ĐỒNG MINH MỚI', avatar: 'dunghai',
              text: 'Nghị, tôi nợ cậu một mạng. Bất cứ khi nào cậu cần, tôi sẽ yểm trợ cậu bằng sương mù và ảo ảnh Vovinam!'
            }
          ], () => {
            if (window.saveManager) {
              window.saveManager.unlockCharacter('dunghai');
              window.saveManager.unlockAlly('dunghai');
            }
            this.triggerStageVictory();
          });
        } else {
          // B. Subdue: Chiến đấu với cơ chế khống chế đòn chân kẹp
          if (inv) inv.adjustTrust('dunghai', -20, 'Bạn chọn dùng vũ lực áp chế');
          this.dungHaiSubdueMode = true;
          this.dungHaiSubdued = false;
          this.state = 'PLAYING';
          this.currentWaveIndex++;
        }
      });
    });
  }

  triggerDungHaiSubdued() {
    if (this.dungHaiSubdued) return;
    this.dungHaiSubdued = true;

    const boss = this.currentBoss;
    if (boss) {
      boss.isDead = true;
      boss.hp = 0;
      boss.setState('knockdown', 2.0);
      boss.vx = 0;
    }
    this.state = 'CUTSCENE';

    this.playInlineDialogue([
      {
        speaker: 'NGÔ NHẤT NGHỊ', role: 'KHỐNG CHẾ ĐÒN CHÂN KẸP', avatar: 'nghi',
        text: 'Dừng lại! Tôi đã có thể bẻ gãy cổ anh bằng đòn kẹp cổ Vovinam. Tôi không đến đây để giết anh.'
      },
      {
        speaker: 'PHÓ DUNG HẢI', role: 'BỊ KHỐNG CHẾ', avatar: 'dunghai',
        text: 'Hừ... Đánh hay lắm. Muốn giao nộp tôi cho Hứa Vũ Đại thì làm đi. Nhưng đừng hòng moi thêm một chữ nào từ miệng tôi.'
      }
    ], () => {
      const inv = window.investigationManager;
      if (inv) inv.collectEvidence('DOC_AUDIO_MOCDANG');
      if (window.saveManager) {
        window.saveManager.unlockCharacter('dunghai');
        window.saveManager.unlockAlly('dunghai');
      }
      this.triggerStageVictory();
    });
  }
}

window.GameStory = GameStory;
