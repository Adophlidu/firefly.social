import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SwapActivityDetail } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getSwapActivityByHash(hash: string, chainId: number) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/swap/detail');
    const response = await fireflySessionHolder.fetch<SwapActivityDetail>(url, {
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
    });

    const data = resolveFireflyResponseData(response);

    const result = first(data);

    // fallback to realtime data if not found
    if (!result) {
        const realResult = await fireflySessionHolder.fetch<SwapActivityDetail>(url, {
            method: 'POST',
            body: JSON.stringify({
                list: [{ hash, chain_id: chainId }],
                is_realtime: true,
            }),
        });
        // with `is_realtime=true`, there is always one result.
        const realData = resolveFireflyResponseData(realResult);
        const tx = first(realData);
        if (tx?.from_token) return tx;
    }

    return result;
}
