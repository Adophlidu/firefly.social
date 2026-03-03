import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { X_WEBHOOK_RECEIVER_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { type MessagesResponse } from '@/providers/types/WebhookReceiver.js';

interface Options {
    size?: number;
    cursor?: number;
}

export async function getWebhookMessagesByUserId(userId: string, options?: Options) {
    const size = options?.size ?? 25;
    const url = urlcat(X_WEBHOOK_RECEIVER_URL, '/api/messages', {
        user_id: userId,
        cursor: (options?.cursor ?? 0) * size,
        size,
    });
    const { messages, count } = await fetchJson<MessagesResponse>(url, {
        headers: {
            'x-api-key': env.internal.X_WEBHOOK_RECEIVER_API_KEY,
        },
    });
    return {
        data: messages,
        total: count,
    };
}
