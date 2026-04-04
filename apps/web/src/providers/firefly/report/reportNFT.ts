import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

/**
 * Reports a scam NFT to NFTScan
 */
export async function reportNFT(chainId: number, address: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/reportNFT', {
        chainId,
        contractAddress: address,
    });
    await fireflySessionHolder.fetchWithSession(url);
}
