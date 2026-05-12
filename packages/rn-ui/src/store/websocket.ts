import type { ClearinghouseStateResponse, ISubscription } from '@nktkas/hyperliquid';
import { atom } from 'jotai';
import { withAtomEffect } from 'jotai-effect';

import { subscriptionClientAtom, walletAddressAtom } from '@/store/wallet';

interface PerpAssetCtxSchema {
    prevDayPx: string;
    dayNtlVlm: string;
    markPx: string;
    midPx: string | null;
    funding: string;
    openInterest: string;
    premium: string | null;
    oraclePx: string;
    impactPxs: string[] | null;
    dayBaseVlm: string;
}

export const assetCtxsAtom = withAtomEffect(atom<PerpAssetCtxSchema[]>([]), (get, set) => {
    const subscriptionClient = get(subscriptionClientAtom);
    if (!subscriptionClient) {
        set(assetCtxsAtom, []);
        return;
    }

    let cleanedUp = false;
    let subscription: ISubscription | undefined;
    subscriptionClient
        .assetCtxs((ctxs) => {
            set(assetCtxsAtom, ctxs.ctxs);
        })
        .then((sub) => {
            if (cleanedUp) sub.unsubscribe();
            else subscription = sub;
        });

    return () => {
        cleanedUp = true;
        subscription?.unsubscribe();
    };
});

export const allDexsAssetCtxsAtom = withAtomEffect(
    atom<Array<[dex: string, ctx: PerpAssetCtxSchema[]]>>([]),
    (get, set) => {
        const subscriptionClient = get(subscriptionClientAtom);
        if (!subscriptionClient) {
            set(allDexsAssetCtxsAtom, []);
            return;
        }

        let cleanedUp = false;
        let subscription: ISubscription | undefined;

        subscriptionClient
            .allDexsAssetCtxs((data) => {
                set(allDexsAssetCtxsAtom, data.ctxs);
            })
            .then((sub) => {
                if (cleanedUp) sub.unsubscribe();
                else subscription = sub;
            });

        return () => {
            cleanedUp = true;
            subscription?.unsubscribe();
        };
    },
);

export const allDexsClearinghouseStateAtom = withAtomEffect(
    atom<Array<[dex: string, state: ClearinghouseStateResponse]>>([]),
    (get, set) => {
        const walletAddress = get(walletAddressAtom);
        const subscriptionClient = get(subscriptionClientAtom);
        if (!walletAddress || !subscriptionClient) {
            set(allDexsClearinghouseStateAtom, []);
            return;
        }

        let subscription: ISubscription;
        subscriptionClient
            .allDexsClearinghouseState(
                {
                    user: walletAddress,
                },
                (data) => {
                    set(allDexsClearinghouseStateAtom, data.clearinghouseStates);
                },
            )
            .then((sub) => {
                subscription = sub;
            })
            .catch(() => {
                set(allDexsClearinghouseStateAtom, []);
            });

        return () => {
            subscription?.unsubscribe();
            set(allDexsClearinghouseStateAtom, []);
        };
    },
);

interface SpotStateBalanceSchema {
    coin: string;
    token: number;
    total: string;
    hold: string;
}

interface SpotStateSchema {
    balances?: SpotStateBalanceSchema[];
}

interface SpotStateEventSchema {
    user?: string;
    spotState?: SpotStateSchema;
}

export const spotStateAtom = withAtomEffect(atom<SpotStateSchema | undefined>(undefined), (get, set) => {
    const walletAddress = get(walletAddressAtom);
    const subscriptionClient = get(subscriptionClientAtom);
    if (!walletAddress || !subscriptionClient) {
        set(spotStateAtom, undefined);
        return;
    }

    let subscription: ISubscription;
    subscriptionClient
        .spotState(
            {
                user: walletAddress,
            },
            (data: SpotStateEventSchema) => {
                set(spotStateAtom, data?.spotState);
            },
        )
        .then((sub) => {
            subscription = sub;
        })
        .catch(() => {
            set(spotStateAtom, undefined);
        });

    return () => {
        subscription?.unsubscribe();
        set(spotStateAtom, undefined);
    };
});
