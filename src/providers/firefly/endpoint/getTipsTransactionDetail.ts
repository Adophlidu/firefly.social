import urlcat from 'urlcat';

import { TipsNotificationType } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { TipsDetailResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getTipsTransactionDetail(txHash: string, type: TipsNotificationType) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/token_tips/detail', {
        tx_hash: txHash,
        source: type,
    });
    const response = await fireflySessionHolder.fetch<TipsDetailResponse>(url);
    const data = resolveFireflyResponseData(response);
    return data;
}
