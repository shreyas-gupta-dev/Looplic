async function check() {
  const res = await fetch('https://looplic-js-main-eight.vercel.app/service/mobile-repair/brands/apple?category=cdee030c-a2b7-4b65-aee2-b6769792edae');
  const html = await res.text();
  const idx = html.indexOf('/service/mobile-repair/brands/apple/apple-iphone-11-series');
  console.log(html.slice(Math.max(0, idx - 600), idx + 200));
}
check();
