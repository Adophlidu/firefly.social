import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { X_WEBHOOK_RECEIVER_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import type { MessagesResponse } from '@/providers/types/WebhookReceiver.js';

export async function getWebhookMessagesByUserId(userId: string, indicator?: PageIndicator) {
    const url = urlcat(X_WEBHOOK_RECEIVER_URL, '/api/messages', {
        user_id: userId,
        cursor: (indicator?.index ?? 0) * 25,
        size: 25,
    });
    const { messages } = await fetchJson<MessagesResponse>(url, {
        headers: {
            'x-api-key': env.internal.X_WEBHOOK_RECEIVER_API_KEY,
        },
    });
    return createPageable(messages, createNextIndicator(indicator));
}
