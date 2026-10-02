// ─── Static Homepage Data ────────────────────────────────────────────────────
// Extracted from NewHomepageView to reduce client bundle size.
// This module has no React/lucide dependencies for better tree-shaking.
//
// Images are NOT declared here. Every slot lives in src/lib/images/registry.ts
// and is looked up by id, so this file stays about content and routing while the
// registry owns assets and alt text. See that file for why the previous inline
// Unsplash and s3ng.cashify.in URLs were removed.

// Our Services grid
export const ourServices = [
  { id: "repair-phone", label: "Repair Phones", href: "/service/mobile-repair" },
  { id: "repair-laptop", label: "Repair Laptop", href: "/service/laptop-repair" },
  { id: "data-recovery", label: "Hard Drive Data Recovery", href: "/service/it-support" },
  { id: "apple-watch-repair", label: "Apple Watch Repair", href: "/service/mobile-repair" },
  { id: "airpods-repair", label: "AirPods Repair", href: "/service/mobile-repair" },
  { id: "desktop", label: "Desktop Assembly", href: "/service/desktop-assembly" },
  { id: "it-support", label: "IT Support", href: "/service/it-support" },
  { id: "cctv", label: "CCTV Installation", href: "/service/cctv" },
  { id: "sell-phone", label: "Sell Phone", href: "/sell" },
  { id: "sell-laptop", label: "Sell Laptop", href: "/sell/laptop" },
  { id: "accessories", label: "Accessories", href: "/buy?category=accessories" },
  // "Our Store" points at the store locator page, which renders the real map for
  // 1st Floor, Shawkat Building, SJP Road, Nagarathpete, Bengaluru 560002
  // (lat 12.9632, lng 77.5784) — see StoreLocatorView.tsx. The tile itself uses a
  // brand illustration rather than a third-party static-map image.
  { id: "store-locator", label: "Our Store", href: "/store-locator" },
];

// Sell Your Old Device section
export const sellCategories = [
  { id: "mobile", label: "Sell Phone", href: "/sell" },
  { id: "laptop", label: "Sell Laptop", href: "/sell/laptop" },
  { id: "tablet", label: "Sell Tablet", href: "/sell/tablet" },
  { id: "smartwatch", label: "Sell Smartwatch", href: "/sell/smartwatch" },
  { id: "gaming", label: "Sell Console", href: "/sell" },
  { id: "earphones", label: "Sell Earphones", href: "/sell/audio" },
  { id: "desktop", label: "Sell Desktop", href: "/sell/desktop" },
];

// Buy Refurbished Devices
// `deviceType` selects the placeholder silhouette; there is no `image` field
// because Looplic does not own product photography for these yet and the previous
// URLs were a competitor's.
export const refurbishedProducts = [
  { name: "Samsung Galaxy S21 Ultra 5G", discount: "₹34,201 OFF", brand: "samsung", href: "/buy", deviceType: "mobile" as const },
  { name: "Samsung Galaxy S24 Ultra 5G", discount: "₹69,700 OFF", brand: "samsung", href: "/buy", deviceType: "mobile" as const },
  { name: "Samsung Galaxy S20 FE 5G", discount: "₹2,900 OFF", brand: "samsung", href: "/buy", deviceType: "mobile" as const },
  { name: "Samsung Galaxy S25 Edge", discount: "₹69,400 OFF", brand: "samsung", href: "/buy", deviceType: "mobile" as const },
  { name: "OnePlus Nord 2 5G", discount: "₹12,800 OFF", brand: "oneplus", href: "/buy", deviceType: "mobile" as const },
  { name: "OnePlus 12", discount: "₹28,500 OFF", brand: "oneplus", href: "/buy", deviceType: "mobile" as const },
];

// Popular Devices to Sell
export const popularDevices = [
  { name: "iPhone 15 Pro Max", price: "₹62,000", href: "/sell", deviceType: "mobile" as const },
  { name: "iPhone 14", price: "₹35,000", href: "/sell", deviceType: "mobile" as const },
  { name: "Samsung Galaxy S24", price: "₹42,000", href: "/sell", deviceType: "mobile" as const },
  { name: "OnePlus 12", price: "₹32,000", href: "/sell", deviceType: "mobile" as const },
  { name: "MacBook Air M2", price: "₹58,000", href: "/sell/laptop", deviceType: "laptop" as const },
  { name: "iPhone 13", price: "₹25,000", href: "/sell", deviceType: "mobile" as const },
  { name: "Samsung Galaxy S23", price: "₹28,000", href: "/sell", deviceType: "mobile" as const },
  { name: "Google Pixel 8", price: "₹28,000", href: "/sell", deviceType: "mobile" as const },
];

// How It Works - uses string icon keys mapped to lucide icons in the component
// Step accents walk the Looplic logo gradient: blue -> cyan -> teal -> navy
export const howItWorks = [
  { step: 1, title: "Select Your Device", description: "Choose brand, model & tell us the condition.", icon: "search" as const, color: "bg-brand-600" },
  { step: 2, title: "Get Instant Quote", description: "Best price calculated instantly.", icon: "rupee" as const, color: "bg-brandcyan-500" },
  { step: 3, title: "Free Doorstep Pickup", description: "We come to you at your convenience.", icon: "truck" as const, color: "bg-brandteal-500" },
  { step: 4, title: "Get Paid Instantly", description: "Payment via UPI, bank transfer or cash.", icon: "credit-card" as const, color: "bg-brandnavy-800" },
];

export type HowItWorksIconKey = (typeof howItWorks)[number]["icon"];

export const testimonials = [
  { name: "Rahul Sharma", location: "Koramangala, Bangalore", rating: 5, text: "Sold my iPhone 13 Pro and got ₹38,000 — way more than what others quoted. The technician came to my apartment within 2 hours." },
  { name: "Priya Venkatesh", location: "Indiranagar, Bangalore", rating: 5, text: "Got my Samsung S23 screen replaced at doorstep. ₹2,499 with 6 month warranty. Done in 45 minutes flat." },
  { name: "Arjun K.", location: "Whitefield, Bangalore", rating: 5, text: "Booked CCTV installation for my villa. Team was professional, completed 4 cameras + NVR setup in one day." },
  { name: "Sneha Reddy", location: "HSR Layout, Bangalore", rating: 5, text: "Sold my MacBook Air M1 for ₹42,000. They picked it up from my office. Payment came via UPI in 5 minutes." },
  { name: "Vikram Patel", location: "Electronic City, Bangalore", rating: 5, text: "I was nervous about selling online but Looplic made it super simple. Got ₹28,000 for my OnePlus 11. No hassle at all." },
  { name: "Meera Iyer", location: "Jayanagar, Bangalore", rating: 5, text: "My laptop had a broken screen and keyboard. Looplic fixed both in one visit at my home. Professional service!" },
  { name: "Karthik S.", location: "Marathahalli, Bangalore", rating: 5, text: "Sold my old Samsung Galaxy S22 and got instant payment. The whole process took less than 30 minutes." },
  { name: "Anita Rao", location: "BTM Layout, Bangalore", rating: 5, text: "Got WiFi setup done for my new apartment. The technician was on time and very knowledgeable. Highly recommend!" },
];

export const trustStats = [
  { value: "47,200+", label: "Devices Serviced" },
  { value: "23,800+", label: "Happy Customers" },
  { value: "Bangalore", label: "City Served" },
  { value: "4.7★", label: "Google Rating" },
];
