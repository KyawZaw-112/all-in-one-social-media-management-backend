import axios from "axios";
import { env } from "../config/env.js";
import fetch from "node-fetch";
export function getFacebookAuthUrl(userId) {
    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        response_type: "code",
        scope: "pages_show_list,pages_messaging,pages_manage_metadata",
        state: userId, // 👈 important
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}
export async function sendImageMessage(pageId, pageAccessToken, recipientId, imageUrl) {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/me/messages`, {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: imageUrl,
                        is_reusable: true
                    }
                }
            }
        }, {
            params: { access_token: pageAccessToken }
        });
    }
    catch (error) {
        const fbError = error.response?.data?.error || error.message;
        console.error("❌ Facebook Send Image Failed:", {
            recipientId,
            imageUrl,
            error: fbError,
            status: error.response?.status
        });
    }
}
export async function exchangeCodeForToken(code) {
    const { data } = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
        params: {
            client_id: env.FACEBOOK_APP_ID,
            client_secret: env.FACEBOOK_APP_SECRET,
            redirect_uri: env.FACEBOOK_REDIRECT_URI,
            code,
        },
    });
    return data;
}
export async function subscribePageToWebhook(pageId, pageAccessToken) {
    const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            access_token: pageAccessToken,
            subscribed_fields: ["messages", "messaging_postbacks", "messaging_optins", "message_deliveries", "message_reads"],
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        console.error("Subscribe failed:", data);
        throw new Error(data.error?.message || "Failed to subscribe webhook");
    }
}
export async function getUserPages(userAccessToken) {
    const { data } = await axios.get("https://graph.facebook.com/v19.0/me/accounts", {
        params: { access_token: userAccessToken },
    });
    return data.data;
}
export async function sendMessage(pageId, pageToken, recipientId, text) {
    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text },
        }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Facebook Send Message Failed:", {
            status: response.status,
            statusText: response.statusText,
            fb_error: errorData.error || errorData
        });
        throw new Error(`Facebook API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData.error || errorData)}`);
    }
}
export async function getUserProfile(psid, pageToken) {
    try {
        const { data } = await axios.get(`https://graph.facebook.com/v19.0/${psid}`, {
            params: {
                fields: "first_name,last_name,name",
                access_token: pageToken
            }
        });
        return data;
    }
    catch (error) {
        const fbError = error.response?.data?.error || error.message;
        console.error("⚠️ Failed to fetch user profile:", {
            psid,
            error: fbError,
            status: error.response?.status
        });
        return null;
    }
}
