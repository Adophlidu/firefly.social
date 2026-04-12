import type { SpaceV2SingleResult } from 'twitter-api-v2';
import urlcat from 'urlcat';

import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { ResponseJson } from '@/types/utility.js';

export async function getSpace(id: string) {
    const response = await twitterSessionHolder.fetch<ResponseJson<SpaceV2SingleResult>>(
        urlcat('/api/twitter/space/:id', { id }),
    );
    const data = resolveTwitterResponseData(response, `Failed to fetch space "${id}".`);
    return data;
}
