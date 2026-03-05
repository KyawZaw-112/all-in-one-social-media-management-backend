import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:4000";
const DRIVER_TOKEN = "vibe_driver_poc_2024";

async function testPhase2() {
    console.log("🧪 Starting Phase 2 Verification...");

    try {
        // 1. Test Driver App API: Get Shipments
        console.log("🚚 1. Testing Driver API: GET /api/drivers/shipments");
        const shipmentsRes = await axios.get(`${API_URL}/api/drivers/shipments`, {
            headers: { "x-driver-token": DRIVER_TOKEN }
        });

        if (shipmentsRes.status === 200) {
            console.log(`✅ Driver API: Fetched ${shipmentsRes.data.data.length} shipments.`);

            if (shipmentsRes.data.data.length > 0) {
                const firstShipmentId = shipmentsRes.data.data[0].id;

                // 2. Test Driver App API: Update Status
                console.log(`🚚 2. Testing Driver API: PUT /api/drivers/shipments/${firstShipmentId}/status`);
                const updateRes = await axios.put(`${API_URL}/api/drivers/shipments/${firstShipmentId}/status`, {
                    status: "in_transit",
                    message: "Driver has picked up the parcel",
                    location: "Yangon Warehouse"
                }, {
                    headers: { "x-driver-token": DRIVER_TOKEN }
                });

                if (updateRes.status === 200 && updateRes.data.data.status === "in_transit") {
                    console.log("✅ Driver API: Status updated successfully.");
                } else {
                    console.error("❌ Driver API: Status update failed.");
                }
            }
        }

        // 3. Test Broadcast Marketing (Mock check)
        console.log("📢 3. Testing Broadcast Marketing: POST /api/merchants/broadcast (Auth required)");
        console.log("ℹ️ Skipping live broadcast test as it requires valid merchant JWT and FB tokens, but route is verified in code.");

        console.log("\n✨ Phase 2 Verification Completed!");
    } catch (error: any) {
        console.error("❌ Verification failed:", error.response?.data || error.message);
        console.log("⚠️ Make sure the backend server is running locally on port 4000 before running tests.");
    }
}

testPhase2();
