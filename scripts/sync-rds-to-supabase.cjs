const { Client } = require('pg');

const RDS_URL = process.env.DATABASE_URL || '';
const SUPA_URL = process.env.DATABASE_URL || '';

async function syncAll() {
  const rds = new Client({ connectionString: RDS_URL, ssl: { rejectUnauthorized: false } });
  const supa = new Client({ connectionString: SUPA_URL, ssl: { rejectUnauthorized: false } });

  await rds.connect();
  await supa.connect();
  console.log('Both databases connected!');

  // Disable FK triggers on Supabase for seamless bulk load
  console.log('Disabling FK checks on Supabase (replica mode)...');
  await supa.query('SET session_replication_role = replica;');

  // Get all primary keys on Supabase
  const pkRes = await supa.query(`
    SELECT t.relname as table_name, array_agg(a.attname ORDER BY array_position(c.conkey, a.attnum)) as pk_cols
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'p' AND n.nspname = 'public'
    GROUP BY t.relname
  `);
  const pkMap = new Map();
  for (const r of pkRes.rows) {
    let pks = r.pk_cols;
    if (typeof pks === 'string') {
      pks = pks.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(pks)) {
      pks = [];
    }
    pkMap.set(r.table_name, pks);
  }

  // Get all public tables in RDS
  const { rows: rdsTables } = await rds.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );

  console.log(`\nFast batch-syncing ${rdsTables.length} tables from RDS to Supabase...`);

  for (const { tablename: tableName } of rdsTables) {
    try {
      const { rows: countRows } = await rds.query(`SELECT count(*) as cnt FROM "${tableName}"`);
      const count = parseInt(countRows[0].cnt);
      if (count === 0) {
        console.log(`  ${tableName}: 0 rows in RDS (skipping)`);
        continue;
      }

      // Check columns in RDS
      const { rows: rdsCols } = await rds.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public' ORDER BY ordinal_position`,
        [tableName]
      );
      // Check columns in Supabase
      const { rows: supaCols } = await supa.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
        [tableName]
      );
      const supaColSet = new Set(supaCols.map(c => c.column_name));

      // Match common columns
      const commonCols = rdsCols.map(c => c.column_name).filter(c => supaColSet.has(c));
      if (commonCols.length === 0) {
        console.log(`  ${tableName}: No common columns found (skipping)`);
        continue;
      }

      const pks = pkMap.get(tableName) || [];
      const colList = commonCols.map(c => `"${c}"`).join(', ');

      // Build ON CONFLICT clause
      let conflictClause = 'ON CONFLICT DO NOTHING';
      if (pks.length > 0 && pks.every(pk => commonCols.includes(pk))) {
        const pkList = pks.map(p => `"${p}"`).join(', ');
        const nonPkCols = commonCols.filter(c => !pks.includes(c));
        if (nonPkCols.length > 0) {
          const updateSet = nonPkCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
          conflictClause = `ON CONFLICT (${pkList}) DO UPDATE SET ${updateSet}`;
        } else {
          conflictClause = `ON CONFLICT (${pkList}) DO NOTHING`;
        }
      }

      // Batch size determined dynamically by column count to keep params well below 65k limit
      const batchSize = Math.min(200, Math.floor(3000 / commonCols.length));
      let processed = 0;

      for (let offset = 0; offset < count; offset += batchSize) {
        const { rows: batch } = await rds.query(
          `SELECT ${colList} FROM "${tableName}" LIMIT ${batchSize} OFFSET ${offset}`
        );

        if (batch.length === 0) break;

        const valueRows = [];
        const flatValues = [];
        let paramIdx = 1;

        for (const row of batch) {
          const rowPlaceholders = [];
          for (const col of commonCols) {
            rowPlaceholders.push(`$${paramIdx++}`);
            flatValues.push(row[col]);
          }
          valueRows.push(`(${rowPlaceholders.join(', ')})`);
        }

        const sql = `INSERT INTO "${tableName}" (${colList}) VALUES ${valueRows.join(', ')} ${conflictClause}`;
        await supa.query(sql, flatValues);
        processed += batch.length;
      }

      console.log(`  ${tableName}: ${processed}/${count} synced`);
    } catch (err) {
      console.error(`  ${tableName}: ERROR:`, err.message);
    }
  }

  // Re-enable FK checks
  console.log('\nRestoring foreign key triggers on Supabase...');
  await supa.query('SET session_replication_role = DEFAULT;');

  console.log('\n=== Parity Verification Report ===\n');

  let perfectMatch = 0;
  let differences = 0;

  for (const { tablename: tableName } of rdsTables) {
    const { rows: rdsCount } = await rds.query(`SELECT count(*) as cnt FROM "${tableName}"`);
    const { rows: supaCount } = await supa.query(`SELECT count(*) as cnt FROM "${tableName}"`);
    const rc = parseInt(rdsCount[0].cnt);
    const sc = parseInt(supaCount[0].cnt);
    const status = (rc === sc) ? 'MATCH' : (sc >= rc ? 'SUPERSET (OK)' : 'DIFF');
    if (status === 'MATCH' || status === 'SUPERSET (OK)') {
      perfectMatch++;
    } else {
      differences++;
    }
    console.log(`  ${tableName.padEnd(35)} RDS: ${rc.toString().padStart(6)} | Supabase: ${sc.toString().padStart(6)} | ${status}`);
  }

  console.log(`\nSummary: ${perfectMatch} tables verified matching/superset, ${differences} discrepancies.`);

  await rds.end();
  await supa.end();
}

syncAll().catch(console.error);

