import urlcat from 'urlcat';

import { PredictionPlatform } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';
import { type PredictionPnlHistory } from '@/types/prediction.js';

export async function getPredictionPnlHistory(
    proxyAddress: string,
    platform: PredictionPlatform,
    period = 30,
): Promise<PredictionPnlHistory | undefined> {
    if (platform !== PredictionPlatform.Polymarket) {
        return;
    }

    try {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/bets/pnl/history', {
            proxy_address: proxyAddress,
            period,
            platform,
        });

        const response = await fireflySessionHolder.fetch<Response<PredictionPnlHistory>>(url, {
            method: 'GET',
        });
        return resolveFireflyResponseData(response);
    } catch (error) {
        return;
    }
}
