import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { NotificationConfigsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getWebNotificationPushSwitch() {
    const response = await fireflySessionHolder.fetch<NotificationConfigsResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v1/notification/pushswitch/webget'),
    );
    return resolveFireflyResponseData(response);
}
