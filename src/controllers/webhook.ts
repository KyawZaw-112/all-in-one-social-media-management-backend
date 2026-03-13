import { sendMessage, sendImageMessage, getUserProfile } from "../services/facebook.services.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { Request, Response } from "express";
import { runConversationEngine, getDefaultReply, getWelcomeMessage, detectLanguage } from "../services/conversationEngine.js";
import { FacebookWebhookPayload } from "../types/facebook.js";
import logger from "../utils/logger.js";

/**
 * 🛡️ Helper to log messages to the DB without crashing the flow if DB fails (e.g. FK violation)
 */
async function safeLogMessage(data: any) {
    try {
        const { error } = await supabaseAdmin.from("messages").insert(data);
        if (error) {
            console.warn("⚠️ Database log partially failed:", error.message);
        }
    } catch (e: any) {
        console.warn("⚠️ Critical log failure (skipped):", e.message);
    }
}

export const verifyWebhook = (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
};

export const handleWebhook = async (req: Request, res: Response) => {
    const body = req.body as FacebookWebhookPayload;
    console.log("📥 [RAW WEBHOOK]", JSON.stringify(body));

    // 🔬 DEBUG: Log raw webhook to DB (using fail-safe helper)
    // We omit user_id here to avoid FK violations (it's nullable)
    await safeLogMessage({
        sender_id: "SYSTEM_DEBUG",
        sender_name: "RAW_WEBHOOK_LOGGER",
        body: JSON.stringify(body),
        channel: "facebook",
        status: "received",
        metadata: {
            type: "raw_log",
            entry_count: body.entry?.length,
            page_id: body.entry?.[0]?.id
        }
    });

    // 0️⃣ EARLY RESPONSE
    // Send 200 OK immediately to satisfy Facebook and prevent retries while we process in background
    res.sendStatus(200);

    const entries = body.entry || [];
    for (const entry of entries) {
        const pageId = entry.id;
        const messagingList = entry.messaging || [];

        for (const messaging of messagingList) {
            try {
                const isEcho = messaging?.message?.is_echo;
                if (isEcho) {
                    console.log("🗣️ Ignoring message echo from Facebook");
                    continue;
                }

                const senderId = messaging?.sender?.id;
                let messageText = messaging?.message?.text || "";

                // 🔥 Handle Postbacks (like Get Started button)
                if (!messageText && messaging?.postback?.payload) {
                    messageText = messaging.postback.payload;
                    console.log(`🔘 Postback detected: ${messageText}`);
                }

                const attachments = messaging?.message?.attachments || [];
                const mid = messaging?.message?.mid;

                console.log(`📝 [PAGE: ${pageId}] [SENDER: ${senderId}] Processing Message:`, {
                    text: messageText?.substring(0, 50),
                    attachments: attachments.map((a: any) => a.type),
                    mid
                });

                if (!pageId || !senderId || (!messageText && attachments.length === 0)) {
                    console.log("⚠️ Missing required message data, skipping context.");
                    continue;
                }

                // Deduplication (fail-safe)
                if (mid) {
                    try {
                        const { data: existingMsg } = await supabaseAdmin
                            .from("messages")
                            .select("id")
                            .contains('metadata', { fb_mid: mid })
                            .maybeSingle();

                        if (existingMsg) {
                            console.log("🛑 Duplicate mid detected, skipping:", mid);
                            continue;
                        }
                    } catch (dedupErr: any) {
                        console.warn("⚠️ Dedup check failed (proceeding anyway):", dedupErr?.message);
                    }
                }

                // 1️⃣ Find merchant connection
                const { data: connection, error: connError } = await supabaseAdmin
                    .from("platform_connections")
                    .select("*")
                    .eq("page_id", pageId)
                    .maybeSingle();

                console.log(`🔍 [DEBUG] Searching for Page ID: ${pageId} | Found: ${!!connection}`);

                if (connError || !connection) {
                    console.log(`🚫 [DEBUG] No connection found for Page ID: ${pageId}. Error: ${connError?.message || 'none'}. Skipping.`);
                    continue;
                }

                const merchantId = connection.user_id || connection.merchant_id;
                console.log(`🏪 [DEBUG] Merchant ID: ${merchantId}`);

                // 1.2️⃣ Admin Keyword Check (Silence Bot)
                const adminKeywords = ["admin", "အက်မင်", "မင်မင်"];
                if (messageText && adminKeywords.some(k => messageText.toLowerCase().includes(k))) {
                    console.log(`👤 Admin requested on Page ${pageId}. Silencing bot.`);
                    await safeLogMessage({
                        user_id: merchantId,
                        sender_id: senderId,
                        sender_email: senderId,
                        sender_name: "Facebook User",
                        body: messageText,
                        channel: "facebook",
                        status: "received",
                        metadata: { fb_mid: mid, page_id: pageId, is_admin_request: true }
                    });
                    await sendMessage(pageId, connection.page_access_token, senderId, "ခဏစောင့်ပေးပါခင်ဗျာ။ Admin မှ မကြာခင် ပြန်လည်ဖြေကြားပေးပါမည်။ 🙏");
                    continue;
                }

                const { data: merchant, error: merchantError } = await supabaseAdmin
                    .from("merchants")
                    .select("subscription_status, trial_ends_at, business_type")
                    .eq("id", merchantId)
                    .maybeSingle();
                console.log(`👤 [DEBUG] Merchant: ${merchant ? `found (type: ${merchant.business_type})` : `NOT FOUND`} | Error: ${merchantError?.message || 'none'}`);

                // 2️⃣ Check for active conversation
                let isResuming = true;
                let { data: activeConvs } = await supabaseAdmin
                    .from("conversations")
                    .select("*")
                    .eq("merchant_id", merchantId)
                    .eq("user_psid", senderId)
                    .eq("status", "active")
                    .order("created_at", { ascending: false });

                let conversation = activeConvs && activeConvs.length > 0 ? activeConvs[0] : null;
                console.log(`💬 [DEBUG] Active conversation: ${conversation ? conversation.id : 'NONE'} | Count: ${activeConvs?.length || 0}`);

                // Cleanup redundant conversations
                if (activeConvs && activeConvs.length > 1) {
                    const olderIds = activeConvs.slice(1).map(c => c.id);
                    await supabaseAdmin.from("conversations").delete().in("id", olderIds);
                }

                let flow;

                // 3️⃣ Match flow or load existing
                if (!conversation) {
                    isResuming = false;
                    const rawMessage = messageText.toLowerCase().trim();

                    const { data: flows, error: flowsError } = await supabaseAdmin
                        .from("automation_flows")
                        .select("*")
                        .eq("merchant_id", merchantId)
                        .eq("is_active", true);
                    console.log(`📋 [DEBUG] Active flows: ${flows?.length || 0} | Error: ${flowsError?.message || 'none'} | Types: ${flows?.map(f => f.business_type).join(', ') || 'N/A'}`);

                    const matchedFlow = flows?.find(f => {
                        const keywords = f.trigger_keyword.toLowerCase().split(',').map((k: string) => k.trim());
                        return keywords.some((k: string) => rawMessage.includes(k) && k.length > 0);
                    });

                    if (!matchedFlow) {
                        let bType = merchant?.business_type || 'online_shop';
                        if (bType === 'shop') bType = 'online_shop';

                        const autoMatched = flows?.find(f => f.business_type === bType);
                        if (autoMatched) {
                            flow = autoMatched;
                        } else if (flows && flows.length > 0) {
                            flow = flows[0];
                        } else {
                            console.log(`🚫 No active flows for merchant ${merchantId}.`);
                            continue;
                        }
                    } else {
                        flow = matchedFlow;
                    }

                    const { data: newConv, error: createError } = await supabaseAdmin
                        .from("conversations")
                        .insert({
                            merchant_id: merchantId,
                            page_id: pageId,
                            user_psid: senderId,
                            flow_id: flow.id,
                            temp_data: {},
                            status: "active",
                        })
                        .select()
                        .single();

                    if (createError || !newConv) {
                        logger.error("❌ Failed to create conversation", createError);
                        continue;
                    }

                    conversation = newConv;

                    let senderName = "Facebook User";
                    try {
                        const profile = await getUserProfile(senderId, connection.page_access_token);
                        if (profile?.name) senderName = profile.name;
                    } catch (err) { }

                    const userLang = detectLanguage(messageText);
                    const welcomeMsg = getWelcomeMessage(flow.business_type || 'online_shop', senderName, connection.page_name, flow.metadata, userLang);
                    try {
                        await sendMessage(pageId, connection.page_access_token, senderId, welcomeMsg);
                        await safeLogMessage({
                            user_id: merchantId,
                            sender_id: merchantId,
                            sender_email: "AI-Assistant",
                            sender_name: "Auto-Reply Bot",
                            body: welcomeMsg,
                            channel: "facebook",
                            status: "replied",
                            metadata: { conversation_id: conversation.id }
                        });
                    } catch (err) {
                        console.error("❌ Failed to send welcome:", err);
                    }

                    await safeLogMessage({
                        user_id: merchantId,
                        sender_id: senderId,
                        sender_email: senderId,
                        sender_name: senderName,
                        body: messageText,
                        channel: "facebook",
                        status: "received",
                        conversation_id: conversation.id,
                        metadata: { conversation_id: conversation.id, fb_mid: mid }
                    });

                    // For new conversations, we process the trigger message IMMEDIATELY after welcome
                    isResuming = true;
                } else {
                    // Normal flow loading
                    if (conversation.flow_id) {
                        const { data: existingFlow } = await supabaseAdmin
                            .from("automation_flows")
                            .select("*")
                            .eq("id", conversation.flow_id)
                            .maybeSingle();
                        flow = existingFlow;
                    }

                    if (!flow) {
                        console.log("⚠️ Flow missing, skipping resume.");
                        continue;
                    }

                    await safeLogMessage({
                        user_id: merchantId,
                        sender_id: senderId,
                        sender_email: senderId,
                        sender_name: "Facebook User",
                        body: messageText,
                        channel: "facebook",
                        status: "received",
                        metadata: { conversation_id: conversation.id, fb_mid: mid }
                    });
                }

                // 5️⃣ Run conversation engine
                const result = await runConversationEngine(conversation, messageText, flow, attachments, isResuming);

                // Update conversation state (temp_data)
                if (result.temp_data) {
                    await supabaseAdmin
                        .from("conversations")
                        .update({ temp_data: result.temp_data })
                        .eq("id", conversation.id);
                }

                // 6️⃣ Completion Logic
                if (result.order_complete) {
                    const businessType = result.business_type || flow.business_type || 'online_shop';
                    const cleanData = Object.keys(result.temp_data || {}).reduce((acc: any, key) => {
                        if (!key.startsWith('_')) acc[key] = result.temp_data[key];
                        return acc;
                    }, {});

                    // Normalize payment method
                    if (cleanData.payment && !cleanData.payment_method) cleanData.payment_method = cleanData.payment;

                    if (businessType === 'cargo') {
                        // Extract allowed columns only to prevent DB errors
                        const shipmentData: any = {
                            merchant_id: merchantId,
                            conversation_id: conversation.id,
                            page_id: pageId,
                            order_no: result.temp_data.order_no,
                            country: cleanData.country,
                            shipping: cleanData.shipping,
                            item_type: cleanData.item_type,
                            item_name: cleanData.item_name,
                            item_value: cleanData.item_value,
                            weight: cleanData.weight,
                            full_name: cleanData.full_name,
                            phone: cleanData.phone,
                            address: cleanData.address,
                            item_photos: cleanData.item_photos || [],
                            notes: cleanData.notes,
                            status: "pending"
                        };
                        const { error: shipInsertErr } = await supabaseAdmin.from("shipments").insert(shipmentData);
                        if (shipInsertErr) logger.error("❌ Failed to insert shipment", shipInsertErr);
                    } else {
                        // Calculate total amount if item_price is available
                        let totalAmount = cleanData.total_amount;
                        if (!totalAmount && cleanData.item_price && cleanData.quantity) {
                            const price = parseFloat(cleanData.item_price);
                            const qty = parseInt(cleanData.quantity);
                            if (!isNaN(price) && !isNaN(qty)) {
                                totalAmount = price * qty;
                            }
                        }

                        const orderData: any = {
                            merchant_id: merchantId,
                            conversation_id: conversation.id,
                            page_id: pageId,
                            order_no: result.temp_data.order_no,
                            item_name: cleanData.product_name || cleanData.item_name,
                            quantity: cleanData.quantity,
                            full_name: cleanData.full_name,
                            phone: cleanData.phone,
                            address: cleanData.address,
                            payment_method: cleanData.payment_method || cleanData.payment,
                            payment: cleanData.payment,
                            order_source: cleanData.order_source,
                            delivery: cleanData.delivery,
                            notes: cleanData.notes,
                            total_amount: totalAmount,
                            item_photos: cleanData.item_photos || [],
                            status: "pending",
                        };

                        if (cleanData.size || cleanData.color) {
                            const parts = [];
                            if (cleanData.size) parts.push(`Size: ${cleanData.size}`);
                            if (cleanData.color) parts.push(`Color: ${cleanData.color}`);
                            orderData.item_variant = parts.join(', ');
                        }

                        const { error: orderInsertErr } = await supabaseAdmin.from("orders").insert(orderData);
                        if (orderInsertErr) {
                            logger.error("❌ Failed to insert order", orderInsertErr);
                        } else {
                            // 🔥 Smart Inventory Sync: Auto-deduct stock if item_id exists
                            const deductionItemId = cleanData.item_id || orderData.item_id;
                            if (deductionItemId && cleanData.quantity) {
                                try {
                                    const qty = parseInt(cleanData.quantity);
                                    if (!isNaN(qty) && qty > 0) {
                                        // Use RPC or separate select/update to decrement stock safely
                                        console.log(`🔍 Attempting stock deduction for ${deductionItemId}, qty: ${qty}`);
                                        const { data: product } = await supabaseAdmin
                                            .from("products")
                                            .select("stock")
                                            .eq("id", deductionItemId)
                                            .single();

                                        if (product) {
                                            const newStock = Math.max(0, (product.stock || 0) - qty);
                                            await supabaseAdmin
                                                .from("products")
                                                .update({ stock: newStock })
                                                .eq("id", deductionItemId);
                                            console.log(`📉 Stock deducted for ${deductionItemId}: ${product.stock} -> ${newStock}`);
                                        } else {
                                            console.warn(`⚠️ Stock deduction skipped: Product ${deductionItemId} not found.`);
                                        }
                                    }
                                } catch (stockErr) {
                                    console.warn("⚠️ Stock deduction failed", stockErr);
                                }
                            }
                        }
                    }
                    await supabaseAdmin.from("conversations").update({ status: "completed" }).eq("id", conversation.id);



                    // 📄 Auto PDF Invoicing (Link Generation PoC)
                    try {
                        const frontendUrl = process.env.FRONTEND_URL || 'https://oraculum.click';
                        const receiptUrl = `${frontendUrl.replace(/\/$/, '')}/receipt/${result.temp_data.order_no}`;
                        const currentLang = result.temp_data?._lang || 'my';
                        const receiptMsg = result.business_type === 'cargo'
                            ? (currentLang === 'my' ? `📦 သင်၏ Shipment အတွက် ပြေစာကို ဤနေရာတွင် ကြည့်နိုင်ပါသည်: ${receiptUrl}` : `📦 You can view your shipment receipt here: ${receiptUrl}`)
                            : (currentLang === 'my' ? `📄 သင်၏ Order ပြေစာကို ဤနေရာတွင် ကြည့်နိုင်ပါသည်: ${receiptUrl}` : `📄 You can view your order receipt here: ${receiptUrl}`);

                        await sendMessage(pageId, connection.page_access_token, senderId, receiptMsg);
                    } catch (pdfErr) {
                        console.warn("⚠️ PDF Invoicing failed", pdfErr);
                    }
                }

                // 7️⃣ Send Reply
                if (result.image_url) {
                    try {
                        await sendImageMessage(pageId, connection.page_access_token, senderId, result.image_url);
                    } catch (e) {
                        console.error("❌ Image send failed:", e);
                    }
                }

                try {
                    const finalMessage = result.interactive_message || result.reply;
                    await sendMessage(pageId, connection.page_access_token, senderId, finalMessage);
                    await safeLogMessage({
                        user_id: merchantId,
                        sender_id: merchantId,
                        sender_email: "AI-Assistant",
                        sender_name: "Auto-Reply Bot",
                        body: result.reply,
                        channel: "facebook",
                        status: "replied",
                        metadata: { conversation_id: conversation.id }
                    });
                } catch (sendErr) {
                    console.error("❌ Final sendMessage failed:", sendErr);
                }
            } catch (innerError) {
                console.error("🔴 Error processing messaging event:", innerError);
            }
        }
    }
};
