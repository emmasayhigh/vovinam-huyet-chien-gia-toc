/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/chronicles.js - Bien nien su, tai lieu dieu tra va quyen nham giu bang chung.
 */

class MenuManagerChronicles extends window.MenuManagerSettings {
  // ==========================================================================
  // BIÊN NIÊN SỬ HỌ PHÓ — HỒ SƠ ĐIỀU TRA ĐA LỚP
  // ==========================================================================
  showChronicles(targetTab = 'docs', opts = {}) {
    if (!this.chroniclesModal) return;
    if (opts && typeof opts.fromCampaignHub === 'boolean') {
      this._chroniclesFromCampaignHub = opts.fromCampaignHub;
    } else {
      this._chroniclesFromCampaignHub = !!this._returnToCampaignHub;
    }
    if (window.game && window.game.state === 'PLAYING') {
      this._chroniclesWasPlaying = true;
      window.game.state = 'PAUSED';
    }
    this.refreshChroniclesStats();
    this.switchChroniclesTab(targetTab);
    this.chroniclesModal.classList.remove('hidden');
    if (window.input && typeof window.input.clearAll === 'function') {
      window.input.clearAll();
    }
  }

  closeChronicles() {
    if (!this.chroniclesModal) return;
    this.chroniclesModal.classList.add('hidden');
    if (this._chroniclesWasPlaying && window.game && window.game.state === 'PAUSED') {
      window.game.state = 'PLAYING';
      this._chroniclesWasPlaying = false;
    } else if (this._chroniclesFromCampaignHub || this._returnToCampaignHub) {
      this._chroniclesFromCampaignHub = false;
      this._returnToCampaignHub = false;
      if (typeof this.showCampaignHub === 'function') {
        this.showCampaignHub();
      }
    }
    if (window.input && typeof window.input.clearAll === 'function') {
      window.input.clearAll();
    }
  }

