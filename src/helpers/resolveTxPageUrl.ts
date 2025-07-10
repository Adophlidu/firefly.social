import urlcat from 'urlcat';

export function resolveTxPageUrl(hash: string, chainId: number) {
    return urlcat('/tx/:chainId/:hash', {
        hash,
        chainId,
    });
}
