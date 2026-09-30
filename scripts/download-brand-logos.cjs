const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const targetDir = path.resolve(__dirname, '../apps/user/public/images/brands');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Brand sources
const brandSources = [
  // Mobile brands
  { name: 'apple', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/2e7cdc22-5a5f.jpg?w=200', ext: 'png' },
  { name: 'samsung', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/406a512d-e8dd.jpg?w=200', ext: 'png' },
  { name: 'oneplus', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/dfb6c340-010f.jpg?w=200', ext: 'png' },
  { name: 'xiaomi', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/cb96df6e-080f.jpg?w=200', ext: 'png' },
  { name: 'google', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/dacc50a2-77a9.jpg?w=200', ext: 'png' },
  { name: 'vivo', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/20922c34-8afc.jpg?w=200', ext: 'png' },
  { name: 'oppo', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/ac5c9a7b-76b5.jpg?w=200', ext: 'png' },
  { name: 'realme', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/0124cc45-3a6c.jpg?w=200', ext: 'png' },
  { name: 'huawei', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/huawei.svg', ext: 'svg' },
  { name: 'micromax', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Micromax_logo.svg', ext: 'svg' },
  { name: 'lava', url: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Lava_International.svg', ext: 'svg' },
  { name: 'motorola', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/1dcd7fda-0141.jpg', ext: 'png' },
  { name: 'lenovo', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/4834825a-7f10.jpg', ext: 'png' },
  { name: 'nokia', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/fef4e5ae-6507.jpg', ext: 'png' },
  { name: 'honor', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/cfeaabff-69bf.jpg', ext: 'png' },
  { name: 'asus', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/bf25222a-a2a7.jpg', ext: 'png' },
  { name: 'lg', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/bdbdc48e-dd24.jpg', ext: 'png' },
  { name: 'infinix', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/738cb1f1-7ddf.jpg', ext: 'png' },
  { name: 'tecno', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/55424ad4-0400.jpg', ext: 'png' },
  { name: 'iqoo', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/e1b13cbc-ef06.jpg', ext: 'png' },
  { name: 'nothing', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/06bc74db-4d38.jpg', ext: 'png' },
  { name: 'poco', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/3e072dc2-6d7b.jpg', ext: 'png' },

  // Additional Laptop brands
  { name: 'dell', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/d3b4fdda-2d57.jpg?w=200', ext: 'png' },
  { name: 'hp', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/f78db5fb-857c.jpg?w=200', ext: 'png' },
  { name: 'acer', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/2c350ab6-da4f.jpg?w=200', ext: 'png' },
  { name: 'msi', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/3e0e18bd-7fa2.jpg?w=200', ext: 'png' },
  { name: 'microsoft', url: 'https://s3ng.cashify.in/cashify/brand/img/xhdpi/b00e17d8-fdd0.jpg?w=200', ext: 'png' },
  { name: 'razer', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/razer.svg', ext: 'svg' },
  { name: 'gigabyte', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Gigabyte_Technology_logo_20080107.svg', ext: 'svg' },
  { name: 'framework', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/framework.svg', ext: 'svg' },
  { name: 'dynabook', url: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Dynabook_Logo.svg', ext: 'svg' },
  { name: 'fujitsu', url: 'https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/fujitsu.svg', ext: 'svg' },
  { name: 'avita', url: 'https://www.google.com/s2/favicons?domain=avita.com&sz=128', ext: 'png' },
  { name: 'vaio', url: 'https://www.google.com/s2/favicons?domain=vaio.com&sz=128', ext: 'png' },
  { name: 'chuwi', url: 'https://www.google.com/s2/favicons?domain=chuwi.com&sz=128', ext: 'png' }
];

async function download(item) {
  const filePath = path.join(targetDir, `${item.name}.${item.ext}`);
  try {
    const res = await fetch(item.url, {
      headers: { 'User-Agent': 'LooplicBot/1.0 (info@looplic.com)' }
    });
    if (!res.ok) {
      console.error(`Failed ${item.name}: ${res.status} ${res.statusText}`);
      return;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved ${item.name}.${item.ext} (${buffer.length} bytes)`);
  } catch (err) {
    console.error(`Error ${item.name}:`, err.message);
  }
}

async function main() {
  console.log(`Downloading ${brandSources.length} brand logos to ${targetDir}...`);
  for (const item of brandSources) {
    await download(item);
  }
  console.log('Done downloading brand logos.');
}

main();
