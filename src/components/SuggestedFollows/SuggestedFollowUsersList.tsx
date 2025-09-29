'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';

import X3ProIcon from '@/assets/x3pro.svg';
import { Link } from '@/components/Link.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ProfileInList } from '@/components/ProfileInList.js';
import { ScrollListKey, type SocialSource, Source } from '@/constants/enum.js';
import { X3_PRO_URL } from '@/constants/index.js';
import { createIndicator, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { getSuggestedFollowsInPage } from '@/services/getSuggestedFollows.js';

interface Props {
    source: SocialSource;
}

function getSuggestedFollowUserInList(index: number, profile: Profile) {
    return <ProfileInList profile={profile} key={`${profile.profileId}-${index}`} />;
}

export function SuggestedFollowUsersList({ source }: Props) {
    const profile = useCurrentProfile(source);
    const asyncStatus = useAsyncStatus(source);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['suggested-follows', source, profile?.profileId, asyncStatus],
        queryFn({ pageParam }) {
            return getSuggestedFollowsInPage(source, createIndicator(undefined, pageParam), true);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => (lastPage as Pageable<Profile, PageIndicator>)?.nextIndicator?.id,
        select: (data) =>
            uniqBy(
                data.pages.flatMap((page) => page?.data ?? []),
                (x) => x.profileId,
            ),
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            VirtualListProps={{
                key: `${ScrollListKey.SuggestedUsers}:${source}`,
                computeItemKey: (index, item) => `${item.profileId}-${index}`,
                itemContent: (index, item) => getSuggestedFollowUserInList(index, item),
                context: {
                    footerText:
                        source === Source.Twitter ? (
                            <>
                                <X3ProIcon width={18} height={18} className="mr-2.5 shrink-0 text-main" />
                                <span>
                                    <Trans>
                                        Top 100 Web3 profiles powered by{' '}
                                        <Link href={X3_PRO_URL} className="text-link hover:underline">
                                            X3
                                        </Link>
                                    </Trans>
                                </span>
                            </>
                        ) : null,
                },
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
}
