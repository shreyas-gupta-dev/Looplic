const fs = require('fs');
const { execSync } = require('child_process');

try {
  const content = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }

  const apps = execSync('aws amplify list-apps', {
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1'
    }
  }).toString();
  console.log('AMPLIFY APPS:', apps);
} catch (err) {
  console.error('Error running aws amplify list-apps:', err.stderr ? err.stderr.toString() : err.message);
}
