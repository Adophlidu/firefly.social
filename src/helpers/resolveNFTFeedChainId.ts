import type { NFTFeed } from '@/providers/types/NFTs.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

export function resolveNFTFeedChainId(feed: NFTFeed) {
    // TODO: Now all feeds are on mainnet, replace this in needed
    return EthereumChainId.Mainnet;
}
