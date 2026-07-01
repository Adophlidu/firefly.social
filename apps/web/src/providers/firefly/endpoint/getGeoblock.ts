import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GeoblockResponse, GeoblockResponseWrapper } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getGeoblock(): Promise<GeoblockResponse> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/geoblock');
    const response = await fireflySessionHolder.fetchWithoutSession<GeoblockResponseWrapper>(url);
    return resolveFireflyResponseData(response);
}
