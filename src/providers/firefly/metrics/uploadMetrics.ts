import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type MetricsData, type MetricsUploadResponseData, type Response } from '@/providers/types/Firefly.js';
import { encryptPasscode } from '@/services/crypto.js';
import { settings } from '@/settings/index.js';

interface Options {
    headers?: HeadersInit;
    isEncrypted?: boolean;
}

export async function uploadMetrics(passcode: string, metrics: MetricsData[], options?: Options) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/upload');
    const isEncrypted = options?.isEncrypted ?? false;

    const response = await fireflySessionHolder.fetch<Response<MetricsUploadResponseData>>(url, {
        method: 'POST',
        body: JSON.stringify({
            metrics,
            passcode: isEncrypted ? passcode : encryptPasscode(passcode),
            client_os: 'web',
        }),
        headers: options?.headers,
    });

    return resolveFireflyResponseData(response);
}
