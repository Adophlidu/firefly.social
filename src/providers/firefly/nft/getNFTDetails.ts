import urlcat from 'urlcat';

import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import { type NFTDetailResponse } from '@/providers/types/NFTs.js';
import { settings } from '@/settings/index.js';

export async function getNFTDetails(chainId: number, list: Array<{ contract_address: string; token_id: string }>) {
    if (!list.length || !NFTSCAN_CHAIN_IDS.includes(chainId)) return [];
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/detail');
    const response = await fetchJson<NFTDetailResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            chainId,
            list,
        }),
    });
    return response.data.map(adjustAssetUris);
}
