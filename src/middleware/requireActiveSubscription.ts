// src/middleware/requireActiveSubscription.ts
import { supabaseAdmin } from "../supabaseAdmin.js";

export const requireActiveSubscription = async (req: any, res: any, next: any) => {
    const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", req.user.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .single();

    if (!data) {
        return res.status(403).json({ error: "Active subscription required" });
    }

    if (data.status !== "active") {
        return res.status(403).json({ error: "Subscription not active" });
    }

    if (new Date(data.expires_at) < new Date()) {
        return res.status(403).json({ error: "Subscription expired" });
    }

    req.subscription = data;
    next();
};
