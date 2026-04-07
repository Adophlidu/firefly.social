import urlcat from 'urlcat';

export function resolveNFTUrl(chainId: string | number, address: string, tokenId?: string) {
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
