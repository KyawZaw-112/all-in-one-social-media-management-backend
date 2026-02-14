import {supabaseAdmin} from "../supabaseAdmin.js";
import {Router} from "express";

const router = Router();
router.get("/me", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data } = await supabaseAdmin.auth.getUser(token);
    if (!data?.user) return res.status(401).json({ error: "Invalid token" });

    const { data: subscription } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

    if (!subscription) {
        return res.json({ status: "none" });
    }

    const isExpired =
        subscription.expires_at &&
        new Date(subscription.expires_at) < new Date();

    if (isExpired) {
        return res.json({ status: "expired" });
    }

    res.json(subscription);
});

export default router;