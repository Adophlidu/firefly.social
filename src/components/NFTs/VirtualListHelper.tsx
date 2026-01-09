import { SingleNFTFeed } from '@/components/NFTs/SingleNFTFeed.js';
import { type NFTFeedV3 } from '@/providers/types/NFTs.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function getSingleNFTFeedItemContent(
    index: number,
    feed: NFTFeedV3,
    chainId: EthereumChainId,
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
    const chainId = nft.chain_id ?? EthereumChainId.Mainnet;

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
