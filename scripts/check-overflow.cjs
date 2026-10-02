const { chromium } = require('playwright');

async function checkOverflow() {
  const browser = await chromium.launch();
  for (const width of [1920, 1536, 1440, 1366, 1280, 1024, 768, 430, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const overflows = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = [];
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 2 || rect.left < -2) {
          overflowing.push({
            tag: el.tagName,
            id: el.id,
            className: el.className?.toString?.().slice(0, 80),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            docWidth
          });
        }
      }
      return {
        bodyScrollWidth: document.body.scrollWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        docWidth,
        overflowingCount: overflowing.length,
        samples: overflowing.slice(0, 10)
      };
    });
    console.log(`=== Viewport Width ${width}px ===`);
    console.log(`ScrollWidth: ${overflows.docScrollWidth}, ClientWidth: ${overflows.docWidth}, Overflows: ${overflows.overflowingCount}`);
    if (overflows.samples.length > 0) {
      console.log('Sample overflowing elements:', overflows.samples);
    }
    await page.close();
  }
  await browser.close();
}

checkOverflow().catch(console.error);
