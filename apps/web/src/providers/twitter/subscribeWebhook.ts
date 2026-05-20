import { X_WEBHOOK_WHITELIST_CLIENT_IDS } from '@dimensiondev/constants/computed';
import { X_WEBHOOK_RECEIVER_URL } from '@dimensiondev/constants/static';
import { envs } from '@dimensiondev/envs';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { logger } from '@/libs/Logger.js';
import { type SessionPayload, TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';

const WEBHOOK_ID = envs.internal.X_WEBHOOK_ID;
const WEBHOOK_API_KEY = envs.internal.X_WEBHOOK_RECEIVER_API_KEY;

interface SubscriptionResponse {
    message: string;
}

export async function subscribeWebhook(payload: SessionPayload) {
    if (!isServer) throw new Error('This function can only be executed on the server.');
    if (!WEBHOOK_ID || !WEBHOOK_API_KEY) {
        logger.info('[subscribeWebhook] WEBHOOK_ID or WEBHOOK_API_KEY is not set. Skipping webhook subscription.');
        return;
    }
    if (payload.clientId && !X_WEBHOOK_WHITELIST_CLIENT_IDS.includes(payload.clientId)) {
        logger.info(`[subscribeWebhook] Client ${payload.clientId} is not whitelisted for webhook subscription.`);
        return;
    }

    logger.info(`[subscribeWebhook] Subscribing to webhook for user ${payload.clientId}`);

    try {
        const url = urlcat(X_WEBHOOK_RECEIVER_URL, `/api/webhooks/${WEBHOOK_ID}/subscriptions`);
        const revealedPayload = await TwitterSessionPayload.revealPayload(payload);

        const response = await fetchJson<SubscriptionResponse>(url, {
            method: 'POST',
            headers: {
                'x-api-key': WEBHOOK_API_KEY,
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
