import { AccountsOrderBy, PageSize } from '@lens-protocol/client';
import { fetchAccounts } from '@lens-protocol/client/actions';

import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { ensureCursor } from '@/providers/lens/ensureCursor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { formatLensProfileV3 } from '@/providers/lens/formatLensProfile.js';
import { getLensClient } from '@/providers/lens/getLensClient.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function searchLensProfiles(
    q: string,
    indicator?: PageIndicator,
): Promise<Pageable<Profile, PageIndicator>> {
    const result = await ensureLensResult(
        fetchAccounts(getLensClient(), {
            cursor: ensureCursor(indicator),
            pageSize: PageSize.Fifty,
            orderBy: AccountsOrderBy.BestMatch,
            filter: {
                searchBy: { localNameQuery: q },
            },
        }),
    );
    return createPageable(
        result.items.map(formatLensProfileV3),
        createIndicator(indicator),
        result.pageInfo.next ? createNextIndicator(indicator, result.pageInfo.next) : undefined,
    );
}
