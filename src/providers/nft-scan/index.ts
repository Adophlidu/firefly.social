import urlcat from 'urlcat';

import { fetchSquashedJSON } from '@/helpers/fetchJSON.js';
import type { GetCollectionResponse, NFTScan } from '@/providers/types/NFTScan.js';

async function fetchFromNFTScan<T>(pathname: string, chainId?: number, init?: RequestInit) {
    return fetchSquashedJSON<T>(urlcat(pathname, { chainId }), {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...init?.headers,
            ...(chainId ? { 'x-app-chainid': chainId.toString() } : {}),
        },
        cache: 'no-cache',
    });
}

class NFTScanFactory {
    async getCollectionByAddress(address: string, chainId?: number, signal?: AbortSignal) {
        const response = await fetchFromNFTScan<GetCollectionResponse>(`/api/v2/collections/${address}`, chainId, {
            signal,
        });

        return response?.data
            ? ({
                  ...response.data,
                  chain_id: chainId,
              } as NFTScan.Collection)
            : null;
    }
}

export const NFTScanProvider = new NFTScanFactory();
