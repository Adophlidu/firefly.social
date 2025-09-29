import { resolveNFTDataFromUrl } from '@/helpers/resolveNFTDataFromUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';

export async function getNFTFromUrl(url: string) {
    const nftParams = resolveNFTDataFromUrl(url);
    if (!nftParams || !NFTSCAN_CHAIN_IDS.includes(nftParams.chainId)) return;

    return FireflyEndpointProvider.getNFTDetail(nftParams.chainId, nftParams.address, nftParams.tokenId);
}
