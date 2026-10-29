/**
 * VOVINAM: HUYẾT ÁN HỌ PHÓ — THE ERASED BLOODLINE
 * js/investigation.js - Hệ thống Biên Niên Sử Họ Phó, Điều Tra Bằng Chứng,
 *                     Độ Tin Nhiệm Nhân Vật & Sơ Đồ Mối Quan Hệ
 */

const INVESTIGATION_DOCUMENTS = {
  DOC_PHOTO_FAMILY: {
    id: 'DOC_PHOTO_FAMILY',
    type: 'photo',
    typeName: 'Ảnh Cũ Gia Tộc',
    title: 'BỨC ẢNH TỔ ĐÌNH BỊ RẠCH MẶT',
    timeFound: 'Đêm Hắc Lang — Màn 1 (Phòng mật cửa ngõ)',
    stageOrigin: 1,
    pickupX: 950,
    shortDesc: 'Ảnh chụp 10 năm trước tại Lục Gia Chủy. Nhân vật ngồi cạnh Mộc Đăng bị cào rách mặt cố ý.',
    content: `[TÀI LIỆU HÌNH ẢNH: PH-ARCHIVE-091]
Thời gian ghi nhận: 10 năm trước.
Địa điểm: Đại sảnh Lục Gia Chủy, Thượng Hải.

Bức ảnh chụp gia tộc họ Phó trong ngày ký hiệp ước liên minh công nghệ. 
Phó Mộc Đăng đứng ở hàng thứ hai với cặp kính gọng kim loại và nụ cười kín đáo.
Ngồi ở vị trí trung tâm — ghế của người thừa kế chính thức — là một thanh niên trẻ tuổi. Khuôn mặt người này đã bị một vật sắc nhọn rạch nát nhiều lần đến mức không thể nhận dạng.
Góc phải bức ảnh có vết cắt kéo thẳng, một người đứng cạnh đã bị cắt rời hoàn toàn khỏi khung hình.

Phía sau bức ảnh có dòng chữ viết tay mờ nhạt bằng bút máy:
"Người đã chết thì không cần danh phận. Kẻ sống tiếp mới là kẻ viết sử."`,
    decodedContent: `[KẾT QUẢ GIẢI MÃ KỸ THUẬT SỐ]
Khôi phục quang học cho thấy bóng hình bị cắt khỏi góc phải mang huy hiệu hoa văn Sơn Cước của Thập Vạn Đại Sơn — chính là Phó Đặng Hoàng Anh thời trẻ.
Vết rạch mặt trên người ngồi ghế trung tâm được thực hiện bằng dao phẫu thuật chuyên dụng, khớp với loại dụng cụ trong phòng thí nghiệm của Mộc Đăng.
Người bị xoá mặt mang nhẫn ngọc huyết chữ "Nghiệp" — cựu gia chủ đời thứ 3: Phó Khắc Nghiệp!`,
    unresolvedQuestion: 'Vì sao một người thừa kế chính thức lại bị cào mặt và hoàn toàn biến mất khỏi gia phả chính thống?',
    connections: [
      { target: 'mocdang', relation: 'Người sở hữu phòng lab có loại dao tạo ra vết rạch' },
      { target: 'hoanganh', relation: 'Bóng người bị cắt góc ảnh mang phù hiệu sơn cước' },
      { target: 'DOC_EXPULSION_ORDER', relation: 'Cùng niên đại với giai đoạn chuyển giao quyền lực bất thường' }
    ],
    answersQuestion: 1 // Câu hỏi 1: Ai thực sự đã chết hoặc bị xoá khỏi hồ sơ?
  },

  DOC_EXPULSION_ORDER: {
    id: 'DOC_EXPULSION_ORDER',
    type: 'expulsion',
    typeName: 'Lệnh Khai Trừ Gia Tộc',
    title: 'VĂN BẢN KHAI TRỪ PHÓ DUNG HẢI',
    timeFound: 'Hành Lang Tử Thủ — Màn 3 (Hộp kỹ thuật số)',
    stageOrigin: 3,
    pickupX: 1100,
    shortDesc: 'Nghị quyết chính thức trục xuất Dung Hải vì tội phản trắc, nhưng ngày tháng có dấu hiệu bị đè lên.',
    content: `[NGHỊ QUYẾT HỘI ĐỒNG GIA TỘC HỌ PHÓ — SỐ 04/KT-HP]
V/v: Khai trừ thành viên và lưu đày vĩnh viễn.

Xét thấy: Phó Dung Hải có hành vi tự ý sao chép tài liệu kỹ thuật mật và liên hệ với thế lực bên ngoài;
QUYẾT NGHỊ:
1. Tước toàn bộ quyền thừa kế, chức vụ và huy hiệu của Phó Dung Hải.
2. Trục xuất khỏi địa bàn Lục Gia Chủy và lưu đày 7 năm đến vùng Hắc Long Giang.
3. Nghiêm cấm mọi thành viên trong gia tộc liên lạc hoặc viện trợ.

Ký tên & đóng dấu:
(Dấu mộc đỏ: TRƯỞNG TỘC PHÓ MỘC ĐĂNG)
Ngày ban hành: 14 tháng 08 năm 2017`,
    decodedContent: `[PHÂN TÍCH PHÁP Y VĂN BẢN]
Dưới ánh sáng cực tím:
1. Dòng ngày tháng ban hành ban đầu là ngày "19 tháng 08 năm 2017" — tức SAU đêm kho dữ liệu trung tâm bị tấn công 5 ngày.
2. Nhưng con số đã bị cạo sửa thành "14 tháng 08 năm 2017" — tức TRƯỚC khi vụ việc xảy ra!
Điều này chứng tỏ: Lệnh khai trừ đã được chuẩn bị sẵn TỪ TRƯỚC KHI có bằng chứng Dung Hải phạm tội!
Dung Hải bị biến thành con dê tế thần để che giấu kẻ thực sự đột nhập máy chủ.`,
    unresolvedQuestion: 'Nếu lệnh khai trừ được lập sẵn trước khi kho dữ liệu bị cắp, ai là kẻ đã dàn dựng cái bẫy này?',
    connections: [
      { target: 'dunghai', relation: 'Nạn nhân bị vu cáo và tước quyền lợi' },
      { target: 'mocdang', relation: 'Người ký và đóng dấu quyết định sửa ngày' },
      { target: 'DOC_LETTER_TORN', relation: 'Nội dung thư mật xác nhận có sự dàn xếp trước' }
    ],
    answersQuestion: 2 // Câu hỏi 2: Vì sao Dung Hải bị khai trừ?
  },

  DOC_LETTER_TORN: {
    id: 'DOC_LETTER_TORN',
    type: 'letter',
    typeName: 'Thư Mật Bị Xé',
    title: 'BỨC THƯ MẬT TÔ CHÂU',
    timeFound: 'Phòng Giao Dịch Ngầm — Màn 4 (Két sắt sau lồng giam)',
    stageOrigin: 4,
    pickupX: 1850,
    shortDesc: 'Thư trao đổi riêng về việc đẩy Dung Hải ra ngoài để kiểm soát độc quyền mạch đất hiếm.',
    content: `[MẢNH THƯ TAY — GIẤY DẦU CAO CẤP]
"...việc của Dung Hải đã thu xếp xong. Hắn quá cứng đầu và nhất quyết muốn công khai kết quả khảo sát Mạch Đất Hiếm Thập Vạn Đại Sơn.
Nếu để hắn trình lên Hội Đồng Cổ Đông, Hoàng Anh sẽ can thiệp và chúng ta sẽ mất quyền ưu tiên độc quyền.
Lưu đày hắn 7 năm là ân huệ lớn nhất tôi có thể dành cho hắn.
Gửi cho ông bản sao đầu tiên của mã truy cập. Hãy giữ lời hứa: người mang họ Ngô không được phép chạm vào hạch tâm..."
(Phần chữ ký phía dưới bị xé rách cố tình)`,
    decodedContent: `[ĐỐI CHIẾU CHỮ VIẾT TAY & DẤU VẾT]
Nét chữ hoa nghiêng 15 độ trùng khớp hoàn toàn với mẫu bút tích của Phó Mộc Đăng.
Người nhận bức thư: Dấu niêm phong sáp đỏ có hình chim ưng bóng đêm — biểu tượng của Hứa Vũ Đại!
Hứa Vũ Đại và Mộc Đăng đã bắt tay từ 7 năm trước để hất cẳng Dung Hải và cô lập Hoàng Anh trên núi.`,
    unresolvedQuestion: 'Hứa Vũ Đại đã nhận được mã truy cập hạch tâm, vậy tại sao Long Vương lại bắt cóc ông ta?',
    connections: [
      { target: 'huavudai', relation: 'Người nhận bức thư bị xé và giữ mã truy cập' },
      { target: 'mocdang', relation: 'Người trực tiếp viết thư thỏa thuận ngầm' },
      { target: 'dunghai', relation: 'Mục tiêu bị loại bỏ khỏi thỏa thuận khai thác' }
    ],
    answersQuestion: 2
  },

  DOC_MINUTES_CLAN: {
    id: 'DOC_MINUTES_CLAN',
    type: 'minutes',
    typeName: 'Biên Bản Nội Bộ',
    title: 'BIÊN BẢN HỎI CUNG THẨM MẬT',
    timeFound: 'Bến Cảng Hạ Tầng — Màn 6 (Hòm hồ sơ container)',
    stageOrigin: 6,
    pickupX: 1650,
    shortDesc: 'Lời khai mâu thuẫn sâu sắc giữa cận vệ họ Triệu và nhân chứng đêm xảy ra huyết án.',
    content: `[BIÊN BẢN LỜI KHAI NỘI BỘ — HỒ SƠ 88]
Lời khai Nhân chứng A (Vệ sĩ Triệu gia):
"Đêm đó trên Đoạn Nghĩa Đài, người rút vũ khí đầu tiên không phải người họ Ngô. Tôi thấy ánh đèn flash của thiết bị ghi âm từ phía Phó Mộc Đăng..."

Lời khai Nhân chứng B (Đình Bích Lâm ghi nhận):
"Dung Hải đã chạy đến can ngăn, nhưng khi hắn đến thì mọi sự đã rồi. Người chết nằm dưới chân đài, còn hồ sơ khảo sát đã biến mất cùng người của Hứa Vũ Đại."

Ghi chú bên lề: "Hai lời khai này bị xóa khỏi báo cáo chính thức nộp cho cảnh sát kinh tế."`,
    decodedContent: `[PHÂN TÍCH LIÊN KẾT MANH MỐI]
Đoạn Nghĩa Đài Tô Châu 7 năm trước không phải là cuộc quyết chiến ngẫu nhiên, mà là một vụ bẫy có chủ đích.
Mộc Đăng đã kích động mối thù giữa Ngô Giang Mạnh và các phe, nhân lúc hỗn loạn để Hứa Vũ Đại cướp tài liệu, sau đó đổ hết tội danh lên đầu Phó Dung Hải.`,
    unresolvedQuestion: 'Ai là người thực sự đã chết dưới chân Đoạn Nghĩa Đài đêm hôm đó?',
    connections: [
      { target: 'bichlam', relation: 'Người thu thập và bảo quản bản sao biên bản' },
      { target: 'giangmanh', relation: 'Một bên trong cuộc đụng độ tại Đoạn Nghĩa Đài' },
      { target: 'DOC_PHOTO_FAMILY', relation: 'Khớp với nạn nhân bị xoá mặt trong ảnh' }
    ],
    answersQuestion: 1
  },

  DOC_AUDIO_MOCDANG: {
    id: 'DOC_AUDIO_MOCDANG',
    type: 'audio',
    typeName: 'Ghi Âm Phó Mộc Đăng',
    title: 'ĐOẠN GHI ÂM TẦNG SỐ RIÊNG',
    timeFound: 'Trạm Sát Thủ Ngầm — Màn 7 (Bộ đàm giấu trong tủ điện)',
    stageOrigin: 7,
    pickupX: 1850,
    shortDesc: 'Đoạn băng ban đầu là chỉ dẫn đường đi, phần sau ghi lại cuộc trò chuyện giấu kín của Mộc Đăng.',
    content: `[BĂNG GHI ÂM MẬT: BĂNG TẦN 142.8 MHz]
(Giọng Mộc Đăng hướng dẫn Nghị đột nhập trạm sát thủ):
"Nghị, trạm này có ba cửa ngầm. Hãy tiến vào cửa hướng Bắc. Dung Hải đang ở đó. Hắn rất nguy hiểm, đừng để hắn nói chuyện làm phân tâm..."

(Nhiễu sóng... Khoảng lặng 12 giây... Đoạn ghi âm tự động ghi đè cuộc gọi riêng của Mộc Đăng):
"Alo? Hắn đã vào trong chưa? Tốt. Để Nghị và Dung Hải triệt hạ lẫn nhau. Dù ai sống sót, kẻ đó cũng sẽ mang vết thương nặng. Lúc đó đội thanh trừng của tôi sẽ vào thu hồi tài liệu gốc. Không để một trang nào lọt ra Thập Vạn Đại Sơn."`,
    decodedContent: `[GIẢI MÃ PHỔ ÂM THANH]
Mộc Đăng không bao giờ muốn Nghị hay Dung Hải sống sót với toàn bộ sự thật.
Chiến dịch "giải cứu" và "truy tìm phản trắc" chỉ là nước cờ Mộc Đăng mượn tay Vovinam của Nghị để tiêu diệt các nhân chứng cuối cùng của vụ án năm xưa.`,
    unresolvedQuestion: 'Mộc Đăng hành động vì quyền lực cá nhân, hay có một áp lực khủng khiếp nào đang đe dọa gia tộc họ Phó?',
    connections: [
      { target: 'mocdang', relation: 'Chủ nhân đoạn ghi âm thao túng thông tin' },
      { target: 'dunghai', relation: 'Mục tiêu bị đưa vào bẫy triệt hạ song phương' },
      { target: 'nghi', relation: 'Công cụ bị lợi dụng trong kế hoạch mượn đao giết người' }
    ],
    answersQuestion: 3 // Câu hỏi 3: Ai tạo ra hồ sơ và mục đích thật sự?
  },

  DOC_RESOURCE_MAP: {
    id: 'DOC_RESOURCE_MAP',
    type: 'resource',
    typeName: 'Hồ Sơ Mạch Đất Hiếm',
    title: 'BẢN ĐỒ CHIẾN LƯỢC THẬP VẠN ĐẠI SƠN',
    timeFound: 'Thập Vạn Đại Sơn — Màn 8 (Bệ thờ cổ trên đỉnh vách đá)',
    stageOrigin: 8,
    pickupX: 1800,
    shortDesc: 'Bản đồ địa chất quân sự và di chúc của cựu gia chủ trao quyền bảo vệ cho Hoàng Anh.',
    content: `[HỒ SƠ KHẢO SÁT ĐỊA CHẤT & DI CHÚC TỘC TRƯỞNG KHẮC NGHIỆP]
"Thập Vạn Đại Sơn không chỉ là mạch đất hiếm trị giá hàng chục tỷ đô la. 
Ẩn dưới tầng đá granit là Hạch Tâm Lượng Tử Xích Huyết — thành quả nghiên cứu cả đời của dòng máu họ Phó.
Nếu để nó rơi vào tay kẻ muốn dùng công nghệ làm vũ khí bá chủ, thiên hạ sẽ đại loạn.
Ta giao quyền trấn thủ đỉnh núi và chìa khóa phong ấn cho Phó Đặng Hoàng Anh.
Chỉ khi nào ba chi họ Phó hòa giải trong sự thật, cánh cửa này mới được mở."`,
    decodedContent: `[ĐỐI CHIẾU DI CHÚC & ẤN TÍN]
Chữ ký của Phó Khắc Nghiệp — người anh cả bị xoá mặt trong ảnh cũ!
Hoàng Anh không cố chấp giữ núi vì tiền. Anh đang thi hành di nguyện cuối cùng của người đã khuất để ngăn Mộc Đăng bán hạch tâm cho các tập đoàn quân sự xuyên lục địa.`,
    unresolvedQuestion: 'Khi ba sự thật từ Mộc Đăng, Dung Hải và Hoàng Anh đối đầu, ai mới là người xứng đáng quyết định tương lai hạch tâm?',
    connections: [
      { target: 'hoanganh', relation: 'Người nắm giữ chìa khóa phong ấn di chúc' },
      { target: 'DOC_PHOTO_FAMILY', relation: 'Người ký di chúc chính là người bị cào mặt trong ảnh' },
      { target: 'DOC_CIPHER_CORE', relation: 'Chìa khóa mở tầng ngầm lượng tử' }
    ],
    answersQuestion: 3
  },

  DOC_CIPHER_CORE: {
    id: 'DOC_CIPHER_CORE',
    type: 'cipher',
    typeName: 'Hạch Tâm Mật Mã',
    title: 'HẠCH TÂM LƯỢNG TỬ XÍCH HUYẾT — PHẦN GỐC',
    timeFound: 'Đại Điện Triệu Gia — Màn 10 (Hộp tráp dát vàng của Vinh Tâm)',
    stageOrigin: 10,
    pickupX: 1750,
    shortDesc: 'Nửa mảnh vi mạch gốc còn lại, chứng minh Triệu gia chỉ là kẻ mua lại thông tin từ kẻ phản bội thực sự.',
    content: `[VẬT CHỨNG: BẢN THẢO THIẾT KẾ VI MẠCH XÍCH HUYẾT]
Bản thảo có chữ ký xác nhận bản quyền của cố Tộc Trưởng Phó Khắc Nghiệp và Ngô Giang Mạnh (thời còn liên minh).
Phía dưới có biên lai thanh toán: Triệu Vinh Tâm đã chuyển 50 triệu USD vào một tài khoản nặc danh tại Thụy Sĩ để mua thông tin định vị núi Thập Vạn Đại Sơn.
Chủ tài khoản thụ hưởng mang mật danh: "KIẾN TRÚC SƯ THẦN SỐ" — mã định danh cá nhân của Phó Mộc Đăng!`,
    decodedContent: `[BẰNG CHỨNG TỐI HẬU]
Mộc Đăng không phải bán hạch tâm vì tham tiền. 
Số tiền 50 triệu USD được dùng để cứu tập đoàn họ Phó thoát khỏi đợt khủng hoảng thanh khoản 7 năm trước. 
Mộc Đăng đã bán một phần bí mật của người anh đã khuất để đổi lấy sự sống còn cho cả gia tộc — một tội ác sinh ra từ sự tuyệt vọng và trách nhiệm tàn nhẫn!`,
    unresolvedQuestion: 'Sự thật đã phơi bày toàn bộ. Giờ đây Ngô Nhất Nghị sẽ phán xét hay hòa giải?',
    connections: [
      { target: 'vinhtam', relation: 'Kẻ chi tiền mua hạch tâm' },
      { target: 'mocdang', relation: 'Người thực hiện giao dịch ngầm cứu gia tộc' },
      { target: 'giangmanh', relation: 'Người từng đồng phát triển vi mạch trước khi bị phản bội' }
    ],
    answersQuestion: 3
  }
};

