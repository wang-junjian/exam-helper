const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const repoDir = path.resolve(__dirname, '..', 'repository', '普考-一线（其他人员）');
  const htmlPath = path.resolve(__dirname, '..', 'exam-helper.html');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('file://' + htmlPath);

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('#selectBtn')
  ]);

  try {
    await fileChooser.setFiles(repoDir);
  } catch (e) {
    console.log('setFiles(dir) failed:', e.message);
    // fallback: pass all files
    const fs = require('fs');
    const files = fs.readdirSync(repoDir)
      .filter(f => /\.(xls|xlsx|csv)$/i.test(f))
      .map(f => path.join(repoDir, f));
    await fileChooser.setFiles(files);
  }

  await page.waitForTimeout(3000);

  const status = await page.locator('#status').textContent();
  const count = await page.locator('#count').textContent();
  const cards = await page.locator('.card').count();

  console.log('status:', status);
  console.log('count:', count);
  console.log('cards:', cards);

  await page.fill('#search', '安全');
  await page.waitForTimeout(500);
  console.log('search count:', await page.locator('#count').textContent());
  console.log('search cards:', await page.locator('.card').count());

  await browser.close();
})();
