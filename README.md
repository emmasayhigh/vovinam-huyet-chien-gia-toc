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
  entities/
    player.js           Entry point nhân vật; logic nằm trong player/
    player/             playerBase, playerDamage, playerUltimate, playerInput
    enemy.js            Entry point hệ thống địch; logic nằm trong enemy/
    enemy/              baseEnemy, enemyVariants, enemyBosses
    animation.js        Entry point render xương; logic nằm trong animation/
    animation/          animationData, animationBase, animationPose,
                        animationRenderBase, animationWeapon, animationBody
    bosses2.js, roster.js, allySystem.js
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
      charSelect.js   Entry point màn chọn nhân vật
      charselect/     charSelectCore, charSelectDemo, charSelectDeployment
      collections.js  Hồ sơ, bộ sưu tập, thành tích
      settings.js     Phím bấm, cài đặt
      chronicles.js   Biên niên sử, tài liệu, quyền nắm giữ bằng chứng
    menu.js           Entry point của menu
    training.js       Entry point Võ Đường
    training/         trainingDummy, trainingManagerBase, trainingModes,
                      trainingManagerOverlay
    tutorial.js       Entry point tutorial
    tutorial/         tutorialDummy, tutorialManagerBase, tutorialManagerOverlay
    ui.js, ranking.js
  data/
    stages.js         Dữ liệu 11 màn chơi (wave, boss, thoại, palette)
    training.js       Dữ liệu 7 võ sĩ và 7 bài khảo hạch
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
- `js/ui/menu/charSlots.js` → `menuBase.js` → `charselect/charSelectCore.js`
  → `charSelectDemo.js` → `charSelectDeployment.js` → `charSelect.js`
  → `collections.js` → `settings.js` → `chronicles.js` → `js/ui/menu.js`
- `js/core/gameBase.js` → `gameWave.js` → `gameCamera.js` → `gameFlow.js`
  → `gameStory.js` → `gameRender.js` → `game.js`
- `js/entities/player/playerBase.js` → `playerDamage.js` → `playerUltimate.js`
  → `playerInput.js` → `entities/player.js`
- `js/entities/enemy/baseEnemy.js` → `enemyVariants.js` → `enemyBosses.js`
  → `entities/enemy.js`
- `js/entities/animation/animationData.js` → `animationBase.js` → `animationPose.js`
  → `animationRenderBase.js` → `animationWeapon.js` → `animationBody.js`
  → `entities/animation.js`
- `js/data/training.js` → `training/trainingDummy.js` → `trainingManagerBase.js`
  → `trainingModes.js` → `trainingManagerOverlay.js` → `ui/training.js`
- `js/ui/tutorial/tutorialDummy.js` → `tutorialManagerBase.js`
  → `tutorialManagerOverlay.js` → `ui/tutorial.js`

Khi thêm file mới, thêm thẻ `<script>` đúng vị trí trong chuỗi tương ứng và tăng
số `?v=` để trình duyệt nạp bản mới. Dữ liệu lưu nằm trong `localStorage`
(khóa `vovinam_huyet_chinh_gia_toc`).
