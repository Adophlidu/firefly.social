export function parseOldSwapUrl(url: URL) {
    if (!url.pathname.startsWith('/swap')) return null;
    const [, , chainId, hash] = url.pathname.split('/');

    if (!chainId || !hash) return null;
    return {
        chainId,
        hash,
    };
}
