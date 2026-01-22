import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { env } from '@/constants/env.js';
import { X_WEBHOOK_RECEIVER_URL } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { logger } from '@/libs/Logger.js';
import { type SessionPayload, TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';

const WEBHOOK_ID = '2014001057232240641';

interface SubscriptionResponse {
    message: string;
}

export async function subscribeWebhook(payload: SessionPayload) {
    if (!isServer) throw new Error('This function can only be executed on the server.');

    logger.info(`[subscribeWebhook] Subscribing to webhook for user ${payload.clientId}`);

    if (payload.clientId !== 'vk') return;

    try {
        const url = urlcat(X_WEBHOOK_RECEIVER_URL, `/api/webhooks/${WEBHOOK_ID}/subscriptions`);
        const revealedPayload = await TwitterSessionPayload.revealPayload(payload);

        const response = await fetchJson<SubscriptionResponse>(url, {
            method: 'POST',
            headers: {
                'x-api-key': env.internal.X_WEBHOOK_RECEIVER_API_KEY,
            },
            body: JSON.stringify({
                accessToken: revealedPayload.accessToken,
                accessTokenSecret: revealedPayload.accessTokenSecret,
            }),
        });

        logger.info(`[subscribeWebhook] Subscribed to webhook for user ${payload.clientId} ${response.message}`);
    } catch (error) {
        logger.error(`[subscribeWebhook] Failed to subscribe to webhook for user ${payload.clientId} ${error}`);
    }
}
