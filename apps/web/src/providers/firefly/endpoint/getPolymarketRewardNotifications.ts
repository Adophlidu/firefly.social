import { EMPTY_LIST } from '@dimensiondev/constants';
import { NotificationType, Source } from '@dimensiondev/enums';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type {
    PolymarketRewardNotification,
    PolymarketRewardNotificationData,
    PolymarketRewardNotificationsResponse,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/**
 * Fetches polymarket reward "notifications" from the dedicated activity endpoint
 * (mirrors iOS `Mask.API.Polymarket.UserActivityReward.rewards`). These are merged
 * into the unified notification list as a separate source, NOT requested through
 * `/v1/notification/all`.
 */
export async function getPolymarketRewardNotifications(indicator?: PageIndicator) {
    const page = !indicator?.id || indicator.id === '0' ? 1 : Number(indicator?.id);
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/polymarket/user/activity/reward', {
        page: Number.isFinite(page) ? page : undefined,
        limit: 20,
    });
    const response = await fireflySessionHolder.fetch<PolymarketRewardNotificationsResponse>(url);
    const data = resolveFireflyResponseData(response);

    const activities = (data?.activities ?? data?.list ?? EMPTY_LIST).filter(
        (x): x is PolymarketRewardNotificationData => x?.type?.endsWith('_reward') === true,
    );

    const nextCursor = data?.nextCursor ?? data?.pagination?.next_cursor ?? data?.pagination?.nextCursor;
    const nextPage = typeof data?.nextPage === 'number' ? `${data.nextPage}` : undefined;
    const hasNext = Boolean(nextCursor ?? nextPage);
    const fallbackPage = Number.isFinite(page) ? `${page + 1}` : undefined;

    return createPageable(
        activities.map<PolymarketRewardNotification>((x) => ({
            source: Source.Firefly,
            type: NotificationType.PredictionReward,
            data: x,
            timestamp: x.createdAt ? new Date(x.createdAt).getTime() : Date.now(),
            notificationId: x.id ?? `${x.type}|${x.createdAt ?? ''}`,
        })),
        createIndicator(indicator),
        hasNext ? createNextIndicator(indicator, nextCursor ?? nextPage ?? fallbackPage) : undefined,
    );
}
