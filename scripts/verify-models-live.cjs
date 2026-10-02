const fs = require('fs');

async function testLiveModels() {
  const routes = [
    '/service/mobile-repair/brands/apple/apple-iphone-16-series',
    '/service/mobile-repair/brands/samsung/galaxy-s24-series',
    '/sell/phone/apple/apple-iphone-16-series'
  ];

  for (const r of routes) {
    const url = 'https://looplic-js-main-eight.vercel.app' + r;
    console.log(`\n=== Testing ${url} ===`);
    try {
      const res = await fetch(url);
      console.log('Status:', res.status);
      const html = await res.text();
      const imgMatches = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"/g)];
      console.log(`Found ${imgMatches.length} <img> tags:`);
      for (const m of imgMatches.slice(0, 8)) {
        console.log(` - ${m[2]}: ${m[1].slice(0, 70)}...`);
      }
    } catch (e) {
      console.error('Error fetching', url, e.message);
    }
  }
}

testLiveModels();
