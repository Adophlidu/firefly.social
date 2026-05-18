import { FireflyPlatform } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { BookmarkType } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetBookmarksResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getFireflyBookmarksByIds(platform: FireflyPlatform, ids: string[], postType = BookmarkType.All) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bookmark/query/ids');
    const response = await fireflySessionHolder.fetch<GetBookmarksResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            post_ids: ids,
            platform: platform === FireflyPlatform.NFTs ? 'nft' : platform,
            post_type: postType,
        }),
    });
    const data = resolveFireflyResponseData(response);
    return data.list;
}
