
import axios from "axios";

const API_URL = "http://localhost:4000";

async function simulateFullFlow() {
    const email = `test_user_${Date.now()}@example.com`;
    const password = "password123";
    const name = "Test User";

    console.log(`🚀 Simulating registration for ${email}...`);
    try {
        const regRes = await axios.post(`${API_URL}/api/oauth/register`, {
            name,
            email,
            password,
            business_type: "online_shop"
        });

        const { token, user } = regRes.data;
        console.log(`✅ Registration successful. User ID: ${user.id}`);
        console.log(`🔑 Token acquired.`);

        console.log(`\n📡 Fetching stats (/api/merchants/me)...`);
        const statsRes = await axios.get(`${API_URL}/api/merchants/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Stats fetched:`, JSON.stringify(statsRes.data.data, null, 2));
    } catch (err: any) {
        console.error(`❌ Flow failed:`, err.response?.status, err.response?.data || err.message);
    }
}

simulateFullFlow();
