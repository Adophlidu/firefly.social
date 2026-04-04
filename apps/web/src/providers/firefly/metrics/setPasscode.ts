import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

export async function setPasscode(passcode: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/set-passcode');

    await fireflySessionHolder.fetchWithSession(url, {
        method: 'POST',
        body: JSON.stringify({ passcode: encryptPasscode(passcode) }),
    });
}
