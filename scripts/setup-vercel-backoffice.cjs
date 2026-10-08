const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const authFile = path.join(appData, 'com.vercel.cli', 'Data', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const token = auth.token;
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';

// Read env vars from apps/admin/.env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', 'apps', 'admin', '.env.local'), 'utf8');
const envMap = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envMap[key] = val;
  }
}

const PROJECTS = [
  {
    name: 'looplic-admin',
    id: 'prj_6UhWMQgso95Q15KJvCxM8LBE6D9n',
    rootDirectory: 'apps/admin',
    appUrl: 'https://looplic-admin.vercel.app'
  },
  {
    name: 'looplic-technician',
    id: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu',
    rootDirectory: 'apps/technician',
    appUrl: 'https://looplic-technician.vercel.app'
  },
  {
    name: 'looplic-operator',
    id: 'prj_cgdhDACGg34CXzYIavWFQbH46jwM',
    rootDirectory: 'apps/operator',
    appUrl: 'https://looplic-operator.vercel.app'
  }
];

async function updateProjectSettings(project) {
  console.log(`\n--- Updating settings for ${project.name} (${project.id}) ---`);
  const url = `https://api.vercel.com/v9/projects/${project.id}?teamId=${teamId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rootDirectory: project.rootDirectory,
      framework: 'nextjs',
      buildCommand: 'next build',
      installCommand: 'cd ../.. && npm install',
      nodeVersion: '24.x'
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Failed to update ${project.name}:`, data);
  } else {
    console.log(`✓ Updated ${project.name} settings: rootDirectory = ${data.rootDirectory}, framework = ${data.framework}`);
  }
}

async function setProjectEnv(project) {
  console.log(`\n--- Setting env vars for ${project.name} ---`);
  
  // List existing env vars
  const listUrl = `https://api.vercel.com/v9/projects/${project.id}/env?teamId=${teamId}`;
  const listRes = await fetch(listUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const listData = await listRes.json();
  const existingKeys = new Set((listData.envs || []).map(e => e.key));

  const envsToSet = {
    ...envMap,
    NEXT_PUBLIC_APP_URL: project.appUrl,
    APP_AWS_ACCESS_KEY_ID: envMap.AWS_ACCESS_KEY_ID,
    APP_AWS_SECRET_ACCESS_KEY: envMap.AWS_SECRET_ACCESS_KEY,
    APP_AWS_REGION: envMap.AWS_REGION || 'ap-south-1',
  };

  for (const [key, value] of Object.entries(envsToSet)) {
    if (!value) continue;
    if (existingKeys.has(key)) {
      console.log(`· Env ${key} already exists, skipping`);
      continue;
    }

    const postUrl = `https://api.vercel.com/v10/projects/${project.id}/env?teamId=${teamId}`;
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key,
        value,
        type: key.includes('KEY') || key.includes('URL') || key.includes('SECRET') ? 'encrypted' : 'plain',
        target: ['production', 'preview']
      })
    });
    if (postRes.ok) {
      console.log(`✓ Added env ${key}`);
    } else {
      const err = await postRes.json();
      console.error(`✗ Error adding ${key}:`, err.message || err);
    }
  }
}

async function main() {
  for (const p of PROJECTS) {
    await updateProjectSettings(p);
    await setProjectEnv(p);
  }
  console.log('\nAll projects configured successfully on Vercel.');
}

main().catch(console.error);
