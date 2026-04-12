import urlcat from 'urlcat';

import { adjustAssetUris } from '@/helpers/adjustAssetUris.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import type { NFTDetailsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getUserCollectionNFTs(
    walletAddress: string,
    chainId: number,
    contractAddress: string,
    indicator?: PageIndicator,
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/wallet/own', {
        walletAddress,
        chainId,
        contractAddress,
        cursor: indicator?.id,
    });
    const response = await fetchJson<NFTDetailsResponse>(url);
    const list = (response.data?.nfts || []).map(adjustAssetUris);
    return createPageable(
        list,
        createIndicator(indicator),
        response.data?.cursor ? createNextIndicator(indicator, response.data.cursor) : undefined,
    );
}
