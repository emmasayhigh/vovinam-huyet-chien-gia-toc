/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/collections.js - Ho so nhan vat, bo suu tap va thanh tich.
 */

class MenuManagerCollections extends window.MenuManagerCharSelect {
  // --------------------------------------------------------------------------
  // HỒ SƠ NHÂN VẬT (dossier)
  // --------------------------------------------------------------------------
  showDossier() {
    if (!this.dossierList) return;
    this.dossierList.innerHTML = '';
    const allChars = Object.values(window.CHARACTERS || {});
    const seen = new Set();
    const chars = [];
    allChars.forEach((c) => {
      if (c && c.id && !seen.has(c.id)) {
        seen.add(c.id);
        chars.push(c);
      }
    });
    chars.forEach((c) => {
      const item = document.createElement('button');
      item.className = 'dossier-item' + (c.id === this.dossierChar ? ' active' : '');
      item.textContent = c.name;
      item.addEventListener('click', () => {
        this.click();
        this.dossierChar = c.id;
        this.showDossier();
      });
      this.dossierList.appendChild(item);
    });
    this.renderDossierDetail();
    this.dossierModal.classList.remove('hidden');
  }

  renderDossierDetail() {
    let c = (window.CHARACTERS || {})[this.dossierChar];
    if (!c && window.CHARACTERS) {
      c = Object.values(window.CHARACTERS).find((char) => char && char.id === this.dossierChar);
    }
    const body = this.dossierBody;
    if (!c || !body) return;
    body.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'dossier-head';
    head.innerHTML = `<canvas id="dossier-portrait" width="150" height="150"></canvas>
      <div class="dossier-head-text">
        <h3 class="dossier-name"></h3>
        <div class="dossier-role"></div>
        <div class="dossier-faction-line"></div>
        <div class="dossier-status"></div>
      </div>`;
    head.querySelector('.dossier-name').textContent = `${c.name} — ${c.title}`;
    head.querySelector('.dossier-role').textContent = c.role || '';
    const fac = (window.FACTIONS || {})[c.faction];
    head.querySelector('.dossier-faction-line').textContent = fac ? `PHE: ${fac.name} — ${fac.arena}` : '';
    head.querySelector('.dossier-status').textContent = c.playable
      ? (this.isUnlocked(c.id) ? 'TRẠNG THÁI: CHƠI ĐƯỢC (đã mở)' : 'TRẠNG THÁI: CHƠI ĐƯỢC — ' + this.lockText(c))
      : 'TRẠNG THÁI: ' + (c.unlock && c.unlock.text ? c.unlock.text : 'KHÔNG CHƠI ĐƯỢC');
    body.appendChild(head);
    if (window.skeletalRenderer) window.skeletalRenderer.drawPortrait(head.querySelector('canvas'), c.styleType || 'player');

    const icons = {
      'TIỂU SỬ': '📜',
      'ĐỘNG CƠ': '🎯',
      'PHONG CÁCH ĐÁNH': '🥋',
      'ĐIỂM MẠNH': '⚡',
      'ĐIỂM YẾU': '⚠️',
      'KỸ NĂNG': '⚔️',
      'TUYỆT KỸ': '🔥',
      'CƠ CHẾ CHƠI ĐƯỢC': '🛡️',
      'QUAN HỆ': '👥',
      'SỰ KIỆN CỐT TRUYỆN': '📖',
      'ĐIỀU KIỆN MỞ KHÓA': '🔓'
    };
    const section = (title, content) => {
      const el = document.createElement('div');
      el.className = 'dossier-section';
      const h = document.createElement('h4');
      const icon = icons[title] || '✦';
      h.innerHTML = `<span>${icon}</span> <span>${title}</span>`;
      el.appendChild(h);
      if (Array.isArray(content)) {
        const ul = document.createElement('ul');
        content.forEach((item) => {
          const li = document.createElement('li');
          if (typeof item === 'string') li.textContent = item;
          else { li.innerHTML = `<strong></strong> <span></span>`; li.querySelector('strong').textContent = item.name + ':'; li.querySelector('span').textContent = item.desc; }
          ul.appendChild(li);
        });
        el.appendChild(ul);
      } else {
        const p = document.createElement('p'); p.textContent = content; el.appendChild(p);
      }
      body.appendChild(el);
    };

    section('TIỂU SỬ', c.bio || '—');
    section('ĐỘNG CƠ', c.motive || '—');
    section('PHONG CÁCH ĐÁNH', c.fightingStyle || '—');
    section('ĐIỂM MẠNH', c.strengths || '—');
    section('ĐIỂM YẾU', c.weaknesses || '—');
    if (c.skills && c.skills.length) section('KỸ NĂNG', c.skills);
    if (c.ultimate) section('TUYỆT KỸ', `${c.ultimate.name} — ${c.ultimate.desc}`);
    if (c.combat && c.combat.mechanic) section('CƠ CHẾ CHƠI ĐƯỢC', c.combat.mechanic);
    if (c.relations && c.relations.length) section('QUAN HỆ', c.relations.map((r) => ({ name: r.who, desc: r.rel })));
    if (c.events && c.events.length) section('SỰ KIỆN CỐT TRUYỆN', c.events);
    section('ĐIỀU KIỆN MỞ KHÓA', this.lockText(c));
  }

