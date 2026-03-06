
import { detectLanguage, runConversationEngine, ONLINE_SHOP_FLOW } from './src/services/conversationEngine.js';

async function testRehydration() {
    console.log("🧪 Testing Conversation Engine Re-hydration...");

    // 1. Mock a flow loaded from DB (simplified, no validation/transform)
    const mockDbFlow = {
        name: "🛍️ Test Flow",
        business_type: "online_shop",
        steps: [
            { field: "order_source", question: "How did you find us?" }
        ]
    };

    // 2. Mock conversation
    const mockConversation = {
        id: "test-conv",
        merchant_id: "test-merchant",
        temp_data: { _lang: "en" }
    };

    // 3. Run engine with the DB flow
    const result_link = await runConversationEngine(mockConversation, "link", mockDbFlow, [], false);
    console.log("Input 'link' (transform test):", result_link.temp_data.order_source === "Link" ? "✅ Passed" : "❌ Failed", `(Got: ${result_link.temp_data.order_source})`);

    const result_num = await runConversationEngine(mockConversation, "1", mockDbFlow, [], false);
    console.log("Input '1' (transform test):", result_num.temp_data.order_source === "Live" ? "✅ Passed" : "❌ Failed", `(Got: ${result_num.temp_data.order_source})`);

    console.log("\n🚀 Verification complete");
}

testRehydration().catch(console.error);
