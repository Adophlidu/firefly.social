import { type Locale, type SocialSource, Source } from '@/constants/enum.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { queryMutedProfiles } from '@/services/queryMutedProfiles.js';

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

export async function getSuggestedFollowsInCard(source: SocialSource, queryStats?: boolean) {
    const provider = resolveSocialMediaProvider(source, { [Source.Twitter]: 'twitter' });
    const session = getSessionFromStorageBySource(source);
    const result = await getProfilesWithFixedTotal(
        (indicator) => provider.getSuggestedFollows(indicator, queryStats),
        (oldData, newData) =>
            [
                ...oldData,
                ...newData.filter((item) => {
                    return (
                        !item.viewerContext?.blocking &&
                        !item.viewerContext?.following &&
                        session?.profileId !== item.profileId
                    );
                }),
            ].slice(0, 50),
        50,
    );
    await queryMutedProfiles(result.data.map((x) => ({ source: x.source, id: x.profileId })));
    return result.data ?? [];
}

export async function getSuggestedFollowsInPage(
    source: SocialSource,
    indicator?: PageIndicator,
    queryStats?: boolean,
    locale?: Locale,
) {
    const session = getSessionFromStorageBySource(source);
    const provider = resolveSocialMediaProvider(source);
    return getProfilesWithFixedTotal(
        (indicator) => provider.getSuggestedFollows(indicator, queryStats, locale),
        (oldData, newData) => [
            ...oldData,
            ...newData.filter(
                (x) => !x.viewerContext?.blocking && !x.viewerContext?.following && session?.profileId !== x.profileId,
            ),
        ],
        1,
        indicator,
    );
}
