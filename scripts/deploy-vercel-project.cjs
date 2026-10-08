const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetProject = process.argv[2];
if (!targetProject) {
  console.error("Usage: node scripts/deploy-vercel-project.cjs <looplic-admin | looplic-technician | looplic-operator | looplic-js-main>");
  process.exit(1);
}

const PROJECTS = {
  'looplic-admin': {
    projectId: 'prj_6UhWMQgso95Q15KJvCxM8LBE6D9n',
    orgId: 'team_sLhNuV1R11KHi6zU2naUW3zF',
    projectName: 'looplic-admin'
  },
  'looplic-technician': {
    projectId: 'prj_GXQyvMnNHDYzTR6bOijpVEePjQZu',
    orgId: 'team_sLhNuV1R11KHi6zU2naUW3zF',
    projectName: 'looplic-technician'
  },
  'looplic-operator': {
    projectId: 'prj_cgdhDACGg34CXzYIavWFQbH46jwM',
    orgId: 'team_sLhNuV1R11KHi6zU2naUW3zF',
    projectName: 'looplic-operator'
  },
  'looplic-js-main': {
    projectId: 'prj_X6lAjp3CbHA0hTIQ9YDUpZTVmIax',
    orgId: 'team_sLhNuV1R11KHi6zU2naUW3zF',
    projectName: 'looplic-js-main'
  }
};

const config = PROJECTS[targetProject];
if (!config) {
  console.error("Unknown target project:", targetProject);
  process.exit(1);
}

const projectJsonPath = path.join(process.cwd(), '.vercel', 'project.json');
const backupPath = path.join(process.cwd(), '.vercel', 'project.json.original');

try {
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(projectJsonPath, backupPath);
  }

  // Write target project config
  fs.writeFileSync(projectJsonPath, JSON.stringify(config, null, 2), 'utf8');
  console.log(`\n=== Deploying ${targetProject} (${config.projectId}) ===`);

  const output = execSync('npx vercel deploy --prod --yes', {
    stdio: 'inherit',
    env: { ...process.env, CI: '1' }
  });
  console.log(`\n✓ Successfully deployed ${targetProject}!`);
} catch (err) {
  console.error(`✗ Deployment failed for ${targetProject}:`, err.message);
  process.exit(1);
} finally {
  // Always restore original project.json
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, projectJsonPath);
    console.log(`✓ Restored .vercel/project.json to default (looplic-js-main)`);
  }
}
