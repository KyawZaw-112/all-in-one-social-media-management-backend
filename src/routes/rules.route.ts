import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = Router();

router.get("/:pageId", requireAuth, async (req, res) => {
    const { pageId } = req.params;

    const { data, error } = await supabaseAdmin
        .from("auto_reply_rules")
        .select("*")
        .eq("page_id", pageId)
        .eq("user_id", req.user.id);

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json(data ?? []);
});


router.post("/", requireAuth, async (req, res) => {
    const { page_id, keyword, reply_text, match_type } = req.body;

    const { data, error } = await supabaseAdmin
        .from("auto_reply_rules")
        .insert({
            user_id: req.user.id,
            page_id,
            keyword,
            reply_text,
            match_type: match_type ?? "contains",
            trigger_type: "messenger",
            enabled: true,
            priority: 1,
        })
        .select()
        .single();

    if (error) {
        console.error("INSERT ERROR:", error);
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});


router.put("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { keyword, reply_text, enabled } = req.body;

    const { data, error } = await supabaseAdmin
        .from("auto_reply_rules")
        .update({ keyword, reply_text, enabled })
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
});

router.delete("/:id", requireAuth, async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from("auto_reply_rules")
        .delete()
        .eq("id", id)
        .eq("user_id", req.user.id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true });
});


export default router;