import { SessionType } from '@dimensiondev/enums';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { BookmarkType } from '@/constants/enum.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { getSingleCoin } from '@/providers/firefly/endpoint/getSingleCoin.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Bookmarkable, BookmarkResponse, TokenWithMarketData } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTokenBookmarks(
    indicator?: PageIndicator,
    limit = 25,
): Promise<Pageable<Bookmarkable<TokenWithMarketData>, PageIndicator>> {
    const session = getSessionFromStorage(SessionType.Farcaster);
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/find', {
        post_type: BookmarkType.All,
        platforms: 'token',
        limit,
        cursor: indicator?.id || undefined,
        fid: session?.profileId,
    });

    const response = await fireflySessionHolder.fetch<BookmarkResponse<void>>(url);
    const data = resolveFireflyResponseData(response);

    const promises = compact(
        data.list.map((item) => {
            if (/^\d+\./.test(item.post_id)) {
                const parts = item.post_id.split('.');
                const chainId = +parts[0];
                const address = parts[1];
                if (!address) return null;
                return getSingleCoin({
                    chain_id: chainId,
                    address,
                });
            }
            if (item.post_id) {
                return getSingleCoin({
                    coingecko_id: item.post_id,
                });
            }
            return null;
        }),
    );
    const allTokens = await Promise.allSettled(promises);
    const list = allTokens.flatMap((x) =>
        x.status === 'fulfilled' && x.value
            ? ({ ...x.value, is_bookmarked: true } as Bookmarkable<TokenWithMarketData>)
            : [],
    );

    return createPageable(
        compact(list),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
