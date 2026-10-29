/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/roster.js - Hệ thống Phe Phái + Hồ Sơ Nhân Vật (dossier) + thông số chiến đấu
 *
 * CHARACTERS[id].combat  : thông số dùng trực tiếp bởi Player (nhân vật chơi được)
 * CHARACTERS[id].*       : tiểu sử, động cơ, quan hệ, kỹ năng, điều kiện mở khóa
 * FACTIONS[id]           : biểu tượng, bảng màu, bối cảnh, kiểu đối thủ, nhiệm vụ, vai trò cốt truyện
 */

const FACTIONS = {
  vovinam: {
    id: 'vovinam',
    name: 'VIỆT VÕ ĐẠO — VOVINAM',
    short: 'VOVINAM',
    sigil: '★',
    colors: { primary: '#0088ff', secondary: '#38bdf8', dark: '#0a1b34', glow: 'rgba(0,136,255,0.55)' },
    arena: 'Võ đường & đường phố đêm',
    enemyStyle: 'Không có chiến trường riêng — Nghị chiến đấu một mình, dựa vào thân pháp vàcombo liên hoàn.',
    missions: ['Giải cứu Hứa Vũ Đại', 'Thoát khỏi căn cứ sau vụ tập kích'],
    influence: 'Là điểm cân bằng duy nhất giữa các gia tộc: không sở hữu tài nguyên, chỉ có lòng trung thành và sự thật.',
  },
  hua: {
    id: 'hua',
    name: 'MẠNG LƯỚI NGẦM — HỨA VŨ ĐẠI',
    short: 'HỨA VŨ ĐẠI',
    sigil: '◈',
    colors: { primary: '#c1121f', secondary: '#ff5a5f', dark: '#1b0d10', glow: 'rgba(193,18,31,0.5)' },
    arena: 'Bê tông, thép, đèn đỏ — kho lạnh, đường hầm, phòng giao dịch ngầm',
    enemyStyle: 'Lính đánh thuê, võ sĩ thân pháp, thiết giáp, sát thủ hắc ám (Hắc Lang, Thiết Quyền, Huyết Ảnh, Long Vương)',
    missions: ['Nhiệm vụ A: Giải cứu Hứa Vũ Đại', 'Nhiệm vụ B: Điều tra hồ sơ bị đánh cắp', 'Thoát khỏi căn cứ (nhiệm vụ phụ)'],
    influence: 'Xuất phát điểm của game và nơi người chơi khám phá bí mật đầu tiên. Hứa Vũ Đại giữ manh mối về hồ sơ.'
  },
  pho: {
    id: 'pho',
    name: 'HỌ PHÓ — ĐẾ CHẾ CÔNG NGHỆ',
    short: 'HỌ PHÓ',
    sigil: '⬡',
    colors: { primary: '#ffd700', secondary: '#00d2ff', dark: '#111318', glow: 'rgba(255,215,0,0.45)' },
    arena: 'Kiến trúc hiện đại, phòng chiến thuật, trạm quan sát, đèn vàng kim + xanh lạnh',
    enemyStyle: 'Công nghệ giám sát, vệ sĩ trang bị, Phố Dung Hải (phản trắc), Phó Đặng Hoàng Anh (trấn thủ sơn cước)',
    missions: ['Nhiệm vụ E: Truy tìm Phó Dung Hải', 'Nhiệm vụ D: Đối đầu Phó Đặng Hoàng Anh'],
    influence: 'Cung cấp thông tin, thiết bị, phân tích điểm yếu boss qua Phó Mộc Đăng — và cũng là nơi chứa nhiều xung đột nội bộ nhất.'
  },
  ngo: {
    id: 'ngo',
    name: 'HỌ NGÔ — THẾ LỰC BÓNG TỐI',
    short: 'HỌ NGÔ',
    sigil: '◆',
    colors: { primary: '#64748b', secondary: '#7dd3fc', dark: '#0c1118', glow: 'rgba(125,211,252,0.35)' },
    arena: 'Chiến trường ít ánh sáng, kiến trúc kín đáo, sương lạnh, đá đen ướt',
    enemyStyle: 'Sát thủ chính xác, ít di chuyển, phản công mạnh — Ngô Giang Mạnh và tay chân bóng tối',
    missions: ['Nhiệm vụ F: Đối thoại với Ngô Giang Mạnh'],
    influence: 'Tạo nhiệm vụ điều tra, đối đầu và lựa chọn khó khăn. Giang Mạnh không phải phản diện cuối cùng — hắn có thù riêng với họ Phó.'
  },
  trieu: {
    id: 'trieu',
    name: 'HỌ TRIỆU — CỰU HOÀNG TỘC',
    short: 'HỌ TRIỆU',
    sigil: '♛',
    colors: { primary: '#d4a017', secondary: '#c1121f', dark: '#1a1004', glow: 'rgba(212,160,23,0.5)' },
    arena: 'Đại điện, cột đá dát vàng, thảm đỏ viền vàng, ánh sáng vàng và chi tiết kiến trúc gia tộc',
    enemyStyle: 'Cận vệ phòng thủ chắc, chuỗi đòn nặng, nghi thức — Triệu Đình An trước Vinh Tâm',
    missions: ['Nhiệm vụ C: Vượt qua tuyến phòng thủ của Triệu gia'],
    influence: 'Các trận boss có tính nghi thức, phòng thủ và nhiều giai đoạn. Vinh Tâm muốn chiếm toàn bộ hồ sơ bí mật.'
  },
  doclap: {
    id: 'doclap',
    name: 'DU HIỆP — THẾ LỰC ĐỘC LẬP',
    short: 'ĐỘC LẬP',
    sigil: '✧',
    colors: { primary: '#22c55e', secondary: '#a3e635', dark: '#0b1a12', glow: 'rgba(34,197,94,0.4)' },
    arena: 'Bến cảng, kho ven sông, chỗ ở tạm bợ',
    enemyStyle: 'Không phe phái — đánh nhanh, áp sát, phản công và đẩy lùi',
    missions: ['Nhiệm vụ phụ: Thử thách của Đình Bích Lâm'],
    influence: 'Bích Lâm là đồng minh ngang tàng: anh ta đến vì tò mò, ở lại vì ghét sự giả trung thành.'
  }
};

