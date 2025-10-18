import { motion } from 'framer-motion';
import { first, isUndefined } from 'lodash-es';
import { memo } from 'react';
import type { Address } from 'viem';

import { NFTsActivityCellAction } from '@/components/ActivityCell/NFTs/NFTsActivityCellAction.js';
import { NFTsActivityCellCard } from '@/components/ActivityCell/NFTs/NFTsActivityCellCard.js';
import { Avatar } from '@/components/Avatar.js';
import { FeedFollowSource } from '@/components/FeedFollowSource.js';
import { Link } from '@/components/Link.js';
import { NFTFeedHeader } from '@/components/NFTs/NFTFeedHeader.js';
import { Source } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { type FollowingNFT, type NFTFeedV3 } from '@/providers/types/NFTs.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface SingleNFTFeedProps {
    disableAnimate?: boolean;
    listKey?: string;
    index?: number;
    feed: NFTFeedV3;
    chainId: EthereumChainId;
    time: number | string | Date;
    followingSources?: FollowingNFT['followingSources'];
}

export const SingleNFTFeed = memo(function SingleNFTFeed({
    feed,
    chainId,
    disableAnimate,
    listKey,
    index,
    time,
    followingSources,
}: SingleNFTFeedProps) {
    const setScrollIndex = useGlobalState.use.setScrollIndex();
    const router = useRouter();
    const tokenId = feed.detail?.token_id!;
    const nftUrl = feed.contract_address ? resolveNFTUrl(chainId, feed.contract_address, tokenId) : null;

    const ownerAddress = feed.owner as Address;
    const displayInfo = feed.displayInfo;
    const authorUrl = getProfileUrl({ source: Source.Wallet, profileId: ownerAddress });

    return (
        <motion.article
            initial={!disableAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cursor-pointer border-b border-line bg-bottom px-3 py-2 hover:bg-bg max-md:px-4 max-md:py-3 md:px-4 md:py-3"
            onClick={() => {
                const selection = window.getSelection();
                if (selection && selection.toString().length !== 0) return;
                if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
                if (nftUrl) router.push(nftUrl);
            }}
            onMouseEnter={() => {
                if (nftUrl) router.prefetch(nftUrl);
            }}
        >
            <FeedFollowSource source={first(followingSources)} />
            <div className="flex gap-3">
                <Link href={authorUrl} className="z-1 shrink-0" onClick={stopPropagation}>
                    <Avatar
                        className="size-10"
                        src={getWalletProfileAvatar(displayInfo)}
                        size={40}
                        alt={ownerAddress}
                    />
                </Link>
                <article className="min-w-0 grow">
                    <NFTFeedHeader
                        className="mb-2"
                        address={ownerAddress}
                        contractAddress={feed.contract_address as Address}
                        tokenId={tokenId}
                        chainId={chainId}
                        ens={displayInfo.ensHandle}
                        time={time}
                    />
                    <NFTsActivityCellAction chainId={chainId} tokenId={tokenId} tokenCount={1} feed={feed} />
                    <div className="mt-1.5 flex w-full space-x-3 overflow-x-auto overflow-y-hidden">
                        <NFTsActivityCellCard
                            key={`${tokenId}-${feed.contract_address}-${chainId}`}
                            chainId={chainId}
                            tokenId={tokenId}
                            feed={feed}
                        />
                    </div>
                </article>
            </div>
        </motion.article>
    );
});
