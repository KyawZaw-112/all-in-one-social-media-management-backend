export interface FacebookWebhookPayload {
    object: string;
    entry: FacebookEntry[];
}

export interface FacebookEntry {
    id: string;
    time: number;
    messaging?: FacebookMessaging[];
    changes?: any[]; // For other types of webhooks if needed
}

export interface FacebookMessaging {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: FacebookMessage;
    postback?: FacebookPostback;
}

export interface FacebookMessage {
    mid: string;
    text?: string;
    attachments?: any[];
    quick_reply?: { payload: string };
    is_echo?: boolean;
}

export interface FacebookPostback {
    title: string;
    payload: string;
    mid?: string;
}
