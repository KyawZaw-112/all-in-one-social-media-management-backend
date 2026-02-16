import {supabaseAdmin} from "../supabaseAdmin.js";

export async function runRuleEngine(pageId: string,
                                    messageText: string
) {
    const {data: rules} = await supabaseAdmin
        .from("auto_reply_rules")
        .select("*")
        .eq("page_id", pageId)
        .eq("enabled", true)
        .order("priority", {ascending: true});

    if (!rules) return null;

    const lowerText = messageText.toLowerCase();

    for (const rule of rules) {
        if (rule.match_type === "exact" && messageText === rule.keyword) {
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
    const fallback = rules.find(r=>r.match_type === "fallback");

    return fallback?.reply_text ?? null;
}
