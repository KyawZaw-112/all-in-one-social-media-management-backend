import OpenAI from "openai";
import { supabaseAdmin } from "../supabaseAdmin.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// Business-specific AI prompts
const BUSINESS_PROMPTS = {
    online_shop: `You are a friendly online shop assistant for a Facebook page.

Your goal is to help customers place orders naturally.

Extract the following information from the conversation:
- product_code or product_name: What they want to buy
- quantity: How many items
- delivery_address: Where to deliver
- phone_number: Contact number
- payment_method: COD, bank transfer, etc.

Respond naturally and ask for missing information one at a time.
Keep responses short and friendly.

Return strict JSON:
{
  "reply": "your friendly message here",
  "data": {},
  "order_complete": true/false
}`,

    cargo: `You are a helpful cargo/shipping assistant for a Facebook page.

Your goal is to help customers send packages.

Extract the following information from the conversation:
- package_type: document, parcel, box, etc.
- weight: Weight in kg
- pickup_address: Where to pick up
- delivery_address: Where to deliver
- phone_number: Contact number
- delivery_urgency: standard or express

Respond naturally and ask for missing information one at a time.
Keep responses short and friendly.

Return strict JSON:
{
  "reply": "your friendly message here",
  "data": {},
  "shipment_complete": true/false
}`,

    default: `You are an ecommerce assistant.
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
}`
};

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
    const { data: history, error: historyError } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
        .limit(10);

    if (historyError) {
        console.error("Error fetching message history:", historyError);
    }

    const safeHistory = history || [];

    // Select prompt based on business type
    const businessType = flow.business_type || 'default';
    const systemPrompt = flow.ai_prompt || BUSINESS_PROMPTS[businessType as keyof typeof BUSINESS_PROMPTS] || BUSINESS_PROMPTS.default;

    const messages = [
        {
            role: "system",
            content: systemPrompt,
        },
        ...safeHistory!.map((m: any) => ({
            role: m.role,
            content: m.content,
        })),
    ];

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
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
        ...(conversation.temp_data || {}),
        ...(parsed.data || {}),
    };

    await supabaseAdmin
        .from("conversations")
        .update({ temp_data: mergedData })
        .eq("id", conversation.id);

    await supabaseAdmin.from("messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: parsed.reply,
    });

    // Handle both order_complete (online shop) and shipment_complete (cargo)
    const isComplete = parsed.order_complete || parsed.shipment_complete || false;

    return {
        reply: parsed.reply,
        temp_data: mergedData,
        order_complete: isComplete,
        business_type: flow.business_type || 'default',
    };
}
