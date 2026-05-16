import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import { EthereumChainId } from '@dimensiondev/workers-shared/types/ethereum.js';
import type { Context } from 'hono';

import { adjustAssetUris } from '@/metadata/src/nft/adjustAssetUris.js';
import type { NFTDetailResponse } from '@/metadata/src/nft/types.js';

export const NFTSCAN_CHAIN_IDS = [
    EthereumChainId.Mainnet,
    EthereumChainId.BSC,
    EthereumChainId.Polygon,
    EthereumChainId.Base,
    EthereumChainId.Optimism,
];

async function getNFTDetails(chainId: number, list: Array<{ contract_address: string; token_id: string }>, c: Context) {
    if (!list.length || !NFTSCAN_CHAIN_IDS.includes(chainId)) return [];

    const url = urlcat(resolveFireflyRootUrl(c), '/v1/nft/detail');
    const response = await fetchJson<NFTDetailResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            chainId,
            list,
        }),
        context: c,
    });
    return response.data?.map(adjustAssetUris);
}

export async function getNftDetail(chainId: number, address: string, tokenId: string, c: Context) {
    const nfts = await getNFTDetails(chainId, [{ contract_address: address, token_id: tokenId }], c);
    return first(nfts);
}