/**
 * Quản lý logic Biên Niên Sử, Bằng Chứng, Quyền Nắm Giữ & Độ Tin Nhiệm
 */
class InvestigationManager {
  constructor() {
    this.docs = INVESTIGATION_DOCUMENTS;
    this.selectedDocId = 'DOC_PHOTO_FAMILY';
    this.activeFilter = 'all'; // 'all', 'photo', 'letter', 'expulsion', 'audio', 'resource'
    this.graphCanvas = null;
    this.graphCtx = null;
  }

  // Khởi tạo các trường điều tra trong SaveManager nếu chưa có
  ensureState(sm) {
    if (!sm) return;
    const d = sm.data;
    if (!Array.isArray(d.evidenceFound)) d.evidenceFound = [];
    if (!d.evidenceCustody || typeof d.evidenceCustody !== 'object') d.evidenceCustody = {};
    if (!Array.isArray(d.evidenceDestroyed)) d.evidenceDestroyed = [];
    if (!Array.isArray(d.evidenceDecoded)) d.evidenceDecoded = [];
    if (!d.characterTrust || typeof d.characterTrust !== 'object') {
      d.characterTrust = { mocdang: 50, dunghai: 30, hoanganh: 40, huavudai: 60, giangmanh: 20 };
    }
    if (!d.storyFlags || typeof d.storyFlags !== 'object') d.storyFlags = {};
    if (!d.allyAvailability || typeof d.allyAvailability !== 'object') {
      d.allyAvailability = { hoanganh: false, dunghai: false, mocdang: false, bichlam: false };
    }
    if (!Array.isArray(d.flashbackChoices)) d.flashbackChoices = [];
  }

