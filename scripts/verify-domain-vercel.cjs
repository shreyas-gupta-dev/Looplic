const fs = require('fs');
const path = require('path');

const authFile = path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';
const projectId = 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax';

async function check() {
  for (const d of ['looplic.com', 'www.looplic.com']) {
    console.log('\n====================================');
    console.log('Verifying domain:', d);
    const verifyRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${d}/verify?teamId=${teamId}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + auth.token }
    });
    const verifyData = await verifyRes.json();
    console.log('Verify Result:', JSON.stringify(verifyData, null, 2));

    const configRes = await fetch(`https://api.vercel.com/v6/domains/${d}/config?teamId=${teamId}`, {
      headers: { Authorization: 'Bearer ' + auth.token }
    });
    const configData = await configRes.json();
    console.log('Config Result:', JSON.stringify(configData, null, 2));
  }
}

check().catch(console.error);
