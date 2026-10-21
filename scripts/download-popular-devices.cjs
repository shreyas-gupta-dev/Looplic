const https = require("https");
const fs = require("fs");
const path = require("path");

const dir = path.join(process.cwd(), "apps", "user", "public", "images", "devices");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const devices = [
  { name: "iphone-15-pro-max.png", url: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/5ab3d199-fdb7.jpg" },
  { name: "iphone-14.png", url: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/a69ef28f-fe68.jpg" },
  { name: "samsung-galaxy-s24.png", url: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/dcbaf057-2937.jpg" },
  { name: "oneplus-12.png", url: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/3ba10c91-7df6.jpg" },
  { name: "macbook-air-m2.png", url: "https://s3ng.cashify.in/estore/90d6714360974efd81d8912c8bf00638.png" },
  { name: "iphone-13.png", url: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/f6bf429a-1a54.jpg" },
  { name: "samsung-galaxy-s23.png", url: "https://s3ng.cashify.in/cashify/product/img/xxhdpi/90cb48b8-8691.jpg" },
  { name: "google-pixel-8.png", url: "https://s3ng.cashify.in/cashify/product/img/xhdpi/f4058b12-24de.jpg" }
];

function download(item) {
  const filePath = path.join(dir, item.name);
  return new Promise((resolve, reject) => {
    https.get(item.url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed ${item.url}: ${res.statusCode}`));
        return;
      }
      const stream = fs.createWriteStream(filePath);
      res.pipe(stream);
      stream.on("finish", () => {
        const stats = fs.statSync(filePath);
        console.log(`Saved ${item.name}: ${stats.size} bytes`);
        resolve();
      });
      stream.on("error", reject);
    }).on("error", reject);
  });
}

(async () => {
  for (const d of devices) {
    await download(d);
  }
  console.log("All 8 devices downloaded successfully!");
})();
