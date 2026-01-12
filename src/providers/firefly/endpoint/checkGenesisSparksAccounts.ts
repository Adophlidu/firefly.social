import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { type ProfilePageSource } from '@/constants/enum.js';
import { createBatcher } from '@/helpers/createBatcher.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type GenesisSparksAccountsResponse, type SparksAccountInfo } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface AccountPayload {
    source: ProfilePageSource;
    id: string;
    handle: string;
}

async function fetcher(payloads: AccountPayload[]): Promise<Record<string, SparksAccountInfo>> {
    if (payloads.length === 0) return {};

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/genesis/accountactive/check');
    const response = await fireflySessionHolder.fetch<GenesisSparksAccountsResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            infoList: payloads.map((x) => ({
                platform_id: x.id,
                handle: x.handle,
                platform: resolveSourceInUrlForApi(x.source),
            })),
        }),
    });

    const result = resolveFireflyResponseData(response);
    if (!result?.infoList.length) return {};

    return Object.fromEntries(result.infoList.map((info) => [`${info.platform}:${info.handle}`, info]));
}

const batchedCheck = createBatcher<AccountPayload, SparksAccountInfo>('checkGenesisSparksAccount', fetcher, {
    makeKey: (payload) => `${resolveSourceInUrlForApi(payload.source)}:${payload.handle}`,
    size: 1000,
    wait: 1000,
});

/**
 * This is now the public API.
 * It takes a single id+handle and returns the individual account info.
 * Behind the scenes it batches multiple calls.
 */
export async function checkGenesisSparksAccount(source: ProfilePageSource, id: string, handle: string) {
    try {
        const info = await batchedCheck({ source, id, handle });

        // Hydrate React Query cache
        if (typeof info !== 'undefined') {
            queryClient.setQueryData(['profile-highlight-status', source, id, handle], info);
        }

        return info ?? null;
    } catch (error) {
        queryClient.setQueryData(['profile-highlight-status', source, id, handle], false);
        return null;
    }
}

export async function checkGenesisSparksAccounts(
    source: ProfilePageSource,
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    const infos = await Promise.all(idAndHandleList.map((x) => checkGenesisSparksAccount(source, x.id, x.handle)));
    return infos.filter((x) => typeof x !== 'undefined');
}
