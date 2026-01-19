import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { formatChannelFromOrb } from '@/providers/lens/formatChannelFromOrb.js';
import { getLensProfilesByIds } from '@/providers/lens/getLensProfilesById.js';
import { type ExploreClubsData } from '@/providers/orb/type.js';
import { type Channel } from '@/providers/types/SocialMedia.js';
import { type ResponseJson } from '@/types/utility.js';

export async function discoverLensChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
    const skip = indicator?.id ? Number.parseInt(indicator.id, 10) || 0 : 0;
    const limit = 20;

    const url = urlcat('/api/orb/explore-clubs', {
        category: 'TRENDING_CLUBS',
        skip,
        limit,
    });
    const response = await fireflySessionHolder.fetch<ResponseJson<ExploreClubsData>>(url);
    const data = resolveResponseData(response, 'Failed to fetch explore clubs');

    const ownerIds = compact(data.clubs.map((club) => club.metadata?.ownedBy));
    const owners = await runInSafeAsync(() => getLensProfilesByIds(ownerIds));

    const channels = data.clubs.map((club) => formatChannelFromOrb(club, owners));

    const hasMore = data.pageInfo?.hasMore ?? channels.length === limit;
    const nextSkip = data.pageInfo?.next ? Number.parseInt(data.pageInfo.next, 10) : skip + channels.length;

    return createPageable(
        channels,
        createIndicator(indicator),
        hasMore ? createNextIndicator(indicator, `${nextSkip}`) : undefined,
    );
}
