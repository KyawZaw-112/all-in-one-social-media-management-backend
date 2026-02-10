const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID!;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET!;
const BASE_URL = process.env.API_URL!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

export function getFacebookAuthUrl(userId: string) {
    const redirectUri = `${BASE_URL}/platforms/facebook/callback`;

    return (
        "https://www.facebook.com/v19.0/dialog/oauth" +
        `?client_id=${FACEBOOK_CLIENT_ID}` +
        `&redirect_uri=${redirectUri}` +
        `&state=${userId}` +
        `&scope=pages_manage_metadata,pages_read_engagement,pages_messaging`
    );
}
