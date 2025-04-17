import urlcat from 'urlcat';

import { EthereumChainId } from '#masknet/web3-shared-evm';

export function resolveNFTUrl(chainId: EthereumChainId | string | number, address: string, tokenId?: string) {
    const basePath = address ? '/nft/:chainId/:address' : '/nft/:chainId';
    if (tokenId) {
        return urlcat(`${basePath}/:tokenId`, {
            tokenId,
            address,
            chainId,
        });
    }
    return urlcat(basePath, {
        address,
        chainId,
    });
}

export function resolveNFTUrlByCollection(collectionId: string, tokenId?: string) {
    const basePath = '/nft/:collectionId';
    if (tokenId) {
        return urlcat(`${basePath}/:tokenId`, {
            tokenId,
            collectionId,
        });
    }
    return urlcat(basePath, {
        collectionId,
    });
}
