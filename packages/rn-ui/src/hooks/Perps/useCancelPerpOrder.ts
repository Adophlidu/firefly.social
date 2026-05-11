import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { STALE_TIMES } from '@/constants/enum';
import { resolvePerpCoinIndex } from '@/helpers/resolvePerpCoinIndex';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { infoClient } from '@/providers/client';
import { exchangeClientAtom } from '@/store/wallet';

export function useCancelPerpOrder() {
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const queryClient = useQueryClient();

    return useAsyncFn(
        async (params: { coin: string; oid: number }): Promise<boolean> => {
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

                const a = resolvePerpCoinIndex(params.coin, allMetas);
                if (a === -1) {
                    throw new Error('Failed to resolve coin index');
                }

                await exchangeClient.cancel({ cancels: [{ a, o: params.oid }] });
                toast({
                    message: 'Order cancelled',
                    type: 'success',
                });
                return true;
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : 'Failed to cancel order',
                    type: 'error',
                    error,
                });
                return false;
            }
        },
        [exchangeClient, queryClient],
    );
}
