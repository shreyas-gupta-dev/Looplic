// Scrapes Cashify.in for mobile and laptop brands/models and seeds them into the Looplic RDS database.
// Usage: node scripts/scrape-cashify-catalog.cjs
//
// - Fetches brand pages from Cashify to get all models listed
// - Extracts model names and image URLs from s3ng.cashify.in CDN
// - Groups models by series (e.g., iPhone 15 series, Galaxy S24 series)
// - Upserts brands, series, and models into RDS (idempotent)

const { Client } = require("pg");
const https = require("https");

const DB = "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic";

// ─── Brand definitions ───────────────────────────────────────────────────────

const MOBILE_BRANDS = [
  { name: "Apple", urlSlug: "apple", letter: "A", gradient: "from-gray-700 to-gray-900", sort_order: 1 },
  { name: "Samsung", urlSlug: "samsung", letter: "S", gradient: "from-blue-500 to-blue-700", sort_order: 2 },
  { name: "Xiaomi", urlSlug: "xiaomi", letter: "Mi", gradient: "from-orange-400 to-orange-600", sort_order: 3 },
  { name: "OnePlus", urlSlug: "oneplus", letter: "1+", gradient: "from-red-500 to-red-700", sort_order: 4 },
  { name: "Vivo", urlSlug: "vivo", letter: "V", gradient: "from-blue-400 to-purple-500", sort_order: 5 },
  { name: "Oppo", urlSlug: "oppo", letter: "O", gradient: "from-green-500 to-teal-500", sort_order: 6 },
  { name: "Realme", urlSlug: "realme", letter: "R", gradient: "from-yellow-400 to-orange-500", sort_order: 7 },
  { name: "Google", urlSlug: "google", letter: "G", gradient: "from-red-400 to-yellow-400", sort_order: 8 },
  { name: "Motorola", urlSlug: "motorola", letter: "M", gradient: "from-blue-600 to-cyan-500", sort_order: 9 },
  { name: "Nokia", urlSlug: "nokia", letter: "N", gradient: "from-blue-700 to-blue-900", sort_order: 10 },
  { name: "Poco", urlSlug: "poco", letter: "P", gradient: "from-yellow-500 to-yellow-700", sort_order: 11 },
  { name: "Honor", urlSlug: "honor", letter: "H", gradient: "from-cyan-400 to-blue-500", sort_order: 12 },
  { name: "iQOO", urlSlug: "iqoo", letter: "iQ", gradient: "from-orange-500 to-red-600", sort_order: 13 },
  { name: "Nothing", urlSlug: "nothing", letter: "N", gradient: "from-gray-800 to-gray-950", sort_order: 14 },
  { name: "Asus", urlSlug: "asus", letter: "A", gradient: "from-indigo-500 to-indigo-700", sort_order: 15 },
  { name: "LG", urlSlug: "lg", letter: "LG", gradient: "from-red-500 to-pink-500", sort_order: 16 },
  { name: "Huawei", urlSlug: "huawei", letter: "H", gradient: "from-red-600 to-rose-700", sort_order: 17 },
  { name: "Infinix", urlSlug: "infinix", letter: "I", gradient: "from-green-400 to-emerald-600", sort_order: 18 },
  { name: "Tecno", urlSlug: "tecno", letter: "T", gradient: "from-sky-400 to-blue-600", sort_order: 19 },
  { name: "Micromax", urlSlug: "micromax", letter: "M", gradient: "from-blue-400 to-violet-500", sort_order: 20 },
  { name: "Lava", urlSlug: "lava", letter: "L", gradient: "from-red-400 to-red-600", sort_order: 21 },
  { name: "Lenovo", urlSlug: "lenovo", letter: "L", gradient: "from-red-500 to-rose-600", sort_order: 22 },
];