  // --------------------------------------------------------------------------
  // BỘ SƯU TẬP (boss đã hạ, kết thúc, nhiệm vụ)
  // --------------------------------------------------------------------------
  showCollection() {
    const body = this.collectionBody;
    if (!body) return;
    const sm = window.saveManager;
    body.innerHTML = '';

    const block = (title, items) => {
      const wrap = document.createElement('div');
      wrap.className = 'collection-block';
      const h = document.createElement('h4'); h.textContent = title;
      wrap.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'collection-grid';
      items.forEach((it) => {
        const cell = document.createElement('div');
        cell.className = 'collection-cell' + (it.on ? ' on' : ' off');
        cell.innerHTML = '<span class="cell-mark"></span><span class="cell-text"></span>';
        cell.querySelector('.cell-mark').textContent = it.on ? '★' : '☆';
        cell.querySelector('.cell-text').textContent = it.text;
        if (it.tip) cell.title = it.tip;
        grid.appendChild(cell);
      });
      wrap.appendChild(grid);
      body.appendChild(wrap);
    };

    // Boss
    const bossIds = ['haclang', 'thietquyen', 'huyetanh', 'longvuong', 'bichlam', 'dunghai', 'hoanganh', 'dinhan', 'vinhtam', 'giangmanh'];
    block('BOSS ĐÃ HẠ', bossIds.map((id) => {
      const c = (window.CHARACTERS || {})[id];
      return { text: c ? c.name : id, on: sm ? sm.data.bossesDefeated.includes(id) : false, tip: c ? c.title : '' };
    }));

    // Kết thúc
    block('BỐN KẾT THÚC', (window.STORY_META ? window.STORY_META.endings : []).map((e) => ({
      text: e.name, on: sm ? sm.data.endings.includes(e.id) : false, tip: e.conditionText
    })));

    // Nhiệm vụ phụ
    const missions = (window.STORY_META ? window.STORY_META.stages : {});
    block('NHIỆM VỤ PHỤ', Object.values(missions).filter((s) => s.type === 'side').map((s) => ({
      text: s.title, on: sm ? sm.data.missionsDone.includes('side_' + s.id) || sm.data.missionsDone.includes('escape_' + s.id) : false,
      tip: s.mission
    })));

    // Lựa chọn đã đưa ra
    block('LỰA CHỌN CỐT TRUYỆN', ['rescue', 'mountain', 'danghai'].map((k) => {
      const c = (window.STORY_META && window.STORY_META.choices[k]) || null;
      const v = sm ? sm.getChoice(k) : null;
      const opt = c && v && c.options.find((o) => o.id === v);
      return { text: c ? c.label : k, on: !!opt, tip: opt ? opt.text : 'Chưa đưa ra lựa chọn này' };
    }));

    this.collectionModal.classList.remove('hidden');
  }

  // --------------------------------------------------------------------------
  // THÀNH TÍCH (ACHIEVEMENTS)
  // --------------------------------------------------------------------------
  showAchievements() {
    if (!this.achList) return;
    const sm = window.saveManager;
    this.achList.innerHTML = '';
    const all = window.STORY_META ? window.STORY_META.achievements : [];
    let unlocked = 0;

    all.forEach(a => {
      if (sm && sm.hasAchievement(a.id)) unlocked++;
    });

    const header = document.createElement('div');
    header.style.cssText = 'padding: 10px 14px; margin-bottom: 10px; background: rgba(229,169,60,0.12); border: 1px solid rgba(229,169,60,0.35); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
    header.innerHTML = `
      <span style="font-weight: 800; color: #ffd700; font-size: 13px;">🏆 TIẾN ĐỘ THÀNH TỰU: ${unlocked} / ${all.length} CÚP</span>
      <span style="color: #38bdf8; font-weight: 900; font-size: 13px;">${Math.round((unlocked / (all.length || 1)) * 100)}%</span>
    `;
    this.achList.appendChild(header);

    all.forEach((a) => {
      const on = sm ? sm.hasAchievement(a.id) : false;
      const row = document.createElement('div');
      row.className = 'ach-row' + (on ? ' unlocked' : ' locked');
      row.innerHTML = `<span class="ach-mark"></span><span class="ach-text"><strong></strong><em></em></span>`;
      row.querySelector('.ach-mark').textContent = on ? '🏆' : '🔒';
      row.querySelector('strong').textContent = a.name;
      row.querySelector('em').textContent = a.desc;
      this.achList.appendChild(row);
    });
    this.achModal.classList.remove('hidden');
  }
}

window.MenuManagerCollections = MenuManagerCollections;
