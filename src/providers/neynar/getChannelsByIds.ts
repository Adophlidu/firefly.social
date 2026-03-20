/* cspell:disable */

import { EMPTY_LIST } from '@dimensiondev/constants';
import urlcat from 'urlcat';

import { NEYNAR_URL } from '@/constants/static.js';
import { fetchNeynarJson } from '@/helpers/fetchNeynarJson.js';
import { resolveNeynarResponseData } from '@/helpers/resolveNeynarResponseData.js';
import { formatChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { type Channel as FireflyChannel } from '@/providers/types/Firefly.js';
import { type Channel, type Notification } from '@/providers/types/SocialMedia.js';

export async function getChannelsByIds(ids: string[]): Promise<Channel[]> {
    if (!ids.length) return EMPTY_LIST;

    return farcasterSessionHolder.withSession(async (session) => {
        const url = urlcat(NEYNAR_URL, '/v2/farcaster/channel/bulk', {
            ids: ids.join(','),
            viewer_fid: session?.profileId,
        });

        const response = await fetchNeynarJson<{ channels: FireflyChannel[] }>(url);
        const data = resolveNeynarResponseData(response);
        return data.channels.map(formatChannelFromFirefly);
    });
}
