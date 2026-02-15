import axios from "axios";
import { env } from "../config/env.js";
export function getFacebookAuthUrl(userId) {
    const params = new URLSearchParams({
        client_id: env.FACEBOOK_APP_ID,
        redirect_uri: env.FACEBOOK_REDIRECT_URI,
        scope: "pages_show_list,pages_read_engagement,pages_manage_metadata",
        response_type: "code",
        state: userId,
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
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
export async function getUserPages(userAccessToken) {
    const { data } = await axios.get("https://graph.facebook.com/v19.0/me/accounts", {
        params: { access_token: userAccessToken },
    });
    return data.data;
}
