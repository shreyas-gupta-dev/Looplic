const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const auth = JSON.parse(fs.readFileSync(path.join(appData, 'com.vercel.cli', 'Data', 'auth.json'), 'utf8'));
const token = auth.token;
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';

const projects = [
  { name: 'looplic-js-main', id: 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax' },
  { name: 'looplic-admin', id: 'prj_6UhWMQgso95Q15KJvCxM8LBE6D9n' },
  { name: 'looplic-operator', id: 'prj_cgdhDACGg34CXzYIavWFQbH46jwM' },
  { name: 'looplic-technician', id: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu' }
];

async function list() {
  for (const p of projects) {
    const res = await fetch(`https://api.vercel.com/v9/projects/${p.id}/domains?teamId=${teamId}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const data = await res.json();
    console.log(`\nProject: ${p.name}`);
    if (data.domains) {
      data.domains.forEach(d => {
        console.log(`  - ${d.name} (verified: ${d.verified})`);
        if (d.verification && !d.verified) {
          console.log(`    Verification required:`, d.verification);
        }
      });
    } else {
      console.log('  Error:', data);
    }
  }
}
list();

