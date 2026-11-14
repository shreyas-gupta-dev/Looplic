const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const auth = JSON.parse(fs.readFileSync(path.join(appData, 'com.vercel.cli', 'Data', 'auth.json'), 'utf8'));
const token = auth.token;
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';

const domains = [
  'looplic.com',
  'www.looplic.com',
  'admin.looplic.com',
  'operator.looplic.com',
  'tech.looplic.com',
  'technician.looplic.com'
];

async function checkDomains() {
  console.log('=== Vercel Domain Verification Status ===\n');

  for (const d of domains) {
    const url = `https://api.vercel.com/v9/projects/prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax/domains/${d}?teamId=${teamId}`;
    // Also try general domain endpoint
    const res = await fetch(`https://api.vercel.com/v5/domains/${d}?teamId=${teamId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`Domain: ${d}`);
    if (res.ok) {
      console.log(`  Verified: ${data.verified}, Configured: ${data.configured}`);
      if (data.verification) console.log(`  Verification:`, data.verification);
    } else {
      // Try project domain check
      console.log(`  Status ${res.status}:`, data.error?.message || data);
    }
  }
}

checkDomains().catch(console.error);

