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
        const keyword = rule.keyword.toLowerCase();

        if (rule.match_type === "contains") {
            if (lowerText.includes(keyword)) {
                return rule.reply_text;
            }
        }

        if (rule.match_type === "exact") {
            if (lowerText === keyword) {
                return rule.reply_text;
            }
        }

        if (rule.match_type === "starts_with") {
            if (lowerText.startsWith(keyword)) {
                return rule.reply_text;
            }
        }
    }

    const fallback = rules.find(r=>r.match_type === "fallback");

    return fallback?.reply_text ?? null;
}
