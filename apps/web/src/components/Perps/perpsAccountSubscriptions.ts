import { type PerpsAddress, perpsQueryKeys } from '@dimensiondev/perps-react';
import type { UserFillsResponse } from '@nktkas/hyperliquid/api/info';

export const MAX_CACHED_PERPS_FILLS = 2000;

export function perpsAggregatedFillsQueryKey(address: PerpsAddress) {
    return [...perpsQueryKeys.fills(address), 'aggregate-by-time'] as const;
}

export function perpsAccountQueryKeyPrefix(address: PerpsAddress) {
    return perpsQueryKeys.account(address).slice(0, -1);
}

export function perpsOpenOrdersQueryKeyPrefix(address: PerpsAddress) {
    return perpsQueryKeys.openOrders(address).slice(0, -1);
}

export function mergePerpsFills(current: UserFillsResponse | undefined, incoming: UserFillsResponse) {
    const seen = new Set<string>();
    return [...incoming, ...(current ?? [])]
        .filter((fill) => {
            const key = `${fill.tid}:${fill.time}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, MAX_CACHED_PERPS_FILLS);
}
