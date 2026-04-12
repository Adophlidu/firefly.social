import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BlockChannelResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function blockChannel(channelId: string): Promise<boolean> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/channel/block');
    const response = await fireflySessionHolder.fetch<BlockChannelResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            channel_id: channelId,
        }),
    });

    if (response) return true;
    throw new Error('Failed to mute channel');
}
