'use client';

import ProtectedIcon from '@dimensiondev/assets/protected.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { ScrollListKey, SocialProfileCategory, Source } from '@dimensiondev/enums';
import { classNames, createIndicator, createPageable } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import type { GridItemProps, GridListProps } from 'react-virtuoso';

import { ProtectedPostsMessage } from '@/components/fallbacks/ProtectedPostsMessage.js';
import { GridListInPage } from '@/components/GridListInPage.js';
import { TwitterMediaGalleryItem } from '@/components/Profile/TwitterMediaGalleryItem.js';
import { hasPostPreviewAttachments } from '@/helpers/getPostPreviewAttachments.js';
import { getPostsSelector } from '@/helpers/getPostsSelector.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useIsProfileProtected } from '@/hooks/useIsProfileProtected.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function GridList({ className, children, ...props }: GridListProps) {
    return (
        <div {...props} className={classNames('grid grid-cols-3 gap-1', className)}>
            {children}
        </div>
    );
}

function GridItem({ children, ...props }: GridItemProps) {
    return <div {...props}>{children}</div>;
}

const TwitterMediaGalleryGridComponents = {
    List: GridList,
    Item: GridItem,
};

function getTwitterMediaGalleryItemContent(_: number, post: Post) {
    return <TwitterMediaGalleryItem post={post} />;
}

interface TwitterMediaGalleryListProps {
    profileId: string;
}

export function TwitterMediaGalleryList({ profileId }: TwitterMediaGalleryListProps) {
    const isProtected = useIsProfileProtected(Source.Twitter, profileId);
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['posts', Source.Twitter, 'posts-of', 'medias', profileId],
        queryFn: async ({ pageParam }) => {
            if (!profileId) return createPageable<Post>(EMPTY_LIST, createIndicator());

            const provider = resolveSocialMediaProvider(Source.Twitter, { [Source.Twitter]: 'nitter' });
            return provider.getMediaPostsByProfileId(profileId, createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) => getPostsSelector(Source.Twitter)(data).filter(hasPostPreviewAttachments),
    });

    return (
        <GridListInPage
            queryResult={queryResult}
            className="mt-2"
            NoResultsFallbackProps={{
                className: 'mt-20',
                icon: isProtected ? <ProtectedIcon width={190} height={50} className="text-third" /> : undefined,
                message: isProtected ? <ProtectedPostsMessage /> : undefined,
            }}
            VirtualGridListProps={{
                listKey: `${ScrollListKey.Profile}:${SocialProfileCategory.Media}:${profileId}`,
                components: TwitterMediaGalleryGridComponents,
                computeItemKey: (index, post) => `${post.postId}-${index}`,
                itemContent: getTwitterMediaGalleryItemContent,
            }}
        />
    );
}
