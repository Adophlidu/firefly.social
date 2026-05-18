import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import urlcat from 'urlcat';
import { useDebounceValue } from 'usehooks-ts';

import { FF_GARDEN_CHANNEL, HOME_CHANNEL, HOME_CLUB } from '@/constants/channel.js';
import { SORTED_CHANNEL_SOURCES } from '@/constants/computed.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { formatChannelFromOrb } from '@/providers/lens/formatChannelFromOrb.js';
import type { GetClubsData, SearchClubsData } from '@/providers/orb/type.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import type { ResponseJson } from '@/types/utility.js';

interface SearchExtraOptions {
    hasRedPacket: boolean;
    profileId?: string;
    selectedChannel?: Channel | null;
}

const PROFILE_CHANNELS_LIMIT = 10;
const LENS_CLUBS_LIMIT = 100;

function getLensTokenHeaders() {
    const session = getSessionFromStorage(SessionType.Lens);
    return session?.token
        ? {
              'x-access-token': `Bearer ${session.token}`,
          }
        : undefined;
}

async function fetchLensClubSection(category: 'MY_ADMIN_CLUBS' | 'MY_CLUBS') {
    const headers = getLensTokenHeaders();
    if (!headers) return EMPTY_LIST as Channel[];

    const response = await fetchJson<ResponseJson<GetClubsData>>(
        urlcat('/api/orb/get-clubs', {
            category,
            cursor: 0,
            limit: LENS_CLUBS_LIMIT,
        }),
        { headers },
    );
    const data = resolveResponseData(response, 'Failed to fetch Lens clubs');
    return data.items.flatMap((section) => section.items).map((club) => formatChannelFromOrb(club));
}

async function searchLensClubsFromOrb(keyword: string) {
    const headers = getLensTokenHeaders();
    if (!headers) return EMPTY_LIST as Channel[];

    const response = await fetchJson<ResponseJson<SearchClubsData>>(
        urlcat('/api/orb/search-clubs', {
            q: keyword,
            skip: 0,
            limit: LENS_CLUBS_LIMIT,
        }),
        { headers },
    );
    const data = resolveResponseData(response, 'Failed to search Lens clubs');
    return data.items.map((club) => formatChannelFromOrb(club));
}

function orderLensClubs({
    selectedChannel,
    adminClubs,
    joinedClubs,
}: {
    selectedChannel?: Channel | null;
    adminClubs: Channel[];
    joinedClubs: Channel[];
}) {
    const channels: Channel[] = [];
    const seen = new Set<string>();

    const add = (channel: Channel | null | undefined) => {
        if (!channel || channel.unavailable) return;
        const key = channel.id.toLowerCase();
        if (seen.has(key)) return;
        channels.push(channel);
        seen.add(key);
    };

    add(HOME_CLUB);
    if (selectedChannel?.id !== HOME_CLUB.id) add(selectedChannel);
    adminClubs.forEach(add);
    joinedClubs.forEach(add);

    return channels;
}

async function searchChannels(
    source: SocialSource,
    keyword: string,
    { hasRedPacket, profileId, selectedChannel }: SearchExtraOptions,
) {
    const provider = resolveSocialMediaProvider(source);
    if (source === Source.Lens && keyword) {
        try {
            const channels = await searchLensClubsFromOrb(keyword);
            if (channels.length) return channels.filter((x) => !x.unavailable);
        } catch {
            // Fall back to the Lens provider below if the Orb search endpoint is unavailable.
        }
    }

    if (source === Source.Lens && !keyword) {
        const [adminClubs, joinedClubs] = await Promise.allSettled([
            fetchLensClubSection('MY_ADMIN_CLUBS'),
            fetchLensClubSection('MY_CLUBS'),
        ]);

        return orderLensClubs({
            selectedChannel,
            adminClubs: adminClubs.status === 'fulfilled' ? adminClubs.value : EMPTY_LIST,
            joinedClubs: joinedClubs.status === 'fulfilled' ? joinedClubs.value : EMPTY_LIST,
        });
    }

    if (!keyword && profileId) {
        const isFarcaster = source === Source.Farcaster;
        const promises: Array<Promise<Channel[]>> = [];
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
            promises.unshift(Promise.resolve([HOME_CHANNEL]));
        }
        const results = await Promise.allSettled(promises);
        const channels = results.flatMap((x) => (x.status === 'fulfilled' ? x.value : []));
        return uniqBy(channels, (x) => x.id);
    }
    const response = await provider.searchChannels(keyword);
    return response.data.filter((x) => !x.unavailable);
}

export function useSearchChannels(
    keyword: string,
    source: SocialSource,
    hasRedPacket: boolean,
    selectedChannel?: Channel | null,
) {
    const [debouncedKeyword] = useDebounceValue(keyword, 300);
    const profilesAll = useCurrentProfilesAll();
    const profileIds = SORTED_CHANNEL_SOURCES.map((x) => profilesAll[x]?.profileId);

    return useQuery({
        queryKey: ['search-channels', source, debouncedKeyword, profileIds, hasRedPacket, selectedChannel?.id],
        queryFn: async () => {
            return searchChannels(source, debouncedKeyword, {
                hasRedPacket,
                profileId: profilesAll[source]?.profileId,
                selectedChannel,
            });
        },
    });
}
