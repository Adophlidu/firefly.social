import urlcat from 'urlcat';

import { fetchSquashedJSON } from '@/helpers/fetchJSON.js';

export const NFTSCAN_URL = 'https://nftscan-proxy.r2d2.to';

export async function fetchFromNFTScan<T>(pathname: string, chainId?: number, init?: RequestInit) {
    return fetchSquashedJSON<T>(urlcat(NFTSCAN_URL, pathname), {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...init?.headers,
            ...(chainId ? { 'x-app-chainid': chainId.toString() } : {}),
        },
        cache: 'no-cache',
    });
}
