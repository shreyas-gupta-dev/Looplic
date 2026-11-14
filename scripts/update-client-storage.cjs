const fs = require('fs');

const files = [
  'apps/admin/src/lib/data-client/client.ts',
  'apps/operator/src/lib/data-client/client.ts',
  'apps/technician/src/lib/data-client/client.ts',
  'apps/user/src/lib/data-client/client.ts'
];

const replacement = `getPublicUrl(path: string) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zhoverulwcybtgrezaob.supabase.co";
          const subPath = bucket === "looplic-assets" ? path : (bucket + "/" + path);
          return { data: { publicUrl: supabaseUrl + "/storage/v1/object/public/looplic-assets/" + subPath } };
        },`;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(
    /getPublicUrl\(path: string\) \{[\s\S]*?return \{ data: \{ publicUrl: `https:\/\/\$\{s3Bucket\}[\s\S]*?\},/g,
    replacement
  );
  content = content.replace(
    /Auth runs on Supabase; the application data still lives on Amazon RDS/g,
    'Auth and application data run on Supabase (PostgreSQL + Auth + Storage)'
  );
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated:', f);
});

