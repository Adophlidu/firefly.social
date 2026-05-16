import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import type { TipsDetail } from '@/metadata/src/transaction/types.js';
import { TipsNotificationType } from '@/metadata/src/transaction/types.js';

export async function getTipsTransactionByHash(hash: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/token_tips/detail', {
        tx_hash: hash,
        source: TipsNotificationType.Tip,
    });
    const response = await fetchJson<FireflyResponse<TipsDetail>>(url, { context: c });

    const data = resolveFireflyResponseData(response);
    return data;
}
