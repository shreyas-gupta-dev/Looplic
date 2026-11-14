const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const authFile = path.join(appData, 'com.vercel.cli', 'Data', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const token = auth.token;
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';

const NEW_DATABASE_URL = process.env.DATABASE_URL || '';

const PROJECTS = [
  { name: 'looplic-js-main (Customer Web & App)', id: 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax' },
  { name: 'looplic-admin (Admin Portal)', id: 'prj_6UhWMQgso95Q15KJvCxM8LBE6D9n' },
  { name: 'looplic-operator (Operator Portal)', id: 'prj_cgdhDACGg34CXzYIavWFQbH46jwM' },
  { name: 'looplic-technician (Technician Portal)', id: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu' }
];

async function updateDatabaseUrl() {
  console.log('=== Updating DATABASE_URL across all 4 Vercel projects ===\n');

  for (const project of PROJECTS) {
    console.log(`Processing ${project.name} (${project.id})...`);

    // 1. Fetch existing env vars
    const listUrl = `https://api.vercel.com/v9/projects/${project.id}/env?teamId=${teamId}`;
    const listRes = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!listRes.ok) {
      console.error(`  ✗ Failed to list env vars: ${listRes.status} ${listRes.statusText}`);
      continue;
    }

    const listData = await listRes.json();
    const envs = listData.envs || [];
    const dbUrlEnvs = envs.filter(e => e.key === 'DATABASE_URL');

    if (dbUrlEnvs.length > 0) {
      for (const envItem of dbUrlEnvs) {
        console.log(`  Updating existing DATABASE_URL (id: ${envItem.id}, targets: ${envItem.target?.join(', ')})...`);
        const patchUrl = `https://api.vercel.com/v9/projects/${project.id}/env/${envItem.id}?teamId=${teamId}`;
        const patchRes = await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            value: NEW_DATABASE_URL,
            target: envItem.target || ['production', 'preview']
          })
        });

        if (patchRes.ok) {
          console.log(`  ✓ DATABASE_URL updated to Supabase for ${project.name}`);
        } else {
          const err = await patchRes.json();
          console.error(`  ✗ Error updating DATABASE_URL:`, err);
        }
      }
    } else {
      console.log(`  Creating new DATABASE_URL for ${project.name}...`);
      const postUrl = `https://api.vercel.com/v10/projects/${project.id}/env?teamId=${teamId}`;
      const postRes = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: 'DATABASE_URL',
          value: NEW_DATABASE_URL,
          type: 'encrypted',
          target: ['production', 'preview']
        })
      });

      if (postRes.ok) {
        console.log(`  ✓ Created DATABASE_URL for ${project.name}`);
      } else {
        const err = await postRes.json();
        console.error(`  ✗ Error creating DATABASE_URL:`, err);
      }
    }
  }

  console.log('\n=== All 4 projects updated to Supabase PostgreSQL! ===');
}

updateDatabaseUrl().catch(console.error);
