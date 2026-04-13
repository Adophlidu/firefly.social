import { EMPTY_LIST } from '@dimensiondev/constants';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { getChannelsByIds } from '@/providers/neynar/getChannelsByIds.js';
import type { BlockedChannelsResponse } from '@/providers/types/Firefly.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getBlockedChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
    return farcasterSessionHolder.withSession(async (session) => {
        if (!session) {
            throw new Error('No farcaster session found');
        }

        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/blocks', {
            account_id: session.profileId,
        });
        const response = await fireflySessionHolder.fetch<BlockedChannelsResponse>(url);
        const channelIds = response.data?.blocks.map((x) => x.channel_id);
        const channels = channelIds?.length ? await getChannelsByIds(channelIds) : EMPTY_LIST;
        return createPageable(channels, createIndicator(indicator), undefined);
    });
}
