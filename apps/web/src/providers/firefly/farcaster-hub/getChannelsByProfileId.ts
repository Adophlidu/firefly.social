import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import type { ChannelsResponse } from '@/providers/types/Firefly.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function getChannelsByProfileId(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Channel, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/farcaster-hub/active_channels', {
        fid: profileId,
        size: indicator?.size,
    });
    const response = await fetchJson<ChannelsResponse>(url);
    const data = resolveFireflyResponseData(response);
    const channels = data.map(formatChannelFromFirefly);
    return createPageable(channels, createIndicator(indicator));
}
