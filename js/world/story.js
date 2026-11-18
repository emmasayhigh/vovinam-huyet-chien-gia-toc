/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/story.js - Bản đồ chương (Hồi I-V), nhiệm vụ, lựa chọn, kết thúc & thành tích
 *
 * STORY_META.stages[id] : meta hiển thị ở "Chọn chương" (nhiệm vụ chính/phụ, thưởng, manh mối)
 * STORY_META.acts       : các Hồi (chapter)
 * STORY_META.endings    : 4 kết thúc có điều kiện thật, nội dung khác nhau
 */

const STORY_META = {
  // ------------------------------------------------------------------- HỒI (5 HỒI — CỨ 3–4 MÀN MỚI ĐÁNH BOSS)
  acts: [
    { id: 1, code: 'HỒI I', title: 'ĐÊM HẮC LANG & KHO NGẦM', stages: [1, 2, 3, 4, 5],
      themeColor: '#f43f5e',
      worldSub: 'Khu Hẻm Mưa & Boongke Bến Cảng',
      desc: 'Nghị lần lượt phá 3 tuyến phòng thủ cửa ngõ, nhà kho và hành lang boongke trước khi đối đầu Long Vương ở Màn 4 để giải cứu Hứa Vũ Đại.' },
    { id: 2, code: 'HỒI II', title: 'BẾN CẢNG TÂY HỒ & HỒ SƠ M&A', stages: [6, 7, 8, 9],
      themeColor: '#10b981',
      worldSub: 'Trại Cá Koi Thiên Trì — Hàng Châu',
      desc: 'Từ phố cổ đêm mưa qua Trại Cá Koi Thiên Trì và xưởng tàu cũ, từng mảnh hồ sơ bị xóa tên dần hé lộ — chốt hạ bằng cuộc quyết đấu Đình Bích Lâm.' },
    { id: 3, code: 'HỒI III', title: 'VẾT MÁU HẮC LONG GIANG', stages: [10, 11, 12, 13],
      themeColor: '#38bdf8',
      worldSub: 'Lục Gia Chủy & Trạm Sát Thủ Ngầm',
      desc: 'Đột nhập ga ngầm bỏ hoang, hành lang máy chủ Mộc Đăng và tầng hầm Xích Tỏa để bóc trần âm mưu lưu đày 7 năm trước mặt Phó Dung Hải.' },
    { id: 4, code: 'HỒI IV', title: 'THẬP VẠN ĐẠI SƠN & ĐẠI ĐIỆN TRIỆU GIA', stages: [14, 15, 16, 17],
      themeColor: '#f59e0b',
      worldSub: 'Biên Cương Đại Ngàn — Bắc Kinh',
      desc: 'Giải vây dân sơn cước cùng Hoàng Anh, phá ngoại thành Thiết Bích của Đình An rồi đối chiến Hoàng Bào Triệu Vinh Tâm tại Đại Điện.' },
    { id: 5, code: 'HỒI V', title: 'ĐOẠN NGHĨA ĐÀI TÔ CHÂU', stages: [18, 19, 20],
      themeColor: '#818cf8',
      worldSub: 'Hoa Viên Hồ Kim Kê — Bão Tuyết',
      desc: 'Vượt Hoa Viên Hồ Kim Kê và Đàn Tràng Bùa Ngải trong đêm tuyết rơi để bước lên Đoạn Nghĩa Đài phân định ân oán cùng Ngô Giang Mạnh.' }
  ],

  // ------------------------------------------------------- TRẠNG THÁI MÀN (20 MÀN CÓ CHIỀU SÂU)
  stages: {
    1: { id: 1, act: 1, faction: 'hua', type: 'main', boss: null,
      title: 'MÀN 1: CON HẺM MƯA ĐỎ',
      mission: 'Đột nhập cửa ngõ Hắc Đạo lúc nửa đêm — dẹp toán tuần tra lấy manh mối đầu tiên',
      side: 'Hoàn thành với dưới 2 lần trúng đòn',
      reward: '+450 Vàng · +20 Kim Cương · Manh mối Gia Phả', clue: 'Ảnh Cũ Gia Tộc bị rạch mặt tại phòng mật cửa ngõ', next: 2 },
    2: { id: 2, act: 1, faction: 'hua', type: 'main', boss: null,
      title: 'MÀN 2: ĐỘT KÍCH NHÀ KHO THÉP',
      mission: 'Xâm nhập kho container công nghiệp — phá hàng rào Thiết Giáp & tìm đường vào hầm ngầm',
      side: 'Phá thế thủ Thiết Giáp bằng [S+J]',
      reward: '+450 Vàng · +20 Kim Cương', clue: 'Thùng vũ khí sửa số seri từ mạng lưới Triệu gia', next: 3 },
    3: { id: 3, act: 1, faction: 'hua', type: 'main', boss: null,
      title: 'MÀN 3: HÀNH LANG TỬ THỦ',
      mission: 'Vượt boongke hẹp đầy bẫy Xích Tỏa — đánh bại đội Tinh Nhuệ canh phòng giao dịch',
      side: 'Đạt chuỗi combo 10 hit liên tục',
      reward: '+500 Vàng · +25 Kim Cương · Văn Bản Khai Trừ', clue: 'Lệnh khai trừ Dung Hải ký lùi ngày 14/08/2017', next: 4 },
    4: { id: 4, act: 1, faction: 'hua', type: 'main', boss: 'longvuong',
      title: 'MÀN 4: PHÒNG GIAO DỊCH NGẦM',
      mission: 'BOSS HỒI I — Quyết đấu Long Vương để giải cứu Hứa Vũ Đại khỏi lồng giam',
      side: 'Đạt hạng S',
      reward: 'Mở Hồi II + nhân vật Hứa Vũ Đại', clue: 'Thư mật Tô Châu nằm trong két sắt sau lồng giam', next: 6,
      unlockChar: 'huavudai', choice: 'rescue' },
    5: { id: 5, act: 1, faction: 'hua', type: 'side', sideOf: 4, boss: null, escape: true,
      title: 'MÀN PHỤ: CHẠY TRỐN HẦM NGẦM',
      mission: 'Nhiệm vụ phụ — Điều khiển Hứa Vũ Đại tự mở đường thoát khỏi hầm sập',
      side: 'Đến cửa thoát mà không gục ngã',
      reward: '+600 Vàng · +35 Kim Cương · Cúp Thoát Hiểm', clue: 'Phong bì mật Hứa Vũ Đại giấu riêng trong áo vest', next: null,
      unlockChar: 'huavudai' },

    6: { id: 6, act: 2, faction: 'doclap', type: 'main', boss: null,
      title: 'MÀN 6: PHỐ ĐÊM HÀNG CHÂU',
      mission: 'Lần dấu danh sách liên hệ bị xóa tên tại khu phố cũ ven sông Tây Hồ',
      side: 'Né đòn hoàn hảo 2 lần',
      reward: '+500 Vàng · +25 Kim Cương', clue: 'Dấu vết sổ sách rửa tiền qua bến thủy', next: 7 },
    7: { id: 7, act: 2, faction: 'doclap', type: 'main', boss: null,
      title: 'MÀN 7: TRẠI CÁ KOI THIÊN TRÌ',
      mission: 'Xâm nhập Thiên Trì Thủy Các — dọn bọn quấy nhiễu và thu Biên Bản Thẩm Mật',
      side: 'Kết liễu đợt cuối bằng đòn Counter [U+J]/[U+K]',
      reward: '+550 Vàng · +25 Kim Cương · Biên Bản Nội Bộ', clue: 'Lời khai nhân chứng đêm Tô Châu 7 năm trước', next: 8 },
    8: { id: 8, act: 2, faction: 'doclap', type: 'main', boss: null,
      title: 'MÀN 8: XƯỞNG ĐÓNG TÀU CỔ',
      mission: 'Chặt đứt tuyến tiếp tế bến cảng — dọn sạch toán võ sĩ ngang tàng bảo vệ kho thuyền',
      side: 'Không dùng máu hồi phục dọc đường',
      reward: '+550 Vàng · +25 Kim Cương', clue: 'Lệnh hẹn đối chất trực tiếp cùng Đình Bích Lâm', next: 9 },
    9: { id: 9, act: 2, faction: 'doclap', type: 'main', boss: 'bichlam',
      title: 'MÀN 9: BẾN CẢNG HẠ TẦNG',
      mission: 'BOSS HỒI II — Thử lửa cùng Đình Bích Lâm để giành sự tín nhiệm của du hiệp',
      side: 'Hạ Bích Lâm dưới 30% HP để lập Hiệp Ước',
      reward: '+800 Vàng · +45 Kim Cương · Mở khóa Đình Bích Lâm', clue: 'Đoạn tên bị xóa trong sổ liên lạc hướng về Lục Gia Chủy', next: 10,
      unlockChar: 'bichlam' },

    10: { id: 10, act: 3, faction: 'pho', type: 'main', boss: null,
      title: 'MÀN 10: GA TÀU NGẦM BỎ HOANG',
      mission: 'Theo dấu 7 năm lưu đày từ Hắc Long Giang — phá ổ phục kích Xích Tỏa',
      side: 'Phá chiêu bắt xích 2 lần bằng [L]',
      reward: '+550 Vàng · +30 Kim Cương', clue: 'Vé tàu mật mã đưa tới phòng máy chủ Lục Gia Chủy', next: 11 },
    11: { id: 11, act: 3, faction: 'pho', type: 'main', boss: null,
      title: 'MÀN 11: HÀNH LANG MÁY CHỦ',
      mission: 'Xâm nhập tầng dữ liệu họ Phó — đoạt Đoạn Ghi Âm Tần Số Riêng của Mộc Đăng',
      side: 'Thu thập DOC_AUDIO_MOCDANG',
      reward: '+600 Vàng · +30 Kim Cương · Băng Ghi Âm Mật', clue: 'Cuộc gọi bí mật "Để Nghị và Dung Hải triệt hạ nhau"', next: 12 },
    12: { id: 12, act: 3, faction: 'pho', type: 'main', boss: null,
      title: 'MÀN 12: TẦNG HẦM XÍCH TỎA',
      mission: 'Quét sạch sát thủ thanh trừng của Hứa Vũ Đại đang bao vây cửa ngõ trạm ngầm',
      side: 'Hạ toàn bộ Đao Thủ trong vòng 75 giây',
      reward: '+600 Vàng · +30 Kim Cương', clue: 'Bản đồ cửa Bắc dẫn vào phòng riêng Dung Hải', next: 13 },
    13: { id: 13, act: 3, faction: 'pho', type: 'main', boss: 'dunghai',
      title: 'MÀN 13: TRẠM SÁT THỦ NGẦM',
      mission: 'BOSS HỒI III — Đối chất 3 ngả hoặc quyết đấu Phó Dung Hải',
      side: 'Nghe hết câu thoại giữa trận của Dung Hải',
      reward: '+850 Vàng · +50 Kim Cương · Mở khóa Phó Dung Hải', clue: 'Sự thật về âm mưu bán đứng mạch đất hiếm 7 năm trước', next: 14,
      unlockChar: 'dunghai' },

    14: { id: 14, act: 4, faction: 'pho', type: 'main', boss: null,
      title: 'MÀN 14: CHÂN NÚI SƯƠNG LẠNH',
      mission: 'Tiến vào dãy Thập Vạn Đại Sơn — quét toán lính đánh thuê tìm cách đào trộm mạch khoáng',
      side: 'Không để lính Quân Y hồi máu quá 1 lần',
      reward: '+650 Vàng · +30 Kim Cương', clue: 'Thiết bị khoan địa chất mang ấn Triệu gia', next: 15 },
    15: { id: 15, act: 4, faction: 'pho', type: 'main', boss: null,
      title: 'MÀN 15: THÔN CỔ SƠN CƯỚC',
      mission: 'Giải vây thôn sơn cước trước quân Triệu gia — Hoàng Anh trao Di Nguyện Thập Vạn Đại Sơn',
      side: 'Giữ HP trên 70% khi thắng trận',
      reward: '+700 Vàng · +35 Kim Cương · Mở khóa Hoàng Anh & Lựa Chọn', clue: 'Hồ sơ địa chất Hạch Tâm Xích Huyết', next: 16,
      unlockChar: 'hoanganh', choice: 'mountain' },
    16: { id: 16, act: 4, faction: 'trieu', type: 'main', boss: null,
      title: 'MÀN 16: NGOẠI THÀNH TRIỆU GIA',
      mission: 'Phá cổng thành Bắc Kinh — đánh tan binh đoàn Thiết Bích trấn thủ tiền sảnh',
      side: 'Phá khiên Hộ Vệ bằng [S+J] 2 lần',
      reward: '+750 Vàng · +35 Kim Cương · Mở khóa Triệu Đình An', clue: 'Mật lệnh mở cửa Đại Điện Triệu Gia', next: 17,
      unlockChar: 'dinhan' },
    17: { id: 17, act: 4, faction: 'trieu', type: 'main', boss: 'vinhtam',
      title: 'MÀN 17: ĐẠI ĐIỆN TRIỆU GIA',
      mission: 'BOSS HỒI IV — Đánh bại Triệu Vinh Tâm 3 giai đoạn & Phiên Đối Chất Ba Sự Thật',
      side: 'Trừng phạt 3 sơ hở sau đòn nặng Vinh Tâm',
      reward: '+1000 Vàng · +60 Kim Cương · Hạch Tâm Mật Mã', clue: 'Biên lai 50 triệu USD và cái tên Kiến Trúc Sư Thần Số', next: 18,
      choice: 'danghai' },

    18: { id: 18, act: 5, faction: 'ngo', type: 'main', boss: null,
      title: 'MÀN 18: HOA VIÊN HỒ KIM KÊ',
      mission: 'Bước vào hoa viên Tô Châu giữa đêm bão tuyết — phá Tứ Tượng Trận hộ vệ Họ Ngô',
      side: 'Đạt chuỗi combo 12 hit liên tiếp',
      reward: '+800 Vàng · +40 Kim Cương', clue: 'Mảnh kiếm gãy năm xưa dưới gốc liễu hồ Kim Kê', next: 19 },
    19: { id: 19, act: 5, faction: 'ngo', type: 'main', boss: null,
      title: 'MÀN 19: ĐÀN TRÀNG BÙA NGẢI',
      mission: 'Dẹp tan tàn dư tà thuật và đệ tử hắc đạo án ngữ bậc thềm Đoạn Nghĩa Đài',
      side: 'Vượt màn mà không dùng hồi sinh / cạn thể lực',
      reward: '+850 Vàng · +45 Kim Cương', clue: 'Dấu chân cuối dẫn thẳng lên đỉnh Đoạn Nghĩa Đài', next: 20 },
    20: { id: 20, act: 5, faction: 'ngo', type: 'main', boss: 'giangmanh',
      unlockChar: 'giangmanh',
      title: 'MÀN 20: ĐOẠN NGHĨA ĐÀI',
      mission: 'FINAL BOSS — Đối thoại & quyết đấu sinh tử cùng Ngô Giang Mạnh',
      side: 'Nghe hết 3 câu nói giữa trận của Giang Mạnh',
      reward: 'KẾT THÚC CHIẾN DỊCH · MỞ KHÓA NGÔ GIANG MẠNH · +120 Kim Cương', clue: 'Chân tướng cuối cùng về kẻ ra quyết định 20 năm trước', next: null }
  },

  // Tra cứu nhanh: màn chính đi trước/di sau
  mainOrder: {},
  sideOf: {},

  // ------------------------------------------------------- LỰA CHỌN CỐT TRUYỆN
  choices: {
    rescue: {
      label: 'Sau khi đánh bại Long Vương',
      question: 'Xiềng xích của Hứa Vũ Đại đã đứt. Hắn nhìn Nghị, rồi nhìn về phía chiếc két sắt trong phòng giao dịch.',
      options: [
        { id: 'break', text: 'Đập lồng ngay — thi hành lệnh, không hỏi thêm.', desc: 'Trung thành tuyệt đối. Nghị không đòi bằng chứng.' },
        { id: 'proof', text: '"Trước khi tôi cứu ông, cho tôi xem hồ sơ."', desc: 'Nghị yêu cầu bằng chứng trước khi đưa tay ra.' }
      ],
      effect: { break: 'Trung thành +1', proof: 'Sự thật +1' }
    },
    mountain: {
      label: 'Sau trận Hoàng Anh',
      question: 'Hoàng Anh gục một gối xuống đá, nói về di nguyện của người đã khuất. Điện thoại của Hứa Vũ Đại rung lên: "Rút ngay."',
      options: [
        { id: 'withdraw', text: 'Rút — tuân mệnh lệnh của Hứa Vũ Đại.', desc: 'Nghị gác lại sự thật trên núi.' },
        { id: 'listen', text: 'Ở lại, nghe hết lời Hoàng Anh.', desc: 'Nghị biết được hồ sơ được tạo ra từ một quyết định sai lầm.' }
      ],
      effect: { withdraw: 'Trung thành +1', listen: 'Sự thật +1' }
    },
    danghai: {
      label: 'Sau khi đánh bại Triệu Vinh Tâm',
      question: 'Dung Hải quỳ giữa đại điện, không chống cự. Hứa Vũ Đại ra lệnh qua điện thoại: "Đưa hắn về cho tôi."',
      options: [
        { id: 'handover', text: 'Giao Dung Hải cho Hứa Vũ Đại.', desc: 'Nghị chọn trung thành — hắn sẽ không biết Dung Hải chết thế nào.' },
        { id: 'spare', text: 'Để Dung Hải đi — hắn có thứ Nghị cần nghe.', desc: 'Nghị chọn sự thật, quay lưng với mệnh lệnh.' }
      ],
      effect: { handover: 'Trung thành +1', spare: 'Sự thật +1' }
    }
  },

  // ------------------------------------------------------- 5 KẾT THÚC & HẬU TRUYỆN ĐA NHÂN VẬT
  endings: [
    {
      id: 'huyetmach_khoiphuc',
      name: 'KẾT THÚC BÍ MẬT: HUYẾT MẠCH KHÔI PHỤC',
      tagline: 'Sự thật tối thượng hàn gắn gia tộc — Mở ra kỷ nguyên minh bạch cho Thập Vạn Đại Sơn.',
      condition: (c, sm) => {
        if (sm && sm.data.storyFlags && sm.data.storyFlags.secretTrueEnding) return true;
        if (window.investigationManager && window.investigationManager.canUnlockSecretEnding()) return true;
        return false;
      },
      conditionText: 'Thu thập & giải mã đủ 5 bằng chứng cốt lõi + cân bằng độ tin nhiệm + giải quyết đối chất trong hòa bình.',
      scene: 'Toàn bộ hồ sơ về cái chết của cố Tộc Trưởng Phó Khắc Nghiệp được đưa ra ánh sáng. Bức ảnh bị rạch mặt được phục chế nguyên vẹn và treo lại giữa Đại Sảnh Lục Gia Chủy. Thập Vạn Đại Sơn không còn là chiến trường tranh đoạt hạch tâm mà trở thành Viện Nghiên Cứu Hòa Bình bảo hộ di sản.',
      quote: '"Máu chảy trong huyết quản không phải để chia rẽ. Hôm nay, họ Phó chính thức khôi phục lại cái tên bị lãng quên." — Ngô Nhất Nghị',
      epilogues: {
        dunghai: 'Phó Dung Hải được gỡ bỏ toàn bộ án lệnh khai trừ 7 năm trước, được phục hồi tư cách Trưởng Lão và danh dự của dòng máu. Anh từ chối quyền lực hành chính, chọn ở lại chân núi Thập Vạn Đại Sơn để cùng Hoàng Anh huấn luyện thế hệ võ sĩ trẻ.',
        hoanganh: 'Phó Đặng Hoàng Anh mở rộng cổng Thập Vạn Đại Sơn, không còn phải cô độc ôm cây cuốc sắt canh giữ bí mật trong sương lạnh. Anh được tôn vinh là Người Bảo Hộ Vĩ Đại của dòng tộc.',
        mocdang: 'Phó Mộc Đăng tự nguyện bàn giao thuật toán kiểm soát máy chủ lượng tử cho Hội Đồng Tam Quyền. Anh thừa nhận sai lầm quá khứ và lui về vị trí Kiến Trúc Sư Kỹ Thuật, tìm lại sự thanh thản trong tâm hồn.',
        pho_clan: 'Tổ đình họ Phó mở toang cánh cửa phòng lưu trữ bí mật. Tên của Phó Khắc Nghiệp và những người từng bị xóa sổ được khắc hoa cương vàng son tại Đoạn Nghĩa Đài Tô Châu. Liên minh các gia tộc bước vào thỏa ước đình chiến lâu dài.'
      }
    },
    {
      id: 'chanthuong',
      name: 'KẾT THÚC CHÂN TƯỚNG: ĐÌNH CHIẾN MINH BẠCH',
      tagline: 'Sự thật ra ánh sáng — cuộc chiến quyền lực không thể leo thang trong bóng tối.',
      condition: (c) => c.rescue === 'proof' && c.mountain === 'listen' && c.danghai === 'spare',
      conditionText: 'Yêu cầu bằng chứng (Hồi I) + ở lại nghe Hoàng Anh (Hồi III) + tha thứ cho Dung Hải (Hồi IV).',
      scene: 'Nghị đưa toàn bộ hồ sơ lên ánh sáng. Bốn gia tộc không ai giành trọn quyền lực, nhưng không ai còn có thể giết nhau trong im lặng. Hoàng Anh giữ núi, Vinh Tâm mất đại điện, Giang Mạnh ngồi xuống nói chuyện lần đầu tiên sau hai mươi năm.',
      quote: '"Tôi không trung thành với ông. Tôi trung thành với sự thật — và hôm nay nó đã đủ." — Ngô Nhất Nghị',
      epilogues: {
        dunghai: 'Dung Hải được minh oan một phần, quyết định rời bỏ Lục Gia Chủy để chu du giang hồ, sống cuộc đời tự do không vướng bận hào môn.',
        hoanganh: 'Hoàng Anh tiếp tục trấn thủ Thập Vạn Đại Sơn, thiết lập ranh giới hòa bình cho người dân biên cương.',
        mocdang: 'Mộc Đăng giữ được quyền kiểm soát công ty nhưng mất đi sự kính trọng của những người thân cận nhất.',
        pho_clan: 'Hồ sơ tài nguyên được giải mật từng phần, các thế lực ngầm không còn dám manh động.'
      }
    },
    {
      id: 'trungthanh',
      name: 'KẾT THÚC TRUNG THÀNH: BÓNG TỐI HÀO MÔN',
      tagline: 'Nghị tiếp tục bảo vệ Hứa Vũ Đại — chấp nhận mình là lưỡi đao trong bóng tối.',
      condition: (c) => c.rescue === 'break' && c.danghai === 'handover',
      conditionText: 'Đập lồng ngay (Hồi I) + giao Dung Hải cho Hứa Vũ Đại (Hồi IV).',
      scene: 'Nghị vẫn đứng vững phía sau Hứa Vũ Đại. Ông trùm giấu kín phần cuối của hồ sơ hạch tâm. Nghị biết điều đó, nhưng chọn quay lưng về phía ánh sáng. Hứa Vũ Đại củng cố đế chế ngầm, còn số phận những kẻ bị trục xuất vĩnh viễn chìm vào quên lãng.',
      quote: '"Chỉ cần tôi còn đứng đây, không kẻ nào chạm vào ông. Dù tôi chưa biết tất cả." — Ngô Nhất Nghị',
      epilogues: {
        dunghai: 'Dung Hải bị áp giải về trại giam ngầm của Hứa Vũ Đại, không còn ai nghe thấy tiếng nói của anh nữa.',
        hoanganh: 'Hoàng Anh phong tỏa hoàn toàn Thập Vạn Đại Sơn, cắt đứt mọi liên lạc với thế giới bên ngoài.',
        mocdang: 'Mộc Đăng tiếp tục duy trì cỗ máy giám sát AI độc quyền, ngày càng trở nên đa nghi và lạnh lùng.',
        pho_clan: 'Những cái tên bị xóa sổ vĩnh viễn biến mất. Hào môn tồn tại trên nền tảng của sự phục tùng tuyệt đối.'
      }
    },
    {
      id: 'phanboi',
      name: 'KẾT THÚC PHẢN BỘI: DU HIỆP CÔ ĐỘC',
      tagline: 'Nghị quay lưng với ông chủ sau khi phát hiện những lời dối trá có hệ thống.',
      condition: (c) => c.rescue === 'proof' && c.mountain === 'withdraw',
      conditionText: 'Yêu cầu bằng chứng (Hồi I) + rút theo mệnh lệnh (Hồi III).',
      scene: 'Nghị giữ lại bản sao hồ sơ. Đêm ấy hắn mang bản sao đó ra khỏi mạng lưới ngầm. Hứa Vũ Đại cay đắng nhận ra mình đã huấn luyện một cao thủ phản nghịch bằng chính sự dối trá của mình.',
      quote: '"Ông dạy tôi rằng thông tin là vũ khí. Ông chỉ không ngờ tôi là người cầm nó." — Ngô Nhất Nghị',
      epilogues: {
        dunghai: 'Dung Hải tiếp tục ẩn náu tại các khu ổ chuột ngầm, luôn phải đề phòng sát thủ từ mọi phe phái.',
        hoanganh: 'Hoàng Anh một mình đối đầu với các đợt thăm dò khai thác lén lút của tập đoàn công nghệ.',
        mocdang: 'Mộc Đăng nâng cấp tối đa hệ thống phòng thủ tường lửa lượng tử để truy lùng dữ liệu bị rò rỉ.',
        pho_clan: 'Gia tộc rơi vào tình trạng chia rẽ nội bộ kéo dài, không bên nào tin tưởng bên nào.'
      }
    },
    {
      id: 'huyetchien',
      name: 'KẾT THÚC HUYẾT CHIẾN: GIA TỘC TÀN LỤI',
      tagline: 'Nghị đánh bại mọi đối thủ nhưng không thể hàn gắn vết thương lịch sử.',
      condition: () => true,
      conditionText: 'Mặc định khi các lựa chọn bị phân tán và không tìm đủ bằng chứng then chốt.',
      scene: 'Nghị thắng mọi trận đấu nhưng chiến tranh không dừng lại. Bốn gia tộc tiếp tục chém giết vì hạch tâm, và Đoạn Nghĩa Đài vẫn chìm trong mưa xám với những nấm mồ vô danh.',
      quote: '"Tôi thắng trận. Tôi không thắng cuộc chiến." — Ngô Nhất Nghị',
      epilogues: {
        dunghai: 'Dung Hải kiệt sức trong các cuộc đụng độ liên miên, biến mất không dấu tích.',
        hoanganh: 'Đỉnh Thập Vạn Đại Sơn bị máy móc đào xới tan hoang sau những trận tập kích vũ trang.',
        mocdang: 'Mộc Đăng bị chính các cổ đông Triệu gia lật đổ, đế chế Lục Gia Chủy sụp đổ.',
        pho_clan: 'Họ Phó tan rã thành các nhánh nhỏ tranh giành tài nguyên, lịch sử hào môn trở thành dĩ vãng.'
      }
    }
  ],

  // ------------------------------------------------------- THÀNH TÍCH
  achievements: [
    { id: 'act1_clear', name: 'ĐÊM HẮC LANG', desc: 'Hoàn thành Hồi I — giải cứu Hứa Vũ Đại' },
    { id: 'rescue_choice', name: 'LỰA CHỌN ĐẦU TIÊN', desc: 'Đưa ra lựa chọn cốt truyện đầu tiên' },
    { id: 'combo_10', name: 'LIÊN HOÀN THẦN KỲ', desc: 'Đạt chuỗi 10 hit liên tục' },
    { id: 'perfect_3', name: 'THÂN PHÁP VÔ LỖI', desc: '3 Perfect Dodge trong một màn chơi' },
    { id: 'rank_s', name: 'SÁT THẦN', desc: 'Đạt hạng S ở một màn chơi' },
    { id: 'escape_hud', name: 'THOÁT HIỂM', desc: 'Chạy trốn thành công cùng Hứa Vũ Đại' },
    { id: 'truce_bichlam', name: 'HIỆP ƯỚC GIỮA HAI NGƯỜI', desc: 'Kết thúc trận Bích Lâm bằng hiệp ước' },
    { id: 'beat_hoanganh', name: 'TRẬN CHIẾN TRÊN NÚI', desc: 'Đánh bại Phó Đặng Hoàng Anh' },
    { id: 'beat_vinhtam', name: 'ĐẠI ĐIỆN ĐÃ RỤNG', desc: 'Đánh bại Triệu Vinh Tâm' },
    { id: 'beat_giangmanh', name: 'ĐOẠN NGHĨA', desc: 'Đánh bại Ngô Giang Mạnh' },
    { id: 'all_playable', name: 'TOÀN BỘ TUYẾN NHÂN VẬT', desc: 'Mở khóa hết nhân vật chơi được' },
    { id: 'all_endings', name: 'BỐN KẾT THÚC', desc: 'Đạt cả 4 kết thúc thường của game' },
    // Mới: Thành tích Điều tra & Huyết Án Họ Phó
    { id: 'chronicles_master', name: 'HỒ SƠ HOÀN CHỈNH', desc: 'Thu thập và giải mã đủ các tài liệu Biên Niên Sử Họ Phó' },
    { id: 'flashback_clear', name: 'HỒI ỨC DUNG HẢI', desc: 'Hoàn thành màn chơi hồi ức: Đêm Bị Khai Trừ' },
    { id: 'flashback_core', name: 'CỨU LẤY HẠCH TÂM', desc: 'Dung Hải mang theo bản thảo hạch tâm trong đêm trốn chạy' },
    { id: 'confrontation_done', name: 'BA NGƯỜI, BA SỰ THẬT', desc: 'Hoàn thành phiên đối chất tối cao giữa ba nhân vật' },
    { id: 'secret_ending_unlocked', name: 'HUYẾT MẠCH KHÔI PHỤC', desc: 'Mở khóa Kết Thúc Bí Mật tối thượng của dòng họ Phó' },
    // Mới: Đỉnh Cao Chiến Đấu & Binh Khí Vovinam
    { id: 'nodamage_clear', name: 'BẤT KHẢ XÂM PHẠM', desc: 'Chiến thắng trọn vẹn một màn chơi mà không chịu bất kỳ sát thương nào' },
    { id: 'bleed_master', name: 'LƯỠI ĐAO HUYẾT NGUYỆT', desc: 'Kích hoạt hiệu ứng Xuất Huyết chém rách đối thủ bằng Mã Tấu' },
    { id: 'stun_master', name: 'CÔN PHÁ ĐỊNH TÂM', desc: 'Dùng Côn gây Choáng Váng làm sụt định lực và tê liệt đối thủ' },
    { id: 'scissor_master', name: 'PHI KẸP CỔ VOVINAM', desc: 'Tung đòn kẹp cổ số 1 trứ danh của Vovinam quật ngã kẻ thù' },
    { id: 'counter_master', name: 'THẦN PHẢN ĐÒN', desc: 'Bắt bài đối phương với Phản Đòn Tay / Phản Đòn Chân chuẩn xác' },
    { id: 'deduction_master', name: 'ĐẠI THÁM TỬ GIA TỘC', desc: 'Giải mã thành công toàn bộ 5 kết luận trên Bảng Suy Luận Án Tình' },
    { id: 'ally_master', name: 'HỢP LỰC GIA TỘC', desc: 'Kêu gọi đồng minh tương trợ và tung đòn liên kích phối hợp' }
  ]
};

