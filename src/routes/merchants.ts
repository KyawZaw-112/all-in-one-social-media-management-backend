import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

/**
 * GET /api/merchants/me
 * Fetch current merchant profile and dashboard stats
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

        // 2. Calculate Stats
        // Active Flows count
        const { count: activeFlowsCount } = await supabaseAdmin
            .from("automation_flows")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", userId)
            .eq("is_active", true);

        // Conversations stats
        const { data: conversations } = await supabaseAdmin
            .from("conversations")
            .select("status")
            .eq("merchant_id", userId);

        const totalConversations = conversations?.length || 0;
        const completedConversations = conversations?.filter(c => c.status === 'completed').length || 0;

        // 3. Construct Response
        res.json({
            success: true,
            data: {
                ...merchant,
                active_flows: activeFlowsCount || 0,
                conversations: {
                    completed: completedConversations,
                    total: totalConversations
                }
            }
        });

    } catch (error: any) {
        console.error("Fetch merchant/me error:", error.message);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

export default router;
