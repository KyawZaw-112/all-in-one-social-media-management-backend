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
    await fetch(
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
}