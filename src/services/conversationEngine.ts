import OpenAI from "openai";
import {supabaseAdmin} from "../supabaseAdmin.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function runConversationEngine(
    conversation: any,
    messageText: string,
    flow: any
) {
    // Save user message
    await supabaseAdmin.from("messages").insert({
        conversation_id: conversation.id,
        role: "user",
        content: messageText,
    });

    // Get last 10 messages
    const {data: history} = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", {ascending: true})
        .limit(10);

    const messages = [
        {
            role: "system",
            content:
                flow.ai_prompt ||
                `You are an ecommerce assistant.
Extract:
- product_code
- quantity
- address
- phone

Return strict JSON:
{
  "reply": "...",
  "data": {},
  "order_complete": true/false
}`,
        },
        ...history!.map((m: any) => ({
            role: m.role,
            content: m.content,
        })),
    ];

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        response_format: {type: "json_object"},
    });

    const aiText = completion.choices[0].message.content || "{}";

    let parsed;

    try {
        parsed = JSON.parse(aiText);
    } catch {
        parsed = {
            reply: "Sorry, I didn’t understand. Please repeat.",
            data: {},
            order_complete: false,
        };
    }

    const mergedData = {
        ...conversation.temp_data,
        ...parsed.data,
    };

    await supabaseAdmin
        .from("conversations")
        .update({temp_data: mergedData})
        .eq("id", conversation.id);

    await supabaseAdmin.from("messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: parsed.reply,
    });

    return {
        reply: parsed.reply,
        temp_data: mergedData,
        order_complete: parsed.order_complete,
    };
}
