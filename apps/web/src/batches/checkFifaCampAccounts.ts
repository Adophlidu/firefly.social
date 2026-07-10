import type { ProfilePageSource } from '@dimensiondev/enums';
import { createBatcher } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { queryClient } from '@/configs/queryClient.js';
import { isWorldCupEnabled } from '@/helpers/isWorldCupEnabled.js';
import {
    fifaCampCheckMapKey,
    fifaCampCheckMapKeyFromApiRow,
    normalizeFifaCampPlatformId,
} from '@/helpers/normalizeFifaCampPlatformId.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { FifaCampAccountInfo, FifaCampAccountsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface AccountPayload {
    source: ProfilePageSource;
    id: string;
    handle: string;
}

async function fetcher(payloads: AccountPayload[]): Promise<Record<string, FifaCampAccountInfo>> {
    if (payloads.length === 0) return {};

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/fifa/account/camp/check');
    const response = await fireflySessionHolder.fetch<FifaCampAccountsResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            infoList: payloads.map((x) => ({
                platform_id: normalizeFifaCampPlatformId(x.source, x.id),
                handle: x.handle,
                platform: resolveSourceInUrlForApi(x.source),
            })),
        }),
    });

    const result = resolveFireflyResponseData(response);
    if (!result?.infoList.length) return {};

    return Object.fromEntries(
        result.infoList.map((info) => [fifaCampCheckMapKeyFromApiRow(info.platform, info.platform_id), info]),
    );
}

const batchedCheck = createBatcher<AccountPayload, FifaCampAccountInfo>('checkFifaCampAccount', fetcher, {
    makeKey: (payload) => fifaCampCheckMapKey(payload.source, payload.id),
    size: 100,
    wait: 1000,
});

export async function checkFifaCampAccount(source: ProfilePageSource, id: string, handle: string) {
    if (!isWorldCupEnabled() || isServer) return null;

    try {
        const info = await batchedCheck({ source, id, handle });

        if (typeof info !== 'undefined') {
            queryClient.setQueryData(['fifa-camp-status', 'v2', source, id, handle], info);
        }

        return info ?? null;
    } catch {
        queryClient.setQueryData(['fifa-camp-status', 'v2', source, id, handle], null);
        return null;
    }
}

export async function checkFifaCampAccounts(
    source: ProfilePageSource,
    idAndHandleList: Array<{ id: string; handle: string }>,
) {
    if (!isWorldCupEnabled() || isServer) return [];

    const infos = await Promise.all(idAndHandleList.map((x) => checkFifaCampAccount(source, x.id, x.handle)));
    return infos.filter((x) => typeof x !== 'undefined');
}
