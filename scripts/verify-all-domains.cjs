const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const auth = JSON.parse(fs.readFileSync(path.join(appData, 'com.vercel.cli', 'Data', 'auth.json'), 'utf8'));
const token = auth.token;
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';

const items = [
  { projectId: 'prj_6UhWMQgso95Q15KJvCxM8LBE6D9n', domain: 'admin.looplic.com' },
  { projectId: 'prj_cgdhDACGg34CXzYIavWFQbH46jwM', domain: 'operator.looplic.com' },
  { projectId: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu', domain: 'technician.looplic.com' },
  { projectId: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu', domain: 'tech.looplic.com' },
  { projectId: 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax', domain: 'www.looplic.com' }
];

async function verifyAll() {
  for (const item of items) {
    const res = await fetch(`https://api.vercel.com/v9/projects/${item.projectId}/domains/${item.domain}/verify?teamId=${teamId}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    });
    const d = await res.json();
    console.log(`${item.domain}: verified = ${d.verified}`);
  }
}

verifyAll().catch(console.error);

