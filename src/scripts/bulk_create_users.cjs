
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function bulkCreate() {
    const accounts = [];
    console.log('🚀 Starting bulk user creation...');

    for (let i = 1; i <= 10; i++) {
        const email = `testuser${i}@autoreply.biz`;
        const password = `AutoReply#${Math.floor(1000 + Math.random() * 9000)}`;
        const name = `Test Merchant ${i}`;

        console.log(`Processing ${email}...`);

        // 1. Create in Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (authError) {
            console.error(`❌ Error creating auth for ${email}:`, authError.message);
            continue;
        }

        const userId = authData.user.id;

        // 2. Create Profile
        const { error: profError } = await supabase.from('profiles').upsert({
            id: userId,
            role: 'user',
            is_active: true
        });

        if (profError) {
            console.error(`❌ Error creating profile for ${email}:`, profError.message);
        }

        // 3. Create Merchant
        const { error: merchError } = await supabase.from('merchants').upsert({
            id: userId,
            page_id: `pending_${userId.substring(0, 8)}`,
            business_name: name,
            business_type: 'shop',
            subscription_plan: 'shop',
            subscription_status: 'active',
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        if (merchError) {
            console.error(`❌ Error creating merchant for ${email}:`, merchError.message);
        }

        accounts.push({ email, password, name });
    }

    // Generate MD file
    let mdContent = '# Generated User Accounts\n\n| Name | Email | Password |\n| :--- | :--- | :--- |\n';
    accounts.forEach(acc => {
        mdContent += `| ${acc.name} | ${acc.email} | \`${acc.password}\` |\n`;
    });

    const filePath = path.resolve(__dirname, '../../../USER_ACCOUNTS.md');
    fs.writeFileSync(filePath, mdContent);
    console.log(`\n✅ Successfully created ${accounts.length} users.`);
    console.log(`📄 Credentials saved to: ${filePath}`);
}

bulkCreate();
