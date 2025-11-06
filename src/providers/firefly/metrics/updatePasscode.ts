import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

export async function updatePasscode(oldPasscode: string, newPasscode: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/update-passcode');

    await fireflySessionHolder.fetchWithSession(url, {
        method: 'POST',
        body: JSON.stringify({
            oldPasscode: encryptPasscode(oldPasscode),
            newPasscode: encryptPasscode(newPasscode),
        }),
    });
}
