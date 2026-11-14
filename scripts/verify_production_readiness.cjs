const local = process.argv[2] || 'https://looplic.com';

async function check() {
  console.log('=== 1. Testing Homepage & Security Headers ===');
  const resHome = await fetch(local);
  console.log('Homepage status:', resHome.status);
  console.log('HSTS:', resHome.headers.get('strict-transport-security'));
  console.log('X-Content-Type-Options:', resHome.headers.get('x-content-type-options'));
  console.log('X-Frame-Options:', resHome.headers.get('x-frame-options'));
  console.log('Referrer-Policy:', resHome.headers.get('referrer-policy'));
  console.log('CSP-Report-Only:', resHome.headers.get('content-security-policy-report-only') ? 'PRESENT' : 'MISSING');
  
  const htmlHome = await resHome.text();
  console.log('Cookie banner in HTML?', htmlHome.includes('Privacy &amp; Cookie Preferences') || htmlHome.includes('Privacy & Cookie Preferences') || htmlHome.includes('looplic_cookie_consent'));
  console.log('Consent mode script in HTML?', htmlHome.includes('looplic-consent-mode'));

  console.log('\n=== 2. Testing Static Assets & Icons ===');
  const resOg = await fetch(local + '/og-image.png');
  console.log('og-image.png status:', resOg.status, 'size:', resOg.headers.get('content-length'));
  const resApple = await fetch(local + '/apple-touch-icon.png');
  console.log('apple-touch-icon.png status:', resApple.status);
  const resIcon = await fetch(local + '/icon.png');
  console.log('icon.png status:', resIcon.status);
  const resFavicon = await fetch(local + '/favicon.ico');
  console.log('favicon.ico status:', resFavicon.status);

  console.log('\n=== 3. Testing Robots & Sitemap ===');
  const resRobots = await fetch(local + '/robots.txt');
  console.log('robots.txt status:', resRobots.status);
  const resSitemap = await fetch(local + '/sitemap.xml');
  console.log('sitemap.xml status:', resSitemap.status);

  console.log('\n=== 4. Testing Custom 404 Route ===');
  const res404 = await fetch(local + '/non-existent-random-route-9876');
  console.log('404 route HTTP status:', res404.status);
  const html404 = await res404.text();
  console.log('Branded 404 copy found?', html404.includes('Looking for Something?') && html404.includes('Page Not Found'));
  console.log('404 navigation shortcuts found?', html404.includes('/sell') && html404.includes('/buy') && html404.includes('/data-recovery') && html404.includes('/track'));

  console.log('\n=== 5. Testing Legal Routes ===');
  const resPrivacy = await fetch(local + '/privacy-policy');
  console.log('privacy-policy status:', resPrivacy.status);
  const htmlPrivacy = await resPrivacy.text();
  console.log('Has cookies & analytics section?', htmlPrivacy.includes('Cookies, Local Storage, and Analytics'));

  const resTerms = await fetch(local + '/terms-and-conditions');
  console.log('terms-and-conditions status:', resTerms.status);
  const htmlTerms = await resTerms.text();
  console.log('Has Bengaluru jurisdiction clause?', htmlTerms.includes('Governing law and jurisdiction') && htmlTerms.includes('Bengaluru, Karnataka'));

  console.log('\n=== 6. Testing Contact Form & Honeypot ===');
  const resContact = await fetch(local + '/contact-us');
  console.log('contact-us status:', resContact.status);
  const htmlContact = await resContact.text();
  console.log('Contact form has honeypot input?', htmlContact.includes('name="website_hp"'));

  // Test honeypot API rejection/silent acceptance
  const spamRes = await fetch(local + '/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      website_hp: 'spambot_payload',
      customer: { name: 'Bot', phone: '1234567890' }
    })
  });
  console.log('Honeypot POST status:', spamRes.status, 'body:', await spamRes.json());
}

check().catch(console.error);
