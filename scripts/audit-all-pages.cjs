const routes = [
  { path: "/", name: "Home" },
  { path: "/service/mobile-repair", name: "Mobile Repair" },
  { path: "/service/laptop-repair", name: "Laptop Repair" },
  { path: "/service/cctv", name: "CCTV Service" },
  { path: "/service/it-support", name: "IT Support" },
  { path: "/service/desktop-assembly", name: "Desktop Assembly" },
  { path: "/service/managed-it-services", name: "Managed IT" },
  { path: "/service/mobile-repair/brands", name: "Mobile Brands" },
  { path: "/service/laptop-repair/brands", name: "Laptop Brands" },
  { path: "/service/mobile-repair/brands/apple", name: "Apple Series" },
  { path: "/service/mobile-repair/brands/apple/apple-iphone-16-series", name: "iPhone 16 Models" },
  { path: "/sell", name: "Sell Home" },
  { path: "/sell/phone", name: "Sell Phone Brands" },
  { path: "/sell/phone/apple", name: "Sell Apple Series" },
  { path: "/sell/phone/apple/apple-iphone-16-series", name: "Sell iPhone 16 Models" },
  { path: "/sell/track", name: "Sell Tracking" },
  { path: "/track", name: "Order Tracking" },
  { path: "/buy", name: "Buy Refurbished" },
  { path: "/store-locator", name: "Store Locator" },
  { path: "/partners", name: "Partners" },
  { path: "/contact-us", name: "Contact Us" },
  { path: "/faq", name: "FAQ" },
  { path: "/cart", name: "Cart" },
  { path: "/checkout", name: "Checkout" },
  { path: "/auth", name: "Sign In / Sign Up" },
  { path: "/auth/reset-password", name: "Password Reset" },
  { path: "/privacy-policy", name: "Privacy Policy" },
  { path: "/terms-and-conditions", name: "Terms & Conditions" },
  { path: "/refund-policy", name: "Refund Policy" }
];

async function sweep() {
  const baseUrl = "https://looplic-js-main-eight.vercel.app";
  console.log(`Starting comprehensive route sweep on ${baseUrl}...\n`);

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    const url = baseUrl + r.path;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const status = res.status;
      if (status >= 200 && status < 400) {
        console.log(`[PASS] ${status} - ${r.name.padEnd(25)} -> ${r.path}`);
        passed++;
      } else {
        console.error(`[FAIL] ${status} - ${r.name.padEnd(25)} -> ${r.path}`);
        failed++;
      }
    } catch (err) {
      console.error(`[ERROR] ${r.name.padEnd(25)} -> ${r.path}:`, err.message);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${routes.length} routes.`);
}

sweep();
