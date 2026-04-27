
import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:8080/gallery/');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'gallery-timeline-wait.png' });
  await browser.close();
})();
