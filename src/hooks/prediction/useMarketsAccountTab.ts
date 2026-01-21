import { parseAsStringEnum, useQueryState } from 'nuqs';

export enum MarketsAccountTabType {
    Markets = 'markets',
    Positions = 'positions',
    Orders = 'orders',
}

export function useMarketsAccountTab() {
    return useQueryState<MarketsAccountTabType>(
        'accountTab',
        parseAsStringEnum([
            MarketsAccountTabType.Markets,
            MarketsAccountTabType.Positions,
            MarketsAccountTabType.Orders,
        ]).withDefault(MarketsAccountTabType.Markets),
    );
}
