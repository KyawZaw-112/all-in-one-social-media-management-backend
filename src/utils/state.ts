import crypto from "crypto";

const SECRET = process.env.FACEBOOK_APP_SECRET!;

export const generateState = (userId: string) => {
    const payload = `${userId}:${Date.now()}`;
    const signature = crypto
        .createHmac("sha256", SECRET)
        .update(payload)
        .digest("hex");

    return Buffer.from(`${payload}:${signature}`).toString("base64");
};

export const verifyState = (state: string) => {
    const decoded = Buffer.from(state, "base64").toString("utf8");
    const [userId, timestamp, signature] = decoded.split(":");

    const expectedSig = crypto
        .createHmac("sha256", SECRET)
        .update(`${userId}:${timestamp}`)
        .digest("hex");

    if (expectedSig !== signature) return null;

    // 10 min expiry
    if (Date.now() - Number(timestamp) > 10 * 60 * 1000)
        return null;

    return userId;
};
