import { mainnet } from 'viem/chains';

import { SingleNFTFeed } from '@/components/NFTs/SingleNFTFeed.js';
import type { NFTFeedV3 } from '@/providers/types/NFTs.js';

export function getSingleNFTFeedItemContent(
    index: number,
    feed: NFTFeedV3,
    chainId: number,
    {
        listKey,
    }: {
        listKey?: string;
    } = {},
) {
    return (
        <SingleNFTFeed
            key={`${feed.chain_id}-${feed.hash}`}
            listKey={listKey}
            chainId={chainId}
            index={index}
            feed={feed}
            time={feed.timestamp}
        />
    );
}

export function getSingleFollowingNFTItemContent(
    index: number,
    nft: NFTFeedV3,
    {
        listKey,
    }: {
        listKey?: string;
    } = {},
) {
    const chainId = nft.chain_id ?? mainnet.id;

    return (
        <SingleNFTFeed
            key={`${nft.chain_id}-${nft.hash}`}
            listKey={listKey}
            chainId={chainId}
            index={index}
            followingSources={nft.followingSources}
            feed={nft}
            time={nft.timestamp}
        />
    );
}
