const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zhoverulwcybtgrezaob.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupStorage() {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('List buckets error:', listErr);
    return;
  }

  const exists = buckets.some(b => b.name === 'looplic-assets');
  if (exists) {
    console.log('Bucket "looplic-assets" already exists in Supabase Storage.');
  } else {
    console.log('Creating bucket "looplic-assets"...');
    const { data, error } = await supabase.storage.createBucket('looplic-assets', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
    if (error) {
      console.error('Create bucket error:', error);
    } else {
      console.log('Bucket "looplic-assets" created successfully:', data);
    }
  }

  // Verify
  const { data: finalBuckets } = await supabase.storage.listBuckets();
  console.log('Active Supabase Buckets:', finalBuckets.map(b => ({ name: b.name, public: b.public })));
}

setupStorage().catch(console.error);

