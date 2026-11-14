const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zhoverulwcybtgrezaob.supabase.co';
const ANON_KEY = 'sb_publishable_Ti25FvBBGrd9PbaSFdEnog_MAQ506Mo';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const CREDENTIALS = [
  { role: 'Admin', expectedRole: 'admin', email: 'admin@looplic.com', pass: 'Admin123!', url: 'https://looplic-admin-mu.vercel.app/api/auth/check-role' },
  { role: 'Operator', expectedRole: 'operation', email: 'operator@looplic.com', pass: 'Operator123!', url: 'https://looplic-operator-tan.vercel.app/api/auth/check-role' },
  { role: 'Technician', expectedRole: 'technician', email: 'technician@looplic.com', pass: 'Technician123!', url: 'https://looplic-technician-seven.vercel.app/api/auth/check-role' },
];

async function verifyAuth() {
  console.log('=== Live Auth & Role Verification Post-Migration ===\n');

  for (const cred of CREDENTIALS) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cred.email,
      password: cred.pass
    });

    if (error || !data?.session) {
      console.error(`✗ Login failed for ${cred.role} (${cred.email}):`, error?.message);
      continue;
    }

    const token = data.session.access_token;
    console.log(`✓ Supabase sign-in OK for ${cred.role} (${cred.email})`);

    const res = await fetch(cred.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: cred.expectedRole })
    });

    const body = await res.json().catch(() => null);
    console.log(`  Live Portal Check-Role [${res.status}]:`, body);
  }
}

verifyAuth().catch(console.error);
