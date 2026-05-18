import { Source } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import type { ProfilePageSource } from '@/constants/enum.js';
import { getPlatformQueryKey } from '@/helpers/getPlatformQueryKey.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { IsMutedAllResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function isProfileMutedAll(source: ProfilePageSource, id: string) {
    if (source === Source.Bsky) return false;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/isMuteAll', {
        [getPlatformQueryKey(source)]: id,
    });

    const response = await fireflySessionHolder.fetch<IsMutedAllResponse>(url);
    const data = resolveFireflyResponseData(response);
    return data?.isBlockAll ?? false;
}
