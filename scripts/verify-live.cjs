async function verify() {
  for (const pagePath of ['/service/mobile-repair', '/service/laptop-repair']) {
    const pageUrl = 'https://looplic-js-main-eight.vercel.app' + pagePath;
    console.log('\n--- Checking:', pageUrl);
    const res = await fetch(pageUrl);
    console.log('Page status:', res.status);
    const html = await res.text();

    const brandImgMatches = [...html.matchAll(/<img[^>]+src=["'](\/images\/brands\/[^"']+)["'][^>]*alt=["']([^"']+)["']/g)];
    console.log('Found brand images in HTML:', brandImgMatches.length);
    for (const m of brandImgMatches.slice(0, 10)) {
      console.log(m[2].padEnd(15), '->', m[1]);
    }
  }

  // Also test fetching each brand image from the live site
  const testImages = [
    '/images/brands/apple.png',
    '/images/brands/samsung.png',
    '/images/brands/oneplus.png',
    '/images/brands/xiaomi.png',
    '/images/brands/google.png',
    '/images/brands/vivo.png',
    '/images/brands/oppo.png',
    '/images/brands/realme.png',
    '/images/brands/huawei.svg',
    '/images/brands/micromax.svg',
    '/images/brands/lava.svg',
    '/images/brands/motorola.png',
    '/images/brands/lenovo.png',
    '/images/brands/nokia.png',
    '/images/brands/honor.png',
    '/images/brands/asus.png',
    '/images/brands/lg.png',
    '/images/brands/infinix.png',
    '/images/brands/tecno.png',
    '/images/brands/iqoo.png',
    '/images/brands/nothing.png',
    '/images/brands/poco.png'
  ];

  console.log('\nTesting direct image URLs on production:');
  for (const img of testImages) {
    const r = await fetch('https://looplic-js-main-eight.vercel.app' + img);
    console.log(img.padEnd(30), r.status, r.headers.get('content-type'));
  }
}

verify().catch(console.error);
