import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type MetricsItemToUpload, type Response } from '@/providers/types/Firefly.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

export async function uploadMetrics(passcode: string, metrics: MetricsItemToUpload[]) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/upload');

    const response = await fireflySessionHolder.fetch<Response<{}>>(url, {
        method: 'POST',
        body: JSON.stringify({
            metrics,
            passcode: encryptPasscode(passcode),
            client_os: 'web',
        }),
    });

    return resolveFireflyResponseData(response);
}
