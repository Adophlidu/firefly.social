import { fetchFromNFTScan } from '@/providers/nft-scan/fetchFromNFTScan.js';
import type { GetCollectionResponse, NFTScan } from '@/providers/types/NFTScan.js';

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