// Tra cứu nhanh: màn phụ gắn vào màn cha
Object.keys(STORY_META.stages).forEach((k) => {
  const s = STORY_META.stages[k];
  if (s.sideOf) STORY_META.sideOf[s.id] = s.sideOf;
});

// mainOrder: chuỗi màn CHÍNH (bỏ qua màn phụ) để kiểm tra điều kiện mở khóa
(function fixMainOrder() {
  const mains = Object.values(STORY_META.stages).filter((s) => s.type === 'main').sort((a, b) => a.id - b.id);
  STORY_META.mainOrder = {};
  mains.forEach((s, i) => {
    STORY_META.mainOrder[s.id] = { prev: i === 0 ? null : mains[i - 1].id, next: i === mains.length - 1 ? null : mains[i + 1].id };
  });
  // adjust "next" trên meta để khớp màn chính kế tiếp (bỏ qua màn phụ)
  mains.forEach((s, i) => {
    s.next = i === mains.length - 1 ? null : mains[i + 1].id;
  });
})();

function computeEndingId(choices) {
  const c = choices || {};
  const sm = window.saveManager;
  for (const e of STORY_META.endings) {
    if (e.condition(c, sm)) return e.id;
  }
  return 'huyetchien';
}

function getEnding(id) {
  return STORY_META.endings.find((e) => e.id === id) || STORY_META.endings[STORY_META.endings.length - 1];
}

function getActOfStage(id) {
  const s = STORY_META.stages[id];
  if (!s) return STORY_META.acts[0];
  return STORY_META.acts.find((a) => a.id === s.act) || STORY_META.acts[0];
}

window.STORY_META = STORY_META;
window.computeEndingId = computeEndingId;
window.getEnding = getEnding;
window.getActOfStage = getActOfStage;
