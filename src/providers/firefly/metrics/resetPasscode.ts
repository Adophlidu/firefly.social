import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

export async function resetPasscode() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/reset-passcode');

    await fireflySessionHolder.fetchWithSession(url, {
        method: 'POST',
    });
}
