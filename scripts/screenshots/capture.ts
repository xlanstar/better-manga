/**
 * Chrome Web Store screenshot (1280×800) → store/screenshots/1-popup.png
 *
 *   bun run screenshots          (first time: bunx playwright install chromium)
 *
 * 1. Builds the extension and loads .output/chrome-mv3 into Playwright's
 *    Chromium (branded Chrome no longer honours --load-extension).
 * 2. Opens popup.html in a tab with `chrome.tabs.query` stubbed to return a
 *    supported-site URL, so the popup renders as if opened on that site.
 *    No third-party page is loaded, so no copyrighted manga ends up in it.
 * 3. Drops the popup capture into layout.html (copy + logo) and screenshots it.
 *
 * Edit layout.html for the copy; keep it in sync with the store listing.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

/** URL the popup believes it was opened on. Must match a site in the registry. */
const CURRENT_URL = 'https://reader.hipmh.top/chapter/1';

const root = fileURLToPath(new URL('../..', import.meta.url));
const ext = join(root, '.output/chrome-mv3');
const outDir = join(root, 'store/screenshots');
const out = join(outDir, '1-popup.png');

if (spawnSync('bun', ['run', 'build'], { cwd: root, stdio: 'inherit' }).status !== 0) {
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), 'better-manga-shot-'));
try {
  const popup = await capturePopup();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(new URL('layout.html', import.meta.url).href);
  await page.evaluate(async (src) => {
    const img = document.getElementById('popup') as HTMLImageElement;
    img.src = src;
    await img.decode();
  }, `data:image/png;base64,${popup.toString('base64')}`);
  mkdirSync(outDir, { recursive: true });
  await page.screenshot({ path: out });
  await browser.close();
  console.log(`✔ ${out}`);
} finally {
  rmSync(profile, { recursive: true, force: true });
}

async function capturePopup() {
  const ctx = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    viewport: { width: 340, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  try {
    const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));
    const id = new URL(sw.url()).host;
    const page = await ctx.newPage();
    await page.addInitScript((url) => {
      const tabs = (globalThis as any).chrome.tabs;
      const query = tabs.query.bind(tabs);
      tabs.query = async (info: { active?: boolean }) => (info?.active ? [{ id: 1, url }] : query(info));
    }, CURRENT_URL);
    await page.goto(`chrome-extension://${id}/popup.html`);
    await page.waitForSelector('h1');
    await page.waitForTimeout(500); // let accordion / fonts settle
    const box = await page.locator('body > * > *').first().boundingBox();
    if (!box) throw new Error('popup did not render');
    return await page.screenshot({
      clip: { x: 0, y: 0, width: Math.ceil(box.width), height: Math.ceil(box.height) },
    });
  } finally {
    await ctx.close();
  }
}
