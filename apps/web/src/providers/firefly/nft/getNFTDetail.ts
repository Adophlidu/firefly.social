import { getNFTDetails } from '@/providers/firefly/nft/getNFTDetails.js';

export async function getNFTDetail(chainId: number, contractAddress: string, tokenId: string) {
    const nfts = await getNFTDetails(chainId, [{ contract_address: contractAddress, token_id: tokenId }]);
    return nfts[0];
}
