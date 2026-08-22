// ─── Static Homepage Data ────────────────────────────────────────────────────
// Extracted from NewHomepageView to reduce client bundle size.
// This module has no React/lucide dependencies for better tree-shaking.

// Our Services grid
export const ourServices = [
  { id: "sell-phone", label: "Sell Phone", href: "/sell", image: "/images/services/sell-phone.webp" },
  { id: "buy-phone", label: "Buy Phone", href: "/buy", image: "/images/services/buy-phone.webp" },
  { id: "buy-laptop", label: "Buy Laptop", href: "/buy?category=laptop", image: "/images/services/buy-laptop.webp" },
  { id: "repair-phone", label: "Repair Phone", href: "/service/mobile-repair", image: "/images/services/repair-phone.webp" },
  { id: "repair-laptop", label: "Repair Laptop", href: "/service/laptop-repair", image: "/images/services/repair-laptop.webp" },
  { id: "cctv", label: "CCTV Install", href: "/service/cctv", image: "/images/services/cctv.webp" },
  { id: "it-support", label: "IT Support", href: "/service/it-support", image: "/images/services/it-support.webp" },
  { id: "desktop", label: "Desktop Build", href: "/service/desktop-assembly", image: "/images/services/desktop.webp" },
  { id: "screen-guard", label: "Screen Guard", href: "/service/mobile-repair", image: "/images/services/screen-guard.webp" },
  { id: "store-locator", label: "Our Stores", href: "/store-locator", image: "/images/services/store-locator.webp" },
  { id: "accessories", label: "Accessories", href: "/buy?category=accessories", image: "/images/services/accessories.webp" },
  { id: "wifi", label: "WiFi Setup", href: "/service/it-support", image: "/images/services/wifi.webp" },
];

// Sell Your Old Device section
export const sellCategories = [
  { id: "mobile", label: "Sell Phone", href: "/sell", image: "/images/sell/phone.webp" },
  { id: "laptop", label: "Sell Laptop", href: "/sell/laptop", image: "/images/sell/laptop.webp" },
  { id: "tablet", label: "Sell Tablet", href: "/sell/tablet", image: "/images/sell/tablet.webp" },
  { id: "smartwatch", label: "Sell Smartwatch", href: "/sell/smartwatch", image: "/images/sell/smartwatch.webp" },
  { id: "gaming", label: "Sell Console", href: "/sell", image: "/images/sell/console.webp" },
  { id: "earphones", label: "Sell Earphones", href: "/sell/audio", image: "/images/sell/earphones.webp" },
  { id: "desktop", label: "Sell Desktop", href: "/sell/laptop", image: "/images/sell/desktop.webp" },
];

// Buy Refurbished Devices
export const refurbishedProducts = [
  { name: "Samsung Galaxy S21 Ultra 5G", discount: "₹34,201 OFF", brand: "samsung", href: "/buy", image: "/images/products/samsung-s21-ultra.jpg" },
  { name: "Samsung Galaxy S24 Ultra 5G", discount: "₹69,700 OFF", brand: "samsung", href: "/buy", image: "/images/products/samsung-s24-ultra.jpg" },
  { name: "Samsung Galaxy S20 FE 5G", discount: "₹2,900 OFF", brand: "samsung", href: "/buy", image: "/images/products/samsung-s20-fe.jpg" },
  { name: "Samsung Galaxy S25 Edge", discount: "₹69,400 OFF", brand: "samsung", href: "/buy", image: "/images/products/samsung-s25-edge.jpg" },
  { name: "OnePlus Nord 2 5G", discount: "₹12,800 OFF", brand: "oneplus", href: "/buy", image: "/images/products/oneplus-nord-2.jpg" },
  { name: "OnePlus 12", discount: "₹28,500 OFF", brand: "oneplus", href: "/buy", image: "/images/products/oneplus-12.jpg" },
];

// Popular Devices to Sell
export const popularDevices = [
  { name: "iPhone 15 Pro Max", price: "₹62,000", href: "/sell", image: "/images/products/iphone-15-pro-max.jpg" },
  { name: "iPhone 14", price: "₹35,000", href: "/sell", image: "/images/products/iphone-14.jpg" },
  { name: "Samsung Galaxy S24", price: "₹42,000", href: "/sell", image: "/images/products/samsung-s24.jpg" },
  { name: "OnePlus 12", price: "₹32,000", href: "/sell", image: "/images/products/oneplus-12.jpg" },
  { name: "MacBook Air M2", price: "₹58,000", href: "/sell/laptop", image: "/images/products/macbook-air-m2.jpg" },
  { name: "iPhone 13", price: "₹25,000", href: "/sell", image: "/images/products/iphone-13.jpg" },
  { name: "Samsung Galaxy S23", price: "₹28,000", href: "/sell", image: "/images/products/samsung-s23.jpg" },
  { name: "Google Pixel 8", price: "₹28,000", href: "/sell", image: "/images/products/pixel-8.jpg" },
];

// How It Works - uses string icon keys mapped to lucide icons in the component
export const howItWorks = [
  { step: 1, title: "Select Your Device", description: "Choose brand, model & tell us the condition.", icon: "search" as const, color: "bg-blue-500" },
  { step: 2, title: "Get Instant Quote", description: "Best price calculated instantly.", icon: "rupee" as const, color: "bg-green-500" },
  { step: 3, title: "Free Doorstep Pickup", description: "We come to you at your convenience.", icon: "truck" as const, color: "bg-purple-500" },
  { step: 4, title: "Get Paid Instantly", description: "Payment via UPI, bank transfer or cash.", icon: "credit-card" as const, color: "bg-orange-500" },
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
