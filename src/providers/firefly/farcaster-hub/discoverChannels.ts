import urlcat from 'urlcat';

import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type DiscoverChannelsResponse } from '@/providers/types/Firefly.js';
import { type Channel } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function discoverChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/trending_channels', {
        // XXX It' will response empty list if the size is equal to or greater than 25.
        size: 20,
        cursor: indicator?.id,
    });
    const response = await fireflySessionHolder.fetch<DiscoverChannelsResponse>(url);
    const data = resolveFireflyResponseData(response);
    const channels = data.map((x) => x.channel).map(formatChannelFromFirefly);
    return createPageable(channels, createIndicator(indicator), undefined);
}
