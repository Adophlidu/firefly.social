import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { NotificationPushSwitchResponse, SetNotificationPushSwitchParams } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function setNotificationPushSwitch(params: SetNotificationPushSwitchParams) {
    const response = await fireflySessionHolder.fetch<NotificationPushSwitchResponse>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v1/notification/pushswitch/set'),
        {
            method: 'POST',
            body: JSON.stringify(params),
        },
    );
    return resolveFireflyResponseData(response);
}
