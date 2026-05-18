import { Source } from '@dimensiondev/enums';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@dimensiondev/utils';

import { queryClient } from '@/configs/queryClient.js';
import type { SocialSource } from '@/constants/enum.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

async function getProfilesWithFixedTotal(
    queryCallback: (indicator?: PageIndicator) => Promise<Pageable<Profile>>,
    compose: (oldData: Profile[], newData: Profile[]) => Profile[],
    total: number,
    initialIndicator?: PageIndicator,
) {
    let data: Profile[] = [];
    let indicator: PageIndicator | undefined = initialIndicator;
    let retry = 10;

    while (data.length < total && retry > 0) {
        const result = await queryCallback(indicator);
        data = compose(data, result.data);
        retry -= 1;
        indicator = result.nextIndicator as PageIndicator;
        if (data.length < total && !indicator) {
            break;
        }
    }

    return createPageable(data, createIndicator(undefined), indicator);
}

function filterSuggestedFollowers(profiles: Profile[], source: SocialSource) {
    const session = getSessionFromStorageBySource(source);

    return profiles.filter(
        (x) => !x.viewerContext?.blocking && !x.viewerContext?.following && session?.profileId !== x.profileId,
    );
}

interface Options {
    viewerId?: string;
    indicator?: PageIndicator;
    queryStats?: boolean;
}

export async function getSuggestedFollowsInCard(source: SocialSource, { viewerId, queryStats }: Options = {}) {
    const provider = resolveSocialMediaProvider(source, { [Source.Twitter]: 'twitter' });
    const result = await getProfilesWithFixedTotal(
        (indicator) => {
            const queryKey: any[] = ['@internal', 'suggested-follows', source, viewerId, indicator?.id || undefined];
            // Only query stats for Bsky, other sources should already include stats
            if (source === Source.Bsky) {
                queryKey.push(queryStats);
            }
            return queryClient.ensureQueryData({
                queryKey,
                staleTime: 60 * 1000,
                queryFn: async function querySuggestedFollowsInCard() {
                    return provider.getSuggestedFollows(queryStats, undefined, indicator);
                },
            });
        },
        (oldData, newData) => [...oldData, ...filterSuggestedFollowers(newData, source)].slice(0, 50),
        50,
    );
    return result.data ?? [];
}

export async function getSuggestedFollowsInPage(
    source: SocialSource,
    { viewerId, indicator, queryStats }: Options = {},
) {
    const provider = resolveSocialMediaProvider(source);
    return getProfilesWithFixedTotal(
        (indicator) => {
            const queryKey: any[] = ['@internal', 'suggested-follows', source, viewerId, indicator?.id || undefined];
            // Only query stats for Bsky, other sources should already include stats
            if (source === Source.Bsky) {
                queryKey.push(queryStats);
            }
            return queryClient.ensureQueryData({
                queryKey,
                staleTime: 60 * 1000,
                queryFn: async function querySuggestedFollowsInPage() {
                    return provider.getSuggestedFollows(queryStats, undefined, indicator);
                },
            });
        },
        (oldData, newData) => [...oldData, ...filterSuggestedFollowers(newData, source)],
        1,
        indicator,
    );
}
