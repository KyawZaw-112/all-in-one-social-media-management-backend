import crypto from "crypto";
export const validateFacebookSignature = (req, res, next) => {
    const signature = req.headers["x-hub-signature-256"];
    const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
    if (!APP_SECRET) {
        console.warn("⚠️ FACEBOOK_APP_SECRET not set, skipping signature validation (Insecure!)");
        return next();
    }
    if (!signature) {
        console.error("❌ X-Hub-Signature-256 missing");
        return res.status(401).json({ error: "Missing signature" });
    }
    const elements = signature.split("=");
    const signatureHash = elements[1];
    // Check if rawBody is available (usually set by a body-parser with verify)
    // If not using rawBody, we might need a workaround for JSON bodies
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedHash = crypto
        .createHmac("sha256", APP_SECRET)
        .update(rawBody)
        .digest("hex");
    if (signatureHash !== expectedHash) {
        console.error("❌ X-Hub-Signature-256 mismatch");
        return res.status(401).json({ error: "Invalid signature" });
    }
    next();
};
