import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatFarcasterProfileFromFireflyCache } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type GetProfilesResponse } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getProfilesByIds(ids: string[], sourceId?: string): Promise<Profile[]> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/wallet/farcasterinfo/list');
    const response = await fireflySessionHolder.fetch<GetProfilesResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ fid: ids, sourceId: sourceId || null }),
    });
    const data = resolveFireflyResponseData(response);
    return data.map(formatFarcasterProfileFromFireflyCache);
}
