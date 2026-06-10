export type SeoServicePage = {
  slug: string;
  keyword: string;
  city: string;
  problem: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryHref: string;
  secondaryLabel: string;
  highlights: string[];
  serviceSteps?: string[];
  brandLinks?: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  detailBlocks?: Array<{
    title: string;
    items: string[];
  }>;
  sections: Array<{
    title: string;
    body: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

const screenReplacementBrandPages = [
  {
    brand: "Apple iPhone",
    slug: "apple-iphone-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/apple",
    problem: "iPhone cracked display, touch issues, OLED lines, black screen, or front glass damage",
    highlights: ["Apple model route", "iPhone display inspection", "Quote before repair", "Doorstep booking flow"],
    popularModels: ["iPhone 11 series", "iPhone 12 series", "iPhone 13 series", "iPhone 14 series", "iPhone 15 series"],
  },
  {
    brand: "Samsung",
    slug: "samsung-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/samsung",
    problem: "Samsung display cracks, green lines, black screen, flicker, touch issues, or panel damage",
    highlights: ["Galaxy model selection", "Screen issue inspection", "Quote before repair", "Doorstep booking flow"],
    popularModels: ["Galaxy S series", "Galaxy A series", "Galaxy M series", "Galaxy Note series", "Galaxy Z Fold and Flip"],
  },
  {
    brand: "OnePlus",
    slug: "oneplus-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/oneplus",
    problem: "OnePlus cracked glass, display lines, dead touch, flicker, or black screen issues",
    highlights: ["OnePlus model route", "AMOLED issue check", "Repair quote first", "Doorstep technician support"],
    popularModels: ["OnePlus Nord", "OnePlus number series", "OnePlus R series", "OnePlus Pro models"],
  },
  {
    brand: "Mi",
    slug: "mi-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/mi",
    problem: "Mi phone display cracks, touch faults, screen bleeding, black screen, or broken front glass",
    highlights: ["Mi model selection", "Display issue inspection", "Quote before repair", "Doorstep booking flow"],
    popularModels: ["Mi 10 series", "Mi 11 series", "Mi A series", "Mi Note series", "Mi Max series"],
  },
  {
    brand: "Google Pixel",
    slug: "google-pixel-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/google",
    problem: "Pixel cracked display, OLED lines, touch response issues, and black screen problems",
    highlights: ["Pixel model flow", "Display diagnosis", "Technician inspection", "Quote confirmation"],
    popularModels: ["Pixel 6 series", "Pixel 7 series", "Pixel 8 series", "Pixel A series"],
  },
  {
    brand: "Vivo",
    slug: "vivo-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/vivo",
    problem: "Vivo display cracks, touch failure, white lines, black screen, or broken front glass",
    highlights: ["Vivo device route", "Model-wise booking", "Screen repair category", "Doorstep support"],
    popularModels: ["Vivo V series", "Vivo Y series", "Vivo T series", "Vivo X series"],
  },
  {
    brand: "Oppo",
    slug: "oppo-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/oppo",
    problem: "Oppo cracked screen, touch problems, display flicker, panel lines, or glass damage",
    highlights: ["Oppo model selection", "Display issue check", "Quote before work", "Booking workflow"],
    popularModels: ["Oppo Reno series", "Oppo F series", "Oppo A series", "Oppo Find series"],
  },
  {
    brand: "Realme",
    slug: "realme-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/realme",
    problem: "Realme display damage, dead touch, black screen, screen lines, or broken glass",
    highlights: ["Realme model flow", "Damage inspection", "Transparent quote", "Doorstep booking"],
    popularModels: ["Realme number series", "Realme Narzo", "Realme C series", "Realme GT series"],
  },
  {
    brand: "Motorola",
    slug: "motorola-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/motorola",
    problem: "Motorola cracked display, touch faults, panel damage, flicker, or black screen",
    highlights: ["Motorola model route", "Screen category support", "Inspection-led quote", "Online request"],
    popularModels: ["Moto G series", "Moto Edge series", "Moto E series", "Moto Razr"],
  },
  {
    brand: "Nothing",
    slug: "nothing-phone-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/nothing",
    problem: "Nothing Phone display cracks, OLED damage, touch issues, flicker, or black screen",
    highlights: ["Nothing model route", "Display diagnosis", "Quote confirmation", "Doorstep support"],
    popularModels: ["Nothing Phone 1", "Nothing Phone 2", "Nothing Phone 2a", "Nothing CMF Phone"],
  },
  {
    brand: "Poco",
    slug: "poco-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/poco",
    problem: "Poco cracked display, screen bleeding, dead touch, flicker, or black screen problems",
    highlights: ["Poco model selection", "Screen issue inspection", "Repair estimate first", "Mobile repair flow"],
    popularModels: ["Poco X series", "Poco F series", "Poco M series", "Poco C series"],
  },
  {
    brand: "iQOO",
    slug: "iqoo-screen-replacement",
    ctaHref: "/service/mobile-repair/brands/iqoo",
    problem: "iQOO cracked glass, AMOLED panel lines, touch issues, flicker, or black screen",
    highlights: ["iQOO model route", "Performance phone support", "Quote before repair", "Doorstep booking"],
    popularModels: ["iQOO Z series", "iQOO Neo series", "iQOO number series"],
  },
] as const;

const screenReplacementBrandLinks = screenReplacementBrandPages.map((page) => ({
  label: `${page.brand} screen replacement`,
  href: `/${page.slug}`,
  description: `Dedicated ${page.brand} screen repair page for Bangalore customers.`,
}));

const generatedScreenReplacementPages: SeoServicePage[] = screenReplacementBrandPages.map((brandPage) => ({
  slug: brandPage.slug,
  keyword: `${brandPage.brand} Screen Replacement in Bangalore`,
  city: "Bangalore",
  problem: brandPage.problem,
  eyebrow: `${brandPage.brand} Screen Replacement`,
  title: `${brandPage.brand} Screen Replacement in Bangalore`,
  description: `Book ${brandPage.brand} screen replacement in Bangalore for cracked glass, display lines, dead touch, flicker, black screen, and visible panel damage with doorstep inspection and quote confirmation.`,
  ctaLabel: `Choose ${brandPage.brand} model`,
  ctaHref: brandPage.ctaHref,
  secondaryHref: "/service/mobile-repair/brands",
  secondaryLabel: "Browse all mobile brands",
  highlights: [...brandPage.highlights],
  serviceSteps: ["Select the phone brand", "Choose the exact series and model", "Pick screen replacement in the repair flow", "Share the inspect location", "Approve the repair quote before work starts"],
  brandLinks: screenReplacementBrandLinks.filter((link) => link.href !== `/${brandPage.slug}`),
  detailBlocks: [
    {
      title: "Common symptoms",
      items: ["Cracked or shattered front glass", "Green, white, or vertical display lines", "Dead touch, ghost touch, or delayed touch", "Black screen after drop or pressure damage", "Display flicker, bleeding, or brightness issues"],
    },
    {
      title: "Popular model families",
      items: [...brandPage.popularModels],
    },
  ],
  sections: [
    { title: "Screen-first booking", body: `This page is built for ${brandPage.brand} users who already know the display is the problem. The primary action sends them into the ${brandPage.brand} mobile repair path instead of a generic contact page.` },
    { title: "Inspection before replacement", body: "A technician can check whether the issue is glass, touch layer, display panel, connector, or another related fault before the final quote is confirmed." },
    { title: "Connected to operations", body: "The request stays inside the Looplic workflow for assignment, inspection notes, quote creation, billing, and completion tracking." },
  ],
  faqs: [
    { question: `Can I book ${brandPage.brand} screen replacement online?`, answer: `Yes. Choose your ${brandPage.brand} model and continue into the mobile repair booking flow.` },
    { question: "Will I get a quote before repair?", answer: "Yes. The repair flow supports inspection and quote confirmation before the job is completed." },
    { question: "What if the screen issue is not only the display?", answer: "The technician can inspect related causes such as connector, body damage, touch layer, or motherboard-linked display faults." },
  ],
}));

export const seoServicePages: SeoServicePage[] = [
  {
    slug: "iphone-screen-replacement",
    keyword: "Doorstep iPhone Screen Replacement in Bangalore",
    city: "Bangalore",
    problem: "cracked or damaged iPhone display",
    eyebrow: "iPhone Screen Replacement",
    title: "Doorstep iPhone Screen Replacement in Bangalore",
    description: "Book an iPhone screen inspection and replacement flow for cracked glass, touch issues, display lines, black screen problems, and visible panel damage in Bangalore.",
    ctaLabel: "Book iPhone screen repair",
    ctaHref: "/service/mobile-repair/book/apple/11-series/iphone-11?step=repair&category=a46f9cf5-c005-48c3-8672-3d097587e6fb&repair=8b220074-d814-47b8-ae20-c0c446744e94",
    secondaryHref: "/service/mobile-repair/brands/apple",
    secondaryLabel: "Choose another iPhone",
    highlights: ["Screen category preselected", "Doorstep technician inspection", "Quote before repair", "Booking connected to mobile repair workflow"],
    sections: [
      { title: "Built for one problem", body: "This page is focused only on iPhone screen replacement in Bangalore, so visitors with cracked glass, display flicker, dead touch, or black screen issues land directly on the right repair intent." },
      { title: "Connected to booking", body: "The primary action opens the iPhone repair flow with the screen replacement category selected. Customers can change the model during the flow if their iPhone is different." },
      { title: "What happens next", body: "After the request is submitted, operations can assign a technician, inspect the device, create the repair quote, and complete billing through the dashboard workflow." },
    ],
    faqs: [
      { question: "Can I book this for another iPhone model?", answer: "Yes. Use the alternate iPhone link to choose the exact Apple model before booking." },
      { question: "Will the technician inspect before repair?", answer: "Yes. The workflow keeps inspection and quote confirmation before completion." },
    ],
  },
  ...generatedScreenReplacementPages,
  {
    slug: "macbook-repair",
    keyword: "MacBook Repair in Bangalore",
    city: "Bangalore",
    problem: "MacBook not charging, slow performance, keyboard, display, or battery issues",
    eyebrow: "MacBook Repair",
    title: "MacBook Repair in Bangalore",
    description: "Get a MacBook repair booking path for battery, keyboard, display, charging, software, and performance issues with technician inspection in Bangalore.",
    ctaLabel: "Choose MacBook model",
    ctaHref: "/service/laptop-repair/brands/apple",
    secondaryHref: "/service/laptop-repair/brands",
    secondaryLabel: "Browse laptop brands",
    highlights: ["Apple laptop route", "Model-specific booking", "Technician inspection", "Quote and billing workflow"],
    sections: [
      { title: "One device family", body: "This page targets MacBook repair in Bangalore and sends visitors into the Apple laptop catalog instead of a generic service page." },
      { title: "Common MacBook problems", body: "Use it for battery drain, keyboard failure, display damage, charging problems, software setup, overheating, and performance checks." },
      { title: "Repair flow", body: "The customer chooses the MacBook model, shares the inspect location, and the team can assign a technician from the admin or operator dashboard." },
    ],
    faqs: [
      { question: "Can I select my MacBook model?", answer: "Yes. The CTA opens the Apple laptop model flow." },
      { question: "Is this only for hardware repair?", answer: "No. It can also cover setup, software, performance, and inspection-based diagnosis." },
    ],
  },
  {
    slug: "doorstep-mobile-repair",
    keyword: "Online Mobile Repair in Bangalore",
    city: "Bangalore",
    problem: "phone repair booking without visiting a shop",
    eyebrow: "Doorstep Mobile Repair",
    title: "Online Mobile Repair in Bangalore",
    description: "Book mobile repair online in Bangalore for screen, battery, camera, body, sensor, speaker, and motherboard inspection at your preferred location.",
    ctaLabel: "Start mobile repair booking",
    ctaHref: "/service/mobile-repair/brands",
    secondaryHref: "/service/mobile-repair",
    secondaryLabel: "View mobile repair service",
    highlights: ["Online booking", "Brand and model selection", "Inspect location capture", "Technician assignment workflow"],
    sections: [
      { title: "One booking problem", body: "This page targets customers searching for online mobile repair in Bangalore and moves them into the brand-first mobile repair flow." },
      { title: "Covered issues", body: "Customers can choose screen, battery, camera, body, speaker, sensor, motherboard, or other repair categories after selecting a model." },
      { title: "Operational handoff", body: "Orders enter the same admin/operator workflow for assignment, inspection, quoting, billing, and completion." },
    ],
    faqs: [
      { question: "Do I need to call first?", answer: "No. You can begin with the online booking flow and share the inspect location." },
      { question: "Can I choose my exact phone model?", answer: "Yes. The booking starts with brand, series, and model selection." },
    ],
  },
  {
    slug: "office-it-support",
    keyword: "Office IT Support in Bangalore",
    city: "Bangalore",
    problem: "office systems, software, printer, network, and maintenance issues",
    eyebrow: "Office IT Support",
    title: "Office IT Support in Bangalore",
    description: "Book office IT support in Bangalore for employee systems, software installation, printer setup, backup basics, WiFi troubleshooting, and day-to-day maintenance.",
    ctaLabel: "Book office IT support",
    ctaHref: "/book/it-support",
    secondaryHref: "/service/managed-it-services",
    secondaryLabel: "View managed IT services",
    highlights: ["Office-focused support", "Employee system maintenance", "Printer and network help", "Managed IT upgrade path"],
    sections: [
      { title: "One business problem", body: "This page targets offices that need practical IT support in Bangalore without sending users into unrelated consumer repair pages." },
      { title: "Support scope", body: "Use it for laptop/desktop checks, software installation, printer setup, WiFi troubleshooting, cloud setup, and backup basics." },
      { title: "Recurring support ready", body: "Businesses that need repeat visits can move from one-time IT support into managed IT services or AMC planning." },
    ],
    faqs: [
      { question: "Is this for small offices?", answer: "Yes. It is designed for small teams, shops, studios, and office users." },
      { question: "Can this become recurring IT support?", answer: "Yes. Managed IT Services is linked as the secondary action." },
    ],
  },
  {
    slug: "wifi-network-installation",
    keyword: "WiFi Network Installation in Bangalore",
    city: "Bangalore",
    problem: "weak WiFi, router setup, and network coverage issues",
    eyebrow: "WiFi Network Installation",
    title: "WiFi Network Installation in Bangalore",
    description: "Book WiFi network installation in Bangalore for router setup, coverage checks, office connectivity, printer sharing, and basic network troubleshooting.",
    ctaLabel: "Book WiFi support",
    ctaHref: "/book/it-support",
    secondaryHref: "/service/it-support",
    secondaryLabel: "View IT support",
    highlights: ["Router and WiFi setup", "Coverage troubleshooting", "Printer and device connectivity", "Office network basics"],
    sections: [
      { title: "One network problem", body: "This page targets WiFi setup and network installation in Bangalore, not broad IT services." },
      { title: "Best-fit cases", body: "Use it for new router setup, dead zones, device connection problems, printer sharing, basic LAN checks, and office internet troubleshooting." },
      { title: "Booking path", body: "The CTA opens the IT support booking flow where the user can describe the WiFi or network issue and share the inspect location." },
    ],
    faqs: [
      { question: "Can this cover office WiFi?", answer: "Yes. The page is built for home and office WiFi support." },
      { question: "Will the technician test coverage?", answer: "The inspection flow supports coverage checks and practical setup recommendations." },
    ],
  },
  {
    slug: "laptop-keyboard-repair",
    keyword: "Laptop Keyboard Repair in Bangalore",
    city: "Bangalore",
    problem: "laptop keyboard keys not working or replacement needed",
    eyebrow: "Laptop Keyboard Repair",
    title: "Laptop Keyboard Repair in Bangalore",
    description: "Book laptop keyboard repair in Bangalore for stuck keys, dead keys, damaged keyboard panels, typing issues, and replacement inspection.",
    ctaLabel: "Choose laptop model",
    ctaHref: "/service/laptop-repair/brands",
    secondaryHref: "/service/laptop-repair",
    secondaryLabel: "View laptop repair",
    highlights: ["Laptop repair flow", "Model selection first", "Keyboard category available", "Quote after inspection"],
    sections: [
      { title: "One laptop issue", body: "This page focuses only on laptop keyboard repair in Bangalore, helping keyboard-problem traffic reach the laptop repair catalog." },
      { title: "Symptoms covered", body: "Dead keys, sticky keys, liquid damage signs, damaged keycaps, typing mismatch, and full keyboard replacement can be inspected." },
      { title: "Connected flow", body: "The user selects the laptop brand and model, then chooses keyboard repair inside the repair booking flow." },
    ],
    faqs: [
      { question: "Do I need to know the keyboard part number?", answer: "No. Start with the laptop brand and model; inspection handles the exact scope." },
      { question: "Can billing be generated after quote?", answer: "Yes. The order workflow supports quote and bill generation." },
    ],
  },
  {
    slug: "data-recovery-service",
    keyword: "Data Recovery Service in Bangalore",
    city: "Bangalore",
    problem: "lost files, backup failure, or inaccessible laptop/desktop data",
    eyebrow: "Data Recovery",
    title: "Data Recovery Service in Bangalore",
    description: "Book data recovery service in Bangalore for laptop, desktop, backup, drive access, accidental deletion, and system data transfer support.",
    ctaLabel: "Book data recovery help",
    ctaHref: "/book/it-support",
    secondaryHref: "/service/it-support",
    secondaryLabel: "View IT support",
    highlights: ["File recovery guidance", "Backup and transfer support", "Laptop and desktop help", "Technician inspection workflow"],
    sections: [
      { title: "One recovery problem", body: "This page targets data recovery service in Bangalore for customers trying to recover or transfer important files." },
      { title: "Supported situations", body: "Use it for accidental deletion, inaccessible folders, failed backup, OS reinstall data transfer, and basic drive access issues." },
      { title: "Careful inspection", body: "The technician can inspect the device condition and explain whether recovery, transfer, or backup setup is the right next step." },
    ],
    faqs: [
      { question: "Is data recovery always guaranteed?", answer: "No. Recovery depends on device and drive condition, so inspection comes first." },
      { question: "Can you help set up backups?", answer: "Yes. Backup basics and cloud setup are part of the IT support path." },
    ],
  },
];

export const seoServicePageMap = new Map(seoServicePages.map((page) => [page.slug, page]));
