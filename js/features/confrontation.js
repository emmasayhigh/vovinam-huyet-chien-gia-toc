/**
 * VOVINAM: HUYẾT ÁN HỌ PHÓ — THE ERASED BLOODLINE
 * js/confrontation.js - Cao Trào Phó Gia: Ba Người, Ba Sự Thật
 *
 * Phân đoạn đối chất đỉnh cao giữa:
 * - Phó Mộc Đăng (Kiểm soát thông tin)
 * - Phó Dung Hải (Kẻ bị khai trừ)
 * - Phó Đặng Hoàng Anh (Người bảo vệ Thập Vạn Đại Sơn)
 * Với sự phán xét và chất vấn bằng chứng của Ngô Nhất Nghị.
 */

class ClanConfrontation {
  constructor() {
    this.isActive = false;
    this.currentPhase = 1; // 1: Testimonies, 2: Present Evidence, 3: Contradiction, 4: Final Verdict
    this.presentedEvidence = [];
    this.activeEvidenceId = null;
    this.modal = null;
    this.onCompleteCallback = null;
  }

  startConfrontation(onComplete) {
    this.isActive = true;
    this.currentPhase = 1;
    this.presentedEvidence = [];
    this.activeEvidenceId = null;
    this.onCompleteCallback = onComplete;

    this.modal = document.getElementById('confrontation-modal');
    if (!this.modal) {
      console.warn('Confrontation modal not found!');
      if (onComplete) onComplete();
      return;
    }

    if (window.audioManager) {
      window.audioManager.setBGMIntensity(0.8);
      window.audioManager.playGong(0.4);
    }

    this.renderPhase1();
    this.modal.classList.remove('hidden');
  }

