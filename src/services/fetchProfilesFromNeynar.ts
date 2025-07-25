import urlcat from 'urlcat';

import { NEYNAR_URL } from '@/constants/index.js';
import { fetchNeynarJSON } from '@/helpers/fetchNeynar.js';
import { formatFarcasterProfileFromNeynar } from '@/providers/farcaster/formatFarcasterProfileFromNeynar.js';
import type { Profile } from '@/providers/types/Neynar.js';

export async function fetchProfilesFromNeynar(ids: number[], viewerId?: string) {
    if (!ids.length) return [];

    const url = urlcat(NEYNAR_URL, '/v2/farcaster/user/bulk', {
        fids: ids.join(','),
        viewer_fid: viewerId,
    });

    const data = await fetchNeynarJSON<{ users: Profile[] }>(url, {
        method: 'GET',
    });

    return data.users.map(formatFarcasterProfileFromNeynar);
}
