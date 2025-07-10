import { type SocialSource, Source } from '@/constants/enum.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { getBskySuggestedUsers } from '@/services/getBskySuggestedUsers.js';

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

export async function getSuggestedFollowsInCard(source: SocialSource) {
    const provider = resolveSocialMediaProvider(source, { [Source.Twitter]: 'twitter' });
    const currentProfile = getCurrentProfile(source);
    const result = await getProfilesWithFixedTotal(
        source === Source.Bsky ? getBskySuggestedUsers : provider.getSuggestedFollows.bind(provider),
        (oldData, newData) =>
            [
                ...oldData,
                ...newData.filter((item) => {
                    return (
                        !item.viewerContext?.blocking &&
                        !item.viewerContext?.following &&
                        currentProfile?.profileId !== item.profileId
                    );
                }),
            ].slice(0, 50),
        50,
    );

    return result.data ?? [];
}

export async function getSuggestedFollowsInPage(source: SocialSource, indicator?: PageIndicator) {
    const currentProfile = getCurrentProfile(source);
    const provider = resolveSocialMediaProvider(source, { [Source.Twitter]: 'twitter' });
    return getProfilesWithFixedTotal(
        provider.getSuggestedFollows.bind(provider),
        (oldData, newData) => [
            ...oldData,
            ...newData.filter(
                (x) =>
                    !x.viewerContext?.blocking &&
                    !x.viewerContext?.following &&
                    currentProfile?.profileId !== x.profileId,
            ),
        ],
        1,
        indicator,
    );
}
