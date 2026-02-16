import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
const router = Router();
router.get("/:pageId", requireAuth, async (req, res) => {
    const { pageId } = req.params;
    const { data } = await supabaseAdmin
        .from("auto_reply_rules")
        .select("*")
        .eq("page_id", pageId)
        .eq("user_id", req.user.id);
    res.json(data);
});
router.post("/", requireAuth, async (req, res) => {
    const { page_id, keyword, reply_text } = req.body;
    const { data } = await supabaseAdmin
        .from("auto_reply_rules")
        .insert({
        user_id: req.user.id,
        page_id,
        keyword,
        reply_text,
        match_type: "contains",
        trigger_type: "messenger",
        enabled: true,
        priority: 1,
    })
        .select()
        .single();
    res.json(data);
});
export default router;
