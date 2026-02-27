import OpenAI from 'openai';
import { env } from '../config/env.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface SlipData {
    amount: string | null;
    transaction_id: string | null;
    date: string | null;
    is_valid: boolean;
    raw_text?: string;
}

/**
 * Scans a bank slip image (KPay, Wave, etc.) and extracts key information.
 * Uses OpenAI Vision for high-accuracy OCR and parsing.
 */
export async function scanPaymentSlip(imageUrl: string): Promise<SlipData> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost-effective and capable of Vision
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract 'amount', 'transaction_id', and 'date' from this payment slip image. Return ONLY a JSON object with these keys. If you cannot find a value, set it to null. Amount should be a string (e.g. '85,000 MMK')."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                "url": imageUrl,
                            },
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("Empty response from OpenAI");

        const parsed = JSON.parse(content);

        return {
            amount: parsed.amount,
            transaction_id: parsed.transaction_id,
            date: parsed.date,
            is_valid: !!(parsed.amount && parsed.transaction_id),
            raw_text: content
        };
    } catch (error: any) {
        console.error("❌ OCR Scan Failed:", error.message);
        return {
            amount: null,
            transaction_id: null,
            date: null,
            is_valid: false
        };
    }
}
