import { fetchFromNFTScan } from '@/providers/nft-scan/fetchFromNFTScan.js';
import type { GetCollectionResponse } from '@/providers/types/NFTScan.js';

class NFTScan {
    async getCollectionByAddress(address: string, chainId?: number) {
        const response = await fetchFromNFTScan<GetCollectionResponse>(`/api/v2/collections/${address}`, chainId);

        return response?.data || null;
    }
}

export const NFTScanProvider = new NFTScan();
