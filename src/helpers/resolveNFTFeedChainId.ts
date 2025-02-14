import { ChainId } from '@masknet/web3-shared-evm';

import type { NFTFeed } from '@/providers/types/NFTs.js';

export function resolveNFTFeedChainId(feed: NFTFeed) {
    // TODO: Now all feeds are on mainnet, replace this in needed
    return ChainId.Mainnet;
}
