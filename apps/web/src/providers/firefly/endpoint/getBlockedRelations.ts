import type { SocialSourceInURL } from '@dimensiondev/enums';
import type { PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { BlockedUsersResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getBlockedRelations(indicator?: PageIndicator, source?: SocialSourceInURL) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/platformMuteList', {
        size: 20,
        page: indicator?.id ?? 1,
        platform: source,
    });
    const response = await fireflySessionHolder.fetch<BlockedUsersResponse>(url);
    const data = resolveFireflyResponseData(response);
    return data;
}
