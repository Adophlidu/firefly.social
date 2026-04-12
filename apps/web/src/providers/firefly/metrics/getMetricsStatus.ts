import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { MetricsStatusResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getMetricsStatus() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/metrics/check-login-metrics');
    const response = await fireflySessionHolder.fetch<MetricsStatusResponse>(url);

    return resolveFireflyResponseData(response);
}
