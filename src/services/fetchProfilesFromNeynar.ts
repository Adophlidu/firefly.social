import urlcat from 'urlcat';

import { NEYNAR_URL } from '@/constants/index.js';
import { fetchNeynarJson } from '@/helpers/fetchNeynarJson.js';
import { resolveNeynarResponseData } from '@/helpers/resolveNeynarResponseData.js';
import { formatFarcasterProfileFromNeynar } from '@/providers/farcaster/formatFarcasterProfileFromNeynar.js';
import type { Profile } from '@/providers/types/Neynar.js';

export async function fetchProfilesFromNeynar(ids: number[], viewerId?: string) {
    if (!ids.length) return [];

    const url = urlcat(NEYNAR_URL, '/v2/farcaster/user/bulk', {
        fids: ids.join(','),
        viewer_fid: viewerId,
    });

    const response = await fetchNeynarJson<{ users: Profile[] }>(url, {
        method: 'GET',
    });
    const { users } = resolveNeynarResponseData(response);
    return users.map(formatFarcasterProfileFromNeynar);
}
