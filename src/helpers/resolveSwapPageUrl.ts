import urlcat from 'urlcat';

export function resolveSwapPageUrl(hash: string, chainId: number) {
    return urlcat('/swap/:chainId/:hash', {
        hash,
        chainId,
    });
}
