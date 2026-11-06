// プレビュー動画・ポスター生成
//   npm run preview:record            → preview.webm が無いデモすべて
//   npm run preview:record -- photo-001 text-001   → 指定IDを再生成
// ホバー系デモは index.html の <head> に <meta name="preview-hover" content=".対象セレクタ"> を置く
// 常時ループ・読み込み時など、長めに録りたいデモは <meta name="preview-duration" content="6000">（ミリ秒）
// クリック系（メニュー開閉など）は <meta name="preview-click" content=".トリガーのセレクタ">（開く→閉じるの1往復）
// 出力: public/demos/[id]/{preview.webm, poster.jpg, preview.mp4(Safari用。ffmpeg-static で変換)}
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readdirSync, existsSync, readFileSync, renameSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';

// mp4変換用ffmpeg：システムにあればそれを、無ければ同梱の ffmpeg-static を使う
const FFMPEG = spawnSync('ffmpeg', ['-version']).status === 0 ? 'ffmpeg' : ffmpegStatic;
const toMp4 = (dir) => spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', join(dir, 'preview.webm'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(dir, 'preview.mp4')]).status === 0;

const ROOT = new URL('../public/', import.meta.url).pathname;
const DEMOS = join(ROOT, 'demos');
const SIZE = { width: 640, height: 400 }; // 一覧カード（16:10）に合わせる
const HOLD_MS = 1500;   // 読み込み後、動きを待つ時間
const SCROLL_MS = 2500; // スクロールが必要なデモでの下方向スクロール時間
const TAIL_MS = 1200;   // 動き終わりの余韻

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' };

const args = process.argv.slice(2);
const all = readdirSync(DEMOS).filter((d) => !d.startsWith('_') && existsSync(join(DEMOS, d, 'index.html')));
const unknown = args.filter((a) => !all.includes(a));
if (unknown.length) { console.error(`✗ 存在しないID: ${unknown.join(', ')}`); process.exit(1); }
const targets = args.length ? args : all.filter((id) => !existsSync(join(DEMOS, id, 'preview.webm')));

// webm はあるが mp4 が無いものは、録画し直さず変換だけ行う
for (const id of all.filter((id) => !targets.includes(id) && existsSync(join(DEMOS, id, 'preview.webm')) && !existsSync(join(DEMOS, id, 'preview.mp4')))) {
  console.log(toMp4(join(DEMOS, id)) ? `✓ ${id} (mp4のみ)` : `✗ ${id}: mp4変換に失敗`);
}
if (!targets.length) { console.log('録画対象はありません（すべて生成済み）'); process.exit(0); }

// public/ を配信する簡易サーバー（dev/ビルド不要）
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;


const browser = await chromium.launch();
let failed = 0;
for (const id of targets) {
  const tmp = mkdtempSync(join(tmpdir(), 'preview-'));
  const out = join(DEMOS, id);
  try {
    const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: tmp, size: SIZE }, reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(`${base}/demos/${id}/?bg=light`, { waitUntil: 'load' });
    const meta = (name) => page.evaluate((n) => document.querySelector(`meta[name="${n}"]`)?.content, name);
    await page.waitForTimeout(Number(await meta('preview-duration')) || HOLD_MS);

    // スクロールできるデモは、ゆっくり下まで送って動きのきっかけを作る
    let posterDone = false;
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (max > 0) {
      const steps = 30;
      for (let i = 1; i <= steps; i++) {
        await page.evaluate((y) => scrollTo(0, y), Math.round((max * i) / steps));
        await page.waitForTimeout(SCROLL_MS / steps);
        // ポスターは「下端」だと余白ばかりになりがちなので、途中（55%）で動きが落ち着いてから撮る
        if (!posterDone && i === Math.round(steps * 0.55)) {
          await page.waitForTimeout(1600);
          await page.screenshot({ path: join(out, 'poster.jpg'), type: 'jpeg', quality: 85 });
          posterDone = true;
        }
      }
    }

    // ホバー/クリック系：<meta name="preview-hover" content=".selector"> があれば、その要素に乗せて外す（2往復）
    const hoverSel = await meta('preview-hover');
    const clickSel = await meta('preview-click');
    if (clickSel) {
      await page.click(clickSel); await page.waitForTimeout(1700);
      // ポスターは「開いた状態」で撮る
      if (!posterDone) { await page.screenshot({ path: join(out, 'poster.jpg'), type: 'jpeg', quality: 85 }); posterDone = true; }
      await page.waitForTimeout(900);
      await page.click(clickSel); await page.waitForTimeout(1000);
    }
    if (hoverSel) {
      for (let i = 0; i < 2; i++) {
        await page.hover(hoverSel);
        await page.waitForTimeout(900);
        await page.mouse.move(2, 2);
        await page.waitForTimeout(700);
      }
    }
    await page.waitForTimeout(TAIL_MS);
    if (!posterDone) await page.screenshot({ path: join(out, 'poster.jpg'), type: 'jpeg', quality: 85 });

    const video = page.video();
    await ctx.close(); // 動画はclose時に書き出される
    renameSync(await video.path(), join(out, 'preview.webm'));

    if (!toMp4(out)) console.warn(`  ! ${id}: mp4変換に失敗`);
    console.log(`✓ ${id}`);
  } catch (e) {
    failed++; console.error(`✗ ${id}: ${e.message}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
