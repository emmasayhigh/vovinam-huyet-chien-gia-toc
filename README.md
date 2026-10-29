# VOVINAM: HUYẾT CHIẾN GIA TỘC

Game hành động võ thuật HTML5 Canvas 2D (không dùng framework, không cần build).

## Cách chạy
- Nhấp đúp `start_game.bat` (cần Node.js) rồi mở http://localhost:3000/
- Hoặc chạy `node server.js`.
- Nếu không có Node.js, có thể mở trực tiếp `index.html` trong trình duyệt.

## Chạy kiểm thử
```
node tests/test_combat.js
node tests/test_upgrades.js
```

## Cấu trúc thư mục
```
index.html            Trang chính; nạp các script theo thứ tự cố định
server.js             Server tĩnh cục bộ (cổng 3000)
start_game.bat        Chạy server và mở trình duyệt
css/                  Giao diện (base, hud, menu, features, training)
assets/images/
  characters/         Ảnh nhân vật và skin Vovinam
  backgrounds/        Nền menu và màn chọn nhân vật
  cards/              Ảnh thẻ trên menu chính
  previews/           Ảnh xem trước đòn thế (chưa dùng trong game)
js/
  core/               game, main, input, save, audio, effects
  entities/           player, enemy, bosses2, roster, animation, allySystem
  combat/             combat, weapons, props
  world/              stages, scenery, story
  ui/                 ui, menu, training, tutorial, ranking
  features/           investigation, deduction, confrontation, flashback, bossRush
tests/                Kiểm thử bằng Node
docs/                 Tài liệu cốt truyện và ghi chú
archive/              File cũ / không còn dùng (có thể xóa khi đã chắc chắn)
```

## Lưu ý
- Các file JS là script thường (không phải ES module) và dùng biến toàn cục `window.*`.
  **Thứ tự thẻ `<script>` trong `index.html` rất quan trọng**, đừng đổi khi thêm file mới.
- Khi sửa JS/CSS, tăng số `?v=` trong `index.html` để trình duyệt nạp bản mới.
- Dữ liệu lưu nằm trong `localStorage` (khóa `vovinam_huyet_chinh_gia_toc`).

