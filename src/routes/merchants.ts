import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { sendMessage } from "../services/facebook.services.js";

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

        // Count queries for orders/shipments (using head:true)
        const { count: ordersCount } = await supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("merchant_id", userId);
        const { count: shipmentsCount } = await supabaseAdmin.from("shipments").select("*", { count: "exact", head: true }).eq("merchant_id", userId);

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
 */
router.post("/flows", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { name, trigger_keyword, description } = req.body;
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
        const { error } = await supabaseAdmin.from("automation_flows").delete().eq("id", id).eq("merchant_id", userId);
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
        const { data, error } = await supabaseAdmin.from("automation_flows").update({ is_active: !!is_active }).eq("id", id).eq("merchant_id", userId).select().single();
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Orders & Shipments (With Column Fallback) ──────────────────

router.get("/orders", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        console.log("📦 Fetching orders for user:", userId);

        // Try merchant_id first
        let query = await supabaseAdmin.from("orders").select("*").eq("merchant_id", userId).order("created_at", { ascending: false });

        // Fallback to user_id if merchant_id is missing
        if (query.error && (query.error.code === '42703' || query.error.message.includes('merchant_id'))) {
            console.log("⚠️ Falling back to user_id for orders...");
            query = await supabaseAdmin.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        }

        if (query.error) {
            console.error("❌ Orders query error:", query.error);
            if (query.error.code === '42P01' || query.error.message?.includes('does not exist')) return res.json({ success: true, data: [] });
            throw query.error;
        }
        res.json({ success: true, data: query.data || [] });
    } catch (error: any) {
        console.error("❌ Orders endpoint error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/shipments", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        console.log("🚚 Fetching shipments for user:", userId);

        // Try merchant_id first
        let query = await supabaseAdmin.from("shipments").select("*").eq("merchant_id", userId).order("created_at", { ascending: false });

        // Fallback to user_id
        if (query.error && (query.error.code === '42703' || query.error.message.includes('merchant_id'))) {
            console.log("⚠️ Falling back to user_id for shipments...");
            query = await supabaseAdmin.from("shipments").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        }

        if (query.error) {
            console.error("❌ Shipments query error:", query.error);
            if (query.error.code === '42P01' || query.error.message?.includes('does not exist')) return res.json({ success: true, data: [] });
            throw query.error;
        }
        res.json({ success: true, data: query.data || [] });
    } catch (error: any) {
        console.error("❌ Shipments endpoint error:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/debug-schema", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;

        const { data: order } = await supabaseAdmin.from("orders").select("*").limit(1);
        const { data: shipment } = await supabaseAdmin.from("shipments").select("*").limit(1);

        res.json({
            orders: order?.[0] ? Object.keys(order[0]) : "empty",
            shipments: shipment?.[0] ? Object.keys(shipment[0]) : "empty"
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/merchants/orders/:id/status
 */
router.patch("/orders/:id/status", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) return res.status(400).json({ error: "Status is required" });

        const { data, error } = await supabaseAdmin
            .from("orders")
            .update({ status })
            .eq("id", id)
            .eq("merchant_id", userId)
            .select()
            .single();

        if (error) throw error;

        // 🟢 Automated Facebook Notification for Approved Orders
        if (status === 'approved' && data?.conversation_id) {
            handleStatusApproved(data.conversation_id, userId, "မှာယူမှု အတွက် ကျေးဇူးတင်ပါတယ် 🙏");
        }

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/merchants/shipments/:id/status
 */
router.patch("/shipments/:id/status", requireAuth, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) return res.status(400).json({ error: "Status is required" });

        const { data, error } = await supabaseAdmin
            .from("shipments")
            .update({ status })
            .eq("id", id)
            .eq("merchant_id", userId)
            .select()
            .single();

        if (error) throw error;

        // 🟢 Automated Facebook Notification for Approved Shipments
        if (status === 'approved' && data?.conversation_id) {
            handleStatusApproved(data.conversation_id, userId, "မှာယူမှု အတွက် ကျေးဇူးတင်ပါတယ် 🙏");
        }

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Helper: Send Facebook message when order/shipment status is approved
 */
async function handleStatusApproved(conversationId: string, merchantId: string, message: string) {
    try {
        console.log(`📡 Sending automated approval message for conversation: ${conversationId}`);

        // 1. Get Conversation Data
        const { data: conv } = await supabaseAdmin
            .from("conversations")
            .select("user_psid, page_id")
            .eq("id", conversationId)
            .maybeSingle();

        if (!conv?.user_psid || !conv?.page_id) {
            console.log("⚠️ Could not find PSID or Page ID for automated message.");
            return;
        }

        // 2. Get Page Access Token
        const { data: conn } = await supabaseAdmin
            .from("platform_connections")
            .select("page_access_token")
            .eq("platform_page_id", conv.page_id)
            .maybeSingle();

        if (!conn?.page_access_token) {
            console.log("⚠️ Could not find Page Access Token for automated message.");
            return;
        }

        // 3. Send Message
        await sendMessage(conv.page_id, conn.page_access_token, conv.user_psid, message);
        console.log("✅ Automated approval message sent successfully.");

        // 4. Log to Messages table
        await supabaseAdmin.from("messages").insert({
            user_id: merchantId,
            sender_id: merchantId,
            sender_email: "AI-Assistant",
            sender_name: "Auto-Reply Bot",
            body: message,
            channel: "facebook",
            status: "replied",
            conversation_id: conversationId,
            created_at: new Date().toISOString()
        });

    } catch (err) {
        console.error("❌ Failed to send automated approval message:", err);
    }
}

export default router;
