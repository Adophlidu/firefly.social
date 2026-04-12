import type { UserV2 } from 'twitter-api-v2';

import { formatTwitterProfile } from '@/providers/twitter/formatTwitterProfile.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import type { ResponseJson } from '@/types/utility.js';

export async function getProfilesByIdsFromOfficial(ids: string[]): Promise<Profile[]> {
    if (!ids.length) return [];
    const response = await twitterSessionHolder.fetch<ResponseJson<UserV2[]>>('/api/twitter/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ids,
        }),
    });
    const data = resolveTwitterResponseData(response);
    if (!data.length) return [];

    return data.map(formatTwitterProfile);
}
