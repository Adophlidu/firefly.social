import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketSettingQueryOptions() {
    return queryOptions({
        queryKey: ['getPolymarketSetting'],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketSetting();
        },
    });
}
