import type { ExchangeClient, SubscriptionClient } from '@nktkas/hyperliquid';
import { atom } from 'jotai';
import { withAtomEffect } from 'jotai-effect';

import type { WalletClient } from '@/types/ui';

export const walletClientAtom = atom<WalletClient | null>(null);
export const exchangeClientAtom = atom<ExchangeClient | null>(null);

const subscriptionBaseClientAtom = atom<SubscriptionClient | null>(null);

export const subscriptionClientAtom = atom(
    (get) => get(subscriptionBaseClientAtom),
    (get, set, newClient: SubscriptionClient | null) => {
        const currentClient = get(subscriptionBaseClientAtom);
        if (currentClient) return; // Prevent overwriting an existing client

        set(subscriptionBaseClientAtom, newClient);
    },
);

export const walletAddressAtom = withAtomEffect(atom<string | null>(null), (get, set) => {
    const walletClient = get(walletClientAtom);
    if (!walletClient) {
        set(walletAddressAtom, null);
        return;
    }

    walletClient
        .getAddresses()
        .then((addresses) => {
            set(walletAddressAtom, addresses?.[0] || null);
        })
        .catch(() => {
            set(walletAddressAtom, null);
        });

    return () => {
        set(walletAddressAtom, null);
    };
});
