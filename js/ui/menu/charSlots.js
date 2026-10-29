/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/ui/menu/charSlots.js - Du lieu hien thi 12 o nhan vat trong man Chon Nhan Vat.
 *
 * Day la du lieu UI (ten, mau, anh, mo ta, skin...), khong phai data gameplay.
 * Logic nam o js/ui/menu/charSelect.js.
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

window.CHAR_SLOTS = CHAR_SLOTS;
