import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function simulateCargoFlow() {
    try {
        const { runConversationEngine, CARGO_FLOW } = await import("../services/conversationEngine.js");

        // Mock conversation object
        const conversation = {
            id: "test-conv-123",
            temp_data: {},
            merchant_id: "test-merchant",
            page_id: "test-page"
        };

        const flow = {
            id: "cargo-flow-id",
            merchant_id: "test-merchant",
            business_type: "cargo"
        };

        console.log("--- Step 1: weight ---");
        let result = await runConversationEngine(conversation, "10kg", flow, [], true);
        console.log("Reply:", result.reply);
        console.log("Complete:", result.order_complete);
        conversation.temp_data = result.temp_data;

        console.log("\n--- Step 2: item_photos (1 photo) ---");
        const photo1 = [{ type: 'image', payload: { url: 'http://example.com/p1.jpg' } }];
        result = await runConversationEngine(conversation, "", flow, photo1, true);
        console.log("Reply:", result.reply);
        console.log("Complete:", result.order_complete);
        conversation.temp_data = result.temp_data;

        console.log("\n--- Step 3: item_photos (4 photos) ---");
        const photos4 = [
            { type: 'image', payload: { url: 'http://example.com/p2.jpg' } },
            { type: 'image', payload: { url: 'http://example.com/p3.jpg' } },
            { type: 'image', payload: { url: 'http://example.com/p4.jpg' } },
            { type: 'image', payload: { url: 'http://example.com/p5.jpg' } }
        ];
        result = await runConversationEngine(conversation, "", flow, photos4, true);
        console.log("Reply:", result.reply);
        console.log("Complete:", result.order_complete);
        conversation.temp_data = result.temp_data;

        console.log("\n--- Final Temp Data ---");
        console.log(JSON.stringify(result.temp_data, null, 2));

    } catch (e) {
        console.error("Simulation error:", e);
    }
}

simulateCargoFlow();
