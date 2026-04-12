import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { formatBriefChannelFromFirefly } from '@/providers/farcaster/formatFarcasterChannelFromFirefly.js';
import type { SearchChannelsResponse } from '@/providers/types/Firefly.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function searchChannels(q: string, indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/channels', {
        keyword: q,
        size: 20,
        cursor: indicator?.id,
    });
    const response = await fetchJson<SearchChannelsResponse>(url);
    const data = resolveFireflyResponseData(response);
    const channels = data.channels.map((x) => formatBriefChannelFromFirefly(x));

    return createPageable(
        channels,
        createIndicator(indicator),
        data.cursor && data.size ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