  isFound(docId) {
    const sm = window.saveManager;
    if (!sm) return false;
    this.ensureState(sm);
    return sm.data.evidenceFound.includes(docId);
  }

  isDecoded(docId) {
    const sm = window.saveManager;
    if (!sm) return false;
    this.ensureState(sm);
    return sm.data.evidenceDecoded.includes(docId);
  }

  isDestroyed(docId) {
    const sm = window.saveManager;
    if (!sm) return false;
    this.ensureState(sm);
    return sm.data.evidenceDestroyed.includes(docId);
  }

  getCustody(docId) {
    const sm = window.saveManager;
    if (!sm) return 'none';
    this.ensureState(sm);
    return sm.data.evidenceCustody[docId] || 'nghi';
  }

  getTrust(charId) {
    const sm = window.saveManager;
    if (!sm) return 50;
    this.ensureState(sm);
    return sm.data.characterTrust[charId] ?? 50;
  }

  adjustTrust(charId, delta, reason = '') {
    const sm = window.saveManager;
    if (!sm) return;
    this.ensureState(sm);
    const prev = sm.data.characterTrust[charId] || 50;
    const next = Math.max(0, Math.min(100, prev + delta));
    sm.data.characterTrust[charId] = next;
    sm.persist();

    // Cập nhật tính sẵn sàng của đồng minh
    this.updateAllyStatus();

    const sign = delta > 0 ? '+' : '';
    const charName = (window.CHARACTERS && window.CHARACTERS[charId]) ? window.CHARACTERS[charId].name : charId;
    if (window.uiManager) {
      window.uiManager.showToast(`TÍN NHIỆM [${charName}]: ${sign}${delta} (${next}/100) ${reason ? '— ' + reason : ''}`);
    }
  }

