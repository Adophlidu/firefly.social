import { EMPTY_LIST } from '@dimensiondev/constants';
import { SORTED_CHANNEL_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { GroupsOrderBy, PageSize } from '@lens-protocol/client';
import { fetchGroups } from '@lens-protocol/client/actions';
import { useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { useDebounceValue } from 'usehooks-ts';

import { FF_GARDEN_CHANNEL, HOME_CHANNEL, HOME_CLUB } from '@/constants/channel.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensChannelFromGroup } from '@/providers/lens/formatLensChannel.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface SearchExtraOptions {
    hasRedPacket: boolean;
    profileId?: string;
    selectedChannel?: Channel | null;
}

const PROFILE_CHANNELS_LIMIT = 10;

async function fetchLensManagedClubs(profileId: string | undefined) {
    if (!profileId) return EMPTY_LIST as Channel[];

    const result = await ensureLensResult(
        fetchGroups(getLensClient(), {
            pageSize: PageSize.Fifty,
            orderBy: GroupsOrderBy.LatestFirst,
            filter: {
                managedBy: {
                    address: safeEvmAddress(profileId),
                },
            },
        }),
    );

    return result.items.map(formatLensChannelFromGroup);
}

async function fetchLensJoinedClubs(profileId?: string) {
    if (!profileId) return EMPTY_LIST as Channel[];

    const result = await ensureLensResult(
        fetchGroups(getLensClient(), {
            pageSize: PageSize.Fifty,
            orderBy: GroupsOrderBy.LatestFirst,
            filter: {
                member: safeEvmAddress(profileId),
            },
        }),
    );
    return result.items.map(formatLensChannelFromGroup);
}

async function searchLensClubsFromLens(keyword: string) {
    const result = await ensureLensResult(
        fetchGroups(getLensClient(), {
            pageSize: PageSize.Fifty,
            orderBy: GroupsOrderBy.LatestFirst,
            filter: {
                searchQuery: keyword,
            },
        }),
    );
    return result.items.map(formatLensChannelFromGroup);
}

function orderLensClubs({
    selectedChannel,
    ownedClubs,
    adminClubs,
    joinedClubs,
}: {
    selectedChannel?: Channel | null;
    ownedClubs: Channel[];
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
    ownedClubs.forEach(add);
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
        const results = await searchLensClubsFromLens(keyword).catch(() => EMPTY_LIST);
        return uniqBy(
            results.filter((x) => !x.unavailable),
            (x) => x.id.toLowerCase(),
        );
    }

    if (source === Source.Lens && !keyword) {
        const [lensOwnedClubs, lensJoinedClubs] = await Promise.allSettled([
            fetchLensManagedClubs(profileId),
            fetchLensJoinedClubs(profileId),
        ]);

        return orderLensClubs({
            selectedChannel,
            ownedClubs: lensOwnedClubs.status === 'fulfilled' ? lensOwnedClubs.value : EMPTY_LIST,
            adminClubs: lensOwnedClubs.status === 'fulfilled' ? lensOwnedClubs.value : EMPTY_LIST,
            joinedClubs: lensJoinedClubs.status === 'fulfilled' ? lensJoinedClubs.value : EMPTY_LIST,
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
