import urlcat from 'urlcat';

import { NEYNAR_URL } from '@/constants/static.js';
import { fetchNeynarJson } from '@/helpers/fetchNeynarJson.js';
import { createIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveNeynarResponseData } from '@/helpers/resolveNeynarResponseData.js';
import { formatFarcasterProfileFromNeynar } from '@/providers/farcaster/formatFarcasterProfileFromNeynar.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import type { Profile as NeynarProfile } from '@/providers/types/Neynar.js';

export async function searchProfiles(q: string, indicator?: PageIndicator) {
    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(NEYNAR_URL, '/v2/farcaster/user/search', {
            q,
            viewer_fid: session?.profileId || 0,
        });

        const response = await fetchNeynarJson<{ result: { users: NeynarProfile[] } }>(url);
        const { result } = resolveNeynarResponseData(response);
        const profiles = result.users.map(formatFarcasterProfileFromNeynar);
        return createPageable(profiles, createIndicator(indicator));
    });
}
