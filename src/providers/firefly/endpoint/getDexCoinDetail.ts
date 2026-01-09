import urlcat from 'urlcat';

import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type DexCoinDetailResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getDexCoinDetail(chainId: number, address: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/dex/coin/detail', {
        chainId,
        address,
    });
    const response = await fireflySessionHolder.fetch<DexCoinDetailResponse>(url);
    return resolveFireflyResponseData(response);
}