const LAPTOP_BRANDS = [
  { name: "Apple", urlSlug: "apple", letter: "A", gradient: "from-gray-700 to-gray-900", sort_order: 1 },
  { name: "HP", urlSlug: "hp-compaq", letter: "HP", gradient: "from-blue-500 to-blue-700", sort_order: 2 },
  { name: "Samsung", urlSlug: "samsung", letter: "S", gradient: "from-blue-600 to-indigo-600", sort_order: 3 },
  { name: "Lenovo", urlSlug: "lenovo", letter: "L", gradient: "from-red-500 to-rose-600", sort_order: 4 },
  { name: "Dell", urlSlug: "dell", letter: "D", gradient: "from-blue-600 to-blue-800", sort_order: 5 },
  { name: "Honor", urlSlug: "honor", letter: "H", gradient: "from-cyan-400 to-blue-500", sort_order: 6 },
  { name: "Asus", urlSlug: "asus", letter: "A", gradient: "from-indigo-500 to-indigo-700", sort_order: 7 },
  { name: "Acer", urlSlug: "acer", letter: "A", gradient: "from-green-500 to-green-700", sort_order: 8 },
  { name: "MSI", urlSlug: "msi", letter: "MSI", gradient: "from-red-600 to-red-800", sort_order: 9 },
];

