// ─── Static Homepage Data ────────────────────────────────────────────────────
// Extracted from NewHomepageView to reduce client bundle size.
// This module has no React/lucide dependencies for better tree-shaking.

// Our Services grid
// All images use a uniform square crop for a cohesive, professional grid:
//   ?auto=format&fit=crop&w=400&h=400&q=80
// Every URL below was verified to return HTTP 200 image/jpeg.
export const ourServices = [
  { id: "repair-phone", label: "Repair Phones", href: "/service/mobile-repair", image: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "repair-laptop", label: "Repair Laptop", href: "/service/laptop-repair", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "data-recovery", label: "Hard Drive Data Recovery", href: "/service/it-support", image: "https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "apple-watch-repair", label: "Apple Watch Repair", href: "/service/mobile-repair", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "airpods-repair", label: "AirPods Repair", href: "/service/mobile-repair", image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "desktop", label: "Desktop Assembly", href: "/service/desktop-assembly", image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "it-support", label: "IT Support", href: "/service/it-support", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "cctv", label: "CCTV Installation", href: "/service/cctv", image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "sell-phone", label: "Sell Phone", href: "/sell", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "sell-laptop", label: "Sell Laptop", href: "/sell/laptop", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&h=400&q=80" },
  { id: "accessories", label: "Accessories", href: "/buy?category=accessories", image: "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=400&h=400&q=80" },
  // "Our Store" shows a live map of the actual Looplic store location
  // (1st Floor, Shawkat Building, SJP Road, Nagarathpete, Bengaluru 560002 —
  // lat 12.9632, lng 77.5784), matching apps/user/src/components/next/StoreLocatorView.tsx.
  { id: "store-locator", label: "Our Store", href: "/store-locator", image: "https://static-maps.yandex.ru/1.x/?ll=77.5784,12.9632&z=16&size=450,450&l=map&pt=77.5784,12.9632,pm2rdm&lang=en_US" },
];

// Sell Your Old Device section
export const sellCategories = [
  { id: "mobile", label: "Sell Phone", href: "/sell", image: "https://s3ng.cashify.in/builder/81c3c74f0683463da548ae2cbe1fec28.webp?w=300" },
  { id: "laptop", label: "Sell Laptop", href: "/sell/laptop", image: "https://s3ng.cashify.in/builder/e6ba507509994216936925bdfeb6cfa8.webp?w=300" },
  { id: "tablet", label: "Sell Tablet", href: "/sell/tablet", image: "https://s3ng.cashify.in/builder/a12ac14b386b4b5286d424a83db4cad5.webp?w=300" },
  { id: "smartwatch", label: "Sell Smartwatch", href: "/sell/smartwatch", image: "https://s3ng.cashify.in/builder/b6a95f2838184c9889711ea20f6ff468.webp?w=300" },
  { id: "gaming", label: "Sell Console", href: "/sell", image: "https://s3ng.cashify.in/builder/5aba5b44686349a4a54d457016a257ac.webp?w=300" },
  { id: "earphones", label: "Sell Earphones", href: "/sell/audio", image: "https://s3ng.cashify.in/builder/abd3c512bbac4232a95e0e15f5d3bbaf.webp?w=300" },
  { id: "desktop", label: "Sell Desktop", href: "/sell/laptop", image: "https://s3ng.cashify.in/builder/1a1126c5c49f47b29cbb3aa63e6b385e.webp?w=300" },
];

// Buy Refurbished Devices
export const refurbishedProducts = [
  { name: "Samsung Galaxy S21 Ultra 5G", discount: "₹34,201 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/5ab3d199-fdb7.jpg" },
  { name: "Samsung Galaxy S24 Ultra 5G", discount: "₹69,700 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/a69ef28f-fe68.jpg" },
  { name: "Samsung Galaxy S20 FE 5G", discount: "₹2,900 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/dcbaf057-2937.jpg" },
  { name: "Samsung Galaxy S25 Edge", discount: "₹69,400 OFF", brand: "samsung", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/90cb48b8-8691.jpg" },
  { name: "OnePlus Nord 2 5G", discount: "₹12,800 OFF", brand: "oneplus", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/f6bf429a-1a54.jpg" },
  { name: "OnePlus 12", discount: "₹28,500 OFF", brand: "oneplus", href: "/buy", image: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/3ba10c91-7df6.jpg" },
];

// Popular Devices to Sell
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
