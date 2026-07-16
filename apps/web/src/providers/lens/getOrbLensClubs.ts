import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { applyOptimisticLensChannelMemberships } from '@/providers/lens/applyOptimisticLensChannelMembership.js';
import { createLensSession } from '@/providers/lens/createLensSession.js';
import { formatChannelFromOrb } from '@/providers/lens/formatChannelFromOrb.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import type { GetClubsData, SearchClubsData } from '@/providers/orb/type.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import type { ResponseJson } from '@/types/utility.js';

function getLensTokenHeaders(profileId?: string) {
    const session = profileId ? createLensSession(profileId, lensSessionClientHolder.sessionClient) : null;
    return session?.token
        ? {
              'x-access-token': `Bearer ${session.token}`,
          }
        : undefined;
}

export async function fetchOrbLensClubs(
    category: 'MY_ADMIN_CLUBS' | 'MY_CLUBS',
    profileId?: string,
): Promise<Channel[]> {
    const headers = getLensTokenHeaders(profileId);
    if (!headers) return [];

    const response = await fetchJson<ResponseJson<GetClubsData>>(
        urlcat('/api/orb/get-clubs', { category, cursor: 0, limit: 100 }),
        { headers },
    );
    const data = resolveResponseData(response, 'Failed to fetch Lens clubs');
    return applyOptimisticLensChannelMemberships(
        data.items.flatMap((section) => section.items).map((club) => formatChannelFromOrb(club)),
        profileId,
    );
}

export async function searchOrbLensClubs(keyword: string, profileId?: string): Promise<Channel[]> {
    const headers = getLensTokenHeaders(profileId);
    if (!headers) return [];

    const response = await fetchJson<ResponseJson<SearchClubsData>>(
        urlcat('/api/orb/search-clubs', { q: keyword, skip: 0, limit: 100 }),
        { headers },
    );
    const data = resolveResponseData(response, 'Failed to search Lens clubs');
    return applyOptimisticLensChannelMemberships(
        data.items.map((club) => formatChannelFromOrb(club)),
        profileId,
    );
}