// ─── HTTP fetch helper ───────────────────────────────────────────────────────

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith("http")
          ? res.headers.location
          : `https://www.cashify.in${res.headers.location}`;
        fetchPage(redirectUrl).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error(`Timeout for ${url}`)); });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/["''()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── HTML parsing ────────────────────────────────────────────────────────────

function extractModelsFromHTML(html, brandName) {
  const models = [];

  // Strategy 1: Look for model cards with images from cashify CDN
  // Pattern: <img ... src="https://s3ng.cashify.in/..." alt="ModelName" ...> with nearby text
  const cardRegex = /<a[^>]*href="[^"]*(?:used-|sell-)[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
  const cards = html.match(cardRegex) || [];

  for (const card of cards) {
    // Extract model name from alt text or text content
    const altMatch = card.match(/alt="([^"]+)"/i);
    const imgMatch = card.match(/src="(https?:\/\/s3ng\.cashify\.in[^"]+)"/i);

    let modelName = null;
    if (altMatch) {
      modelName = altMatch[1].trim();
    }

    // Also try to get model name from visible text in the card
    if (!modelName) {
      const textMatch = card.replace(/<[^>]+>/g, "").trim();
      if (textMatch && textMatch.length > 2 && textMatch.length < 100) {
        modelName = textMatch;
      }
    }

    if (modelName && modelName !== brandName && !modelName.includes("Select") && !modelName.includes("Why Sell")) {
      const imageUrl = imgMatch ? imgMatch[1] : null;
      models.push({ name: modelName, imageUrl });
    }
  }

  // Strategy 2: Look for model list items (li elements or divs with model names)
  // Some pages use a grid of model items
  const modelItemRegex = /<(?:div|li|a)[^>]*class="[^"]*(?:model|product|device|card)[^"]*"[^>]*>[\s\S]*?<\/(?:div|li|a)>/gi;
  const items = html.match(modelItemRegex) || [];

  for (const item of items) {
    const altMatch = item.match(/alt="([^"]+)"/i);
    const imgMatch = item.match(/src="(https?:\/\/s3ng\.cashify\.in[^"]+)"/i);

    if (altMatch) {
      const modelName = altMatch[1].trim();
      const imageUrl = imgMatch ? imgMatch[1] : null;
      if (modelName && modelName !== brandName && !models.find((m) => m.name === modelName)) {
        models.push({ name: modelName, imageUrl });
      }
    }
  }

  // Strategy 3: Extract from Next.js __NEXT_DATA__ JSON (Cashify uses Next.js)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const props = nextData?.props?.pageProps;

      // Try common patterns for model lists in Cashify's Next.js data
      const modelList = props?.modelList || props?.models || props?.data?.models ||
        props?.pageData?.models || props?.brandModels || props?.allModels ||
        props?.productList || props?.products || [];

      if (Array.isArray(modelList)) {
        for (const item of modelList) {
          const name = item.model_name || item.modelName || item.name || item.title || item.product_name;
          let imageUrl = item.image || item.imageUrl || item.image_url || item.img || item.thumbImage || item.thumb_image;

          if (imageUrl && !imageUrl.startsWith("http")) {
            imageUrl = `https://s3ng.cashify.in${imageUrl}`;
          }

          if (name && !models.find((m) => m.name === name)) {
            models.push({ name, imageUrl: imageUrl || null });
          }
        }
      }

      // Also check for series/categories within the data
      const seriesList = props?.seriesList || props?.series || props?.categories || [];
      if (Array.isArray(seriesList)) {
        for (const series of seriesList) {
          const seriesModels = series.models || series.products || series.items || [];
          for (const item of seriesModels) {
            const name = item.model_name || item.modelName || item.name || item.title;
            let imageUrl = item.image || item.imageUrl || item.image_url || item.img;
            if (imageUrl && !imageUrl.startsWith("http")) {
              imageUrl = `https://s3ng.cashify.in${imageUrl}`;
            }
            if (name && !models.find((m) => m.name === name)) {
              models.push({ name, imageUrl: imageUrl || null });
            }
          }
        }
      }
    } catch (e) {
      // JSON parse failed, continue with other strategies
    }
  }

  // Strategy 4: Fallback - find all img alt texts from cashify CDN
  const imgRegex = /<img[^>]*src="(https?:\/\/s3ng\.cashify\.in[^"]+)"[^>]*alt="([^"]+)"[^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const imageUrl = imgMatch[1];
    const altText = imgMatch[2].trim();
    if (altText && altText.length > 2 && altText.length < 80 &&
      !altText.includes("logo") && !altText.toLowerCase().includes("banner") &&
      !models.find((m) => m.name === altText)) {
      models.push({ name: altText, imageUrl });
    }
  }

  // Also try reversed order: alt then src
  const imgRegex2 = /<img[^>]*alt="([^"]+)"[^>]*src="(https?:\/\/s3ng\.cashify\.in[^"]+)"[^>]*>/gi;
  let imgMatch2;
  while ((imgMatch2 = imgRegex2.exec(html)) !== null) {
    const altText = imgMatch2[1].trim();
    const imageUrl = imgMatch2[2];
    if (altText && altText.length > 2 && altText.length < 80 &&
      !altText.includes("logo") && !altText.toLowerCase().includes("banner") &&
      !models.find((m) => m.name === altText)) {
      models.push({ name: altText, imageUrl });
    }
  }

  return models;
}

function extractSeriesFromHTML(html) {
  // For laptops, Cashify shows series headings
  const series = [];
  const seriesRegex = /<li[^>]*>\s*([^<]+Series)\s*<\/li>/gi;
  let match;
  while ((match = seriesRegex.exec(html)) !== null) {
    series.push(match[1].trim());
  }
  return series;
}

// ─── Series grouping logic ───────────────────────────────────────────────────

function groupMobileModelsByBrand(brandName, models) {
  const groups = {};

  for (const model of models) {
    const seriesName = detectMobileSeries(brandName, model.name);
    if (!groups[seriesName]) {
      groups[seriesName] = [];
    }
    groups[seriesName].push(model);
  }

  return groups;
}

function detectMobileSeries(brandName, modelName) {
  const name = modelName.toLowerCase();

  // Apple
  if (brandName === "Apple") {
    if (name.includes("iphone 17")) return "iPhone 17 Series";
    if (name.includes("iphone 16")) return "iPhone 16 Series";
    if (name.includes("iphone 15")) return "iPhone 15 Series";
    if (name.includes("iphone 14")) return "iPhone 14 Series";
    if (name.includes("iphone 13")) return "iPhone 13 Series";
    if (name.includes("iphone 12")) return "iPhone 12 Series";
    if (name.includes("iphone 11")) return "iPhone 11 Series";
    if (name.includes("iphone x") || name.includes("iphone xs")) return "iPhone X / XS Series";
    if (name.includes("iphone se")) return "iPhone SE Series";
    if (name.includes("iphone 8")) return "iPhone 8 Series";
    if (name.includes("iphone 7")) return "iPhone 7 Series";
    if (name.includes("iphone 6")) return "iPhone 6 Series";
    if (name.includes("iphone air")) return "iPhone Air Series";
    return "Other iPhone";
  }

  // Samsung
  if (brandName === "Samsung") {
    if (name.includes("galaxy s25")) return "Galaxy S25 Series";
    if (name.includes("galaxy s24")) return "Galaxy S24 Series";
    if (name.includes("galaxy s23")) return "Galaxy S23 Series";
    if (name.includes("galaxy s22")) return "Galaxy S22 Series";
    if (name.includes("galaxy s21")) return "Galaxy S21 Series";
    if (name.includes("galaxy s20")) return "Galaxy S20 Series";
    if (name.includes("galaxy s10")) return "Galaxy S10 Series";
    if (name.includes("galaxy note")) return "Galaxy Note Series";
    if (name.includes("galaxy z fold")) return "Galaxy Z Fold Series";
    if (name.includes("galaxy z flip")) return "Galaxy Z Flip Series";
    if (name.includes("galaxy a")) return "Galaxy A Series";
    if (name.includes("galaxy m")) return "Galaxy M Series";
    if (name.includes("galaxy f")) return "Galaxy F Series";
    if (name.includes("galaxy j")) return "Galaxy J Series";
    if (name.includes("galaxy on")) return "Galaxy On Series";
    return "Other Galaxy";
  }

  // OnePlus
  if (brandName === "OnePlus") {
    if (name.includes("nord")) return "OnePlus Nord Series";
    const numMatch = name.match(/oneplus\s*(\d+)/i);
    if (numMatch) return `OnePlus ${numMatch[1]} Series`;
    return "Other OnePlus";
  }

  // Xiaomi
  if (brandName === "Xiaomi") {
    if (name.includes("redmi note 1") && name.includes("redmi note 13")) return "Redmi Note 13 Series";
    if (name.includes("redmi note 12")) return "Redmi Note 12 Series";
    if (name.includes("redmi note 11")) return "Redmi Note 11 Series";
    if (name.includes("redmi note 10")) return "Redmi Note 10 Series";
    if (name.includes("redmi note 9")) return "Redmi Note 9 Series";
    if (name.includes("redmi note 8")) return "Redmi Note 8 Series";
    if (name.includes("redmi note 7")) return "Redmi Note 7 Series";
    if (name.includes("redmi note")) return "Redmi Note Series";
    if (name.includes("redmi 1") && !name.includes("redmi note")) return "Redmi Series";
    if (name.includes("redmi")) return "Redmi Series";
    if (name.includes("mi 1") || name.includes("mi 11") || name.includes("mi 10")) return "Mi Series";
    if (name.includes("xiaomi 14") || name.includes("xiaomi 13") || name.includes("xiaomi 12")) return "Xiaomi Number Series";
    if (name.includes("poco")) return "POCO Series";
    return "Other Xiaomi";
  }

  // Poco
  if (brandName === "Poco") {
    if (name.includes("poco x")) return "POCO X Series";
    if (name.includes("poco m")) return "POCO M Series";
    if (name.includes("poco f")) return "POCO F Series";
    if (name.includes("poco c")) return "POCO C Series";
    return "Other POCO";
  }

  // Vivo
  if (brandName === "Vivo") {
    if (name.includes("v4") || name.includes("v30") || name.includes("v29") || name.includes("v27") || name.includes("v25") || name.includes("v23") || name.includes("v21") || name.includes("v20")) return "Vivo V Series";
    if (name.includes("x")) return "Vivo X Series";
    if (name.includes("y")) return "Vivo Y Series";
    if (name.includes("t")) return "Vivo T Series";
    if (name.includes("s")) return "Vivo S Series";
    return "Other Vivo";
  }

  // Oppo
  if (brandName === "Oppo") {
    if (name.includes("reno")) return "Oppo Reno Series";
    if (name.includes("find")) return "Oppo Find Series";
    if (name.includes("a")) return "Oppo A Series";
    if (name.includes("f")) return "Oppo F Series";
    if (name.includes("k")) return "Oppo K Series";
    return "Other Oppo";
  }

  // Realme
  if (brandName === "Realme") {
    if (name.includes("narzo")) return "Realme Narzo Series";
    if (name.includes("gt")) return "Realme GT Series";
    if (name.includes("c")) return "Realme C Series";
    const numMatch = name.match(/realme\s*(\d+)/i);
    if (numMatch) return `Realme ${numMatch[1]} Series`;
    return "Other Realme";
  }

  // Google
  if (brandName === "Google") {
    const pixelMatch = name.match(/pixel\s*(\d+)/i);
    if (pixelMatch) return `Pixel ${pixelMatch[1]} Series`;
    return "Other Pixel";
  }

  // Motorola
  if (brandName === "Motorola") {
    if (name.includes("edge")) return "Moto Edge Series";
    if (name.includes("razr")) return "Moto Razr Series";
    if (name.includes("g")) return "Moto G Series";
    if (name.includes("e")) return "Moto E Series";
    return "Other Motorola";
  }

  // Nokia
  if (brandName === "Nokia") {
    return "Nokia Phones";
  }

  // Honor
  if (brandName === "Honor") {
    if (name.includes("magic")) return "Honor Magic Series";
    if (name.includes("x")) return "Honor X Series";
    return "Other Honor";
  }

  // iQOO
  if (brandName === "iQOO") {
    if (name.includes("neo")) return "iQOO Neo Series";
    if (name.includes("z")) return "iQOO Z Series";
    const numMatch = name.match(/iqoo\s*(\d+)/i);
    if (numMatch) return `iQOO ${numMatch[1]} Series`;
    return "Other iQOO";
  }

  // Nothing
  if (brandName === "Nothing") {
    if (name.includes("phone")) return "Nothing Phone Series";
    return "Other Nothing";
  }

  // Asus
  if (brandName === "Asus") {
    if (name.includes("rog")) return "Asus ROG Phone Series";
    if (name.includes("zenfone")) return "Asus Zenfone Series";
    return "Other Asus";
  }

  // Generic fallback
  return `Other ${brandName}`;
}

function groupLaptopModels(brandName, models) {
  const groups = {};

  for (const model of models) {
    const seriesName = detectLaptopSeries(brandName, model.name);
    if (!groups[seriesName]) {
      groups[seriesName] = [];
    }
    groups[seriesName].push(model);
  }

  return groups;
}

function detectLaptopSeries(brandName, modelName) {
  const name = modelName.toLowerCase();

  if (brandName === "Apple") {
    if (name.includes("macbook pro")) return "MacBook Pro Series";
    if (name.includes("macbook air")) return "MacBook Air Series";
    if (name.includes("macbook neo")) return "MacBook Neo Series";
    if (name.includes("macbook")) return "MacBook Series";
    return "Other Apple Laptop";
  }

  if (brandName === "HP") {
    if (name.includes("pavilion")) return "HP Pavilion Series";
    if (name.includes("envy")) return "HP Envy Series";
    if (name.includes("spectre")) return "HP Spectre Series";
    if (name.includes("elitebook")) return "HP EliteBook Series";
    if (name.includes("probook")) return "HP ProBook Series";
    if (name.includes("omen")) return "HP Omen Series";
    if (name.includes("victus")) return "HP Victus Series";
    if (name.includes("zbook")) return "HP ZBook Series";
    if (name.includes("chromebook")) return "HP Chromebook Series";
    return "Other HP Laptop";
  }

  if (brandName === "Dell") {
    if (name.includes("inspiron")) return "Dell Inspiron Series";
    if (name.includes("vostro")) return "Dell Vostro Series";
    if (name.includes("xps")) return "Dell XPS Series";
    if (name.includes("latitude")) return "Dell Latitude Series";
    if (name.includes("g15") || name.includes("g14") || name.includes("gaming")) return "Dell Gaming Series";
    if (name.includes("alienware")) return "Dell Alienware Series";
    if (name.includes("precision")) return "Dell Precision Series";
    return "Other Dell Laptop";
  }

  if (brandName === "Lenovo") {
    if (name.includes("thinkpad")) return "Lenovo ThinkPad Series";
    if (name.includes("ideapad")) return "Lenovo IdeaPad Series";
    if (name.includes("yoga")) return "Lenovo Yoga Series";
    if (name.includes("legion")) return "Lenovo Legion Series";
    if (name.includes("thinkbook")) return "Lenovo ThinkBook Series";
    if (name.includes("chromebook")) return "Lenovo Chromebook Series";
    return "Other Lenovo Laptop";
  }

  if (brandName === "Asus") {
    if (name.includes("vivobook")) return "Asus VivoBook Series";
    if (name.includes("zenbook")) return "Asus ZenBook Series";
    if (name.includes("rog")) return "Asus ROG Series";
    if (name.includes("tuf")) return "Asus TUF Series";
    if (name.includes("chromebook")) return "Asus Chromebook Series";
    return "Other Asus Laptop";
  }

  if (brandName === "Acer") {
    if (name.includes("aspire")) return "Acer Aspire Series";
    if (name.includes("nitro")) return "Acer Nitro Series";
    if (name.includes("swift")) return "Acer Swift Series";
    if (name.includes("predator")) return "Acer Predator Series";
    if (name.includes("spin")) return "Acer Spin Series";
    if (name.includes("chromebook")) return "Acer Chromebook Series";
    return "Other Acer Laptop";
  }

  if (brandName === "Samsung") {
    if (name.includes("galaxy book")) return "Samsung Galaxy Book Series";
    if (name.includes("notebook")) return "Samsung Notebook Series";
    return "Other Samsung Laptop";
  }

  if (brandName === "MSI") {
    if (name.includes("stealth")) return "MSI Stealth Series";
    if (name.includes("raider")) return "MSI Raider Series";
    if (name.includes("creator")) return "MSI Creator Series";
    if (name.includes("modern")) return "MSI Modern Series";
    if (name.includes("prestige")) return "MSI Prestige Series";
    if (name.includes("katana")) return "MSI Katana Series";
    if (name.includes("crosshair")) return "MSI Crosshair Series";
    if (name.includes("bravo")) return "MSI Bravo Series";
    return "Other MSI Laptop";
  }

  if (brandName === "Honor") {
    if (name.includes("magicbook")) return "Honor MagicBook Series";
    return "Other Honor Laptop";
  }

  return `Other ${brandName} Laptop`;
}

// ─── Main scraping and seeding logic ─────────────────────────────────────────

async function scrapeBrandPage(baseUrl, brandSlug) {
  const url = `${baseUrl}/sell-${brandSlug}`;
  console.log(`  Fetching: ${url}`);

  try {
    const html = await fetchPage(url);
    return html;
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

async function processMobileBrands(client) {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  SCRAPING MOBILE BRANDS FROM CASHIFY");
  console.log("══════════════════════════════════════════════════════════════\n");

  let totalBrands = 0, totalSeries = 0, totalModels = 0;

  for (const brand of MOBILE_BRANDS) {
    console.log(`\n▸ Processing mobile brand: ${brand.name}`);

    const html = await scrapeBrandPage("https://www.cashify.in/sell-old-mobile-phone", brand.urlSlug);
    await sleep(1500); // Rate limiting

    let models = [];
    if (html) {
      models = extractModelsFromHTML(html, brand.name);
      // Filter out noise - only keep models that seem relevant to this brand
      models = filterModelsForBrand(brand.name, models);
    }

    if (models.length === 0) {
      console.log(`  ⚠ No models found for ${brand.name}, skipping`);
      continue;
    }

    console.log(`  Found ${models.length} models for ${brand.name}`);

    // Upsert brand
    const brandSlug = slugify(brand.name);
    const brandId = await upsertBrand(client, {
      name: brand.name,
      slug: brandSlug,
      letter: brand.letter,
      gradient: brand.gradient,
      sort_order: brand.sort_order,
      service_type: "mobile",
      image_url: models[0]?.imageUrl || null,
    });
    totalBrands++;

    // Group into series
    const seriesGroups = groupMobileModelsByBrand(brand.name, models);

    for (const [seriesName, seriesModels] of Object.entries(seriesGroups)) {
      const seriesSlug = slugify(seriesName);
      const seriesImageUrl = seriesModels[0]?.imageUrl || null;

      const seriesId = await upsertSeries(client, {
        brand_id: brandId,
        name: seriesName,
        slug: seriesSlug,
        image_url: seriesImageUrl,
      });
      totalSeries++;

      for (const model of seriesModels) {
        await upsertModel(client, {
          series_id: seriesId,
          name: model.name,
          slug: slugify(model.name),
          image_url: model.imageUrl,
        });
        totalModels++;
      }
    }
  }

  console.log(`\n✓ Mobile: ${totalBrands} brands, ${totalSeries} series, ${totalModels} models processed`);
  return { totalBrands, totalSeries, totalModels };
}

async function processLaptopBrands(client) {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  SCRAPING LAPTOP BRANDS FROM CASHIFY");
  console.log("══════════════════════════════════════════════════════════════\n");

  let totalBrands = 0, totalSeries = 0, totalModels = 0;

  for (const brand of LAPTOP_BRANDS) {
    console.log(`\n▸ Processing laptop brand: ${brand.name}`);

    const html = await scrapeBrandPage("https://www.cashify.in/sell-old-laptop", brand.urlSlug);
    await sleep(1500); // Rate limiting

    let models = [];
    if (html) {
      models = extractModelsFromHTML(html, brand.name);
      models = filterModelsForBrand(brand.name, models, "laptop");
    }

    if (models.length === 0) {
      console.log(`  ⚠ No models found for ${brand.name} laptops, skipping`);
      continue;
    }

    console.log(`  Found ${models.length} models for ${brand.name}`);

    // Upsert brand
    const brandSlug = slugify(brand.name) + "-laptop";
    const brandId = await upsertBrand(client, {
      name: brand.name,
      slug: brandSlug,
      letter: brand.letter,
      gradient: brand.gradient,
      sort_order: brand.sort_order,
      service_type: "laptop",
      image_url: models[0]?.imageUrl || null,
    });
    totalBrands++;

    // Group into series
    const seriesGroups = groupLaptopModels(brand.name, models);

    for (const [seriesName, seriesModels] of Object.entries(seriesGroups)) {
      const seriesSlug = slugify(seriesName);
      const seriesImageUrl = seriesModels[0]?.imageUrl || null;

      const seriesId = await upsertSeries(client, {
        brand_id: brandId,
        name: seriesName,
        slug: seriesSlug,
        image_url: seriesImageUrl,
      });
      totalSeries++;

      for (const model of seriesModels) {
        await upsertModel(client, {
          series_id: seriesId,
          name: model.name,
          slug: slugify(model.name),
          image_url: model.imageUrl,
        });
        totalModels++;
      }
    }
  }

  console.log(`\n✓ Laptop: ${totalBrands} brands, ${totalSeries} series, ${totalModels} models processed`);
  return { totalBrands, totalSeries, totalModels };
}

// ─── Filter to reduce noise ──────────────────────────────────────────────────

function filterModelsForBrand(brandName, models, type = "mobile") {
  const brandLower = brandName.toLowerCase();
  const excluded = [
    "safe & secure", "instant payment", "best price", "why sell",
    "select model", "select series", "top selling", "top models",
    "google reviews", "download the app", "chat with us",
    "android", "ios", "twitter", "facebook", "instagram", "youtube",
    "landing-download-banner", "google logo", "customBannerFooter",
  ];

  return models.filter((m) => {
    const nameLower = m.name.toLowerCase();
    // Filter out noise
    if (excluded.some((e) => nameLower.includes(e))) return false;
    // Filter too short names
    if (m.name.length < 3) return false;
    // Filter brand names listed on the page (other brands section)
    if (MOBILE_BRANDS.some((b) => b.name === m.name) || LAPTOP_BRANDS.some((b) => b.name === m.name)) return false;
    // For mobile, should contain brand name or common phone model patterns
    if (type === "mobile") {
      // Allow if contains brand reference or common phone words
      const isRelevant = nameLower.includes(brandLower) ||
        nameLower.includes("iphone") || nameLower.includes("galaxy") ||
        nameLower.includes("pixel") || nameLower.includes("redmi") ||
        nameLower.includes("poco") || nameLower.includes("oneplus") ||
        nameLower.includes("moto") || nameLower.includes("nokia") ||
        nameLower.includes("realme") || nameLower.includes("narzo") ||
        nameLower.includes("reno") || nameLower.includes("iqoo") ||
        nameLower.includes("nothing") || nameLower.includes("rog") ||
        nameLower.includes("zenfone") || nameLower.includes("honor") ||
        nameLower.includes("infinix") || nameLower.includes("tecno") ||
        nameLower.includes("lava") || nameLower.includes("micromax") ||
        nameLower.includes("lg ");
      return isRelevant;
    }
    // For laptops
    if (type === "laptop") {
      const isRelevant = nameLower.includes("macbook") || nameLower.includes("thinkpad") ||
        nameLower.includes("ideapad") || nameLower.includes("yoga") ||
        nameLower.includes("inspiron") || nameLower.includes("vostro") ||
        nameLower.includes("xps") || nameLower.includes("latitude") ||
        nameLower.includes("pavilion") || nameLower.includes("envy") ||
        nameLower.includes("spectre") || nameLower.includes("elitebook") ||
        nameLower.includes("probook") || nameLower.includes("omen") ||
        nameLower.includes("victus") || nameLower.includes("vivobook") ||
        nameLower.includes("zenbook") || nameLower.includes("rog") ||
        nameLower.includes("tuf") || nameLower.includes("aspire") ||
        nameLower.includes("nitro") || nameLower.includes("swift") ||
        nameLower.includes("predator") || nameLower.includes("galaxy book") ||
        nameLower.includes("notebook") || nameLower.includes("stealth") ||
        nameLower.includes("raider") || nameLower.includes("katana") ||
        nameLower.includes("modern") || nameLower.includes("prestige") ||
        nameLower.includes("legion") || nameLower.includes("thinkbook") ||
        nameLower.includes("chromebook") || nameLower.includes("magicbook") ||
        nameLower.includes("series") || nameLower.includes("laptop") ||
        nameLower.includes(brandLower) || nameLower.includes("neo") ||
        nameLower.includes("bravo") || nameLower.includes("crosshair") ||
        nameLower.includes("creator") || nameLower.includes("zbook") ||
        nameLower.includes("alienware") || nameLower.includes("precision") ||
        nameLower.includes("spin") || nameLower.includes("g15") || nameLower.includes("g14");
      return isRelevant;
    }
    return true;
  });
}

// ─── Database upsert functions ───────────────────────────────────────────────

async function upsertBrand(client, brand) {
  const existing = await client.query(
    "SELECT id FROM brands WHERE slug = $1 AND service_type = $2",
    [brand.slug, brand.service_type]
  );

  if (existing.rows.length > 0) {
    // Update image_url if we have one now
    if (brand.image_url) {
      await client.query(
        "UPDATE brands SET image_url = COALESCE(image_url, $1) WHERE id = $2",
        [brand.image_url, existing.rows[0].id]
      );
    }
    return existing.rows[0].id;
  }

  const res = await client.query(
    `INSERT INTO brands (name, slug, letter, gradient, sort_order, service_type, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [brand.name, brand.slug, brand.letter, brand.gradient, brand.sort_order, brand.service_type, brand.image_url]
  );
  return res.rows[0].id;
}

async function upsertSeries(client, series) {
  const existing = await client.query(
    "SELECT id FROM series WHERE brand_id = $1 AND slug = $2",
    [series.brand_id, series.slug]
  );

  if (existing.rows.length > 0) {
    if (series.image_url) {
      await client.query(
        "UPDATE series SET image_url = COALESCE(image_url, $1) WHERE id = $2",
        [series.image_url, existing.rows[0].id]
      );
    }
    return existing.rows[0].id;
  }

  const res = await client.query(
    "INSERT INTO series (brand_id, name, slug, image_url) VALUES ($1, $2, $3, $4) RETURNING id",
    [series.brand_id, series.name, series.slug, series.image_url]
  );
  return res.rows[0].id;
}

async function upsertModel(client, model) {
  const existing = await client.query(
    "SELECT id FROM models WHERE series_id = $1 AND slug = $2",
    [model.series_id, model.slug]
  );

  if (existing.rows.length > 0) {
    if (model.image_url) {
      await client.query(
        "UPDATE models SET image_url = COALESCE(image_url, $1) WHERE id = $2",
        [model.image_url, existing.rows[0].id]
      );
    }
    return existing.rows[0].id;
  }

  const res = await client.query(
    "INSERT INTO models (series_id, name, slug, image_url) VALUES ($1, $2, $3, $4) RETURNING id",
    [model.series_id, model.name, model.slug, model.image_url]
  );
  return res.rows[0].id;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Cashify Catalog Scraper → Looplic RDS Seeder");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Started at: ${new Date().toISOString()}`);

  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("  ✓ Connected to RDS database\n");

  try {
    const mobileStats = await processMobileBrands(client);
    const laptopStats = await processLaptopBrands(client);

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  SUMMARY");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`  Mobile: ${mobileStats.totalBrands} brands, ${mobileStats.totalSeries} series, ${mobileStats.totalModels} models`);
    console.log(`  Laptop: ${laptopStats.totalBrands} brands, ${laptopStats.totalSeries} series, ${laptopStats.totalModels} models`);
    console.log(`  Total:  ${mobileStats.totalBrands + laptopStats.totalBrands} brands, ${mobileStats.totalSeries + laptopStats.totalSeries} series, ${mobileStats.totalModels + laptopStats.totalModels} models`);
    console.log("═══════════════════════════════════════════════════════════════\n");
  } finally {
    await client.end();
    console.log("  ✓ Database connection closed");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
