import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { EthereumChainId } from '@dimensiondev/workers-shared/types/ethereum.js';

export function resolveNFTUrl(chainId: EthereumChainId | string | number, address: string, tokenId?: string) {
    const basePath = address ? `/nft/${chainId}/${address}` : `/nft/${chainId}`;
    if (tokenId) return urlcat(basePath, `/${tokenId}`);
    return urlcat(basePath, '');
}
