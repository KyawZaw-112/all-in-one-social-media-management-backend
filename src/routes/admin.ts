import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Middleware to check if user is admin (You can enhance this later)
// For now, we assume the first user or specific emails are admins
const requireAdmin = async (req: any, res: any, next: any) => {
    // 1. Check hardcoded admin email
    if (req.user?.email === "admin@autoreply.biz" || req.user?.email?.includes("admin")) {
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

    // TEMPORARY: Allow all for demo compatibility if strictly needed, otherwise keep 403
    // For now, let's assume the user IS an admin if they hit this route in this context
    // or we can add their specific ID manually. 
    // Better strategy: Add a fallback to allow the current user if the table is empty?
    // Let's just return 403 but log it clearly.
    console.log("Admin Access Denied for:", req.user?.email);
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

        // 4. Payment Stats (Pending & Revenue)
        const { data: payments } = await supabaseAdmin
            .from("payments")
            .select("amount, status, created_at");

        const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;

        const currentMonth = new Date().getMonth();
        const monthlyRevenue = payments
            ?.filter(p => p.status === 'approved' && new Date(p.created_at).getMonth() === currentMonth)
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

        // 5. Chart Data (Last 7 Days User Growth)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const joyDateString = d.toISOString().split('T')[0];

            const count = merchants.filter(m => m.created_at.startsWith(joyDateString)).length;
            chartData.unshift({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                users: count
            });
        }

        // Calculate Stats
        const stats = {
            totalUsers: merchants.length,
            activeSubs: merchants.filter(m => m.subscription_status === 'active').length,
            expiredSubs: merchants.filter(m => m.subscription_status === 'expired').length,
            planDistribution: {
                shop: merchants.filter(m => m.subscription_plan === 'shop').length,
                cargo: merchants.filter(m => m.subscription_plan === 'cargo').length,
            },
            monthlyRevenue: monthlyRevenue,
            pendingPayments: pendingPayments,
            systemHealth: {
                fbPages: totalPages || 0,
                messagesProcessed: totalMessages || 0,
            },
            chartData: chartData
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

/**
 * Create New Merchant (User)
 * POST /api/admin/merchants
 */
router.post("/merchants", async (req, res) => {
    try {
        const { email, password, name, role = "user", plan = "shop" } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: "Name, email and password are required" });
        }

        /* 1️⃣ Create User in Supabase Auth */
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, role: role }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        /* 2️⃣ Add to merchants table */
        const { error: merchantError } = await supabaseAdmin.from("merchants").insert({
            id: authData.user.id,
            business_name: `${name}'s Business`,
            subscription_plan: plan,
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            subscription_status: 'active'
        });

        if (merchantError) {
            // Note: In a real app, delete the auth user if merchant creation fails
            console.error("Merchant profile creation failed:", merchantError);
            return res.status(500).json({ error: "User created but profile setup failed: " + merchantError.message });
        }

        res.status(201).json({
            success: true,
            user: authData.user,
            message: "User created successfully! 🚀"
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
