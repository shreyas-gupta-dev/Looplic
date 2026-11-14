const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPA_URL = process.env.DATABASE_URL || '';

async function applyMissingSchema() {
  const supa = new Client({ connectionString: SUPA_URL, ssl: { rejectUnauthorized: false } });
  await supa.connect();
  console.log('Connected to Supabase PostgreSQL!');

  // 1. Create product_condition enum if not exists
  console.log('Ensuring product_condition enum exists...');
  await supa.query(`
    DO $$ BEGIN
      CREATE TYPE product_condition AS ENUM ('fair', 'good', 'excellent', 'superb', 'unboxed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  console.log('product_condition enum created/verified.');

  // 2. Read missing-tables.sql and remove OWNER TO lines and search_path issues
  const sqlPath = 'C:\\Users\\Shrey\\.gemini\\antigravity\\brain\\28be9cde-1efa-4c6b-95a0-a28251e9c589\\scratch\\missing-tables.sql';
  const rawSql = fs.readFileSync(sqlPath, 'utf8');

  // Filter out ALTER TABLE ... OWNER TO
  const statements = rawSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.includes('OWNER TO') && !s.startsWith('SET '));

  console.log(`Executing ${statements.length} DDL statements...`);

  let succeeded = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await supa.query(stmt + ';');
      succeeded++;
    } catch (err) {
      if (err.message.includes('already exists')) {
        skipped++;
      } else {
        console.warn('DDL notice/error:', err.message.substring(0, 100), '\nStmt:', stmt.substring(0, 60));
      }
    }
  }

  console.log(`DDL execution finished: ${succeeded} applied, ${skipped} skipped (already exists).`);

  // Verify missing tables now exist
  const check = await supa.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('products', 'product_images', 'blog_posts', 'booking_status_events', 'repair_stream_sessions', 'auth_email_otps', 'buy_orders', 'cart_items', 'repair_stage_media')
    ORDER BY tablename
  `);

  console.log('Verified existing target tables in Supabase:', check.rows.map(r => r.tablename));

  await supa.end();
}

applyMissingSchema().catch(console.error);
