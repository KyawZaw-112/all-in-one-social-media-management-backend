import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
async function cleanupUsers() {
    const { supabaseAdmin } = await import("../supabaseAdmin.js");
    const adminEmail = "admin@autoreply.biz";
    console.log("🧹 Cleaning up users... Keeping only:", adminEmail);
    // 1. List all users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
        console.error("❌ Error listing users:", listError.message);
        return;
    }
    const usersToDelete = users.users.filter(u => u.email !== adminEmail);
    console.log(`Found ${usersToDelete.length} users to delete.`);
    for (const user of usersToDelete) {
        console.log(`Deleting user: ${user.email} (${user.id})...`);
        // Delete from auth (this will cascade if FKs are set to cascade, 
        // but we might need to manual clean some tables if not)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error(`❌ Error deleting ${user.email}:`, deleteError.message);
        }
        else {
            console.log(`✅ Deleted ${user.email}`);
        }
    }
    console.log("✨ User cleanup finished.");
}
cleanupUsers().catch(err => console.error(err));
