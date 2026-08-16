// ─── Static Homepage Data ────────────────────────────────────────────────────
// Extracted from NewHomepageView to reduce client bundle size.
// This module has no React/lucide dependencies for better tree-shaking.

// Our Services grid - real images from Cashify CDN (confirmed working)
export const ourServices = [
  { id: "sell-phone", label: "Sell Phone", href: "/sell", image: "https://s3ng.cashify.in/builder/cd13764b153e46e19f9c6551ee52b5e6.webp?w=300" },
  { id: "buy-phone", label: "Buy Phone", href: "/buy", image: "https://s3ng.cashify.in/builder/caa3a1efa51541a5aa37fd292790ea81.webp?w=300" },
  { id: "buy-laptop", label: "Buy Laptop", href: "/buy?category=laptop", image: "https://s3ng.cashify.in/builder/3e1f26febd3f4056a7ac5104a122aa94.webp?w=300" },
  { id: "repair-phone", label: "Repair Phone", href: "/service/mobile-repair", image: "https://s3ng.cashify.in/builder/b35c134330e5422699aed92d1254789d.webp?w=300" },
  { id: "repair-laptop", label: "Repair Laptop", href: "/service/laptop-repair", image: "https://s3ng.cashify.in/builder/16f1d0a9fb4448f8a971e259dc612f54.webp?w=300" },
  { id: "cctv", label: "CCTV Install", href: "/service/cctv", image: "https://s3ng.cashify.in/builder/16ee94e787b24915847842a6fee6b26a.webp?w=300" },
  { id: "it-support", label: "IT Support", href: "/service/it-support", image: "https://s3ng.cashify.in/builder/0c3495851c3a4cce993176d995c53ab4.webp?w=300" },
  { id: "desktop", label: "Desktop Build", href: "/service/desktop-assembly", image: "https://s3ng.cashify.in/builder/4060695bca3447c2b7296aa5ba9ce827.webp?w=300" },
  { id: "screen-guard", label: "Screen Guard", href: "/service/mobile-repair", image: "https://s3ng.cashify.in/builder/75750a866d214239bf52a47ee57e6674.webp?w=300" },
  { id: "store-locator", label: "Our Stores", href: "/store-locator", image: "https://s3ng.cashify.in/builder/522d89598f594f0ca6f9d22e40517db6.webp?w=300" },
  { id: "accessories", label: "Accessories", href: "/buy?category=accessories", image: "https://s3ng.cashify.in/builder/f1f0df2917bd410b8da95675c63be2d1.webp?w=300" },
  { id: "wifi", label: "WiFi Setup", href: "/service/it-support", image: "https://s3ng.cashify.in/builder/ed7d743ec18f40f6b0cbb58bc6783d5b.webp?w=300" },
];

// Sell Your Old Device section - real images from Cashify CDN
export const sellCategories = [
  { id: "mobile", label: "Sell Phone", href: "/sell", image: "https://s3ng.cashify.in/builder/81c3c74f0683463da548ae2cbe1fec28.webp?w=300" },
  { id: "laptop", label: "Sell Laptop", href: "/sell/laptop", image: "https://s3ng.cashify.in/builder/e6ba507509994216936925bdfeb6cfa8.webp?w=300" },
  { id: "tablet", label: "Sell Tablet", href: "/sell/tablet", image: "https://s3ng.cashify.in/builder/a12ac14b386b4b5286d424a83db4cad5.webp?w=300" },
  { id: "smartwatch", label: "Sell Smartwatch", href: "/sell/smartwatch", image: "https://s3ng.cashify.in/builder/b6a95f2838184c9889711ea20f6ff468.webp?w=300" },
  { id: "gaming", label: "Sell Console", href: "/sell", image: "https://s3ng.cashify.in/builder/5aba5b44686349a4a54d457016a257ac.webp?w=300" },
  { id: "earphones", label: "Sell Earphones", href: "/sell/audio", image: "https://s3ng.cashify.in/builder/abd3c512bbac4232a95e0e15f5d3bbaf.webp?w=300" },
  { id: "desktop", label: "Sell Desktop", href: "/sell/laptop", image: "https://s3ng.cashify.in/builder/1a1126c5c49f47b29cbb3aa63e6b385e.webp?w=300" },
];

// Buy Refurbished Devices - real product images from Cashify CDN
export const refurbishedProducts = [
  { name: "Samsung Galaxy S21 Ultra 5G", discount: "₹34,201 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/5ab3d199-fdb7.jpg" },
  { name: "Samsung Galaxy S24 Ultra 5G", discount: "₹69,700 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/a69ef28f-fe68.jpg" },
  { name: "Samsung Galaxy S20 FE 5G", discount: "₹2,900 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/dcbaf057-2937.jpg" },
  { name: "Samsung Galaxy S25 Edge", discount: "₹69,400 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/90cb48b8-8691.jpg" },
  { name: "OnePlus Nord 2 5G", discount: "₹12,800 OFF", brand: "oneplus", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/f6bf429a-1a54.jpg" },
  { name: "OnePlus 12", discount: "₹28,500 OFF", brand: "oneplus", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/3ba10c91-7df6.jpg" },
];

// Popular Devices to Sell - real product images from Cashify CDN
export const popularDevices = [
  { name: "iPhone 15 Pro Max", price: "₹62,000", href: "/sell", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/5ab3d199-fdb7.jpg" },
  { name: "iPhone 14", price: "₹35,000", href: "/sell", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/a69ef28f-fe68.jpg" },
  { name: "Samsung Galaxy S24", price: "₹42,000", href: "/sell", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/dcbaf057-2937.jpg" },
  { name: "OnePlus 12", price: "₹32,000", href: "/sell", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/3ba10c91-7df6.jpg" },
  { name: "MacBook Air M2", price: "₹58,000", href: "/sell/laptop", image: "https://s3ng.cashify.in/estore/90d6714360974efd81d8912c8bf00638.png" },
  { name: "iPhone 13", price: "₹25,000", href: "/sell", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/f6bf429a-1a54.jpg" },
  { name: "Samsung Galaxy S23", price: "₹28,000", href: "/sell", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/90cb48b8-8691.jpg" },
  { name: "Google Pixel 8", price: "₹28,000", href: "/sell", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/a69ef28f-fe68.jpg" },
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
