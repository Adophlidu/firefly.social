import { useLingui } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { useAtomValue } from 'jotai';

import { calculateSlippagePrice } from '@/helpers/calculateSlippagePrice';
import { compact } from '@/helpers/compact';
import { isValidSize } from '@/helpers/isValidSize';
import { isGreaterThan } from '@/helpers/number';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { exchangeClientAtom } from '@/store/wallet';
import type { CoinInfo, Position } from '@/types/ui';

function stripPriceInput(raw: string): string {
    return raw.replace(/,/g, '').trim();
}

export interface UseSetPositionTpslOptions {
    position: Position | undefined;
    coinInfo: CoinInfo | null | undefined;
    /** Mark (or mid) for TP/SL validation vs OneKey `SetTpslModal`. */
    markPx: string | undefined;
    hasExistingTp: boolean;
    hasExistingSl: boolean;
}

export function useSetPositionTpsl({
    position,
    coinInfo,
    markPx,
    hasExistingTp,
    hasExistingSl,
}: UseSetPositionTpslOptions) {
    const { i18n } = useLingui();
    const exchangeClient = useAtomValue(exchangeClientAtom);

    return useAsyncFn(
        async (payload: { tpPrice: string; slPrice: string }): Promise<boolean> => {
            if (!position || !coinInfo) {
                toast({ message: i18n._('rn-ui.tpsl.error.marketUnavailable'), type: 'error' });
                return false;
            }

            const tpRaw = !hasExistingTp ? stripPriceInput(payload.tpPrice) : '';
            const slRaw = !hasExistingSl ? stripPriceInput(payload.slPrice) : '';

            const tpTriggerPx = tpRaw && isValidSize(tpRaw) ? tpRaw : undefined;
            const slTriggerPx = slRaw && isValidSize(slRaw) ? slRaw : undefined;

            if (!tpTriggerPx && !slTriggerPx) {
                toast({ message: i18n._('rn-ui.tpsl.error.priceRequired'), type: 'error' });
                return false;
            }

            const markBn = new BigNumber(markPx || '0');
            if (!markBn.isFinite() || markBn.lte(0)) {
                toast({ message: i18n._('rn-ui.tpsl.error.markPriceUnavailable'), type: 'error' });
                return false;
            }

            const isLong = isGreaterThan(position.szi, '0');
            const tpBn = tpTriggerPx ? new BigNumber(tpTriggerPx) : null;
            const slBn = slTriggerPx ? new BigNumber(slTriggerPx) : null;

            if (tpBn?.isFinite()) {
                const invalidLong = isLong && tpBn.lte(markBn);
                const invalidShort = !isLong && tpBn.gte(markBn);
                if (invalidLong || invalidShort) {
                    toast({
                        message: isLong
                            ? i18n._('rn-ui.tpsl.error.tpAboveMark.long')
                            : i18n._('rn-ui.tpsl.error.tpBelowMark.short'),
                        type: 'error',
                    });
                    return false;
                }
            }

            if (slBn?.isFinite()) {
                const invalidLong = isLong && slBn.gte(markBn);
                const invalidShort = !isLong && slBn.lte(markBn);
                if (invalidLong || invalidShort) {
                    toast({
                        message: isLong
                            ? i18n._('rn-ui.tpsl.error.slBelowMark.long')
                            : i18n._('rn-ui.tpsl.error.slAboveMark.short'),
                        type: 'error',
                    });
                    return false;
                }
            }

            try {
                if (!exchangeClient) {
                    throw new Error('Exchange client not initialized');
                }

                const szDecimals = coinInfo.szDecimals;
                const isBuyLong = isLong;

                const orders = compact([
                    tpTriggerPx
                        ? {
                              a: coinInfo.index,
                              b: !isBuyLong,
                              p: calculateSlippagePrice({
                                  price: tpTriggerPx,
                                  isBuy: !isBuyLong,
                                  szDecimals,
                              }),
                              s: '0',
                              r: true,
                              t: {
                                  trigger: {
                                      isMarket: true,
                                      tpsl: 'tp' as const,
                                      triggerPx: tpTriggerPx,
                                  },
                              },
                          }
                        : null,
                    slTriggerPx
                        ? {
                              a: coinInfo.index,
                              b: !isBuyLong,
                              p: calculateSlippagePrice({
                                  price: slTriggerPx,
                                  isBuy: !isBuyLong,
                                  szDecimals,
                              }),
                              s: '0',
                              r: true,
                              t: {
                                  trigger: {
                                      isMarket: true,
                                      tpsl: 'sl' as const,
                                      triggerPx: slTriggerPx,
                                  },
                              },
                          }
                        : null,
                ]);

                await exchangeClient.order({
                    grouping: 'positionTpsl',
                    orders,
                });

                toast({
                    message: i18n._('rn-ui.tpsl.success'),
                    type: 'success',
                });
                return true;
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : i18n._('rn-ui.tpsl.error.failure'),
                    type: 'error',
                    error,
                });
                return false;
            }
        },
        [exchangeClient, i18n, position, coinInfo, markPx, hasExistingTp, hasExistingSl],
    );
}
