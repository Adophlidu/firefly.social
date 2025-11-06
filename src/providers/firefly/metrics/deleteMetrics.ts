import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

export async function deleteMetrics(passcode: string, identities: string[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/delete');
    const response = await fireflySessionHolder.fetch<Response<{}>>(url, {
        method: 'POST',
        body: JSON.stringify({
            passcode: encryptPasscode(passcode),
            metaInfoIds: identities,
        }),
    });

    return resolveFireflyResponseData(response);
}
