import { PageSize } from '@lens-protocol/client';
import { fetchGroups } from '@lens-protocol/client/actions';
import { compact } from 'lodash-es';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensChannelFromGroup } from '@/providers/lens/formatLensChannel.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export async function getLensChannelsByProfileId(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Channel, PageIndicator>> {
    const result = await ensureLensResult(
        fetchGroups(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            orderBy: 'LATEST_FIRST',
            filter: {
                member: safeEvmAddress(profileId),
            },
        }),
    );
    const channels = compact(result.items.map((x) => (x.feed ? formatLensChannelFromGroup(x) : null)));

    return createPageable(
        channels,
        createIndicator(indicator),
        result?.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
