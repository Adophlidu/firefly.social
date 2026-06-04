import { EMPTY_LIST } from '@dimensiondev/constants';
import { SORTED_CHANNEL_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { type Group, GroupsOrderBy, PageSize } from '@lens-protocol/client';
import { fetchGroups } from '@lens-protocol/client/actions';
import { useQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import urlcat from 'urlcat';
import { useDebounceValue } from 'usehooks-ts';

import { FF_GARDEN_CHANNEL, HOME_CHANNEL, HOME_CLUB } from '@/constants/channel.js';
import { FAKE_REFRESH_TOKEN } from '@/constants/lens.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatChannelFromOrb } from '@/providers/lens/formatChannelFromOrb.js';
import { formatLensChannelFromGroup } from '@/providers/lens/formatLensChannel.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { GetClubsData, SearchClubsData } from '@/providers/orb/type.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';
import type { ResponseJson } from '@/types/utility.js';

interface SearchExtraOptions {
    hasRedPacket: boolean;
    isOrb: boolean;
    profileId?: string;
    selectedChannel?: Channel | null;
}

const PROFILE_CHANNELS_LIMIT = 10;
const LENS_CLUBS_LIMIT = 100;

function getLensTokenHeaders(profileId?: string) {
    const session = profileId ? createLensSession(profileId, lensSessionClientHolder.sessionClient) : null;
    return session?.token
        ? {
              'x-access-token': `Bearer ${session.token}`,
          }
        : undefined;
}

async function fetchOrbClubs(category: 'MY_ADMIN_CLUBS' | 'MY_CLUBS', profileId?: string) {
    const headers = getLensTokenHeaders(profileId);
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

async function searchLensClubsFromOrb(keyword: string, profileId?: string) {
    const headers = getLensTokenHeaders(profileId);
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

async function fetchLensManagedClubs(profileId: string | undefined, includeOwners: boolean) {
    if (!profileId) return EMPTY_LIST as Channel[];

    const result = await ensureLensResult(
        fetchGroups(getLensClient(), {
            pageSize: PageSize.Fifty,
            orderBy: GroupsOrderBy.LatestFirst,
            filter: {
                managedBy: {
                    address: safeEvmAddress(profileId),
                    includeOwners,
                },
            },
        }),
    );

    return result.items
        .filter((group: Group) => !includeOwners || isSameEthereumAddress(group.owner, profileId))
        .map(formatLensChannelFromGroup);
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
    { hasRedPacket, isOrb, profileId, selectedChannel }: SearchExtraOptions,
) {
    const provider = resolveSocialMediaProvider(source);
    if (source === Source.Lens && keyword) {
        const results = await Promise.allSettled([
            searchLensClubsFromOrb(keyword, profileId),
            searchLensClubsFromLens(keyword),
        ]);
        return uniqBy(
            results.flatMap((x) => (x.status === 'fulfilled' ? x.value : EMPTY_LIST)).filter((x) => !x.unavailable),
            (x) => x.id.toLowerCase(),
        );
    }

    if (source === Source.Lens && !keyword) {
        const [orbAdminClubs, orbJoinedClubs, lensOwnedClubs, lensAdminClubs, lensJoinedClubs] =
            await Promise.allSettled([
                isOrb ? fetchOrbClubs('MY_ADMIN_CLUBS', profileId) : EMPTY_LIST,
                isOrb ? fetchOrbClubs('MY_CLUBS', profileId) : EMPTY_LIST,
                fetchLensManagedClubs(profileId, true),
                fetchLensManagedClubs(profileId, false),
                fetchLensJoinedClubs(profileId),
            ]);

        return orderLensClubs({
            selectedChannel,
            ownedClubs: lensOwnedClubs.status === 'fulfilled' ? lensOwnedClubs.value : EMPTY_LIST,
            adminClubs: [
                ...(orbAdminClubs.status === 'fulfilled' ? orbAdminClubs.value : EMPTY_LIST),
                ...(lensAdminClubs.status === 'fulfilled' ? lensAdminClubs.value : EMPTY_LIST),
            ],
            joinedClubs: [
                ...(orbJoinedClubs.status === 'fulfilled' ? orbJoinedClubs.value : EMPTY_LIST),
                ...(lensJoinedClubs.status === 'fulfilled' ? lensJoinedClubs.value : EMPTY_LIST),
            ],
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
    const currentLensSession = useLensProfileStore.use.currentProfileSession() as LensSession | null;
    const isOrb = currentLensSession?.refreshToken === FAKE_REFRESH_TOKEN;

    return useQuery({
        queryKey: ['search-channels', source, debouncedKeyword, profileIds, hasRedPacket, selectedChannel?.id, isOrb],
        queryFn: async () => {
            return searchChannels(source, debouncedKeyword, {
                hasRedPacket,
                isOrb,
                profileId: profilesAll[source]?.profileId,
                selectedChannel,
            });
        },
    });
}
