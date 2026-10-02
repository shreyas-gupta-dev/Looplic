const fs = require('fs');
const path = require('path');

async function main() {
  const appData = process.env.APPDATA;
  const authFile = path.join(appData, 'com.vercel.cli', 'Data', 'auth.json');
  if (!fs.existsSync(authFile)) {
    console.error('auth.json not found');
    return;
  }
  const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  const token = auth.token;
  console.log('Token acquired successfully.');

  const projectFile = path.join(process.cwd(), '.vercel', 'project.json');
  const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
  console.log('Project:', project.projectId, 'Org:', project.orgId);

  // 1. Add looplic.com to project
  const url = `https://api.vercel.com/v10/projects/${project.projectId}/domains?teamId=${project.orgId}`;
  console.log('Calling:', url);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'looplic.com' })
  });

  const data = await res.json();
  console.log('Response status:', res.status);
  console.log('Response data:', JSON.stringify(data, null, 2));

  // Also try www.looplic.com
  const resWww = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: 'www.looplic.com' })
  });
  const dataWww = await resWww.json();
  console.log('WWW Response status:', resWww.status);
  console.log('WWW Response data:', JSON.stringify(dataWww, null, 2));
}

main().catch(console.error);
