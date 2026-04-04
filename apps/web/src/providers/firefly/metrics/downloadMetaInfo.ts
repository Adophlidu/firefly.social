import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type MetricsDownloadMetaInfoResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function downloadMetaInfo() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/download-meta-info');
    const response = await fireflySessionHolder.fetch<MetricsDownloadMetaInfoResponse>(url);

    return resolveFireflyResponseData(response);
}
