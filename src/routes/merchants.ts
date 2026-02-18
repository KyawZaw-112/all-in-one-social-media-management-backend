import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

/**
 * GET /api/merchants/me
 * Fetch current merchant profile, dashboard stats, and recent activities
 */
router.get("/me", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch Merchant Profile
        const { data: merchant, error: merchantError } = await supabaseAdmin
            .from("merchants")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (merchantError) throw merchantError;
        if (!merchant) {
            return res.status(404).json({ error: "Merchant profile not found" });
        }

        // 2. Active Flows count
        const { count: activeFlowsCount } = await supabaseAdmin
            .from("automation_flows")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", userId)
            .eq("is_active", true);

        // 3. Conversations stats
        const { data: conversations } = await supabaseAdmin
            .from("conversations")
            .select("status")
            .eq("merchant_id", userId);

        const totalConversations = conversations?.length || 0;
        const completedConversations = conversations?.filter(c => c.status === 'completed').length || 0;

        // 4. Orders count
        const { count: ordersCount } = await supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", userId);

        // 5. Shipments count
        const { count: shipmentsCount } = await supabaseAdmin
            .from("shipments")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", userId);

        // 6. Recent activities (last 10 bot replies)
        const { data: recentMessages } = await supabaseAdmin
            .from("messages")
            .select("id, sender_name, body, status, created_at, channel")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

        // 3. Construct Response
        res.json({
            success: true,
            data: {
                ...merchant,
                active_flows: activeFlowsCount || 0,
                conversations: {
                    completed: completedConversations,
                    total: totalConversations
                },
                orders_count: ordersCount || 0,
                shipments_count: shipmentsCount || 0,
                recent_activities: recentMessages || []
            }
        });

    } catch (error: any) {
        console.error("Fetch merchant/me error:", error.message);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

/**
 * PATCH /api/merchants/toggle-auto-reply
 * Toggle auto-reply on/off for the merchant's flows
 */
router.patch("/toggle-auto-reply", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { is_active } = req.body;

        const { error } = await supabaseAdmin
            .from("automation_flows")
            .update({ is_active: !!is_active })
            .eq("merchant_id", userId);

        if (error) throw error;

        res.json({ success: true, is_active: !!is_active });
    } catch (error: any) {
        console.error("Toggle auto-reply error:", error.message);
        res.status(500).json({ error: "Failed to toggle auto-reply" });
    }
});

export default router;
