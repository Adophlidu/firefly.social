import { envs } from '@dimensiondev/envs/wallet';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { GeoblockResponse, GeoblockResponseWrapper } from '@/providers/types/Firefly.js';

export async function getGeoblock(): Promise<GeoblockResponse> {
    const url = urlcat(envs.external.NEXT_PUBLIC_FIREFLY_ROOT_URL, '/v1/geoblock');
    const response = await fetch(url);
    const data: GeoblockResponseWrapper = await response.json();
    return resolveFireflyResponseData(data);
}
