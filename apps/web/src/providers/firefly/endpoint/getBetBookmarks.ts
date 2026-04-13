import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import { createIndicator, createNextIndicator, createPageable } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { BookmarkType } from '@/constants/enum.js';
import { type FireflyPolymarketActivity, formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BetsActivity, BookmarkResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getBetBookmarks(indicator?: PageIndicator): Promise<Pageable<BetsActivity, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/bookmark/find', {
        post_type: BookmarkType.All,
        platforms: 'bets',
        limit: 25,
        cursor: indicator?.id || undefined,
    });
    const response = await fireflySessionHolder.fetch<BookmarkResponse<FireflyPolymarketActivity>>(url);
    const data = resolveFireflyResponseData(response);

    return createPageable(
        compact(data.list.map((x) => (x.post_content ? formatPolymarketFromFirefly(x.post_content) : undefined))),
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
