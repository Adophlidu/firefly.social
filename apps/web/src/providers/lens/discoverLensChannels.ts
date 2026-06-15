import { runInSafeAsync } from '@dimensiondev/utils';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { lensWorker } from '@dimensiondev/workers-client';
import type { TrendingClubsResponse } from '@dimensiondev/workers-lens';
import { compact } from 'lodash-es';

import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { formatChannelFromOrb } from '@/providers/lens/formatChannelFromOrb.js';
import { getLensProfilesByIds } from '@/providers/lens/getLensProfilesById.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import type { ResponseJson } from '@/types/utility.js';

export async function discoverLensChannels(indicator?: PageIndicator): Promise<Pageable<Channel, PageIndicator>> {
    const skip = indicator?.id ? Number.parseInt(indicator.id, 10) || 0 : 0;
    const limit = 20;

    // Use the new firefly-workers endpoint that aggregates Orb + Lens data
    const url = lensWorker.lens['trending-clubs']
        .$url({
            query: { category: 'TRENDING_CLUBS', skip: String(skip), limit: String(limit) },
        })
        .toString();
    const response = await fireflySessionHolder.fetch<ResponseJson<TrendingClubsResponse>>(url);
    const data = resolveResponseData(response, 'Failed to fetch trending clubs');

    // Collect all unique owner IDs and batch fetch all owner profiles in one call
    const ownerIds = compact(data.clubs.map((club) => club.ownerId));
    const uniqueOwnerIds = [...new Set(ownerIds)];
    const ownersMap = await runInSafeAsync(async () => {
        if (uniqueOwnerIds.length === 0) return new Map<string, any>();
        const owners = await getLensProfilesByIds(uniqueOwnerIds);
        const entries: Array<[string, any]> = [];
        for (const owner of owners) {
            const id = owner.profileId.toLowerCase();
            if (id) {
                entries.push([id, owner]);
            }
        }

        return new Map(entries);
    });

    // Map clubs to channels with owner leads
    const channels: Channel[] = data.clubs.map((club) => {
        const owner = club.ownerId ? ownersMap?.get(club.ownerId.toLowerCase()) : undefined;
        return formatChannelFromOrb(club, owner);
    });

    const hasMore = data.pageInfo?.hasMore ?? channels.length === limit;
    const nextSkip = data.pageInfo?.next ? Number.parseInt(data.pageInfo.next, 10) : skip + channels.length;

    return createPageable(
        channels,
        createIndicator(indicator),
        hasMore ? createNextIndicator(indicator, `${nextSkip}`) : undefined,
    );
}
