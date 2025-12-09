import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import type { ProfilePageSource } from '@/constants/enum.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GenesisSparksAccountsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function checkGenesisSparksAccounts(
    source: ProfilePageSource,
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    if (env.external.NEXT_PUBLIC_SPARKS === STATUS.Disabled) {
        return;
    }
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

    const result = resolveFireflyResponseData(response);

    // reduce redundant requests
    if (result?.infoList) {
        result.infoList.forEach((accountInfo) => {
            const account = idAndHandleList.find((x) => x.id === accountInfo.platform_id);
            if (account) {
                queryClient.setQueryData(['profile-highlight-status', source, account.id, account.handle], accountInfo);
            }
        });
    }

    return result;
}