  updateAllyStatus() {
    const sm = window.saveManager;
    if (!sm) return;
    this.ensureState(sm);
    const t = sm.data.characterTrust;
    sm.data.allyAvailability.hoanganh = (t.hoanganh >= 65);
    sm.data.allyAvailability.dunghai = (t.dunghai >= 60);
    sm.data.allyAvailability.mocdang = (t.mocdang >= 70);
    sm.data.allyAvailability.bichlam = sm.isMissionDone('truce_bichlam');
    sm.persist();
  }

  // Thu thập tài liệu khi người chơi nhặt được trong màn chơi
  collectEvidence(docId) {
    const sm = window.saveManager;
    if (!sm || !this.docs[docId]) return false;
    this.ensureState(sm);

    if (sm.data.evidenceFound.includes(docId)) return false;
    sm.data.evidenceFound.push(docId);
    if (!sm.data.evidenceCustody[docId]) sm.data.evidenceCustody[docId] = 'nghi';
    sm.persist();

    const doc = this.docs[docId];
    if (window.uiManager) {
      window.uiManager.showToast(`MANH MỐI MỚI: ${doc.title}`);
    }
    if (window.audioManager && typeof window.audioManager.playChime === 'function') {
      try { window.audioManager.playChime(); } catch (_) {}
    }
    return true;
  }

