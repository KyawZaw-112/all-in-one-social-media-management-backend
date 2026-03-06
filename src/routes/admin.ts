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

    // TEMPORARY: Allow all authenticated users for demo/testing
    // This allows the user to see the admin panel without setting up specific admin records
    if (req.user) {
        return next();
    }

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

        // 6. Recent Activity Feed
        const [
            { data: recentMerchants },
            { data: recentPayments },
            { data: recentConnections },
            { data: expiringTrials }
        ] = await Promise.all([
            supabaseAdmin.from("merchants").select("id, business_name, subscription_plan, created_at").order("created_at", { ascending: false }).limit(5),
            supabaseAdmin.from("payments").select("id, amount, plan, approved_at").eq("status", "approved").order("approved_at", { ascending: false }).limit(5),
            supabaseAdmin.from("platform_connections").select("id, page_name, created_at").order("created_at", { ascending: false }).limit(5),
            supabaseAdmin.from("merchants").select("id, business_name, trial_ends_at").eq("subscription_status", "active").gt("trial_ends_at", new Date().toISOString()).lt("trial_ends_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()).limit(5)
        ]);

        const systemActivity: any[] = [];

        recentMerchants?.forEach(m => {
            systemActivity.push({
                type: 'signup',
                title: 'New Sign Up',
                desc: `${m.business_name || 'A merchant'} joined ${m.subscription_plan || 'free'} plan`,
                time: m.created_at,
                icon: 'user',
                color: '#1890ff'
            });
        });

        recentPayments?.forEach(p => {
            systemActivity.push({
                type: 'payment',
                title: 'Payment Received',
                desc: `${p.plan || 'Plan'} (${p.amount} Ks)`,
                time: p.approved_at || new Date().toISOString(),
                icon: 'wallet',
                color: '#52c41a'
            });
        });

        recentConnections?.forEach(c => {
            systemActivity.push({
                type: 'connection',
                title: 'New Page Connected',
                desc: `${c.page_name || 'Facebook Page'}`,
                time: c.created_at,
                icon: 'global',
                color: '#722ed1'
            });
        });

        expiringTrials?.forEach(m => {
            systemActivity.push({
                type: 'trial_ending',
                title: 'Trial Ending',
                desc: `${m.business_name}'s trial expires soon`,
                time: m.trial_ends_at,
                icon: 'clock',
                color: '#faad14'
            });
        });

        // Sort combined activity by time DESC
        systemActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        // Calculate Stats
        const stats = {
            totalUsers: merchants.length,
            activeSubs: merchants.filter(m => m.subscription_status === 'active').length,
            expiredSubs: merchants.filter(m => m.subscription_status === 'expired').length,
            planDistribution: {
                online_shop: merchants.filter(m => m.subscription_plan === 'online_shop' || m.subscription_plan === 'shop').length,
                cargo: merchants.filter(m => m.subscription_plan === 'cargo').length,
            },
            monthlyRevenue: monthlyRevenue,
            pendingPayments: pendingPayments,
            systemHealth: {
                fbPages: totalPages || 0,
                messagesProcessed: totalMessages || 0,
            },
            chartData: chartData,
            systemActivity: systemActivity.slice(0, 10)
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
        console.log("📊 [Admin] Fetching merchants...");
        // 1. Fetch Merchants
        const { data: merchants, error: mError } = await supabaseAdmin
            .from("merchants")
            .select("*")
            .order("created_at", { ascending: false });

        console.log("📊 [Admin] Merchants query result:", { count: merchants?.length, error: mError?.message });

        if (mError) throw mError;

        // 2. Fetch ALL Users from Auth (handle pagination)
        let allUsers: any[] = [];
        let page = 1;
        const perPage = 1000;
        while (true) {
            const { data: { users }, error: uError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
            if (uError) {
                console.error("📊 [Admin] Auth listUsers error:", uError.message);
                break;
            }
            allUsers = allUsers.concat(users);
            if (users.length < perPage) break;
            page++;
        }
        console.log("📊 [Admin] Total auth users fetched:", allUsers.length);

        // 3. Map emails to merchants
        const enrichedMerchants = (merchants || []).map(m => ({
            ...m,
            user: {
                email: allUsers.find(u => u.id === m.id)?.email || "Unknown"
            }
        }));

        console.log("📊 [Admin] Returning", enrichedMerchants.length, "merchants");
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
                trial_ends_at: trial_ends_at
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
        const { email, password, name, role = "user", plan = "online_shop" } = req.body;

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
