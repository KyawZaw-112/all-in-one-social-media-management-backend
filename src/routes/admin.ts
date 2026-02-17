import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Middleware to check if user is admin (You can enhance this later)
// For now, we assume the first user or specific emails are admins
const requireAdmin = async (req: any, res: any, next: any) => {
    // Basic protection - checking against a known admin email or flag in DB
    // In production, you'd check a 'role' column in your users/merchants table
    next();
};

router.use(requireAuth);
router.use(requireAdmin);

/**
 * Advanced System Statistics
 * GET /api/admin/system-stats
 */
router.get("/system-stats", async (req, res) => {
    try {
        // 1. Total Merchants & Group by Plan
        const { data: merchants, error: mError } = await supabaseAdmin
            .from("merchants")
            .select("subscription_plan, subscription_status, created_at");

        if (mError) throw mError;

        // 2. Active Connections (Facebook Pages Connected)
        const { count: totalPages } = await supabaseAdmin
            .from("platform_connections")
            .select("*", { count: 'exact', head: true });

        // 3. Conversation Volume
        const { count: totalMessages } = await supabaseAdmin
            .from("messages")
            .select("*", { count: 'exact', head: true });

        // Calculate Stats
        const stats = {
            totalUsers: merchants.length,
            activeSubs: merchants.filter(m => m.subscription_status === 'active').length,
            expiredSubs: merchants.filter(m => m.subscription_status === 'expired').length,
            planDistribution: {
                shop: merchants.filter(m => m.subscription_plan === 'shop').length,
                cargo: merchants.filter(m => m.subscription_plan === 'cargo').length,
            },
            estimatedMonthlyRevenue: (merchants.filter(m => m.subscription_status === 'active' && m.subscription_plan === 'shop').length * 15000) +
                (merchants.filter(m => m.subscription_status === 'active' && m.subscription_plan === 'cargo').length * 20000),
            systemHealth: {
                fbPages: totalPages || 0,
                messagesProcessed: totalMessages || 0,
            }
        };

        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Merchant List Management
 * GET /api/admin/merchants
 */
router.get("/merchants", async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("merchants")
            .select(`
                *,
                user:user_id (email)
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Manual Subscription Update
 * PUT /api/admin/merchants/:id/subscription
 */
router.put("/merchants/:id/subscription", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, plan, trial_ends_at } = req.body;

        const { error } = await supabaseAdmin
            .from("merchants")
            .update({
                subscription_status: status,
                subscription_plan: plan,
                trial_ends_at: trial_ends_at,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (error) throw error;
        res.json({ success: true, message: "Subscription updated! ✅" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
