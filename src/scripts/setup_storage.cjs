const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("🚀 Setting up Supabase Storage for Product Images...");

    // 1. Create bucket
    const bucketName = 'product-images';
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error("❌ Error listing buckets:", listError);
        return;
    }

    const exists = buckets.some(b => b.name === bucketName);
    if (!exists) {
        console.log(`📦 Creating bucket: ${bucketName}...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true, // Make it public so FB can see images
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        if (createError) {
            console.error("❌ Failed to create bucket:", createError);
            return;
        }
        console.log("✅ Bucket created successfully.");
    } else {
        console.log("✅ Bucket already exists.");
    }

    // 2. Note on Policies
    console.log("\n⚠️  IMPORTANT: Manual Policy Check Needed in Supabase Dashboard:");
    console.log("1. Go to Storage -> product-images -> Policies");
    console.log("2. Ensure 'Public' read access is enabled (SELECT).");
    console.log("3. Ensure 'Authenticated' users can 'INSERT' objects into their own folder ({userId}/*).");
    console.log("   Policy Template: (role() = 'authenticated'::text) AND (bucket_id = 'product-images'::text)");
}

run().catch(console.error);
