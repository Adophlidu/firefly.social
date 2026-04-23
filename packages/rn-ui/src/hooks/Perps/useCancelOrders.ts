import type { AllPerpMetasResponse } from '@nktkas/hyperliquid';
import { useAtomValue } from 'jotai';

import { queryClient } from '@/configs/queryClient';
import { STALE_TIMES } from '@/constants/enum';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { infoClient } from '@/providers/client';
import { exchangeClientAtom } from '@/store/wallet';

function resolveCoinIndex(coinName: string, allMetas: AllPerpMetasResponse) {
    if (!allMetas?.length) return -1;

    const dexIndex = allMetas.findIndex((meta) => meta.universe.some((c) => c.name === coinName));
    if (dexIndex === -1) return -1;

    const meta = allMetas[dexIndex];
    const coinIndex = meta.universe.findIndex((c) => c.name === coinName);
    if (coinIndex === -1) return -1;

    return dexIndex === 0 ? coinIndex : 100000 + dexIndex * 10000 + coinIndex;
}

export function useCancelOrders(
    orderIds: Array<{
        oid: string | number;
        coin: string;
    }>,
) {
    const exchangeClient = useAtomValue(exchangeClientAtom);

    return useAsyncFn(async () => {
        if (!orderIds.length) return;

        try {
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
                a: resolveCoinIndex(coin, allMetas),
            }));
            if (cancels.some((c) => c.a === -1)) {
                throw new Error('Failed to resolve coin index for one or more orders');
            }

            await exchangeClient.cancel({ cancels });
            toast({
                message: orderIds.length > 1 ? 'Orders cancelled' : 'Order cancelled',
                type: 'success',
            });
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
    }, [orderIds, exchangeClient]);
}
