import urlcat from 'urlcat';

import { SourceInURL } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import {
    type PolymarketActivityTimeline,
    type PolymarketPositionData,
    type PolymarketProfileData,
    type PolymarketTradeData,
    type Response,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

class FireflyPolymarket {
    async getProfilePolymarketTimeline(
        address: string | string[],
        platformFollowing: SourceInURL | 'all' = 'all',
        indicator?: PageIndicator,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/polymarket');

        const response = await fireflySessionHolder.fetch<PolymarketActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing,
                walletAddresses: Array.isArray(address) ? address : [address],
                size: 25,
                cursor: indicator?.id,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data?.result || EMPTY_LIST,
            createIndicator(indicator),
            data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getFollowingPolymarketTimeline(
        platformFollowing: SourceInURL | 'all' = 'all',
        indicator?: PageIndicator,
        size = 25,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/timeline/polymarket');
        const response = await fireflySessionHolder.fetch<PolymarketActivityTimeline>(url, {
            method: 'POST',
            body: JSON.stringify({
                platformFollowing,
                size,
                cursor: indicator?.id,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data?.result || EMPTY_LIST,
            createIndicator(indicator),
            data?.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getProfile(address: string, isProxyAddress?: boolean) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/profile/info');
        const response = await fireflySessionHolder.fetch<Response<PolymarketProfileData>>(url, {
            method: 'POST',
            body: JSON.stringify({ wallet: address, is_polymarketProxy: isProxyAddress }),
        });
        return resolveFireflyResponseData(response);
    }

    async getPositionHistory({
        address,
        indicator,
        isProxyAddress,
        limit = 20,
        isClaim = false, // true: current positions; false: history positions
    }: {
        address: string;
        indicator?: PageIndicator;
        isProxyAddress?: boolean;
        limit?: number;
        isClaim?: boolean;
    }): Promise<Pageable<PolymarketPositionData, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/positions/info');
        const response = await fireflySessionHolder.fetch<
            Response<{
                data: PolymarketPositionData[];
                cursor: string | null;
            }>
        >(url, {
            method: 'POST',
            body: JSON.stringify({
                is_polymarketProxy: isProxyAddress,
                limit,
                cursor: indicator?.id || undefined,
                wallet: address,
                is_claim: isClaim,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data.data,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }

    async getTradeHistory({
        address,
        indicator,
        limit = 20,
    }: {
        address: string;
        indicator?: PageIndicator;
        limit?: number;
    }): Promise<Pageable<PolymarketTradeData, PageIndicator>> {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/user/timeline/polymarket');
        const response = await fireflySessionHolder.fetch<
            Response<{
                result: PolymarketTradeData[];
                cursor: string | null;
            }>
        >(url, {
            method: 'POST',
            body: JSON.stringify({
                walletAddresses: [address],
                size: limit,
                cursor: indicator?.id,
            }),
        });
        const data = resolveFireflyResponseData(response);

        return createPageable(
            data.result,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, data.cursor) : undefined,
        );
    }
}

export { FireflyPolymarket };
export const fireflyPolymarketProvider = new FireflyPolymarket();
