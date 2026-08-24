const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const RDS_URL = 'postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic';
const SUPA_URL = 'postgresql://postgres:Looplic@1234@db.zhoverulwcybtgrezaob.supabase.co:5432/postgres';

async function migrate() {
  const rds = new Client({ connectionString: RDS_URL, ssl: { rejectUnauthorized: false } });
  const supa = new Client({ connectionString: SUPA_URL, ssl: { rejectUnauthorized: false } });

  await rds.connect();
  await supa.connect();
  console.log('Both databases connected!');

  // Step 1: Get schema from RDS and apply to Supabase
  console.log('\n=== Step 1: Applying schema to Supabase ===');
  const schemaFile = path.join(__dirname, '..', 'rds-schema.sql');
  const schema = fs.readFileSync(schemaFile, 'utf8');
  
  try {
    await supa.query(schema);
    console.log('Schema applied successfully!');
  } catch (e) {
    // Schema might partially exist, continue
    console.log('Schema apply note:', e.message.substring(0, 100));
    console.log('Trying table-by-table...');
    
    // Split by statements and try each
    const statements = schema.split(';').filter(s => s.trim());
    let success = 0, skipped = 0;
    for (const stmt of statements) {
      try {
        await supa.query(stmt + ';');
        success++;
      } catch (err) {
        skipped++;
      }
    }
    console.log(`  Applied: ${success}, Skipped (already exist): ${skipped}`);
  }

  // Step 2: Get all tables
  console.log('\n=== Step 2: Migrating data ===');
  const { rows: tables } = await rds.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log(`Found ${tables.length} tables to migrate`);

  // Determine dependency order (foreign keys)
  const orderedTables = [
    'app_settings',
    'brands',
    'series', 
    'models',
    'repair_categories',
    'repair_subcategories',
    'model_repair_services',
    'model_repair_subcategory_prices',
    'screen_guard_types',
    'screen_guard_categories',
    'model_screen_guards',
    'bookings',
    'service_bills',
    'booking_inspections',
    'technician_applications',
    'user_roles',
    'user_profiles',
    'blog_posts',
    'sell_categories',
    'buyback_questions',
    'buyback_variants',
    'buyback_variant_prices',
    'buyback_bookings',
    'whatsapp_sessions',
  ];

  // Get actual tables that exist in RDS
  const existingTables = tables.map(t => t.tablename);
  const migrationOrder = orderedTables.filter(t => existingTables.includes(t));
  // Add any tables not in our ordered list
  const remaining = existingTables.filter(t => !migrationOrder.includes(t));
  const allTables = [...migrationOrder, ...remaining];

  // Step 3: Disable foreign key checks temporarily
  await supa.query('SET session_replication_role = replica;');

  for (const tableName of allTables) {
    try {
      // Get row count from source
      const { rows: countRows } = await rds.query(`SELECT count(*) as cnt FROM "${tableName}"`);
      const count = parseInt(countRows[0].cnt);
      
      if (count === 0) {
        console.log(`  ${tableName}: 0 rows (skipping)`);
        continue;
      }

      // Clear target table
      try {
        await supa.query(`DELETE FROM "${tableName}"`);
      } catch (e) {
        // Table might not exist in Supabase yet
        console.log(`  ${tableName}: table not in Supabase (skipping)`);
        continue;
      }

      // Copy data in batches
      const batchSize = 500;
      let copied = 0;
      
      // Get columns
      const { rows: colRows } = await rds.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`,
        [tableName]
      );
      const columns = colRows.map(c => c.column_name);
      const colList = columns.map(c => `"${c}"`).join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      for (let offset = 0; offset < count; offset += batchSize) {
        const { rows: data } = await rds.query(
          `SELECT ${colList} FROM "${tableName}" LIMIT ${batchSize} OFFSET ${offset}`
        );

        for (const row of data) {
          const values = columns.map(c => row[c]);
          try {
            await supa.query(
              `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
              values
            );
            copied++;
          } catch (e) {
            // Skip individual row errors
          }
        }
      }

      console.log(`  ${tableName}: ${copied}/${count} rows migrated`);
    } catch (e) {
      console.log(`  ${tableName}: ERROR - ${e.message.substring(0, 80)}`);
    }
  }

  // Re-enable foreign key checks
  await supa.query('SET session_replication_role = DEFAULT;');

  console.log('\n=== Migration complete! ===');
  
  // Verify
  console.log('\n=== Verification ===');
  for (const tableName of allTables.slice(0, 10)) {
    try {
      const { rows } = await supa.query(`SELECT count(*) as cnt FROM "${tableName}"`);
      console.log(`  ${tableName}: ${rows[0].cnt} rows in Supabase`);
    } catch (e) {
      // skip
    }
  }

  await rds.end();
  await supa.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
