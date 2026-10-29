/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/tutorial/tutorialManagerOverlay.js - Graduation, slow-mo alert, invite modal va HUD.
 */

class TutorialManagerOverlay extends window.TutorialManagerBase {
  showGraduationScreen() {
    let gradEl = document.getElementById('tutorial-graduation-modal');
    if (!gradEl) {
      gradEl = document.createElement('div');
      gradEl.id = 'tutorial-graduation-modal';
      gradEl.className = 'tut-grad-modal';
      const uiLayer = document.getElementById('ui-layer') || document.body;
      uiLayer.appendChild(gradEl);
    }

    gradEl.innerHTML = `
      <div class="tut-grad-card">
        <span class="tut-grad-badge">❖ KHẢO HẠCH VIỆT VÕ ĐẠO ❖</span>
        <h1 class="tut-grad-title">ĐẠI CÔNG CÁO THÀNH</h1>
        <div class="tut-grad-divider"></div>
        <div class="tut-grad-speech">
          <strong>VÕ SƯ HUẤN LUYỆN (SƯ HUYNH):</strong>
          <p>"Xuất sắc! Bộ pháp vững vàng, quyền cước sắc bén, thân pháp biến ảo khôn lường. Đạo nghĩa và bản lĩnh của ngươi đã đủ để trấn giữ gia tộc họ Phó. Hãy bước ra chiến trường và mang công lý trở về!"</p>
        </div>
        <div class="tut-grad-rewards">
          <span class="tut-reward-pill">🏆 Thành Tích Mở Khóa: Bậc Thầy Tân Thủ</span>
          <span class="tut-reward-pill">⚡ Thân Pháp Vô Lỗi & Phản Đòn</span>
        </div>
        <div class="tut-grad-actions">
          <button id="btn-tut-start-campaign" class="btn-grad-primary">⚔️ BẮT ĐẦU CHIẾN DỊCH NGAY [ENTER]</button>
          <button id="btn-tut-main-menu" class="btn-grad-secondary">🏠 VỀ TRANG CHỦ [ESC]</button>
        </div>
      </div>
    `;

    gradEl.classList.remove('hidden');
    this.graduationModalEl = gradEl;

    const btnStart = gradEl.querySelector('#btn-tut-start-campaign');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.endTutorialAndStartStage1();
      });
    }

    const btnMenu = gradEl.querySelector('#btn-tut-main-menu');
    if (btnMenu) {
      btnMenu.addEventListener('click', () => {
        this.endTutorialAndReturnMenu();
      });
    }
  }


  showSlowMoAlert(promptText) {
    let alertEl = document.getElementById('tutorial-bullet-alert');
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.id = 'tutorial-bullet-alert';
      alertEl.className = 'tut-bullet-alert';
      const uiLayer = document.getElementById('ui-layer') || document.body;
      uiLayer.appendChild(alertEl);
    }
    alertEl.innerHTML = `
      <div class="tut-bullet-icon">⚡ CƠ HỘI PHẢN XẠ ⚡</div>
      <div class="tut-bullet-prompt">${promptText}</div>
      <div class="tut-bullet-sub">Thời gian đang chậm lại — Nhấn phím để thực thi Thân Pháp!</div>
    `;
    alertEl.classList.remove('hidden');
    this.bulletAlertEl = alertEl;
  }

  hideSlowMoAlert() {
    const alertEl = document.getElementById('tutorial-bullet-alert');
    if (alertEl) alertEl.classList.add('hidden');
  }

  showInviteModal(onAccept, onSkip) {
    let modal = document.getElementById('tutorial-invite-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tutorial-invite-modal';
      modal.className = 'tut-invite-modal';
      const uiLayer = document.getElementById('ui-layer') || document.body;
      uiLayer.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="tut-invite-card">
        <span class="tut-grad-badge">❖ NHẬP MÔN KHẢO HẠCH ❖</span>
        <h2>CHÀO MỪNG ĐẾN VỚI VIỆT VÕ ĐẠO</h2>
        <p>Bạn có muốn bước vào Võ Đường Huấn Luyện để làm quen bộ pháp di chuyển, đòn quyền cước, thân pháp né đòn và tuyệt kỹ phản đòn cùng Sư Huynh không?</p>
        <div class="tut-grad-actions">
          <button id="btn-invite-accept" class="btn-grad-primary">🥋 VÀO HƯỚNG DẪN TÂN THỦ (KHUYÊN DÙNG)</button>
          <button id="btn-invite-skip" class="btn-grad-secondary">⏩ BỎ QUA, VÀO CHIẾN DỊCH</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    this.inviteModalEl = modal;

    const btnAccept = modal.querySelector('#btn-invite-accept');
    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (onAccept) onAccept();
      });
    }

    const btnSkip = modal.querySelector('#btn-invite-skip');
    if (btnSkip) {
      btnSkip.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (onSkip) onSkip();
      });
    }
  }

  showOverlay() {
    let el = document.getElementById('tutorial-hud-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tutorial-hud-overlay';
      el.className = 'tutorial-overlay';
      const uiLayer = document.getElementById('ui-layer') || document.body;
      uiLayer.appendChild(el);
    }
    el.classList.remove('hidden');
    this.overlay = el;
    this.updateOverlayUI();
  }

  hideOverlay() {
    const el = document.getElementById('tutorial-hud-overlay');
    if (el) el.classList.add('hidden');
    this.hideSlowMoAlert();
  }

  updateOverlayUI() {
    if (!this.overlay) return;
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    // Sinh các chấm tiến độ bước 1-10
    const dotsHtml = this.steps.map((s, i) => {
      let cls = 'tut-dot';
      if (i < this.currentStepIndex) cls += ' done';
      else if (i === this.currentStepIndex) cls += ' current';
      return `<span class="${cls}" title="${s.title}"></span>`;
    }).join('');

    // Hiển thị trạng thái chi tiết 4 hướng nếu đang ở Bước 1
    let extraStatusHtml = '';
    if (step.id === 'tut_move') {
      extraStatusHtml = `
        <div class="tut-directions-status">
          <div class="tut-dir-chip ${this.moveDirs.right ? 'done' : ''}">
            <span>▶ TIẾN (D / →)</span>
            <strong>${this.moveDirs.right ? '✓ ĐẠT' : '...'}</strong>
          </div>
          <div class="tut-dir-chip ${this.moveDirs.left ? 'done' : ''}">
            <span>◀ LÙI (A / ←)</span>
            <strong>${this.moveDirs.left ? '✓ ĐẠT' : '...'}</strong>
          </div>
          <div class="tut-dir-chip ${this.moveDirs.up ? 'done' : ''}">
            <span>▲ LÀN SÂU (W / ↑)</span>
            <strong>${this.moveDirs.up ? '✓ ĐẠT' : '...'}</strong>
          </div>
          <div class="tut-dir-chip ${this.moveDirs.down ? 'done' : ''}">
            <span>▼ LÀN TRƯỚC (S / ↓)</span>
            <strong>${this.moveDirs.down ? '✓ ĐẠT' : '...'}</strong>
          </div>
        </div>
      `;
    }

    this.overlay.innerHTML = `
      <div class="tutorial-card">
        <div class="tutorial-header">
          <span class="tutorial-tag">❖ KHẢO HẠCH VIỆT VÕ ĐẠO ❖</span>
          <span class="tutorial-step">BƯỚC ${this.currentStepIndex + 1} / ${this.steps.length}</span>
        </div>

        <div class="tut-master-row">
          <div class="tut-master-avatar">🥋</div>
          <div class="tut-master-content">
            <div class="tut-master-speaker">VÕ SƯ HUẤN LUYỆN (SƯ HUYNH)</div>
            <p class="tut-master-quote">"${step.masterQuote}"</p>
          </div>
        </div>

        <h2 class="tutorial-title">${step.title}</h2>
        <p class="tutorial-desc">${step.desc}</p>

        <div class="tutorial-keys-box">
          <span class="keys-label">THAO TÁC:</span>
          <span class="keys-content">${step.keys}</span>
        </div>

        ${extraStatusHtml}

        <div class="tutorial-progress-row">
          <div class="tut-bar-shell">
            <div class="tut-bar-fill" style="width: ${Math.min(100, (this.stepProgress / this.stepTarget) * 100)}%"></div>
          </div>
          <span class="tut-progress-text">${this.stepProgress} / ${this.stepTarget}</span>
        </div>

        <div class="tutorial-hint">💡 ${step.hint}</div>

        <div class="tutorial-actions">
          <div class="tut-step-dots">${dotsHtml}</div>
          <button id="btn-tutorial-skip" class="btn-skip-tutorial">[TAB] BỎ QUA GỢI Ý ⏩</button>
        </div>
      </div>
    `;

    const btnSkip = this.overlay.querySelector('#btn-tutorial-skip');
    if (btnSkip) btnSkip.addEventListener('click', () => this.skipTutorial());

    this.refreshKeycapHighlights();
  }

}

window.TutorialManagerOverlay = TutorialManagerOverlay;
