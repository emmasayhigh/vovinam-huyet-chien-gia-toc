/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/data/stages.js - Du lieu 20 man choi chia 5 Hoi (cu 3-4 man moi danh Boss).
 *
 * File nay chi chua du lieu. Logic quan ly nam o js/world/stageManager.js,
 * ve parallax nam o js/world/scenery.js (thong qua sceneryId).
 */

const STAGE_DEFINITIONS = {
  // ===========================================================================
  // HỒI I: ĐÊM HẮC LANG & KHO NGẦM (Màn 1-3 đi cảnh cốt truyện, Màn 4 Boss Long Vương, Màn 5 Phụ Thoát Hiểm)
  // ===========================================================================
  1: {
    id: 1,
    sceneryId: 1,
    title: 'MÀN 1: CON HẺM MƯA ĐỎ',
    subtitle: 'Cửa ngõ khu hẻm ngầm đô thị lúc nửa đêm',
    objective: 'QUÉT SẠCH LÍNH TUẦN TRA & LẤY BẢN ĐỒ KHO NGẦM',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#080811', mid: '#141724', ground: '#181a22', neon: '#ff2a4b' },
    waves: [
      {
        spawnX: 760,
        enemies: [
          { type: 'thug', count: 2, spacing: 95, faction: 'huavudai' },
          { type: 'baton', count: 1, spacing: 110, faction: 'huavudai' }
        ]
      },
      {
        spawnX: 1420,
        enemies: [
          { type: 'baton', count: 1, spacing: 95, faction: 'huavudai' },
          { type: 'thrower', count: 1, spacing: 130, faction: 'huavudai' },
          { type: 'brawler', count: 1, spacing: 105, faction: 'huavudai' }
        ],
        reinforcements: [
          {
            id: 's1_w2_reinforce',
            trigger: 'enemies_remaining',
            threshold: 1,
            bannerText: 'ĐỘI TUẦN TRA ĐẦU NGÕ CHI VIỆN!',
            enemies: [
              { type: 'blade', count: 1, spacing: 95, faction: 'huavudai' },
              { type: 'thug', count: 1, spacing: 95, faction: 'huavudai' }
            ]
          }
        ]
      },
      {
        spawnX: 2050,
        enemies: [
          { type: 'blade', count: 1, spacing: 95, faction: 'huavudai' },
          { type: 'shield', count: 1, spacing: 120, faction: 'huavudai' },
          { type: 'thrower', count: 1, spacing: 140, faction: 'huavudai' }
        ]
      }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Tin nhắn cầu cứu của Hứa Vũ Đại phát đi từ khu hẻm mưa đỏ này. Cả mạng lưới ngầm đều bị phong tỏa.'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Không có tiếp viện. Phải dọn sạch tuyến tuần tra cửa ngõ trước khi tiến vào nhà kho chính!'
      }
    ]
  },

  2: {
    id: 2,
    sceneryId: 2,
    timeLimit: 95,
    title: 'MÀN 2: ĐỘT KÍCH NHÀ KHO THÉP',
    subtitle: 'Kho vận container công nghiệp ven cảng',
    objective: 'PHÁ PHÒNG TUYẾN TRƯỚC KHI CONTAINER RỜI CẢNG (95S)',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#0a0f18', mid: '#192338', ground: '#1d222e', neon: '#ffd700' },
    waves: [
      {
        spawnX: 750,
        enemies: [
          { type: 'armored', count: 1, spacing: 110, faction: 'general' },
          { type: 'baton', count: 2, spacing: 95, faction: 'general' }
        ]
      },
      {
        spawnX: 1420,
        enemies: [
          { type: 'shield', count: 1, spacing: 105, faction: 'general' },
          { type: 'blade', count: 1, spacing: 95, faction: 'general' },
          { type: 'thrower', count: 1, spacing: 135, faction: 'general' }
        ],
        reinforcements: [
          {
            id: 's2_w2_reinforce',
            trigger: 'enemies_remaining',
            threshold: 1,
            bannerText: 'TOÁN HỘ VỆ KHO CONTAINER XUẤT HIỆN!',
            enemies: [
              { type: 'armored', count: 1, spacing: 105, faction: 'general' }
            ]
          }
        ]
      },
      {
        spawnX: 2080,
        enemies: [
          { type: 'armored', count: 1, spacing: 110, faction: 'general' },
          { type: 'brawler', count: 2, spacing: 95, faction: 'general' }
        ]
      }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Những thùng container mang ký hiệu Triệu gia đã bị cạo số seri... Vụ bắt cóc này không phải cướp bóc tầm thường.'
      }
    ]
  },

  3: {
    id: 3,
    sceneryId: 3,
    title: 'MÀN 3: HÀNH LANG TỬ THỦ',
    subtitle: 'Boongke bê tông sâu dưới khu công nghiệp',
    objective: 'XUYÊN THỦNG HÀNH LANG XÍCH TỎA & ĐOẠT LỆNH KHAI TRỪ',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#110508', mid: '#2b0b12', ground: '#1f1416', neon: '#ff0055' },
    waves: [
      {
        spawnX: 780,
        enemies: [
          { type: 'blade', count: 1, spacing: 95, faction: 'ngo' },
          { type: 'grabber', count: 1, spacing: 125, faction: 'ngo' },
          { type: 'dodger', count: 1, spacing: 105, faction: 'ngo' }
        ]
      },
      {
        spawnX: 1460,
        dialogue: [
          {
            speaker: 'HỨA VŨ ĐẠI',
            role: 'ÔNG TRÙM ÁM KHÍ',
            avatar: 'huavudai',
            text: 'Ngô Nhất Nghị, ngươi tưởng xuyên qua được hành lang xích tỏa này sao? Phong tỏa toàn bộ cửa thép cho ta!'
          }
        ],
        enemies: [
          { type: 'grabber', count: 1, spacing: 115, faction: 'ngo' },
          { type: 'medic', count: 1, spacing: 145, faction: 'ngo' },
          { type: 'blade', count: 1, spacing: 95, faction: 'ngo' }
        ],
        reinforcements: [
          {
            id: 's3_w2_reinforce',
            trigger: 'enemies_remaining',
            threshold: 1,
            bannerText: 'SÁT THỦ PHÒNG TUYẾN CUỐI ĐÃ ÁP SÁT!',
            enemies: [
              { type: 'dodger', count: 2, spacing: 95, faction: 'ngo' }
            ]
          }
        ]
      },
      {
        spawnX: 2120,
        enemies: [
          { type: 'shield', count: 1, spacing: 115, faction: 'ngo' },
          { type: 'armored', count: 1, spacing: 110, faction: 'ngo' },
          { type: 'grabber', count: 1, spacing: 120, faction: 'ngo' }
        ]
      }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Hành lang hẹp dẫn thẳng tới phòng giao dịch. Phía sau cánh cửa thép kia là Hứa Vũ Đại và kẻ chủ mưu thật sự.'
      }
    ]
  },

  4: {
    id: 4,
    sceneryId: 4,
    title: 'MÀN 4: PHÒNG GIAO DỊCH NGẦM',
    subtitle: 'Sào huyệt tối thượng của Long Vương',
    objective: 'QUYẾT ĐẤU BOSS LONG VƯƠNG VÀ GIẢI CỨU HỨA VŨ ĐẠI',
    bossClass: window.BossLongVuong,
    bossName: 'LONG VƯƠNG',
    bossTitle: 'ÔNG TRÙM TỐI THƯỢNG',
    palette: { sky: '#120f08', mid: '#2b2312', ground: '#241e17', neon: '#ffd700' },
    waves: [
      {
        spawnX: 850,
        enemies: [
          { type: 'shield', count: 1, spacing: 100, faction: 'trieu' },
          { type: 'armored', count: 1, spacing: 90, faction: 'trieu' },
          { type: 'thrower', count: 1, spacing: 120, faction: 'trieu' }
        ]
      },
      {
        spawnX: 1600,
        enemies: [
          { type: 'shield', count: 1, spacing: 90, faction: 'trieu' },
          { type: 'medic', count: 1, spacing: 130, faction: 'trieu' },
          { type: 'brawler', count: 1, spacing: 90, faction: 'trieu' }
        ]
      },
      {
        spawnX: 2100,
        isBossWave: true,
        bossType: 'longvuong',
        enemies: []
      }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Kia rồi! Hứa Vũ Đại đang bị trói trong lồng sắt giữa phòng giao dịch!'
      },
      {
        speaker: 'HỨA VŨ ĐẠI',
        role: 'ÔNG TRÙM BỊ GIAM GIỮ',
        avatar: 'huavudai',
        text: 'Nghị... cẩn thận! Long Vương đang giữ két sắt hồ sơ. Hạ gục hắn trước khi viện binh Triệu gia tràn tới!'
      }
    ],
    bossDialogue: [
      {
        speaker: 'LONG VƯƠNG',
        role: 'ÔNG TRÙM TỐI THƯỢNG',
        avatar: 'longvuong',
        text: 'Ngô Nhất Nghị! Ngươi vượt qua ba lớp phòng thủ của ta cũng khá đấy, nhưng Long Quyền sẽ chấm dứt bước chân ngươi tại đây!'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Nói ít thôi. VIỆT VÕ ĐẠO — XUẤT TRẬN!'
      }
    ],
    unlockChar: 'huavudai',
    postChoice: 'rescue'
  },

  5: {
    id: 5,
    sceneryId: 5,
    title: 'MÀN PHỤ: CHẠY TRỐN HẦM NGẦM',
    subtitle: 'Hứa Vũ Đại tự mình mở đường thoát',
    objective: 'CHẠY TỚI CỬA THOÁT — ĐỪNG ĐỂ BỊ BẮT LẠI!',
    escape: true,
    forcedCharacter: 'huavudai',
    exitX: 2380,
    bossClass: null,
    bossName: null,
    bossTitle: null,
    chaserInterval: 4.5,
    palette: { sky: '#0a0608', mid: '#241119', ground: '#1a1418', neon: '#ff4a4a' },
    waves: [
      { spawnX: 680, enemies: [{ type: 'baton', count: 1, spacing: 90, faction: 'trieu' }, { type: 'thug', count: 1, spacing: 95, faction: 'trieu' }] },
      { spawnX: 1320, enemies: [{ type: 'dodger', count: 1, spacing: 100, faction: 'trieu' }, { type: 'grabber', count: 1, spacing: 115, faction: 'trieu' }] },
      { spawnX: 1950, enemies: [{ type: 'blade', count: 1, spacing: 90, faction: 'trieu' }, { type: 'shield', count: 1, spacing: 120, faction: 'trieu' }] }
    ],
    introDialogue: [
      {
        speaker: 'HỨA VŨ ĐẠI',
        role: 'ÔNG TRÙM MẠNG LƯỚI NGẦM',
        avatar: 'huavudai',
        text: 'Nghị vừa mở đường máu cho tôi. Chỉ cần mang được chiếc phong bì trong áo vest thoát khỏi hầm này!'
      }
    ]
  },

  // ===========================================================================
  // HỒI II: BẾN CẢNG TÂY HỒ & HỒ SƠ M&A (Màn 6-8 trinh sát/phá bến, Màn 9 Boss Đình Bích Lâm)
  // ===========================================================================
  6: {
    id: 6,
    sceneryId: 1,
    title: 'MÀN 6: PHỐ ĐÊM HÀNG CHÂU',
    subtitle: 'Khu phố cũ ven hồ phủ sương Hàng Châu',
    objective: 'DẸP TOÁN ÁO ĐEN BẾN CẢNG ĐỂ LẦN DẤU SỔ LIÊN LẠC',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#04120e', mid: '#0e241d', ground: '#111e1a', neon: '#34d399' },
    waves: [
      { spawnX: 740, enemies: [{ type: 'thug', count: 2, spacing: 95, faction: 'bichlam' }, { type: 'thrower', count: 1, spacing: 125, faction: 'bichlam' }] },
      { spawnX: 1420, enemies: [{ type: 'brawler', count: 2, spacing: 100, faction: 'bichlam' }, { type: 'baton', count: 1, spacing: 95, faction: 'bichlam' }] },
      { spawnX: 2050, enemies: [{ type: 'dodger', count: 1, spacing: 95, faction: 'bichlam' }, { type: 'blade', count: 1, spacing: 100, faction: 'bichlam' }, { type: 'medic', count: 1, spacing: 140, faction: 'bichlam' }] }
    ],
    introDialogue: [
      {
        speaker: 'PHÓ MỘC ĐĂNG',
        role: 'CHỦ GIA TỘC HỌ PHÓ',
        avatar: 'mocdang',
        text: 'Danh sách liên hệ dẫn thẳng tới Hàng Châu. Đình Bích Lâm — bạn sinh tử của em hai Văn Anh — đang giữ phần bản sao bị cắt.'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Trước khi gặp được Bích Lâm, phải dọn sạch lũ tay chân đang canh gác dọc con phố đêm này đã.'
      }
    ]
  },

  7: {
    id: 7,
    sceneryId: 6,
    storyAlly: 'bichlam',
    title: 'MÀN 7: TRẠI CÁ KOI THIÊN TRÌ',
    subtitle: 'Thiên Trì Thủy Các — Lãnh địa trung lập họ Đinh',
    objective: 'CÙNG ĐÌNH BÍCH LÂM ĐẨY LÙI ĐẶC VỤ & THU BIÊN BẢN THẨM MẬT',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#051614', mid: '#0d2e29', ground: '#112420', neon: '#2dd4bf' },
    waves: [
      { spawnX: 760, enemies: [{ type: 'brawler', count: 2, spacing: 100, faction: 'bichlam' }, { type: 'baton', count: 1, spacing: 95, faction: 'bichlam' }] },
      {
        spawnX: 1450,
        dialogue: [
          {
            speaker: 'ĐÌNH BÍCH LÂM',
            role: 'ĐẶC VỤ TÂY HỒ',
            avatar: 'bichlam',
            text: 'Bọn Triệu gia dám đánh vào tận trại cá của ta! Đứng sau lưng ta, để ta mở đường thủy chiến cho cậu!'
          }
        ],
        enemies: [{ type: 'blade', count: 1, spacing: 95, faction: 'trieu' }, { type: 'grabber', count: 1, spacing: 120, faction: 'trieu' }, { type: 'thrower', count: 1, spacing: 135, faction: 'trieu' }],
        reinforcements: [{ id: 's7_w2_reinf', trigger: 'enemies_remaining', threshold: 1, bannerText: 'ĐẶC VỤ NGẦM TÂY HỒ TẬP KÍCH!', enemies: [{ type: 'dodger', count: 1, spacing: 95, faction: 'trieu' }] }]
      },
      { spawnX: 2080, enemies: [{ type: 'armored', count: 1, spacing: 110, faction: 'trieu' }, { type: 'medic', count: 1, spacing: 135, faction: 'trieu' }, { type: 'blade', count: 1, spacing: 95, faction: 'trieu' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Trại cá Koi bên bờ Tây Hồ... Có kẻ vừa phá hồ cá và truy tìm Biên Bản Thẩm Mật trước khi ta kịp tới.'
      }
    ]
  },

  8: {
    id: 8,
    sceneryId: 2,
    title: 'MÀN 8: XƯỞNG ĐÓNG TÀU CỔ',
    subtitle: 'Khu bến gỗ và cầu trục ven sông Tiền Đường',
    objective: 'CẮT ĐỨT TUYẾN TIẾP TẾ & MỞ LỐI TỚI BẾN CẢNG HẠ TẦNG',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#071412', mid: '#122c28', ground: '#162420', neon: '#4ade80' },
    waves: [
      { spawnX: 750, enemies: [{ type: 'shield', count: 1, spacing: 105, faction: 'bichlam' }, { type: 'brawler', count: 2, spacing: 95, faction: 'bichlam' }] },
      { spawnX: 1420, enemies: [{ type: 'armored', count: 1, spacing: 110, faction: 'bichlam' }, { type: 'thrower', count: 2, spacing: 120, faction: 'bichlam' }] },
      { spawnX: 2100, enemies: [{ type: 'shield', count: 1, spacing: 110, faction: 'bichlam' }, { type: 'blade', count: 2, spacing: 95, faction: 'bichlam' }, { type: 'medic', count: 1, spacing: 140, faction: 'bichlam' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Xưởng tàu cũ là hàng rào bảo vệ cuối cùng của Đình Bích Lâm. Phá xong chỗ này, anh ta sẽ buộc phải lộ mặt.'
      }
    ]
  },

  9: {
    id: 9,
    sceneryId: 6,
    title: 'MÀN 9: BẾN CẢNG HẠ TẦNG',
    subtitle: 'Bến cảng chính nơi du hiệp ngang tàng ngự trị',
    objective: 'BOSS HỒI II — ĐỐI ĐẦU ĐÌNH BÍCH LÂM & LẬP HIỆP ƯỚC HỒ SƠ',
    bossClass: window.BossBichlam,
    bossName: 'ĐÌNH BÍCH LÂM',
    bossTitle: 'ĐỒNG MINH NGANG TÀNG',
    unlockChar: 'bichlam',
    palette: { sky: '#04120e', mid: '#0f2a20', ground: '#12211c', neon: '#4ade80' },
    waves: [
      { spawnX: 740, enemies: [{ type: 'brawler', count: 2, spacing: 95, faction: 'bichlam' }, { type: 'thrower', count: 1, spacing: 130, faction: 'bichlam' }] },
      { spawnX: 1420, enemies: [{ type: 'brawler', count: 1, spacing: 95, faction: 'bichlam' }, { type: 'medic', count: 1, spacing: 135, faction: 'bichlam' }, { type: 'shield', count: 1, spacing: 110, faction: 'bichlam' }] },
      { spawnX: 2080, isBossWave: true, bossType: 'bichlam', enemies: [] }
    ],
    introDialogue: [
      {
        speaker: 'ĐÌNH BÍCH LÂM',
        role: 'NHỊ GIA HỌ ĐINH',
        avatar: 'bichlam',
        text: 'Ngô Nhất Nghị hả? Dẹp sạch mấy chốt ngoài kia rồi thì bước vào đây — để tôi xem nắm đấm Vovinam của anh đáng giá mấy lượng!'
      }
    ],
    bossDialogue: [
      {
        speaker: 'ĐÌNH BÍCH LÂM',
        role: 'ĐỒNG MINH NGANG TÀNG',
        avatar: 'bichlam',
        text: 'Tôi khinh nhất lũ tiểu nhân núp bóng hào môn! Hạ được tôi xuống dưới 30% sức thì tôi mới đưa mảnh hồ sơ còn lại cho anh!'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Được. Nếu nắm đấm đủ nặng để mở miệng anh — tôi nhận lời!'
      }
    ]
  },

  // ===========================================================================
  // HỒI III: VẾT MÁU HẮC LONG GIANG (Màn 10-12 trinh sát & hành lang máy chủ, Màn 13 Boss Phó Dung Hải)
  // ===========================================================================
  10: {
    id: 10,
    sceneryId: 7,
    title: 'MÀN 10: GA TÀU NGẦM BỎ HOANG',
    subtitle: 'Đường ray ngầm nối về tuyết phủ Hắc Long Giang',
    objective: 'PHÁ Ổ PHỤC KÍCH XÍCH TỎA & LẦN THEO DẤU PHÓ DUNG HẢI',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#070a12', mid: '#141c2b', ground: '#151b24', neon: '#00d2ff' },
    waves: [
      { spawnX: 740, enemies: [{ type: 'dodger', count: 2, spacing: 95, faction: 'pho' }, { type: 'grabber', count: 1, spacing: 120, faction: 'pho' }] },
      { spawnX: 1420, enemies: [{ type: 'blade', count: 2, spacing: 95, faction: 'pho' }, { type: 'thrower', count: 1, spacing: 130, faction: 'pho' }] },
      { spawnX: 2080, enemies: [{ type: 'armored', count: 1, spacing: 110, faction: 'pho' }, { type: 'dodger', count: 1, spacing: 95, faction: 'pho' }, { type: 'grabber', count: 1, spacing: 120, faction: 'pho' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Mảnh danh sách của Bích Lâm dẫn thẳng tới ga ngầm bỏ hoang này — nơi Dung Hải từng bị lưu đày suốt 7 năm.'
      }
    ]
  },

  11: {
    id: 11,
    sceneryId: 3,
    title: 'MÀN 11: HÀNH LANG MÁY CHỦ',
    subtitle: 'Tầng dữ liệu Lục Gia Chủy — Kho lưu trữ tuyệt mật',
    objective: 'ĐOẠT ĐOẠN GHI ÂM TẦN SỐ RIÊNG CỦA PHÓ MỘC ĐĂNG',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#050b16', mid: '#0f203b', ground: '#101b29', neon: '#38bdf8' },
    waves: [
      { spawnX: 760, enemies: [{ type: 'shield', count: 1, spacing: 110, faction: 'pho' }, { type: 'armored', count: 1, spacing: 110, faction: 'pho' }, { type: 'baton', count: 1, spacing: 95, faction: 'pho' }] },
      {
        spawnX: 1460,
        dialogue: [
          {
            speaker: 'PHÓ MỘC ĐĂNG',
            role: 'KIẾN TRÚC SƯ EMP (GHI ÂM)',
            avatar: 'mocdang',
            text: '[File Ghi Âm #04] Nếu có ai nghe được đoạn băng này... Vụ thảm sát 20 năm trước không phải tai nạn.'
          }
        ],
        enemies: [{ type: 'medic', count: 1, spacing: 140, faction: 'pho' }, { type: 'dodger', count: 2, spacing: 95, faction: 'pho' }],
        reinforcements: [{ id: 's11_w2_reinf', trigger: 'enemies_remaining', threshold: 1, bannerText: 'ĐỘI THANH TRỪNG LỤC GIA CHỦY TỚI NƠI!', enemies: [{ type: 'blade', count: 2, spacing: 95, faction: 'pho' }] }]
      },
      { spawnX: 2100, enemies: [{ type: 'shield', count: 1, spacing: 110, faction: 'pho' }, { type: 'armored', count: 1, spacing: 110, faction: 'pho' }, { type: 'grabber', count: 1, spacing: 120, faction: 'pho' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Hệ thống máy chủ của Mộc Đăng có một đoạn ghi âm bị khóa tầng số. Phải lấy được nó trước khi gặp Dung Hải!'
      }
    ]
  },

  12: {
    id: 12,
    sceneryId: 7,
    timeLimit: 85,
    title: 'MÀN 12: TẦNG HẦM XÍCH TỎA',
    subtitle: 'Đường ống ngầm trước cửa Trạm Sát Thủ',
    objective: 'PHÁ VÂY TRONG 85S TRƯỚC KHI CỬA HẦM SẬP KHÓA',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#080b12', mid: '#16202f', ground: '#151c26', neon: '#22d3ee' },
    waves: [
      { spawnX: 750, enemies: [{ type: 'grabber', count: 2, spacing: 115, faction: 'ngo' }, { type: 'blade', count: 1, spacing: 95, faction: 'ngo' }] },
      { spawnX: 1420, enemies: [{ type: 'dodger', count: 2, spacing: 95, faction: 'ngo' }, { type: 'medic', count: 1, spacing: 140, faction: 'ngo' }, { type: 'thrower', count: 1, spacing: 130, faction: 'ngo' }] },
      { spawnX: 2100, enemies: [{ type: 'armored', count: 2, spacing: 110, faction: 'ngo' }, { type: 'blade', count: 1, spacing: 95, faction: 'ngo' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Cả hai bên đều đang siết chặt vòng vây quanh Dung Hải. Hắn chắc chắn giữ bí mật sống còn của gia tộc.'
      }
    ]
  },

  13: {
    id: 13,
    sceneryId: 7,
    title: 'MÀN 13: TRẠM SÁT THỦ NGẦM',
    subtitle: 'Trung tâm điều phối ẩn của Phó Dung Hải',
    objective: 'BOSS HỒI III — ĐỐI CHẤT 3 NGẢ & THU PHỤC PHÓ DUNG HẢI',
    bossClass: window.BossDungHai,
    bossName: 'PHÓ DUNG HẢI',
    bossTitle: 'KẺ BỊ KHAI TRỪ',
    unlockChar: 'dunghai',
    palette: { sky: '#080b12', mid: '#16202f', ground: '#151c26', neon: '#00d2ff' },
    waves: [
      { spawnX: 720, enemies: [{ type: 'dodger', count: 1, spacing: 95, faction: 'pho' }, { type: 'grabber', count: 1, spacing: 120, faction: 'pho' }, { type: 'thrower', count: 1, spacing: 130, faction: 'pho' }] },
      { spawnX: 1400, enemies: [{ type: 'armored', count: 1, spacing: 110, faction: 'pho' }, { type: 'blade', count: 1, spacing: 95, faction: 'pho' }, { type: 'medic', count: 1, spacing: 140, faction: 'pho' }] },
      { spawnX: 2100, isBossWave: true, bossType: 'dunghai', enemies: [] }
    ],
    introDialogue: [
      {
        speaker: 'PHÓ MỘC ĐĂNG',
        role: 'CHỦ GIA TỘC HỌ PHÓ',
        avatar: 'mocdang',
        text: 'Dung Hải đang ở phòng trong. Đừng để lời ngụy biện của kẻ phản bội làm lung lay cậu, Nghị!'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Tôi sẽ tự nghe bằng tai mình — sau khi kiểm chứng băng ghi âm vừa lấy ở Lục Gia Chủy.'
      }
    ],
    bossDialogue: [
      {
        speaker: 'PHÓ DUNG HẢI',
        role: 'KẺ BỊ KHAI TRỪ',
        avatar: 'dunghai',
        text: 'Lại là cậu à, Nghị? Hứa Vũ Đại và Mộc Đăng bắt tay gán tội cho tôi 7 năm trước — cậu có dám nghe nốt sự thật không?'
      }
    ]
  },

  // ===========================================================================
  // HỒI IV: THẬP VẠN ĐẠI SƠN & ĐẠI ĐIỆN TRIỆU GIA (Màn 14-16 leo núi & phá thành, Màn 17 Boss Triệu Vinh Tâm)
  // ===========================================================================
  14: {
    id: 14,
    sceneryId: 8,
    title: 'MÀN 14: CHÂN NÚI SƯƠNG LẠNH',
    subtitle: 'Cửa rừng đá Thập Vạn Đại Sơn biên giới Tây Nam',
    objective: 'ĐẨY LÙI LÍNH ĐÁNH THUÊ XÂM PHẠM MẠCH ĐẤT HIẾM',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#0c1518', mid: '#1e3038', ground: '#20262a', neon: '#f59e0b' },
    waves: [
      { spawnX: 740, enemies: [{ type: 'armored', count: 1, spacing: 110, faction: 'trieu' }, { type: 'thrower', count: 2, spacing: 120, faction: 'trieu' }] },
      { spawnX: 1420, enemies: [{ type: 'shield', count: 1, spacing: 105, faction: 'trieu' }, { type: 'blade', count: 2, spacing: 95, faction: 'trieu' }, { type: 'medic', count: 1, spacing: 140, faction: 'trieu' }] },
      { spawnX: 2080, enemies: [{ type: 'armored', count: 2, spacing: 110, faction: 'trieu' }, { type: 'grabber', count: 1, spacing: 120, faction: 'trieu' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Thập Vạn Đại Sơn phủ sương trắng xóa... Lính đánh thuê của Triệu gia đã dựng trạm khoan ngay dưới chân núi.'
      }
    ]
  },

  15: {
    id: 15,
    sceneryId: 8,
    storyAlly: 'hoanganh',
    title: 'MÀN 15: THÔN CỔ SƠN CƯỚC',
    subtitle: 'Bản làng ẩn sĩ do Phó Đặng Hoàng Anh bảo hộ',
    objective: 'CÙNG HOÀNG ANH GIẢI VÂY THÔN CỔ & MỞ KHÓA HOÀNG ANH',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    unlockChar: 'hoanganh',
    postChoice: 'mountain',
    palette: { sky: '#101820', mid: '#263844', ground: '#23282d', neon: '#fbbf24' },
    waves: [
      { spawnX: 760, enemies: [{ type: 'brawler', count: 2, spacing: 95, faction: 'trieu' }, { type: 'shield', count: 1, spacing: 110, faction: 'trieu' }] },
      {
        spawnX: 1450,
        dialogue: [
          {
            speaker: 'PHÓ ĐẶNG HOÀNG ANH',
            role: 'THẦN BINH ĐẠI NGÀN',
            avatar: 'hoanganh',
            text: 'Lôi Cước Trấn Sơn sẽ giữ sườn trái cho cậu — tiến thẳng vào doanh trại cận vệ Triệu gia đi!'
          }
        ],
        enemies: [{ type: 'armored', count: 1, spacing: 110, faction: 'trieu' }, { type: 'dodger', count: 2, spacing: 95, faction: 'trieu' }, { type: 'thrower', count: 1, spacing: 130, faction: 'trieu' }],
        reinforcements: [{ id: 's15_w2_reinf', trigger: 'enemies_remaining', threshold: 1, bannerText: 'ĐỘI CẬN VỆ TRIỆU GIA ĐỔ BỘ!', enemies: [{ type: 'medic', count: 1, spacing: 130, faction: 'trieu' }, { type: 'armored', count: 1, spacing: 110, faction: 'trieu' }] }]
      },
      { spawnX: 2100, enemies: [{ type: 'shield', count: 2, spacing: 110, faction: 'trieu' }, { type: 'blade', count: 2, spacing: 95, faction: 'trieu' }] }
    ],
    introDialogue: [
      {
        speaker: 'PHÓ ĐẶNG HOÀNG ANH',
        role: 'THẦN BINH ĐẠI NGÀN',
        avatar: 'hoanganh',
        text: 'Cậu là Ngô Nhất Nghị? Thay vì đối đầu nhau vô ích, hãy giúp ta giữ thôn cổ này — xong trận ta sẽ trao cậu Di Chúc Thập Vạn Đại Sơn!'
      }
    ]
  },

  16: {
    id: 16,
    sceneryId: 9,
    storyAlly: 'dinhan',
    title: 'MÀN 16: NGOẠI THÀNH TRIỆU GIA',
    subtitle: 'Tường thành đá đen phủ cờ vàng — Bắc Kinh',
    objective: 'CÙNG TRIỆU ĐÌNH AN PHÁ ĐỘI KHIÊN KIM CƯƠNG & MỞ KHÓA ĐÌNH AN',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    unlockChar: 'dinhan',
    palette: { sky: '#140c08', mid: '#301d12', ground: '#241a14', neon: '#f59e0b' },
    waves: [
      { spawnX: 760, enemies: [{ type: 'shield', count: 2, spacing: 110, faction: 'trieu' }, { type: 'baton', count: 1, spacing: 95, faction: 'trieu' }] },
      { spawnX: 1450, enemies: [{ type: 'armored', count: 2, spacing: 110, faction: 'trieu' }, { type: 'thrower', count: 1, spacing: 130, faction: 'trieu' }, { type: 'medic', count: 1, spacing: 140, faction: 'trieu' }] },
      { spawnX: 2100, enemies: [{ type: 'shield', count: 2, spacing: 115, faction: 'trieu' }, { type: 'grabber', count: 1, spacing: 120, faction: 'trieu' }, { type: 'blade', count: 1, spacing: 95, faction: 'trieu' }] }
    ],
    introDialogue: [
      {
        speaker: 'TRIỆU ĐÌNH AN',
        role: 'NHỊ GIA TRIỆU GIA',
        avatar: 'dinhan',
        text: 'Anh cả Triệu Vinh Tâm đã điên loạn vì quyền lực rồi. Vượt qua đội Khiên Thành này, tôi sẽ mở đường cho anh vào Đại Điện!'
      }
    ]
  },

  17: {
    id: 17,
    sceneryId: 10,
    title: 'MÀN 17: ĐẠI ĐIỆN TRIỆU GIA',
    subtitle: 'Đại sảnh hoàng kim uy nghi của cựu hoàng tộc',
    objective: 'BOSS HỒI IV — ĐÁNH BẠI TRIỆU VINH TÂM 3 GIAI ĐOẠN',
    bossClass: window.BossVinhTam,
    bossName: 'TRIỆU VINH TÂM',
    bossTitle: 'CHỦ GIA TỘC TRIỆU GIA',
    palette: { sky: '#181006', mid: '#3b250a', ground: '#291c0d', neon: '#facc15' },
    waves: [
      { spawnX: 760, enemies: [{ type: 'shield', count: 1, spacing: 110, faction: 'trieu' }, { type: 'armored', count: 1, spacing: 110, faction: 'trieu' }, { type: 'blade', count: 1, spacing: 95, faction: 'trieu' }] },
      { spawnX: 1420, enemies: [{ type: 'medic', count: 1, spacing: 140, faction: 'trieu' }, { type: 'grabber', count: 1, spacing: 120, faction: 'trieu' }, { type: 'brawler', count: 2, spacing: 95, faction: 'trieu' }] },
      { spawnX: 2120, isBossWave: true, bossType: 'vinhtam', enemies: [] }
    ],
    introDialogue: [
      {
        speaker: 'TRIỆU VINH TÂM',
        role: 'CHỦ GIA TỘC TRIỆU GIA',
        avatar: 'vinhtam',
        text: 'Các ngươi thực sự dám bước vào Đại Điện này sao? Hứa Vũ Đại, Phó Mộc Đăng — tất cả đều từng cúi đầu mua chuộc ta!'
      }
    ],
    bossDialogue: [
      {
        speaker: 'TRIỆU VINH TÂM',
        role: 'CHỦ GIA TỘC TRIỆU GIA',
        avatar: 'vinhtam',
        text: 'Chiếc tráp vàng sau lưng ta chứa Hạch Tâm Xích Huyết! Muốn lấy nó thì hãy bước qua Long Bào của ta!'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Âm mưu 7 năm kết thúc tại đây!'
      }
    ],
    postChoice: 'danghai'
  },

  // ===========================================================================
  // HỒI V: ĐOẠN NGHĨA ĐÀI TÔ CHÂU (Màn 18-19 vượt ải Tô Châu, Màn 20 Final Boss Ngô Giang Mạnh)
  // ===========================================================================
  18: {
    id: 18,
    sceneryId: 11,
    storyAlly: 'tiendang',
    title: 'MÀN 18: HOA VIÊN HỒ KIM KÊ',
    subtitle: 'Hoa viên cổ kính Tô Châu phủ tuyết đỏ dưới ánh trăng',
    objective: 'CÙNG PHÓ TIẾN ĐĂNG PHÁ TỨ TƯỢNG TRẬN TRONG ĐÊM BÃO TUYẾT',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#0b0812', mid: '#211930', ground: '#1a1724', neon: '#818cf8' },
    waves: [
      { spawnX: 760, enemies: [{ type: 'dodger', count: 2, spacing: 95, faction: 'ngo' }, { type: 'blade', count: 2, spacing: 95, faction: 'ngo' }] },
      {
        spawnX: 1450,
        dialogue: [
          {
            speaker: 'PHÓ TIẾN ĐĂNG',
            role: 'TÀN ẢNH LIÊN HOÀN',
            avatar: 'tiendang',
            text: 'Chú hai Mộc Đăng dặn tôi giữ hậu phương cho cậu tới Đoạn Nghĩa Đài! Để Tàn Ảnh quét sạch đám hộ vệ này!'
          }
        ],
        enemies: [{ type: 'armored', count: 1, spacing: 110, faction: 'ngo' }, { type: 'grabber', count: 2, spacing: 115, faction: 'ngo' }, { type: 'medic', count: 1, spacing: 140, faction: 'ngo' }]
      },
      { spawnX: 2100, enemies: [{ type: 'shield', count: 1, spacing: 110, faction: 'ngo' }, { type: 'dodger', count: 2, spacing: 95, faction: 'ngo' }, { type: 'brawler', count: 2, spacing: 95, faction: 'ngo' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Hoa viên Hồ Kim Kê — nơi tình nghĩa năm xưa giữa Phó Mộc Đăng và Ngô Giang Mạnh vỡ nát. Bão tuyết đang nổi lên...'
      }
    ]
  },

  19: {
    id: 19,
    sceneryId: 11,
    timeLimit: 105,
    hazardMode: 'fire_talismans',
    title: 'MÀN 19: ĐÀN TRÀNG BÙA NGẢI',
    subtitle: 'Bậc thềm đá cổ trước cửa Đoạn Nghĩa Đài',
    objective: 'NÉ BÙA HỎA THIÊU ĐỐT & PHÁ THỀM ĐÀI TRONG 105S',
    bossClass: null,
    bossName: null,
    bossTitle: null,
    palette: { sky: '#12070d', mid: '#29121e', ground: '#1e141c', neon: '#f43f5e' },
    waves: [
      { spawnX: 760, enemies: [{ type: 'blade', count: 2, spacing: 95, faction: 'ngo' }, { type: 'thrower', count: 2, spacing: 120, faction: 'ngo' }] },
      {
        spawnX: 1450,
        dialogue: [
          {
            speaker: 'CHÂU NGỌC THIÊN KHÁNH',
            role: 'TÀ ĐẠO KIẾM XU',
            avatar: 'thienkhanh',
            text: 'Cẩn thận bước chân đấy! Đàn tràng này đã trải Bùa Hỏa Thiêu Hồn — chậm một nhịp là hóa tro!'
          }
        ],
        enemies: [{ type: 'grabber', count: 2, spacing: 115, faction: 'ngo' }, { type: 'armored', count: 1, spacing: 110, faction: 'ngo' }, { type: 'medic', count: 1, spacing: 140, faction: 'ngo' }],
        reinforcements: [{ id: 's19_w2_reinf', trigger: 'enemies_remaining', threshold: 1, bannerText: 'TỬ SĨ HỌ NGÔ TRẤN THỀM ĐÀI!', enemies: [{ type: 'dodger', count: 2, spacing: 95, faction: 'ngo' }, { type: 'blade', count: 1, spacing: 95, faction: 'ngo' }] }]
      },
      { spawnX: 2120, enemies: [{ type: 'shield', count: 2, spacing: 110, faction: 'ngo' }, { type: 'armored', count: 1, spacing: 110, faction: 'ngo' }, { type: 'brawler', count: 2, spacing: 95, faction: 'ngo' }] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Chỉ còn bậc thềm này nữa là tới đỉnh Đoạn Nghĩa Đài. Toàn bộ chân tướng 20 năm sẽ kết thúc trong đêm nay!'
      }
    ]
  },

  20: {
    id: 20,
    sceneryId: 11,
    title: 'MÀN 20: ĐOẠN NGHĨA ĐÀI',
    subtitle: 'Đá, mưa, trăng đỏ — Nơi phân định mọi ân oán',
    objective: 'FINAL BOSS — ĐỐI THOẠI & QUYẾT ĐẤU CÙNG NGÔ GIANG MẠNH',
    bossClass: window.BossGiangManh,
    bossName: 'NGÔ GIANG MẠNH',
    bossTitle: 'CHỦ GIA TỘC HỌ NGÔ',
    unlockChar: 'giangmanh',
    finalStage: true,
    palette: { sky: '#08080d', mid: '#1f2230', ground: '#1a1b22', neon: '#7dd3fc' },
    waves: [
      { spawnX: 780, enemies: [{ type: 'dodger', count: 1, spacing: 95, faction: 'ngo' }, { type: 'blade', count: 1, spacing: 95, faction: 'ngo' }, { type: 'brawler', count: 1, spacing: 100, faction: 'ngo' }] },
      {
        spawnX: 1460,
        dialogue: [
          {
            speaker: 'NGÔ GIANG MẠNH',
            role: 'CHỦ GIA TỘC HỌ NGÔ',
            avatar: 'giangmanh',
            text: 'Hàn Băng Vệ, thử thách cuối cùng trước khi ta ra tay! Cho ta xem võ đạo của cậu sắc bén tới đâu.'
          }
        ],
        enemies: [{ type: 'armored', count: 1, spacing: 105, faction: 'ngo' }, { type: 'grabber', count: 1, spacing: 115, faction: 'ngo' }, { type: 'dodger', count: 1, spacing: 95, faction: 'ngo' }],
        reinforcements: [
          { id: 's20_w2_reinforce', trigger: 'enemies_remaining', threshold: 1, bannerText: 'HÀN BĂNG VỆ ĐOẠN NGHĨA ĐÀI!', enemies: [{ type: 'brawler', count: 1, spacing: 95, faction: 'ngo' }] }
        ]
      },
      { spawnX: 2150, isBossWave: true, bossType: 'giangmanh', enemies: [] }
    ],
    introDialogue: [
      {
        speaker: 'NGÔ GIANG MẠNH',
        role: 'CHỦ GIA TỘC HỌ NGÔ',
        avatar: 'giangmanh',
        text: 'Ngươi đã đi qua cả năm hồi máu lửa để đứng tới đây. Họ Phó dối trá, họ Triệu tham tàn — còn ngươi? Ngươi trung thành với ai?'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Tôi trung thành với sự thật tự tay mình kiểm chứng. Đêm nay tôi sẽ đối mặt với ông — bằng tay không này!'
      }
    ],
    bossDialogue: [
      {
        speaker: 'NGÔ GIANG MẠNH',
        role: 'CHỦ GIA TỘC HỌ NGÔ',
        avatar: 'giangmanh',
        text: 'Ta quan sát thói quen ra đòn của ngươi suốt cả đêm nay. Lặp lại chiêu thức là tự mở huyệt tử trước Hàn Băng Đao!'
      },
      {
        speaker: 'NGÔ NHẤT NGHỊ',
        role: 'SÁT THẦN VIỆT VÕ ĐẠO',
        avatar: 'nghi',
        text: 'Vậy thì hãy xem tinh hoa Vovinam biến hóa đến mức nào!'
      }
    ]
  }
};

window.STAGE_DEFINITIONS = STAGE_DEFINITIONS;
