import type { ISubscription } from '@nktkas/hyperliquid';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { subscriptionClientAtom, walletAddressAtom } from '@/store/wallet';
import type { OpenOrder } from '@/types/ui';

export function useOpenOrders() {
    const value = useAtomValue(walletAddressAtom);
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
    const subscriptionClient = useAtomValue(subscriptionClientAtom);

    useEffect(() => {
        if (!value || !subscriptionClient) return;

        let subscription: ISubscription;
        subscriptionClient
            .openOrders({ user: value, dex: 'ALL_DEXS' }, (data) => {
                setOpenOrders(data.orders as OpenOrder[]);
            })
            .then((sub) => {
                subscription = sub;
            });

        return () => {
            subscription?.unsubscribe();
            setOpenOrders([]);
        };
    }, [value, subscriptionClient]);

    return openOrders;
}
