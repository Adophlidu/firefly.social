import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface PerpsFavorite {
    name: string;
}

export async function getPerpsFavorites(limit = 200) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/perps/favorites/find', {
        limit,
        cursor: '0',
    });
    const response =
        await fireflySessionHolder.fetchWithSession<Response<{ list: PerpsFavorite[]; cursor: number | null }>>(url);
    return resolveFireflyResponseData(response).list;
}

export async function createPerpsFavorite(name: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/perps/favorites/create');
    const response = await fireflySessionHolder.fetchWithSession<Response<void>>(url, {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    return resolveFireflyResponseData(response);
}

export async function removePerpsFavorite(name: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/perps/favorites/remove');
    const response = await fireflySessionHolder.fetchWithSession<Response<void>>(url, {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
    return resolveFireflyResponseData(response);
}
