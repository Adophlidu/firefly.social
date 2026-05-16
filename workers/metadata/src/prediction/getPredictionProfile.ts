import { FIREFLY_STAMP_DEV_URL, FIREFLY_STAMP_URL } from '@dimensiondev/workers-shared/constants/metadata.js';
import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { first } from '@dimensiondev/workers-shared/helpers/first.js';
import { resolveFireflyResponseData } from '@dimensiondev/workers-shared/helpers/resolveFireflyResponseData.js';
import { resolveFireflyRootUrl } from '@dimensiondev/workers-shared/helpers/resolveFireflyRootUrl.js';
import { safeUnreachable } from '@dimensiondev/workers-shared/helpers/unreachable.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';
import type { Context } from 'hono';

import type { BetPortfolioItem, PolymarketProfileData } from '@/metadata/src/prediction/types.js';
import { PredictionPlatform } from '@/metadata/src/prediction/types.js';

export async function getPolyMarketProfile(address: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/polymarket/profile/info');
    const response = await fetchJson<FireflyResponse<PolymarketProfileData>>(url, {
        method: 'POST',
        context: c,
        body: JSON.stringify({
            wallet: address,
            is_polymarketProxy: true,
        }),
    });
    const data = resolveFireflyResponseData(response);
    const STAMP_URL = c.req.raw.headers.get('X-DEVELOPMENT-API') === 'true' ? FIREFLY_STAMP_DEV_URL : FIREFLY_STAMP_URL;

    const portfolio: BetPortfolioItem = {
        platform: PredictionPlatform.Polymarket,
        wallet: data.wallet,
        proxy: data.proxy,
        platform_avatar:
            data.platform_avatar ||
            (data.wallet || data.proxy ? urlcat(STAMP_URL, `/${data.wallet || data.proxy}`) : ''),
        platform_name: data.platform_name,
        pnl: data.pnl,
        cash_balance: data.cash_balance,
        balance: data.balance,
        notfill_balance: data.notfill_balance,
        volume: data.position_traded,
    };

    return portfolio;
}

export async function getOpinionMarketProfile(address: string, c: Context) {
    const url = urlcat(resolveFireflyRootUrl(c), '/v1/bets/portfolio');
    const response = await fetchJson<FireflyResponse<{ result: BetPortfolioItem[] }>>(url, {
        method: 'POST',
        context: c,
        body: JSON.stringify({
            wallet: [address],
            is_proxy: false,
            platform: PredictionPlatform.Opinion,
        }),
    });

    const data = resolveFireflyResponseData(response);

    const profile = first(data.result);

    return profile || null;
}

export async function getPredictionProfile(platform: PredictionPlatform, address: string, c: Context) {
    switch (platform) {
        case PredictionPlatform.Polymarket:
            return getPolyMarketProfile(address, c);
        case PredictionPlatform.Opinion:
            return getOpinionMarketProfile(address, c);
        default:
            safeUnreachable(platform);
            return null;
    }
}
