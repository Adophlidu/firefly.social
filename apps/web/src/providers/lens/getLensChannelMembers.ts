import { type Account, PageSize } from '@lens-protocol/client';
import { fetchGroupMembers } from '@lens-protocol/client/actions';

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
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export async function getLensChannelMembers(
    channelId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Profile, PageIndicator>> {
    const result = await ensureLensResult(
        fetchGroupMembers(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            group: safeEvmAddress(channelId),
        }),
    );

    return createPageable(
        result.items.map((x) => formatLensProfileV3(x.account as Account)),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
