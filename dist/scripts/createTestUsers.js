import "dotenv/config";
import { supabaseAdmin } from "../supabaseAdmin.js";
async function run() {
    const users = [
        {
            email: "test1@example.com",
            password: "Password123!",
        },
        {
            email: "test2@example.com",
            password: "Password123!",
        },
    ];
    for (const user of users) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true, // ✅ IMPORTANT
        });
        console.log("CREATED:", data?.user?.email, error?.message);
    }
}
run();
