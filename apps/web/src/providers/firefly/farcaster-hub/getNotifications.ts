import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { formatFireflyNotification } from '@/helpers/formatFireflyNotification.js';
import { isZero } from '@/helpers/number.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { NotificationResponse } from '@/providers/types/Firefly.js';
import type { Notification } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getNotifications(indicator?: PageIndicator): Promise<Pageable<Notification, PageIndicator>> {
    const profileId = farcasterSessionHolder.sessionRequired.profileId;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/notifications/new', {
        fid: profileId,
        sourceFid: profileId,
        cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
    });
    const response = await fireflySessionHolder.fetch<NotificationResponse>(url);
    const data = resolveFireflyResponseData(response);
    const notifications = compact(data.notifications.map((x) => formatFireflyNotification(profileId, x)));

    return createPageable(
        notifications,
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
