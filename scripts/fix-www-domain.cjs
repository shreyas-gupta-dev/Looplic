const fs = require('fs');
const path = require('path');

const authFile = path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const teamId = 'team_sLhNuV1R11KHi6zU2naUW3zF';
const projectId = 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax';

async function main() {
  console.log('1. Checking current project domains:');
  const dRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains?teamId=${teamId}`, {
    headers: { Authorization: 'Bearer ' + auth.token }
  });
  const dData = await dRes.json();
  console.log(dData.domains.map(d => ({ name: d.name, verified: d.verified, redirect: d.redirect })));

  // Try re-adding www.looplic.com now that apex is verified
  console.log('\n2. Trying to remove and re-add www.looplic.com:');
  await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/www.looplic.com?teamId=${teamId}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + auth.token }
  });

  const addRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${teamId}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + auth.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'www.looplic.com' })
  });
  const addData = await addRes.json();
  console.log('Re-add result:', JSON.stringify(addData, null, 2));

  // Check again
  const finalRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains?teamId=${teamId}`, {
    headers: { Authorization: 'Bearer ' + auth.token }
  });
  const finalData = await finalRes.json();
  console.log('\nFinal Domains:', finalData.domains.map(d => ({ name: d.name, verified: d.verified, redirect: d.redirect })));
}

main().catch(console.error);
