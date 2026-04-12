import { useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { useDebounceValue } from 'usehooks-ts';

import { FF_GARDEN_CHANNEL, HOME_CHANNEL, HOME_CLUB } from '@/constants/channel.js';
import { SORTED_CHANNEL_SOURCES } from '@/constants/computed.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface SearchExtraOptions {
    hasRedPacket: boolean;
    profileId?: string;
}

const PROFILE_CHANNELS_LIMIT = 10;

async function searchChannels(source: SocialSource, keyword: string, { hasRedPacket, profileId }: SearchExtraOptions) {
    const provider = resolveSocialMediaProvider(source);
    if (!keyword && profileId) {
        const isFarcaster = source === Source.Farcaster;
        const promises: Array<Promise<Channel[]> | Channel> = [];
        const commonChannelsPromise = provider
            .getChannelsByProfileId(
                profileId,
                createIndicator(undefined, undefined, source === Source.Farcaster ? PROFILE_CHANNELS_LIMIT : undefined),
            )
            .then((channels) => (isFarcaster ? channels.data : channels.data.filter((x) => !x.unavailable)));
        promises.push(commonChannelsPromise);

        if (isFarcaster) {
            promises.push(provider.discoverChannels().then((x) => x.data));
            if (hasRedPacket) {
                promises.unshift(
                    Promise.resolve().then(async () => {
                        const followerCount = (await provider.getChannelById(FF_GARDEN_CHANNEL.id)).followerCount;
                        return [{ ...FF_GARDEN_CHANNEL, followerCount }];
                    }),
                );
            }
            promises.unshift(HOME_CHANNEL);
        } else if (source === Source.Lens) {
            promises.unshift(HOME_CLUB);
        }
        const results = await Promise.allSettled(promises);
        const channels = results.flatMap((x) => (x.status === 'fulfilled' ? x.value : []));
        return uniqBy(channels, (x) => x.id);
    }
    const response = await provider.searchChannels(keyword);
    return response.data.filter((x) => !x.unavailable);
}

export function useSearchChannels(keyword: string, source: SocialSource, hasRedPacket: boolean) {
    const [debouncedKeyword] = useDebounceValue(keyword, 300);
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
