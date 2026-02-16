import { supabaseAdmin } from "../supabaseAdmin.js";

export async function runRuleEngine(  pageId: string,
                                      messageText: string,
                                      triggerType: "comment" | "message" | "messenger") {
    const { data: rules } = await supabaseAdmin
        .from("auto_reply_rules")
        .select("*")
        .eq("page_id", pageId)
        .eq("trigger_type", triggerType)
        .eq("enabled", true)
        .order("priority", { ascending: true });

    if (!rules) return null;

    const lowerText = messageText.toLowerCase();

    for (const rule of rules) {
        if (rule.match_type === "contains") {
            if (lowerText.includes(rule.keyword.toLowerCase())) {
                return rule.reply_text;
            }
        }

        if (rule.match_type === "exact") {
            if (lowerText === rule.keyword.toLowerCase()) {
                return rule.reply_text;
            }
        }
    }

    return null;
}
