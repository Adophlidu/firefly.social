import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { MutedProfileItem } from '@/components/Profile/MutedProfileItem.js';
import { ScrollListKey, type SocialSource, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { getBlockedProfiles } from '@/services/getBlockedProfiles.js';

interface MutedProfilesProps {
    source: SocialSource;
}

const getProfileItemContent = (index: number, profile: Profile, listKey: string) => {
    return <MutedProfileItem profile={profile} key={`${listKey}-${index}`} />;
};

export function MutedProfiles({ source }: MutedProfilesProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['profiles', source, 'muted-list'],
        staleTime: 0,
        queryFn: async ({ pageParam }) => {
            const provider = resolveSocialMediaProvider(source);
            const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
            if ([Source.Twitter, Source.Bsky].includes(source)) return provider.getBlockedProfiles(indicator);
            return getBlockedProfiles(indicator, resolveSocialSourceInUrl(source));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    return (
        <ListInPage
            source={source}
            key={source}
            queryResult={queryResult}
            className="no-scrollbar"
            VirtualListProps={{
                useWindowScroll: false,
                listKey: `${ScrollListKey.Profile}:muted`,
                computeItemKey: (index, profile) => `${profile.profileId}-${index}`,
                itemContent: (index, profile) =>
                    getProfileItemContent(index, profile, `${ScrollListKey.Profile}:muted`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
