/**
 * Logger utility for centralized error tracking and logging.
 * In production, this can be connected to Sentry, Logtail, or other monitoring tools.
 */
const isProduction = process.env.NODE_ENV === 'production';
export const logger = {
    info: (message, context) => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`, context || "");
    },
    warn: (message, context) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, context || "");
    },
    error: (message, error, context) => {
        // Core Error Logging Logic
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] ${timestamp}: ${message}`);
        if (error) {
            if (error instanceof Error) {
                console.error(`Stack: ${error.stack}`);
            }
            else {
                console.error("Error Detail:", JSON.stringify(error, null, 2));
            }
        }
        if (context) {
            console.error("Context:", JSON.stringify(context, null, 2));
        }
        // 🚀 DB LOGGING for Errors
        const merchantId = context?.merchant_id || context?.user_id;
        if (merchantId) {
            // Lazy import to avoid circular dependencies
            import("../supabaseAdmin.js").then(({ supabaseAdmin }) => {
                supabaseAdmin.from("system_logs").insert({
                    merchant_id: merchantId,
                    level: "error",
                    message: message,
                    details: context || (error instanceof Error ? null : error),
                    stack: error instanceof Error ? error.stack : null,
                    created_at: timestamp
                }).then(({ error: dbErr }) => {
                    if (dbErr)
                        console.warn("⚠️ Failed to save error log to DB:", dbErr.message);
                });
            }).catch(err => console.error("⚠️ Failed to load supabaseAdmin in logger:", err));
        }
        // 🚀 SENTRY INTEGRATION POINT
        // if (isProduction && process.env.SENTRY_DSN) {
        //     Sentry.captureException(error || new Error(message), { extra: context });
        // }
    }
};
export default logger;
