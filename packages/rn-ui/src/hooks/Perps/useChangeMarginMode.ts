// useChangeMarginMode
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { TradeMarginMode } from '@/constants/enum';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { leverageAtom, marginModeAtom, marginModeSheetOpenAtom } from '@/store/tradeForm';
import { exchangeClientAtom, walletAddressAtom } from '@/store/wallet';

export function useChangeMarginMode(coinIndex: number) {
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
                    message: error instanceof Error ? error.message : 'Failed to change margin mode',
                    type: 'error',
                    error,
                });
            }
        },
        [value, exchangeClient, coinIndex, marginMode, leverage, setMarginMode, setMarginModeSheetOpen],
    );
}
