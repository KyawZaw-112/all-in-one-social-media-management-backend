import dotenv from "dotenv";
dotenv.config();
function required(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing env: ${name}`);
    return value;
}
export const env = {
    PORT: process.env.PORT || 4000,
    FACEBOOK_APP_ID: required("FACEBOOK_APP_ID"),
    FACEBOOK_APP_SECRET: required("FACEBOOK_APP_SECRET"),
    FACEBOOK_REDIRECT_URI: required("FACEBOOK_REDIRECT_URI"),
    FRONTEND_URL: required("FRONTEND_URL"),
};
