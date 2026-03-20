import { EMPTY_LIST } from '@dimensiondev/constants';
import { AccountsOrderBy, PageSize } from '@lens-protocol/client';
import { fetchAccountRecommendations, fetchAccounts } from '@lens-protocol/client/actions';

import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
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
import { type Profile, SessionType } from '@/providers/types/SocialMedia.js';

export async function getLensSuggestedFollows(indicator?: PageIndicator): Promise<Pageable<Profile>> {
    const session = getSessionFromStorage(SessionType.Lens);
    const result = await ensureLensResult(
        session
            ? fetchAccountRecommendations(getLensClient(), {
                  cursor: ensureCursor(indicator),
                  pageSize: PageSize.Fifty,
                  account: safeEvmAddress(session.profileId),
              })
            : fetchAccounts(getLensClient(), {
                  cursor: ensureCursor(indicator),
                  pageSize: PageSize.Fifty,
                  orderBy: AccountsOrderBy.AccountScore,
              }),
    );

    return createPageable(
        result?.items.map(formatLensProfileV3) || EMPTY_LIST,
        createIndicator(indicator),
        result?.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
