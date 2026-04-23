import type { ISubscription } from '@nktkas/hyperliquid';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { TradeMarginMode } from '@/constants/enum';
import { assetBalanceAtom, coinNameAtom, marginModeAtom, setLeverageAtom } from '@/store/tradeForm';
import { subscriptionClientAtom, walletAddressAtom } from '@/store/wallet';

export function useListenAssetCtx() {
    const value = useAtomValue(walletAddressAtom);
    const coinName = useAtomValue(coinNameAtom);
    const subscriptionClient = useAtomValue(subscriptionClientAtom);

    const setMarginModeAtom = useSetAtom(marginModeAtom);
    const setLeverage = useSetAtom(setLeverageAtom);
    const setAssetBalance = useSetAtom(assetBalanceAtom);

    useEffect(() => {
        if (!value || !coinName || !subscriptionClient) return;

        let subscription: ISubscription;
        subscriptionClient
            .activeAssetData({ user: value, coin: coinName }, (data) => {
                setMarginModeAtom(data.leverage.type as TradeMarginMode);
                setLeverage(data.leverage.value);
                setAssetBalance(data.availableToTrade?.[0] || '0');
            })
            .then((sub) => {
                subscription = sub;
            });

        return () => {
            subscription?.unsubscribe();
            setAssetBalance('0');
            setLeverage(1);
            setMarginModeAtom(TradeMarginMode.ISOLATED);
        };
    }, [value, coinName, subscriptionClient, setAssetBalance, setLeverage, setMarginModeAtom]);
}
