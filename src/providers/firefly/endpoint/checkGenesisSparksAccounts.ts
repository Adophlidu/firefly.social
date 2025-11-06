import urlcat from 'urlcat';

import type { ProfilePageSource } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GenesisSparksAccountsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function checkGenesisSparksAccounts(
    source: ProfilePageSource,
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/genesis/accountactive/check');
    const response = await fireflySessionHolder.fetch<GenesisSparksAccountsResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            infoList: idAndHandleList.map((x) => ({
                platform_id: x.id,
                handle: x.handle,
                platform: resolveSourceInUrlForApi(source),
            })),
        }),
    });

    return resolveFireflyResponseData(response);
}
