/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/data/training.js - Du lieu Vo Duong: 7 nhan vat va 7 bai khoa hac.
 *
 * Chi chua du lieu UI/gameplay; logic nam trong js/ui/training/*.
 */

// =========================================================================
// DANH SÁCH TOÀN BỘ 7 CAO THỦ LUYỆN VÕ (100% MỞ KHÓA TRONG VÕ ĐƯỜNG)
// =========================================================================
const TRAINING_CHARACTERS = [
  {
    id: 'nghi',
    name: 'Ngô Nhất Nghị',
    title: 'Sát Thần Việt Võ Đạo',
    faction: 'Vovinam',
    badge: '★ VOVINAM',
    icon: '🥋',
    color: '#00d2ff',
    image: 'assets/images/characters/char_hero_nghi.png',
    desc: 'Đòn chân kẹp cổ, combo liên hoàn, chưởng sấm sét'
  },
  {
    id: 'dinhan',
    name: 'Triệu Đình An',
    title: 'Thiết Bích Cận Vệ',
    faction: 'Họ Triệu',
    badge: '♛ TRIỆU GIA',
    icon: '🛡️',
    color: '#d4a017',
    image: 'assets/images/characters/char_dinhan.png',
    desc: 'Kim Cang Hộ Thể, Đỡ đòn phản chấn, Thủ cực kỳ vững'
  },
  {
    id: 'hoanganh',
    name: 'Phó Đặng Hoàng Anh',
    title: 'Trấn Thủ Đại Sơn',
    faction: 'Họ Phó',
    badge: '⬡ PHÓ GIA',
    icon: '⛰️',
    color: '#f59e0b',
    image: 'assets/images/characters/char_hoanganh.png',
    desc: 'Trường đao trảm lôi, Super Armor càn quét diện rộng'
  },
  {
    id: 'bichlam',
    name: 'Đình Bích Lâm',
    title: 'Đồng Minh Ngang Tàng',
    faction: 'Du Hiệp',
    badge: '✧ DU HIỆP',
    icon: '🌪️',
    color: '#22c55e',
    image: 'assets/images/characters/char_bichlam.png',
    desc: 'Cuồng phong quyền cước, áp sát tốc độ, phản công đẩy văng'
  },
  {
    id: 'dunghai',
    name: 'Phó Dung Hải',
    title: 'Kẻ Bị Khai Trừ',
    faction: 'Độc Hành',
    badge: '⬡ ĐỘC HÀNH',
    icon: '🗡️',
    color: '#84cc16',
    image: 'assets/images/characters/char_dunghai.png',
    desc: 'Song đao xuất huyết, phi tiêu tầm xa, biến ảo khôn lường'
  },
  {
    id: 'huavudai',
    name: 'Hứa Vũ Đại',
    title: 'Ông Trùm Mạng Lưới Ngầm',
    faction: 'Hứa Gia',
    badge: '◈ HỨA GIA',
    icon: '👑',
    color: '#ef4444',
    image: 'assets/images/characters/char_huavudai.png',
    desc: 'Quyền trượng trấn áp, hào quang lãnh tụ, triệu hồi hỏa lực'
  },
  {
    id: 'giangmanh',
    name: 'Ngô Giang Mạnh',
    title: 'Gia Chủ Bóng Tối',
    faction: 'Họ Ngô',
    badge: '◆ NGÔ GIA',
    icon: '❄️',
    color: '#38bdf8',
    image: 'assets/images/characters/char_giangmanh.png',
    desc: 'Thiết sa chưởng, kiếm khí băng hàn, phản công trừng phạt'
  }
];
if (typeof window !== 'undefined') {
  window.TRAINING_CHARACTERS = TRAINING_CHARACTERS;
}

