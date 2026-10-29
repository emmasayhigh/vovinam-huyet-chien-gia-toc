# VOVINAM: HUYẾT CHIẾN GIA TỘC

Game hành động võ thuật HTML5 Canvas 2D (không dùng framework, không cần build).

## Cách chạy
- Nhấp đúp `start_game.bat` (cần Node.js) rồi mở http://localhost:3000/
- Hoặc chạy `node server.js`.
- Có thể chạy `npm start` nếu đã cài Node.js.
- Nếu không có Node.js, có thể mở trực tiếp `index.html` trong trình duyệt.

## Chạy kiểm thử
```
npm test
```
hoặc chạy lẻ:
```
node tests/test_combat.js
node tests/test_upgrades.js
node tests/test_v5_features.js
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
  core/
    gameBase.js       Vòng lặp, state machine, setup màn, update
    gameWave.js       Wave director, spawn quái, tiếp viện, vật bay
    gameCamera.js     Camera look-ahead, duel framing, punch zoom
    gameFlow.js       Thắng/thua, kết thúc, thống kê, pause/menu
    gameStory.js      Thoại giữa trận, hiệp ước, đồng minh, màn 7
    gameRender.js     Render scene, projectile, vật chứng
    game.js           Entry point của game engine
    main.js           Nối sự kiện UI với game
    input.js, save.js, audio.js, effects.js
  data/
    stages.js         Dữ liệu 11 màn chơi (wave, boss, thoại, palette)
  entities/
    player.js, enemy.js, bosses2.js, roster.js, animation.js, allySystem.js
  combat/
    combat.js, weapons.js, props.js
  world/
    stageManager.js   Quản lý màn hiện tại + hàng đợi hội thoại
    stageRenderer.js  Vẽ background parallax theo màn
    stages.js         Entry point của hệ thống màn chơi
    scenery.js, story.js
  ui/
    menu/
      charSlots.js    Dữ liệu 12 ô nhân vật
      menuBase.js     Constructor, wire sự kiện, campaign hub
      charSelect.js   Chọn nhân vật, skin, demo võ đài, deployment
      collections.js  Hồ sơ, bộ sưu tập, thành tích
      settings.js     Phím bấm, cài đặt
      chronicles.js   Biên niên sử, tài liệu, quyền nắm giữ bằng chứng
    menu.js           Entry point của menu
    ui.js, training.js, tutorial.js, ranking.js
  features/           investigation, deduction, confrontation, flashback, bossRush
tests/                Kiểm thử bằng Node
docs/                 Tài liệu cốt truyện và ghi chú
archive/              File cũ / không còn dùng (có thể xóa khi đã chắc chắn)
```

## Thứ tự nạp script
Các file JS là script thường (không phải ES module) và dùng biến toàn cục `window.*`.
**Thứ tự thẻ `<script>` trong `index.html` rất quan trọng.** Các nhóm đã tách dùng
class kế thừa nối tiếp, nên phải nạp đúng thứ tự:

- `js/data/stages.js` → `stageManager.js` → `stageRenderer.js` → `world/stages.js`
- `js/ui/menu/charSlots.js` → `menuBase.js` → `charSelect.js` → `collections.js`
  → `settings.js` → `chronicles.js` → `js/ui/menu.js`
- `js/core/gameBase.js` → `gameWave.js` → `gameCamera.js` → `gameFlow.js`
  → `gameStory.js` → `gameRender.js` → `game.js`

Khi thêm file mới, thêm thẻ `<script>` đúng vị trí trong chuỗi tương ứng và tăng
số `?v=` để trình duyệt nạp bản mới. Dữ liệu lưu nằm trong `localStorage`
(khóa `vovinam_huyet_chinh_gia_toc`).
