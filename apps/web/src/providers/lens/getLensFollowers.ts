import { type Account, PageSize } from '@lens-protocol/client';
import { fetchFollowers } from '@lens-protocol/client/actions';

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

export async function getLensFollowers(profileId: string, indicator?: PageIndicator): Promise<Pageable<Profile>> {
    const result = await ensureLensResult(
        fetchFollowers(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            account: safeEvmAddress(profileId),
        }),
    );

    return createPageable(
        result.items.map((x) => formatLensProfileV3(x.follower as Account)),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
