import axios from "axios";
import { env } from "../config/env.js";
import fetch from "node-fetch";

export function getFacebookAuthUrl(userId: string) {
    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
        response_type: "code",
        scope: "pages_show_list,pages_messaging,pages_manage_metadata",
        state: userId, // 👈 important
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export async function sendImageMessage(pageId: string, pageAccessToken: string, recipientId: string, imageUrl: string) {
    await axios.post(`https://graph.facebook.com/v19.0/me/messages`,
        {
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
        },
        {
            params: { access_token: pageAccessToken }
        }
    )
}

export async function exchangeCodeForToken(code: string) {
    const { data } = await axios.get(
        "https://graph.facebook.com/v19.0/oauth/access_token",
        {
            params: {
                client_id: env.FACEBOOK_APP_ID,
                client_secret: env.FACEBOOK_APP_SECRET,
                redirect_uri: env.FACEBOOK_REDIRECT_URI,
                code,
            },
        }
    );

    return data;
}

export async function subscribePageToWebhook(
    pageId: string,
    pageAccessToken: string
) {
    const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                access_token: pageAccessToken,
                subscribed_fields: ["messages","messaging_postbacks"], // 👈 REQUIRED
            }),
        }
    );

    const data: any = await response.json();
    if (!response.ok) {
        console.error("Subscribe failed:", data);
        throw new Error(data.error?.message || "Failed to subscribe webhook");
    }
    console.log("Subscribe response:", data);
}


export async function getUserPages(userAccessToken: string) {
    const { data } = await axios.get(
        "https://graph.facebook.com/v19.0/me/accounts",
        {
            params: { access_token: userAccessToken },
        }
    );

    return data.data;
}

export async function sendMessage(
    pageId: string,
    pageToken: string,
    recipientId: string,
    text: string
): Promise<void> {
    const response = await fetch(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Facebook Send Message Failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
        });
        throw new Error(`Facebook API Error: ${response.status} ${response.statusText}`);
    }
}