  // Giải mã tài liệu (phân tích chi tiết)
  decodeEvidence(docId) {
    const sm = window.saveManager;
    if (!sm || !this.docs[docId]) return false;
    this.ensureState(sm);

    if (!sm.data.evidenceFound.includes(docId)) return false;
    if (sm.data.evidenceDecoded.includes(docId)) return false;

    sm.data.evidenceDecoded.push(docId);
    sm.persist();

    if (window.audioManager && typeof window.audioManager.playSuccess === 'function') {
      try { window.audioManager.playSuccess(); } catch (_) {}
    }
    if (window.uiManager) window.uiManager.showToast(`ĐÃ GIẢI MÃ TÀI LIỆU: ${this.docs[docId].title}`);
    return true;
  }

  // Xử lý quyền nắm giữ bằng chứng (Giao / Công khai / Tiêu hủy / Giữ lại)
  handleEvidenceCustody(docId, decision, targetChar = null) {
    const sm = window.saveManager;
    if (!sm || !this.docs[docId]) return;
    this.ensureState(sm);

    const doc = this.docs[docId];
    if (decision === 'keep') {
      sm.data.evidenceCustody[docId] = 'nghi';
      this.adjustTrust('nghi', 0, 'Giữ lại trong hồ sơ cá nhân');
    } else if (decision === 'handover' && targetChar) {
      sm.data.evidenceCustody[docId] = targetChar;
      if (targetChar === 'mocdang') {
        this.adjustTrust('mocdang', +25, 'Được bạn chia sẻ thông tin');
        this.adjustTrust('dunghai', -20, 'Nghi ngờ bạn thông đồng với Mộc Đăng');
        this.decodeEvidence(docId); // Mộc Đăng giải mã ngay
      } else if (targetChar === 'dunghai') {
        this.adjustTrust('dunghai', +30, 'Bạn lắng nghe góc nhìn bị chôn vùi');
        this.adjustTrust('mocdang', -20, 'Phát hiện tài liệu rò rỉ cho kẻ lưu đày');
      } else if (targetChar === 'hoanganh') {
        this.adjustTrust('hoanganh', +25, 'Tôn trọng di nguyện bảo vệ sơn hà');
        this.adjustTrust('huavudai', -15, 'Mạng lưới mất lợi thế thông tin');
      } else if (targetChar === 'huavudai') {
        this.adjustTrust('huavudai', +25, 'Cung cấp vũ khí thông tin cho ông trùm');
        this.adjustTrust('hoanganh', -20, 'Biến hồ sơ thành món hàng mua bán');
      }
    } else if (decision === 'public') {
      sm.data.evidenceCustody[docId] = 'public';
      this.decodeEvidence(docId);
      this.adjustTrust('giangmanh', +35, 'Minh bạch hoá Đoạn Nghĩa Đài');
      this.adjustTrust('mocdang', -35, 'Làm sụp đổ thế độc quyền kiểm soát');
      this.adjustTrust('hoanganh', +10, 'Sự thật không còn bị trói buộc');
    } else if (decision === 'destroy') {
      sm.data.evidenceCustody[docId] = 'destroyed';
      if (!sm.data.evidenceDestroyed.includes(docId)) {
        sm.data.evidenceDestroyed.push(docId);
      }
      this.adjustTrust('mocdang', +15, 'Tiêu huỷ mầm mống bất ổn gia tộc');
      this.adjustTrust('dunghai', -40, 'Mất vĩnh viễn cơ hội minh oan');
      this.adjustTrust('giangmanh', -30, 'Coi bạn là kẻ đồng lõa che giấu');
    }

    sm.persist();
  }

  // Kiểm tra điều kiện mở ending bí mật: "Huyết Mạch Khôi Phục"
  canUnlockSecretEnding() {
    const sm = window.saveManager;
    if (!sm) return false;
    this.ensureState(sm);
    const required = ['DOC_PHOTO_FAMILY', 'DOC_EXPULSION_ORDER', 'DOC_AUDIO_MOCDANG', 'DOC_RESOURCE_MAP', 'DOC_CIPHER_CORE'];
    const hasAll = required.every(id => sm.data.evidenceFound.includes(id) && sm.data.evidenceDecoded.includes(id));
    const trustBalanced = sm.data.characterTrust.mocdang >= 40 && sm.data.characterTrust.dunghai >= 40 && sm.data.characterTrust.hoanganh >= 50;
    return hasAll && trustBalanced && !sm.data.evidenceDestroyed.length;
  }
}

// Khởi tạo global instance
window.INVESTIGATION_DOCUMENTS = INVESTIGATION_DOCUMENTS;
window.InvestigationManager = InvestigationManager;
window.investigationManager = new InvestigationManager();
