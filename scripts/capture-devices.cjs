const { chromium } = require('playwright');
const path = require('path');

const devices = [
  { name: 'laptop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'tablet-ipad-768', width: 768, height: 1024 },
  { name: 'mobile-iphone-390', width: 390, height: 844 },
];

async function capture() {
  const browser = await chromium.launch();
  const artifactDir = path.resolve('C:/Users/Shrey/.gemini/antigravity-ide/brain/66d66f8f-b630-4eb9-acb0-b4155a0c05d1');

  for (const dev of devices) {
    const context = await browser.newContext({
      viewport: { width: dev.width, height: dev.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.textContent = '.splash-screen { display: none !important; }';
      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', () => document.head?.appendChild(style));
      }
    });

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const outPath = path.join(artifactDir, `verified_${dev.name}.png`);
    await page.screenshot({ path: outPath, animations: 'disabled' });
    console.log(`Saved screenshot for ${dev.name} to ${outPath}`);
    await context.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch(console.error);
