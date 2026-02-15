import axios from "axios";

interface FacebookAccount {
    platform: string;
    access_token: string;
    page_id: string;
}

export async function postToFacebook(
    account: FacebookAccount,
    content: string,
    mediaUrl?: string
) {
    const PAGE_ID = account.page_id;
    const ACCESS_TOKEN = account.access_token;

    try {
        // If image exists → post photo
        if (mediaUrl) {
            const response = await axios.post(
                `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`,
                {
                    url: mediaUrl,
                    caption: content,
                    access_token: ACCESS_TOKEN,
                }
            );

            return {
                platform: "facebook",
                postId: response.data.post_id,
            };
        }

        // Otherwise → normal text post
        const response = await axios.post(
            `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`,
            {
                message: content,
                access_token: ACCESS_TOKEN,
            }
        );

        return {
            platform: "facebook",
            postId: response.data.id,
        };
    } catch (error: any) {
        console.error("Facebook Post Error:", error.response?.data);

        throw new Error(
            error.response?.data?.error?.message ||
            "Failed to post to Facebook"
        );
    }
}
