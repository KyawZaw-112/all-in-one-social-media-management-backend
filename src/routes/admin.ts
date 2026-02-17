import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Middleware to check if user is admin (You can enhance this later)
// For now, we assume the first user or specific emails are admins
const requireAdmin = async (req: any, res: any, next: any) => {
    // 1. Check hardcoded admin email
    if (req.user?.email === "admin@autoreply.biz") {
        return next();
    }

    // 2. Check admin_users table
    const { data: adminRecord } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("user_id", req.user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (adminRecord) {
        return next();
    }

    return res.status(403).json({ error: "Access denied. Admin only." });
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
            estimatedMonthlyRevenue: (merchants.filter(m => m.subscription_status === 'active').length * 2000),
            systemHealth: {
                fbPages: totalPages || 0,
                messagesProcessed: totalMessages || 0,
            }
        };

        res.json({ success: true, data: stats });
    } catch (error: any) {
        console.error("Stats Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Merchant List Management
 * GET /api/admin/merchants
 */
router.get("/merchants", async (req, res) => {
    try {
        // 1. Fetch Merchants
        const { data: merchants, error: mError } = await supabaseAdmin
            .from("merchants")
            .select("*")
            .order("created_at", { ascending: false });

        if (mError) throw mError;

        // 2. Fetch Users from Auth to get emails
        const { data: { users }, error: uError } = await supabaseAdmin.auth.admin.listUsers();
        if (uError) throw uError;

        // 3. Map emails to merchants
        const enrichedMerchants = merchants.map(m => ({
            ...m,
            user: {
                email: users.find(u => u.id === m.id)?.email || "Unknown"
            }
        }));

        res.json({ success: true, data: enrichedMerchants });
    } catch (error: any) {
        console.error("Merchants Fetch Error:", error);
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
