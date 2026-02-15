import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
const router = Router();
router.post("/webhook", async (req, res) => {
    const event = req.body;
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        await supabaseAdmin.from("subscriptions").insert({
            user_id: userId,
            country: "TH",
            status: "active",
            payment_provider: "stripe",
            reference: session.id,
            expires_at: new Date(Date.now() + 30 * 86400000),
        });
    }
    res.json({ received: true });
});
export default router;
