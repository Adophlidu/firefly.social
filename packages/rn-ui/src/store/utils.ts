import { atom } from 'jotai';

import { store } from '.';

type AsyncState<T> =
    | { status: 'loading' }
    | { status: 'error'; error: Error }
    | { status: 'success'; data: T; timestamp: number };

export function atomWithExpire<T>(fetchFn: () => Promise<T>, expireMs: number = 10 * 60 * 1000) {
    const stateAtom = atom<AsyncState<T>>({ status: 'loading' });

    let pendingPromise: Promise<T> | null = null;

    const dataAtom = atom(
        (get) => {
            const state = get(stateAtom);

            if (state.status === 'loading') return state;
            if (state.status === 'error') return state;

            const isExpired = Date.now() - state.timestamp > expireMs;

            if (isExpired) {
                setTimeout(() => {
                    refreshData().catch(() => {});
                }, 0);
            }

            return state;
        },
        () => {},
    );

    const refreshData = async () => {
        if (pendingPromise) return pendingPromise;

        pendingPromise = fetchFn()
            .then((data) => {
                store.set(stateAtom, {
                    status: 'success',
                    data,
                    timestamp: Date.now(),
                });
                return data;
            })
            .catch((error) => {
                store.set(stateAtom, {
                    status: 'error',
                    error: error as Error,
                });
                throw error;
            })
            .finally(() => {
                pendingPromise = null;
            });

        return pendingPromise;
    };

    const mountedAtom = atom(
        (get) => get(dataAtom),
        (_, set) => set(dataAtom),
    );

    mountedAtom.onMount = () => {
        const state = store.get(stateAtom);

        if (state.status === 'loading') {
            refreshData().catch(() => {});
        }

        return () => {};
    };

    return {
        atom: mountedAtom,
        refresh: refreshData,
    };
}
