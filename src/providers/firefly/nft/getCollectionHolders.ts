import urlcat from 'urlcat';

import { EMPTY_LIST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { HoldersResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getCollectionHolders(chainId: number, contractAddress: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/collection/holder', {
        chainId,
        contractAddress,
        size: 100,
    });
    const response = await fetchJson<HoldersResponse>(url);
    return response.data || EMPTY_LIST;
}