const CHARACTERS = {
  // =========================================================================
  // NHÂN VẬT 1 — NGÔ NHẤT NGHỊ (mặc định)
  // =========================================================================
  nghi: {
    id: 'nghi',
    name: 'Ngô Nhất Nghị',
    title: 'SÁT THẦN VIỆT VÕ ĐẠO',
    faction: 'vovinam',
    styleType: 'player',
    portrait: 'player',
    playable: true,
    isDefault: true,
    role: 'Nhân vật chính, cao thủ Vovinam, hộ vệ số một của Hứa Vũ Đại.',
    motive: 'Bảo vệ ông chủ và tìm ra sự thật sau hồ sơ bí mật — dù sự thật có quay lưng với ông ta.',
    bio: 'Nghị lớn lên trong võ đường, được đào tạo theo Việt Võ Đạo. Hắn không quan tâm chính trị gia tộc, chỉ quan tâm ai đang nói dối. Đêm nay hắn một mình đột nhập căn cứ đối địch để giải cứu Hứa Vũ Đại — và rồi phát hiện mình đang đứng giữa một ván cờ lớn hơn mình tưởng.',
    fightingStyle: 'Tốc độ cao, combo liên hoàn, đấm – đá – né – phản đòn, đòn chân bay biểu diễn, áp sát và thoát vòng vây.',
    strengths: 'Nhanh, nhiều đòn nối, Perfect Dodge gây sát thương phản công lớn, hồi năng lượng liên tục.',
    weaknesses: 'Sức chống chịu không quá cao; tung đòn mạnh sai thời điểm sẽ bị phản công.',
    skills: [
      { name: 'Liên Hoàn Quyền Cước', desc: 'J→J→K và J→K→K: chuỗi đấm đá nối mượt, chốt bằng đòn bật lùi.' },
      { name: 'Đòn Thế Vovinam Mở Rộng', desc: 'Giữ ↑ + J: Đấm Móc Lên hất tung đối thủ. Giữ ↓ + J: Đánh Chỏ phá thủ. Giữ ↓ + K: Quét Trụ đòn thấp quật ngã. Shift + J: Lao Tới Đấm Móc. Trên không + J: Phi Quyền.' },
      { name: 'Đòn Chân Kẹp', desc: 'Khi áp sát và đã nối 2 đòn: nhảy kẹp cổ quật ngã (không áp dụng lên boss).' },
      { name: 'Phản Đòn Hoàn Hảo', desc: 'L đúng lúc đối thủ ra đòn → time-slow → đòn trừng phạt bạo kích.' },
      { name: 'Đá Bay Phi Thân', desc: 'Nhảy + K: lao xuyên đối thủ, sát thương cao, có knockdown.' }
    ],
    ultimate: { name: 'LONG HỔ XUẤT SƠN', desc: 'Chuỗi đòn liên hoàn xanh lam + nổ năng lượng cuối, gây sát thương diện rộng toàn màn.' },
    stats: { power: 3, speed: 5, defense: 2, technique: 5, range: 2 },
    relations: [
      { who: 'Hứa Vũ Đại', rel: 'Ông chủ — người hắn trung thành' },
      { who: 'Phó Đặng Hoàng Anh', rel: 'Đối trọng về phong cách: nhanh vs nặng' },
      { who: 'Ngô Giang Mạnh', rel: 'Cùng họ nhưng không cùng mục đích' }
    ],
    events: ['Hồi I: Đột nhập, đánh bại Long Vương, giải cứu Hứa Vũ Đại', 'Hồi II: Nhận lệnh truy tìm kẻ bán đứng', 'Hồi V: Đối mặt Đoạn Nghĩa Đài'],
    unlock: { type: 'default', text: 'Nhân vật mặc định — luôn mở khóa' },
    combat: {
      hp: 1000, speed: 230, runSpeed: 380, jumpForce: 520,
      damage: 1.15, reach: 1, knockback: 1, energyGain: 1,
      finisher: 'scissor', ultimateState: 'ultimate_flurry', ultimateType: 'flurry',
      mechanic: 'Combo liên hoàn + Đòn chân kẹp + Phản đòn hoàn hảo'
    }
  },

  // =========================================================================
  // NHÂN VẬT 2 — HỨA VŨ ĐẠI
  // =========================================================================
  huavudai: {
    id: 'huavudai',
    name: 'Hứa Vũ Đại',
    title: 'ÔNG TRÙM MẠNG LƯỚI NGẦM',
    faction: 'hua',
    styleType: 'npc_huavudai',
    portrait: 'npc_huavudai',
    playable: true,
    role: 'Ông trùm được giải cứu, nhân vật trung tâm của âm mưu.',
    motive: 'Giữ mạng lưới của mình sống sót — và giữ bí mật về hồ sơ lâu nhất có thể.',
    bio: 'Hứa Vũ Đại không phải thánh nhân. Hắn xây mạng lưới ngầm bằng thông tin, không bằng lòng trung thành. Khi được giải cứu, hắn chỉ nói: "Muốn biết ai đứng sau chuyện này, mày phải sống sót qua đêm nay đã."',
    fightingStyle: 'Thực dụng và thiếu chính quy: đẩy, húc, đá lùi, ra lệnh hỗ trợ từ xa. Không tuyệt kỹ võ thuật phi lý.',
    strengths: 'Đòn đẩy tạo khoảng cách lớn, ra lệnh cho Mộc Đăng gọi strike hỗ trợ, không dễ bị khống chế bởi crowd.',
    weaknesses: 'Sát thương mỗi đòn thấp, không có kỹ thuật Vovinam, không combo được như Nghị.',
    skills: [
      { name: 'Xô Bật', desc: 'Đòn tay đẩy đối thủ ra xa, tạo khoảng thở.' },
      { name: 'Đá Lùi Vội', desc: 'Khoảng cách xa, knockback mạnh, sát thương thấp.' },
      { name: 'Mệnh Lệnh Ngầm', desc: 'Tuyệt kỹ: gọi Mộc Đăng thả strike hỗ trợ vào khu vực trước mặt.' }
    ],
    ultimate: { name: 'MỆNH LỆNH NGẦM', desc: 'Gọi strike hỗ trợ — nổ diện rộng phía trước, không cần cận chiến.' },
    stats: { power: 2, speed: 3, defense: 3, technique: 1, range: 4 },
    relations: [
      { who: 'Ngô Nhất Nghị', rel: 'Tên cận vệ trung thành nhất' },
      { who: 'Phó Mộc Đăng', rel: 'Kẻ hắn vẫn dùng như một quân cờ' },
      { who: 'Long Vương', rel: 'Kẻ đã bắt cóc hắn' }
    ],
    events: ['Hồi I: Được giải cứu nhưng giấu toàn bộ sự thật', 'Màn chơi phụ: Chạy trốn hầm ngầm (điều khiển Hứa Vũ Đại)'],
    unlock: { type: 'stage', stage: 4, text: 'Hoàn thành Hồi I (Màn 4 — Giải cứu Hứa Vũ Đại)' },
    combat: {
      hp: 900, speed: 210, runSpeed: 340, jumpForce: 470,
      damage: 1.0, reach: 1.1, knockback: 1.7, energyGain: 1.1,
      finisher: 'shove', ultimateState: 'ultimate_command', ultimateType: 'command',
      mechanic: 'Đòn đẩy diện rộng + Gọi hỗ trợ từ xa'
    }
  },

  // =========================================================================
  // NHÂN VẬT 3 — PHÓ ĐẶNG HOÀNG ANH
  // =========================================================================
  hoanganh: {
    id: 'hoanganh',
    name: 'Phó Đặng Hoàng Anh',
    title: 'TRẤN THỦ THẬP VẠN ĐẠI SƠN',
    faction: 'pho',
    styleType: 'boss_hoanganh',
    portrait: 'boss_hoanganh',
    playable: true,
    role: 'Võ sĩ trấn thủ Thập Vạn Đại Sơn — đối trọng với tốc độ của Ngô Nhất Nghị.',
    motive: 'Bảo vệ gia đình, vùng đất và di nguyện của người đã khuất. Không vì tiền thưởng, không vì danh tiếng.',
    bio: 'Hoàng Anh sống bằng luật của núi: ai bước qua ranh giới, người đó phải trả giá. Hắn biết hồ sơ bí mật nằm trong tay ai, và hắn không định giao nó cho bất kỳ ai đang ra lệnh từ xa.',
    fightingStyle: 'Chậm nhưng mạnh, tầm đánh rộng, đỡ đòn và phản công, đòn nặng rung mặt đất, gián đoạn combo thiếu tính toán. Vũ khí nhận diện: cây cuốc sắt đặc chế.',
    strengths: 'Sức mạnh vượt trội, kiểm soát khoảng cách, super armor với đòn nhẹ, AoE mặt đất bắt buộc phải nhảy.',
    weaknesses: 'Sau mỗi đòn rộng là khoảng trống rõ ràng — đọc nhịp và phản công đúng lúc là con đường thắng.',
    skills: [
      { name: 'Quét Cuốc Ngang', desc: 'Tầm rộng lớn, telegraph rõ, lùi lại là né được.' },
      { name: 'Đập Mặt Đất', desc: 'Rung động AoE — chỉ an toàn khi đang ở trên không.' },
      { name: 'Chuỗi Liên Hoàn Nặng', desc: 'Giai đoạn 3: 3 đòn liên tiếp, mỗi đòn đều báo trước.' },
      { name: 'Xem Nhẹ Đòn Nhẹ', desc: 'Super armor: đòn thường gây 50% và không làm hắn chùn bước.' }
    ],
    ultimate: { name: 'THỔNG SƠN CHÙY', desc: 'Nện cuốc xuống đất: sóng xung kích 2 bên + knockdown diện rộng.' },
    stats: { power: 5, speed: 2, defense: 5, technique: 3, range: 5 },
    relations: [
      { who: 'Ngô Nhất Nghị', rel: 'Đối trọng phong cách: nặng vs nhanh' },
      { who: 'Phó Mộc Đăng', rel: 'Cùng họ nhưng khác cách nhìn về hồ sơ' },
      { who: 'Hứa Vũ Đại', rel: 'Không tin một lời nào từ mạng lưới ngầm' }
    ],
    events: ['Hồi III: Đối đầu Nghị trên núi — bước ngoặt về lựa chọn', 'Chọn "Ở lại nghe sự thật" sẽ mở Kết Thức Chân Tướng'],
    unlock: { type: 'stage', stage: 8, text: 'Hoàn thành Hồi III (Màn 8 — Thập Vạn Đại Sơn)' },
    combat: {
      hp: 1100, speed: 195, runSpeed: 310, jumpForce: 480,
      damage: 1.30, reach: 1.15, knockback: 1.3, energyGain: 0.95,
      finisher: 'heavy', ultimateState: 'ultimate_slam', ultimateType: 'slam',
      superArmor: true, armorThreshold: 40,
      mechanic: 'Super armor + AoE mặt đất + tầm đánh rộng'
    }
  },

  // =========================================================================
  // NHÂN VẬT 4 — TRIỆU VĨNH TÂM
  // =========================================================================
  vinhtam: {
    id: 'vinhtam',
    name: 'Triệu Vinh Tâm',
    title: 'THỦ LĨNH TRIỆU GIA',
    faction: 'trieu',
    styleType: 'boss_vinhtam',
    portrait: 'boss_vinhtam',
    playable: false,
    role: 'Thủ lĩnh Triệu gia, đối thủ chiến lược muốn chiếm toàn bộ hồ sơ bí mật.',
    motive: 'Kiểm soát thông tin để Triệu gia không bao giờ lại rơi vào thế yếu. Hắn tin quyền lực là cách duy nhất bảo vệ gia tộc.',
    bio: 'Vinh Tâm không lao vào đánh. Hắn điều khiển chiến trường bằng cận vệ, bẫy và những quyết định có tính toán. Mỗi giai đoạn là một nước cờ.',
    fightingStyle: 'Bình tĩnh, kỷ luật, phản đòn, chuyển giai đoạn khi máu giảm, dùng cận vệ để gây áp lực.',
    strengths: 'Parry (phản đòn) vô hiệu hóa đòn của người chơi, triệu hồi cận vệ, giai đoạn 3 đánh hung hãn hơn nhưng lộ sơ hở sau đòn mạnh.',
    weaknesses: 'Sau chuỗi đòn nặng là khoảng trống lớn — đó là cửa phản công duy nhất.',
    skills: [
      { name: 'Thủ Thế Triệu Gia', desc: 'Parry: vô hiệu hóa đòn đánh thường và phản đòn ngay lập tức.' },
      { name: 'Hàm Lệnh Tuyển Vệ', desc: 'Giai đoạn 2: gọi 2 cận vệ áp sát người chơi.' },
      { name: 'Liên Hoàn Kỷ Luật', desc: 'Chuỗi 2-3 đòn có nhịp đều, dễ đọc nhưng khó chịu khi dồn.' },
      { name: 'Lộ Sơ Hở', desc: 'Giai đoạn 3: đòn mạnh hơn nhưng recovery dài — trừng phạt được.' }
    ],
    ultimate: null,
    stats: { power: 4, speed: 3, defense: 4, technique: 5, range: 3 },
    relations: [
      { who: 'Triệu Đình An', rel: 'Cận vệ trung thành tuyệt đối' },
      { who: 'Hứa Vũ Đại', rel: 'Cùng muốn chiếm lấy hồ sơ bí mật' },
      { who: 'Ngô Giang Mạnh', rel: 'Coi là mối đe dọa lớn nhất' }
    ],
    events: ['Hồi IV: Đại Điện Triệu Gia — 3 giai đoạn', 'Sau trận: lựa chọn về số phận Phó Dung Hải'],
    unlock: { type: 'boss', text: 'Chỉ xuất hiện với tư cách boss (Màn 10)' },
    combat: null
  },

  // =========================================================================
  // NHÂN VẬT 5 — NGÔ GIANG MẠNH
  // =========================================================================
  giangmanh: {
    id: 'giangmanh',
    name: 'Ngô Giang Mạnh',
    title: 'CHỦ GIA TỘC HỌ NGÔ',
    faction: 'ngo',
    styleType: 'boss_giangmanh',
    portrait: 'boss_giangmanh',
    playable: true,
    role: 'Chủ gia tộc họ Ngô, kẻ thù của họ Phó, bước ra khỏi bóng tối ở Hồi V.',
    motive: 'Mối thù sâu sắc với Phó Mộc Đăng và sự nghi ngờ tuyệt đối với tất cả — kể cả Nghị.',
    bio: 'Giang Mạnh không cần说服 ai. Hắn quan sát, ghi nhớ thói quen chiến đấu của đối thủ và trừng phạt sự lặp lại. Hắn không phải phản diện cuối cùng: nếu Nghị đưa ra lựa chọn đúng, hắn trở thành đồng minh bất đắc dĩ.',
    fightingStyle: 'Đòn chính xác, di chuyển tiết kiệm, phản công mạnh khi người chơi lặp lại một combo, né ngang và áp sát bất ngờ.',
    strengths: 'Đọc thói quen (không đọc đầu vào tương lai), trừng phạt combo lặp, phản công chính xác, dodge ngang có cooldown.',
    weaknesses: 'Ít hành động thừa nghĩa là mỗi sai lầm của hắn đều đáng giá — hắn không có lượng HP vô nghĩa.',
    skills: [
      { name: 'Quan Sát Thói Quen', desc: 'Ghi nhận các đòn người chơi hay dùng; lặp lại 3 lần sẽ bị hắn trừng phạt.' },
      { name: 'Né Ngang Tiếp Cận', desc: 'Né sidestep rồi áp sát — có thời gian hồi, không né liên tục.' },
      { name: 'Phản Công Trừng Phạt', desc: 'Đòn phản công sau khi né: sát thương lớn, ngắn gọn.' },
      { name: 'Áp Sát Bất Ngờ', desc: 'Lướt thẳng vào cự ly gần rồi ra đòn ngay.' }
    ],
    ultimate: null,
    stats: { power: 4, speed: 4, defense: 3, technique: 5, range: 2 },
    relations: [
      { who: 'Ngô Nhất Nghị', rel: 'Cùng họ — nhưng Giang Mạnh không tin hắn' },
      { who: 'Phó Mộc Đăng', rel: 'Kẻ thù không đội trời chung' },
      { who: 'Phó Đặng Hoàng Anh', rel: 'Có thể thành đồng minh bất đắc dĩ' }
    ],
    events: ['Hồi V: Đoạn Nghĩa Đài — trận chiến cuối của tuyến truyện', 'Quyết định của người chơi quyết định hắn là thù hay bạn'],
    unlock: { type: 'stage', stage: 11, text: 'Hoàn thành Hồi V (Màn 11 — Đoạn Nghĩa Đài)' },
    combat: {
      hp: 1100, speed: 245, runSpeed: 380, jumpForce: 510,
      damage: 1.35, reach: 1.05, knockback: 1.2, energyGain: 1,
      finisher: 'counter', ultimateState: 'ultimate_precision', ultimateType: 'precision',
      counterBonus: 2.6, counterWindow: 2.5,
      mechanic: 'Trừng phạt combo lặp + Perfect Counter mạnh hơn'
    }
  },

  // =========================================================================
  // NHÂN VẬT 6 — PHÓ DUNG HẢI
  // =========================================================================
  dunghai: {
    id: 'dunghai',
    name: 'Phó Dung Hải',
    title: 'KẺ BỊ KHAI TRỪ',
    faction: 'pho',
    styleType: 'boss_dunghai',
    portrait: 'boss_dunghai',
    playable: true,
    role: 'Kẻ bị khai trừ khỏi họ Phó, nhân vật phản trắc trung tâm của Hồi II & IV.',
    motive: 'Động cơ thật sự phức tạp hơn vẻ ngoài: hắn bị cắt khỏi gia tộc, và hắn biết ai đã sửa hồ sơ.',
    bio: 'Dung Hải đánh không theo nhịp cố định. Hắn đánh lừa, tạo khoảng cách rồi áp sát, dùng môi trường để tạo lợi thế. Trong trận đấu hắn dừng lại để nói — và mỗi câu nói đều khiến người chơi nghi ngờ thông tin mình nhận.',
    fightingStyle: 'Nhịp bất quy tắc, đánh lừa, thình lình áp sát, dùng môi trường, hội thoại tâm lý giữa trận.',
    strengths: 'Không có rhythm cố định nên khó đọc, có pha cancel, cấu rỉa từ xa bằng đồ vật môi trường.',
    weaknesses: 'Bị lộ quá khứ khi nói nhiều — giai đoạn cuối để lộ động cơ thật sự, cũng là lúc hắn dễ tổn thương nhất.',
    skills: [
      { name: 'Nhịp Bất Kỷ Luật', desc: 'Thời gian giữa các đòn ngẫu nhiên rộng — không thể canh theo thói quen.' },
      { name: 'Hủy Đòn Dối', desc: 'Bắt đầu một đòn rồi cancel 40% sang né ngang và đòn thật.' },
      { name: 'Ném Đồ Môi Trường', desc: 'Gạch, chai, ống thép — cấu rỉa rồi mới áp sát.' },
      { name: 'Lời Nói Giữa Trận', desc: 'Dừng lại nói về quá khứ — khiến người chơi hoài nghi lựa chọn của mình.' }
    ],
    ultimate: null,
    stats: { power: 3, speed: 4, defense: 2, technique: 5, range: 4 },
    relations: [
      { who: 'Phó Mộc Đăng', rel: 'Người đã ký quyết định khai trừ hắn' },
      { who: 'Hứa Vũ Đại', rel: 'Từng làm việc cho mạng lưới ngầm' },
      { who: 'Ngô Nhất Nghị', rel: 'Kẻ có thể tha thứ hoặc giết hắn' }
    ],
    events: ['Hồi II: Lần đầu đối đầu — hắn bỏ chạy và để lại manh mối', 'Hồi IV: Sự thật về động cơ được hé lộ qua gameplay'],
    unlock: { type: 'stage', stage: 7, text: 'Hoàn thành Màn 7 (Trạm Sát Thủ Ngầm)' },
    combat: {
      hp: 1050, speed: 250, runSpeed: 400, jumpForce: 520,
      damage: 1.20, reach: 1.1, knockback: 1.15, energyGain: 1.15,
      finisher: 'rush', ultimateState: 'ultimate_feint', ultimateType: 'feint',
      mechanic: 'Nhịp đánh bất thường + hủy đòn + áp sát bất ngờ'
    }
  },

  // =========================================================================
  // NHÂN VẬT 7 — PHÓ MỘC ĐĂNG (hỗ trợ, không chơi được)
  // =========================================================================
  mocdang: {
    id: 'mocdang',
    name: 'Phó Mộc Đăng',
    title: 'THIÊN TÀI CÔNG NGHỆ',
    faction: 'pho',
    styleType: 'npc_mocdang',
    portrait: 'npc_mocdang',
    playable: false,
    role: 'Người đứng đầu Phó gia — hỗ trợ chiến trường thay vì chiến đấu.',
    motive: 'Giữ hệ thống giám sát của họ Phó hoạt động, và đảm bảo hồ sơ không rơi vào tay kẻ không đủ năng lực sử dụng nó.',
    bio: 'Mộc Đăng không cần là võ sĩ giỏi nhất game. Hắn cung cấp thông tin chiến trường, mở khóa khu vực, phân tích điểm yếu boss và thay đổi điều kiện nhiệm vụ — xuất hiện đúng lúc, nói đúng điều cần nói, rồi biến mất.',
    fightingStyle: 'Không chiến đấu trực tiếp. Thử thách của hắn (nếu có) sẽ là chiến thuật, không phải là bản sao của Nghị.',
    strengths: 'Phân tích điểm yếu boss, cung cấp intel, mở cửa khu vực, hồi phục giữa màn.',
    weaknesses: 'Không thể tự vệ; mọi hỗ trợ của hắn đều cần người chơi sống đủ lâu để nhận.',
    skills: [
      { name: 'Phân Tích Điểm Yếu', desc: 'Chỉ ra cửa phản công của boss trước trận.' },
      { name: 'Mở Khu Vực', desc: 'Kích hoạt cửa khóa / điểm tiếp cận mới.' },
      { name: 'Hỗ Trợ Chiến Trường', desc: 'Hồi phục & buff sát thương tạm thời giữa màn.' }
    ],
    ultimate: null,
    stats: { power: 1, speed: 2, defense: 1, technique: 5, range: 5 },
    relations: [
      { who: 'Phó Đặng Hoàng Anh', rel: 'Cùng họ, khác cách nhìn' },
      { who: 'Phó Dung Hải', rel: 'Kẻ đã ký quyết định khai trừ' },
      { who: 'Ngô Giang Mạnh', rel: 'Kẻ thù không đội trời chung' }
    ],
    events: ['Xuất hiện ở Màn 7, 9, 10 như sự kiện hỗ trợ giữa màn'],
    unlock: { type: 'boss', text: 'Nhân vật hỗ trợ — không chơi được' },
    combat: null
  },

  // =========================================================================
  // NHÂN VẬT 8 — ĐÌNH BÍCH LÂM
  // =========================================================================
  bichlam: {
    id: 'bichlam',
    name: 'Đình Bích Lâm',
    title: 'ĐỒNG MINH NGANG TÀNG',
    faction: 'doclap',
    styleType: 'boss_bichlam',
    portrait: 'boss_bichlam',
    playable: true,
    role: 'Đồng minh ngang tàng, có cá tính mạnh — đến vì tò mò, ở lại vì ghét giả trung thành.',
    motive: 'Anh ta muốn xem Nghị có thật sự khác những kẻ trung thành khác không — và muốn một trận đánh đàng hoàng.',
    fightingStyle: 'Đánh áp sát, tấn công mạnh cự ly gần, phản công và đẩy lùi, phối hợp được với Nghị trong các đoạn dàn dựng.',
    strengths: 'Nhanh, dồn ép liên tục, finisher lao tới, chống chịu tốt hơn Nghị.',
    weaknesses: 'Tầm đánh ngắn — nếu người chơi giữ cự ly và trừng phạt hồi phục, anh ta không có cách tiếp cận an toàn.',
    skills: [
      { name: 'Áp Sát Liên Tục', desc: 'Rất ít thời gian nghỉ giữa các chuỗi đòn.' },
      { name: 'Đòn Gần Mạnh', desc: 'Sát thương cao nhất ở cự ly rất gần.' },
      { name: 'Đẩy Lùi Phản Công', desc: 'Phản ứng khi bị dồn: tung đòn đẩy tạo khoảng cách.' },
      { name: 'Phối Hợp', desc: 'Có đoạn dàn dựng đánh cặp với Ngô Nhất Nghị.' }
    ],
    ultimate: { name: 'XUYÊN TẦN LIÊN KẾT', desc: 'Lao xuyên màn hình, liên hoàn nhiều hit, finish bằng đẩy lùi.' },
    stats: { power: 4, speed: 4, defense: 3, technique: 4, range: 2 },
    relations: [
      { who: 'Ngô Nhất Nghị', rel: 'Đối thủ trước, đồng minh sau' },
      { who: 'Hứa Vũ Đại', rel: 'Không ưa cách hắn dùng người' },
      { who: 'Triệu Vinh Tâm', rel: 'Từng bị Triệu gia săn đuổi' }
    ],
    events: ['Hồi II: Trận thử thách ở Bến cảng — hạ 30% máu anh ta sẽ có hiệp ước'],
    unlock: { type: 'stage', stage: 6, text: 'Hoàn thành Màn 6 (Bến Cảng Hạ Tầng)' },
    combat: {
      hp: 1080, speed: 255, runSpeed: 400, jumpForce: 530,
      damage: 1.10, reach: 0.95, knockback: 1.25, energyGain: 1.2,
      finisher: 'rush', ultimateState: 'ultimate_rush', ultimateType: 'rush',
      comboMax: 4,
      mechanic: 'Combo dài hơn + finisher lao tới + áp sát liên tục'
    }
  },

  // =========================================================================
  // NHÂN VẬT 9 — TRIỆU ĐÌNH AN
  // =========================================================================
  dinhan: {
    id: 'dinhan',
    name: 'Triệu Đình An',
    title: 'CẬN VỆ TRUNG THÀNH',
    faction: 'trieu',
    styleType: 'boss_dinhan',
    portrait: 'boss_dinhan',
    playable: true,
    role: 'Cận vệ trung thành của Triệu Vinh Tâm — trận đánh riêng trước khi gặp Vinh Tâm.',
    motive: 'Trung thành tuyệt đối: nếu hắn gục ngã, Vinh Tâm sẽ không bao giờ quỳ.',
    fightingStyle: 'Phòng thủ tốt, chuỗi đòn nặng, chiếm không gian bằng thân hình và tầm đánh dài.',
    strengths: 'Giảm sát thương thụ động, thủ thế thường xuyên, chuỗi 3 đòn nặng kiểm soát khu vực.',
    weaknesses: 'Bị phá thế thủ bằng đòn unblockable (đòn chân kẹp / tuyệt kỹ / Perfect Counter); hạ thủ là lộ sơ hở.',
    skills: [
      { name: 'Thủ Thế Triệu Gia', desc: 'Giảm 45% sát thương thụ động.' },
      { name: 'Chuỗi Đòn Nặng', desc: '3 đòn liên hoàn chậm nhưng rộng, mỗi đòn đẩy lùi.' },
      { name: 'Chiếm Không Gian', desc: 'Đứng chắn giữa sân, buộc người chơi phải vòng hoặc phá thế.' },
      { name: 'Phá Thế Thủ', desc: 'Đòn unblockable phá thủ — đó là cửa thắng.' }
    ],
    ultimate: { name: 'XUNG KÍCH KHỐI VŨ', desc: 'Lao tới bằng vai, húc văng mọi thứ trên đường đi.' },
    stats: { power: 4, speed: 2, defense: 5, technique: 3, range: 4 },
    relations: [
      { who: 'Triệu Vinh Tâm', rel: 'Chủ nhân — tuyệt đối trung thành' },
      { who: 'Ngô Nhất Nghị', rel: 'Kẻ phải vượt qua hắn mới vào được đại điện' },
      { who: 'Đình Bích Lâm', rel: 'Từng đối đầu — mối hận nhỏ' }
    ],
    events: ['Hồi IV: Trận đánh riêng trước Triệu Vinh Tâm'],
    unlock: { type: 'stage', stage: 9, text: 'Hoàn thành Màn 9 (Ngoại Thành Triệu Gia)' },
    combat: {
      hp: 1080, speed: 200, runSpeed: 320, jumpForce: 475,
      damage: 1.25, reach: 1.1, knockback: 1.25, energyGain: 1.0,
      finisher: 'bash', ultimateState: 'ultimate_bash', ultimateType: 'bash',
      damageReduction: 0.20,
      mechanic: 'Giảm sát thương thụ động + thủ thế + chuỗi đòn nặng'
    }
  },

  // =========================================================================
  // NHÂN VẬT 10 — ĐỘI TRƯỞNG HUYẾT ẢNH (giữ từ game cũ)
  // =========================================================================
  huyetanh: {
    id: 'huyetanh',
    name: 'Đội Trưởng Huyết Ảnh',
    title: 'SÁT THỦ 3 GIAI ĐOẠN',
    faction: 'hua',
    styleType: 'boss_huyetanh',
    portrait: 'boss_huyetanh',
    playable: false,
    role: 'Boss tuyến truyện ban đầu — được nâng cấp thành đối thủ có chiến thuật và liên kết với vụ bắt cóc.',
    motive: 'Hắn là kẻ nhận lệnh trực tiếp từ Long Vương: bắt Hứa Vũ Đại vì hồ sơ, không vì tiền.',
    bio: 'Huyết Ảnh không phải lính đánh thuê thường. Ba thức của hắn được thiết kế để kết liễu trong hành lang hẹp — và hắn biết chính xác Nghị đang tìm thứ gì.',
    fightingStyle: 'Ba giai đoạn: thăm dò → dồn tốc → phòng thủ chặt (chỉ nhận 50% sát thương nếu không bị Perfect Counter).',
    strengths: 'Tốc độ, ghost trail, giai đoạn 3 phòng thủ chặt.',
    weaknesses: 'Perfect Counter vô hiệu hóa giảm sát thương giai đoạn 3.',
    skills: [
      { name: 'Thức 1 — Thăm Dò', desc: 'Chuỗi đấm móc cơ bản, dò nhịp người chơi.' },
      { name: 'Thức 2 — Dồn Tốc', desc: 'Lao tới bằng đá vòng cầu có tàn ảnh.' },
      { name: 'Thức 3 — Huyết Ngục', desc: 'Chịu 50% sát thương thường — trừ khi bị phản đòn hoàn hảo.' }
    ],
    ultimate: null,
    stats: { power: 4, speed: 5, defense: 3, technique: 4, range: 3 },
    relations: [
      { who: 'Long Vương', rel: 'Sếp trực tiếp — người ra lệnh bắt Hứa Vũ Đại' },
      { who: 'Ngô Nhất Nghị', rel: 'Mục tiêu cần tiêu diệt' }
    ],
    events: ['Hồi I: Hành lang tử thủ — liên kết trực tiếp với vụ bắt cóc'],
    unlock: { type: 'boss', text: 'Boss màn 3' },
    combat: null
  },

  // Các boss còn lại (dùng cho bộ sưu tập / hồ sơ)
  haclang: {
    id: 'haclang', name: 'Đao Thủ Hắc Lang', title: 'THỦ LĨNH CỬA NGÕ', faction: 'hua',
    styleType: 'boss_haclang', portrait: 'boss_haclang', playable: false,
    role: 'Boss màn 1 — thủ lĩnh cửa ngõ căn cứ.', motive: 'Không cho ai lọt vào khu giam Hứa Vũ Đại.',
    bio: 'Song đao của Hắc Lang là tấm vé vào mạng lưới ngầm. Hắn tin Nghị chỉ là một thằng võ sĩ ảo tưởng.',
    fightingStyle: 'Song đao, 2 giai đoạn, chuyển sang đá tống áp sát khi máu giảm.',
    strengths: 'Tốc độ và tầm vũ khí.', weaknesses: 'Không có phòng thủ — chỉ công.',
    skills: [{ name: 'Song Đao Liên Hoàn', desc: 'Chuỗi chém liên tục.' }, { name: 'Áp Sát Giai Đoạn 2', desc: 'Lao tới bằng đá tống.' }],
    ultimate: null, stats: { power: 3, speed: 4, defense: 2, technique: 3, range: 4 },
    relations: [{ who: 'Long Vương', rel: 'Cấp dưới' }], events: ['Hồi I: Cửa ngõ căn cứ'],
    unlock: { type: 'boss', text: 'Boss màn 1' }, combat: null
  },
  thietquyen: {
    id: 'thietquyen', name: 'Võ Sĩ Thiết Quyền', title: 'ĐẤU SĨ BỌC THÉP', faction: 'hua',
    styleType: 'boss_thietquyen', portrait: 'boss_thietquyen', playable: false,
    role: 'Boss màn 2 — nhà kho thép.', motive: 'Chứng minh nắm đấm thép mạnh hơn võ biểu diễn.',
    bio: 'Giáp trụ dày, tay bọc thép, và một niềm tin rất đơn giản: ai mạnh hơn thì sống.',
    fightingStyle: 'Đấm móc nặng + đập sàn diện rộng (né bằng cách nhảy).',
    strengths: 'Giáp dày, AoE mặt đất.', weaknesses: 'Chậm, telegraph dài.',
    skills: [{ name: 'Đấm Thép', desc: 'Sát thương cao, knockdown.' }, { name: 'Đập Sàn', desc: 'AoE — nhảy là né.' }],
    ultimate: null, stats: { power: 4, speed: 2, defense: 5, technique: 2, range: 3 },
    relations: [{ who: 'Long Vương', rel: 'Thuê mướn' }], events: ['Hồi I: Nhà kho thép'],
    unlock: { type: 'boss', text: 'Boss màn 2' }, combat: null
  },
  longvuong: {
    id: 'longvuong', name: 'Long Vương', title: 'ÔNG TRÙM TỐI THƯỢNG', faction: 'hua',
    styleType: 'boss_longvuong', portrait: 'boss_longvuong', playable: false,
    role: 'Boss cuối Hồi I — kẻ bắt cóc Hứa Vũ Đại.', motive: 'Chiếm hồ sơ bí mật và loại bỏ mạng lưới ngầm của Hứa.',
    bio: 'Long Quyền của hắn từng quật ngã cả khu vực. Hắn không biết rằng mình chỉ là con tốt trong tay kẻ khác.',
    fightingStyle: '3 giai đoạn: kỷ luật → tốc độ → điên cuồng với tàn ảnh vàng.',
    strengths: 'Sát thương lớn, 3 giai đoạn.', weaknesses: 'Giai đoạn 3 hụt đòn là cơ hội.',
    skills: [{ name: 'Long Quyền', desc: 'Chuỗi đấm uy lực.' }, { name: 'Phi Long Đoạt', desc: 'Lao tới có tàn ảnh.' }],
    ultimate: null, stats: { power: 5, speed: 3, defense: 4, technique: 3, range: 3 },
    relations: [{ who: 'Hứa Vũ Đại', rel: 'Kẻ bị hắn bắt' }, { who: 'Huyết Ảnh', rel: 'Cấp dưới' }],
    events: ['Hồi I: Bị hạ — mở ra toàn bộ âm mưu'],
    unlock: { type: 'boss', text: 'Boss màn 4' }, combat: null
  }
};

