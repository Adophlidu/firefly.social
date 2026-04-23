import urlcat from 'urlcat';

import { createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint';
import type { FireflyResponse } from '@/types/firefly';

interface Options {
    limit?: number;
    indicator?: PageIndicator;
}

export async function getFavorites({ limit = 20, indicator }: Options) {
    const response = await getFireflyEndpoint().fetchWithSession<
        FireflyResponse<{
            list: Array<{ name: string }>;
            cursor: number | null;
        }>
    >(
        urlcat('/v1/perps/favorites/find', {
            limit,
            cursor: indicator?.id || '0',
        }),
    );
    const { list, cursor } = resolveFireflyResponseData(response);
    return createPageable(list, cursor ? createNextIndicator(indicator, cursor.toString()) : undefined);
}
