import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { NotificationPushSwitchResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getNotificationPushSwitch() {
    const response = await fireflySessionHolder.fetch<NotificationPushSwitchResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v1/notification/pushswitch/get'),
    );
    return resolveFireflyResponseData(response);
}
