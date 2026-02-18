import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

// ─── Helper: Get merchant profile ─────────────────────────────────
async function getMerchant(userId: string) {
    const { data } = await supabaseAdmin
        .from("merchants")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
    return data;
}

/**
 * GET /api/merchants/me
 * Dashboard stats + recent activities
 */
router.get("/me", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const merchant = await getMerchant(userId);

        if (!merchant) {
            return res.status(404).json({ error: "Merchant profile not found" });
        }

        const { count: activeFlowsCount } = await supabaseAdmin
            .from("automation_flows")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", userId)
            .eq("is_active", true);

        const { data: conversations } = await supabaseAdmin
            .from("conversations")
            .select("status")
            .eq("merchant_id", userId);

        const totalConversations = conversations?.length || 0;
        const completedConversations = conversations?.filter(c => c.status === 'completed').length || 0;

        const { count: ordersCount } = await supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", userId);

        const { count: shipmentsCount } = await supabaseAdmin
            .from("shipments")
            .select("*", { count: "exact", head: true })
            .eq("merchant_id", userId);

        const { data: recentMessages } = await supabaseAdmin
            .from("messages")
            .select("id, sender_name, body, status, created_at, channel")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);

        res.json({
            success: true,
            data: {
                ...merchant,
                active_flows: activeFlowsCount || 0,
                conversations: { completed: completedConversations, total: totalConversations },
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

// ─── FLOW CRUD (moved here to bypass requireActiveSubscription) ───

/**
 * GET /api/merchants/flows
 */
router.get("/flows", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .select("*")
            .eq("merchant_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ success: true, data, count: data?.length || 0 });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/merchants/flows
 * Auto-fills business_type from merchant profile
 */
router.post("/flows", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { name, trigger_keyword, description } = req.body;

        // Auto-fill business_type from merchant profile
        const merchant = await getMerchant(userId);
        const businessType = merchant?.business_type || "online_shop";

        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .insert({
                merchant_id: userId,
                name,
                business_type: businessType,
                trigger_keyword,
                description,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/merchants/flows/:id
 */
router.put("/flows/:id", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, trigger_keyword, description, is_active } = req.body;

        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .update({ name, trigger_keyword, description, is_active })
            .eq("id", id)
            .eq("merchant_id", userId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/merchants/flows/:id
 */
router.delete("/flows/:id", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from("automation_flows")
            .delete()
            .eq("id", id)
            .eq("merchant_id", userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/merchants/flows/:id/toggle
 */
router.patch("/flows/:id/toggle", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { is_active } = req.body;

        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .update({ is_active: !!is_active })
            .eq("id", id)
            .eq("merchant_id", userId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Orders & Shipments ──────────────────────────────────────────

router.get("/orders", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("merchant_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/shipments", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { data, error } = await supabaseAdmin
            .from("shipments")
            .select("*")
            .eq("merchant_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