  switchChroniclesTab(tabName) {
    this.activeChronTab = tabName;
    const tabBtns = document.querySelectorAll('.chron-tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    const panels = document.querySelectorAll('.chron-tab-panel');
    panels.forEach(p => p.classList.add('hidden'));

    const activePanel = document.getElementById('chron-tab-' + tabName);
    if (activePanel) activePanel.classList.remove('hidden');

    if (tabName === 'docs') {
      this.renderChroniclesDocs();
    } else if (tabName === 'graph') {
      this.renderChroniclesGraph();
    } else if (tabName === 'questions') {
      this.renderChroniclesQuestions();
    } else if (tabName === 'flashback') {
      this.renderFlashbackTab();
    } else if (tabName === 'epilogues') {
      this.renderChroniclesEpilogues();
    }
  }

  refreshChroniclesStats() {
    const sm = window.saveManager;
    const inv = window.investigationManager;
    if (!sm || !inv) return;

    inv.ensureState(sm);
    const totalDocs = Object.keys(inv.docs).length;
    const foundCount = sm.data.evidenceFound.length;
    const decodedCount = sm.data.evidenceDecoded.length;
    const trust = sm.data.characterTrust;

    const statsBar = document.getElementById('chronicles-stats-bar');
    if (statsBar) {
      statsBar.innerHTML = `
        <div class="stat-pill">VẬT CHỨNG: <strong>${foundCount}/${totalDocs}</strong></div>
        <div class="stat-pill">GIẢI MÃ: <strong>${decodedCount}/${totalDocs}</strong></div>
        <div class="stat-pill trust-pill">TÍN NHIỆM: 
          <span>Mộc Đăng ${trust.mocdang}%</span> · 
          <span>Dung Hải ${trust.dunghai}%</span> · 
          <span>Hoàng Anh ${trust.hoanganh}%</span>
        </div>
      `;
    }
  }

  renderChroniclesDocs() {
    const listEl = document.getElementById('chronicles-doc-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const inv = window.investigationManager;
    const sm = window.saveManager;
    if (!inv || !sm) return;

    const allDocs = Object.values(inv.docs);
    const filter = this.activeChronFilter;

    const filtered = allDocs.filter(doc => {
      if (filter === 'all') return true;
      return doc.type === filter;
    });

    filtered.forEach(doc => {
      const isFound = inv.isFound(doc.id);
      const isDecoded = inv.isDecoded(doc.id);
      const isDestroyed = inv.isDestroyed(doc.id);
      const custody = inv.getCustody(doc.id);

      const card = document.createElement('div');
      card.className = 'chron-doc-card' +
        (!isFound ? ' locked' : '') +
        (isDecoded ? ' decoded' : '') +
        (isDestroyed ? ' destroyed' : '') +
        (this.selectedDocId === doc.id ? ' active' : '');

      let statusBadge = 'CHƯA TÌM THẤY';
      let statusClass = 'badge-locked';
      if (isDestroyed) {
        statusBadge = 'ĐÃ TIÊU HỦY';
        statusClass = 'badge-destroyed';
      } else if (isDecoded) {
        statusBadge = 'ĐÃ GIẢI MÃ';
        statusClass = 'badge-decoded';
      } else if (isFound) {
        statusBadge = 'ĐÃ THU THẬP';
        statusClass = 'badge-found';
      }

      const custodyNames = {
        nghi: 'Hồ sơ Nghị', mocdang: 'Mộc Đăng giữ', dunghai: 'Dung Hải giữ',
        hoanganh: 'Hoàng Anh giữ', huavudai: 'Hứa Vũ Đại giữ', public: 'Công khai', destroyed: 'Đã hủy'
      };

      card.innerHTML = `
        <div class="doc-card-top">
          <span class="doc-type-tag">${doc.typeName}</span>
          <span class="doc-status-badge ${statusClass}">${statusBadge}</span>
        </div>
        <h4 class="doc-title">${isFound ? doc.title : '??? [TÀI LIỆU CHƯA KHÁM PHÁ]'}</h4>
        <p class="doc-short">${isFound ? doc.shortDesc : `Nằm tại: ${doc.timeFound}`}</p>
        <div class="doc-card-foot">
          <span class="doc-origin">${doc.timeFound.split('—')[0].trim()}</span>
          ${isFound ? `<span class="doc-custody">${custodyNames[custody] || 'Nghị giữ'}</span>` : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        this.click();
        this.selectedDocId = doc.id;
        this.renderChroniclesDocs();
        this.renderChroniclesDetail(doc.id);
      });

      listEl.appendChild(card);
    });

    this.renderChroniclesDetail(this.selectedDocId);
  }

  renderChroniclesDetail(docId) {
    const detailEl = document.getElementById('chronicles-doc-detail');
    if (!detailEl) return;

    const inv = window.investigationManager;
    const sm = window.saveManager;
    const doc = inv ? inv.docs[docId] : null;

    if (!doc) {
      detailEl.innerHTML = '<p class="empty-hint">Chọn một tài liệu để đọc hồ sơ chi tiết.</p>';
      return;
    }

    const isFound = inv.isFound(doc.id);
    const isDecoded = inv.isDecoded(doc.id);
    const isDestroyed = inv.isDestroyed(doc.id);
    const custody = inv.getCustody(doc.id);

    if (!isFound) {
      detailEl.innerHTML = `
        <div class="doc-detail-locked">
          <div class="lock-icon">🔒</div>
          <h3>TÀI LIỆU CHƯA ĐƯỢC TÌM THẤY</h3>
          <p>Tài liệu này nằm tại: <strong>${doc.timeFound}</strong>.</p>
          <p>Hãy khám phá khu vực chiến trường và tìm hòm tài liệu bí mật trước khi đánh boss.</p>
        </div>
      `;
      return;
    }

    const custodyLabels = {
      nghi: 'Đang lưu trữ trong Hồ sơ cá nhân của Ngô Nhất Nghị',
      mocdang: 'Đã bàn giao cho Phó Mộc Đăng (Kiểm soát công nghệ)',
      dunghai: 'Đã trao cho Phó Dung Hải (Minh oan kẻ lưu đày)',
      hoanganh: 'Đã gửi cho Phó Đặng Hoàng Anh (Trấn thủ sơn hà)',
      huavudai: 'Đã giao cho Hứa Vũ Đại (Mạng lưới ngầm)',
      public: 'Đã công bố rộng rãi trước truyền thông và gia tộc',
      destroyed: 'Đã bị tiêu hủy vĩnh viễn'
    };

    let connectionsHtml = '';
    if (doc.connections && doc.connections.length) {
      connectionsHtml = `
        <div class="doc-connections-box">
          <h4>MỐI LIÊN KẾT BẰNG CHỨNG:</h4>
          <ul>
            ${doc.connections.map(c => `<li><strong>${c.target.toUpperCase()}:</strong> ${c.relation}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    detailEl.innerHTML = `
      <div class="doc-detail-view ${doc.type}-style">
        <div class="doc-detail-header">
          <div class="doc-header-left">
            <span class="detail-badge">${doc.typeName.toUpperCase()}</span>
            <h3 class="detail-title">${doc.title}</h3>
            <span class="detail-source">Nguồn: ${doc.timeFound}</span>
          </div>
          <div class="doc-header-right">
            <span class="detail-custody-tag">${custodyLabels[custody] || custody}</span>
          </div>
        </div>

        <div class="doc-parchment-content">
          <pre class="doc-text">${doc.content}</pre>
        </div>

        ${isDecoded ? `
        <div class="doc-decoded-box">
          <div class="decoded-badge">KẾT QUẢ PHÂN TÍCH & GIẢI MÃ</div>
          <pre class="decoded-text">${doc.decodedContent}</pre>
        </div>
        ` : `
        <div class="doc-decode-prompt">
          <p>Tài liệu còn nhiều điểm khả nghi chưa được giải mã chi tiết.</p>
          <button id="btn-decode-doc" class="btn btn-secondary">🔍 TIẾN HÀNH GIẢI MÃ BẰNG THUẬT TOÁN</button>
        </div>
        `}

        <div class="doc-question-box">
          <span class="q-icon">❓</span>
          <div class="q-content">
            <strong>CÂU HỎI CHƯA CÓ LỜI GIẢI:</strong>
            <p>${doc.unresolvedQuestion}</p>
          </div>
        </div>

        ${connectionsHtml}

        <div class="doc-detail-actions">
          <button id="btn-change-custody" class="btn btn-primary">⚖️ QUYẾT ĐỊNH QUYỀN NẮM GIỮ (CUSTODY)</button>
        </div>
      </div>
    `;

    const btnDecode = document.getElementById('btn-decode-doc');
    if (btnDecode) {
      btnDecode.addEventListener('click', () => {
        this.click();
        inv.decodeEvidence(doc.id);
        this.refreshChroniclesStats();
        this.renderChroniclesDocs();
      });
    }

    const btnCustody = document.getElementById('btn-change-custody');
    if (btnCustody) {
      btnCustody.addEventListener('click', () => {
        this.click();
        this.showCustodyModal(doc.id, () => {
          this.refreshChroniclesStats();
          this.renderChroniclesDocs();
        });
      });
    }
  }

  // Sơ đồ liên kết tội phạm / mạng lưới điều tra tương tác
  renderChroniclesGraph() {
    const canvas = document.getElementById('investigation-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Vẽ lưới nền đen xám kiểu bảng điều tra tội phạm
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const inv = window.investigationManager;
    const sm = window.saveManager;

    // Định nghĩa các Node trên bảng điều tra
    const nodes = [
      { id: 'core', label: 'HUYẾT ÁN HỌ PHÓ', type: 'core', x: width / 2, y: height / 2 - 20, r: 42, color: '#ff2a4b' },
      // Nhân vật chính
      { id: 'mocdang', label: 'Phó Mộc Đăng', type: 'char', x: 200, y: 120, r: 32, color: '#00d2ff' },
      { id: 'dunghai', label: 'Phó Dung Hải', type: 'char', x: 200, y: 380, r: 32, color: '#a3e635' },
      { id: 'hoanganh', label: 'Hoàng Anh', type: 'char', x: 820, y: 120, r: 32, color: '#ffd700' },
      { id: 'huavudai', label: 'Hứa Vũ Đại', type: 'char', x: 820, y: 380, r: 32, color: '#c1121f' },
      // Tài liệu
      { id: 'DOC_PHOTO_FAMILY', label: 'Ảnh Cũ Cào Mặt', type: 'doc', x: 380, y: 100, r: 24, color: '#f59e0b' },
      { id: 'DOC_EXPULSION_ORDER', label: 'Lệnh Khai Trừ', type: 'doc', x: 340, y: 260, r: 24, color: '#ef4444' },
      { id: 'DOC_LETTER_TORN', label: 'Thư Mật Rách', type: 'doc', x: 480, y: 410, r: 24, color: '#ec4899' },
      { id: 'DOC_AUDIO_MOCDANG', label: 'Băng Ghi Âm', type: 'doc', x: 640, y: 90, r: 24, color: '#06b6d4' },
      { id: 'DOC_RESOURCE_MAP', label: 'Mạch Đất Hiếm', type: 'doc', x: 670, y: 260, r: 24, color: '#84cc16' },
      { id: 'DOC_CIPHER_CORE', label: 'Hạch Tâm Lượng Tử', type: 'doc', x: 520, y: 460, r: 24, color: '#a855f7' }
    ];

    // Vẽ các đường liên kết (dây nối điều tra)
    const links = [
      { from: 'core', to: 'mocdang', style: 'gold' },
      { from: 'core', to: 'dunghai', style: 'gold' },
      { from: 'core', to: 'hoanganh', style: 'gold' },
      { from: 'mocdang', to: 'DOC_EXPULSION_ORDER', style: 'cyan' },
      { from: 'dunghai', to: 'DOC_EXPULSION_ORDER', style: 'red_dash' },
      { from: 'mocdang', to: 'huavudai', style: 'red_dash' },
      { from: 'huavudai', to: 'DOC_LETTER_TORN', style: 'pink' },
      { from: 'hoanganh', to: 'DOC_RESOURCE_MAP', style: 'gold' },
      { from: 'mocdang', to: 'DOC_AUDIO_MOCDANG', style: 'cyan' },
      { from: 'core', to: 'DOC_PHOTO_FAMILY', style: 'gold' },
      { from: 'core', to: 'DOC_CIPHER_CORE', style: 'purple' }
    ];

    // Vẽ đường nối
    links.forEach(l => {
      const n1 = nodes.find(n => n.id === l.from);
      const n2 = nodes.find(n => n.id === l.to);
      if (!n1 || !n2) return;

      const isDoc = (n1.type === 'doc' || n2.type === 'doc');
      const docNode = n1.type === 'doc' ? n1 : (n2.type === 'doc' ? n2 : null);
      const isFound = docNode ? inv.isFound(docNode.id) : true;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);

      if (l.style === 'red_dash') {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = isFound ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = isFound ? (l.style === 'gold' ? 'rgba(255, 215, 0, 0.65)' : 'rgba(0, 210, 255, 0.55)') : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isFound ? 2.5 : 1;
      }
      ctx.stroke();
      ctx.restore();
    });

    // Vẽ các nút
    nodes.forEach(n => {
      const isDoc = n.type === 'doc';
      const isFound = isDoc ? inv.isFound(n.id) : true;
      const isDecoded = isDoc ? inv.isDecoded(n.id) : false;

      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);

      // Gradient nền nút
      const grad = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, n.r);
      grad.addColorStop(0, isFound ? n.color : '#1f2937');
      grad.addColorStop(1, '#0b0f19');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = isFound ? (isDecoded ? '#4ade80' : n.color) : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isDecoded ? 3 : 2;
      ctx.stroke();

      // Nhãn
      ctx.fillStyle = isFound ? '#f8fafc' : '#64748b';
      ctx.font = n.type === 'core' ? '900 13px Cinzel, serif' : '700 11px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = isFound ? n.label : '???';
      ctx.fillText(text, n.x, n.y);

      if (isDecoded) {
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 10px Montserrat, sans-serif';
        ctx.fillText('✓ GIẢI MÃ', n.x, n.y + n.r + 14);
      }

      ctx.restore();
    });
  }

  // Ba câu hỏi trung tâm được mở khóa theo tiến trình
  renderChroniclesQuestions() {
    const container = document.getElementById('chronicles-questions-content');
    if (!container) return;

    const inv = window.investigationManager;
    const sm = window.saveManager;

    // Tiến trình trả lời từng câu hỏi
    const q1Docs = ['DOC_PHOTO_FAMILY', 'DOC_MINUTES_CLAN'];
    const q1Solved = q1Docs.some(id => inv.isDecoded(id));

    const q2Docs = ['DOC_EXPULSION_ORDER', 'DOC_LETTER_TORN'];
    const q2Solved = q2Docs.some(id => inv.isDecoded(id));

    const q3Docs = ['DOC_AUDIO_MOCDANG', 'DOC_RESOURCE_MAP', 'DOC_CIPHER_CORE'];
    const q3Solved = q3Docs.some(id => inv.isDecoded(id));

    container.innerHTML = `
      <div class="questions-header">
        <h3>BA CÂU HỎI TRUNG TÂM CỦA HUYẾT ÁN</h3>
        <p>Hồ sơ điều tra dần giải mã từng lớp sự thật. Mỗi tài liệu mới có thể làm thay đổi cách hiểu của bạn.</p>
      </div>

      <div class="question-card ${q1Solved ? 'solved' : 'unsolved'}">
        <div class="q-card-head">
          <span class="q-number">CÂU HỎI 1</span>
          <h4>AI THỰC SỰ ĐÃ CHẾT, BIẾN MẤT HOẶC BỊ XÓA TÊN KHỎI GIA PHẢ?</h4>
          <span class="q-status-badge">${q1Solved ? 'ĐÃ CÓ LỜI GIẢI MÃ' : 'CHƯA ĐỦ BẰNG CHỨNG'}</span>
        </div>
        <div class="q-card-body">
          ${q1Solved ? `
            <p class="q-answer"><strong>SỰ THẬT TÌM THẤY:</strong> Người bị xoá mặt trong ảnh cũ và gạch tên khỏi toàn bộ tài liệu chính thức là cố Tộc Trưởng đời thứ ba: <strong>Phó Khắc Nghiệp</strong> — anh cả của Mộc Đăng, người bảo hộ đầu tiên của Thập Vạn Đại Sơn. Sự biến mất của ông không phải tai nạn mà là một vụ mưu sát có tính toán nhằm tranh đoạt vi mạch lượng tử.</p>
          ` : `
            <p class="q-locked-hint">Hãy thu thập và giải mã <em>Bức Ảnh Tổ Đình Bị Rạch Mặt</em> (Màn 1) hoặc <em>Biên Bản Hỏi Cung</em> (Màn 6) để tìm ra danh tính thực sự của người bị xóa tên.</p>
          `}
        </div>
      </div>

      <div class="question-card ${q2Solved ? 'solved' : 'unsolved'}">
        <div class="q-card-head">
          <span class="q-number">CÂU HỎI 2</span>
          <h4>VÌ SAO PHÓ DUNG HẢI BỊ KHAI TRỪ — QUYẾT ĐỊNH ĐÓ CÓ HỢP PHÁP?</h4>
          <span class="q-status-badge">${q2Solved ? 'ĐÃ CÓ LỜI GIẢI MÃ' : 'CHƯA ĐỦ BẰNG CHỨNG'}</span>
        </div>
        <div class="q-card-body">
          ${q2Solved ? `
            <p class="q-answer"><strong>SỰ THẬT TÌM THẤY:</strong> Lệnh khai trừ Phó Dung Hải hoàn toàn là một <strong>bản án ngụy tạo được lập sẵn từ trước</strong>. Dung Hải bị biến thành con dê tế thần để che đậy vụ thỏa thuận ngầm giữa Mộc Đăng và Hứa Vũ Đại. Bảy năm lưu đày ở Hắc Long Giang là cái giá Dung Hải phải trả cho việc từ chối tham gia che giấu hạch tâm.</p>
          ` : `
            <p class="q-locked-hint">Hãy thu thập và phân tích pháp y <em>Văn Bản Khai Trừ Phó Dung Hải</em> (Màn 3) hoặc <em>Bức Thư Mật Tô Châu</em> (Màn 4) để phơi bày ngày tháng bị sửa đổi.</p>
          `}
        </div>
      </div>

      <div class="question-card ${q3Solved ? 'solved' : 'unsolved'}">
        <div class="q-card-head">
          <span class="q-number">CÂU HỎI 3</span>
          <h4>AI TẠO RA HỒ SƠ NÀY VÀ MỤC ĐÍCH THẬT SỰ LÀ GÌ?</h4>
          <span class="q-status-badge">${q3Solved ? 'ĐÃ CÓ LỜI GIẢI MÃ' : 'CHƯA ĐỦ BẰNG CHỨNG'}</span>
        </div>
        <div class="q-card-body">
          ${q3Solved ? `
            <p class="q-answer"><strong>SỰ THẬT TÌM THẤY:</strong> Người tạo ra hệ thống phân loại hồ sơ này chính là <strong>Phó Mộc Đăng</strong>. Động cơ của Mộc Đăng không phải thuần túy là lòng tham cá nhân, mà là một nỗ lực tuyệt vọng nhằm ngăn chặn gia tộc bị hủy diệt bởi các thế lực Triệu — Ngô, đồng thời tự dằn vặt vì số tiền 50 triệu USD ông đã bí mật bán thông tin để cứu nguy tài chính cho họ Phó 7 năm trước.</p>
          ` : `
            <p class="q-locked-hint">Hãy tìm kiếm <em>Băng Ghi Âm Tần Số Riêng</em> (Màn 7), <em>Bản Đồ Thập Vạn Đại Sơn</em> (Màn 8) hoặc <em>Hạch Tâm Lượng Tử</em> (Màn 10) để giải mã toàn bộ bức tranh động cơ của Mộc Đăng.</p>
          `}
        </div>
      </div>
    `;
  }

  renderFlashbackTab() {
    const reqStatus = document.getElementById('fb-req-status');
    const sm = window.saveManager;
    const inv = window.investigationManager;

    const done = sm && sm.isMissionDone('flashback_dunghai');
    if (reqStatus) {
      reqStatus.innerHTML = `
        <div class="req-item ${done ? 'done' : ''}">
          <span>Trạng thái: <strong>${done ? 'ĐÃ HOÀN THÀNH (Có thể chơi lại)' : 'SẴN SÀNG KHÁM PHÁ'}</strong></span>
        </div>
        <div class="req-item">
          <span>Quyết định đã chọn trong quá khứ: <strong>${(sm && sm.data.flashbackChoices && sm.data.flashbackChoices.length) ? sm.data.flashbackChoices.join(', ') : 'Chưa có'}</strong></span>
        </div>
      `;
    }
  }

  renderChroniclesEpilogues() {
    const container = document.getElementById('chronicles-epilogues-content');
    if (!container) return;

    const sm = window.saveManager;
    const unlockedEndings = (sm && sm.data.endings) || [];
    const allEndings = (window.STORY_META && window.STORY_META.endings) || [];

    container.innerHTML = `
      <div class="epilogues-header">
        <h3>HẬU TRUYỆN BỐN GIA TỘC & CÁC KẾT THÚC ĐÃ MỞ (${unlockedEndings.length}/${allEndings.length})</h3>
        <p>Mỗi kết thúc bạn đạt được phản ánh một diện mạo khác nhau của lịch sử họ Phó và Thập Vạn Đại Sơn.</p>
      </div>

      <div class="epilogues-grid">
        ${allEndings.map(e => {
          const isUnlocked = unlockedEndings.includes(e.id);
          return `
            <div class="ending-archive-card ${isUnlocked ? 'unlocked' : 'locked'}">
              <div class="ending-card-top">
                <span class="ending-tag">${isUnlocked ? 'ĐÃ ĐẠT' : 'CHƯA MỞ KHÓA'}</span>
                <h4>${e.name}</h4>
              </div>
              <p class="ending-archive-tagline"><em>${e.tagline}</em></p>
              ${isUnlocked ? `
                <div class="ending-archive-scene"><p>${e.scene}</p></div>
                <div class="ending-archive-quote"><small>${e.quote}</small></div>
                ${e.epilogues ? `
                  <div class="ending-char-fates">
                    <h5>HẬU VẬN NHÂN VẬT:</h5>
                    <div class="fate-row"><strong>Phó Dung Hải:</strong> ${e.epilogues.dunghai}</div>
                    <div class="fate-row"><strong>Phó Đặng Hoàng Anh:</strong> ${e.epilogues.hoanganh}</div>
                    <div class="fate-row"><strong>Phó Mộc Đăng:</strong> ${e.epilogues.mocdang}</div>
                    <div class="fate-row"><strong>Gia Tộc Họ Phó:</strong> ${e.epilogues.pho_clan}</div>
                  </div>
                ` : ''}
              ` : `
                <div class="ending-locked-desc">
                  <p><strong>Điều kiện:</strong> ${e.conditionText}</p>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Hộp thoại quyết định quyền nắm giữ bằng chứng (Evidence Custody)
  showCustodyModal(docId, onDone) {
    const inv = window.investigationManager;
    const doc = inv ? inv.docs[docId] : null;
    if (!doc || !this.custodyModal) {
      if (onDone) onDone();
      return;
    }

    this._custodyWasPlaying = window.game && (window.game.state === 'PLAYING');
    this._custodyOnDone = onDone || null;

    if (this._custodyWasPlaying) {
      window.game.state = 'PAUSED';
    }

    if (window.input && typeof window.input.clearAll === 'function') {
      window.input.clearAll();
    }

    const titleEl = document.getElementById('custody-doc-title');
    const descEl = document.getElementById('custody-doc-desc');
    const optionsEl = document.getElementById('custody-options');

    if (titleEl) titleEl.textContent = doc.title;
    if (descEl) descEl.textContent = `Bạn đang nắm giữ: ${doc.typeName}. Bạn muốn xử lý bằng chứng này như thế nào?`;

    if (optionsEl) {
      optionsEl.innerHTML = `
        <button class="custody-btn" data-act="keep">
          <div class="c-btn-title">1. GIỮ LẠI TRONG HỒ SƠ CÁ NHÂN</div>
          <div class="c-btn-desc">Bảo toàn khả năng sử dụng và đối chất trong tương lai. Không làm lộ thông tin cho bất kỳ ai.</div>
        </button>

        <button class="custody-btn" data-act="handover" data-target="mocdang">
          <div class="c-btn-title">2. GIAO CHO PHÓ MỘC ĐĂNG</div>
          <div class="c-btn-desc">Mộc Đăng sẽ giải mã ngay bằng máy chủ AI và cung cấp intel, nhưng anh ta sẽ kiểm soát thông tin.</div>
        </button>

        <button class="custody-btn" data-act="handover" data-target="dunghai">
          <div class="c-btn-title">3. GIAO CHO PHÓ DUNG HẢI</div>
          <div class="c-btn-desc">Giúp Dung Hải có bằng chứng minh oan và hỗ trợ chiến đấu, nhưng làm Mộc Đăng cảnh giác.</div>
        </button>

        <button class="custody-btn" data-act="handover" data-target="hoanganh">
          <div class="c-btn-title">4. GIAO CHO PHÓ ĐẶNG HOÀNG ANH</div>
          <div class="c-btn-desc">Tôn trọng di nguyện bảo vệ Thập Vạn Đại Sơn. Hoàng Anh sẵn sàng chi viện trong trận boss.</div>
        </button>

        <button class="custody-btn" data-act="public">
          <div class="c-btn-title">5. CÔNG KHAI TRƯỚC CÁC GIA TỘC</div>
          <div class="c-btn-desc">Phơi bày sự thật ra ánh sáng. Minh bạch hóa lịch sử nhưng làm sụp đổ các thế liên minh ngầm.</div>
        </button>

        <button class="custody-btn danger-btn" data-act="destroy">
          <div class="c-btn-title">6. TIÊU HỦY VẬT CHỨNG</div>
          <div class="c-btn-desc">Đốt bỏ tài liệu để che giấu tội lỗi hoặc bảo vệ người thân, nhưng xóa bỏ cơ hội minh oan vĩnh viễn.</div>
        </button>
      `;

      const btns = optionsEl.querySelectorAll('.custody-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.click();
          const act = btn.getAttribute('data-act');
          const target = btn.getAttribute('data-target');
          if (inv) {
            inv.handleEvidenceCustody(docId, act, target);
          }
          this.closeCustodyModal();
        });
      });
    }

    this.custodyModal.classList.remove('hidden');
  }

  // Đóng an toàn modal xử lý bằng chứng và khôi phục game loop
  closeCustodyModal() {
    if (!this.custodyModal) return;
    this.custodyModal.classList.add('hidden');

    if (this._custodyWasPlaying && window.game && window.game.state === 'PAUSED') {
      window.game.state = 'PLAYING';
      this._custodyWasPlaying = false;
    }

    if (window.input && typeof window.input.clearAll === 'function') {
      window.input.clearAll();
    }

    if (this._custodyOnDone) {
      const cb = this._custodyOnDone;
      this._custodyOnDone = null;
      try { cb(); } catch (err) { console.error(err); }
    }
  }
}

window.MenuManagerChronicles = MenuManagerChronicles;
