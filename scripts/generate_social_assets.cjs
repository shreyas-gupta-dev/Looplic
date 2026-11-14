const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.resolve(__dirname, '../apps/user/public');
const icon512 = path.join(publicDir, 'looplic-app-icon-512.png');

async function run() {
  // 1. apple-touch-icon.png (180x180)
  await sharp(icon512).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('apple-touch-icon.png created successfully (180x180)');

  // 2. icon.png (192x192)
  await sharp(icon512).resize(192, 192).toFile(path.join(publicDir, 'icon.png'));
  console.log('icon.png created successfully (192x192)');

  // 3. og-image.png (1200x630)
  const svgCard = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#042f2e" />
        </linearGradient>
        <radialGradient id="glow" cx="80%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#059669" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#059669" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      <rect width="1200" height="630" fill="url(#glow)" />
      <rect x="60" y="60" width="1080" height="510" rx="24" fill="none" stroke="#334155" stroke-width="2" stroke-opacity="0.5" />
      
      <!-- Brand Pill -->
      <rect x="100" y="110" width="150" height="44" rx="22" fill="#064e3b" fill-opacity="0.8" stroke="#10b981" stroke-width="1.5" />
      <text x="175" y="138" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold" fill="#34d399" text-anchor="middle">LOOPLIC</text>
      
      <!-- Main Headline -->
      <text x="100" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="50" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
        Bangalore's Trusted Tech Platform
      </text>
      <text x="100" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="700" fill="#10b981">
        Sell, Buy &amp; Certified Data Recovery
      </text>
      
      <!-- Subtext -->
      <text x="100" y="375" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">
        Doorstep Device Pickup · Cleanroom Lab Diagnostics · Strict NDA &amp; Privacy
      </text>
      
      <!-- Badges -->
      <g transform="translate(100, 440)">
        <!-- Badge 1 -->
        <rect x="0" y="0" width="280" height="56" rx="14" fill="#1e293b" fill-opacity="0.9" stroke="#475569" stroke-width="1" />
        <text x="140" y="35" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#f8fafc" text-anchor="middle">Free Diagnostics</text>
        
        <!-- Badge 2 -->
        <rect x="300" y="0" width="280" height="56" rx="14" fill="#1e293b" fill-opacity="0.9" stroke="#475569" stroke-width="1" />
        <text x="440" y="35" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#f8fafc" text-anchor="middle">Instant Bank Transfer</text>
        
        <!-- Badge 3 -->
        <rect x="600" y="0" width="280" height="56" rx="14" fill="#1e293b" fill-opacity="0.9" stroke="#475569" stroke-width="1" />
        <text x="740" y="35" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#f8fafc" text-anchor="middle">Doorstep Across BLR</text>
      </g>
      
      <!-- Footer website -->
      <text x="100" y="535" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="600" fill="#64748b">
        looplic.com · +91 88844 45924
      </text>
    </svg>
  `);

  await sharp(svgCard).png().toFile(path.join(publicDir, 'og-image.png'));
  console.log('og-image.png created successfully (1200x630)');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
