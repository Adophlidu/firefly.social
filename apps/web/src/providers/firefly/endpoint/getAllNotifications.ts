import { EMPTY_LIST } from '@dimensiondev/constants';
import { UNIFIED_NOTIFICATION_TYPES } from '@dimensiondev/constants/computed';
import type { NotificationType } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { AllNotificationsResponse, UnifiedNotification } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getAllNotifications(types?: string[], indicator?: PageIndicator) {
    const allTypes = types && types.length > 0 ? types : UNIFIED_NOTIFICATION_TYPES;

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/notification/all', {
        type: allTypes.join(','),
        page: !indicator?.id || indicator.id === '0' ? 1 : Number(indicator?.id),
        limit: 20,
    });
    const response = await fireflySessionHolder.fetch<AllNotificationsResponse>(url);
    const data = resolveFireflyResponseData(response);

    return createPageable(
        (data?.notifications).map<UnifiedNotification>((x) => ({
            source: Source.Firefly,
            type: x.type as NotificationType,
            data: x.data,
            timestamp: new Date(x.created_at).getTime(),
            notificationId: `${x.type}-${x.created_at}`,
        })) || EMPTY_LIST,
        createIndicator(indicator),
        data?.pagination?.page < data?.pagination?.totalPages
            ? createNextIndicator(indicator, `${data.pagination.page + 1}`)
            : undefined,
    );
}
