import urlcat from 'urlcat';

import { isZero } from '@/helpers/number.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { WalletHistoryTransactionsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getWalletHistoryTransactions(
    chains: number[],
    address: string,
    options?: {
        indicator?: PageIndicator;
    },
) {
    const indicator = options?.indicator;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/wallet_history/transactions', {
        chains: chains.join(','),
        address,
        cursor: indicator?.id && !isZero(indicator.id) ? indicator.id : undefined,
    });
    const response = await fireflySessionHolder.fetch<WalletHistoryTransactionsResponse>(url, {
        method: 'GET',
    });
    const result = resolveFireflyResponseData(response);
    return createPageable(
        result.list,
        createIndicator(),
        result.cursor ? createNextIndicator(undefined, result.cursor) : undefined,
    );
}
