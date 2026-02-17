import { Router } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
const router = Router();
/* ================================
   GET ALL CONVERSATIONS
================================ */
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("conversations")
            .select(`
        *,
        automation_flows ( name )
      `)
            .order("created_at", { ascending: false });
        if (error)
            throw error;
        const formatted = data?.map((c) => ({
            ...c,
            flow_name: c.automation_flows?.name,
        }));
        res.json(formatted);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});
/* ================================
   GET SINGLE CONVERSATION
================================ */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data: conversation, error } = await supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("id", id)
            .single();
        if (error)
            throw error;
        const { data: messages } = await supabaseAdmin
            .from("messages")
            .select("*")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true });
        res.json({
            conversation,
            messages,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch detail" });
    }
});
/* ================================
   CLOSE CONVERSATION
================================ */
router.post("/:id/close", async (req, res) => {
    try {
        const { id } = req.params;
        await supabaseAdmin
            .from("conversations")
            .update({ status: "completed" })
            .eq("id", id);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to close" });
    }
});
export default router;
