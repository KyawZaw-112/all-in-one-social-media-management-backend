
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectAdmins() {
    const adminIds = ['3254d8f7-c387-48d0-9708-7b5366c66159', '40b42079-6636-4b09-b9c9-db9ec0d40b75'];
    console.log(`🔍 Inspecting Admins: ${adminIds}`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("❌ Error listing users:", error);
        return;
    }

    adminIds.forEach(id => {
        const user = users.find(u => u.id === id);
        if (user) {
            console.log(`- ID: ${id}, Email: ${user.email}`);
        } else {
            console.log(`- ID: ${id}, Email: NOT FOUND IN AUTH`);
        }
    });
}

inspectAdmins();
