import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { PoapDetailResponse } from '@/providers/types/NFTs.js';
import { settings } from '@/settings/index.js';

export async function getPOAP(tokenId: string) {
    // cspell:ignore tokenid
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/detail_by_tokenid', {
        tokenId,
    });
    const response = await fetchJson<PoapDetailResponse>(url);
    return response.data;
}
