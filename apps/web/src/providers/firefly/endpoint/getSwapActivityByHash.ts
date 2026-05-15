import { delay } from '@dimensiondev/utils';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { SwapActivityDetail } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

interface Options {
    polling?: boolean;
    waitForToken?: boolean;
}

export async function getSwapActivityByHash(hash: string, chainId: number, options?: Options) {
    const { polling = false, waitForToken = true } = options ?? {};
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
        // with `is_realtime=true`, there is always one result.
        const fetchRealtime = async () => {
            const realResult = await fireflySessionHolder.fetch<SwapActivityDetail>(url, {
                method: 'POST',
                body: JSON.stringify({
                    list: [{ hash, chain_id: chainId }],
                    is_realtime: true,
                }),
            });
            const realData = resolveFireflyResponseData(realResult);
            return first(realData);
        };

        const tx = await fetchRealtime();
        if (tx?.from_token || (!!tx && !waitForToken)) return tx;

        // When polling, retry up to 5 times if backend hasn't indexed swap data yet
        if (polling) {
            for (let i = 0; i < 5; i += 1) {
                await delay(2000);
                const retryTx = await fetchRealtime();
                if (retryTx?.from_token) return retryTx;
            }
        }
    }

    return result;
}
