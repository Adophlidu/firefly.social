import { STAMP_AVATAR_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { formatAddress } from '@dimensiondev/workers-shared/helpers/formatAddress.js';
import { resolveSiteUrl } from '@dimensiondev/workers-shared/helpers/resolveSiteUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

import type { TipsAccountInfo } from '@/metadata/src/transaction/types.js';

export function formatTipsAccount(c: Context, address: string, accountInfo?: TipsAccountInfo) {
    const avatar =
        accountInfo?.firefly_avatar ||
        (accountInfo?.firefly_uuid
            ? urlcat(STAMP_AVATAR_URL, `/firefly/${accountInfo.firefly_uuid}`, {
                  s: 240,
              })
            : urlcat(STAMP_AVATAR_URL, `/${address}`));
    const displayName = accountInfo?.firefly_name || formatAddress(address, 6, 2);

    return {
        avatar,
        address,
        displayName,
        link: c ? urlcat(resolveSiteUrl(c), `/profile/wallet/${address}/nfts`) : undefined,
    };
}
