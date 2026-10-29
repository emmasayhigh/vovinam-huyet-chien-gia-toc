/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/menu.js - Hệ thống menu: Chọn nhân vật / Bản đồ chương / Hồ sơ / Bộ sưu tập /
 *              Thành tích / Cài đặt (đọc & ghi qua SaveManager)
 *
 * Mọi nút ở đây đều có tác dụng thật: chọn -> chơi, khóa -> chưa mở, chỉnh -> lưu.
 */

const CHAR_SLOTS = [
  {
    id: 'nghi',
    slotName: 'NGÔ NHẤT NGHỊ',
    fullName: 'NGÔ NHẤT NGHỊ',
    title: 'SÁT THẦN VIỆT VÕ ĐẠO',
    tagline: 'Khí phách — Chính nghĩa — Bất khuất',
    element: '🥋',
    color: '#00d2ff',
    image: 'assets/images/characters/char_hero_nghi.png',
    bio: 'Ngô Nhất Nghị luôn đặt tinh thần thượng võ lên hàng đầu. Với ý chí kiên cường và trái tim chân thành, cậu luôn chiến đấu để bảo vệ những điều mình tin tưởng và truy tìm sự thật.',
    stats: { power: 85, speed: 95, defense: 60, technique: 90 },
    skills: [
      { icon: '👊', name: 'Liên Hoàn Quyền Cước', desc: 'Chuỗi đấm đá nối mượt, chốt bằng đòn bật lùi.' },
      { icon: '🥋', name: 'Đòn Chân Kẹp', desc: 'Đặc trưng Vovinam: áp sát kẹp cổ quật ngã đối thủ.' },
      { icon: '⚡', name: 'Phản Đòn Hoàn Hảo', desc: 'Né đỡ đúng nhịp kích hoạt time-slow phản kích bạo phát.' },
      { icon: '🐉', name: 'Long Hổ Xuất Sơn', desc: 'Tuyệt kỹ Vovinam: liên hoàn sấm sét chấn động toàn trường.' }
    ],
    mechanic: 'Võ thuật Vovinam - Linh hoạt, mạnh mẽ, đa dạng thế tấn.',
    quote: '“Không chỉ là võ, đó là đạo!”'
  },
  {
    id: 'bichlam',
    slotName: 'ĐÌNH BÍCH LÂM',
    fullName: 'ĐÌNH BÍCH LÂM',
    title: 'ĐỒNG MINH NGANG TÀNG',
    tagline: 'Ngang tàng — Quyết liệt — Trọng nghĩa tình',
    element: '🌪️',
    color: '#22c55e',
    image: 'assets/images/characters/char_bichlam.png',
    vovinamImage: 'assets/images/characters/char_bichlam_vovinam.png',
    bio: 'Bích Lâm là mãnh tướng ngang tàng của võ giới ngầm, tính tình bộc trực, phóng khoáng và trọng nghĩa khí. Anh khinh ghét thói giả nhân giả nghĩa, sẵn sàng tung quyền bảo vệ anh em bằng hữu.',
    stats: { power: 75, speed: 92, defense: 65, technique: 85 },
    skills: [
      { icon: '🌪️', name: 'Thần Phong Trảo', desc: 'Chuỗi cào xé cực nhanh áp sát cự ly gần.' },
      { icon: '💨', name: 'Phi Thân Lạc Bộ', desc: 'Thân pháp lướt xuyên đối thủ ra phía sau.' },
      { icon: '🛡️', name: 'Đẩy Lùi Phản Kích', desc: 'Đón đỡ đòn địch và phản đòn đẩy văng đối phương.' },
      { icon: '⚡', name: 'Xuyên Tần Liên Kết', desc: 'Tuyệt kỹ: lao xuyên màn hình nhiều hit dồn dập.' }
    ],
    mechanic: 'Áp sát chớp nhoáng — Liên hoàn vũ bão — Phản công linh hoạt.',
    quote: '“Ở đâu có bất công, ở đó có nắm đấm của Bích Lâm!”'
  },
  {
    id: 'huavudai',
    slotName: 'HỨA VŨ ĐẠI',
    fullName: 'HỨA VŨ ĐẠI',
    title: 'ÔNG TRÙM MẠNG LƯỚI NGẦM',
    tagline: 'Thâm trầm — Quyền uy — Nhìn thấu ván cờ',
    element: '◈',
    color: '#ef4444',
    image: 'assets/images/characters/char_huavudai.png',
    vovinamImage: 'assets/images/characters/char_huavudai_vovinam.png',
    bio: 'Hứa Vũ Đại xây dựng đế chế ngầm bằng thông tin và tính toán lạnh lùng. Dưới vẻ ngoài quyền lực là trái tim luôn bảo bọc những kẻ trung thành.',
    stats: { power: 70, speed: 60, defense: 80, technique: 95 },
    skills: [
      { icon: '💥', name: 'Xô Bật Uy Lực', desc: 'Đòn tay đẩy dũng mãnh tạo khoảng cách an toàn.' },
      { icon: '🎯', name: 'Mệnh Lệnh Ngầm', desc: 'Triệu hồi hỏa lực yểm trợ từ mạng lưới ngầm.' },
      { icon: '🛡️', name: 'Thiết Trượng Hộ Thân', desc: 'Dùng gậy quyền trượng đỡ đòn và hóa giải chấn động.' },
      { icon: '🔥', name: 'Lãnh Địa Hắc Ám', desc: 'Tuyệt kỹ: áp đảo toàn bộ chiến trường bằng chi viện.' }
    ],
    mechanic: 'Thực dụng — Đẩy lùi diện rộng — Gọi chi viện tầm xa.',
    quote: '“Muốn biết chân tướng, trước hết phải sống sót qua đêm nay.”'
  },
  {
    id: 'dinhan',
    slotName: 'TRIỆU ĐÌNH AN',
    fullName: 'TRIỆU ĐÌNH AN',
    title: 'CẬN VỆ TRUNG THÀNH',
    tagline: 'Trung dũng — Bất hoại — Vạn phu mạc địch',
    element: '🛡️',
    color: '#d4a017',
    image: 'assets/images/characters/char_dinhan.png',
    vovinamImage: 'assets/images/characters/char_dinhan_vovinam.png',
    bio: 'Cận vệ số một của Triệu gia, khoác lên mình chiến giáp phụng hoàng. Một lời hứa trung thành nặng tựa thái sơn, sẵn sàng lấy thân mình làm khiên chắn.',
    stats: { power: 90, speed: 50, defense: 100, technique: 75 },
    skills: [
      { icon: '🛡️', name: 'Thủ Thế Kim Cang', desc: 'Giảm 45% mọi sát thương nhận vào khi thủ thế.' },
      { icon: '🔨', name: 'Trọng Chùy Phá Trận', desc: 'Vung đại chùy càn quét khiến kẻ địch bật ngã.' },
      { icon: '⚡', name: 'Khiên Kích Phản Chấn', desc: 'Dùng chiến khiên húc văng đối thủ khi chúng tấn công.' },
      { icon: '🔥', name: 'Xung Kích Khối Vũ', desc: 'Tuyệt kỹ: bọc lôi hỏa lao thẳng húc tan nát tiền tuyến.' }
    ],
    mechanic: 'Giảm sát thương thụ động — Trọng kích bạt sơn — Thiết bích phòng thủ.',
    quote: '“Còn Đình An ở đây, không một kẻ nào có thể vượt qua lằn ranh này!”'
  },
  {
    id: 'hoanganh',
    slotName: 'PHÓ ĐẶNG HOÀNG ANH',
    fullName: 'PHÓ ĐẶNG HOÀNG ANH',
    title: 'TRẤN THỦ THẬP VẠN ĐẠI SƠN',
    tagline: 'Hùng cứ đại sơn — Cuốc sắt bạt địa',
    element: '⛰️',
    color: '#f59e0b',
    image: 'assets/images/characters/char_hoanganh.png',
    vovinamImage: 'assets/images/characters/char_hoanganh_vovinam.png',
    bio: 'Trấn thủ Thập Vạn Đại Sơn, sống theo luật của núi rừng. Sức mạnh bẩm sinh dời non lấp bể, coi nhẹ những đòn tấn công tầm thường của kẻ địch.',
    stats: { power: 100, speed: 55, defense: 90, technique: 70 },
    skills: [
      { icon: '⛏️', name: 'Thiết Cuốc Trảm', desc: 'Quét cuốc sắt ngang người với phạm vi cực rộng.' },
      { icon: '🌋', name: 'Đập Nát Địa Tầng', desc: 'Nện cuốc xuống đất tạo sóng xung kích chấn động sàn đấu.' },
      { icon: '🛡️', name: 'Bá Thể Sơn Cước', desc: 'Super Armor: không bị ngắt chiêu bởi đòn đánh nhẹ.' },
      { icon: '💥', name: 'Thống Sơn Đại Chùy', desc: 'Tuyệt kỹ: bổ trời giáng đất chấn nổ toàn bộ khu vực.' }
    ],
    mechanic: 'Super Armor bá thể — AoE mặt đất — Tầm đánh càn quét.',
    quote: '“Bước qua ranh giới núi rừng này, ngươi phải để mạng lại!”'
  },
  {
    id: 'dunghai',
    slotName: 'PHÓ DUNG HẢI',
    fullName: 'PHÓ DUNG HẢI',
    title: 'KẺ BỊ KHAI TRỪ',
    tagline: 'Biến ảo khôn lường — Xuất quỷ nhập thần',
    element: '🗡️',
    color: '#84cc16',
    image: 'assets/images/characters/char_dunghai.png',
    vovinamImage: 'assets/images/characters/char_dunghai_vovinam.png',
    bio: 'Kẻ từng bị khai trừ khỏi gia tộc, mang theo bí mật động trời về hồ sơ bị đánh cắp. Lối đánh bất quy tắc kết hợp thủ thuật tâm lý khiến đối thủ bối rối.',
    stats: { power: 75, speed: 90, defense: 60, technique: 95 },
    skills: [
      { icon: '💨', name: 'Nhịp Đánh Dối', desc: 'Hủy chiêu giữa chừng chuyển sang né và tập kích bất ngờ.' },
      { icon: '🗡️', name: 'Bóng Ma Tốc Biến', desc: 'Lướt nhanh để lại tàn ảnh và đâm trộm từ sau lưng.' },
      { icon: '🧱', name: 'Ám Khí Môi Trường', desc: 'Tận dụng đồ vật xung quanh để ném phá thế đối phương.' },
      { icon: '⚡', name: 'Huyễn Ảnh Loạn Vũ', desc: 'Tuyệt kỹ: phân thân tung hàng chục vết chém liên tiếp.' }
    ],
    mechanic: 'Nhịp đánh bất thường — Hủy đòn lừa thế — Áp sát độc hiểm.',
    quote: '“Ngươi tin vào mắt mình ư? Mắt người là thứ dễ lừa dối nhất.”'
  },
  {
    id: 'giangmanh',
    slotName: 'NGÔ GIANG MẠNH',
    fullName: 'NGÔ GIANG MẠNH',
    title: 'CHỦ GIA TỘC HỌ NGÔ',
    tagline: 'Nhất kiếm tuyệt sát — Hàn băng tịch mịch',
    element: '❄️',
    color: '#38bdf8',
    image: 'assets/images/characters/char_giangmanh.png',
    vovinamImage: 'assets/images/characters/char_giangmanh_vovinam.png',
    bio: 'Chủ nhân bí ẩn của bóng tối họ Ngô. Ít di chuyển, không động tác thừa, nắm rõ từng thói quen của đối thủ để tung ra đòn phản công trừng phạt chí mạng.',
    stats: { power: 90, speed: 85, defense: 75, technique: 100 },
    skills: [
      { icon: '👁️', name: 'Đọc Thói Quen', desc: 'Ghi nhớ đòn lặp của địch để tăng sát thương phản công.' },
      { icon: '❄️', name: 'Băng Thiềm Lạc Bộ', desc: 'Né ngang tức thì và lướt vào điểm mù của đối thủ.' },
      { icon: '⚡', name: 'Tuyệt Đối Phản Công', desc: 'Phản đòn chuẩn xác làm tê liệt và gây choáng dài.' },
      { icon: '🗡️', name: 'Vô Nhất Hàn Phong', desc: 'Tuyệt kỹ: kiếm khí băng hàn xé rách mọi tuyến phòng thủ.' }
    ],
    mechanic: 'Trừng phạt combo lặp — Né ngang tiếp cận — Đòn chém chuẩn xác.',
    quote: '“Thói quen của ngươi chính là nhược điểm chí tử.”'
  },
  {
    id: 'coming_soon',
    slotName: 'SẮP RA MẮT',
    fullName: 'CHIẾN BINH BÍ ẨN',
    title: 'KHÓA ĐẶC BIỆT',
    tagline: 'Đang thức tỉnh trong bóng tối...',
    element: '🔒',
    color: '#64748b',
    image: '',
    bio: 'Cao thủ bí ẩn đến từ phân nhánh Vovinam cổ truyền. Nhân vật này sẽ được khai mở trong các bản cập nhật sự kiện tiếp theo của Huyết Chiến Gia Tộc.',
    stats: { power: 99, speed: 99, defense: 99, technique: 99 },
    skills: [
      { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' },
      { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' },
      { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' },
      { icon: '🔒', name: 'Bí Kỹ Ẩn', desc: 'Chưa được giải mã.' }
    ],
    mechanic: 'Bí kỹ chưa được giải mã.',
    quote: '“Sức mạnh thực sự cần thời gian để thức tỉnh.”',
    isLocked: true
  }
];

class MenuManager {
  constructor() {
    this.selectedChar = (window.saveManager && window.saveManager.data.selectedCharacter) || 'nghi';
    this.dossierChar = 'nghi';

    // DOM
    this.charModal = document.getElementById('char-select-modal');
    this.mapModal = document.getElementById('chapter-map-modal');
    this.dossierModal = document.getElementById('dossier-modal');
    this.collectionModal = document.getElementById('collection-modal');
    this.achModal = document.getElementById('achievements-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.chroniclesModal = document.getElementById('chronicles-modal');
    this.custodyModal = document.getElementById('custody-modal');
    this.deployModal = document.getElementById('deployment-modal');
    this.campaignModal = document.getElementById('campaign-modal');
    this.newgameModal = document.getElementById('newgame-confirm-modal');

    this.charGrid = document.getElementById('char-grid');
    this.skinGrid = document.getElementById('skin-grid');
    this.charPortrait = document.getElementById('char-portrait');
    this.activeCsTab = 'heroes';
    this._csStageDemoState = null;
    this._csStageDemoTimer = 0;
    this._csStageDemoIdx = 0;
    this.chapterList = document.getElementById('chapter-list');
    this.dossierList = document.getElementById('dossier-list');
    this.collectionBody = document.getElementById('collection-body');
    this.achList = document.getElementById('ach-list');
    this.dossierBody = document.getElementById('dossier-body');

    this.deployStageTitle = document.getElementById('deploy-stage-title');
    this.deployStageDesc = document.getElementById('deploy-stage-desc');
    this.deployCharGrid = document.getElementById('deploy-char-grid');
    this.deployAllyGrid = document.getElementById('deploy-ally-grid');
    this.deploymentTargetStage = 1;

    // Quản lý tab & lọc tài liệu trong Biên Niên Sử
    this.activeChronTab = 'docs';
    this.activeChronFilter = 'all';
    this.selectedDocId = 'DOC_PHOTO_FAMILY';

    // Trạng thái tạm dừng khi mở modal điều tra / biên niên sử lúc đang chơi
    this._custodyWasPlaying = false;
    this._custodyOnDone = null;
    this._chroniclesWasPlaying = false;

    this.wire();
    this.refreshCharSelect();
  }

  // --------------------------------------------------------------------------
  // NÚT BẤM TRONG CÁC MÀN HÌNH MENU
  // --------------------------------------------------------------------------
  wire() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => { this.click(); fn(); });
    };

    // Campaign Hub (Chiến Dịch Cốt Truyện)
    on('btn-campaign-hub', () => this.showCampaignHub());
    on('btn-campaign-close', () => this.hideCampaignHub());
    on('btn-campaign-close-x', () => this.hideCampaignHub());
    on('btn-campaign-continue', () => {
      this.hideAll();
      const stage = (window.saveManager && window.saveManager.data.currentStage) || 1;
      if (window.uiManager) window.uiManager.hideTitleScreen();
      if (window.game) window.game.startStage(stage);
    });
    on('btn-campaign-newgame', () => {
      if (this.newgameModal) this.newgameModal.classList.remove('hidden');
    });
    on('btn-newgame-cancel', () => {
      if (this.newgameModal) this.newgameModal.classList.add('hidden');
    });
    on('btn-newgame-confirm', () => {
      if (window.saveManager) {
        window.saveManager.data.currentStage = 1;
        window.saveManager.persist();
      }
      this.hideAll();
      if (window.tutorialManager && window.tutorialManager.isTutorialNeeded()) {
        window.tutorialManager.showInviteModal(
          () => {
            if (window.uiManager) window.uiManager.hideTitleScreen();
            window.tutorialManager.startTutorial();
          },
          () => {
            if (window.saveManager) window.saveManager.skipTutorial();
            if (window.uiManager) window.uiManager.hideTitleScreen();
            if (window.game) window.game.startStage(1);
          }
        );
      } else {
        if (window.uiManager) window.uiManager.hideTitleScreen();
        if (window.game) window.game.startStage(1);
      }
    });
    on('btn-campaign-chapters', () => {
      this.hideCampaignHub();
      this.showChapterMap();
    });

    on('btn-char-close', () => this.hideAll());
    on('btn-char-close-x', () => this.hideAll());
    on('btn-char-start', () => this.startSelected());
    on('btn-char-prev', () => this.cycleChar(-1));
    on('btn-char-next', () => this.cycleChar(1));
    on('btn-map-close', () => this.hideAll());
    on('btn-map-close-x', () => this.hideAll());
    on('btn-dossier-close', () => this.hideAll());
    on('btn-dossier-close-x', () => this.hideAll());
    on('btn-collection-close', () => this.hideAll());
    on('btn-collection-close-x', () => this.hideAll());
    on('btn-ach-close', () => this.hideAll());
    on('btn-ach-close-x', () => this.hideAll());
    on('btn-achievements', () => this.showAchievements());
    on('btn-pause-achievements', () => {
      if (window.uiManager) window.uiManager.hidePause();
      this.showAchievements();
    });

    on('btn-open-keybindings', () => this.showKeybindings());
    on('btn-open-keybindings-from-controls', () => this.showKeybindings());
    on('btn-pause-keybindings', () => {
      if (window.uiManager) window.uiManager.hidePause();
      this.showKeybindings();
    });
    on('btn-keybindings-close-x', () => this.hideKeybindings());
    on('btn-close-keybindings', () => this.hideKeybindings());
    on('btn-reset-keybindings', () => {
      if (window.input) {
        window.input.resetDefaultBindings();
        this.showKeybindings();
      }
    });

    on('btn-settings-close', () => this.hideAll());
    on('btn-settings-close-x', () => this.hideAll());
    on('btn-ending-close-x', () => this.hideAll());
    on('btn-chronicles-close', () => this.closeChronicles());
    on('btn-chronicles-close-x', () => this.closeChronicles());

    on('btn-chronicles', () => this.showChronicles());
    on('btn-quick-chronicles', () => this.showChronicles());
    on('btn-pause-chronicles', () => {
      this.closeChronicles();
      this.showChronicles();
    });

    // Mới: Nút Luyện võ, Tái đấu Boss, Bảng suy luận, Chơi lại hướng dẫn
    on('btn-training', () => {
      if (window.trainingManager) {
        window.trainingManager.showModeSelectModal();
      } else {
        this.hideAll();
        if (window.uiManager) window.uiManager.hideTitleScreen();
      }
    });
    on('btn-boss-rush', () => {
      if (window.bossRushManager) window.bossRushManager.showMenu();
    });
    on('btn-deduction', () => {
      if (window.deductionManager) window.deductionManager.showBoard();
    });
    on('btn-pause-deduction', () => {
      if (window.uiManager) window.uiManager.hidePause();
      if (window.deductionManager) window.deductionManager.showBoard();
    });
    on('btn-replay-tutorial', () => {
      this.hideAll();
      if (window.uiManager) window.uiManager.hideTitleScreen();
      if (window.tutorialManager) window.tutorialManager.startTutorial();
    });

    on('btn-custody-cancel', () => this.closeCustodyModal());
    on('btn-custody-close-x', () => this.closeCustodyModal());

    on('btn-deploy-cancel', () => this.hideAll());
    on('btn-deploy-close-x', () => this.hideAll());
    on('btn-deploy-start', () => this.confirmDeployment());

    on('btn-deploy-skin-default', () => this.setDeploymentSkin('default'));
    on('btn-deploy-skin-vovinam', () => this.setDeploymentSkin('vovinam'));

    on('btn-cs-skin-default', () => this.setWardrobeSkin('default'));
    on('btn-cs-skin-vovinam', () => this.setWardrobeSkin('vovinam'));
    on('btn-cs-tab-heroes', () => this.switchCsTab('heroes'));
    on('btn-cs-tab-skins', () => this.switchCsTab('skins'));
    on('btn-cs-demo-move', () => this.triggerCsStageDemo());
    on('btn-cs-view-toggle', () => this.toggleCsStageView());

    // Đóng khi click ra ngoài backdrop modal (chống kẹt giao diện)
    [this.charModal, this.mapModal, this.dossierModal, this.collectionModal, this.achModal, this.settingsModal, this.deployModal, this.campaignModal, this.newgameModal].forEach((m) => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) this.hideAll();
        });
      }
    });
    if (this.custodyModal) {
      this.custodyModal.addEventListener('click', (e) => {
        if (e.target === this.custodyModal) this.closeCustodyModal();
      });
    }
    if (this.chroniclesModal) {
      this.chroniclesModal.addEventListener('click', (e) => {
        if (e.target === this.chroniclesModal) this.closeChronicles();
      });
    }

    on('btn-launch-flashback', () => {
      this.hideAll();
      if (window.flashbackMission) {
        window.flashbackMission.startMission();
      }
    });

    // Chuyển Tab trong Biên Niên Sử Họ Phó
    const chronTabs = document.querySelectorAll('.chron-tab-btn');
    chronTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        this.click();
        const tab = btn.getAttribute('data-tab');
        this.switchChroniclesTab(tab);
      });
    });

    // Bộ lọc loại tài liệu trong Biên Niên Sử
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.click();
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeChronFilter = chip.getAttribute('data-filter') || 'all';
        this.renderChroniclesDocs();
      });
    });

    on('btn-reset-progress', () => {
      if (window.saveManager) {
        window.saveManager.resetProgress();
        this.selectedChar = 'nghi';
        this.refreshCharSelect();
        this.showToast('ĐÃ XÓA TIẾN TRÌNH (giữ nguyên cài đặt âm thanh)');
      }
    });

    // Âm lượng
    const music = document.getElementById('setting-music');
    const sfx = document.getElementById('setting-sfx');
    const mute = document.getElementById('setting-mute');
    const st = window.saveManager ? window.saveManager.data.settings : null;
    if (music) {
      if (st) music.value = Math.round((st.musicVolume ?? 0.45) * 100);
      music.addEventListener('input', () => {
        if (window.audioManager) window.audioManager.setMusicVolume(Number(music.value) / 100);
      });
    }
    if (sfx) {
      if (st) sfx.value = Math.round((st.sfxVolume ?? 0.85) * 100);
      sfx.addEventListener('input', () => {
        if (window.audioManager) window.audioManager.setSfxVolume(Number(sfx.value) / 100);
      });
    }
    if (mute) {
      if (st) mute.checked = !!st.muted;
      mute.addEventListener('change', () => {
        if (window.audioManager && window.audioManager.isMuted !== mute.checked) {
          window.audioManager.toggleMute();
          if (window.uiManager) window.uiManager.updateAudioButton(mute.checked);
        }
      });
    }

    // Tùy chọn tiếp cận (Accessibility: giảm rung màn hình, giảm chớp flash)
    const reduceShake = document.getElementById('setting-reduce-shake');
    const reduceFlash = document.getElementById('setting-reduce-flash');
    if (reduceShake) {
      if (window.fxSettings) reduceShake.checked = !!window.fxSettings.reduceShake;
      reduceShake.addEventListener('change', () => {
        if (window.fxSettings) {
          window.fxSettings.reduceShake = reduceShake.checked;
          window.fxSettings.save();
        }
      });
    }
    if (reduceFlash) {
      if (window.fxSettings) reduceFlash.checked = !!window.fxSettings.reduceFlash;
      reduceFlash.addEventListener('change', () => {
        if (window.fxSettings) {
          window.fxSettings.reduceFlash = reduceFlash.checked;
          window.fxSettings.save();
        }
      });
    }
    const hideDmg = document.getElementById('setting-hide-dmg');
    if (hideDmg) {
      if (window.fxSettings) hideDmg.checked = !!window.fxSettings.hideDamageNumbers;
      hideDmg.addEventListener('change', () => {
        if (window.fxSettings) {
          window.fxSettings.hideDamageNumbers = hideDmg.checked;
          window.fxSettings.save();
        }
      });
    }
  }

  click() { if (window.audioManager) window.audioManager.playClick(); }

  showToast(msg) { if (window.uiManager) window.uiManager.showToast(msg); }

  hideAll() {
    const creditsModal = document.getElementById('credits-modal');
    const keybindingsModal = document.getElementById('keybindings-modal');
    [this.charModal, this.mapModal, this.dossierModal, this.collectionModal, this.achModal, this.settingsModal, this.chroniclesModal, this.custodyModal, this.deployModal, this.campaignModal, this.newgameModal, creditsModal, keybindingsModal]
      .forEach((m) => { if (m) m.classList.add('hidden'); });
    if (window.uiManager) window.uiManager.hideStageSelect();
    if (window.deductionManager) window.deductionManager.hideBoard();
    if (window.bossRushManager) window.bossRushManager.hideMenu();

    if (window.uiManager && window.uiManager._returnToPauseOnCloseSettings) {
      window.uiManager._returnToPauseOnCloseSettings = false;
      window.uiManager.showPause();
    } else if (window.game && window.game.state === 'MENU' && window.uiManager) {
      window.uiManager.hideHUD();
      const topControls = document.getElementById('top-controls');
      if (topControls) topControls.classList.add('hidden');
    }

    // Hồi phục game loop nếu trước đó bị tạm dừng do mở modal điều tra / biên niên sử
    if (this._custodyWasPlaying && window.game && window.game.state === 'PAUSED') {
      window.game.state = 'PLAYING';
      this._custodyWasPlaying = false;
    }
    if (this._chroniclesWasPlaying && window.game && window.game.state === 'PAUSED') {
      window.game.state = 'PLAYING';
      this._chroniclesWasPlaying = false;
    }
    if (window.input && typeof window.input.clearAll === 'function') {
      window.input.clearAll();
    }
  }

  showCampaignHub() {
    this.hideAll();
    const curStage = (window.saveManager && window.saveManager.data.currentStage) || 1;
    const stageMeta = (window.STORY_META && window.STORY_META.stages) ? window.STORY_META.stages[curStage] : null;
    const curNameEl = document.getElementById('campaign-cur-stage-name');
    const curDescEl = document.getElementById('campaign-cur-stage-desc');

    if (curNameEl) {
      curNameEl.textContent = stageMeta ? stageMeta.title : `MÀN ${curStage}: KHU VỰC CHIẾN ĐẤU`;
    }
    if (curDescEl) {
      curDescEl.textContent = stageMeta ? (stageMeta.subtitle || stageMeta.objective) : 'Tiếp tục hành trình điều tra đại án gia tộc và giải cứu Hứa Vũ Đại.';
    }

    if (this.campaignModal) {
      this.campaignModal.classList.remove('hidden');
    }
  }

  hideCampaignHub() {
    if (this.campaignModal) this.campaignModal.classList.add('hidden');
    if (this.newgameModal) this.newgameModal.classList.add('hidden');
    if (window.game && window.game.state === 'MENU' && window.uiManager) {
      window.uiManager.showTitleScreen();
    }
  }

  // --------------------------------------------------------------------------
  // CHỌN NHÂN VẬT
  // --------------------------------------------------------------------------
  playableList() {
    return Object.values(window.CHARACTERS || {}).filter((c) => c.playable);
  }

  isUnlocked(id) {
    if (id === 'nghi') return true;
    if (id === 'coming_soon') return false;
    return window.saveManager ? window.saveManager.isCharacterUnlocked(id) : false;
  }

  cycleChar(direction) {
    const curIdx = CHAR_SLOTS.findIndex(s => s.id === this.selectedChar);
    let nextIdx = curIdx + direction;
    if (nextIdx < 0) nextIdx = CHAR_SLOTS.length - 1;
    if (nextIdx >= CHAR_SLOTS.length) nextIdx = 0;
    this.selectedChar = CHAR_SLOTS[nextIdx].id;
    this.refreshCharSelect();
  }

  initCsParticles() {
    const canvas = document.getElementById('cs-particles-canvas');
    if (!canvas || canvas._init) return;
    canvas._init = true;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const leaves = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      leaves.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 5 + Math.random() * 8,
        speedX: -0.6 - Math.random() * 1.2,
        speedY: 0.8 + Math.random() * 1.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.02 * (Math.random() - 0.5),
        color: Math.random() > 0.4 ? 'rgba(255, 195, 60, 0.75)' : 'rgba(230, 80, 40, 0.65)'
      });
    }

    const loop = () => {
      const modal = document.getElementById('char-select-modal');
      if (modal && !modal.classList.contains('hidden')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < leaves.length; i++) {
          const l = leaves[i];
          l.x += l.speedX;
          l.y += l.speedY;
          l.rot += l.rotSpeed;
          if (l.y > canvas.height + 20) { l.y = -20; l.x = Math.random() * canvas.width + 100; }
          if (l.x < -30) { l.x = canvas.width + 30; }

          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(l.rot);
          ctx.fillStyle = l.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, l.size, l.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  getStyleTypeForChar(charId) {
    const cObj = (window.CHARACTERS || {})[charId];
    if (cObj && cObj.styleType) return cObj.styleType;
    const fallback = {
      nghi: 'player',
      bichlam: 'boss_bichlam',
      huavudai: 'npc_huavudai',
      dinhan: 'boss_dinhan',
      hoanganh: 'boss_hoanganh',
      dunghai: 'boss_dunghai',
      giangmanh: 'boss_giangmanh'
    };
    return fallback[charId] || 'player';
  }

  getSkinsForChar(slot) {
    if (!slot || slot.isLocked) return [];

    // Ngô Nhất Nghị mặc định đã khoác Lam Võ Phục Vovinam nên chỉ có 1 trang phục chuẩn
    if (slot.id === 'nghi') {
      return [
        {
          id: 'default',
          name: 'Lam Võ Phục Chính Thống',
          tier: 'MẶC ĐỊNH • VIỆT VÕ ĐẠO',
          badgeClass: 'vovinam',
          image: slot.image,
          fx: ['Lam Võ Phục', 'Hoàng Đai Vovinam', 'Đòn Chân Kẹp'],
          sub: 'Võ phục Vovinam truyền thống kèm phù hiệu Việt Võ Đạo — Trang phục chuẩn của Ngô Nhất Nghị'
        }
      ];
    }

    const defaultSkinTitles = {
      bichlam: {
        name: 'Thanh Phong Thiết Quyền',
        sub: 'Võ phục lục chiến không tay kèm băng quấn cổ tay chiến thuật',
        fx: ['Lục Chiến Y', 'Thần Phong Trảo']
      },
      huavudai: {
        name: 'Âu Phục Ông Trùm',
        sub: 'Bộ vest đen thêu rồng quyền lực kết hợp trượng đầu rồng bạc',
        fx: ['Âu Phục Hắc Long', 'Thiết Trượng']
      },
      dinhan: {
        name: 'Thiết Giáp Chùy Vương',
        sub: 'Chiến giáp Phụng Hoàng, Chùy Gai Càn Quét & Khiên Hỏa Liên',
        fx: ['Chiến Giáp Đỏ', 'Chùy Gai & Khiên']
      },
      hoanganh: {
        name: 'Sơn Cước Thiết Cuốc',
        sub: 'Võ phục sơn trang dã chiến cùng Thiết Cuốc Càn Quét hạng nặng',
        fx: ['Sơn Trang Y', 'Thiết Cuốc Bạt Sơn']
      },
      dunghai: {
        name: 'Huyết Ảnh Song Đao',
        sub: 'Dạ hành phục sát thủ khăn đỏ cùng cặp Song Đoản Đao sắc bén',
        fx: ['Dạ Hành Giáp', 'Song Đoản Đao']
      },
      giangmanh: {
        name: 'Hàn Băng Kiếm Chủ',
        sub: 'Trường bào tông chủ thêu bạc cùng Hàn Băng Đao tuyệt sát',
        fx: ['Trường Bào Bạc', 'Hàn Băng Đao']
      }
    };
    const defMeta = defaultSkinTitles[slot.id] || {
      name: 'Trang Phục Mặc Định',
      sub: 'Ngoại hình và vũ khí nguyên bản theo cốt truyện',
      fx: ['Nguyên Bản']
    };
    return [
      {
        id: 'default',
        name: defMeta.name,
        tier: 'MẶC ĐỊNH',
        badgeClass: 'default',
        image: slot.image,
        fx: defMeta.fx || ['Nguyên Bản'],
        sub: defMeta.sub
      },
      {
        id: 'vovinam',
        name: 'Võ Phục Vovinam Chính Thống',
        tier: 'BẬC A • VIỆT VÕ ĐẠO',
        badgeClass: 'vovinam',
        image: slot.vovinamImage || slot.image,
        fx: ['Lam Võ Phục', 'Phù Hiệu Vovinam', 'Thế Tấn Võ Đạo'],
        sub: 'Lam Võ Phục thêu Kim Long kèm phù hiệu Vovinam — Thi triển Cương Nhu Phối Triển chuẩn Việt Võ Đạo'
      }
    ];
  }

  switchCsTab(tab) {
    this.activeCsTab = tab === 'skins' ? 'skins' : 'heroes';
    const tabHeroes = document.getElementById('btn-cs-tab-heroes');
    const tabSkins = document.getElementById('btn-cs-tab-skins');
    if (tabHeroes) tabHeroes.classList.toggle('active', this.activeCsTab === 'heroes');
    if (tabSkins) tabSkins.classList.toggle('active', this.activeCsTab === 'skins');

    if (this.charGrid) this.charGrid.classList.toggle('hidden', this.activeCsTab !== 'heroes');
    if (this.skinGrid) this.skinGrid.classList.toggle('hidden', this.activeCsTab !== 'skins');

    const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar) || CHAR_SLOTS[0];
    const colTitle = document.getElementById('cs-col-left-title') || document.querySelector('.cs-col-title');
    if (colTitle) {
      if (this.activeCsTab === 'skins') {
        colTitle.textContent = `TRANG PHỤC — ${slot ? slot.slotName : ''}`;
      } else {
        colTitle.textContent = this.isCampaignMode ? 'CHỌN NHÂN VẬT XUẤT TRẬN' : 'DANH SÁCH VÕ SĨ';
      }
    }
    this.renderSkinGrid();
    this.updateWardrobeButtons();
  }

  renderSkinGrid() {
    if (!this.skinGrid) return;
    this.skinGrid.innerHTML = '';
    const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar) || CHAR_SLOTS[0];
    if (!slot) return;

    const isVovinam = slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
    const equippedSkinId = isVovinam ? 'vovinam' : 'default';
    const skins = this.getSkinsForChar(slot);

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    if (slot.isLocked || skins.length === 0) {
      this.skinGrid.innerHTML = `<div class="cs-skin-empty">Nhân vật này chưa mở khóa trang phục.</div>`;
      return;
    }

    skins.forEach((sk) => {
      const isSelected = equippedSkinId === sk.id;
      const card = document.createElement('div');
      card.className = 'cs-skin-card' + (isSelected ? ' selected' : '');
      const fxHtml = (sk.fx || []).map(tag => `<span class="cs-skin-fx-chip">${tag}</span>`).join('');
      card.innerHTML = `
        <div class="cs-skin-art-wrap">
          ${sk.image ? `<img class="cs-skin-card-img" src="${sk.image}" alt="${sk.name}">` : ''}
          <span class="cs-skin-tier-ribbon ${sk.badgeClass}">${sk.tier}</span>
        </div>
        <div class="cs-skin-info">
          <div>
            <div class="cs-skin-title">${sk.name}</div>
            <div class="cs-skin-desc">${sk.sub}</div>
          </div>
          ${fxHtml ? `<div class="cs-skin-fx-list">${fxHtml}</div>` : ''}
          <span class="cs-skin-status-pill">${isSelected ? '✔ ĐANG TRANG BỊ' : 'NHẤN ĐỂ TRANG BỊ'}</span>
        </div>`;

      card.addEventListener('click', () => {
        this.click();
        this._csStageDemoTimer = 0;
        this._csStageDemoState = null;
        this.setWardrobeSkin(sk.id);
      });

      this.skinGrid.appendChild(card);
    });
  }

  getDemoCombos(charId) {
    switch (charId) {
      case 'dinhan':
        return [
          {
            name: 'Liên Hoàn Khiên Kích & Trọng Chùy',
            moves: [
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'overhead_smash', duration: 0.58, sound: 'swing' },
              { state: 'boss_bash', duration: 0.65, sound: 'kiai_counter' }
            ]
          },
          {
            name: 'Kim Cang Phản Kích Vạn Quân',
            moves: [
              { state: 'guard', duration: 0.42, sound: 'guard' },
              { state: 'boss_riposte', duration: 0.52, sound: 'swing' },
              { state: 'ultimate_bash', duration: 0.88, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'hoanganh':
        return [
          {
            name: 'Thiết Cuốc Bạt Sơn Khai Thạch',
            moves: [
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'boss_swing', duration: 0.55, sound: 'swing' },
              { state: 'kick_sweep', duration: 0.45, sound: 'kick' },
              { state: 'boss_slam', duration: 0.70, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'dunghai':
        return [
          {
            name: 'Huyết Ảnh Song Đao Trảm',
            moves: [
              { state: 'boss_stab', duration: 0.42, sound: 'swing' },
              { state: 'punch_hook', duration: 0.38, sound: 'swing' },
              { state: 'flying_kick', duration: 0.58, sound: 'kiai_kick' },
              { state: 'uppercut', duration: 0.52, sound: 'swing' }
            ]
          }
        ];
      case 'bichlam':
        return [
          {
            name: 'Thần Phong Liên Hoàn Quyền Trảo',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'punch_hook', duration: 0.35, sound: 'swing' },
              { state: 'elbow_strike', duration: 0.42, sound: 'swing' },
              { state: 'kick_roundhouse', duration: 0.52, sound: 'kiai_kick' }
            ]
          }
        ];
      case 'huavudai':
        return [
          {
            name: 'Hắc Long Quyền Trượng',
            moves: [
              { state: 'kick_push', duration: 0.42, sound: 'kick' },
              { state: 'punch_straight', duration: 0.38, sound: 'swing' },
              { state: 'boss_stab', duration: 0.52, sound: 'swing' },
              { state: 'boss_taunt', duration: 0.68, sound: 'kiai_ultimate' }
            ]
          }
        ];
      case 'giangmanh':
        return [
          {
            name: 'Hàn Băng Tuyệt Sát Kiếm',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'boss_swing', duration: 0.52, sound: 'swing' },
              { state: 'kick_roundhouse', duration: 0.48, sound: 'kick' },
              { state: 'boss_stab', duration: 0.62, sound: 'kiai_ultimate' }
            ]
          }
        ];
      default: // Ngô Nhất Nghị ('nghi') & Vovinam chuẩn
        return [
          {
            name: 'Chuỗi Quyền Cước Vovinam Khởi Khí',
            moves: [
              { state: 'punch_straight', duration: 0.35, sound: 'swing' },
              { state: 'punch_hook', duration: 0.35, sound: 'swing' },
              { state: 'kick_roundhouse', duration: 0.46, sound: 'kick' },
              { state: 'flying_kick', duration: 0.58, sound: 'kiai_kick' }
            ]
          },
          {
            name: 'Đòn Chân Kẹp Cổ & Phản Đòn Vovinam',
            moves: [
              { state: 'guard', duration: 0.38, sound: 'guard' },
              { state: 'elbow_strike', duration: 0.42, sound: 'swing' },
              { state: 'kick_sweep', duration: 0.42, sound: 'kick' },
              { state: 'scissor_kick', duration: 0.75, sound: 'kiai_scissor' }
            ]
          },
          {
            name: 'Tuyệt Kỹ Sấm Sét Long Hổ Xuất Sơn',
            moves: [
              { state: 'punch_straight', duration: 0.30, sound: 'swing' },
              { state: 'uppercut', duration: 0.42, sound: 'swing' },
              { state: 'ultimate_flurry', duration: 1.15, sound: 'kiai_ultimate' }
            ]
          }
        ];
    }
  }

  _playDemoMoveSound(sound, charId) {
    if (!window.audioManager) return;
    try {
      if (sound === 'swing') {
        window.audioManager.playSwing();
      } else if (sound === 'kick') {
        window.audioManager.playKick();
      } else if (sound === 'guard') {
        window.audioManager.playBlock();
      } else if (sound === 'kiai_kick') {
        window.audioManager.playKick();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('kick', charId);
        }
      } else if (sound === 'kiai_scissor') {
        window.audioManager.playSwing();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('scissor', charId);
        }
      } else if (sound === 'kiai_counter') {
        window.audioManager.playPunch();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('counter', charId);
        }
      } else if (sound === 'kiai_ultimate') {
        window.audioManager.playPunch();
        if (typeof window.audioManager.playVovinamKiai === 'function') {
          window.audioManager.playVovinamKiai('ultimate', charId);
        }
      }
    } catch (_) {}
  }

  toggleCsStageView() {
    this._csLiveStageActive = !this._csLiveStageActive;
    if (this._csLiveStageActive) {
      this.showToast('ĐÃ BẬT VÕ ĐÀI 3D VÕ THUẬT ⚡');
    } else {
      this._csCurrentMove = null;
      this._csActiveDemoQueue = [];
      this._csMoveTimer = 0;
      this.showToast('ĐÃ CHUYỂN SANG TRANH VẼ NGHỆ THUẬT 🎨');
    }
    this.updateWardrobeButtons();
  }

  triggerCsStageDemo() {
    const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar) || CHAR_SLOTS[0];
    if (!slot || slot.isLocked) return;

    // Kích hoạt ngay chế độ sân khấu trực tiếp
    this._csLiveStageActive = true;
    this.updateWardrobeButtons();

    const combos = this.getDemoCombos(slot.id);
    const comboIdx = (this._csStageDemoComboIdx || 0) % combos.length;
    const combo = combos[comboIdx];
    this._csStageDemoComboIdx = comboIdx + 1;

    this._csActiveDemoQueue = combo.moves.map(m => Object.assign({}, m));
    this._csCurrentMove = this._csActiveDemoQueue.shift();
    this._csMoveTimer = 0;
    this._playDemoMoveSound(this._csCurrentMove.sound, slot.id);

    const demoBtn = document.getElementById('btn-cs-demo-move');
    if (demoBtn) {
      demoBtn.textContent = `⚡ ĐANG THI TRIỂN: ${combo.name.toUpperCase()}`;
      demoBtn.classList.add('playing');
    }
    this.showToast(`🥋 BIỂU DIỄN: ${combo.name}`);
  }

  initCsSkinStageCanvas() {
    const canvas = document.getElementById('cs-hero-skin-canvas');
    if (!canvas || canvas._stageLoopInit) return;
    canvas._stageLoopInit = true;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let lastTime = performance.now();

    const loop = (now) => {
      const modal = document.getElementById('char-select-modal');
      if (modal && !modal.classList.contains('hidden') && !canvas.classList.contains('hidden')) {
        frame++;
        const dt = Math.min(0.05, Math.max(0.001, ((now || performance.now()) - lastTime) / 1000));
        lastTime = now || performance.now();
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar) || CHAR_SLOTS[0];
        if (slot && !slot.isLocked && window.skeletalRenderer) {
          const isVovinam = window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
          const styleType = this.getStyleTypeForChar(slot.id);
          const accent = isVovinam ? '#1e88e5' : (slot.color || '#d4a017');

          // Hào quang pháp trận võ đài dưới chân và sau lưng
          ctx.save();
          const pulse = 1 + Math.sin(frame * 0.05) * 0.04;
          const auraGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 20, w * 0.5, h * 0.48, w * 0.45 * pulse);
          auraGrad.addColorStop(0, isVovinam ? 'rgba(30, 136, 229, 0.36)' : `${accent}44`);
          auraGrad.addColorStop(0.55, isVovinam ? 'rgba(255, 213, 79, 0.14)' : `${accent}18`);
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, w, h);

          // Vòng tròn Bát Quái / Âm Dương Vovinam xoay nhẹ phía sau lưng
          ctx.translate(w * 0.5, h * 0.44);
          ctx.rotate(frame * 0.006);
          ctx.strokeStyle = isVovinam ? 'rgba(255, 213, 79, 0.32)' : 'rgba(255, 215, 110, 0.22)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 148, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.arc(0, 0, 164, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          // Bệ đá võ đài dưới chân
          ctx.save();
          const pedGrad = ctx.createRadialGradient(w * 0.5, h * 0.84, 10, w * 0.5, h * 0.84, 155);
          pedGrad.addColorStop(0, isVovinam ? 'rgba(41, 182, 246, 0.45)' : 'rgba(255, 195, 65, 0.35)');
          pedGrad.addColorStop(0.7, 'rgba(15, 22, 36, 0.65)');
          pedGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = pedGrad;
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.84, 150, 26, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isVovinam ? 'rgba(255, 213, 79, 0.55)' : 'rgba(255, 200, 80, 0.4)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.84, 128, 19, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Xử lý tiến trình đòn thế combo mượt mà (Combo Animation State Machine)
          let animState = 'idle';
          let stateTimer = frame * 0.02;
          let stateDuration = 0;

          if (this._csCurrentMove) {
            this._csMoveTimer += dt;
            animState = this._csCurrentMove.state;
            stateTimer = this._csMoveTimer;
            stateDuration = this._csCurrentMove.duration;

            if (this._csMoveTimer >= this._csCurrentMove.duration) {
              if (this._csActiveDemoQueue && this._csActiveDemoQueue.length > 0) {
                this._csCurrentMove = this._csActiveDemoQueue.shift();
                this._csMoveTimer = 0;
                this._playDemoMoveSound(this._csCurrentMove.sound, slot.id);
              } else {
                this._csCurrentMove = null;
                this._csMoveTimer = 0;
                const demoBtn = document.getElementById('btn-cs-demo-move');
                if (demoBtn) {
                  demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ TIẾP THEO';
                  demoBtn.classList.remove('playing');
                }
              }
            }
          }

          // Vẽ nhân vật kích thước chuẩn trên sân khấu trung tâm (không bao giờ biến mất!)
          ctx.save();
          const scale = 2.05;
          ctx.translate(w * 0.5, h * 0.82);
          ctx.scale(scale, scale);

          const dummy = {
            x: 0,
            y: 0,
            width: 48,
            height: 92,
            facing: 1,
            state: animState,
            stateTimer: stateTimer,
            stateDuration: stateDuration,
            animFrame: Math.floor(frame / 7) % 4,
            characterId: slot.id,
            charId: slot.id,
            styleType: styleType,
            vovinamSkin: isVovinam,
            rageActive: animState !== 'idle',
            isBoss: styleType.startsWith('boss_'),
            renderScale: 1.0
          };
          window.skeletalRenderer.render(ctx, dummy);
          ctx.restore();
        }
      } else {
        lastTime = now || performance.now();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  refreshCharSelect() {
    this.initCsParticles();
    this.initCsSkinStageCanvas();
    if (!this.charGrid) return;
    this.charGrid.innerHTML = '';

    CHAR_SLOTS.forEach((slot) => {
      const unlocked = this.isUnlocked(slot.id);
      const isSelected = this.selectedChar === slot.id;
      const card = document.createElement('div');
      card.className = 'cs-card' +
        (unlocked ? '' : ' locked') +
        (isSelected ? ' selected' : '');

      card.innerHTML = `
        <div class="cs-card-thumb-wrap">
          ${slot.image ? `<img class="cs-card-img" src="${slot.image}" alt="${slot.slotName}">` : `<div class="cs-card-lock-icon"><span>🔒</span></div>`}
          ${!unlocked && slot.image ? `<div class="cs-card-lock-icon"><span>🔒</span></div>` : ''}
        </div>
        <div class="cs-card-banner">
          <span class="cs-card-name">${slot.slotName}</span>
        </div>
        <span class="cs-card-element">${slot.element}</span>`;

      card.addEventListener('click', () => {
        this.click();
        this.selectedChar = slot.id;
        this._csCurrentMove = null;
        this._csActiveDemoQueue = [];
        this._csMoveTimer = 0;
        const demoBtn = document.getElementById('btn-cs-demo-move');
        if (demoBtn) {
          demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ';
          demoBtn.classList.remove('playing');
        }
        this.refreshCharSelect();
        if (slot.isLocked) {
          this.showToast('NHÂN VẬT SẮP RA MẮT!');
        } else if (!unlocked) {
          const orig = (window.CHARACTERS || {})[slot.id];
          this.showToast('CHƯA MỞ KHÓA: ' + (orig ? this.lockText(orig) : 'Cần vượt màn chơi'));
        }
      });

      this.charGrid.appendChild(card);
    });

    this.renderSkinGrid();
    this.renderCharDetail();
    this.refreshAllySelector();
  }

  lockText(c) {
    if (!c || !c.unlock) return 'CHƯA MỞ KHÓA';
    if (c.unlock.type === 'stage') return 'HOÀN THÀNH MÀN ' + c.unlock.stage;
    return c.unlock.text || 'CHƯA MỞ KHÓA';
  }

  renderCharDetail() {
    const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar) || CHAR_SLOTS[0];
    if (!slot) return;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('char-detail-name', slot.fullName || slot.slotName);
    set('char-detail-title', slot.title);
    set('char-detail-tagline', slot.tagline);
    set('char-detail-bio', slot.bio);
    set('char-detail-quote', slot.quote);
    set('char-detail-mechanic', slot.mechanic);

    // Cập nhật ảnh toàn thân theo Trang Phục đang chọn và ánh sáng hào quang trung tâm
    const isVovinam = slot.id !== 'nghi' && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(slot.id, 'vovinam');
    const targetHeroImg = (isVovinam && slot.vovinamImage) ? slot.vovinamImage : slot.image;
    const heroImg = document.getElementById('cs-hero-img');
    if (heroImg) {
      if (targetHeroImg) {
        heroImg.style.display = 'block';
        heroImg.style.opacity = '0.35';
        heroImg.src = targetHeroImg;
        heroImg.dataset.currentSrc = targetHeroImg;
        setTimeout(() => { heroImg.style.opacity = '1'; }, 60);
      } else {
        heroImg.style.display = 'none';
      }
    }
    const ambient = document.getElementById('cs-hero-ambient');
    if (ambient) {
      ambient.style.background = `radial-gradient(circle, ${slot.color}44 0%, ${slot.color}11 45%, transparent 70%)`;
    }

    // 4 Thanh chỉ số chiến đấu dạng thanh vàng óng ánh (như mockup)
    const statsContainer = document.getElementById('char-detail-stats');
    if (statsContainer) {
      statsContainer.innerHTML = '';
      const statLabels = [
        { label: 'Sức mạnh', val: slot.stats.power },
        { label: 'Tốc độ', val: slot.stats.speed },
        { label: 'Kháng cự', val: slot.stats.defense },
        { label: 'Kỹ thuật', val: slot.stats.technique }
      ];
      statLabels.forEach(st => {
        const row = document.createElement('div');
        row.className = 'cs-stat-row';
        row.innerHTML = `
          <span class="cs-stat-label">${st.label}</span>
          <div class="cs-stat-track">
            <div class="cs-stat-fill" style="width: 0%"></div>
          </div>`;
        statsContainer.appendChild(row);
        setTimeout(() => {
          const fill = row.querySelector('.cs-stat-fill');
          if (fill) fill.style.width = st.val + '%';
        }, 50);
      });
    }

    // 4 Huy hiệu Kỹ Năng Đặc Biệt
    const skillsBadges = document.getElementById('cs-skills-badges');
    if (skillsBadges && slot.skills) {
      skillsBadges.innerHTML = '';
      slot.skills.forEach(sk => {
        const b = document.createElement('div');
        b.className = 'cs-skill-badge';
        b.title = `${sk.name}: ${sk.desc}`;
        b.innerHTML = `<span class="cs-skill-ico">${sk.icon}</span>`;
        b.addEventListener('click', () => {
          this.showToast(`${sk.name}: ${sk.desc}`);
        });
        skillsBadges.appendChild(b);
      });
    }

    // Cập nhật trạng thái nút CHỌN
    const startBtn = document.getElementById('btn-char-start');
    if (startBtn) {
      const confirmText = startBtn.querySelector('.cs-confirm-text');
      const unlocked = this.isUnlocked(slot.id);
      if (slot.isLocked) {
        if (confirmText) confirmText.textContent = 'SẮP RA MẮT';
        startBtn.classList.add('disabled');
      } else if (!unlocked) {
        if (confirmText) confirmText.textContent = 'CHƯA MỞ KHÓA';
        startBtn.classList.add('disabled');
      } else {
        if (confirmText) confirmText.textContent = this.isCampaignMode ? 'XUẤT TRẬN' : 'LƯU THIẾT LẬP 🥋';
        startBtn.classList.remove('disabled');
      }
    }
    this.updateWardrobeButtons();
  }

  openCharSelect(targetStage = null) {
    this.hideAll();
    this._csCurrentMove = null;
    this._csActiveDemoQueue = [];
    this._csMoveTimer = 0;
    const demoBtn = document.getElementById('btn-cs-demo-move');
    if (demoBtn) {
      demoBtn.textContent = '⚡ BIỂU DIỄN ĐÒN THẾ';
      demoBtn.classList.remove('playing');
    }
    this.isCampaignMode = (targetStage !== null && targetStage !== undefined);
    this.deploymentTargetStage = (targetStage !== null && targetStage !== undefined)
      ? targetStage
      : ((window.saveManager && window.saveManager.data.currentStage) || 1);

    const indicator = document.getElementById('cs-stage-indicator');
    const motto = document.getElementById('cs-top-motto');
    const stageTitleText = document.getElementById('cs-stage-title-text');
    const startBtn = document.getElementById('btn-char-start');
    const confirmText = startBtn ? startBtn.querySelector('.cs-confirm-text') : null;
    const colTitle = document.querySelector('.cs-col-title');

    if (this.isCampaignMode) {
      if (indicator) indicator.classList.remove('hidden');
      if (motto) motto.classList.add('hidden');
      const meta = (window.STORY_META && window.STORY_META.stages) ? window.STORY_META.stages[this.deploymentTargetStage] : null;
      const sTitle = meta ? meta.title : `MÀN ${this.deploymentTargetStage}`;
      if (stageTitleText) stageTitleText.textContent = sTitle;
      if (confirmText) confirmText.textContent = 'XUẤT TRẬN';
      if (colTitle) colTitle.textContent = 'CHỌN NHÂN VẬT XUẤT TRẬN';
    } else {
      if (indicator) indicator.classList.add('hidden');
      if (motto) motto.classList.remove('hidden');
      if (confirmText) confirmText.textContent = 'LƯU THIẾT LẬP 🥋';
      if (colTitle) colTitle.textContent = 'XEM NHÂN VẬT & VÕ PHỤC';
    }

    this.refreshCharSelect();
    this.refreshAllySelector();
    if (this.charModal) this.charModal.classList.remove('hidden');
  }

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
    const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar);
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
  showChapterMap() {
    if (!this.chapterList) return;
    this.chapterList.innerHTML = '';
    const meta = window.STORY_META;
    if (!meta) return;

    meta.acts.forEach((act) => {
      const actEl = document.createElement('div');
      actEl.className = 'act-block';
      const head = document.createElement('div');
      head.className = 'act-head';
      head.innerHTML = `<span class="act-code"></span><span class="act-title"></span><span class="act-desc"></span>`;
      head.querySelector('.act-code').textContent = act.code;
      head.querySelector('.act-title').textContent = act.title;
      head.querySelector('.act-desc').textContent = act.desc;
      actEl.appendChild(head);

      act.stages.forEach((sid) => {
        const s = meta.stages[sid];
        if (!s) return;
        const unlocked = window.saveManager ? window.saveManager.isStageUnlocked(sid) : sid === 1;
        const done = window.saveManager ? window.saveManager.data.completedStages.includes(sid) : false;
        const bestRec = (window.saveManager && typeof window.saveManager.getStageBest === 'function')
          ? window.saveManager.getStageBest(sid)
          : null;

        const card = document.createElement('div');
        card.className = 'stage-row' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
        card.innerHTML = `
          <span class="stage-index">M${s.id}</span>
          <span class="stage-main-info">
            <span class="stage-title"></span>
            <span class="stage-mission"></span>
          </span>
          ${bestRec ? `<span class="stage-rank-badge rank-${bestRec.rank}">${bestRec.rank} (${bestRec.score.toLocaleString()}đ)</span>` : ''}
          <span class="stage-flags"></span>`;
        card.querySelector('.stage-title').textContent = s.title;
        card.querySelector('.stage-mission').textContent = s.mission || '';
        const flags = [];
        if (s.type === 'side') flags.push('NHIỆM VỤ PHỤ');
        if (s.choice) flags.push('CÓ LỰA CHỌN');
        if (s.boss) flags.push('BOSS');
        if (done) flags.push('ĐÃ QUA');
        if (!unlocked) flags.push('KHÓA');
        card.querySelector('.stage-flags').textContent = flags.join(' · ');
        card.addEventListener('click', () => {
          this.click();
          if (!unlocked) { this.showToast('MÀN NÀY ĐANG KHÓA — hoàn thành màn trước đã'); return; }
          this.showDeploymentModal(sid);
        });
        actEl.appendChild(card);
      });
      this.chapterList.appendChild(actEl);
    });

    this.mapModal.classList.remove('hidden');
  }



  setWardrobeSkin(skinType) {
    const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar) || CHAR_SLOTS[0];
    if (slot && slot.id === 'nghi') {
      skinType = 'default';
    }
    if (window.saveManager && typeof window.saveManager.setSkinEquipped === 'function') {
      window.saveManager.setSkinEquipped(this.selectedChar, skinType);
    }
    // Xóa cache style để trang phục mới được dựng lại ngay (trong menu lẫn trong trận)
    if (window.skeletalRenderer) window.skeletalRenderer._styles = {};
    this.renderSkinGrid();
    this.updateWardrobeButtons();
    if (slot && slot.id === 'nghi') {
      this.showToast('Ngô Nhất Nghị mặc định đã khoác Lam Võ Phục Vovinam Chính Thống 🥋');
    } else {
      this.showToast(skinType === 'vovinam' ? 'Đã trang bị: Võ Phục Vovinam Chính Thống 🥋' : 'Đã trang bị: Trang Phục Mặc Định 👘');
    }
  }

  updateWardrobeButtons() {
    const slot = CHAR_SLOTS.find(s => s.id === this.selectedChar) || CHAR_SLOTS[0];
    const isNghi = slot && slot.id === 'nghi';
    const isVovinam = !isNghi && window.saveManager && typeof window.saveManager.isSkinEquipped === 'function' && window.saveManager.isSkinEquipped(this.selectedChar, 'vovinam');
    const defBtn = document.getElementById('btn-cs-skin-default');
    const vovBtn = document.getElementById('btn-cs-skin-vovinam');
    if (defBtn && vovBtn) {
      if (isNghi) {
        defBtn.textContent = 'Lam Võ Phục Vovinam (Mặc Định) 🥋';
        defBtn.classList.add('active');
        vovBtn.classList.remove('active');
        vovBtn.classList.add('hidden');
      } else {
        defBtn.textContent = 'Mặc Định';
        vovBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
        if (isVovinam) {
          defBtn.classList.remove('active');
          vovBtn.classList.add('active');
        } else {
          defBtn.classList.add('active');
          vovBtn.classList.remove('active');
        }
      }
    }

    const skins = slot ? this.getSkinsForChar(slot) : [];
    const activeSkin = skins.find(s => s.id === (isVovinam ? 'vovinam' : 'default')) || skins[0];

    const skinCountBadge = document.getElementById('cs-tab-skin-count');
    if (skinCountBadge) {
      skinCountBadge.textContent = String(skins.length);
    }

    const tierTag = document.getElementById('cs-skin-tier-tag');
    const stageName = document.getElementById('cs-skin-stage-name');
    if (tierTag && activeSkin) {
      tierTag.textContent = activeSkin.tier;
      tierTag.classList.toggle('vovinam-tier', isVovinam || isNghi);
    }
    if (stageName && activeSkin) {
      stageName.textContent = activeSkin.name.toUpperCase();
    }

    // Cập nhật hình vẽ minh họa toàn thân (#cs-hero-img) và Võ Đài 3D (#cs-hero-skin-canvas)
    const heroImg = document.getElementById('cs-hero-img');
    const skinCanvas = document.getElementById('cs-hero-skin-canvas');
    const demoBtn = document.getElementById('btn-cs-demo-move');
    const viewToggleBtn = document.getElementById('btn-cs-view-toggle');
    const targetHeroImg = activeSkin && activeSkin.image ? activeSkin.image : (slot ? slot.image : '');

    if (demoBtn) {
      demoBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
    }
    if (viewToggleBtn) {
      viewToggleBtn.classList.toggle('hidden', !slot || !!slot.isLocked);
      viewToggleBtn.textContent = this._csLiveStageActive ? '🎨 TRANH NGHỆ THUẬT' : '⚡ VÕ ĐÀI 3D';
    }
    if (skinCanvas && heroImg) {
      if (this._csLiveStageActive) {
        skinCanvas.classList.remove('hidden');
        heroImg.style.display = 'none';
      } else {
        skinCanvas.classList.add('hidden');
        if (targetHeroImg) {
          heroImg.style.display = 'block';
          heroImg.style.opacity = '1';
          if (heroImg.dataset.currentSrc !== targetHeroImg) {
            heroImg.src = targetHeroImg;
            heroImg.dataset.currentSrc = targetHeroImg;
          }
        } else {
          heroImg.style.display = 'none';
        }
      }
    }
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

  // --------------------------------------------------------------------------
  // TÙY CHỈNH PHÍM BẤM (CUSTOM KEYBINDINGS)
  // --------------------------------------------------------------------------
  showKeybindings() {
    const modal = document.getElementById('keybindings-modal');
    const container = document.getElementById('keybindings-container');
    if (!modal || !container || !window.input) return;

    const ACTION_NAMES = {
      punch:     { name: 'Đấm thường', desc: 'Chuỗi đòn tay Vovinam liên hoàn' },
      kick:      { name: 'Đòn đá', desc: 'Đá tạt, đá quét, đá bay' },
      block:     { name: 'Thủ thế / Đỡ đòn', desc: 'Giữ thế thủ, giảm sát thương' },
      dodge:     { name: 'Thân pháp Né', desc: 'Lướt né tránh né đòn tức thì' },
      ultimate:  { name: 'Tuyệt kỹ Vovinam', desc: 'Long Hổ Xuất Sơn (khi nạp đầy)' },
      jump:      { name: 'Nhảy cao', desc: 'Bật nhảy né đòn / phi thân' },
      interact:  { name: 'Nhặt vũ khí', desc: 'Tương tác nhặt Côn / Mã tấu rơi' },
      support:   { name: 'Gọi đồng minh', desc: 'Chi viện liên kích hỗ trợ' },
      run:       { name: 'Chạy / Lướt nhanh', desc: 'Giữ phím để chạy áp sát' },
      up:        { name: 'Đi lên (Làn sâu)', desc: 'Chuyển làn chiều sâu sân khấu' },
      down:      { name: 'Đi xuống (Làn trước)', desc: 'Chuyển làn hướng ra trước' },
      left:      { name: 'Sang trái', desc: 'Di chuyển lùi / tiến' },
      right:     { name: 'Sang phải', desc: 'Di chuyển tiến / lùi' }
    };

    container.innerHTML = '';
    const bindings = window.input.bindings;

    let activeListeningBtn = null;
    let activeAction = null;

    const stopListening = () => {
      if (activeListeningBtn) {
        activeListeningBtn.classList.remove('listening');
        const code = bindings[activeAction];
        activeListeningBtn.textContent = window.input.formatKeyName(code);
        activeListeningBtn = null;
        activeAction = null;
      }
    };

    const onKeydownRemap = (e) => {
      if (!activeAction || !activeListeningBtn) return;
      e.preventDefault();
      e.stopPropagation();

      const newCode = e.code;
      if (newCode === 'Escape') {
        stopListening();
        window.removeEventListener('keydown', onKeydownRemap, true);
        return;
      }

      window.input.setBinding(activeAction, newCode);
      activeListeningBtn.textContent = window.input.formatKeyName(newCode);
      activeListeningBtn.classList.remove('listening');
      activeListeningBtn = null;
      activeAction = null;
      window.removeEventListener('keydown', onKeydownRemap, true);
    };

    Object.keys(ACTION_NAMES).forEach(action => {
      const info = ACTION_NAMES[action];
      const curCode = bindings[action] || '';
      const row = document.createElement('div');
      row.className = 'keybind-row';
      row.innerHTML = `
        <div class="keybind-label">
          <span class="keybind-name">${info.name}</span>
          <span class="keybind-desc">${info.desc}</span>
        </div>
        <button class="keybind-btn" data-action="${action}">${window.input.formatKeyName(curCode)}</button>
      `;

      const btn = row.querySelector('.keybind-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeListeningBtn === btn) {
          stopListening();
          window.removeEventListener('keydown', onKeydownRemap, true);
          return;
        }
        stopListening();
        activeListeningBtn = btn;
        activeAction = action;
        btn.classList.add('listening');
        btn.textContent = 'ẤN PHÍM...';
        window.addEventListener('keydown', onKeydownRemap, true);
      });

      container.appendChild(row);
    });

    modal.classList.remove('hidden');
  }

  hideKeybindings() {
    const modal = document.getElementById('keybindings-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --------------------------------------------------------------------------
  // CÀI ĐẶT
  // --------------------------------------------------------------------------
  showSettings() {
    const st = window.saveManager ? window.saveManager.data.settings : null;
    const music = document.getElementById('setting-music');
    const sfx = document.getElementById('setting-sfx');
    const mute = document.getElementById('setting-mute');
    if (st && music) music.value = Math.round((st.musicVolume ?? 0.45) * 100);
    if (st && sfx) sfx.value = Math.round((st.sfxVolume ?? 0.85) * 100);
    if (st && mute) mute.checked = !!st.muted;
    const reduceShake = document.getElementById('setting-reduce-shake');
    const reduceFlash = document.getElementById('setting-reduce-flash');
    const hideDmg = document.getElementById('setting-hide-dmg');
    if (reduceShake && window.fxSettings) reduceShake.checked = !!window.fxSettings.reduceShake;
    if (reduceFlash && window.fxSettings) reduceFlash.checked = !!window.fxSettings.reduceFlash;
    if (hideDmg && window.fxSettings) hideDmg.checked = !!window.fxSettings.hideDamageNumbers;
    const out = document.getElementById('save-summary');
    if (out && window.saveManager) {
      const d = window.saveManager.data;
      out.textContent = `Màn đã qua: ${d.completedStages.length} · Nhân vật mở: ${d.unlockedCharacters.length}/7 · ` +
        `Kết thúc: ${d.endings.length}/4 · Thành tích: ${d.achievements.length}/12`;
    }
    this.settingsModal.classList.remove('hidden');
  }

  // ==========================================================================
  // BIÊN NIÊN SỬ HỌ PHÓ — HỒ SƠ ĐIỀU TRA ĐA LỚP
  // ==========================================================================
  showChronicles(targetTab = 'docs') {
    if (!this.chroniclesModal) return;
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

const menuManager = new MenuManager();
window.menuManager = menuManager;
window.MenuManager = MenuManager;
