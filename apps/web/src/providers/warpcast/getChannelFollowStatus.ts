import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { type ResponseJson } from '@/types/utility.js';

export async function getChannelFollowStatus(channelId: string, fid: string): Promise<boolean> {
    const response = await fetchJson<ResponseJson<{ following: boolean }>>(
        urlcat('/api/warpcast/channel/follow/status', {
            channelId,
            fid,
        }),
    );
    const data = resolveResponseData(response);
    return data.following;
}
