'use client';

import { msg, t } from '@lingui/core/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import type { GridItemProps, GridListProps } from 'react-virtuoso';

import { GridListInPage } from '@/components/GridListInPage.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveNFTImageUrl } from '@/helpers/resolveNFTImageUrl.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { resolveSimpleHashChainId } from '@/helpers/resolveSimpleHashChain.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useNavigatorTitle } from '@/hooks/useNavigatorTitle.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';
import type { SimpleHash } from '@/providers/simplehash/type.js';

function getNFTItemContent(id: string, nft: SimpleHash.NFT) {
    const chainId = resolveSimpleHashChainId(nft.chain);

    const content = (
        <>
            <div className="relative aspect-square h-auto w-full overflow-hidden">
                <Image
                    src={resolveNFTImageUrl(nft)}
                    alt={nft.name}
                    width={500}
                    height={500}
                    className="h-full w-full rounded-lg object-cover"
                />
                {chainId ? <ChainIcon size={20} chainId={chainId} className="absolute left-1 top-1" /> : null}
            </div>
            <div className="mt-1 line-clamp-2 h-8 w-full px-1 text-center text-xs leading-4 sm:mt-2 sm:px-2 sm:py-0">
                {nft.name}
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

export function NFTBookmarkList() {
    const isLogin = useIsLogin();
    const profileIds = useCurrentProfileIds();

    useNavigatorTitle(msg`NFT bookmarks`);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bookmarks', Source.NFTs, profileIds],
        queryFn: async ({ pageParam }) => {
            if (!isLogin) return;
            try {
                return await FireflySocialMediaProvider.getNFTBookmarks(createIndicator(undefined, pageParam));
            } catch (error) {
                enqueueMessageFromError(error, t`Failed to fetch bookmarks.`);
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

    if (!isLogin) {
        return <NotLoginFallback source={Source.Polymarket} />;
    }

    return (
        <GridListInPage
            queryResult={queryResult}
            VirtualGridListProps={{
                components: {
                    List: GridList,
                    Item: GridItem,
                },
                itemContent: (index, item) => {
                    return getNFTItemContent(item.id, item.nft);
                },
            }}
        />
    );
}
