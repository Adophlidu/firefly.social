import { useLingui } from '@lingui/react/macro';
import { useAtomValue, useSetAtom } from 'jotai';

import { OrderType } from '@/constants/enum';
import { calculateSlippagePrice } from '@/helpers/calculateSlippagePrice';
import { calculateTpSlPrice } from '@/helpers/calculateTpSlPrice';
import { compact } from '@/helpers/compact';
import { isValidSize } from '@/helpers/isValidSize';
import { isGreaterThanOrEqualTo, isLessThan, isNumber, isZero } from '@/helpers/number';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import {
    coinIndexAtom,
    currentPriceAtom,
    leverageAtom,
    orderSafeTypeAtom,
    orderTypeAtom,
    setSizeInputValueAtom,
    sizeAtom,
    sizeDecimalAtom,
    slRatioAtom,
    tpRatioAtom,
} from '@/store/tradeForm';
import { exchangeClientAtom } from '@/store/wallet';

export function useSubmitOrder() {
    const { i18n } = useLingui();
    const size = useAtomValue(sizeAtom);
    const coinIndex = useAtomValue(coinIndexAtom);
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const currentPrice = useAtomValue(currentPriceAtom);
    const safeType = useAtomValue(orderSafeTypeAtom);
    const orderType = useAtomValue(orderTypeAtom);
    const tpRatio = useAtomValue(tpRatioAtom);
    const slRatio = useAtomValue(slRatioAtom);
    const leverage = useAtomValue(leverageAtom);
    const szDecimals = useAtomValue(sizeDecimalAtom);

    const setInputValue = useSetAtom(setSizeInputValueAtom);

    return useAsyncFn(
        async (isLong: boolean) => {
            try {
                if (!exchangeClient) {
                    throw new Error('Exchange client is not available');
                }
                if (coinIndex === null) {
                    throw new Error('Asset is not selected');
                }
                if (!isValidSize(size)) {
                    throw new Error('Invalid size');
                }
                if (!currentPrice || !isNumber(currentPrice) || isLessThan(currentPrice, 0) || isZero(currentPrice)) {
                    throw new Error('Invalid price');
                }

                const { tpPrice, slPrice } = calculateTpSlPrice({
                    entryPrice: currentPrice,
                    tpRatio,
                    slRatio,
                    isLong,
                    size,
                    leverage,
                    szDecimals,
                });

                // For limit orders, validate stop loss price against current price
                if (orderType === OrderType.LIMIT) {
                    if (isLong && slPrice && isValidSize(slPrice) && isGreaterThanOrEqualTo(slPrice, currentPrice)) {
                        throw new Error('Stop loss price must be less than current price for long position');
                    }
                    if (!isLong && slPrice && isValidSize(slPrice) && isLessThan(slPrice, currentPrice)) {
                        throw new Error('Stop loss price must be greater than current price for short position');
                    }
                }

                const isMarket = orderType === OrderType.MARKET;
                const isReduceOnly = safeType === 'reduceOnly';
                await exchangeClient.order({
                    orders: compact([
                        {
                            a: coinIndex,
                            b: isLong,
                            p: !isMarket
                                ? currentPrice
                                : calculateSlippagePrice({
                                      price: currentPrice,
                                      isBuy: isLong,
                                      szDecimals,
                                  }),
                            s: size,
                            r: isReduceOnly,
                            t: {
                                limit: {
                                    tif: isMarket ? 'FrontendMarket' : 'Gtc',
                                },
                            },
                        },
                        !isReduceOnly && tpPrice && isValidSize(tpPrice)
                            ? {
                                  a: coinIndex,
                                  b: !isLong,
                                  p: calculateSlippagePrice({
                                      price: tpPrice,
                                      isBuy: !isLong,
                                      szDecimals,
                                  }),
                                  s: size,
                                  r: true,
                                  t: {
                                      trigger: {
                                          isMarket: true,
                                          tpsl: 'tp',
                                          triggerPx: tpPrice,
                                      },
                                  },
                              }
                            : null,
                        !isReduceOnly && slPrice && isValidSize(slPrice)
                            ? {
                                  a: coinIndex,
                                  b: !isLong,
                                  p: calculateSlippagePrice({
                                      price: slPrice,
                                      isBuy: !isLong,
                                      szDecimals,
                                  }),
                                  s: size,
                                  r: true,
                                  t: {
                                      trigger: {
                                          isMarket: true,
                                          tpsl: 'sl',
                                          triggerPx: slPrice,
                                      },
                                  },
                              }
                            : null,
                    ]),
                    grouping:
                        !isReduceOnly && (isValidSize(tpPrice || '') || isValidSize(slPrice || ''))
                            ? 'normalTpsl'
                            : 'na',
                });

                toast({
                    message: i18n._('rn-ui.submitOrder.success'),
                    type: 'success',
                });

                // Reset form
                setInputValue('');
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : i18n._('rn-ui.submitOrder.failure'),
                    type: 'error',
                    error,
                });
            }
        },
        [
            size,
            szDecimals,
            exchangeClient,
            currentPrice,
            safeType,
            coinIndex,
            i18n,
            tpRatio,
            slRatio,
            leverage,
            orderType,
            setInputValue,
        ],
    );
}
