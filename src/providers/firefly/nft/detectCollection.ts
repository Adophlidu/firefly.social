import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { fixCollection } from '@/providers/firefly/endpoint/fixCollection.js';
import type { CollectionResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function detectCollection(address: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/detect', {
        address,
    });
    const response = await fetchJson<CollectionResponse>(url);
    if (!response.data) return null;
    return fixCollection(response.data);
}
