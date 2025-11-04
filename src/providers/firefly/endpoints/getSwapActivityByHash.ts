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
    return result;
}
