import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Response } from '@/providers/types/Firefly.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

export async function checkPasscode(passcode: string, noStrictOK?: boolean) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/check-passcode');

    return fireflySessionHolder.fetch<Response<{}>>(
        url,
        {
            method: 'POST',
            body: JSON.stringify({ passcode: encryptPasscode(passcode) }),
        },
        { noStrictOK },
    );
}
