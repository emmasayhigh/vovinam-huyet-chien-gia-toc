/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/deduction.js - Bảng Suy Luận Điều Tra Án Tình Họ Phó (Detective Board)
 */

class DeductionManager {
  constructor() {
    this.selectedCards = new Set();
    this.activeCategory = 'all'; // 'all', 'evidence', 'character', 'event'
    this.modal = null;

    // Danh sách 5 kết luận cốt truyện định sẵn
    this.deductions = [
      {
        id: 'DED_EXPULSION_TRAP',
        title: 'BẪY KHAI TRỪ NGỤY TẠO NGÀY THÁNG',
        cards: ['DOC_EXPULSION_ORDER', 'CHAR_MOCDANG', 'EVENT_SERVER_RAID'],
        conclusion: 'Lệnh khai trừ Dung Hải được Mộc Đăng ký ngày 14, nhưng kho dữ liệu bị tấn công ngày 19. Mộc Đăng đã chuẩn bị sẵn bản án trước 5 ngày để biến Dung Hải thành kẻ gánh tội thay!',
        trustEffects: { dunghai: +25, mocdang: -15 },
        flag: 'flag_deduction_expulsion_trap',
        rewardText: 'Mở khóa đoạn thoại phân giải cùng Phó Dung Hải + Tăng 25 điểm tin cậy'
      },
      {
        id: 'DED_HUAVUDAI_PACT',
        title: 'THỎA THUẬN NGẦM 7 NĂM TRƯỚC',
        cards: ['DOC_LETTER_TORN', 'CHAR_HUAVUDAI', 'CHAR_MOCDANG'],
        conclusion: 'Bức thư mật Tô Châu chứng minh Hứa Vũ Đại và Mộc Đăng đã bắt tay từ 7 năm trước để hất cẳng Dung Hải và cô lập Hoàng Anh trên núi nhằm độc chiếm quyền truy cập hạch tâm.',
        trustEffects: { hoanganh: +20, huavudai: -20 },
        flag: 'flag_deduction_huavudai_pact',
        rewardText: 'Mở khóa tài liệu giải mã Thư Tô Châu + Tăng 20 điểm tin cậy Hoàng Anh'
      },
      {
        id: 'DED_ERASED_PATRIARCH',
        title: 'BÍ MẬT NGƯỜI ANH CẢ BỊ XOÁ TÊN',
        cards: ['DOC_PHOTO_FAMILY', 'CHAR_HOANGANH', 'EVENT_DOANNGHIA'],
        conclusion: 'Khuôn mặt bị cào nát trong bức ảnh cũ chính là cựu tộc trưởng Phó Khắc Nghiệp — người đã chết trong đêm Đoạn Nghĩa Đài để trao lại di chúc phong ấn cho Hoàng Anh.',
        trustEffects: { hoanganh: +30 },
        flag: 'flag_deduction_erased_patriarch',
        rewardText: 'Mở khóa chương Biên Niên Sử: Di Nguyện Khắc Nghiệp + Tăng 30 điểm tin cậy Hoàng Anh'
      },
      {
        id: 'DED_MOCDANG_BURDEN',
        title: 'GÁNH NẶNG CAY ĐẮNG CỦA MỘC ĐĂNG',
        cards: ['DOC_CIPHER_CORE', 'CHAR_VINHTAM', 'EVENT_CORE_SALE'],
        conclusion: 'Khoản tiền 50 triệu USD Mộc Đăng nhận từ Triệu Vinh Tâm không phải để tư lợi, mà để cứu tập đoàn họ Phó thoát khỏi phá sản sau cuộc khủng hoảng tài chính.',
        trustEffects: { mocdang: +35 },
        flag: 'flag_deduction_mocdang_burden',
        rewardText: 'Hòa giải góc nhìn cùng Mộc Đăng + Tăng 35 điểm tin cậy Mộc Đăng'
      },
      {
        id: 'DED_BICHLAM_TRUTH',
        title: 'LỜI KHAI BỊ TIÊU HỦY TẠI ĐOẠN NGHĨA ĐÀI',
        cards: ['DOC_MINUTES_CLAN', 'CHAR_GIANGMANH', 'CHAR_BICHLAM'],
        conclusion: 'Bích Lâm đã giữ lại bản sao biên bản chứng minh Ngô Giang Mạnh bị khiêu khích rút vũ khí trước bởi chính kế hoạch ly gián tinh vi của Mộc Đăng và phe cánh đối địch.',
        trustEffects: { bichlam: +25, giangmanh: +20 },
        flag: 'flag_deduction_bichlam_truth',
        rewardText: 'Mở khóa chứng cứ minh oan Ngô gia + Tăng 25 điểm tin cậy Bích Lâm'
      }
    ];

    // Kho thẻ suy luận
    this.cards = {
      // 1. Thẻ Bằng Chứng (Evidence)
      DOC_PHOTO_FAMILY: { id: 'DOC_PHOTO_FAMILY', cat: 'evidence', title: 'Ảnh Tổ Đình Rạch Mặt', icon: '🖼️', stage: 1, desc: 'Bức ảnh có khuôn mặt bị cào nát bằng dao mổ' },
      DOC_EXPULSION_ORDER: { id: 'DOC_EXPULSION_ORDER', cat: 'evidence', title: 'Lệnh Khai Trừ Dung Hải', icon: '📜', stage: 3, desc: 'Văn bản có ngày tháng bị cạo sửa bất thường' },
      DOC_LETTER_TORN: { id: 'DOC_LETTER_TORN', cat: 'evidence', title: 'Thư Mật Tô Châu', icon: '✉️', stage: 4, desc: 'Thư tay đóng dấu sáp chim ưng của Hứa Vũ Đại' },
      DOC_MINUTES_CLAN: { id: 'DOC_MINUTES_CLAN', cat: 'evidence', title: 'Biên Bản Hỏi Cung', icon: '📁', stage: 6, desc: 'Lời khai bị xóa bỏ về người rút đao đầu tiên' },
      DOC_AUDIO_MOCDANG: { id: 'DOC_AUDIO_MOCDANG', cat: 'evidence', title: 'Ghi Âm Mộc Đăng', icon: '🎙️', stage: 7, desc: 'Kế hoạch mượn tay tiêu diệt song phương' },
      DOC_RESOURCE_MAP: { id: 'DOC_RESOURCE_MAP', cat: 'evidence', title: 'Bản Đồ Thập Vạn Sơn', icon: '🗺️', stage: 8, desc: 'Hồ sơ địa chất và di chúc cựu tộc trưởng' },
      DOC_CIPHER_CORE: { id: 'DOC_CIPHER_CORE', cat: 'evidence', title: 'Hạch Tâm Vi Mạch', icon: '💎', stage: 10, desc: 'Biên lai 50 triệu USD thanh toán vào Thụy Sĩ' },

      // 2. Thẻ Nhân Vật (Characters)
      CHAR_NGHI: { id: 'CHAR_NGHI', cat: 'character', title: 'Ngô Nhất Nghị', icon: '🥋', desc: 'Sát Thần Vovinam tìm kiếm sự thật' },
      CHAR_MOCDANG: { id: 'CHAR_MOCDANG', cat: 'character', title: 'Phó Mộc Đăng', icon: '👓', desc: 'Trưởng tộc họ Phó mang danh phản trắc' },
      CHAR_DUNGHAI: { id: 'CHAR_DUNGHAI', cat: 'character', title: 'Phó Dung Hải', icon: '⚔️', desc: 'Kẻ bị lưu đày 7 năm ở phương Bắc' },
      CHAR_HOANGANH: { id: 'CHAR_HOANGANH', cat: 'character', title: 'Đặng Hoàng Anh', icon: '⛏️', desc: 'Thần Cước trấn thủ đỉnh Thập Vạn Đại Sơn' },
      CHAR_HUAVUDAI: { id: 'CHAR_HUAVUDAI', cat: 'character', title: 'Hứa Vũ Đại', icon: '👔', desc: 'Ông trùm mạng lưới ngầm đầy toan tính' },
      CHAR_BICHLAM: { id: 'CHAR_BICHLAM', cat: 'character', title: 'Đình Bích Lâm', icon: '🦅', desc: 'Thủ lĩnh bến cảng nắm giữ biên bản' },
      CHAR_VINHTAM: { id: 'CHAR_VINHTAM', cat: 'character', title: 'Triệu Vinh Tâm', icon: '🏛️', desc: 'Chủ tịch Triệu gia người mua hạch tâm' },
      CHAR_GIANGMANH: { id: 'CHAR_GIANGMANH', cat: 'character', title: 'Ngô Giang Mạnh', icon: '📿', desc: 'Cựu minh chủ Đoạn Nghĩa Đài' },

      // 3. Thẻ Sự Kiện (Events)
      EVENT_DOANNGHIA: { id: 'EVENT_DOANNGHIA', cat: 'event', title: 'Huyết Án Đoạn Nghĩa', icon: '🩸', desc: 'Đêm quyết chiến định mệnh 7 năm trước' },
      EVENT_SERVER_RAID: { id: 'EVENT_SERVER_RAID', cat: 'event', title: 'Đột Kích Kho Dữ Liệu', icon: '💻', desc: 'Máy chủ Tô Châu bị đánh cắp tài liệu mật' },
      EVENT_CORE_SALE: { id: 'EVENT_CORE_SALE', cat: 'event', title: 'Bán Hạch Tâm 50M$', icon: '💰', desc: 'Giao dịch chuyển tiền ngầm giải cứu tập đoàn' },
      EVENT_KIDNAPPING: { id: 'EVENT_KIDNAPPING', cat: 'event', title: 'Bắt Cóc Hứa Vũ Đại', icon: '⛓️', desc: 'Khởi đầu chiến dịch đột nhập căn cứ ngầm' }
    };
  }

