import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { type Account, PageSize } from '@lens-protocol/client';
import { fetchFollowersYouKnow } from '@lens-protocol/client/actions';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export async function getLensMutualFollowers(
    profileId: string,
    indicator?: PageIndicator,
): Promise<Pageable<Profile, PageIndicator>> {
    const session = getSessionFromStorage(SessionType.Lens);

    if (!session?.profileId || isSameEthereumAddress(session.profileId, profileId))
        return createPageable([], createIndicator(indicator));

    const result = await ensureLensResult(
        fetchFollowersYouKnow(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            observer: session.profileId,
            target: safeEvmAddress(profileId),
        }),
    );

    return createPageable(
        result.items.map((x) => formatLensProfileV3(x.follower as Account)),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
