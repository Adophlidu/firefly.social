import type { StoreApi, UseBoundStore } from 'zustand';

type WithSelectors<S> = S extends { getState: () => infer T } ? S & { use: { [K in keyof T]: () => T[K] } } : never;

export type CustomSelectors<T> = {
    [K in keyof T]?: (state: T) => T[K];
};

export function createSelectors<S extends UseBoundStore<StoreApi<object>>>(
    _store: S,
    customSelectors?: CustomSelectors<S extends { getState: () => infer T } ? T : never>,
) {
    type State = S extends { getState: () => infer T } ? T : never;
    type UseSelectors = { [K in keyof State]: () => State[K] };

    const store = _store as WithSelectors<S>;
    const state = store.getState() as State;
    const useSelectors = {} as UseSelectors;

    for (const k of Object.keys(state)) {
        const key = k as keyof State;
        if (customSelectors?.[key]) {
            useSelectors[key] = () => store((s) => customSelectors[key]!(s as State));
        } else {
            useSelectors[key] = () => store((s) => (s as State)[key]);
        }
    }

    store.use = useSelectors as WithSelectors<S>['use'];
    return store;
}