// Đồng bộ STYLE_DEFS cho các nhân vật với bảng nâng cấp chuẩn trong animation.js
if (typeof STYLE_DEFS !== 'undefined') {
  Object.assign(STYLE_DEFS, {
    boss_hoanganh:  { scale: 1.46, skin: '#c99468', hair: '#241a12', hairStyle: 'buzz', gi: '#4d462d', pants: '#2e2a1b', belt: '#b91c1c', weapon: 'hoe', scar: true, aura: '#f59e0b', under: '#292518', shoes: 'wraps', eyeColor: '#f59e0b' },
    boss_vinhtam:   { scale: 1.44, skin: '#e8be96', hair: '#e2e8f0', hairStyle: 'white', gi: '#4a121a', pants: '#2a0a0f', belt: '#ffd700', dragon: true, beard: true, robe: true, aura: '#ffd700', under: '#6b1d28', shoes: 'dress', eyeColor: '#ffd700' },
    boss_giangmanh: { scale: 1.38, skin: '#deb28b', hair: '#cbd5e1', hairStyle: 'ponytail', gi: '#1e293b', pants: '#0f172a', belt: '#94a3b8', beard: true, robe: true, aura: '#38bdf8', under: '#334155', shoes: 'kungfu', eyeColor: '#38bdf8' },
    boss_dunghai:   { scale: 1.35, skin: '#e0b28a', hair: '#18181b', hairStyle: 'spiky', gi: '#1f242d', pants: '#13161c', belt: '#991b1b', scarf: true, scarfColor: '#dc2626', weapon: 'twin_daggers', aura: '#ef4444', under: '#27272a', shoes: 'combat', eyeColor: '#ef4444' },
    boss_dinhan:    { scale: 1.45, skin: '#d4a179', hair: '#1c1917', hairStyle: 'ponytail', gi: '#7a1a1f', pants: '#401013', belt: '#d4a017', shield: true, weapon: 'mace', weaponLen: 46, armor: true, beard: true, aura: '#d4a017', under: '#991b1b', shoes: 'combat', eyeColor: '#d4a017' },
    boss_bichlam:   { scale: 1.34, skin: '#f5c6a5', hair: '#18181b', hairStyle: 'spiky', gi: '#166534', pants: '#0f3d24', belt: '#22c55e', aura: '#4ade80', under: '#14532d', shoes: 'combat', eyeColor: '#22c55e' },
    npc_mocdang:    { scale: 1.3,  skin: '#edd0b7', hair: '#1e293b', hairStyle: 'short', gi: '#0f293a', pants: '#0a1d24', belt: '#00d2ff', glasses: true, aura: '#00d2ff', under: '#e0f2fe', suit: true, shoes: 'dress' }
  });
  if (window.skeletalRenderer && window.skeletalRenderer._styles) {
    window.skeletalRenderer._styles = {};
  }
}

// Tương thích ngược alias với key có dấu cách
CHARACTERS['vinh tam'] = CHARACTERS.vinhtam;

window.FACTIONS = FACTIONS;
window.CHARACTERS = CHARACTERS;
