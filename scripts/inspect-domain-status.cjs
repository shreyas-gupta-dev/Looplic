const fs = require('fs');
const path = require('path');

async function main() {
  const appData = process.env.APPDATA;
  const authFile = path.join(appData, 'com.vercel.cli', 'Data', 'auth.json');
  const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  const token = auth.token;

  const projectFile = path.join(process.cwd(), '.vercel', 'project.json');
  const project = JSON.parse(fs.readFileSync(projectFile, 'utf8'));

  for (const d of ['looplic.com', 'www.looplic.com']) {
    const url = `https://api.vercel.com/v9/projects/${project.projectId}/domains/${d}?teamId=${project.orgId}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`=== ${d} ===`);
    console.log(JSON.stringify(data, null, 2));

    // Also check domain config
    const configUrl = `https://api.vercel.com/v6/domains/${d}/config?teamId=${project.orgId}`;
    const resConfig = await fetch(configUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataConfig = await resConfig.json();
    console.log(`=== ${d} Config ===`);
    console.log(JSON.stringify(dataConfig, null, 2));
  }
}

main().catch(console.error);
