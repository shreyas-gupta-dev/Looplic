import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const res = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products'`);
  console.log("Products table exists:", res.rows.length > 0);

  if (res.rows.length === 0) {
    console.log("Creating products and product_images tables...");

    await client.query(`
      CREATE TYPE product_condition AS ENUM ('fair', 'good', 'excellent', 'superb', 'unboxed');
    `).catch(() => console.log("  product_condition type already exists"));

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
        model_id UUID REFERENCES models(id) ON DELETE SET NULL,
        category TEXT NOT NULL DEFAULT 'phone',
        condition product_condition NOT NULL DEFAULT 'good',
        price NUMERIC NOT NULL DEFAULT 0,
        original_price NUMERIC NOT NULL DEFAULT 0,
        storage TEXT,
        ram TEXT,
        color TEXT,
        description TEXT,
        specifications JSONB,
        warranty_months INTEGER NOT NULL DEFAULT 6,
        stock INTEGER NOT NULL DEFAULT 0,
        featured BOOLEAN NOT NULL DEFAULT false,
        active BOOLEAN NOT NULL DEFAULT true,
        cover_image_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log("  ✓ products table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        alt_text TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log("  ✓ product_images table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log("  ✓ cart_items table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS buy_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_code TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_amount NUMERIC NOT NULL DEFAULT 0,
        shipping_address TEXT NOT NULL,
        shipping_city TEXT,
        shipping_pincode TEXT,
        payment_method TEXT NOT NULL DEFAULT 'online',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log("  ✓ buy_orders table created");
  }

  await client.end();
  console.log("Done!");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
