import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import type { PolymarketRankOrder, PolymarketRankPeriod } from '@/constants/enum.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export interface PolymarketRankItem {
    polymarketUserName?: string;
    owner: string;
    wallet: string;
    proxy?: string;
    displayInfo?: {
        avatarUrl?: string | null;
        ensHandle?: string | null;
        fireflyAvatarUrl?: string | null;
        fireflyName?: string | null;
        fireflyUid?: string | null;
    };
    followingSources?: unknown[];
    pnl?: string | number;
    pnl_rate?: string | number;
    volume?: string | number;
    rank?: number;
}

export interface PolymarketRankResponse {
    result: PolymarketRankItem[];
    cursor?: string;
}

export interface GetPolymarketRankParams {
    is_following?: boolean;
    period: PolymarketRankPeriod;
    order: PolymarketRankOrder;
    address?: string[];
    limit?: number;
    cursor?: string;
}

export async function getPolymarketRank(
    params: GetPolymarketRankParams,
    indicator?: PageIndicator,
): Promise<ReturnType<typeof createPageable<PolymarketRankItem, PageIndicator>>> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/rank');
    const response = await fireflySessionHolder.fetch<Response<PolymarketRankResponse>>(url, {
        method: 'POST',
        body: JSON.stringify({
            is_following: params.is_following ?? false,
            period: params.period,
            order: params.order,
            address: params.address,
            limit: params.limit ?? 50,
            cursor: indicator?.id || params.cursor,
        }),
    });

    const data = resolveFireflyResponseData(response);

    return createPageable(
        data.result || [],
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
    );
}
