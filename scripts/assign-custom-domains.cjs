const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const auth = JSON.parse(fs.readFileSync(path.join(appData, 'com.vercel.cli', 'Data', 'auth.json'), 'utf8'));
const token = auth.token;
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';

const DOMAIN_ASSIGNMENTS = [
  { projectId: 'prj_6UhWMQgso95Q15KJvCxM8LBE6D9n', name: 'looplic-admin', domain: 'admin.looplic.com' },
  { projectId: 'prj_cgdhDACGg34CXzYIavWFQbH46jwM', name: 'looplic-operator', domain: 'operator.looplic.com' },
  { projectId: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu', name: 'looplic-technician', domain: 'tech.looplic.com' },
  { projectId: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu', name: 'looplic-technician', domain: 'technician.looplic.com' },
  { projectId: 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax', name: 'looplic-js-main', domain: 'www.looplic.com' },
  { projectId: 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax', name: 'looplic-js-main', domain: 'looplic.com' }
];

async function assignDomains() {
  console.log('=== Assigning Custom Domains to Vercel Projects ===\n');

  for (const item of DOMAIN_ASSIGNMENTS) {
    console.log(`Adding ${item.domain} to ${item.name}...`);
    const url = `https://api.vercel.com/v10/projects/${item.projectId}/domains?teamId=${teamId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: item.domain })
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`  Result: ${res.status} - ${data.error?.message || JSON.stringify(data)}`);
    } else {
      console.log(`  ✓ Domain ${item.domain} added! Verified: ${data.verified}`);
      if (data.verification) {
        console.log(`    Verification instructions:`, data.verification);
      }
    }
  }
}

assignDomains().catch(console.error);

