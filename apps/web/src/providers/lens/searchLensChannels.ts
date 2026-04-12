import { EMPTY_LIST } from '@dimensiondev/constants';
import { runInSafeAsync } from '@dimensiondev/utils';
import { GroupsOrderBy, PageSize } from '@lens-protocol/client';
import { fetchGroups } from '@lens-protocol/client/actions';

import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensChannelFromGroup } from '@/providers/lens/formatLensChannel.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { getLensProfilesByIds } from '@/providers/lens/getLensProfilesById.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export async function searchLensChannels(
    q: string,
    indicator?: PageIndicator,
): Promise<Pageable<Channel, PageIndicator>> {
    const result = await ensureLensResult(
        fetchGroups(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            orderBy: GroupsOrderBy.LatestFirst,
            filter: {
                searchQuery: q || undefined,
            },
        }),
    );

    const ownerIds = result.items.map((x) => x.owner);
    const owners = await runInSafeAsync(() => getLensProfilesByIds(ownerIds));

    return createPageable(
        (result?.items.map(formatLensChannelFromGroup) ?? EMPTY_LIST).map((x) => ({
            ...x,
            lead: owners?.find((profile) => isSameEthereumAddress(profile.profileId, x.ownerId)),
        })),
        createIndicator(indicator),
        result?.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
