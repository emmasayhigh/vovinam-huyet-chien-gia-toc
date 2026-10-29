/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/charselect/charSelectDeployment.js - Chon dong minh, skin trien khai va vao tran.
 */

class MenuManagerCharSelectDeployment extends window.MenuManagerCharSelectDemo {
  refreshAllySelector() {
    const pillsContainer = document.getElementById('cs-ally-pills');
    const nameLabel = document.getElementById('cs-ally-selected-name');
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';

    const alliesList = [
      { id: 'auto', name: 'Tự Động', fullName: 'Tự Động Theo Cốt Truyện', icon: '⭐', isSpecial: true, styleType: 'player' },
      { id: 'bichlam', name: 'Bích Lâm', fullName: 'Đình Bích Lâm (Mãnh Tướng Bến Cảng)', icon: '🦅', styleType: 'boss_bichlam' },
      { id: 'hoanganh', name: 'Hoàng Anh', fullName: 'Phó Đặng Hoàng Anh (Thần Cước Trấn Sơn)', icon: '⛰️', styleType: 'boss_hoanganh' },
      { id: 'dunghai', name: 'Dung Hải', fullName: 'Phó Dung Hải (Song Đao Sát Thủ)', icon: '⚔️', styleType: 'boss_dunghai' },
      { id: 'dinhan', name: 'Đình An', fullName: 'Triệu Đình An (Cận Vệ Thiết Bích)', icon: '🛡️', styleType: 'boss_dinhan' },
      { id: 'huavudai', name: 'Hứa Vũ Đại', fullName: 'Hứa Vũ Đại (Ông Trùm Mạng Lưới)', icon: '💼', styleType: 'npc_huavudai' },
      { id: 'mocdang', name: 'Mộc Đăng', fullName: 'Phó Mộc Đăng (Kiến Trúc Sư Hack EMP)', icon: '💻', isSpecial: true, styleType: 'npc_mocdang' },
      { id: 'none', name: 'Độc Hành', fullName: 'Không Mang Viện Trợ', icon: '👤', isSpecial: true, styleType: null }
    ];

    const currentSelected = (window.saveManager && window.saveManager.data && window.saveManager.data.selectedAlly) 
      || (window.allyManager && window.allyManager.selectedAllyId) 
      || 'auto';
    const selObj = alliesList.find(a => a.id === currentSelected) || alliesList[0];
    if (nameLabel) nameLabel.textContent = selObj.fullName || selObj.name;

    alliesList.forEach(a => {
      const isSpecial = a.isSpecial;
      const unlocked = isSpecial || (window.saveManager && window.saveManager.data.allyAvailability && window.saveManager.data.allyAvailability[a.id]);
      const isSelected = (currentSelected === a.id);

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'cs-ally-pill-btn' + (isSelected ? ' active' : '') + (unlocked ? '' : ' locked');
      
      // Khung chứa Avatar Chân Dung vẽ canvas
      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'cs-ally-avatar-wrap';
      
      if (a.styleType && window.skeletalRenderer) {
        const cvs = document.createElement('canvas');
        cvs.width = 32;
        cvs.height = 32;
        cvs.className = 'cs-ally-avatar-canvas';
        try {
          window.skeletalRenderer.drawPortrait(cvs, a.styleType);
        } catch (_) {
          cvs.style.display = 'none';
        }
        avatarWrap.appendChild(cvs);
      } else {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'cs-ally-icon';
        iconSpan.textContent = a.icon;
        avatarWrap.appendChild(iconSpan);
      }
      pill.appendChild(avatarWrap);

      const textSpan = document.createElement('span');
      textSpan.className = 'cs-ally-name';
      textSpan.textContent = a.name;
      pill.appendChild(textSpan);

      pill.title = (a.fullName || a.name) + (unlocked ? '' : ' — Chưa kết giao (Vượt cốt truyện để mở)');

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.click();
        if (!unlocked) {
          this.showToast('ĐỒNG MINH CHƯA KẾT GIAO — Vượt thêm cốt truyện để mở khóa!');
          return;
        }
        if (window.saveManager) {
          window.saveManager.setSelectedAlly(a.id);
        }
        if (window.allyManager) {
          window.allyManager.selectedAllyId = a.id;
          window.allyManager.updateHUD();
        }
        this.refreshAllySelector();
        this.showToast(`Đã chọn viện trợ: ${a.fullName || a.name}`);
      });

      pillsContainer.appendChild(pill);
    });
  }

  showDeploymentModal(targetStage = 1) {
    this.openCharSelect(targetStage);
  }

  startSelected() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar);
    if (!slot || slot.isLocked) {
      this.showToast('NHÂN VẬT CHƯA SẴN SÀNG!');
      return;
    }
    if (!this.isUnlocked(slot.id)) {
      const orig = (window.CHARACTERS || {})[slot.id];
      this.showToast('CHƯA MỞ KHÓA: ' + (orig ? this.lockText(orig) : 'Cần vượt màn chơi'));
      return;
    }
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = this.selectedChar;
      window.saveManager.persist();
    }
    if (this.isCampaignMode) {
      this.hideAll();
      const stageToStart = this.deploymentTargetStage || (window.saveManager && window.saveManager.data.currentStage) || 1;
      if (window.game) {
        window.game.startStage(stageToStart);
      }
    } else {
      this.showToast(`Đã lưu thiết lập: ${slot.fullName || slot.slotName}`);
      this.hideAll();
      if (window.uiManager) window.uiManager.showTitleScreen();
    }
  }

  // --------------------------------------------------------------------------
  // BẢN ĐỒ CHƯƠNG (HỒI I - V)
  // --------------------------------------------------------------------------

  setDeploymentSkin(skinType) {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    if ((slot && slot.id === 'nghi') || (slot && slot.isLocked)) {
      skinType = 'default';
    }
    if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
      window.saveManager.setSkinEquipped(this.selectedChar, skinType);
    }
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    this.updateDeploymentSkinButtons();
    this.updateWardrobeButtons();
    this.showToast(skinType === 'vovinam'
      ? 'Đã trang bị: Võ Phục Vovinam Chính Thống 🥋'
      : 'Đã trang bị: Trang Phục Mặc Định 👘');
  }

  updateDeploymentSkinButtons() {
    const slot = window.CHAR_SLOTS.find(s => s.id === this.selectedChar) || window.CHAR_SLOTS[0];
    const isNghi = !!(slot && slot.id === 'nghi');
    const isVovinam = !isNghi && window.saveManager &&
      typeof window.saveManager.isSkinEquipped === 'function' &&
      window.saveManager.isSkinEquipped(this.selectedChar, 'vovinam');
    const defBtn = document.getElementById('btn-deploy-skin-default');
    const vovBtn = document.getElementById('btn-deploy-skin-vovinam');
    if (!defBtn || !vovBtn) return;
    defBtn.classList.toggle('active', !isVovinam);
    vovBtn.classList.toggle('active', !!isVovinam);
    vovBtn.classList.toggle('hidden', isNghi || !slot || !!slot.isLocked);
  }

  confirmDeployment() {
    if (!window.game) return;
    if (window.saveManager) {
      window.saveManager.data.selectedCharacter = this.selectedChar;
      window.saveManager.persist();
    }
    this.hideAll();
    window.game.startStage(this.deploymentTargetStage || 1);
  }
}

window.MenuManagerCharSelectDeployment = MenuManagerCharSelectDeployment;
