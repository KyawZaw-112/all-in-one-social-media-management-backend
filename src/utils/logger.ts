/**
 * Logger utility for centralized error tracking and logging.
 * In production, this can be connected to Sentry, Logtail, or other monitoring tools.
 */

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
    info: (message: string, context?: any) => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`, context || "");
    },

    warn: (message: string, context?: any) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, context || "");
    },

    error: (message: string, error?: any, context?: any) => {
        // Core Error Logging Logic
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] ${timestamp}: ${message}`);

        if (error) {
            if (error instanceof Error) {
                console.error(`Stack: ${error.stack}`);
            } else {
                console.error("Error Detail:", JSON.stringify(error, null, 2));
            }
        }

        if (context) {
            console.error("Context:", JSON.stringify(context, null, 2));
        }

        // 🚀 SENTRY INTEGRATION POINT
        // if (isProduction && process.env.SENTRY_DSN) {
        //     Sentry.captureException(error || new Error(message), { extra: context });
        // }
    }
};

export default logger;
