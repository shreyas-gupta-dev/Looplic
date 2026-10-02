const fs = require('fs');
const path = require('path');

async function main() {
  const appData = process.env.APPDATA;
  const authFile = path.join(appData, 'com.vercel.cli', 'Data', 'auth.json');
  const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  const token = auth.token;

  const res = await fetch('https://api.vercel.com/v6/deployments?projectId=prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax&limit=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('DEPLOYMENTS:');
  for (const d of data.deployments || []) {
    console.log(`- ${d.uid} | ${d.url} | ${d.state} | ${d.meta?.githubCommitMessage || d.name} | ${new Date(d.createdAt).toLocaleTimeString()}`);
  }
}

main().catch(console.error);
