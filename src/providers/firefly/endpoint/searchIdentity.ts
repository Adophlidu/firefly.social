import urlcat from 'urlcat';

import type { SocialSource } from '@/constants/enum.js';
import { createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SearchProfileResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function searchIdentity(
    keyword: string,
    {
        platforms,
        size = 100,
        indicator,
    }: {
        platforms?: SocialSource[];
        size?: number;
        indicator?: PageIndicator;
    } = {},
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/identity', {
        keyword,
        size,
        cursor: indicator?.id,
    });
    const platform = platforms?.map((x) => resolveSourceInUrlForApi(x)).join(','); // There are commas here, without escaping
    const response = await fireflySessionHolder.fetch<SearchProfileResponse>(
        platform ? `${url}&platform=${platform}` : url,
        {
            method: 'GET',
        },
    );
    const data = resolveFireflyResponseData(response);
    return createPageable(
        data.list || [],
        indicator,
        data.cursor && data.list?.length ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
