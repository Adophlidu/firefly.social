import { EMPTY_LIST } from '@dimensiondev/constants';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { formatNotificationsFromWebhook } from '@/providers/twitter/formatNotificationsFromWebhook.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import type { Notification } from '@/providers/types/SocialMedia.js';
import type { MessagesResponse } from '@/providers/types/WebhookReceiver.js';
import type { ResponseJson } from '@/types/utility.js';

interface Options {
    profileId: string;
    limit: number;
    indicator?: PageIndicator;
}

async function fetchTwitterNotifications({ profileId, limit, indicator }: Options) {
    const indicatorId = indicator?.id || 0;
    const page = !Number.isNaN(+indicatorId) ? Number(indicatorId) : 0;
    const url = urlcat('/api/twitter/messages', {
        query: profileId,
        limit,
        cursor: page,
    });
    const response = await fetchJson<
        ResponseJson<{
            data: MessagesResponse['messages'];
            total: number;
        }>
    >(url);
    const result = resolveTwitterResponseData(response);
    return createPageable(
        formatNotificationsFromWebhook(result.data, profileId),
        createIndicator(indicator),
        result.data.length < limit ? undefined : createNextIndicator(indicator, `${page + 1}`),
    );
}

export async function getTwitterNotifications(options: Options, maxRetryTimes = 5) {
    let attempt = 0;
    let lastIndicator = options.indicator || createIndicator(undefined, '');
    let lastResult = createPageable<Notification>(EMPTY_LIST, lastIndicator);

    while (attempt < maxRetryTimes) {
        lastResult = await fetchTwitterNotifications({
            ...options,
            indicator: lastIndicator,
        });
        // If the current page has no data but has a next indicator. Retry with the next indicator.
        if (!lastResult.data.length && lastResult.nextIndicator) {
            lastIndicator = createIndicator(undefined, lastResult.nextIndicator.id);
            attempt += 1;
        } else {
            break;
        }
    }

    return lastResult;
}