  // Giai đoạn 1: Ba lời kể
  renderPhase1() {
    this.currentPhase = 1;
    const container = document.getElementById('confrontation-body');
    if (!container) return;

    container.innerHTML = `
      <div class="confrontation-header">
        <span class="conf-badge">HỘI NGHỊ ĐỐI CHẤT TỐI CAO</span>
        <h2 class="conf-title">BA NGƯỜI, BA SỰ THẬT</h2>
        <p class="conf-subtitle">Giai đoạn 1: Lắng nghe lời kể của từng nhân vật trước khi chất vấn bằng chứng.</p>
      </div>

      <div class="testimony-grid">
        <!-- Phó Mộc Đăng -->
        <div class="testimony-card mocdang-card">
          <div class="card-speaker">
            <canvas id="conf-face-mocdang" width="80" height="80"></canvas>
            <div class="speaker-meta">
              <h4>PHÓ MỘC ĐĂNG</h4>
              <span>THIÊN TÀI CÔNG NGHỆ — CHỦ GIA TỘC</span>
            </div>
          </div>
          <div class="testimony-quote">
            <em>"Nghị, tôi không chối bỏ việc mình kiểm soát dữ liệu. Nếu tôi không phân loại thông tin và giấu đi một phần hạch tâm, liên minh Triệu — Ngô đã xé xác họ Phó từ 7 năm trước! Thứ tôi bảo vệ là mạng sống của cả ngàn con người!"</em>
          </div>
        </div>

        <!-- Phó Dung Hải -->
        <div class="testimony-card dunghai-card">
          <div class="card-speaker">
            <canvas id="conf-face-dunghai" width="80" height="80"></canvas>
            <div class="speaker-meta">
              <h4>PHÓ DUNG HẢI</h4>
              <span>KẺ BỊ KHAI TRỪ — 7 NĂM LƯU ĐÀY</span>
            </div>
          </div>
          <div class="testimony-quote">
            <em>"Nói dối trơ trẽn! Anh Khắc Nghiệp đã hoàn thành hạch tâm và muốn dùng nó cứu trợ vùng biên cương. Nhưng các người muốn biến nó thành độc quyền! Các người ký lệnh trục xuất tôi trước khi kho dữ liệu bị cướp, rồi đổ hết tội lên đầu tôi!"</em>
          </div>
        </div>

        <!-- Phó Đặng Hoàng Anh -->
        <div class="testimony-card hoanganh-card">
          <div class="card-speaker">
            <canvas id="conf-face-hoanganh" width="80" height="80"></canvas>
            <div class="speaker-meta">
              <h4>PHÓ ĐẶNG HOÀNG ANH</h4>
              <span>TRẤN THỦ THẬP VẠN ĐẠI SƠN</span>
            </div>
          </div>
          <div class="testimony-quote">
            <em>"Hai người cãi nhau đủ chưa? Núi Thập Vạn Đại Sơn không phải nơi để các người đem thủ đoạn chính trị ra mặc cả! Anh Khắc Nghiệp trước khi chết đã dặn tôi: Không ai được mở hạch tâm nếu lòng người chưa thanh sạch!"</em>
          </div>
        </div>
      </div>

      <div class="confrontation-actions">
        <button id="btn-conf-to-phase2" class="btn btn-primary">BƯỚC VÀO CHẤT VẤN BẰNG CHỨNG [PHASE 2] ➔</button>
      </div>
    `;

    this.drawPortraits();

    const btnNext = document.getElementById('btn-conf-to-phase2');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (window.audioManager) window.audioManager.playClick();
        this.renderPhase2();
      });
    }
  }

  // Giai đoạn 2: Người chơi đưa bằng chứng
  renderPhase2() {
    this.currentPhase = 2;
    const container = document.getElementById('confrontation-body');
    if (!container) return;

    const sm = window.saveManager;
    const inv = window.investigationManager;
    const foundDocs = (sm && sm.data.evidenceFound) ? sm.data.evidenceFound : [];

    container.innerHTML = `
      <div class="confrontation-header">
        <span class="conf-badge">CHẤT VẤN VẬT CHỨNG</span>
        <h2 class="conf-title">ĐỐI CHIẾU HỒ SƠ LÊN BÀN</h2>
        <p class="conf-subtitle">Giai đoạn 2: Chọn tài liệu bạn đã thực sự tìm thấy để đặt lên bàn đối chất.</p>
      </div>

      <div class="evidence-selection-layout">
        <div class="evidence-tray-col">
          <h4>BẰNG CHỨNG TRONG HỒ SƠ CỦA NGHỊ (${foundDocs.length} tài liệu)</h4>
          <div id="conf-evidence-list" class="conf-evidence-list"></div>
        </div>

        <div class="evidence-reaction-col">
          <div id="conf-evidence-detail" class="conf-evidence-detail">
            <p class="hint-text">Chọn một tài liệu ở bên trái để chất vấn ba người...</p>
          </div>
        </div>
      </div>

      <div class="confrontation-actions">
        <button id="btn-conf-to-phase3" class="btn btn-primary" ${this.presentedEvidence.length > 0 ? '' : 'disabled'}>
          TIẾN VÀO CAO TRÀO BẤT HOÀ [PHASE 3] (${this.presentedEvidence.length} BẰNG CHỨNG ĐÃ ĐỐI CHIẾU) ➔
        </button>
      </div>
    `;

    const listEl = document.getElementById('conf-evidence-list');
    if (foundDocs.length === 0) {
      listEl.innerHTML = '<p class="empty-hint">Bạn chưa tìm thấy bằng chứng nào. Các nhân vật sẽ chỉ tin vào phán đoán chủ quan.</p>';
      const btnP3 = document.getElementById('btn-conf-to-phase3');
      if (btnP3) btnP3.removeAttribute('disabled');
    } else {
      foundDocs.forEach(docId => {
        const doc = inv.docs[docId];
        if (!doc) return;
        const btn = document.createElement('button');
        const isPut = this.presentedEvidence.includes(docId);
        btn.className = 'conf-doc-item' + (isPut ? ' placed' : '');
        btn.innerHTML = `
          <span class="doc-icon">${isPut ? '✔' : '📄'}</span>
          <div class="doc-meta-mini">
            <strong>${doc.title}</strong>
            <small>${doc.typeName}</small>
          </div>
        `;
        btn.addEventListener('click', () => {
          this.inspectAndPlaceEvidence(docId);
        });
        listEl.appendChild(btn);
      });
    }

    const btnPhase3 = document.getElementById('btn-conf-to-phase3');
    if (btnPhase3) {
      btnPhase3.addEventListener('click', () => {
        if (window.audioManager) window.audioManager.playClick();
        this.renderPhase3();
      });
    }
  }

  inspectAndPlaceEvidence(docId) {
    const inv = window.investigationManager;
    const doc = inv.docs[docId];
    if (!doc) return;

    if (!this.presentedEvidence.includes(docId)) {
      this.presentedEvidence.push(docId);
      if (window.audioManager) window.audioManager.playPaper();
    }

    const detailEl = document.getElementById('conf-evidence-detail');
    if (!detailEl) return;

    // Phản ứng cụ thể của 3 nhân vật với tài liệu này
    let reactionText = '';
    if (docId === 'DOC_EXPULSION_ORDER') {
      reactionText = `
        <div class="reactions-box">
          <div class="reaction-item"><strong style="color:#00d2ff">Phó Mộc Đăng:</strong> (Trầm ngâm né tránh ánh mắt) "...Tôi đã ký nó. Nhưng đó là cách duy nhất để cứu mạng Dung Hải khỏi sự truy lùng của Triệu gia!"</div>
          <div class="reaction-item"><strong style="color:#a3e635">Phó Dung Hải:</strong> "Cứu mạng tôi bằng 7 năm lưu đày tuyết trắng Hắc Long Giang sao?! Đồ đạo đức giả!"</div>
          <div class="reaction-item"><strong style="color:#ffd700">Hoàng Anh:</strong> (Nghiến răng nhìn Mộc Đăng) "Cậu đã lừa tôi rằng chính Dung Hải làm phản. Cậu nợ anh em một câu trả lời."</div>
        </div>
      `;
    } else if (docId === 'DOC_LETTER_TORN') {
      reactionText = `
        <div class="reactions-box">
          <div class="reaction-item"><strong style="color:#00d2ff">Phó Mộc Đăng:</strong> "Hứa Vũ Đại đã uy hiếp tôi! Ông ta nắm giữ mạng lưới ngầm và đe dọa phá huỷ nguồn chip lượng tử của họ Phó!"</div>
          <div class="reaction-item"><strong style="color:#a3e635">Phó Dung Hải:</strong> "Vậy nên anh bán rẻ anh em mình cho một con cáo già như Hứa Vũ Đại?!"</div>
          <div class="reaction-item"><strong style="color:#ffd700">Hoàng Anh:</strong> "Đó là lý do tôi không bao giờ rời khỏi Thập Vạn Đại Sơn. Ở dưới phố chỉ toàn sự dối trá."</div>
        </div>
      `;
    } else if (docId === 'DOC_PHOTO_FAMILY') {
      reactionText = `
        <div class="reactions-box">
          <div class="reaction-item"><strong style="color:#00d2ff">Phó Mộc Đăng:</strong> (Giọng run rẩy) "Bức ảnh này... Anh Khắc Nghiệp... Tôi không rạch mặt anh ấy. Kẻ làm điều đó là Triệu Vinh Tâm để sỉ nhục gia tộc!"</div>
          <div class="reaction-item"><strong style="color:#a3e635">Phó Dung Hải:</strong> "Nhưng anh đã giấu nó suốt 10 năm và xoá tên anh ấy khỏi gia phả để ngồi vào ghế Tộc Trưởng!"</div>
          <div class="reaction-item"><strong style="color:#ffd700">Hoàng Anh:</strong> (Đặt tay lên ngực) "Anh Khắc Nghiệp... người đã trao cho tôi cây cuốc trấn sơn này..."</div>
        </div>
      `;
    } else if (docId === 'DOC_AUDIO_MOCDANG') {
      reactionText = `
        <div class="reactions-box">
          <div class="reaction-item"><strong style="color:#00d2ff">Phó Mộc Đăng:</strong> (Cúi đầu) "Đoạn ghi âm... Tôi thừa nhận tôi đã toan tính sai lầm. Tôi sợ Nghị và Dung Hải sẽ bắt tay nhau lật đổ tôi..."</div>
          <div class="reaction-item"><strong style="color:#a3e635">Phó Dung Hải:</strong> "Thấy chưa, Nghị?! Hắn coi cậu chỉ là một con dao để hắn gạt bỏ kẻ thù!"</div>
          <div class="reaction-item"><strong style="color:#ffd700">Hoàng Anh:</strong> "Nghị đã chiến đấu bằng cả tính mạng để tìm ra sự thật. Cậu không xứng đáng với lòng trung thành của cậu ấy."</div>
        </div>
      `;
    } else {
      reactionText = `
        <div class="reactions-box">
          <div class="reaction-item"><strong style="color:#ffd700">Cả ba nhân vật:</strong> Đều im lặng nhìn vào văn bản. Những bí mật đen tối của hai thập kỷ qua cuối cùng cũng phải phơi bày dưới ánh đèn.</div>
        </div>
      `;
    }

    detailEl.innerHTML = `
      <div class="placed-doc-card">
        <span class="placed-tag">ĐÃ ĐẶT LÊN BÀN ĐỐI CHẤT</span>
        <h3>${doc.title}</h3>
        <p class="placed-desc">${doc.shortDesc}</p>
        <div class="placed-content">${doc.content.substring(0, 320)}...</div>
        <hr class="conf-divider"/>
        <h4>PHẢN ỨNG TỨC THỜI CỦA CÁC BÊN:</h4>
        ${reactionText}
      </div>
    `;

    // Cập nhật nút phase 3
    const btnP3 = document.getElementById('btn-conf-to-phase3');
    if (btnP3) {
      btnP3.removeAttribute('disabled');
      btnP3.textContent = `TIẾN VÀO CAO TRÀO BẤT HOÀ [PHASE 3] (${this.presentedEvidence.length} BẰNG CHỨNG ĐÃ ĐỐI CHIẾU) ➔`;
    }
  }

  // Giai đoạn 3: Mâu thuẫn lộ diện
  renderPhase3() {
    this.currentPhase = 3;
    const container = document.getElementById('confrontation-body');
    if (!container) return;

    if (window.audioManager) window.audioManager.setBGMIntensity(1.2);

    container.innerHTML = `
      <div class="confrontation-header">
        <span class="conf-badge">CAO TRÀO MÂU THUẪN</span>
        <h2 class="conf-title">BỨC TƯỜNG DỐI TRÁ SỤP ĐỔ</h2>
        <p class="conf-subtitle">Giai đoạn 3: Mộc Đăng thừa nhận sai lầm, Dung Hải đòi lại danh dự, Hoàng Anh đưa ra thử thách.</p>
      </div>

      <div class="climax-narrative">
        <div class="climax-block">
          <p>
            Phó Mộc Đăng tháo cặp kính gọng kim loại xuống, mệt mỏi xoa hai bên thái dương. 
            Không còn vẻ ngạo nghễ của một thiên tài công nghệ kiểm soát vạn tỷ Nhân dân tệ. 
            Trước mắt Nghị chỉ là một người em trai đã gánh vác món nợ máu của gia tộc suốt bảy năm trong cô độc.
          </p>
          <blockquote class="climax-quote">
            "Nghị... Cậu là người ngoài cuộc duy nhất bước vào vòng xoáy này mà không bị lòng tham làm vấy bẩn. 
            Tôi biết tội lỗi của mình. Tôi đã vu khống Dung Hải, lợi dụng anh em, và bắt tay với Hứa Vũ Đại. 
            Nhưng tôi xin thề: nếu hạch tâm này bị rò rỉ ra thế giới, cuộc huyết chiến sẽ không dừng lại ở ba gia tộc. Hàng triệu người sẽ rơi vào cảnh lầm than."
          </blockquote>
          <p>
            Dung Hải nhìn Mộc Đăng, ánh mắt từ căm hận chuyển sang một nỗi chua xót khôn nguôi:
            <em>"Bảy năm qua, thứ tôi muốn không phải là tiền của họ Phó... Tôi chỉ muốn người ta biết rằng tôi không phản bội anh Khắc Nghiệp."</em>
          </p>
          <p>
            Hoàng Anh bước lên một bước, dựng cây cuốc sắt xuống sàn đá:
            <em>"Nghị. Cậu đã cầm Bạch đai Vovinam bước qua Thập Vạn Đại Sơn. Quyền quyết định giờ đây nằm trong tay cậu. Chúng tôi sẽ nghe theo phán quyết của cậu."</em>
          </p>
        </div>
      </div>

      <div class="confrontation-actions">
        <button id="btn-conf-to-phase4" class="btn btn-primary">ĐƯA RA PHÁN QUYẾT TỐI HẬU [PHASE 4] ➔</button>
      </div>
    `;

    const btnNext = document.getElementById('btn-conf-to-phase4');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (window.audioManager) window.audioManager.playClick();
        this.renderPhase4();
      });
    }
  }

  // Giai đoạn 4: Phán quyết tối hậu
  renderPhase4() {
    this.currentPhase = 4;
    const container = document.getElementById('confrontation-body');
    if (!container) return;

    const inv = window.investigationManager;
    const canSecret = inv.canUnlockSecretEnding();

    container.innerHTML = `
      <div class="confrontation-header">
        <span class="conf-badge">PHÁN QUYẾT TỐI CAO</span>
        <h2 class="conf-title">CON ĐƯỜNG CHO HỌ PHÓ</h2>
        <p class="conf-subtitle">Giai đoạn 4: Quyết định của Ngô Nhất Nghị sẽ định đoạt kết thúc của toàn bộ Đại Lục.</p>
      </div>

      <div class="verdict-options-grid">
        <!-- Lựa chọn 1: Công khai sự thật -->
        <div class="verdict-card" data-verdict="public_expose">
          <h4>1. CÔNG KHAI TOÀN BỘ SỰ THẬT</h4>
          <p>Đưa hồ sơ lên truyền thông và cơ quan giám sát độc lập. Dung Hải được minh oan hoàn toàn, Mộc Đăng từ chức, nhưng họ Phó sẽ mất vị thế độc quyền công nghệ.</p>
          <span class="verdict-effect">➔ Dẫn tới Kết Thúc Chân Tướng / Phản Bội</span>
        </div>

        <!-- Lựa chọn 2: Niêm phong Thập Vạn Đại Sơn -->
        <div class="verdict-card" data-verdict="seal_mountain">
          <h4>2. NIÊM PHONG BÍ MẬT TRÊN ĐỈNH NÚI</h4>
          <p>Giao toàn bộ hạch tâm cho Hoàng Anh chôn sâu trong lòng Thập Vạn Đại Sơn. Cắt đứt tranh đoạt, gia tộc họ Phó tiếp tục vận hành dưới bóng tối.</p>
          <span class="verdict-effect">➔ Dẫn tới Kết Thúc Trung Thành / Huyết Chiến</span>
        </div>

        <!-- Lựa chọn 3: Hòa giải ba người — Hội đồng tam quyền -->
        <div class="verdict-card" data-verdict="reform_council">
          <h4>3. THÀNH LẬP HỘI ĐỒNG TAM QUYỀN</h4>
          <p>Buộc Mộc Đăng chia sẻ quyền kiểm soát cho Dung Hải và Hoàng Anh. Khôi phục danh dự người đã khuất, cải tổ gia tộc từ gốc rễ.</p>
          <span class="verdict-effect">➔ Tăng mạnh tín nhiệm cả 3 nhân vật</span>
        </div>

        ${canSecret ? `
        <!-- Lựa chọn 4: Secret True Ending -->
        <div class="verdict-card secret-card" data-verdict="secret_true_bloodline">
          <div class="secret-tag">★ ĐÃ ĐỦ ĐIỀU KIỆN ĐẶC BIỆT</div>
          <h4>4. KHÔI PHỤC HUYẾT MẠCH: CHÂN TƯỚNG TỐI HẬU</h4>
          <p>Sử dụng trọn bộ 5 bằng chứng đã giải mã để giải tỏa mối thù giữa họ Phó, họ Ngô và họ Triệu. Mở cửa Thập Vạn Đại Sơn thành viện nghiên cứu hòa bình.</p>
          <span class="verdict-effect">➔ MỞ KHÓA KẾT THÚC BÍ MẬT 5: HUYẾT MẠCH KHÔI PHỤC</span>
        </div>
        ` : `
        <div class="verdict-card locked-verdict">
          <h4>🔒 KẾT THÚC BÍ MẬT (CHƯA ĐỦ ĐIỀU KIỆN)</h4>
          <p>Yêu cầu thu thập và giải mã đủ các bằng chứng: Ảnh Cũ, Lệnh Khai Trừ, Ghi Âm Mộc Đăng, Bản Đồ Thập Vạn Đại Sơn và Hạch Tâm Mật Mã.</p>
        </div>
        `}
      </div>
    `;

    // Gắn sự kiện chọn phán quyết
    const cards = container.querySelectorAll('.verdict-card:not(.locked-verdict)');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const vId = card.getAttribute('data-verdict');
        this.executeVerdict(vId);
      });
    });
  }

  executeVerdict(verdictId) {
    const sm = window.saveManager;
    const inv = window.investigationManager;

    if (verdictId === 'public_expose') {
      if (inv) {
        inv.adjustTrust('dunghai', +40, 'Được trả lại công bằng trước thiên hạ');
        inv.adjustTrust('mocdang', -40, 'Mất quyền kiểm soát độc quyền');
        inv.adjustTrust('giangmanh', +30, 'Sự thật Đoạn Nghĩa Đài được phơi bày');
      }
      if (sm) sm.recordChoice('danghai', 'spare');
    } else if (verdictId === 'seal_mountain') {
      if (inv) {
        inv.adjustTrust('hoanganh', +40, 'Bảo vệ được sự tĩnh lặng của sơn cước');
        inv.adjustTrust('dunghai', -20, 'Sự thật tiếp tục bị chôn vùi');
      }
      if (sm) sm.recordChoice('danghai', 'handover');
    } else if (verdictId === 'reform_council') {
      if (inv) {
        inv.adjustTrust('mocdang', +20, 'Có cơ hội chuộc lỗi cùng gia tộc');
        inv.adjustTrust('dunghai', +35, 'Được đón trở lại vị thế xứng đáng');
        inv.adjustTrust('hoanganh', +30, 'Gia tộc tìm lại được tiếng nói chung');
      }
      if (sm) sm.recordChoice('danghai', 'spare');
    } else if (verdictId === 'secret_true_bloodline') {
      if (inv) {
        inv.adjustTrust('mocdang', +50, 'Được cứu rỗi khỏi gánh nặng tội lỗi');
        inv.adjustTrust('dunghai', +50, 'Minh oan và đoàn tụ gia tộc');
        inv.adjustTrust('hoanganh', +50, 'Di nguyện của người đã khuất trọn vẹn');
        inv.adjustTrust('giangmanh', +40, 'Mối thù Đoạn Nghĩa Đài được hóa giải');
      }
      if (sm) {
        sm.data.storyFlags.secretTrueEnding = true;
        sm.recordChoice('danghai', 'spare');
        sm.persist();
      }
    }

    if (window.audioManager) {
      window.audioManager.playVictory();
    }
    if (window.uiManager) {
      window.uiManager.showToast('ĐÃ ĐƯA RA PHÁN QUYẾT TỐI HẬU CHO HỌ PHÓ!');
    }

    // Đóng modal và chuyển tiếp luồng game
    if (this._verdictTimer) clearTimeout(this._verdictTimer);
    this._verdictTimer = setTimeout(() => {
      this._verdictTimer = null;
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      this.close();
      if (cb) cb(verdictId);
    }, 1200);
  }

  cancel() {
    if (this._verdictTimer) {
      clearTimeout(this._verdictTimer);
      this._verdictTimer = null;
    }
    this.onCompleteCallback = null;
    this.close();
  }

  close() {
    this.isActive = false;
    const m = this.modal || (typeof document !== 'undefined' && document.getElementById ? document.getElementById('confrontation-modal') : null);
    if (m) m.classList.add('hidden');
  }

  drawPortraits() {
    if (!window.skeletalRenderer) return;
    const cM = document.getElementById('conf-face-mocdang');
    const cD = document.getElementById('conf-face-dunghai');
    const cH = document.getElementById('conf-face-hoanganh');
    if (cM) window.skeletalRenderer.drawPortrait(cM, 'npc_mocdang');
    if (cD) window.skeletalRenderer.drawPortrait(cD, 'boss_dunghai');
    if (cH) window.skeletalRenderer.drawPortrait(cH, 'boss_hoanganh');
  }
}

window.ClanConfrontation = ClanConfrontation;
window.clanConfrontation = new ClanConfrontation();
