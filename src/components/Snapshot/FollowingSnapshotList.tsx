'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { ListInPage } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { getSnapshotItemContent } from '@/components/VirtualList/getSnapshotItemContent.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { FireflySocialMediaProvider } from '@/providers/firefly/SocialMedia.js';

export function FollowingSnapshotList({ walletAddresses }: { walletAddresses?: string[] }) {
    const account = useAccount();
    const profileIds = useCurrentProfileIds();

    const queryKey = walletAddresses
        ? ['snapshots', account.address, 'snapshots-of', ...walletAddresses, profileIds]
        : ['snapshots', account.address, 'following', Source.DAOs, profileIds];

    const queryResult = useSuspenseInfiniteQuery({
        queryKey,
        networkMode: 'always',
        queryFn: async ({ pageParam }) => {
            if (!profileIds.length) return;

            return FireflySocialMediaProvider.getFollowingSnapshotActivity({
                indicator: createIndicator(undefined, pageParam),
                walletAddresses,
            });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x?.data ?? []),
    });

    if (!profileIds.length) {
        return <NotLoginFallback source={Source.DAOs} className="md:!pt-0" />;
    }

    return (
        <ListInPage
            source={Source.DAOs}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Following}:${Source.DAOs}`,
                computeItemKey: (index, snapshot) => `${snapshot.id}-${index}`,
                itemContent: (index, snapshot) => getSnapshotItemContent(index, snapshot),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
