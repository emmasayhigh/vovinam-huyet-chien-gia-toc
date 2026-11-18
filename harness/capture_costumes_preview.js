/**
 * Chụp ảnh Screenshot bản xem trước Phác Thảo Trang Phục HTML5 Canvas
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const { findChromiumExecutable } = require('./lib/utils');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function createStaticServer(port, cwd) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    const filePath = path.join(cwd, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + filePath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve({ server, port: server.address().port });
    });
    server.on('error', reject);
  });
}

async function capture() {
  const cwd = path.resolve(__dirname, '..');
  const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\c338bdb7-0ca6-4fe5-9eda-f88a79d226b8';
  const outputPath = path.join(artifactDir, 'canvas_character_costumes_preview.png');
  const executablePath = findChromiumExecutable();

  if (!executablePath) {
    console.error('Không tìm thấy trình duyệt Chromium.');
    process.exit(1);
  }

  const { chromium } = require('playwright');
  const { server, port } = await createStaticServer(0, cwd);
  console.log(`Server chạy tại cổng: ${port}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1800 }
  });

  const page = await context.newPage();

  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  page.on('pageerror', err => console.error('[Browser Error]', err));

  const url = `http://localhost:${port}/harness/preview_character_canvas.html`;
  console.log(`Đang mở: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

  // Đợi hình ảnh và canvas vẽ xong
  await page.waitForTimeout(2000);

  // Chụp ảnh viewport
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`Đã xuất ảnh screenshot thành công tại: ${outputPath}`);

  await browser.close();
  server.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

