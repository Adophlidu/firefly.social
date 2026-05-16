import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import type { SwapActivity } from '@/metadata/src/transaction/types.js';

export async function getSwapActivityByHash(chainId: number, hash: string, context: Context) {
    const url = urlcat(resolveFireflyRootUrl(context), '/v1/swap/detail');
    const response = await fetchJson<FireflyResponse<SwapActivity[]>>(url, {
        method: 'POST',
        body: JSON.stringify({
            list: [
                {
                    hash,
                    chain_id: chainId,
                },
            ],
            is_realtime: false,
        }),
        context,
    });

    const data = resolveFireflyResponseData(response);

    // fallback to realtime data if not found
    if (!data) {
        const realResult = await fetchJson<FireflyResponse<SwapActivity[]>>(url, {
            method: 'POST',
            body: JSON.stringify({
                list: [
                    {
                        hash,
                        chain_id: chainId,
                    },
                ],
                is_realtime: true,
            }),
            context,
        });
        // with `is_realtime=true`, there is always one result.
        const realData = resolveFireflyResponseData(realResult);
        const tx = first(realData);
        if (tx?.from_token) return tx;
    }

    const result = first(data);
    return result;
}
