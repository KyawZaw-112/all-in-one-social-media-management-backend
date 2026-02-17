import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Get all flows for the authenticated user
router.get("/flows", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;

        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .select("*")
            .eq("merchant_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data,
            count: data?.length || 0,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get single flow
router.get("/flows/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .select("*")
            .eq("id", id)
            .eq("merchant_id", userId)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: "Flow not found" });
        }

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create new flow
router.post("/flows", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            name,
            trigger_keyword,
            business_type = "online_shop",
            description,
            ai_prompt,
            is_active = true,
        } = req.body;

        if (!name || !trigger_keyword) {
            return res.status(400).json({
                error: "Name and trigger_keyword are required",
            });
        }

        // Check for duplicate trigger keyword for this merchant
        const { data: existing } = await supabaseAdmin
            .from("automation_flows")
            .select("id")
            .eq("merchant_id", userId)
            .eq("trigger_keyword", trigger_keyword.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            return res.status(400).json({
                error: `Trigger keyword "${trigger_keyword}" already exists. Please use a different keyword.`,
            });
        }

        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .insert([
                {
                    merchant_id: userId,
                    name,
                    trigger_keyword: trigger_keyword.toLowerCase().trim(),
                    business_type,
                    description,
                    ai_prompt: ai_prompt || null,
                    is_active,
                    created_at: new Date().toISOString(),
                },
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: "Automation flow created successfully!",
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update flow
router.put("/flows/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // Verify ownership
        const { data: flow } = await supabaseAdmin
            .from("automation_flows")
            .select("merchant_id")
            .eq("id", id)
            .single();

        if (!flow || flow.merchant_id !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const updateData: any = {};
        const allowedFields = [
            "name",
            "trigger_keyword",
            "business_type",
            "description",
            "ai_prompt",
            "is_active",
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                if (field === "trigger_keyword") {
                    updateData[field] = req.body[field].toLowerCase().trim();
                } else {
                    updateData[field] = req.body[field];
                }
            }
        });

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from("automation_flows")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
            message: "Flow updated successfully!",
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delete flow
router.delete("/flows/:id", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        // Verify ownership
        const { data: flow } = await supabaseAdmin
            .from("automation_flows")
            .select("merchant_id")
            .eq("id", id)
            .single();

        if (!flow || flow.merchant_id !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { error } = await supabaseAdmin
            .from("automation_flows")
            .delete()
            .eq("id", id);

        if (error) throw error;

        res.json({
            success: true,
            message: "Flow deleted successfully",
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get flow statistics
router.get("/stats", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;

        // Get flow counts
        const { data: flows } = await supabaseAdmin
            .from("automation_flows")
            .select("business_type, is_active")
            .eq("merchant_id", userId);

        // Get conversation counts
        const { data: conversations } = await supabaseAdmin
            .from("conversations")
            .select("status")
            .eq("merchant_id", userId);

        const stats = {
            total_flows: flows?.length || 0,
            active_flows: flows?.filter((f) => f.is_active).length || 0,
            inactive_flows: flows?.filter((f) => !f.is_active).length || 0,
            by_business_type: {
                online_shop: flows?.filter((f) => f.business_type === "online_shop")
                    .length || 0,
                cargo: flows?.filter((f) => f.business_type === "cargo").length || 0,
                default: flows?.filter((f) => f.business_type === "default")
                    .length || 0,
            },
            conversations: {
                total: conversations?.length || 0,
                active: conversations?.filter((c) => c.status === "active").length || 0,
                completed: conversations?.filter((c) => c.status === "completed")
                    .length || 0,
            },
        };

        res.json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
