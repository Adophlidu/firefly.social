// useChangeMarginMode
import { useLingui } from '@lingui/react/macro';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { TradeMarginMode } from '@/constants/enum';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { leverageAtom, marginModeAtom, marginModeSheetOpenAtom } from '@/store/tradeForm';
import { exchangeClientAtom, walletAddressAtom } from '@/store/wallet';

export function useChangeMarginMode(coinIndex: number) {
    const { i18n } = useLingui();
    const value = useAtomValue(walletAddressAtom);
    const exchangeClient = useAtomValue(exchangeClientAtom);
    const [marginMode, setMarginMode] = useAtom(marginModeAtom);
    const leverage = useAtomValue(leverageAtom);
    const setMarginModeSheetOpen = useSetAtom(marginModeSheetOpenAtom);

    return useAsyncFn(
        async (newMode: TradeMarginMode) => {
            try {
                if (!value || !exchangeClient) return;
                if (newMode !== marginMode) {
                    await exchangeClient.updateLeverage({
                        asset: coinIndex,
                        isCross: newMode === TradeMarginMode.CROSS,
                        leverage,
                    });
                    setMarginMode(newMode);
                }
                setMarginModeSheetOpen(false);
            } catch (error) {
                toast({
                    message: error instanceof Error ? error.message : i18n._('rn-ui.changeMarginMode.failure'),
                    type: 'error',
                    error,
                });
            }
        },
        [value, exchangeClient, coinIndex, i18n, marginMode, leverage, setMarginMode, setMarginModeSheetOpen],
    );
}
