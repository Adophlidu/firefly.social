import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type MetricsDownloadResponse } from '@/providers/types/Firefly.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

export async function downloadMetrics(passcode: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/download', {
        passcode: encryptPasscode(passcode),
    });
    const response = await fireflySessionHolder.fetch<MetricsDownloadResponse>(url);

    return resolveFireflyResponseData(response);
}
