/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/ranking.js - Hệ thống xếp hạng chi tiết cuối màn, tính điểm minh bạch & lưu kỷ lục
 */

class RankingManager {
  constructor() {
    this.modal = null;
  }

  getMeta(stageId) {
    return (window.STORY_META && window.STORY_META.stages && window.STORY_META.stages[stageId]) || null;
  }

  /**
   * Tính toán điểm số minh bạch theo công thức chuẩn võ thuật
   */
  calculateScore(stageId, raw) {
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
    let rankName = 'TẬP SỰ (D)';
    let medal = '🪵 HUY HIỆU GỖ TẬP SỰ';
    let medalClass = 'medal-iron';
    let rankColor = '#64748b';

    if (totalScore >= 22000) {
      rank = 'S';
      rankName = 'SÁT THẦN (S)';
      medal = '🥇 HUY CHƯƠNG VÀNG - ĐỆ NHẤT DANH GIA';
      medalClass = 'medal-gold';
      rankColor = '#ffd700';
    } else if (totalScore >= 17000) {
      rank = 'A';
      rankName = 'TINH NHUỆ (A)';
      medal = '🥈 HUY CHƯƠNG BẠC - TINH NHUỆ TÔNG SƯ';
      medalClass = 'medal-silver';
      rankColor = '#00d2ff';
    } else if (totalScore >= 12000) {
      rank = 'B';
      rankName = 'CAO THỦ (B)';
      medal = '🥉 HUY CHƯƠNG ĐỒNG - CAO THỦ TRẤN MÔN';
      medalClass = 'medal-bronze';
      rankColor = '#e5a93c';
    } else if (totalScore >= 7000) {
      rank = 'C';
      rankName = 'HỌC ĐỒ (C)';
      medal = '🛡️ HUY HIỆU THIẾT QUYỀN';
      medalClass = 'medal-iron';
      rankColor = '#94a3b8';
    }

    // Thời gian định dạng MM:SS
    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Phần thưởng thực tế
    const meta = this.getMeta(stageId);
    const rewards = [];
    if (meta) {
      if (meta.unlockChar) {
        const charName = (window.CHARACTERS && window.CHARACTERS[meta.unlockChar]) ? window.CHARACTERS[meta.unlockChar].name : meta.unlockChar;
        rewards.push({ type: 'char', text: `Mở khóa nhân vật: ${charName.toUpperCase()}` });
      }
      if (meta.reward) {
        rewards.push({ type: 'story', text: meta.reward });
      }
      if (meta.clue) {
        rewards.push({ type: 'clue', text: `Tư liệu điều tra: ${meta.clue}` });
      }
    }
    if (rank === 'S') {
      rewards.push({ type: 'ach', text: 'Thành tích: Vinh dự Sát Thần Vovinam (+1000 Uy Danh)' });
    }

    return {
      stageId,
      totalScore,
      rank,
      rankName,
      medal,
      medalClass,
      rankColor,
      timeSec,
      timeStr,
      hpPercent,
      maxCombo,
      totalHits,
      perfectDodges,
      perfectCounters,
      sideDone,
      sideObjectiveDesc: meta ? (meta.side || 'Hoàn thành thử thách đặc biệt') : '',
      rewards,
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

    // Lưu kỷ lục tốt nhất vào SaveManager
    if (window.saveManager) {
      const isNewBest = window.saveManager.recordStageBest(stageId, {
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
    }

    // Hiển thị giao diện kết quả mở rộng
    this.renderVictoryModal(stageTitle, result);
    return result;
  }

  renderVictoryModal(stageTitle, res) {
    const modal = document.getElementById('stage-clear-modal');
    if (!modal) return;

    const titleEl = document.getElementById('victory-stage-name');
    if (titleEl) titleEl.textContent = (stageTitle || 'CHIẾN TRƯỜNG') + ' ĐÃ ĐƯỢC TRIỆT PHÁ';

    // Đổ nội dung vào card kết quả
    const card = modal.querySelector('.modal-card') || modal;
    let rankContainer = card.querySelector('#detailed-ranking-content');
    if (!rankContainer) {
      rankContainer = document.createElement('div');
      rankContainer.id = 'detailed-ranking-content';
      rankContainer.className = 'detailed-ranking-wrap';

      // Chèn trước nút modal-actions
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

    // Tạo HTML xếp hạng chuyên sâu
    rankContainer.innerHTML = `
      <div class="ranking-hero-row">
        <div class="ranking-grade-box ${res.medalClass}">
          <span class="rank-letter">${res.rank}</span>
          <span class="rank-title">${res.rankName}</span>
        </div>
        <div class="ranking-score-box">
          <span class="score-label">TỔNG ĐIỂM CHIẾN TÍCH</span>
          <span class="score-number">${res.totalScore.toLocaleString()}</span>
          <span class="medal-tag">${res.medal}</span>
        </div>
      </div>

      <div class="ranking-grid-stats">
        <div class="rstat-card">
          <span class="rstat-label">⏱️ THỜI GIAN HOÀN THÀNH</span>
          <span class="rstat-val">${res.timeStr}</span>
          <span class="rstat-sub">+${res.breakdown.timeScore.toLocaleString()} pts</span>
        </div>
        <div class="rstat-card">
          <span class="rstat-label">❤️ MÁU CÒN LẠI</span>
          <span class="rstat-val">${res.hpPercent}%</span>
          <span class="rstat-sub">+${res.breakdown.hpScore.toLocaleString()} pts</span>
        </div>
        <div class="rstat-card">
          <span class="rstat-label">⚡ COMBO CAO NHẤT</span>
          <span class="rstat-val">${res.maxCombo} HIT</span>
          <span class="rstat-sub">+${res.breakdown.comboScore.toLocaleString()} pts</span>
        </div>
        <div class="rstat-card">
          <span class="rstat-label">🎯 TỔNG ĐÒN TRÚNG</span>
          <span class="rstat-val">${res.totalHits}</span>
          <span class="rstat-sub">+${res.breakdown.hitsScore.toLocaleString()} pts</span>
        </div>
        <div class="rstat-card">
          <span class="rstat-label">🌀 NÉ HOÀN HẢO (PERFECT DODGE)</span>
          <span class="rstat-val">${res.perfectDodges} LẦN</span>
          <span class="rstat-sub">+${res.breakdown.dodgeScore.toLocaleString()} pts</span>
        </div>
        <div class="rstat-card">
          <span class="rstat-label">🛡️ PHẢN ĐÒN (PERFECT COUNTER)</span>
          <span class="rstat-val">${res.perfectCounters} LẦN</span>
          <span class="rstat-sub">+${res.breakdown.counterScore.toLocaleString()} pts</span>
        </div>
      </div>

      <div class="ranking-side-row ${res.sideDone ? 'done' : 'fail'}">
        <div class="side-info">
          <span class="side-badge">${res.sideDone ? '✓ ĐÃ HOÀN THÀNH' : '✕ CHƯA ĐẠT'}</span>
          <span class="side-desc">MỤC TIÊU PHỤ: ${res.sideObjectiveDesc}</span>
        </div>
        <span class="side-score">+${res.breakdown.sideScore.toLocaleString()} pts</span>
      </div>

      ${res.rewards && res.rewards.length ? `
        <div class="ranking-rewards-row">
          <span class="rewards-head">🎁 PHẦN THƯỞNG CHIẾN DỊCH:</span>
          <div class="rewards-list">
            ${res.rewards.map(r => `<span class="reward-pill ${r.type}">${r.text}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="ranking-formula-toggle">
        <button id="btn-toggle-formula" type="button" class="btn-formula-info">ℹ️ Xem bảng công thức tính điểm &amp; mốc hạng</button>
        <div id="formula-detail-box" class="formula-detail-box hidden">
          <p><strong>Công thức tính điểm:</strong> Cơ bản 10,000 + Thời gian (tối đa 10k) + Máu x50 + Combo x250 + Đòn trúng x25 + Né x600 + Phản đòn x1,000 + Mục tiêu phụ 4,000.</p>
          <p><strong>Mốc xếp hạng:</strong> [S] >= 24,000 | [A] >= 18,000 | [B] >= 13,000 | [C] >= 8,000 | [D] &lt; 8,000 điểm.</p>
        </div>
      </div>
    `;

    // Nút xem công thức
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
