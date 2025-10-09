'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { type GridItemProps, type GridListProps } from 'react-virtuoso';

import { ChainIcon } from '@/components/ChainIcon.js';
import { GridListInPage } from '@/components/GridListInPage.js';
import { Link } from '@/components/Link.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { NFTImage } from '@/components/NFTImage.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveNFTImageUrl } from '@/helpers/resolveNFTImageUrl.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';

function getNFTItemContent(id: string, nft: NFTDetail) {
    const chainId = nft.chain_id;

    const content = (
        <>
            <div className="relative aspect-square h-auto w-full overflow-hidden">
                <NFTImage
                    src={resolveNFTImageUrl(nft)! || nft.collection.large_image_url}
                    alt={nft.name}
                    width={500}
                    height={500}
                    className="h-full w-full rounded-lg object-cover"
                />
                {chainId ? <ChainIcon size={20} chainId={chainId} className="absolute left-1 top-1" /> : null}
            </div>
            <div className="mt-1 line-clamp-2 h-8 w-full px-1 text-center text-xs leading-4 sm:mt-2 sm:px-2 sm:py-0">
                {nft.name || nft.collection.name}
            </div>
        </>
    );

    const tokenId = isValidChainIdSolana(chainId) ? '0' : nft.token_id;

    return (
        <div className="relative flex cursor-pointer flex-col rounded-lg bg-bg pb-1 sm:rounded-2xl">
            {chainId ? (
                <Link className="h-full w-full" href={resolveNFTUrl(chainId, nft.contract_address, tokenId)}>
                    {content}
                </Link>
            ) : (
                content
            )}
            <BookmarkInIcon className="absolute right-1 top-1" nftId={id} bookmarked small tooltip strict />
        </div>
    );
}

function GridList({ className, children, ...props }: GridListProps) {
    return (
        <div
            {...props}
            className={classNames('grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 md:grid-cols-4', className)}
        >
            {children}
        </div>
    );
}

function GridItem({ children, ...props }: GridItemProps) {
    return <div {...props}>{children}</div>;
}

function NFTBookmarkListContent() {
    const profileIds = useCurrentProfileIds();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bookmarks', Source.NFTs, profileIds],
        queryFn: async ({ pageParam }) => {
            try {
                return await FireflySocialMediaProvider.getNFTBookmarks(createIndicator(undefined, pageParam));
            } catch (error) {
                enqueueMessageFromError(error, <Trans>Failed to fetch bookmarks.</Trans>);
                throw error;
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => compact(data.pages.flatMap((x) => x?.data)),
    });

    return (
        <GridListInPage
            queryResult={queryResult}
            VirtualGridListProps={{
                components: {
                    List: GridList,
                    Item: GridItem,
                },
                itemContent: (index, item) => getNFTItemContent(item.id, item.nft),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}

export function NFTBookmarkList() {
    return (
        <LoginRequiredGuard source={Source.Polymarket}>
            <NFTBookmarkListContent />
        </LoginRequiredGuard>
    );
}
