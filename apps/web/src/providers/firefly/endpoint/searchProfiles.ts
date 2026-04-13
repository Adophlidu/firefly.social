import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { getProfilesByIds } from '@/providers/firefly/endpoint/getProfilesByIds.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SearchProfileResponse } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { settings } from '@/settings/index.js';

export async function searchProfiles(q: string, indicator?: PageIndicator): Promise<Pageable<Profile, PageIndicator>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/search/identity', {
        keyword: q,
        size: 25,
        cursor: indicator?.id,
    });
    const response = await fireflySessionHolder.fetch<SearchProfileResponse>(url);
    const data = resolveFireflyResponseData(response);
    const fids = compact((data.list || []).flatMap((x) => x.farcaster).map((x) => x?.platform_id));
    const result = await getProfilesByIds(fids);
    return createPageable(
        result,
        createIndicator(indicator),
        data.cursor && data.size ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
    );
}
