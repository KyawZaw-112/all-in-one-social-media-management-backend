import { supabaseAdmin } from "../supabaseAdmin.js";

/**
 * Seed default automation flows based on business type
 */
export async function seedDefaultFlows(merchantId: string, businessType: string) {
    try {
        console.log(`🌱 Seeding default flows for merchant ${merchantId} (${businessType})`);

        if (businessType === 'cargo') {
            // Check if any cargo flows exist
            const { count } = await supabaseAdmin
                .from("automation_flows")
                .select("*", { count: "exact", head: true })
                .eq("merchant_id", merchantId);

            if (count && count > 0) {
                console.log(`ℹ️ Merchant ${merchantId} already has flows, skipping seed.`);
                return;
            }

            await supabaseAdmin.from("automation_flows").insert({
                merchant_id: merchantId,
                name: "Cargo Booking Flow",
                business_type: "cargo",
                trigger_keyword: "cargo, booking, ship",
                description: "Default flow for cargo booking and shipment tracking.",
                is_active: true,
                metadata: {
                    steps: {},
                    welcome_message: null,
                    completion_message: null
                }
            });
        } else {
            // Check if any shop flows exist
            const { count } = await supabaseAdmin
                .from("automation_flows")
                .select("*", { count: "exact", head: true })
                .eq("merchant_id", merchantId);

            if (count && count > 0) {
                console.log(`ℹ️ Merchant ${merchantId} already has flows, skipping seed.`);
                return;
            }

            // Default to online_shop
            await supabaseAdmin.from("automation_flows").insert({
                merchant_id: merchantId,
                name: "Product Order Flow",
                business_type: "online_shop",
                trigger_keyword: "order, buy, price",
                description: "Default flow for product inquiries and order collection.",
                is_active: true,
                metadata: {
                    steps: {},
                    welcome_message: null,
                    completion_message: null
                }
            });
        }

        console.log(`✅ Default flows seeded successfully for ${merchantId}`);
    } catch (error) {
        console.error("❌ Error seeding default flows:", error);
        // Don't throw - we don't want to break the whole registration if seeding fails
    }
}
