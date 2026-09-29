import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic',
  ssl: { rejectUnauthorized: false }
});

// Master base models to generate full 100+ catalog
const phoneBases = [
  // ─── APPLE ───
  { brand: 'Apple', model: 'iPhone 16 Pro Max', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB', '512GB', '1TB'], colors: ['Desert Titanium', 'Natural Titanium', 'Black Titanium'], basePrice: 119999, mrp: 144900, ram: '8GB' },
  { brand: 'Apple', model: 'iPhone 16 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB', '512GB'], colors: ['Natural Titanium', 'White Titanium'], basePrice: 99999, mrp: 119900, ram: '8GB' },
  { brand: 'Apple', model: 'iPhone 16 Plus', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Ultramarine', 'Teal', 'Pink'], basePrice: 72999, mrp: 89900, ram: '8GB' },
  { brand: 'Apple', model: 'iPhone 16', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Black', 'White', 'Ultramarine'], basePrice: 64999, mrp: 79900, ram: '8GB' },
  { brand: 'Apple', model: 'iPhone 15 Pro Max', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['256GB', '512GB'], colors: ['Blue Titanium', 'Natural Titanium'], basePrice: 89999, mrp: 159900, ram: '8GB' },
  { brand: 'Apple', model: 'iPhone 15 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Black Titanium', 'White Titanium'], basePrice: 76999, mrp: 134900, ram: '8GB' },
  { brand: 'Apple', model: 'iPhone 15 Plus', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Blue', 'Pink', 'Green'], basePrice: 54999, mrp: 89900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 15', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Black', 'Blue', 'Green'], basePrice: 48999, mrp: 79900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 14 Pro Max', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/3f3c7d71-3cf7.jpg', storages: ['128GB', '256GB'], colors: ['Deep Purple', 'Space Black', 'Gold'], basePrice: 69999, mrp: 139900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 14 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/3f3c7d71-3cf7.jpg', storages: ['128GB', '256GB'], colors: ['Space Black', 'Silver'], basePrice: 61999, mrp: 129900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 14 Plus', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Midnight', 'Starlight', 'Purple'], basePrice: 44999, mrp: 79900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 14', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Midnight', 'Blue', 'Starlight'], basePrice: 38999, mrp: 69900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 13 Pro Max', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/3f3c7d71-3cf7.jpg', storages: ['128GB', '256GB'], colors: ['Sierra Blue', 'Graphite', 'Alpine Green'], basePrice: 54999, mrp: 129900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 13 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/3f3c7d71-3cf7.jpg', storages: ['128GB', '256GB'], colors: ['Graphite', 'Silver'], basePrice: 48999, mrp: 119900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 13', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Midnight', 'Starlight', 'Pink', 'Blue'], basePrice: 32999, mrp: 59900, ram: '4GB' },
  { brand: 'Apple', model: 'iPhone 13 mini', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB'], colors: ['Midnight', 'Starlight'], basePrice: 28999, mrp: 64900, ram: '4GB' },
  { brand: 'Apple', model: 'iPhone 12 Pro Max', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/3f3c7d71-3cf7.jpg', storages: ['128GB', '256GB'], colors: ['Pacific Blue', 'Graphite'], basePrice: 41999, mrp: 119900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 12 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/3f3c7d71-3cf7.jpg', storages: ['128GB'], colors: ['Pacific Blue', 'Graphite'], basePrice: 35999, mrp: 109900, ram: '6GB' },
  { brand: 'Apple', model: 'iPhone 12', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['64GB', '128GB'], colors: ['Black', 'Blue', 'White', 'Purple'], basePrice: 23999, mrp: 49900, ram: '4GB' },
  { brand: 'Apple', model: 'iPhone 12 mini', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['64GB', '128GB'], colors: ['Black', 'White', 'Blue'], basePrice: 19999, mrp: 49900, ram: '4GB' },
  { brand: 'Apple', model: 'iPhone 11 Pro Max', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/3f3c7d71-3cf7.jpg', storages: ['64GB', '256GB'], colors: ['Midnight Green', 'Space Grey'], basePrice: 27999, mrp: 109900, ram: '4GB' },
  { brand: 'Apple', model: 'iPhone 11', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['64GB', '128GB'], colors: ['Black', 'White', 'Purple', 'Red'], basePrice: 16999, mrp: 38900, ram: '4GB' },
  { brand: 'Apple', model: 'iPhone XR', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['64GB', '128GB'], colors: ['Black', 'White', 'Coral'], basePrice: 13999, mrp: 47900, ram: '3GB' },
  { brand: 'Apple', model: 'iPhone SE 2022 (3rd Gen)', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['64GB', '128GB'], colors: ['Midnight', 'Starlight', 'Red'], basePrice: 17999, mrp: 43900, ram: '4GB' },
  { brand: 'Apple', model: 'iPhone SE 2020 (2nd Gen)', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['64GB', '128GB'], colors: ['Black', 'White', 'Red'], basePrice: 11999, mrp: 39900, ram: '3GB' },

  // ─── SAMSUNG ───
  { brand: 'Samsung', model: 'Galaxy S25 Ultra 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB', '512GB'], colors: ['Titanium Silver', 'Titanium Black'], basePrice: 94999, mrp: 139999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB', '512GB'], colors: ['Titanium Gray', 'Titanium Violet'], basePrice: 79999, mrp: 129999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy S24 Plus 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Cobalt Violet', 'Onyx Black'], basePrice: 59999, mrp: 99999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy S24 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Onyx Black', 'Marble Gray', 'Amber Yellow'], basePrice: 49999, mrp: 74999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S23 Ultra 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB', '512GB'], colors: ['Phantom Black', 'Green', 'Cream'], basePrice: 58999, mrp: 124999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy S23 Plus 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Phantom Black', 'Cream'], basePrice: 44999, mrp: 94999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S23 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Phantom Black', 'Green', 'Lavender'], basePrice: 36999, mrp: 74999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S23 FE 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Mint', 'Graphite', 'Purple'], basePrice: 28999, mrp: 59999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S22 Ultra 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB', '512GB'], colors: ['Burgundy', 'Phantom Black'], basePrice: 41999, mrp: 109999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy S22 Plus 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Phantom Black', 'Green'], basePrice: 31999, mrp: 84999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S22 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Phantom Black', 'White', 'Pink Gold'], basePrice: 25999, mrp: 72999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S21 Ultra 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Phantom Black', 'Phantom Silver'], basePrice: 31999, mrp: 105999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy S21 Plus 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Phantom Black', 'Phantom Violet'], basePrice: 23999, mrp: 81999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S21 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Phantom Gray', 'Phantom Violet'], basePrice: 19999, mrp: 69999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S21 FE 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Olive', 'Graphite', 'Lavender'], basePrice: 21999, mrp: 49999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy S20 FE 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Cloud Navy', 'Cloud Mint'], basePrice: 14999, mrp: 39999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy Z Fold 6 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB', '512GB'], colors: ['Silver Shadow', 'Navy'], basePrice: 99999, mrp: 164999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy Z Fold 5 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Icy Blue', 'Phantom Black'], basePrice: 74999, mrp: 154999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy Z Fold 4 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Graygreen', 'Phantom Black'], basePrice: 56999, mrp: 154999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy Z Flip 6 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Blue', 'Mint', 'Silver Shadow'], basePrice: 59999, mrp: 109999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy Z Flip 5 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Mint', 'Graphite', 'Cream'], basePrice: 42999, mrp: 99999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy Z Flip 4 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Bora Purple', 'Graphite'], basePrice: 29999, mrp: 89999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy Note 20 Ultra 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Mystic Bronze', 'Mystic Black'], basePrice: 32999, mrp: 104999, ram: '12GB' },
  { brand: 'Samsung', model: 'Galaxy A55 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Awesome Iceblue', 'Awesome Navy'], basePrice: 26999, mrp: 39999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy A54 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Awesome Lime', 'Awesome Graphite'], basePrice: 21999, mrp: 38999, ram: '8GB' },
  { brand: 'Samsung', model: 'Galaxy A35 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Awesome Lilac', 'Awesome Navy'], basePrice: 19999, mrp: 30999, ram: '8GB' },

  // ─── ONEPLUS ───
  { brand: 'OnePlus', model: 'OnePlus Open (Foldable)', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['512GB'], colors: ['Voyager Black', 'Emerald Dusk'], basePrice: 89999, mrp: 139999, ram: '16GB' },
  { brand: 'OnePlus', model: 'OnePlus 12 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['256GB', '512GB'], colors: ['Silky Black', 'Flowy Emerald'], basePrice: 46999, mrp: 64999, ram: '12GB' },
  { brand: 'OnePlus', model: 'OnePlus 12R 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Cool Blue', 'Iron Gray'], basePrice: 29999, mrp: 39999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 11 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Titan Black', 'Eternal Green'], basePrice: 34999, mrp: 56999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 11R 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Galactic Silver', 'Sonic Black'], basePrice: 24999, mrp: 39999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 10 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Volcanic Black', 'Emerald Forest'], basePrice: 29999, mrp: 66999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 10T 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Moonstone Black', 'Jade Green'], basePrice: 23999, mrp: 49999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 10R 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Sierra Black', 'Forest Green'], basePrice: 18999, mrp: 38999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 9 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Morning Mist', 'Stellar Black'], basePrice: 22999, mrp: 64999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 9RT 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Hacker Black', 'Nano Silver'], basePrice: 19999, mrp: 42999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 9 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Astral Black', 'Arctic Sky'], basePrice: 17999, mrp: 49999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 9R 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Carbon Black', 'Lake Blue'], basePrice: 15999, mrp: 39999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 8 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Onyx Black', 'Glacial Green'], basePrice: 18999, mrp: 54999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus 8T 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Aquamarine Green', 'Lunar Silver'], basePrice: 15999, mrp: 42999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus Nord 4 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Mercurial Silver', 'Oasis Green'], basePrice: 24999, mrp: 32999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus Nord 3 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Tempest Gray', 'Misty Green'], basePrice: 18999, mrp: 33999, ram: '8GB' },
  { brand: 'OnePlus', model: 'OnePlus Nord CE 4 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB'], colors: ['Celadon Marble', 'Dark Chrome'], basePrice: 17999, mrp: 24999, ram: '8GB' },

  // ─── GOOGLE PIXEL ───
  { brand: 'Google', model: 'Pixel 9 Pro XL', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Hazel', 'Obsidian', 'Porcelain'], basePrice: 84999, mrp: 124999, ram: '16GB' },
  { brand: 'Google', model: 'Pixel 9 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Rose Quartz', 'Obsidian'], basePrice: 74999, mrp: 109999, ram: '16GB' },
  { brand: 'Google', model: 'Pixel 9', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Peony', 'Wintergreen', 'Obsidian'], basePrice: 54999, mrp: 79999, ram: '12GB' },
  { brand: 'Google', model: 'Pixel 8 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Bay Blue', 'Obsidian'], basePrice: 54999, mrp: 106999, ram: '12GB' },
  { brand: 'Google', model: 'Pixel 8', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Rose', 'Hazel', 'Obsidian'], basePrice: 38999, mrp: 75999, ram: '8GB' },
  { brand: 'Google', model: 'Pixel 8a', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Aloe', 'Bay', 'Obsidian'], basePrice: 31999, mrp: 52999, ram: '8GB' },
  { brand: 'Google', model: 'Pixel 7 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Hazel', 'Snow', 'Obsidian'], basePrice: 34999, mrp: 84999, ram: '12GB' },
  { brand: 'Google', model: 'Pixel 7', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Lemongrass', 'Snow', 'Obsidian'], basePrice: 26999, mrp: 59999, ram: '8GB' },
  { brand: 'Google', model: 'Pixel 7a', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Sea', 'Charcoal', 'Snow'], basePrice: 24999, mrp: 43999, ram: '8GB' },
  { brand: 'Google', model: 'Pixel 6 Pro', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Stormy Black', 'Cloudy White'], basePrice: 23999, mrp: 69999, ram: '12GB' },
  { brand: 'Google', model: 'Pixel 6a', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB'], colors: ['Chalk', 'Charcoal', 'Sage'], basePrice: 16999, mrp: 43999, ram: '6GB' },

  // ─── XIAOMI / POCO ───
  { brand: 'Xiaomi', model: 'Xiaomi 14 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['512GB'], colors: ['Jade Green', 'White', 'Black'], basePrice: 48999, mrp: 69999, ram: '12GB' },
  { brand: 'Xiaomi', model: 'Xiaomi 13 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['256GB'], colors: ['Ceramic Black', 'Ceramic White'], basePrice: 39999, mrp: 79999, ram: '12GB' },
  { brand: 'Xiaomi', model: 'Redmi Note 13 Pro+ 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['256GB'], colors: ['Fusion Purple', 'Fusion Black'], basePrice: 21999, mrp: 31999, ram: '8GB' },
  { brand: 'Xiaomi', model: 'Redmi Note 13 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB', '256GB'], colors: ['Midnight Black', 'Coral Purple'], basePrice: 17999, mrp: 28999, ram: '8GB' },
  { brand: 'Xiaomi', model: 'Redmi Note 12 Pro+ 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['256GB'], colors: ['Obsidian Black', 'Iceberg Blue'], basePrice: 16999, mrp: 29999, ram: '8GB' },
  { brand: 'Xiaomi', model: 'Redmi Note 12 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['128GB'], colors: ['Stardust Purple', 'Glacier Blue'], basePrice: 13999, mrp: 24999, ram: '6GB' },
  { brand: 'Poco', model: 'POCO F6 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['256GB'], colors: ['Titanium', 'Black'], basePrice: 21999, mrp: 29999, ram: '8GB' },
  { brand: 'Poco', model: 'POCO X6 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['256GB'], colors: ['Yellow', 'Racing Grey'], basePrice: 18999, mrp: 26999, ram: '8GB' },
  { brand: 'Poco', model: 'POCO F5 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/2442176d-c1fc.jpg', storages: ['256GB'], colors: ['Carbon Black', 'Snowstorm White'], basePrice: 16999, mrp: 29999, ram: '8GB' },

  // ─── NOTHING ───
  { brand: 'Nothing', model: 'Nothing Phone (2)', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Dark Grey', 'White'], basePrice: 29999, mrp: 49999, ram: '8GB' },
  { brand: 'Nothing', model: 'Nothing Phone (2a)', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Black', 'White', 'Blue'], basePrice: 18999, mrp: 25999, ram: '8GB' },
  { brand: 'Nothing', model: 'Nothing Phone (1)', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['128GB', '256GB'], colors: ['Black', 'White'], basePrice: 17999, mrp: 37999, ram: '8GB' },

  // ─── VIVO / IQOO ───
  { brand: 'Vivo', model: 'Vivo X100 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['512GB'], colors: ['Asteroid Black', 'Sunset Orange'], basePrice: 59999, mrp: 89999, ram: '16GB' },
  { brand: 'Vivo', model: 'Vivo V30 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['256GB'], colors: ['Andaman Blue', 'Classic Black'], basePrice: 31999, mrp: 46999, ram: '8GB' },
  { brand: 'iQOO', model: 'iQOO 12 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['256GB'], colors: ['Legend (White)', 'Alpha (Black)'], basePrice: 39999, mrp: 52999, ram: '12GB' },
  { brand: 'iQOO', model: 'iQOO Neo 9 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/312312a4-9019.jpg', storages: ['128GB', '256GB'], colors: ['Fiery Red', 'Conqueror Black'], basePrice: 26999, mrp: 39999, ram: '8GB' },

  // ─── MOTOROLA ───
  { brand: 'Motorola', model: 'Motorola Edge 50 Pro 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Black Beauty', 'Luxe Lavender'], basePrice: 24999, mrp: 35999, ram: '8GB' },
  { brand: 'Motorola', model: 'Motorola Edge 40 5G', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Eclipse Black', 'Nebula Green'], basePrice: 18999, mrp: 34999, ram: '8GB' },
  { brand: 'Motorola', model: 'Motorola Razr 40 Ultra', img: 'https://s3ng.cashify.in/cashify/product/img/xxhdpi/6d468fa9-3d08.jpg', storages: ['256GB'], colors: ['Infinite Black', 'Viva Magenta'], basePrice: 42999, mrp: 89999, ram: '8GB' }
];

// Generate individual products from base models (over 100 items)
const catalogItems = [];
const conditions = ['superb', 'superb', 'excellent', 'good'];

let counter = 0;
for (const base of phoneBases) {
  for (const storage of base.storages) {
    const color = base.colors[counter % base.colors.length];
    const condition = conditions[counter % conditions.length];
    
    // adjust price per storage
    const storageMultiplier = storage === '1TB' ? 1.35 : storage === '512GB' ? 1.2 : storage === '256GB' ? 1.1 : 1.0;
    const price = Math.round(base.basePrice * storageMultiplier / 100) * 100 - 1; // e.g. 48999
    const originalPrice = Math.round(base.mrp * storageMultiplier / 100) * 100;

    catalogItems.push({
      brand: base.brand,
      name: `${base.brand} ${base.model} - Refurbished`,
      modelQuery: base.model,
      storage,
      ram: base.ram,
      color,
      condition,
      price,
      originalPrice,
      warrantyMonths: 6,
      stock: 5 + (counter % 20),
      featured: counter < 15,
      coverImageUrl: base.img,
      specs: {
        brand: base.brand,
        model: base.model,
        storage,
        ram: base.ram,
        display: `${base.model.includes('Ultra') || base.model.includes('Max') || base.model.includes('Fold') ? '6.7 - 7.6-inch' : '6.1 - 6.7-inch'} AMOLED / OLED 120Hz`,
        processor: base.brand === 'Apple' ? 'Apple Bionic / Pro Chip' : 'Snapdragon / Dimensity Flagship',
        warranty: '6 Months Comprehensive Warranty',
        checks: '32-Point Hardware & Software Quality Checked'
      }
    });
    counter++;
  }
}
console.log(`Generated ${catalogItems.length} refurbished phone listings across ${phoneBases.length} models.`);

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database...');

  // Ensure brands exist
  const brandCache = new Map();
  const brandsRes = await client.query('SELECT id, name, slug FROM brands');
  for (const b of brandsRes.rows) {
    brandCache.set(b.name.toLowerCase(), b.id);
  }

  // Insert or find brand if missing
  for (const item of catalogItems) {
    const key = item.brand.toLowerCase();
    if (!brandCache.has(key)) {
      const slug = slugify(item.brand);
      const insertBrand = await client.query(
        'INSERT INTO brands (name, slug, service_type) VALUES ($1, $2, $3) RETURNING id',
        [item.brand, slug, 'mobile']
      );
      brandCache.set(key, insertBrand.rows[0].id);
      console.log(`Created brand: ${item.brand}`);
    }
  }

  // Find matching models from models table if possible
  const allModelsRes = await client.query('SELECT id, name, series_id FROM models');
  const allModels = allModelsRes.rows;

  let insertedCount = 0;
  for (const item of catalogItems) {
    const brandId = brandCache.get(item.brand.toLowerCase());
    
    // Find matching model
    let modelId = null;
    const match = allModels.find(m => m.name.toLowerCase().includes(item.modelQuery.toLowerCase()));
    if (match) {
      modelId = match.id;
    }

    const slug = slugify(`${item.name}-${item.storage}-${item.color}`);
    const desc = `Certified Refurbished ${item.name} in ${item.condition.toUpperCase()} condition. Inspected across 32 rigorous hardware & software checks by Looplic certified technicians. Comes with a 6-Month Comprehensive Warranty, 15-Day Hassle-Free Replacement Guarantee, and 100% genuine parts verified. Battery health guaranteed 85%+. Includes fast-charging cable and Looplic Assured authenticity certificate.`;

    // Upsert into products
    const res = await client.query(
      `INSERT INTO products (
        name, slug, brand_id, model_id, category, condition, price, original_price,
        storage, ram, color, description, specifications, warranty_months, stock,
        featured, active, cover_image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (slug) DO UPDATE SET
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        stock = EXCLUDED.stock,
        featured = EXCLUDED.featured,
        active = EXCLUDED.active,
        cover_image_url = EXCLUDED.cover_image_url,
        specifications = EXCLUDED.specifications
      RETURNING id`,
      [
        item.name,
        slug,
        brandId,
        modelId,
        'phone',
        item.condition,
        item.price,
        item.originalPrice,
        item.storage,
        item.ram,
        item.color,
        desc,
        JSON.stringify(item.specs),
        item.warrantyMonths,
        item.stock,
        item.featured,
        true,
        item.coverImageUrl
      ]
    );

    const productId = res.rows[0].id;
    insertedCount++;

    // Insert secondary product images
    await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
    await client.query(
      'INSERT INTO product_images (product_id, image_url, alt_text, sort_order) VALUES ($1, $2, $3, $4)',
      [productId, item.coverImageUrl, `${item.name} - Front View`, 1]
    );
  }

  console.log(`Successfully seeded ${insertedCount} refurbished products into database!`);

  const countAfter = await client.query('SELECT count(*) FROM products');
  console.log('Total products in database now:', countAfter.rows[0].count);

  await client.end();
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
