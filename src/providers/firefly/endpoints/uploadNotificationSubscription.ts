import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

export async function uploadNotificationSubscription(fcmToken: string, deviceId: string) {
    await fireflySessionHolder.fetchWithSession(
        urlcat(settings.FIREFLY_ROOT_URL, '/v1/notification/uploadDeviceToken'),
        {
            method: 'POST',
            body: JSON.stringify({
                deviceId,
                token: fcmToken,
                platform: 'web',
            }),
        },
    );
}
