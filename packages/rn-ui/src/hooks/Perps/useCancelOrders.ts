import type { ExchangeClient } from '@nktkas/hyperliquid';
import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { STALE_TIMES } from '@/constants/enum';
import { resolvePerpCoinIndex } from '@/helpers/resolvePerpCoinIndex';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { infoClient } from '@/providers/client';
import { exchangeClientAtom } from '@/store/wallet';

export interface PerpOrderCancelId {
    oid: string | number;
    coin: string;
}

/** Imperative cancel (e.g. Clear-all snapshot); same behavior as `useCancelOrders` no-arg call. */
export async function runCancelPerpOpenOrders(
    queryClient: QueryClient,
    exchangeClient: ExchangeClient,
    orderIds: PerpOrderCancelId[],
): Promise<void> {
    if (!orderIds.length) return;

    if (!exchangeClient) {
        throw new Error('Exchange client not initialized');
    }

    const allMetas = await queryClient.ensureQueryData({
        queryKey: ['perps', 'all-metas'],
        staleTime: STALE_TIMES.MINUTE_10,
        queryFn: () => infoClient.allPerpMetas(),
    });
    if (!allMetas?.length) {
        throw new Error('Failed to fetch market metadata');
    }

    const cancels = orderIds.map(({ coin, oid }) => ({
        o: oid,
        a: resolvePerpCoinIndex(coin, allMetas),
    }));
    if (cancels.some((c) => c.a === -1)) {
        throw new Error('Failed to resolve coin index for one or more orders');
    }

    await exchangeClient.cancel({ cancels });
    toast({
        message: orderIds.length > 1 ? 'Orders cancelled' : 'Order cancelled',
        type: 'success',
    });
}

export function useCancelOrders(orderIds: PerpOrderCancelId[]) {
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const queryClient = useQueryClient();

    return useAsyncFn(async () => {
        try {
            if (!exchangeClient) {
                throw new Error('Exchange client not initialized');
            }
            await runCancelPerpOpenOrders(queryClient, exchangeClient, orderIds);
        } catch (error) {
            toast({
                message:
                    error instanceof Error
                        ? error.message
                        : orderIds.length > 1
                          ? 'Failed to cancel orders'
                          : 'Failed to cancel order',
                type: 'error',
                error,
            });
        }
    }, [orderIds, exchangeClient, queryClient]);
}
