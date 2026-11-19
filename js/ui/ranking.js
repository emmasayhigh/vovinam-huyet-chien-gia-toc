/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/ui/ranking.js - Hệ thống xếp hạng chi tiết cuối màn, tính điểm minh bạch & lưu kỷ lục
 */

class RankingManager {
  constructor() {
    this.modal = null;
  }

  getMeta(stageId) {
    return (window.STORY_META && window.STORY_META.stages && window.STORY_META.stages[stageId]) || null;
  }

  escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  cleanRewardText(rawReward, unlockedCharName) {
    if (!rawReward) return '';
    let cleaned = String(rawReward).trim();
    if (unlockedCharName) {
      const escaped = unlockedCharName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        new RegExp(`\\+?\\s*mở\\s*(khóa\\s*)?nhân\\s*vật\\s*:?\\s*${escaped}\\s*\\+?`, 'ig'),
        new RegExp(`\\+\\s*nhân\\s*vật\\s*:?\\s*${escaped}`, 'ig'),
        new RegExp(`nhân\\s*vật\\s*:?\\s*${escaped}\\s*\\+`, 'ig')
      ];
      for (const rx of patterns) {
        cleaned = cleaned.replace(rx, ' ');
      }
      cleaned = cleaned.replace(/^\s*\+\s*|\s*\+\s*$/g, '').replace(/\s{2,}/g, ' ').trim();
      if (/^intel\b/i.test(cleaned)) {
        cleaned = 'Mở khóa ' + cleaned;
      }
    }
    return cleaned;
  }

  /**
   * Tính toán điểm số minh bạch theo công thức chuẩn võ thuật
   */
  calculateScore(stageId, raw = {}) {
    const timeSec = Math.max(1, raw.timeSec || 1);
    const hpPercent = raw.hpPercent !== undefined
      ? Math.max(0, Math.min(100, Math.round(raw.hpPercent)))
      : (raw.playerMaxHp ? Math.max(0, Math.min(100, Math.round(((raw.playerHp || 0) / raw.playerMaxHp) * 100))) : 100);

    const maxCombo = Math.max(0, raw.maxCombo || 0);
    const totalHits = Math.max(0, raw.totalHits || 0);
    const perfectDodges = Math.max(0, raw.perfectDodges || 0);
    const perfectCounters = Math.max(0, raw.perfectCounters || 0);
    const sideDone = !!raw.sideDone;

    // Chi tiết từng hạng mục điểm
    const baseScore = 5000;
    const timeScore = Math.max(0, 8000 - Math.floor(timeSec * 30));
    const hpScore = Math.round(hpPercent * 50); // Tối đa 5,000
    const comboScore = maxCombo * 200;
    const hitsScore = totalHits * 20;
    const dodgeScore = perfectDodges * 500;
    const counterScore = perfectCounters * 600;
    const sideScore = sideDone ? 3000 : 0;

    const totalScore = baseScore + timeScore + hpScore + comboScore + hitsScore + dodgeScore + counterScore + sideScore;

    // Phân hạng S, A, B, C, D
    let rank = 'D';
    let rankName = 'TẬP SỰ';
    let medal = '🪵 HUY HIỆU GỖ • TẬP SỰ NHẬP MÔN';
    let medalClass = 'medal-iron';
    let rankTheme = 'rank-theme-d';
    let rankColor = '#64748b';
    let nextRankLabel = 'C';
    let nextRankTarget = 7000;
    let tierFloor = 0;

    if (totalScore >= 22000) {
      rank = 'S';
      rankName = 'SÁT THẦN';
      medal = '🥇 HUY CHƯƠNG VÀNG • ĐỆ NHẤT DANH GIA';
      medalClass = 'medal-gold';
      rankTheme = 'rank-theme-s';
      rankColor = '#fbbf24';
      nextRankLabel = null;
      nextRankTarget = 22000;
      tierFloor = 22000;
    } else if (totalScore >= 17000) {
      rank = 'A';
      rankName = 'TINH NHUỆ';
      medal = '🥈 HUY CHƯƠNG BẠC • TINH NHUỆ TÔNG SƯ';
      medalClass = 'medal-silver';
      rankTheme = 'rank-theme-a';
      rankColor = '#38bdf8';
      nextRankLabel = 'S';
      nextRankTarget = 22000;
      tierFloor = 17000;
    } else if (totalScore >= 12000) {
      rank = 'B';
      rankName = 'CAO THỦ';
      medal = '🥉 HUY CHƯƠNG ĐỒNG • CAO THỦ TRẤN MÔN';
      medalClass = 'medal-bronze';
      rankTheme = 'rank-theme-b';
      rankColor = '#f59e0b';
      nextRankLabel = 'A';
      nextRankTarget = 17000;
      tierFloor = 12000;
    } else if (totalScore >= 7000) {
      rank = 'C';
      rankName = 'HỌC ĐỒ';
      medal = '🛡️ HUY HIỆU THÉP • MÔN ĐỒ THIẾT QUYỀN';
      medalClass = 'medal-iron';
      rankTheme = 'rank-theme-c';
      rankColor = '#94a3b8';
      nextRankLabel = 'B';
      nextRankTarget = 12000;
      tierFloor = 7000;
    }

    const tierProgressPct = nextRankLabel
      ? Math.max(6, Math.min(98, Math.round(((totalScore - tierFloor) / Math.max(1, nextRankTarget - tierFloor)) * 100)))
      : 100;
    const pointsToNext = nextRankLabel ? Math.max(0, nextRankTarget - totalScore) : 0;

    // Thời gian định dạng MM:SS
    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Phần thưởng thực tế (loại bỏ trùng lặp tên nhân vật mở khóa)
    const meta = this.getMeta(stageId);
    const rewards = [];
    let unlockedCharName = '';
    if (meta) {
      if (meta.unlockChar) {
        unlockedCharName = (window.CHARACTERS && window.CHARACTERS[meta.unlockChar])
          ? window.CHARACTERS[meta.unlockChar].name
          : meta.unlockChar;
        rewards.push({
          type: 'char',
          icon: '🔓',
          label: 'MỞ KHÓA VÕ SĨ',
          text: unlockedCharName.toUpperCase()
        });
      }
      const cleanedReward = this.cleanRewardText(meta.reward, unlockedCharName);
      if (cleanedReward) {
        rewards.push({
          type: 'story',
          icon: '📜',
          label: 'TIẾN ĐỘ',
          text: cleanedReward
        });
      }
      if (meta.clue) {
        rewards.push({
          type: 'clue',
          icon: '🔎',
          label: 'MANH MỐI',
          text: meta.clue
        });
      }
    }
    if (rank === 'S') {
      rewards.push({
        type: 'ach',
        icon: '🏆',
        label: 'DANH HIỆU HẠNG S',
        text: 'Vinh dự Sát Thần Vovinam (+1,000 Uy Danh)'
      });
    }

    const rankGoldBonus = { S: 250, A: 150, B: 80, C: 40, D: 20 }[rank] || 40;
    const rankDiamondBonus = { S: 15, A: 10, B: 5, C: 2, D: 1 }[rank] || 2;
    const goldReward = 350 + (Math.max(1, Number(stageId) || 1) * 35) + rankGoldBonus + (sideDone ? 120 : 0);
    const diamondReward = 12 + rankDiamondBonus + (sideDone ? 8 : 0);

    rewards.push({
      type: 'currency',
      icon: '🪙',
      label: 'NGÂN KHỐ GIA TỘC',
      text: `+${goldReward.toLocaleString()} Vàng 🪙 • +${diamondReward} Kim Cương 💎`
    });

    const rawSideDesc = meta ? (meta.side || 'Hoàn thành thử thách đặc biệt') : 'Hoàn thành thử thách đặc biệt';
    const sideObjectiveDesc = String(rawSideDesc).replace(/\s*\(([SABCD])\)\s*$/i, '').trim();

    return {
      stageId,
      totalScore,
      rank,
      rankName,
      medal,
      medalClass,
      rankTheme,
      rankColor,
      nextRankLabel,
      nextRankTarget,
      pointsToNext,
      tierProgressPct,
      timeSec,
      timeStr,
      hpPercent,
      maxCombo,
      totalHits,
      perfectDodges,
      perfectCounters,
      sideDone,
      sideObjectiveDesc,
      rewards,
      goldReward,
      diamondReward,
      isNewBest: false,
      breakdown: {
        baseScore,
        timeScore,
        hpScore,
        comboScore,
        hitsScore,
        dodgeScore,
        counterScore,
        sideScore
      }
    };
  }

  /**
   * Lưu và hiển thị màn hình kết quả chi tiết
   */
  processAndDisplayVictory(stageId, stageTitle, rawStats) {
    const result = this.calculateScore(stageId, rawStats);
    const isCoopOnline = !!(window.onlineManager && window.onlineManager.isActive && window.onlineManager.mode === 'coop');

    // Trong Co-op Online KHÔNG ghi đè kỷ lục/nhiệm vụ Chiến dịch và KHÔNG thưởng trùng Vàng/Kim Cương (đã thưởng ở GameFlow)
    if (window.saveManager && !isCoopOnline) {
      result.isNewBest = !!window.saveManager.recordStageBest(stageId, {
        rank: result.rank,
        score: result.totalScore,
        timeStr: result.timeStr,
        timeSec: result.timeSec,
        maxCombo: result.maxCombo,
        hits: result.totalHits,
        hpPercent: result.hpPercent,
        dodges: result.perfectDodges,
        counters: result.perfectCounters,
        sideDone: result.sideDone
      });

      if (result.rank === 'S') {
        window.saveManager.unlockAchievement('rank_s');
      }
      if (result.perfectCounters >= 2) {
        window.saveManager.unlockAchievement('counter_master');
      }
      if (result.sideDone) {
        window.saveManager.completeMission('side_' + stageId);
      }
      if (typeof window.saveManager.addGold === 'function' && result.goldReward) {
        window.saveManager.addGold(result.goldReward);
      }
      if (typeof window.saveManager.addDiamonds === 'function' && result.diamondReward) {
        window.saveManager.addDiamonds(result.diamondReward);
      }
    }

    // Hiển thị giao diện kết quả mở rộng
    this.renderVictoryModal(stageTitle, result);
    return result;
  }

  renderVictoryModal(stageTitle, res) {
    const modal = document.getElementById('stage-clear-modal');
    if (!modal) return;

    const titleEl = document.getElementById('victory-stage-name');
    if (titleEl) {
      titleEl.textContent = (stageTitle || 'CHIẾN TRƯỜNG') + ' ĐÃ ĐƯỢC TRIỆT PHÁ';
    }

    const card = modal.querySelector('.modal-card') || modal;
    card.classList.remove('rank-theme-s', 'rank-theme-a', 'rank-theme-b', 'rank-theme-c', 'rank-theme-d');
    if (res.rankTheme) card.classList.add(res.rankTheme);

    let rankContainer = card.querySelector('#detailed-ranking-content');
    if (!rankContainer) {
      rankContainer = document.createElement('div');
      rankContainer.id = 'detailed-ranking-content';
      rankContainer.className = 'detailed-ranking-wrap';

      const actions = card.querySelector('.modal-actions');
      if (actions) {
        card.insertBefore(rankContainer, actions);
      } else {
        card.appendChild(rankContainer);
      }
    }

    // Ẩn bảng stats cũ đơn giản nếu có
    const oldStats = card.querySelector('.victory-stats');
    if (oldStats) oldStats.classList.add('hidden');
    const oldReward = card.querySelector('#victory-reward');
    if (oldReward) oldReward.classList.add('hidden');
    const oldClue = card.querySelector('#victory-clue');
    if (oldClue) oldClue.classList.add('hidden');

    const tiers = ['D', 'C', 'B', 'A', 'S'];
    const curTierIdx = Math.max(0, tiers.indexOf(res.rank));
    const tierPipsHtml = tiers.map((t, idx) => {
      const cls = idx < curTierIdx ? 'passed' : (idx === curTierIdx ? 'current' : 'upcoming');
      return `<span class="rank-tier-pip ${cls}">${t}</span>`;
    }).join('');

    const progressCaption = res.nextRankLabel
      ? `Còn <strong>${res.pointsToNext.toLocaleString()}</strong> điểm đạt hạng <strong>${res.nextRankLabel}</strong>`
      : `✨ Đạt cảnh giới tối thượng Sát Thần`;

    const statCards = [
      { icon: '⏱', tone: 'cyan', label: 'THỜI GIAN', val: res.timeStr, pts: res.breakdown.timeScore },
      { icon: '♥', tone: 'rose', label: 'MÁU CÒN LẠI', val: `${res.hpPercent}%`, pts: res.breakdown.hpScore },
      { icon: '⚡', tone: 'amber', label: 'COMBO ĐỈNH', val: `${res.maxCombo} HIT`, pts: res.breakdown.comboScore },
      { icon: '🎯', tone: 'sky', label: 'ĐÒN TRÚNG', val: `${res.totalHits} ĐÒN`, pts: res.breakdown.hitsScore },
      { icon: '🌀', tone: 'indigo', label: 'NÉ HOÀN HẢO', val: `${res.perfectDodges} LẦN`, pts: res.breakdown.dodgeScore },
      { icon: '🛡', tone: 'emerald', label: 'PHẢN ĐÒN', val: `${res.perfectCounters} LẦN`, pts: res.breakdown.counterScore }
    ];

    rankContainer.innerHTML = `
      <div class="ranking-hero-row ${res.medalClass}">
        <div class="ranking-grade-box ${res.medalClass}">
          <span class="rank-crest-ring"></span>
          <span class="rank-letter">${this.escapeHtml(res.rank)}</span>
          <span class="rank-title">${this.escapeHtml(res.rankName)}</span>
        </div>

        <div class="ranking-score-box">
          <div class="score-label-row">
            <span class="score-label">TỔNG ĐIỂM CHIẾN TÍCH</span>
            ${res.isNewBest ? '<span class="new-best-pill">★ KỶ LỤC MỚI</span>' : `<span class="base-pts-pill">Điểm nền +${res.breakdown.baseScore.toLocaleString()}</span>`}
          </div>
          <div class="score-number-row">
            <span class="score-number">${res.totalScore.toLocaleString()}</span>
            <span class="score-unit">PTS</span>
          </div>
          <span class="medal-tag">${this.escapeHtml(res.medal)}</span>
        </div>

        <div class="ranking-progress-box">
          <div class="rank-tier-track">${tierPipsHtml}</div>
          <div class="rank-progress-bar">
            <div class="rank-progress-fill" style="width: ${res.tierProgressPct}%"></div>
          </div>
          <div class="rank-progress-note">${progressCaption}</div>
        </div>
      </div>

      <div class="ranking-grid-stats">
        ${statCards.map((s) => `
          <div class="rstat-card tone-${s.tone}">
            <div class="rstat-icon">${s.icon}</div>
            <div class="rstat-info">
              <span class="rstat-label">${s.label}</span>
              <span class="rstat-val">${this.escapeHtml(s.val)}</span>
            </div>
            <span class="rstat-sub ${s.pts > 0 ? 'has-pts' : 'zero-pts'}">+${s.pts.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>

      <div class="ranking-side-row ${res.sideDone ? 'done' : 'fail'}">
        <div class="side-info">
          <span class="side-badge">${res.sideDone ? '✓ ĐÃ ĐẠT' : '○ MỤC TIÊU PHỤ'}</span>
          <span class="side-desc">${this.escapeHtml(res.sideObjectiveDesc)}</span>
        </div>
        <span class="side-score">+${res.breakdown.sideScore.toLocaleString()} PTS</span>
      </div>

      ${res.rewards && res.rewards.length ? `
        <div class="ranking-rewards-row">
          <div class="rewards-head">
            <span class="rewards-head-icon">🎁</span>
            <span>CHIẾN LỢI PHẨM &amp; TIẾN ĐỘ CHIẾN DỊCH</span>
          </div>
          <div class="rewards-list">
            ${res.rewards.map((r) => `
              <div class="reward-pill ${this.escapeHtml(r.type)}">
                <span class="reward-pill-icon">${r.icon || '✦'}</span>
                <div class="reward-pill-content">
                  ${r.label ? `<span class="reward-pill-label">${this.escapeHtml(r.label)}</span>` : ''}
                  <span class="reward-pill-text">${this.escapeHtml(r.text)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="ranking-formula-toggle">
        <button id="btn-toggle-formula" type="button" class="btn-formula-info">ⓘ Xem công thức tính điểm &amp; mốc xếp hạng</button>
        <div id="formula-detail-box" class="formula-detail-box hidden">
          <p><strong>Công thức tính điểm:</strong> Điểm nền 5,000 + Thời gian (tối đa 8,000, −30đ/giây) + Máu còn lại (×50, tối đa 5,000) + Combo đỉnh (×200) + Đòn trúng (×20) + Né hoàn hảo (×500) + Phản đòn (×600) + Mục tiêu phụ (+3,000).</p>
          <p><strong>Mốc xếp hạng:</strong> [S] ≥ 22,000 &nbsp;•&nbsp; [A] ≥ 17,000 &nbsp;•&nbsp; [B] ≥ 12,000 &nbsp;•&nbsp; [C] ≥ 7,000 &nbsp;•&nbsp; [D] &lt; 7,000 điểm.</p>
        </div>
      </div>
    `;

    const toggleBtn = rankContainer.querySelector('#btn-toggle-formula');
    const formulaBox = rankContainer.querySelector('#formula-detail-box');
    if (toggleBtn && formulaBox) {
      toggleBtn.addEventListener('click', () => {
        formulaBox.classList.toggle('hidden');
      });
    }

    modal.classList.remove('hidden');
  }
}

const rankingManager = new RankingManager();
window.RankingManager = RankingManager;
window.rankingManager = rankingManager;
