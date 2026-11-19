/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/data/skins.js - Kho Dữ Liệu & Đăng Ký Trang Phục Nhân Vật (SkinRegistry)
 *
 * Tách riêng toàn bộ định nghĩa Skin khỏi UI Cửa Hàng, Kho Đồ và CharacterSelect
 * để về sau chỉ cần gọi SkinRegistry.register(charId, {...}) là tự động đồng bộ mọi nơi!
 */
(function (root) {
  const SKIN_TIERS = {
    pham: {
      id: 'pham',
      tier: 'PHÀM PHẨM • BẢN SẮC',
      badgeClass: 'default',
      rarity: 'default',
      shopRoleSub: 'TRANG PHỤC PHÀM PHẨM • BẢN SẮC',
      themeClass: 'theme-default'
    },
    linh: {
      id: 'linh',
      tier: 'LINH PHẨM • LAM ĐẠO',
      badgeClass: 'vovinam',
      rarity: 'rare',
      shopRoleSub: 'TRANG PHỤC LINH PHẨM • VÕ PHỤC',
      themeClass: 'theme-rare'
    },
    dia: {
      id: 'dia',
      tier: 'ĐỊA PHẨM • TUYỆT KỸ',
      badgeClass: 'epic',
      rarity: 'epic',
      shopRoleSub: 'TRANG PHỤC ĐỊA PHẨM • ĐẶC BIỆT',
      themeClass: 'theme-epic'
    },
    thien: {
      id: 'thien',
      tier: 'THẦN PHẨM • TÔNG SƯ',
      badgeClass: 'legendary',
      rarity: 'legendary',
      shopRoleSub: 'TRANG PHỤC THẦN PHẨM • TÔNG SƯ',
      themeClass: 'theme-legendary'
    },
    chiton: {
      id: 'chiton',
      tier: '🔥 CHÍ TÔN PHẨM • HUYẾT LONG',
      badgeClass: 'mythic namcheo',
      rarity: 'mythic',
      shopRoleSub: 'TRANG PHỤC CHÍ TÔN PHẨM (ĐỎ) • ĐỔI HOẠT CẢNH & THỦY QUÁI',
      themeClass: 'theme-mythic'
    }
  };

  const DEFAULT_SKIN_PROFILES = {
    nghi: {
      name: 'Lam Võ Phục Chính Thống',
      tier: 'MẶC ĐỊNH • VIỆT VÕ ĐẠO',
      badgeClass: 'vovinam',
      rarity: 'default',
      fx: ['Lam Võ Phục', 'Hoàng Đai Vovinam', 'Đòn Chân Kẹp'],
      sub: 'Võ phục Vovinam truyền thống kèm phù hiệu Việt Võ Đạo — Trang phục chuẩn của Ngô Nhất Nghị',
      toast: '🥋 Trang phục chuẩn Lam Võ Phục Việt Võ Đạo!'
    },
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
    },
    vananh: {
      name: 'Âu Phục Hắc Kim Habana',
      sub: 'Vest 3 mảnh Lục Gia Chủy, áo khoác đen gác súng & xì gà Habana',
      fx: ['Kho Vàng Họ Phó', 'Súng Giảm Thanh']
    },
    tiendang: {
      name: 'Lễ Phục Tiên Phong M&A',
      sub: 'Chiến bào thâu tóm quốc tế viền bạc cùng găng chiến thuật Lượng Tử',
      fx: ['Tiên Phong Ninh Ba', 'Bẫy Ngược Tây Hồ']
    },
    thienkhanh: {
      name: 'Huyết Bào Tà Sư Kiếm Xu',
      sub: 'Đạo bào huyết sắc thêu kim văn, mạng che đồng xu cổ & Kiếm Xu Đồng Đỏ bùng lửa',
      fx: ['Kiếm Xu Rực Lửa', 'Hỏa Âm Binh']
    }
  };

  // Kho Skin Đặc Biệt / Cửa Hàng theo charId -> Array<SkinDef>
  const CUSTOM_SKINS = {};
  // Kho cấu hình đồ họa / hoạt ảnh / cinematic của từng Skin khi render in-game
  const RUNTIME_SKIN_STYLES = {};

  function resolveSlot(slotOrCharId) {
    if (!slotOrCharId) return null;
    if (typeof slotOrCharId === 'object') return slotOrCharId;
    const id = String(slotOrCharId);
    const slots = root.CHAR_SLOTS || [];
    return slots.find((s) => s.id === id) || { id, image: 'assets/images/characters/char_hero_nghi.png' };
  }

  class SkinRegistry {
    constructor() {
      this.tiers = SKIN_TIERS;
      this.defaults = DEFAULT_SKIN_PROFILES;
      this.customByChar = CUSTOM_SKINS;
      this.runtimeStyles = RUNTIME_SKIN_STYLES;
    }

    /**
     * Đăng ký cấu hình ngoại hình / vệt đòn / cinematic runtime cho 1 Skin (tách hoàn toàn khỏi file nhân vật).
     */
    registerRuntimeStyle(charId, skinId, config) {
      if (!charId || !skinId || !config) return null;
      if (!this.runtimeStyles[charId]) this.runtimeStyles[charId] = {};
      const entry = Object.assign({}, config);
      this.runtimeStyles[charId][skinId] = entry;
      this.applyToCharacterRegistry(charId);
      return entry;
    }

    getRuntimeStyle(charId, skinId) {
      if (!charId || !skinId) return null;
      return (this.runtimeStyles[charId] && this.runtimeStyles[charId][skinId]) || null;
    }

    /**
     * Bơm cấu hình runtime skin vào CharacterRegistry khi game khởi chạy (an toàn nếu chạy unit test đơn lẻ).
     */
    applyToCharacterRegistry(targetCharId) {
      if (!root.CharacterRegistry || typeof root.CharacterRegistry.get !== 'function') return;
      const charIds = targetCharId ? [targetCharId] : Object.keys(this.runtimeStyles);
      for (const charId of charIds) {
        const def = root.CharacterRegistry.get(charId);
        const bySkin = this.runtimeStyles[charId];
        if (!def || !bySkin) continue;
        for (const skinId of Object.keys(bySkin)) {
          const cfg = bySkin[skinId];
          if (!cfg) continue;
          if (cfg.isVovinamOverride || skinId === 'vovinam') {
            if (!def.appearance) def.appearance = {};
            if (cfg.style) def.appearance.vovinamSkin = Object.assign({}, cfg.style);
          } else {
            if (!def.appearance) def.appearance = {};
            if (!def.appearance.skins) def.appearance.skins = {};
            if (cfg.style) def.appearance.skins[skinId] = Object.assign({}, cfg.style);
          }
          if (cfg.trailProfile) {
            if (!def.animation) def.animation = {};
            if (!def.animation.skinTrailProfiles) def.animation.skinTrailProfiles = {};
            def.animation.skinTrailProfiles[skinId] = Object.assign({}, cfg.trailProfile);
          }
          if (cfg.cinematic && def.ultimateRuntime) {
            if (!def.ultimateRuntime.skinCinematics) def.ultimateRuntime.skinCinematics = {};
            def.ultimateRuntime.skinCinematics[skinId] = Object.assign({}, cfg.cinematic);
          }
        }
      }
    }

    /**
     * Đăng ký thêm Skin mới cho bất kỳ nhân vật nào mà không cần sửa code UI.
     */
    register(charId, skinDef) {
      if (!charId || !skinDef || !skinDef.id) return;
      if (!this.customByChar[charId]) this.customByChar[charId] = [];
      const list = this.customByChar[charId];
      const idx = list.findIndex((s) => s.id === skinDef.id);
      const normalized = Object.assign({ charId }, skinDef);
      if (idx >= 0) list[idx] = normalized;
      else list.push(normalized);
      return normalized;
    }

    /**
     * Trả về đầy đủ danh sách skin của 1 nhân vật (Mặc định + Lam Phục Vovinam + Custom/Shop Skins).
     */
    getForCharacter(slotOrCharId) {
      const slot = resolveSlot(slotOrCharId);
      if (!slot || slot.isLocked) return [];

      if (slot.id === 'nghi') {
        const d = this.defaults.nghi;
        const nghiSkins = [
          {
            id: 'default',
            charId: 'nghi',
            name: d.name,
            tier: d.tier,
            badgeClass: d.badgeClass,
            rarity: d.rarity,
            image: slot.image,
            fx: d.fx.slice(),
            sub: d.sub,
            toast: d.toast
          }
        ];
        const extras = this.customByChar.nghi || [];
        for (const ex of extras) {
          if (ex && !ex.hidden) {
            nghiSkins.push(Object.assign({}, ex, {
              image: ex.image || slot[`${ex.id}Image`] || slot.image
            }));
          }
        }
        return nghiSkins;
      }

      const defMeta = this.defaults[slot.id] || {
        name: 'Trang Phục Mặc Định',
        sub: 'Ngoại hình và vũ khí nguyên bản theo cốt truyện',
        fx: ['Nguyên Bản']
      };
      const pham = this.tiers.pham;
      const linh = this.tiers.linh;

      const skins = [
        {
          id: 'default',
          charId: slot.id,
          name: defMeta.name,
          tier: pham.tier,
          badgeClass: pham.badgeClass,
          rarity: pham.rarity,
          image: slot.image,
          fx: (defMeta.fx || ['Nguyên Bản']).slice(),
          sub: defMeta.sub,
          toast: '👕 Đã chuyển về Trang Phục Mặc Định!'
        },
        {
          id: 'vovinam',
          charId: slot.id,
          name: 'Võ Phục Vovinam Chính Thống',
          tier: linh.tier,
          badgeClass: linh.badgeClass,
          rarity: linh.rarity,
          image: slot.vovinamImage || (slot.id !== 'nghi' ? `assets/images/characters/char_${slot.id}_vovinam.png` : slot.image),
          fx: ['Lam Võ Phục', 'Phù Hiệu Vovinam', 'Giữ Nguyên Bộ Chiêu Gốc'],
          sub: 'Lam Võ Phục truyền thống kèm phù hiệu Việt Võ Đạo — Thuần thay đổi trang phục bên ngoài, giữ nguyên 100% chiêu thức và phong cách chiến đấu riêng',
          toast: '🥋 Đã trang bị Lam Võ Phục Vovinam Chính Thống!'
        }
      ];

      const extras = this.customByChar[slot.id] || [];
      for (const ex of extras) {
        if (ex && !ex.hidden) {
          skins.push(Object.assign({}, ex, {
            image: ex.image || slot[`${ex.id}Image`] || slot.image
          }));
        }
      }
      return skins;
    }

    getSkin(slotOrCharId, skinId = 'default') {
      const list = this.getForCharacter(slotOrCharId);
      return list.find((sk) => sk.id === skinId) || list[0] || null;
    }

    resolveImage(slotOrCharId, skinId = 'default') {
      const slot = resolveSlot(slotOrCharId);
      if (!slot) return 'assets/images/characters/char_hero_nghi.png';
      const found = this.getSkin(slot, skinId);
      if (found && found.image) return found.image;
      return slot.image || 'assets/images/characters/char_hero_nghi.png';
    }

    /**
     * Lấy toàn bộ trang phục đang mở bán tại Khu Skin (tự động render ra Cửa Hàng).
     */
    getShopSkins() {
      const out = [];
      Object.keys(this.customByChar).forEach((charId) => {
        const slot = resolveSlot(charId);
        const list = this.customByChar[charId] || [];
        for (const sk of list) {
          if (sk && sk.shopSkin && !sk.hidden) {
            out.push(Object.assign({}, sk, {
              charId,
              heroName: (slot && (slot.fullName || slot.slotName)) || charId.toUpperCase(),
              image: sk.image || (slot && (slot[`${sk.id}Image`] || slot.image)) || 'assets/images/characters/char_hero_nghi.png'
            }));
          }
        }
      });
      return out;
    }
  }

  const registry = new SkinRegistry();

  // Đăng ký trang phục đặc biệt hiện có vào SkinRegistry (sau này thêm skin chỉ cần thêm tại đây)
  registry.register('bichlam', {
    id: 'namcheo',
    name: 'Ông Năm Chèo — Thủy Bá Bến Cảng',
    shortName: 'Ông Năm Chèo 🌊',
    tier: SKIN_TIERS.chiton.tier,
    tierKey: 'chiton',
    badgeClass: SKIN_TIERS.chiton.badgeClass,
    rarity: SKIN_TIERS.chiton.rarity,
    themeClass: SKIN_TIERS.chiton.themeClass,
    image: 'assets/images/characters/char_bichlam_namcheo.png',
    styleKey: 'bichlam_namcheo',
    shopSkin: true,
    shopKey: 'skin_bichlam_namcheo',
    shopCurrency: 'diamond',
    shopPrice: 150,
    shopRibbon: '🔥 CHÍ TÔN PHẨM • ĐÌNH BÍCH LÂM',
    shopRoleSub: SKIN_TIERS.chiton.shopRoleSub,
    quote: '“Sông Cửu Long cuộn sóng dữ — một mái chèo định giang sơn bến cảng!”',
    bio: 'Trang phục bậc Chí Tôn Phẩm cho Đình Bích Lâm: Đấm móc (W+J) triệu hồi Cá Sấu Đỏ Mũi lao lên đớp mồi; Tuyệt kỹ (I) cưỡi thuyền tam bản rẽ sóng lao đi kèm hình bóng Cá Sấu 5 Chân khổng lồ phía sau!',
    skillsGrid: [
      { key: 'W+J', name: 'Cá Sấu Đớp Mồi' },
      { key: 'S+K/W+U', name: 'Xoáy Đuôi Cá Sấu' },
      { key: 'U+J/U+K', name: 'Mái Chèo Xé Nước' },
      { key: 'I', name: 'Cưỡi Thuyền Cá Sấu 5 Chân' }
    ],
    passiveNote: {
      icon: '🌊',
      title: 'Thay Đổi Toàn Bộ Hiệu Ứng:',
      desc: 'Kình lực xanh ngọc - hoàng kim, vệt đòn thủy triều và tên chiêu thức riêng cho Đình Bích Lâm.'
    },
    fx: ['🔥 Chí Tôn Phẩm (Đỏ)', '🐊 W+J: Cá Sấu Đớp Mồi', '🚣 Ulti: Cưỡi Thuyền & Cá Sấu 5 Chân'],
    sub: 'Trang phục Chí Tôn Phẩm (Bậc Đỏ tối thượng) trong Cửa Hàng: khoác Bà Ba Chàm & Khăn Rằn, đấm móc W+J triệu hồi Cá Sấu Đỏ Mũi đớp mồi, tuyệt kỹ ngồi thuyền gỗ rẽ sóng kèm bóng Cá Sấu 5 Chân!',
    toast: '🌊 Đã trang bị Ông Năm Chèo — Thủy Bá Bến Cảng!'
  });

  // Cấu hình runtime của các Skin đặc biệt (tách khỏi js/entities/characters/ để dễ mở rộng)
  registry.registerRuntimeStyle('bichlam', 'namcheo', {
    style: {
      gi: '#0f4c5c',
      giD: '#082f3a',
      giL: '#2dd4bf',
      pants: '#132a38',
      pantsD: '#091620',
      belt: '#0284c7',
      beltD: '#075985',
      beltTrim: '#facc15',
      cuffTrim: '#eab308',
      under: '#082f3a',
      sleeveless: false,
      vest: false,
      bareBiceps: false,
      crimsonScarf: true,
      scarfColor: '#0ea5e9',
      stripedWraps: true,
      wrapColor: '#38bdf8',
      shoes: 'brawler_boots',
      shoeColor: '#0c4a6e',
      eyeColor: '#0ea5e9',
      aura: '#0ea5e9'
    },
    trailProfile: {
      primary: '#0ea5e9',
      secondary: '#facc15',
      core: '#e0f2fe',
      width: 14,
      dual: true,
      dodgeGhost: 'rgba(14, 165, 233, 0.58)'
    },
    cinematic: {
      title: 'THẦN THOẠI SSS • ÔNG NĂM CHÈO',
      ult: 'CỬU LONG CUỘN SÓNG — CÁ SẤU 5 CHÂN',
      color: '#ef4444',
      accent: '#0ea5e9',
      style: 'wind',
      duration: 1.4
    }
  });

  registry.registerRuntimeStyle('thienkhanh', 'vovinam', {
    isVovinamOverride: true,
    style: {
      archetype: 'vovinam_master',
      gi: '#234a9c',
      giD: '#152e66',
      giL: '#3b82f6',
      pants: '#214594',
      pantsD: '#132a5e',
      belt: '#151821',
      beltD: '#090b10',
      beltTrim: '#eab308',
      cuffTrim: '#9b2226',
      legStripe: '#d4a017',
      thighDragon: true,
      bareVChest: true,
      patch: true,
      nameTag: true,
      wideSleeves: false,
      coinVeil: true,
      taoistQuiver: false,
      weapon: 'coin_sword',
      shoes: 'kungfu',
      aura: '#38bdf8'
    }
  });

  // =========================================================================
  // TRANG PHỤC CHÍ TÔN PHẨM MỚI: THẦN TRÙNG (THIÊN KHÁNH) & CHÓ ĐỘI NÓN (HỨA VŨ ĐẠI)
  // =========================================================================
  registry.register('thienkhanh', {
    id: 'thantrung',
    name: 'Thần Trùng — Huyết Y Gọi Quạ',
    shortName: 'Thần Trùng 🦅',
    tier: SKIN_TIERS.chiton.tier,
    tierKey: 'chiton',
    badgeClass: SKIN_TIERS.chiton.badgeClass,
    rarity: SKIN_TIERS.chiton.rarity,
    themeClass: SKIN_TIERS.chiton.themeClass,
    image: 'assets/images/characters/char_thienkhanh_thantrung.png',
    styleKey: 'thienkhanh_thantrung',
    shopSkin: false,
    shopKey: 'skin_thienkhanh_thantrung',
    shopCurrency: 'diamond',
    shopPrice: 150,
    shopRibbon: '🔥 CHÍ TÔN PHẨM • CHÂU NGỌC THIÊN KHÁNH',
    shopRoleSub: 'TRANG PHỤC CHÍ TÔN PHẨM (ĐỎ) • TRIỆU HỒI BẦY QUẠ ĐEN',
    quote: '“Áo trùm đỏ thẫm trong hẻm tối — tiếng quạ réo gọi hồn kẻ bội tín!”',
    bio: 'Trang phục Chí Tôn Phẩm lấy cảm hứng kinh dị dân gian Thần Trùng cho Châu Ngọc Thiên Khánh: khoác áo trùm đầu đỏ thẫm tương phản quần xanh lam rùng rợn, thay toàn bộ Tiểu Quỷ triệu hồi thành Bầy Quạ Đen Mắt Đỏ bay lao tới mổ xé kẻ thù!',
    skillsGrid: [
      { key: 'W+U / Đòn 4', name: 'Triệu Hồi Quạ Thần Trùng' },
      { key: 'U+J', name: 'Kiếm Xu & Quạ Báo Oán' },
      { key: 'L / U+K', name: 'Bùa Huyết Trùng Tang' },
      { key: 'I', name: 'Nghiệp Quạ Luân Hồi Trảm' }
    ],
    passiveNote: {
      icon: '🦅',
      title: 'Thay Đổi Triệu Hồi Độc Quyền:',
      desc: 'Toàn bộ Tiểu Quỷ (từ W+U, Đòn thứ 4, Phản Đòn Tay U+J và Tuyệt Kỹ I) đều biến thành Quạ Thần Trùng Mắt Đỏ!'
    },
    fx: ['🔥 Chí Tôn Phẩm (Đỏ)', '🦅 Gọi Quạ thay Tiểu Quỷ', '🩸 Áo Trùm Đỏ Quần Lam'],
    sub: 'Trang phục Chí Tôn Phẩm (Bậc Đỏ tối thượng) trong Cửa Hàng: khoác áo trùm đầu Thần Trùng đỏ thẫm & quần xanh lam ma mị, mọi kỹ năng triệu hồi đều gọi Bầy Quạ Đen Mắt Đỏ thay vì Tiểu Quỷ!',
    toast: '🦅 Đã trang bị: Thần Trùng — Huyết Y Gọi Quạ!'
  });

  registry.registerRuntimeStyle('thienkhanh', 'thantrung', {
    style: {
      archetype: 'crimson_coin_taoist',
      thanTrungHood: true,
      coinVeil: false,
      taoistQuiver: false,
      cape: true,
      hairStyle: 'none',
      skin: '#09090d',
      skinL: '#18181b',
      skinD: '#050508',
      hair: '#09090d',
      gi: '#991b1b',
      giD: '#450a0a',
      giL: '#dc2626',
      coatColor: '#991b1b',
      coatD: '#450a0a',
      coatTrim: '#ef4444',
      liningColor: '#1e3a8a',
      pants: '#1d4ed8',
      pantsD: '#1e3a8a',
      belt: '#0f172a',
      beltD: '#020617',
      beltTrim: '#dc2626',
      under: '#1e3a8a',
      cuffTrim: '#ef4444',
      cuffRedEmbroidery: true,
      wideSleeves: true,
      weapon: 'coin_sword',
      weaponLen: 46,
      shoes: 'kungfu',
      shoeColor: '#0f172a',
      eyeColor: '#ef4444',
      glowingEyes: '#ef4444',
      aura: '#dc2626'
    },
    trailProfile: {
      primary: '#dc2626',
      secondary: '#2563eb',
      core: '#fee2e2',
      width: 14,
      dual: true,
      dodgeGhost: 'rgba(185, 28, 28, 0.58)'
    },
    cinematic: {
      title: 'CHÍ TÔN PHẨM • THẦN TRÙNG',
      ult: 'NGHIỆP QUẠ BÁO OÁN — HUYẾT Y TRÙNG TANG',
      color: '#dc2626',
      accent: '#2563eb',
      style: 'fire',
      duration: 1.35
    }
  });

  registry.register('huavudai', {
    id: 'chodoinon',
    name: 'Chó Trắng Mũi Đỏ Đội Nón',
    shortName: 'Chó Đội Nón 🐶',
    tier: SKIN_TIERS.chiton.tier,
    tierKey: 'chiton',
    badgeClass: SKIN_TIERS.chiton.badgeClass,
    rarity: SKIN_TIERS.chiton.rarity,
    themeClass: SKIN_TIERS.chiton.themeClass,
    image: 'assets/images/characters/char_huavudai_chodoinon.png',
    styleKey: 'huavudai_chodoinon',
    shopSkin: false,
    shopKey: 'skin_huavudai_chodoinon',
    shopCurrency: 'diamond',
    shopPrice: 150,
    shopRibbon: '🔥 CHÍ TÔN PHẨM • HỨA VŨ ĐẠI',
    shopRoleSub: 'TRANG PHỤC CHÍ TÔN PHẨM (ĐỎ) • MÕM CHÓ TRỒI LÊN CẮN',
    quote: '“Trăng đỏ mái ngói xưa — nón mê che mặt, gậy gỗ chống thềm, nanh trắng mũi đỏ xé xác kẻ thù!”',
    bio: 'Trang phục Chí Tôn Phẩm truyền thuyết kinh dị dân gian cho Hứa Vũ Đại: hóa thân Chó Trắng Mũi Đỏ đi hai chân đội nón lá rách cầm gậy gỗ; khi kích hoạt Tuyệt Kỹ (I), 3 mõm Chó Trắng Mũi Đỏ khổng lồ mọc trồi lên từ mặt đất ngoạm cắn mục tiêu!',
    skillsGrid: [
      { key: 'J / W+J', name: 'Quất Gậy Gỗ Dân Gian' },
      { key: 'K / W+K', name: 'Độc Cước Bạch Khuyển' },
      { key: 'U+J / U+K', name: 'Phản Đòn Nanh Trắng' },
      { key: 'I', name: 'Mõm Chó Trắng Mọc Lên Cắn' }
    ],
    passiveNote: {
      icon: '🐶',
      title: 'Thay Đổi Tuyệt Kỹ Độc Quyền:',
      desc: 'Tạo hình Chó Trắng Mũi Đỏ đội nón lá cầm gậy gỗ; Tuyệt Kỹ (I) triệu hồi 3 mõm chó trắng mũi đỏ trồi từ đất lên cắn nát đội hình địch!'
    },
    fx: ['🔥 Chí Tôn Phẩm (Đỏ)', '🐶 Hóa Thân Chó Trắng Mũi Đỏ', '🦷 Ulti: Mõm Chó Mọc Lên Cắn'],
    sub: 'Trang phục Chí Tôn Phẩm (Bậc Đỏ tối thượng) trong Cửa Hàng: hóa thân Chó Trắng Mũi Đỏ đội nón mê cầm gậy gỗ, Tuyệt Kỹ (I) gọi 3 mõm chó trắng khổng lồ mọc lên từ mặt đất ngoạm cắn mục tiêu!',
    toast: '🐶 Đã trang bị: Chó Trắng Mũi Đỏ Đội Nón!'
  });

  registry.registerRuntimeStyle('huavudai', 'chodoinon', {
    style: {
      archetype: 'patriarch_draped_suit',
      dogHead: true,
      dogFurSkin: true,
      dogTail: true,
      conicalHat: true,
      woodCane: true,
      cane: true,
      suit: false,
      vest: false,
      drapedOvercoat: false,
      tieColor: null,
      pocketSquare: null,
      beard: false,
      glasses: false,
      hairStyle: 'none',
      skin: '#f1f5f9',
      skinL: '#ffffff',
      skinD: '#cbd5e1',
      hair: '#f8fafc',
      gi: '#f1f5f9',
      giD: '#94a3b8',
      giL: '#ffffff',
      pants: '#e2e8f0',
      pantsD: '#94a3b8',
      belt: '#451a03',
      beltD: '#271004',
      beltTrim: '#dc2626',
      under: '#cbd5e1',
      cuffTrim: '#94a3b8',
      shoes: 'barefoot',
      shoeColor: '#e2e8f0',
      eyeColor: '#dc2626',
      aura: '#ef4444'
    },
    trailProfile: {
      primary: '#ef4444',
      secondary: '#f8fafc',
      core: '#ffffff',
      width: 14,
      dual: true,
      dodgeGhost: 'rgba(248, 250, 252, 0.55)'
    },
    cinematic: {
      title: 'CHÍ TÔN PHẨM • CHÓ ĐỘI NÓN MÊ',
      ult: 'BẠCH KHUYỂN MŨI ĐỎ — ĐỊA NGỤC TRỒI NANH',
      color: '#dc2626',
      accent: '#f8fafc',
      style: 'command',
      duration: 1.35
    }
  });

  // =========================================================================
  // TRANG PHỤC CHÍ TÔN PHẨM: HỔ XÁM SƠN LÂM (NGÔ NHẤT NGHỊ)
  // =========================================================================
  registry.register('nghi', {
    id: 'hoxam',
    name: 'Hổ Xám Sơn Lâm — Bạch Hổ Quyền',
    shortName: 'Hổ Xám 🐯',
    tier: SKIN_TIERS.chiton.tier,
    tierKey: 'chiton',
    badgeClass: SKIN_TIERS.chiton.badgeClass,
    rarity: SKIN_TIERS.chiton.rarity,
    themeClass: SKIN_TIERS.chiton.themeClass,
    image: 'assets/images/characters/char_nghi_hoxam.png',
    styleKey: 'nghi_hoxam',
    shopSkin: true,
    shopKey: 'skin_nghi_hoxam',
    shopCurrency: 'diamond',
    shopPrice: 150,
    shopRibbon: '🔥 CHÍ TÔN PHẨM • NGÔ NHẤT NGHỊ',
    shopRoleSub: 'TRANG PHỤC CHÍ TÔN PHẨM (ĐỎ) • HỔ XÁM VỒ MỒI & ĐẤM HỔ NGOẠM',
    quote: '“Khoác da hổ xám, giữ trọn hình nhân — một quyền tung ra mãnh hổ gầm vang!”',
    bio: 'Trang phục Chí Tôn Phẩm dành riêng cho Ngô Nhất Nghị: giữ nguyên dung mạo võ sĩ Việt Võ Đạo, khoác bộ võ phục da Hổ Xám vằn đen oai phong; mỗi cú đấm tung ra bóng Hổ Xám ngoạm mồi và Tuyệt Kỹ (I) lao vồ như mãnh hổ kèm linh thú Hổ Xám vồ phía sau!',
    skillsGrid: [
      { key: 'J / W+J / Shift+J', name: 'Quyền Cước Hổ Xám Ngoạm' },
      { key: 'U+J / W+U', name: 'Mãnh Hổ Hộ Thân & Phản Trảo' },
      { key: 'W+K', name: 'Song Phi Mãnh Hổ Vồ' },
      { key: 'I', name: 'Tuyệt Kỹ: Mãnh Hổ Xuất Sơn Vồ' }
    ],
    passiveNote: {
      icon: '🐯',
      title: 'Thay Đổi Toàn Bộ Hiệu Ứng Hổ Xám:',
      desc: 'Đấm thường & Đấm Móc tung ra Mõm Hổ Xám Ngoạm; Tuyệt Kỹ (I) biến thành dáng Vồ Như Hổ có Bóng Hổ Xám khổng lồ lao vồ phía sau!'
    },
    fx: ['🔥 Chí Tôn Phẩm (Đỏ)', '🐯 Võ Phục Da Hổ Xám', '🦷 Đấm Ra Hổ Ngoạm + Ulti Hổ Vồ'],
    sub: 'Trang phục Chí Tôn Phẩm (Bậc Đỏ tối thượng) cho Ngô Nhất Nghị: khoác chiến phục họa tiết da Hổ Xám vằn đen (vẫn giữ hình người), đấm ra Hổ Xám ngoạm và Tuyệt Kỹ vồ như hổ có Hổ Xám vồ sau lưng!',
    toast: '🐯 Đã trang bị: Hổ Xám Sơn Lâm — Ngô Nhất Nghị!'
  });

  registry.registerRuntimeStyle('nghi', 'hoxam', {
    style: {
      archetype: 'vovinam_master',
      tigerPelt: true,
      tigerFurCollar: true,
      tigerStripes: true,
      baggyPants: true,
      bareVChest: true,
      bareForearms: true,
      patch: false,
      nameTag: false,
      thighDragon: false,
      gi: '#9ca3af',
      giD: '#4b5563',
      giL: '#d1d5db',
      pants: '#6b7280',
      pantsD: '#374151',
      belt: '#18181b',
      beltD: '#09090b',
      beltTrim: '#e5e7eb',
      cuffTrim: '#1f2937',
      legStripe: '#18181b',
      shoes: 'kungfu',
      shoeColor: '#18181b',
      eyeColor: '#d97706',
      aura: '#e2e8f0'
    },
    trailProfile: {
      primary: '#cbd5e1',
      secondary: '#18181b',
      core: '#ffffff',
      width: 15,
      dual: true,
      dodgeGhost: 'rgba(203, 213, 225, 0.56)'
    },
    cinematic: {
      title: 'CHÍ TÔN PHẨM • HỔ XÁM SƠN LÂM',
      ult: 'MÃNH HỔ XUẤT SƠN — BẠCH HỔ VỒ MỒI',
      color: '#e2e8f0',
      accent: '#f59e0b',
      style: 'lightning',
      duration: 1.4
    }
  });

  registry.applyToCharacterRegistry();

  root.SKIN_TIERS = SKIN_TIERS;
  root.SkinRegistry = registry;
})(typeof window !== 'undefined' ? window : globalThis);
