import {supabaseAdmin} from "../supabaseAdmin.js";

export async function runRuleEngine(
    pageId: string,
    messageText: string
) {
    const { data: rules, error } = await supabaseAdmin
        .from("auto_reply_rules")
        .select("*")
        .eq("page_id", String(pageId))  // 🔥 force string match
        .eq("enabled", true)
        .order("priority", { ascending: true });

    if (error) {
        console.error("Rule fetch error:", error);
        return null;
    }

    if (!rules || rules.length === 0) {
        console.log("No rules found for page:", pageId);
        return null;
    }

    const lowerText = messageText.toLowerCase();

    for (const rule of rules) {
        const keyword = (rule.keyword ?? "").toLowerCase();
        const type = rule.match_type ?? "contains"; // 🔥 default safety

        if (type === "contains" && lowerText.includes(keyword)) {
            return rule.reply_text;
        }

        if (type === "exact" && lowerText === keyword) {
            return rule.reply_text;
        }

        if (type === "starts_with" && lowerText.startsWith(keyword)) {
            return rule.reply_text;
        }
    }

    // fallback rule
    const fallback = rules.find(r => r.match_type === "fallback");

    return fallback?.reply_text ?? null;
}
