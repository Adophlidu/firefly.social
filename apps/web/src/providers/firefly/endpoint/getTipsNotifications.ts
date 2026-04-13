import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TipsNotification, TipsNotificationsResponse } from '@/providers/types/Firefly.js';
import { NotificationType } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getTipsNotifications(indicator?: PageIndicator) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/token_tips/notifications', {
        page: !indicator?.id || indicator.id === '0' ? 1 : indicator?.id,
        limit: 20,
    });
    const response = await fireflySessionHolder.fetch<TipsNotificationsResponse>(url);
    const data = resolveFireflyResponseData(response);

    return createPageable(
        (data?.data || EMPTY_LIST).map<TipsNotification>((x) => ({
            source: Source.Firefly,
            type: NotificationType.Tips,
            data: x,
            timestamp: new Date(x.timestamp).getTime(),
            notificationId: `${x.tx_hash}-${x.notification_type}-${x.liker_account_info?.id}`,
        })),
        createIndicator(indicator),
        data?.pagination?.page < data?.pagination?.totalPages
            ? createNextIndicator(indicator, `${data.pagination.page + 1}`)
            : undefined,
    );
}
