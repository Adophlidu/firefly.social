export function parseOldNftUrl(url: URL) {
    if (!/^\/nft\/0x[a-fA-F0-9]{40}/.test(url.pathname)) return null;
    const [, , address, tokenId] = url.pathname.split('/');
    const chainId = Number.parseInt(url.searchParams.get('chainId') ?? '1', 10);
    if (!chainId) return null;
    if (tokenId) {
        return {
            address,
            tokenId,
            chainId,
        };
    }
    return {
        address,
        chainId,
    };
}
