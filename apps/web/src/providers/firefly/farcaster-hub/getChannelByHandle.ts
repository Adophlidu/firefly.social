import { NotFoundError } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatBriefChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type ChannelResponse } from '@/providers/types/Firefly.js';
import { type Channel } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getChannelByHandle(channelHandle: string): Promise<Channel> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel_v2', {
        channelHandle,
    });
    const response = await fireflySessionHolder.fetch<ChannelResponse>(url);
    const data = resolveFireflyResponseData(response);
    if (!data.channel) {
        throw new NotFoundError(`Farcaster channel not found with handle=${channelHandle}.`);
    }
    return formatBriefChannelFromFirefly(data.channel, data.blocked);
}
