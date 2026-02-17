import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email: string) {
    console.log(`🔍 Checking for user: ${email}...`);

    // Check Auth Users (Requires Service Role Key)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("❌ Error listing users:", error.message);
        return;
    }

    const user = users.find(u => u.email === email);

    if (user) {
        console.log("✅ User found in Supabase Auth!");
        console.log("User ID:", user.id);

        // Also check if they exist in the 'merchants' table
        const { data: merchant, error: merchantError } = await supabase
            .from('merchants')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (merchantError) {
            console.error("❌ Error checking merchants table:", merchantError.message);
        } else if (merchant) {
            console.log("✅ Merchant record found!");
            console.log("Subscription Status:", merchant.subscription_status);
        } else {
            console.log("⚠️ No merchant record found for this user ID.");
        }
    } else {
        console.log("❌ User NOT found in Supabase Auth.");
    }
}

const targetEmail = "holeokyawzawwin@gmail.com";
checkUser(targetEmail).catch(err => console.error(err));
