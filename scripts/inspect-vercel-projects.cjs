const fs = require('fs');
const path = require('path');

async function main() {
  const appData = process.env.APPDATA;
  const authFile = path.join(appData, 'com.vercel.cli', 'Data', 'auth.json');
  if (!fs.existsSync(authFile)) {
    console.log('No auth file found');
    return;
  }
  const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
  const token = auth.token;

  // List teams
  const teamsRes = await fetch('https://api.vercel.com/v2/teams', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const teamsData = await teamsRes.json();
  console.log('TEAMS:', JSON.stringify(teamsData, null, 2));

  // List projects for each team or user
  const projectsRes = await fetch('https://api.vercel.com/v9/projects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const projectsData = await projectsRes.json();
  console.log('USER PROJECTS:', projectsData.projects ? projectsData.projects.map(p => ({ id: p.id, name: p.name, targets: p.targets })) : projectsData);
}

main().catch(console.error);