const TRAINING_DRILLS = [
      {
        id: 'drill_move_attack',
        title: 'BÀI 1: DI CHUYỂN & TẤN CÔNG CƠ BẢN',
        desc: 'Làm quen bộ pháp và đòn quyền cước Vovinam.',
        keys: '<kbd>A</kbd> <kbd>D</kbd> <kbd>W</kbd> <kbd>S</kbd> + Đấm <kbd>J</kbd> (3 lần) & Đá <kbd>K</kbd> (3 lần)',
        target: 6,
        type: 'combo_count',
        dummyMode: 'idle',
        hint: 'Bấm W/S để di chuyển theo chiều sâu sàn đấu. Bấm J để đấm thẳng, K để đá tống.'
      },
      {
        id: 'drill_dodge',
        title: 'BÀI 2: NÉ THÂN PHÁP (PERFECT DODGE)',
        desc: 'Nhìn nhịp chuẩn bị của đối thủ, bấm Né đúng lúc để kích hoạt Thân Pháp Vô Lỗi.',
        keys: 'Bấm <kbd>L</kbd> (hoặc <kbd>Shift</kbd>) khi thanh nhịp chuyển sang VÙNG HOÀN HẢO',
        target: 3,
        type: 'dodge_count',
        dummyMode: 'telegraph_hand',
        hint: 'Khi mộc nhân chuẩn bị vung tay (thanh đỏ đầy), bấm L ngay tức thì để né hoàn hảo!'
      },
      {
        id: 'drill_counter_hand',
        title: 'BÀI 3: ĐỠ & PHẢN ĐÒN TAY VOVINAM',
        desc: 'Đón đầu đòn đấm của đối thủ bằng thế bắt tay / chỏ lật phá thế.',
        keys: 'Nhấn <kbd>U</kbd> + <kbd>J</kbd> khi mộc nhân vung đòn tay',
        target: 2,
        type: 'counter_hand_count',
        dummyMode: 'telegraph_hand',
        hint: 'Quan sát vệt sáng tay đối thủ, bấm đồng thời U và J để phản đòn tay.'
      },
      {
        id: 'drill_counter_leg',
        title: 'BÀI 4: GẠT & PHẢN ĐÒN CHÂN VOVINAM',
        desc: 'Gạt cước đối thủ và quét ngã phá trụ cực kỳ uy lực.',
        keys: 'Nhấn <kbd>U</kbd> + <kbd>K</kbd> khi mộc nhân vung đòn chân',
        target: 2,
        type: 'counter_leg_count',
        dummyMode: 'telegraph_leg',
        hint: 'Quan sát mộc nhân chuẩn bị đá quét, nhấn U và K để gạt chân quét ngã!'
      },
      {
        id: 'drill_combos',
        title: 'BÀI 5: BỘ PHÁP LIÊN HOÀN COMBO',
        desc: 'Thực hiện các chuỗi liên hoàn quyền cước: J -> J -> K hoặc J -> K -> K.',
        keys: '<kbd>J</kbd> → <kbd>J</kbd> → <kbd>K</kbd> (Liên Hoàn Quyền Cước)',
        target: 2,
        type: 'combos_executed',
        dummyMode: 'idle',
        hint: 'Đánh nhịp nhàng từng đòn một để chuỗi combo kết nối dứt khoát!'
      },
      {
        id: 'drill_ultimate',
        title: 'BÀI 6: TUYỆT KỸ VOVINAM (LONG HỔ XUẤT SƠN)',
        desc: 'Tập trung nội lực Vovinam và giải phóng toàn bộ sát thương hủy diệt.',
        keys: 'Nhấn <kbd>I</kbd> khi thanh năng lượng sáng rực 100%',
        target: 1,
        type: 'ultimate_hit',
        dummyMode: 'idle',
        hint: 'Thanh năng lượng đã được nạp đầy sẵn. Nhấn phím I để kích hoạt tuyệt kỹ!'
      },
      {
        id: 'drill_ally',
        title: 'BÀI 7: GỌI ĐỒNG MINH HỖ TRỢ CHIẾN ĐẤU',
        desc: 'Hợp đồng tác chiến cùng chiến hữu trên chiến trường.',
        keys: 'Nhấn <kbd>H</kbd> hoặc <kbd>T</kbd> để triệu hồi đồng minh chi viện',
        target: 1,
        type: 'ally_summon',
        dummyMode: 'idle',
        hint: 'Bấm phím H hoặc T để đồng minh xuất trận cùng bạn tung đòn liên kết!'
      }
    ];

window.TRAINING_DRILLS = TRAINING_DRILLS;
