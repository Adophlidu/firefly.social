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
 * Polymarket reward records, fetched as a dedicated notification source and merged
 * into the unified notification list (not via `/v1/notification/all`).
 */
export async function getPolymarketRewardNotifications(indicator?: PageIndicator) {
    const page = !indicator?.id || indicator.id === '0' ? 1 : Number(indicator?.id);
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/polymarket/user/activity/reward', {
        page: Number.isFinite(page) ? page : undefined,
        limit: 20,
    });
    const response = await fireflySessionHolder.fetch<PolymarketRewardNotificationsResponse>(url);
    const data = resolveFireflyResponseData(response);

    const activities = (data?.result ?? data?.activities ?? data?.list ?? EMPTY_LIST).filter(
        (x): x is PolymarketRewardNotificationData => x?.type?.endsWith('_reward') === true,
    );

    const nextCursor = data?.cursor ?? data?.nextCursor;

    return createPageable(
        activities.map<PolymarketRewardNotification>((x) => ({
            source: Source.Firefly,
            type: NotificationType.PredictionReward,
            data: x,
            // `timestamp` is the reward time in seconds.
            timestamp: x.timestamp ? x.timestamp * 1000 : x.createdAt ? new Date(x.createdAt).getTime() : Date.now(),
            notificationId: x.id ?? x.transactionHash ?? `${x.type}|${x.timestamp ?? x.createdAt ?? ''}`,
        })),
        createIndicator(indicator),
        nextCursor ? createNextIndicator(indicator, nextCursor) : undefined,
    );
}
