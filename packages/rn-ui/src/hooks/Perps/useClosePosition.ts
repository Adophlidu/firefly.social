import { useAtomValue } from 'jotai';

import { calculateSlippagePrice } from '@/helpers/calculateSlippagePrice';
import { isGreaterThan } from '@/helpers/number';
import { toast } from '@/helpers/toast';
import { useCoinInfo } from '@/hooks/Perps/useCoinInfo';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { exchangeClientAtom } from '@/store/wallet';
import type { Position } from '@/types/ui';

interface ClosePositionOptions {
    coinName?: string;
    type?: 'market' | 'limit';
    position?: Position;
}

export function useClosePosition({ coinName, type, position }: ClosePositionOptions) {
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const { data: coinInfo } = useCoinInfo(coinName);

    return useAsyncFn(
        async (price: string, size: string) => {
            if (!coinName || !position || !type) return;

            try {
                if (!exchangeClient) {
                    throw new Error('Exchange client not initialized');
                }
                if (!coinInfo) {
                    throw new Error('Failed to fetch coin info');
                }

                const isBuy = isGreaterThan(position.szi, '0');
                const isMarket = type === 'market';
                await exchangeClient.order({
                    grouping: 'na',
                    orders: [
                        {
                            a: coinInfo.index,
                            b: !isBuy,
                            p: isMarket
                                ? calculateSlippagePrice({
                                      price,
                                      isBuy: !isBuy,
                                      szDecimals: coinInfo.szDecimals,
                                  })
                                : price,
                            r: true,
                            s: size,
                            t: { limit: { tif: isMarket ? 'FrontendMarket' : 'Gtc' } },
                        },
                    ],
                });
                toast({
                    message: 'Position closed successfully',
                    type: 'success',
                });
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : 'Failed to close position',
                    type: 'error',
                    error,
                });
            }
        },
        [exchangeClient, coinInfo, type, position, coinName],
    );
}