  showBoard() {
    this.createModalDOM();
    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.renderCards();
      this.renderSolvedList();
      this.renderSelectedTray();
    }
  }

  hideBoard() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
    this.selectedCards.clear();
  }

  createModalDOM() {
    if (document.getElementById('deduction-board-modal')) {
      this.modal = document.getElementById('deduction-board-modal');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'deduction-board-modal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-card wide-card deduction-board-card">
        <div class="deduction-header">
          <div class="deduction-title-wrap">
            <span class="deduction-badge">🕵️ BÀN ĐIỀU TRA ÁN TÌNH</span>
            <h2 class="modal-title deduction-title">BẢNG SUY LUẬN — HUYẾT ÁN HỌ PHÓ</h2>
          </div>
          <button id="btn-close-deduction-x" class="modal-close-icon">✕</button>
        </div>

        <!-- Filter tabs -->
        <div class="deduction-filter-row">
          <div class="deduction-filter-tabs">
            <button class="d-chip active" data-cat="all">TẤT CẢ THẺ</button>
            <button class="d-chip" data-cat="evidence">📁 BẰNG CHỨNG</button>
            <button class="d-chip" data-cat="character">👤 NHÂN VẬT</button>
            <button class="d-chip" data-cat="event">⚡ SỰ KIỆN</button>
          </div>
          <div class="deduction-stats-badge">
            <span id="deduction-solved-count">ĐÃ GIẢI MÃ: 0 / 5</span>
          </div>
        </div>

        <div class="deduction-body">
          <!-- Cột Trái: Bàn ghim thẻ (Detective Pinboard) -->
          <div class="deduction-pinboard">
            <div id="deduction-cards-grid" class="cards-pin-grid"></div>
          </div>

          <!-- Cột Phải: Bàn kết nối suy luận & Danh sách kết luận đã giải mã -->
          <div class="deduction-sidebar">
            <div class="connect-box">
              <span class="connect-head">🧶 SỢI DÂY LIÊN KẾT ĐANG CHỌN (Tối đa 3 thẻ):</span>
              <div id="selected-cards-tray" class="selected-cards-tray">
                <span class="empty-tray-text">Nhấp vào các thẻ bên trái để nối liên kết...</span>
              </div>
              <div class="connect-actions">
                <button id="btn-submit-deduction" class="btn btn-primary btn-sm">NỐI SUY LUẬN ⚡</button>
                <button id="btn-clear-selection" class="btn btn-ghost btn-sm">XÓA CHỌN</button>
              </div>
              <div id="deduction-feedback" class="deduction-feedback hidden"></div>
            </div>

            <div class="solved-deductions-box">
              <span class="solved-head">📜 KẾT LUẬN ĐÃ XÁC MINH:</span>
              <div id="solved-deductions-list" class="solved-deductions-list"></div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button id="btn-close-deduction" class="btn btn-secondary">ĐÓNG BẢNG SUY LUẬN</button>
        </div>
      </div>
    `;

    document.getElementById('ui-layer').appendChild(modal);
    this.modal = modal;

    // Wire events
    modal.querySelector('#btn-close-deduction-x').addEventListener('click', () => this.hideBoard());
    modal.querySelector('#btn-close-deduction').addEventListener('click', () => this.hideBoard());
    modal.querySelector('#btn-clear-selection').addEventListener('click', () => {
      this.selectedCards.clear();
      this.renderCards();
      this.renderSelectedTray();
    });
    modal.querySelector('#btn-submit-deduction').addEventListener('click', () => this.submitDeduction());

    // Category chips
    modal.querySelectorAll('.d-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        modal.querySelectorAll('.d-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeCategory = chip.getAttribute('data-cat') || 'all';
        this.renderCards();
      });
    });
  }

  toggleCard(cardId) {
    if (this.selectedCards.has(cardId)) {
      this.selectedCards.delete(cardId);
    } else {
      if (this.selectedCards.size >= 3) {
        if (window.uiManager) window.uiManager.showToast('CHỈ ĐƯỢC CHỌN TỐI ĐA 3 THẺ ĐỂ NỐI SUY LUẬN!');
        return;
      }
      this.selectedCards.add(cardId);
    }
    if (window.audioManager) window.audioManager.playClick();
    this.renderCards();
    this.renderSelectedTray();
  }

  renderCards() {
    const grid = document.getElementById('deduction-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const inv = window.investigationManager;
    const save = window.saveManager;

    Object.values(this.cards).forEach(card => {
      if (this.activeCategory !== 'all' && card.cat !== this.activeCategory) return;

      // Kiểm tra xem thẻ bằng chứng đã được tìm thấy trong màn chưa
      let isUnlocked = true;
      if (card.cat === 'evidence') {
        isUnlocked = inv ? inv.isFound(card.id) : true;
      }

      const isSelected = this.selectedCards.has(card.id);

      const el = document.createElement('div');
      el.className = `d-pin-card ${card.cat} ${isSelected ? 'selected' : ''} ${isUnlocked ? '' : 'locked'}`;
      el.innerHTML = `
        <div class="pin-head">📌</div>
        <div class="card-icon">${card.icon}</div>
        <div class="card-title">${card.title}</div>
        <div class="card-desc">${isUnlocked ? card.desc : `Chưa thu thập (Tìm tại Màn ${card.stage || '?'})`}</div>
      `;

      if (isUnlocked) {
        el.addEventListener('click', () => this.toggleCard(card.id));
      } else {
        el.addEventListener('click', () => {
          if (window.uiManager) window.uiManager.showToast(`BẰNG CHỨNG CHƯA TÌM THẤY — Hãy tìm tại Màn ${card.stage || '?'}`);
        });
      }

      grid.appendChild(el);
    });
  }

  renderSelectedTray() {
    const tray = document.getElementById('selected-cards-tray');
    if (!tray) return;

    if (!this.selectedCards.size) {
      tray.innerHTML = `<span class="empty-tray-text">Nhấp vào các thẻ bên trái để nối liên kết...</span>`;
      return;
    }

    tray.innerHTML = '';
    this.selectedCards.forEach(cid => {
      const card = this.cards[cid];
      if (!card) return;
      const tag = document.createElement('div');
      tag.className = `tray-tag ${card.cat}`;
      tag.innerHTML = `<span>${card.icon} ${card.title}</span> <span class="tag-rm">✕</span>`;
      tag.querySelector('.tag-rm').addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedCards.delete(cid);
        this.renderCards();
        this.renderSelectedTray();
      });
      tray.appendChild(tag);
    });
  }

  submitDeduction() {
    const fb = document.getElementById('deduction-feedback');
    if (this.selectedCards.size < 2) {
      if (fb) {
        fb.textContent = 'Hãy chọn ít nhất 2 hoặc 3 thẻ để tạo mắt xích suy luận!';
        fb.className = 'deduction-feedback warn';
        fb.classList.remove('hidden');
      }
      return;
    }

    const matchedDeduction = this.checkDeductionMatch(this.selectedCards);

    if (matchedDeduction) {
      // Đúng suy luận!
      const save = window.saveManager;
      const isNew = save ? save.solveDeduction(matchedDeduction.id, matchedDeduction.trustEffects, matchedDeduction.flag) : true;


      // Cập nhật độ tin cậy và cờ cốt truyện
      if (save) {
        if (matchedDeduction.flag) {
          save.data.storyFlags[matchedDeduction.flag] = true;
        }
        if (matchedDeduction.trustEffects) {
          Object.keys(matchedDeduction.trustEffects).forEach(ch => {
            if (save.data.characterTrust[ch] !== undefined) {
              save.data.characterTrust[ch] = Math.max(0, Math.min(100, save.data.characterTrust[ch] + matchedDeduction.trustEffects[ch]));
            }
          });
        }
        if (save.data.deductionsSolved && save.data.deductionsSolved.length >= 5) {
          save.unlockAchievement('deduction_master');
        }
        save.persist();
      }

      if (window.audioManager) {
        window.audioManager.playVictory();
      }
      if (window.effectManager) {
        window.effectManager.triggerFlash('#00d2ff', 0.4);
      }

      if (fb) {
        fb.innerHTML = `
          <strong>✓ SUY LUẬN CHÍNH XÁC: ${matchedDeduction.title}!</strong>
          <p>${matchedDeduction.conclusion}</p>
          <div class="reward-tag">${matchedDeduction.rewardText}</div>
        `;
        fb.className = 'deduction-feedback success';
        fb.classList.remove('hidden');
      }

      this.selectedCards.clear();
      this.renderCards();
      this.renderSelectedTray();
      this.renderSolvedList();
    } else {
      // Suy luận chưa khớp
      if (window.audioManager) window.audioManager.playClick();
      if (fb) {
        fb.innerHTML = `
          <strong>Mối liên kết chưa tạo nên suy luận logic!</strong>
          <p>Các tài liệu và nhân vật được chọn chưa tìm thấy điểm giao thoa thời gian hoặc động cơ hợp lý. Hãy đối chiếu lại hồ sơ điều tra.</p>
        `;
        fb.className = 'deduction-feedback neutral';
        fb.classList.remove('hidden');
      }
    }
  }

  renderSolvedList() {
    const list = document.getElementById('solved-deductions-list');
    const countEl = document.getElementById('deduction-solved-count');
    if (!list) return;

    const save = window.saveManager;
    const solvedIds = (save && save.data.deductionsSolved) || [];

    if (countEl) {
      countEl.textContent = `ĐÃ GIẢI MÃ: ${solvedIds.length} / ${this.deductions.length}`;
    }

    if (!solvedIds.length) {
      list.innerHTML = `<span class="empty-solved-text">Chưa có kết luận nào được xác minh. Hãy kết nối các thẻ để phá án!</span>`;
      return;
    }

    list.innerHTML = '';
    this.deductions.forEach(d => {
      const isSolved = solvedIds.includes(d.id);
      if (!isSolved) return;

      const item = document.createElement('div');
      item.className = 'solved-item';
      item.innerHTML = `
        <div class="solved-item-head">
          <span class="check-icon">✓</span>
          <span class="solved-title">${d.title}</span>
        </div>
        <p class="solved-desc">${d.conclusion}</p>
        <div class="solved-cards-used">
          ${d.cards.map(cid => `<span class="mini-tag">${this.cards[cid] ? this.cards[cid].title : cid}</span>`).join(' + ')}
        </div>
      `;
      list.appendChild(item);
    });
  }

  checkDeductionMatch(cards) {
    if (!cards) return null;
    const currentArray = Array.from(cards).sort();
    if (currentArray.length < 2) return null;

    for (const d of this.deductions) {
      const targetArray = [...d.cards].sort();
      if (currentArray.length === targetArray.length && currentArray.every((val, index) => val === targetArray[index])) {
        return d;
      }
    }
    return null;
  }

  executeDeduction() {
    const matched = this.checkDeductionMatch(this.selectedCards);
    if (matched) {
      const save = window.saveManager;
      if (save) {
        save.solveDeduction(matched.id, matched.trustEffects, matched.flag);
      }
      return { success: true, deduction: matched };
    }
    return { success: false, deduction: null };
  }

  getSolvedCount() {
    const save = window.saveManager;
    return (save && save.data.deductionsSolved) ? save.data.deductionsSolved.length : 0;
  }
}

const deductionManager = new DeductionManager();
window.DeductionManager = DeductionManager;
window.deductionManager = deductionManager;

