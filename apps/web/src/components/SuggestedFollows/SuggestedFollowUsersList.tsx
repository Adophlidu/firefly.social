'use client';

import { Source } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { createIndicator, type Pageable, type PageIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { sum, uniqBy } from 'lodash-es';
import { memo, useMemo } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Loading } from '@/components/Loading.js';
import { ProfileInList } from '@/components/ProfileInList.js';
import { ScrollListKey, type SocialSource } from '@/constants/enum.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { getSuggestedFollowsInPage } from '@/services/getSuggestedFollows.js';
import { queryMutedProfiles } from '@/services/queryMutedProfiles.js';

interface Props {
    source: SocialSource;
}

function getSuggestedFollowUserInList(index: number, profile: Profile) {
    return <ProfileInList profile={profile} key={`${profile.profileId}-${index}`} watchingFollowStatus />;
}

const SuggestedFollowers = memo<Props>(function SuggestedFollowers({ source }) {
    const profile = useCurrentProfile(source);
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['suggested-follows', source, profile?.profileId],
        queryFn: async ({ pageParam }) => {
            const result = await getSuggestedFollowsInPage(source, {
                viewerId: profile?.profileId,
                indicator: createIndicator(undefined, pageParam),
                queryStats: true,
            });
            if (source === Source.Twitter && !!profile?.profileId) return result;

            await runInSafeAsync(() =>
                queryMutedProfiles(result.data.map((x) => ({ source: x.source, id: x.profileId }))),
            );
            return result;
        },
        staleTime: 60 * 1000,
        initialPageParam: '',
        getNextPageParam: (
            lastPage: Pageable<Profile, PageIndicator>,
            allPages: Array<Pageable<Profile, PageIndicator>>,
        ) => {
            const total = sum(allPages.map((x) => x.data.length));
            if (total >= 200) return undefined;
            return (lastPage as Pageable<Profile, PageIndicator>)?.nextIndicator?.id;
        },
        select: (data) =>
            uniqBy(
                data.pages.flatMap((page) => page?.data ?? []),
                (x) => x.profileId,
            ),
    });

    const listContext = useMemo(
        () => ({
            footerText:
                source === Source.Twitter ? (
                    <>
                        <Image width={80} height={24} alt="rootdata" src="/image/rootdata.png" />
                        <span>
                            <Trans>
                                Top 200 Web3 profiles powered by{' '}
                                <Link href="https://www.rootdata.com/people" className="text-link hover:underline">
                                    Rootdata
                                </Link>
                            </Trans>
                        </span>
                    </>
                ) : null,
        }),
        [source],
    );
    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                key: `${ScrollListKey.SuggestedUsers}:${source}`,
                computeItemKey: (index, item) => `${item.profileId}-${index}`,
                itemContent: (index, item) => getSuggestedFollowUserInList(index, item),
                context: listContext,
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
});

export function SuggestedFollowUsersList({ source }: Props) {
    const asyncStatus = useAsyncStatus(source);
    if (asyncStatus) return <Loading />;
    return <SuggestedFollowers source={source} />;
}
