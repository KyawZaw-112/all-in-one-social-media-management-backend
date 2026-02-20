import { supabaseAdmin } from '../supabaseAdmin.js';
/**
 * Seed default automation flows for Online Shop and Cargo businesses
 * Run this script once to create pre-configured flows
 */
const DEFAULT_FLOWS = {
    online_shop: [
        {
            name: '🛍️ Product Order Flow',
            trigger_keyword: 'order',
            business_type: 'online_shop',
            description: 'Helps customers place product orders',
            is_active: false, // User will need to activate and assign to their page
        },
        {
            name: '💰 Price Inquiry Flow',
            trigger_keyword: 'price',
            business_type: 'online_shop',
            description: 'Handles product pricing questions',
            is_active: false,
        },
        {
            name: '🚚 Delivery Info Flow',
            trigger_keyword: 'delivery',
            business_type: 'online_shop',
            description: 'Provides delivery and shipping information',
            is_active: false,
        },
        {
            name: '💳 Payment Methods Flow',
            trigger_keyword: 'payment',
            business_type: 'online_shop',
            description: 'Explains available payment options',
            is_active: false,
        },
    ],
    cargo: [
        {
            name: '📦 New Shipment Flow',
            trigger_keyword: 'ship',
            business_type: 'cargo',
            description: 'Collects information for new shipments',
            is_active: false,
        },
        {
            name: '🔍 Package Tracking Flow',
            trigger_keyword: 'track',
            business_type: 'cargo',
            description: 'Helps customers track their packages',
            is_active: false,
        },
        {
            name: '💵 Shipping Rates Flow',
            trigger_keyword: 'rate',
            business_type: 'cargo',
            description: 'Provides shipping rate information',
            is_active: false,
        },
        {
            name: '🗺️ Coverage Areas Flow',
            trigger_keyword: 'areas',
            business_type: 'cargo',
            description: 'Shows delivery coverage locations',
            is_active: false,
        },
    ],
};
async function seedDefaultFlows(merchantId) {
    console.log(`🌱 Seeding default automation flows for merchant: ${merchantId}`);
    const allFlows = [...DEFAULT_FLOWS.online_shop, ...DEFAULT_FLOWS.cargo];
    for (const flowTemplate of allFlows) {
        const { data, error } = await supabaseAdmin
            .from('automation_flows')
            .insert({
            merchant_id: merchantId,
            name: flowTemplate.name,
            trigger_keyword: flowTemplate.trigger_keyword,
            business_type: flowTemplate.business_type,
            description: flowTemplate.description,
            is_active: flowTemplate.is_active,
            ai_prompt: null, // Will use default prompts from conversationEngine
            created_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error) {
            console.error(`❌ Error creating flow "${flowTemplate.name}":`, error.message);
        }
        else {
            console.log(`✅ Created flow: ${flowTemplate.name}`);
        }
    }
    console.log('✨ Seeding complete!');
}
// Export for use in other scripts
export { seedDefaultFlows, DEFAULT_FLOWS };
// Allow running directly from command line
// Usage: node seed_default_flows.js <merchant_id>
if (process.argv[2]) {
    const merchantId = process.argv[2];
    seedDefaultFlows(merchantId)
        .then(() => {
        console.log('🎉 Done!');
        process.exit(0);
    })
        .catch((err) => {
        console.error('💥 Error:', err);
        process.exit(1);
    });
}
