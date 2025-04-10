import { useQuery } from '@tanstack/react-query';
import { compact, uniqBy } from 'lodash-es';
import { useDebounce } from 'usehooks-ts';

import { FF_GARDEN_CHANNEL, HOME_CHANNEL, HOME_CLUB } from '@/constants/channel.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { SORTED_CHANNEL_SOURCES } from '@/constants/index.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';

interface SearchExtraOptions {
    hasRedPacket: boolean;
    profileId?: string;
}

const PROFILE_CHANNELS_LIMIT = 10;

async function searchChannels(source: SocialSource, keyword: string, { hasRedPacket, profileId }: SearchExtraOptions) {
    const provider = resolveSocialMediaProvider(source);
    if (!keyword && profileId) {
        const profileChannels = await provider.getChannelsByProfileId(profileId);
        const commonChannels =
            source === Source.Farcaster
                ? [
                      ...profileChannels.data.slice(0, PROFILE_CHANNELS_LIMIT),
                      ...(await provider.discoverChannels()).data,
                  ].filter((x) => !x.unavailable)
                : profileChannels.data.filter((x) => !x.unavailable);

        if (source === Source.Farcaster) {
            return uniqBy(
                compact([
                    HOME_CHANNEL,
                    hasRedPacket
                        ? {
                              ...FF_GARDEN_CHANNEL,
                              followerCount: (await provider.getChannelById(FF_GARDEN_CHANNEL.id)).followerCount,
                          }
                        : null,
                    ...commonChannels,
                ]),
                'id',
            );
        } else if (source === Source.Lens) {
            return uniqBy(compact([HOME_CLUB, ...commonChannels]), 'id');
        }
        return uniqBy(compact(commonChannels), 'id');
    }
    const response = await provider.searchChannels(keyword);
    return response.data.filter((x) => !x.unavailable);
}

export function useSearchChannels(keyword: string, source: SocialSource, hasRedPacket: boolean) {
    const debouncedKeyword = useDebounce(keyword, 300);
    const profilesAll = useCurrentProfilesAll();
    const profileIds = SORTED_CHANNEL_SOURCES.map((x) => profilesAll[x]?.profileId);

    return useQuery({
        queryKey: ['search-channels', source, debouncedKeyword, profileIds, hasRedPacket],
        queryFn: async () => {
            return searchChannels(source, debouncedKeyword, {
                hasRedPacket,
                profileId: profilesAll[source]?.profileId,
            });
        },
    });
}
