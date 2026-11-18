/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/entities/characters/bootstrap.js
 *
 * Trình nạp tự động toàn bộ hệ thống module nhân vật trong môi trường Node.js (Unit Tests)
 * hoặc khi chưa nạp qua thẻ <script> trong index.html. An toàn khi gọi lặp (idempotent).
 */

(function () {
  const g = (typeof window !== 'undefined') ? window : globalThis;
  if (typeof window === 'undefined') {
    globalThis.window = g;
  }

  const CHAR_FILES = [
    'characterRegistry.js',
    'nghi.js',
    'bichlam.js',
    'huavudai.js',
    'dinhan.js',
    'hoanganh.js',
    'dunghai.js',
    'giangmanh.js',
    'mocdang.js',
    'haclang.js',
    'thietquyen.js',
    'huyetanh.js',
    'longvuong.js',
    'vinhtam.js',
    'vananh.js',
    'tiendang.js',
    'thienkhanh.js'
  ];

  if (typeof require === 'function' && (!g.CharacterRegistry || (g.CharacterRegistry.order && g.CharacterRegistry.order.length < 15))) {
    const path = require('path');
    for (const file of CHAR_FILES) {
      require(path.join(__dirname, file));
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = g.CharacterRegistry;
  }
})();

