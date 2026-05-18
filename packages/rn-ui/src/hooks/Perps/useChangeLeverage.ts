import { useLingui } from '@lingui/react/macro';
import { useAtomValue, useSetAtom } from 'jotai';

import { TradeMarginMode } from '@/constants/enum';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { leverageAtom, leverageSheetOpenAtom, marginModeAtom, setLeverageAtom } from '@/store/tradeForm';
import { exchangeClientAtom, walletAddressAtom } from '@/store/wallet';

export function useChangeLeverage(coinIndex: number) {
    const { i18n } = useLingui();
    const value = useAtomValue(walletAddressAtom);
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const marginMode = useAtomValue(marginModeAtom);
    const leverage = useAtomValue(leverageAtom);
    const setLeverage = useSetAtom(setLeverageAtom);
    const setLeverageSheetOpen = useSetAtom(leverageSheetOpenAtom);

    return useAsyncFn(
        async (newLeverage: number) => {
            try {
                if (!value || !exchangeClient) return;
                if (newLeverage !== leverage) {
                    await exchangeClient.updateLeverage({
                        asset: coinIndex,
                        isCross: marginMode === TradeMarginMode.CROSS,
                        leverage: newLeverage,
                    });
                    setLeverage(newLeverage);
                }
                setLeverageSheetOpen(false);
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : i18n._('rn-ui.changeLeverage.failure'),
                    type: 'error',
                    error,
                });
            }
        },
        [value, exchangeClient, coinIndex, i18n, marginMode, leverage, setLeverage, setLeverageSheetOpen],
    );
}
