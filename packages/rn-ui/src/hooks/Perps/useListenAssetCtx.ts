import type { ISubscription } from '@nktkas/hyperliquid';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

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

    const lastSnapshotRef = useRef<{
        marginMode: TradeMarginMode;
        leverage: number;
        balance: string;
    } | null>(null);

    useEffect(() => {
        if (!value || !coinName || !subscriptionClient) return;

        lastSnapshotRef.current = null;

        let subscription: ISubscription;
        subscriptionClient
            .activeAssetData({ user: value, coin: coinName }, (data) => {
                const marginMode = data.leverage.type as TradeMarginMode;
                const leverage = data.leverage.value;
                const balance = data.availableToTrade?.[0] || '0';
                const prev = lastSnapshotRef.current;
                if (
                    prev &&
                    prev.marginMode === marginMode &&
                    prev.leverage === leverage &&
                    prev.balance === balance
                ) {
                    return;
                }
                lastSnapshotRef.current = { marginMode, leverage, balance };
                setMarginModeAtom(marginMode);
                setLeverage(leverage);
                setAssetBalance(balance);
            })
            .then((sub) => {
                subscription = sub;
            });

        return () => {
            subscription?.unsubscribe();
            lastSnapshotRef.current = null;
            setAssetBalance('0');
            setLeverage(1);
            setMarginModeAtom(TradeMarginMode.ISOLATED);
        };
    }, [value, coinName, subscriptionClient, setAssetBalance, setLeverage, setMarginModeAtom]);
}
