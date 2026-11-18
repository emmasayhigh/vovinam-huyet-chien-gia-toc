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
        return [
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
        skins.push(Object.assign({}, ex, {
          image: ex.image || slot[`${ex.id}Image`] || slot.image
        }));
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
          if (sk && sk.shopSkin) {
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

  registry.applyToCharacterRegistry();

  root.SKIN_TIERS = SKIN_TIERS;
  root.SkinRegistry = registry;
})(typeof window !== 'undefined' ? window : globalThis);
