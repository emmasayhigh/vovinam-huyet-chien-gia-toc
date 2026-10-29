/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/data/stages.js - Du lieu 11 man choi (wave, boss, dialogue, palette).
 *
 * File nay chi chua du lieu. Logic quan ly nam o js/world/stageManager.js,
 * con phan ve parallax nam o js/world/stageRenderer.js.
 *
 * Luu y: phai load sau js/entities/enemy.js va js/entities/bosses2.js
 * vi bossClass tham chieu toi cac class boss.
 */

const STAGE_DEFINITIONS = {
      1: {
        id: 1,
        title: 'MÀN 1: CON HẺM MƯA ĐỎ',
        subtitle: 'Con hẻm ngầm đô thị lúc nửa đêm',
        objective: 'TIÊU DIỆT LÍNH CANH & HẠ GỤC ĐAO THỦ HẮC LANG',
        bossClass: window.BossHacLang,
        bossName: 'ĐAO THỦ HẮC LANG',
        bossTitle: 'THỦ LĨNH CỬA NGÕ',
        palette: {
          sky: '#080811',
          mid: '#141724',
          ground: '#181a22',
          neon: '#ff2a4b'
        },
        waves: [
          // Đợt 1: Côn Thủ kết hợp Lính Ném Chai Lọ từ xa
          {
            spawnX: 750,
            enemies: [
              { type: 'thug', count: 1, spacing: 90, faction: 'huavudai' },
              { type: 'baton', count: 1, spacing: 100, faction: 'huavudai' },
              { type: 'thrower', count: 1, spacing: 140, faction: 'huavudai' }
            ]
          },
          // Đợt 2: Đao Thủ kết hợp Võ Sĩ Quyền Cước phản đòn
          {
            spawnX: 1350,
            enemies: [
              { type: 'blade', count: 1, spacing: 90, faction: 'huavudai' },
              { type: 'brawler', count: 1, spacing: 100, faction: 'huavudai' },
              { type: 'thug', count: 1, spacing: 80, faction: 'huavudai' }
            ],
            reinforcements: [
              {
                id: 's1_w2_reinforce',
                trigger: 'enemies_remaining',
                threshold: 1,
                bannerText: 'ENEMY REINFORCEMENTS INCOMING',
                enemies: [
                  { type: 'baton', count: 1, spacing: 90, faction: 'huavudai' }
                ]
              }
            ]
          },
          // Đợt 3: Boss Đao Thủ Hắc Lang cùng Khiên Giáp hộ tống
          {
            spawnX: 2050,
            isBossWave: true,
            bossType: 'haclang',
            enemies: [
              { type: 'shield', count: 1, spacing: 120, faction: 'huavudai' }
            ]
          }
        ],
        introDialogue: [
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Ông trùm Hứa Vũ Đại bị bắt giữ bên trong căn cứ ngầm này... Tin nhắn khẩn cấp gửi đến lúc nửa đêm.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Không có quân tiếp viện. Không có đường lui. Ta sẽ một mình quét sạch lũ giang hồ này!'
          }
        ],
        bossDialogue: [
          {
            speaker: 'ĐAO THỦ HẮC LANG',
            role: 'THỦ LĨNH CỬA NGÕ',
            avatar: 'haclang',
            text: 'Ngô Nhất Nghị! Ngươi dám một mình mò vào đây sao? Song đao của ta chưa bao giờ tha mạng kẻ đột nhập!'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Bớt nói nhảm đi. Rút đao ra và xem tinh hoa Vovinam dạy ngươi bài học thế nào!'
          }
        ]
      },

      2: {
        id: 2,
        title: 'MÀN 2: NHÀ KHO THÉP',
        subtitle: 'Kho vận container công nghiệp ngầm',
        objective: 'PHÁ VỠ VÒNG VÂY VÀ ĐÁNH BẠI VÕ SĨ THIẾT QUYỀN',
        bossClass: window.BossThietQuyen,
        bossName: 'VÕ SĨ THIẾT QUYỀN',
        bossTitle: 'ĐẤU SĨ BỌC THÉP',
        palette: {
          sky: '#0a0f18',
          mid: '#192338',
          ground: '#1d222e',
          neon: '#ffd700'
        },
        waves: [
          // Đợt 1: Thiết Giáp Binh (siêu giáp) kết hợp Côn Thủ
          {
            spawnX: 750,
            enemies: [
              { type: 'armored', count: 1, spacing: 110, faction: 'general' },
              { type: 'baton', count: 1, spacing: 90, faction: 'general' }
            ]
          },
          // Đợt 2: Khiên Giáp che chắn cho Đao Thủ & Kẻ Ném Đá phía sau
          {
            spawnX: 1400,
            enemies: [
              { type: 'shield', count: 1, spacing: 100, faction: 'general' },
              { type: 'blade', count: 1, spacing: 90, faction: 'general' },
              { type: 'thrower', count: 1, spacing: 130, faction: 'general' }
            ],
            reinforcements: [
              {
                id: 's2_w2_reinforce',
                trigger: 'enemies_remaining',
                threshold: 1,
                bannerText: 'ENEMY REINFORCEMENTS INCOMING',
                enemies: [
                  { type: 'armored', count: 1, spacing: 100, faction: 'general' }
                ]
              }
            ]
          },
          // Đợt 3: Boss Võ Sĩ Thiết Quyền cùng Hộ Vệ Khiên Giáp
          {
            spawnX: 2100,
            isBossWave: true,
            bossType: 'thietquyen',
            enemies: [
              { type: 'shield', count: 1, spacing: 130, faction: 'general' },
              { type: 'armored', count: 1, spacing: 110, faction: 'general' }
            ]
          }
        ],
        introDialogue: [
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Lối vào nhà kho thép... Càng đi sâu, lính đánh thuê càng trang bị giáp trụ kiên cố hơn.'
          }
        ],
        bossDialogue: [
          {
            speaker: 'VÕ SĨ THIẾT QUYỀN',
            role: 'ĐẤU SĨ BỌC THÉP',
            avatar: 'thietquyen',
            text: 'Nắm đấm của ta có thể đập nát thép tấm! Võ thuật biểu diễn Vovinam của ngươi gãi ngứa cho ta cũng không đủ!'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Thiết giáp dày đến đâu cũng có điểm yếu. Chuẩn bị nếm mùi đòn chân kẹp quật ngã đi!'
          }
        ]
      },

      3: {
        id: 3,
        title: 'MÀN 3: HÀNH LANG TỬ THỦ',
        subtitle: 'Hành lang bê tông boongke tử địa',
        objective: 'VƯỢT QUA HÀNH LANG HẸP VÀ HẠ GỤC ĐỘI TRƯỞNG HUYẾT ẢNH',
        bossClass: window.BossHuyetAnh,
        bossName: 'ĐỘI TRƯỞNG HUYẾT ẢNH',
        bossTitle: 'SÁT THỦ 3 GIAI ĐOẠN',
        palette: {
          sky: '#110508',
          mid: '#2b0b12',
          ground: '#1f1416',
          neon: '#ff0055'
        },
        waves: [
          // Đợt 1: Sát thủ Đao Thủ kết hợp Lính Xích Tỏa (kéo bắt từ xa)
          {
            spawnX: 800,
            enemies: [
              { type: 'blade', count: 1, spacing: 90, faction: 'ngo' },
              { type: 'grabber', count: 1, spacing: 120, faction: 'ngo' },
              { type: 'dodger', count: 1, spacing: 100, faction: 'ngo' }
            ]
          },
          // Đợt 2: Xích Tỏa kết hợp Đao Thủ & Quân Y Chiến Trường (hồi máu)
          {
            spawnX: 1450,
            enemies: [
              { type: 'blade', count: 1, spacing: 90, faction: 'ngo' },
              { type: 'grabber', count: 1, spacing: 110, faction: 'ngo' },
              { type: 'medic', count: 1, spacing: 140, faction: 'ngo' }
            ],
            reinforcements: [
              {
                id: 's3_w2_reinforce',
                trigger: 'enemies_remaining',
                threshold: 1,
                bannerText: 'ENEMY REINFORCEMENTS INCOMING',
                enemies: [
                  { type: 'dodger', count: 1, spacing: 90, faction: 'ngo' }
                ]
              }
            ]
          },
          // Đợt 3: Boss Đội Trưởng Huyết Ảnh cùng Lính Xích Tỏa
          {
            spawnX: 2150,
            isBossWave: true,
            bossType: 'huyetanh',
            enemies: [
              { type: 'grabber', count: 1, spacing: 120, faction: 'ngo' }
            ]
          }
        ],
        introDialogue: [
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Hành lang hẹp này chỉ có một lối đi duy nhất. Không gian chật chội sẽ hạn chế tầm đá vòng cầu.'
          }
        ],
        bossDialogue: [
          {
            speaker: 'ĐỘI TRƯỞNG HUYẾT ẢNH',
            role: 'SÁT THỦ 3 GIAI ĐOẠN',
            avatar: 'huyetanh',
            text: 'Ngươi đã đi quá xa rồi, Ngô Nhất Nghị. Ba thức Huyết Ảnh của ta chưa từng để một ai sống sót rời khỏi hành lang này!'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Dù là ba thức hay ba mươi thức, Việt Võ Đạo cũng sẽ nghiền nát ngươi!'
          }
        ]
      },

      4: {
        id: 4,
        title: 'MÀN 4: PHÒNG GIAO DỊCH NGẦM',
        subtitle: 'Sào huyệt tối thượng của tổ chức đối địch',
        objective: 'QUYẾT ĐẤU LONG VƯƠNG VÀ GIẢI CỨU HỨA VŨ ĐẠI',
        bossClass: window.BossLongVuong,
        bossName: 'LONG VƯƠNG',
        bossTitle: 'ÔNG TRÙM TỐI THƯỢNG',
        palette: {
          sky: '#120f08',
          mid: '#2b2312',
          ground: '#241e17',
          neon: '#ffd700'
        },
        waves: [
          // Đợt 1: Tuyến phòng ngự Khiên Giáp + Thiết Giáp + Ném Xa
          {
            spawnX: 850,
            enemies: [
              { type: 'shield', count: 1, spacing: 100, faction: 'trieu' },
              { type: 'armored', count: 1, spacing: 90, faction: 'trieu' },
              { type: 'thrower', count: 1, spacing: 120, faction: 'trieu' }
            ]
          },
          // Đợt 2: Khiên Giáp bảo vệ Quân Y Chiến Trường + Võ Sĩ Quyền Cước
          {
            spawnX: 1600,
            enemies: [
              { type: 'shield', count: 1, spacing: 90, faction: 'trieu' },
              { type: 'medic', count: 1, spacing: 130, faction: 'trieu' },
              { type: 'brawler', count: 1, spacing: 90, faction: 'trieu' },
              { type: 'baton', count: 1, spacing: 90, faction: 'trieu' }
            ]
          },
          // Đợt 3: Boss Long Vương (sẽ tự động triệu hồi hộ vệ hoàng kim ở Phase 2)
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
            text: 'Kia rồi! Hứa Vũ Đại đang bị trói trong lồng giam phía sau gian phòng giao dịch!'
          },
          {
            speaker: 'HỨA VŨ ĐẠI',
            role: 'ÔNG TRÙM BỊ GIAM GIỮ',
            avatar: 'huavudai',
            text: 'Nghị... cẩn thận! Hắn là Long Vương... Đừng coi thường hắn!'
          }
        ],
        bossDialogue: [
          {
            speaker: 'LONG VƯƠNG',
            role: 'ÔNG TRÙM TỐI THƯỢNG',
            avatar: 'longvuong',
            text: 'Ngô Nhất Nghị, một con chó trung thành! Hứa Vũ Đại đã hết thời. Hôm nay cả hai người các ngươi sẽ làm mồi cho Long Quyền của ta!'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Câm mồm! Đã đến lúc kết thúc trò bắt cóc hèn hạ này. VIỆT VÕ ĐẠO — XUẤT TRẬN!'
          }
        ],
        postChoice: 'rescue'
      },

      // =========================================================================
      // MÀN PHỤ 5 — CHẠY TRỐN HẦM NGẦM (điều khiển Hứa Vũ Đại, escape mode)
      // =========================================================================
      5: {
        id: 5,
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
        palette: {
          sky: '#0a0608',
          mid: '#241119',
          ground: '#1a1418',
          neon: '#ff4a4a'
        },
        waves: [
          {
            spawnX: 680,
            enemies: [
              { type: 'thug', count: 2, spacing: 90 }
            ]
          },
          {
            spawnX: 1320,
            enemies: [
              { type: 'dodger', count: 2, spacing: 100 }
            ]
          },
          {
            spawnX: 1950,
            enemies: [
              { type: 'thug', count: 2, spacing: 90 },
              { type: 'guard', count: 1, spacing: 120 }
            ]
          }
        ],
        introDialogue: [
          {
            speaker: 'HỨA VŨ ĐẠI',
            role: 'ÔNG TRÙM MẠNG LƯỚI NGẦM',
            avatar: 'huavudai',
            text: 'Nghị gục ngoài kia... hay ít nhất nó vừa mở đường cho tôi. Giờ đến lượt tôi tự mình ra khỏi đây.'
          },
          {
            speaker: 'HỨA VŨ ĐẠI',
            role: 'ÔNG TRÙM MẠNG LƯỚI NGẦM',
            avatar: 'huavudai',
            text: 'Không có súng, không có hộ vệ. Chỉ có đôi chân và chiếc phong bì trong túi áo. CỬA THOÁT ở cuối đường hầm!'
          }
        ]
      },

      // =========================================================================
      // MÀN 6 — BẾN CẢNG HẠ TẦNG (Đình Bích Lâm — hiệp ước ở 30% máu)
      // =========================================================================
      6: {
        id: 6,
        title: 'MÀN 6: BẾN CẢNG HẠ TẦNG',
        subtitle: 'Kho ven sông, chỗ ở tạm bợ của du hiệp',
        objective: 'TÌM MANH MỐI VỀ HỒ SƠ — VÀ ĐỐI PHÓ VỚI ĐÌNH BÍCH LÂM',
        bossClass: window.BossBichlam,
        bossName: 'ĐÌNH BÍCH LÂM',
        bossTitle: 'ĐỒNG MINH NGANG TÀNG',
        palette: {
          sky: '#04120e',
          mid: '#0f2a20',
          ground: '#12211c',
          neon: '#4ade80'
        },
        waves: [
          // Đợt 1: Võ Sĩ Quyền Cước kết hợp Côn Thủ & Kẻ Ném Đá
          {
            spawnX: 720,
            enemies: [
              { type: 'brawler', count: 1, spacing: 95, faction: 'bichlam' },
              { type: 'baton', count: 1, spacing: 90, faction: 'bichlam' },
              { type: 'thrower', count: 1, spacing: 130, faction: 'bichlam' }
            ]
          },
          // Đợt 2: Quyền Cước kết hợp Kẻ Ném Đá & Quân Y Chiến Trường
          {
            spawnX: 1400,
            enemies: [
              { type: 'brawler', count: 1, spacing: 95, faction: 'bichlam' },
              { type: 'thrower', count: 1, spacing: 120, faction: 'bichlam' },
              { type: 'medic', count: 1, spacing: 140, faction: 'bichlam' }
            ]
          },
          // Đợt 3: Boss Đình Bích Lâm
          {
            spawnX: 2080,
            isBossWave: true,
            bossType: 'bichlam',
            enemies: []
          }
        ],
        introDialogue: [
          {
            speaker: 'PHÓ MỘC ĐĂNG',
            role: 'THIÊN TÀI CÔNG NGHỆ',
            avatar: 'mocdang',
            text: 'Bến cảng này từng in một phần danh sách liên hệ. Có kẻ đã bị xóa tên khỏi bản sao — và người xóa tên thì vẫn còn sống.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Còn sống thì tốt. Tôi sẽ hỏi trực tiếp — nếu người đó chịu trả lời.'
          }
        ],
        bossDialogue: [
          {
            speaker: 'ĐÌNH BÍCH LÂM',
            role: 'ĐỒNG MINH NGANG TÀNG',
            avatar: 'bichlam',
            text: 'Anh tìm manh mối à? Được — vượt qua tôi trước đã. Tôi ghét nhất là kẻ trung thành mà không biết mình trung thành với ai.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Nếu tôi đánh cô nằm xuống mà vẫn muốn nói chuyện — thì hãy nói.'
          }
        ]
      },

      // =========================================================================
      // MÀN 7 — TRẠM SÁT THỦ NGẦM (Phó Dung Hải — hội lộ động cơ giữa trận)
      // =========================================================================
      7: {
        id: 7,
        title: 'MÀN 7: TRẠM SÁT THỦ NGẦM',
        subtitle: 'Trạm trung chuyển dưới lòng đô thị',
        objective: 'TRUY TÌM PHÓ DUNG HẢI VÀ ÉP HẮN NÓI SỰ THẬT',
        bossClass: window.BossDungHai,
        bossName: 'PHÓ DUNG HẢI',
        bossTitle: 'KẺ BỊ KHAI TRỪ',
        palette: {
          sky: '#080b12',
          mid: '#16202f',
          ground: '#151c26',
          neon: '#00d2ff'
        },
        waves: [
          // Đợt 1: Võ sĩ thân pháp kết hợp Lính Xích Tỏa
          {
            spawnX: 700,
            enemies: [
              { type: 'dodger', count: 1, spacing: 95, faction: 'pho' },
              { type: 'grabber', count: 1, spacing: 120, faction: 'pho' },
              { type: 'thrower', count: 1, spacing: 130, faction: 'pho' }
            ]
          },
          // Đợt 2: Thiết Giáp Binh càn quét cùng Đao Thủ & Quân Y
          {
            spawnX: 1380,
            enemies: [
              { type: 'armored', count: 1, spacing: 110, faction: 'pho' },
              { type: 'blade', count: 1, spacing: 90, faction: 'pho' },
              { type: 'medic', count: 1, spacing: 140, faction: 'pho' }
            ]
          },
          {
            spawnX: 2100,
            isBossWave: true,
            bossType: 'dunghai',
            enemies: []
          }
        ],
        introDialogue: [
          {
            speaker: 'PHÓ MỘC ĐĂNG',
            role: 'THIÊN TÀI CÔNG NGHỆ',
            avatar: 'mocdang',
            text: 'Cảnh báo: Dung Hải từng là người của họ Phó. Hắn biết mọi lối thoát của trạm này — và hắn sẽ không đánh nhau theo nhịp cố định.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Không sao. Tôi không cần đọc nhịp của hắn — tôi cần hắn nói hết lời.'
          }
        ],
        bossDialogue: [
          {
            speaker: 'PHÓ DUNG HẢI',
            role: 'KẺ BỊ KHAI TRỪ',
            avatar: 'dunghai',
            text: 'Lại là cậu à, Nghị? Hứa Vũ Đại gửi cậu đến hỏi tội tôi sao — trong khi chính hắn đang giấu phần cuối của hồ sơ?'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Tôi không đến vì hắn. Tôi đến vì cái tên bị xóa khỏi danh sách. Nói, hoặc đánh — nhưng chọn đi.'
          }
        ]
      },

      // =========================================================================
      // MÀN 8 — THẬP VẠN ĐẠI SƠN (Phó Đặng Hoàng Anh — LỰA CHỌN bước ngoặt)
      // =========================================================================
      8: {
        id: 8,
        title: 'MÀN 8: THẬP VẠN ĐẠI SƠN',
        subtitle: 'Ranh giới mà Hoàng Anh thề bảo vệ',
        objective: 'ĐỐI ĐẦU PHÓ ĐẶNG HOÀNG ANH TRÊN NÚI',
        bossClass: window.BossHoangAnh,
        bossName: 'PHÓ ĐẶNG HOÀNG ANH',
        bossTitle: 'TRẤN THỦ THẬP VẠN ĐẠI SƠN',
        postChoice: 'mountain',
        palette: {
          sky: '#071019',
          mid: '#16303f',
          ground: '#1a2a30',
          neon: '#7dd3fc'
        },
        waves: [
          {
            spawnX: 760,
            enemies: [
              { type: 'guard', count: 2, spacing: 105 },
              { type: 'dodger', count: 1, spacing: 95 }
            ]
          },
          {
            spawnX: 1450,
            enemies: [
              { type: 'guard', count: 2, spacing: 100 },
              { type: 'thug', count: 2, spacing: 90 }
            ]
          },
          {
            spawnX: 2120,
            isBossWave: true,
            bossType: 'hoanganh',
            enemies: []
          }
        ],
        introDialogue: [
          {
            speaker: 'PHÓ MỘC ĐĂNG',
            role: 'THIÊN TÀI CÔNG NGHỆ',
            avatar: 'mocdang',
            text: 'Núi này không có camera, không có thiết bị — chỉ có một người và một cây cuốc. Hoàng Anh không nhận lệnh từ ai.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Vậy thì đây không phải một mệnh lệnh. Đây là một cuộc đối thoại... bằng nắm đấm.'
          }
        ],
        bossDialogue: [
          {
            speaker: 'PHÓ ĐẶNG HOÀNG ANH',
            role: 'TRẤN THỦ THẬP VẠN ĐẠI SƠN',
            avatar: 'hoanganh',
            text: 'Ranh giới này là của tôi. Ngươi mang hồ sơ của họ Hứa lên núi — thì hãy trả giá bằng xương trước khi bước qua.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Tôi không mang theo lệnh của ai. Tôi mang theo một câu hỏi: ông đang bảo vệ di nguyện của ai?'
          }
        ]
      },

      // =========================================================================
      // MÀN 9 — NGOẠI THÀNH TRIỆU GIA (Triệu Đình An — thủ chắc)
      // =========================================================================
      9: {
        id: 9,
        title: 'MÀN 9: NGOẠI THÀNH TRIỆU GIA',
        subtitle: 'Tuyến phòng thủ trước đại điện',
        objective: 'VƯỢT TUYẾN PHÒNG THỦ — PHÁ THẾ CỦA TRIỆU ĐÌNH AN',
        bossClass: window.BossDinhAn,
        bossName: 'TRIỆU ĐÌNH AN',
        bossTitle: 'CẬN VỆ TRUNG THÀNH',
        palette: {
          sky: '#0f0a04',
          mid: '#33260f',
          ground: '#2a231a',
          neon: '#d4a017'
        },
        waves: [
          {
            spawnX: 720,
            enemies: [
              { type: 'guard', count: 2, spacing: 100 }
            ]
          },
          {
            spawnX: 1420,
            enemies: [
              { type: 'guard', count: 2, spacing: 100 },
              { type: 'dodger', count: 2, spacing: 95 }
            ]
          },
          {
            spawnX: 2120,
            isBossWave: true,
            bossType: 'dinhan',
            enemies: []
          }
        ],
        introDialogue: [
          {
            speaker: 'PHÓ MỘC ĐĂNG',
            role: 'THIÊN TÀI CÔNG NGHỆ',
            avatar: 'mocdang',
            text: 'Sơ đồ đại điện: cửa chính chỉ mở khi Đình An gục ngã. Hắn giảm gần một nửa sát thương — đòn unblockable là cách duy nhất phá thế thủ.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Trung thành đến mức không cần suy nghĩ... Tôi từng như thế. Hôm nay tôi sẽ chứng minh điều đó sai.'
          }
        ],
        bossDialogue: [
          {
            speaker: 'TRIỆU ĐÌNH AN',
            role: 'CẬN VỆ TRUNG THÀNH',
            avatar: 'dinhan',
            text: 'Qua được ta, mới vào được đại điện. Ta đã đứng đây mười năm — ngươi sẽ là người thứ một nghìn không bước qua nổi.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Thủ chắc thế nào thì vẫn có lúc phải hạ tay xuống. Tôi sẽ chờ đúng khoảnh khắc đó.'
          }
        ]
      },

      // =========================================================================
      // MÀN 10 — ĐẠI ĐIỆN TRIỆU GIA (Triệu Vinh Tâm — 3 giai đoạn + LỰA CHỌN)
      // =========================================================================
      10: {
        id: 10,
        title: 'MÀN 10: ĐẠI ĐIỆN TRIỆU GIA',
        subtitle: 'Nơi Vinh Tâm điều khiển cả chiến trường',
        objective: 'ĐÁNH BẠI TRIỆU VĨNH TÂM — 3 GIAI ĐOẠN',
        bossClass: window.BossVinhTam,
        bossName: 'TRIỆU VĨNH TÂM',
        bossTitle: 'THỦ LĨNH TRIỆU GIA',
        postChoice: 'danghai',
        palette: {
          sky: '#120c03',
          mid: '#3a2c10',
          ground: '#2a2218',
          neon: '#ffd700'
        },
        waves: [
          {
            spawnX: 700,
            enemies: [
              { type: 'guard', count: 2, spacing: 100 },
              { type: 'dodger', count: 1, spacing: 95 }
            ]
          },
          {
            spawnX: 1400,
            enemies: [
              { type: 'guard', count: 3, spacing: 95 }
            ]
          },
          {
            spawnX: 2120,
            isBossWave: true,
            bossType: 'vinhtam',
            enemies: []
          }
        ],
        introDialogue: [
          {
            speaker: 'TRIỆU VĨNH TÂM',
            role: 'THỦ LĨNH TRIỆU GIA',
            avatar: 'vinhtam',
            text: 'Đại điện này chưa từng rơi vào tay kẻ bên ngoài. Ngươi đánh vì ai — vì một kẻ không bao giờ nói hết sự thật?'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Tôi đánh để hỏi cho rõ: hai mươi năm trước, ai đã tạo ra hồ sơ này?'
          }
        ],
        bossDialogue: [
          {
            speaker: 'TRIỆU VĨNH TÂM',
            role: 'THỦ LĨNH TRIỆU GIA',
            avatar: 'vinhtam',
            text: 'Tính toán... đó là thứ tay chân các ngươi không có. Parry một đòn, gọi hai cận vệ, và kết thúc — tất cả chỉ là phép trừ.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Phép trừ không thắng được người thật. Xuất chiêu đi!'
          }
        ]
      },

      // =========================================================================
      // MÀN 11 — ĐOẠN NGHĨA ĐÀI (Ngô Giang Mạnh — trận cuối -> KẾT THÚC)
      // =========================================================================
      11: {
        id: 11,
        title: 'MÀN 11: ĐOẠN NGHĨA ĐÀI',
        subtitle: 'Đá, mưa, và những cái tên không ai đọc hết',
        objective: 'ĐỐI THOẠI & QUYẾT ĐẤU VỚI NGÔ GIANG MẠNH',
        bossClass: window.BossGiangManh,
        bossName: 'NGÔ GIANG MẠNH',
        bossTitle: 'CHỦ GIA TỘC HỌ NGÔ',
        finalStage: true,
        palette: {
          sky: '#08080d',
          mid: '#1f2230',
          ground: '#1a1b22',
          neon: '#7dd3fc'
        },
        waves: [
          {
            spawnX: 780,
            enemies: [
              { type: 'dodger', count: 2, spacing: 95 }
            ]
          },
          {
            spawnX: 2150,
            isBossWave: true,
            bossType: 'giangmanh',
            enemies: []
          }
        ],
        introDialogue: [
          {
            speaker: 'NGÔ GIANG MẠNH',
            role: 'CHỦ GIA TỘC HỌ NGÔ',
            avatar: 'giangmanh',
            text: 'Cuối cùng ngươi cũng đến. Họ Phó nói dối, họ Triệu toan tính, họ Hứa dùng người như quân cờ — còn ngươi? Ngươi trung thành với ai?'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Tôi trung thành với điều tôi tự kiểm chứng được. Đêm nay tôi sẽ kiểm chứng cả ông — bằng tay không này.'
          }
        ],
        bossDialogue: [
          {
            speaker: 'NGÔ GIANG MẠNH',
            role: 'CHỦ GIA TỘC HỌ NGÔ',
            avatar: 'giangmanh',
            text: 'Ta quan sát ngươi từ đầu đêm. Ngươi lặp lại chuỗi đòn nào nhiều nhất — và ta sẽ trừng phạt đúng chỗ đó.'
          },
          {
            speaker: 'NGÔ NHẤT NGHỊ',
            role: 'SÁT THẦN VIỆT VÕ ĐẠO',
            avatar: 'nghi',
            text: 'Thói quen ư? Vậy thì đừng ngạc nhiên nếu tôi đổi cách đánh sau câu nói này.'
          }
        ]
      }
};

// Browser: cac file script khac doc qua window.STAGE_DEFINITIONS.
// Node tests: window duoc mock bang global, nen van hoat dong.
window.STAGE_DEFINITIONS = STAGE_DEFINITIONS;
