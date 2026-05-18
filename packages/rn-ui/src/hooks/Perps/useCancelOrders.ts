import { useLingui } from '@lingui/react/macro';
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

/**
 * Optional translator. When provided, the helper emits translated toast copy
 * matching the consumer's active locale. When omitted, falls back to source
 * English so non-component (test/script) callers still work.
 */
export interface RunCancelToastCopy {
    success: { one: string; many: string };
    failure: { one: string; many: string };
}

const DEFAULT_CANCEL_COPY: RunCancelToastCopy = {
    success: { one: 'Order cancelled', many: 'Orders cancelled' },
    failure: { one: 'Failed to cancel order', many: 'Failed to cancel orders' },
};

/** Imperative cancel (e.g. Clear-all snapshot); same behavior as `useCancelOrders` no-arg call. */
export async function runCancelPerpOpenOrders(
    queryClient: QueryClient,
    exchangeClient: ExchangeClient,
    orderIds: PerpOrderCancelId[],
    copy: RunCancelToastCopy = DEFAULT_CANCEL_COPY,
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
        message: orderIds.length > 1 ? copy.success.many : copy.success.one,
        type: 'success',
    });
}

export function useCancelOrders(orderIds: PerpOrderCancelId[]) {
    const { i18n } = useLingui();
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const queryClient = useQueryClient();

    return useAsyncFn(async () => {
        try {
            if (!exchangeClient) {
                throw new Error('Exchange client not initialized');
            }
            await runCancelPerpOpenOrders(queryClient, exchangeClient, orderIds, {
                success: {
                    one: i18n._('rn-ui.cancelOrders.successOne'),
                    many: i18n._('rn-ui.cancelOrders.successMany'),
                },
                failure: {
                    one: i18n._('rn-ui.cancelOrders.failureOne'),
                    many: i18n._('rn-ui.cancelOrders.failureMany'),
                },
            });
        } catch (error) {
            toast({
                message:
                    error instanceof Error
                        ? error.message
                        : orderIds.length > 1
                          ? i18n._('rn-ui.cancelOrders.failureMany')
                          : i18n._('rn-ui.cancelOrders.failureOne'),
                type: 'error',
                error,
            });
        }
    }, [i18n, orderIds, exchangeClient, queryClient]);
}
