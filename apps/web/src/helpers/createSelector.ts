import { type StoreApi, type UseBoundStore } from 'zustand';

type WithSelectors<S> = S extends { getState: () => infer T } ? S & { use: { [K in keyof T]: () => T[K] } } : never;

export type CustomSelectors<T> = {
    [K in keyof T]?: (state: T) => T[K];
};

export function createSelectors<S extends UseBoundStore<StoreApi<object>>>(
    _store: S,
    customSelectors?: CustomSelectors<S extends { getState: () => infer T } ? T : never>,
) {
    const store = _store as WithSelectors<typeof _store>;
    store.use = {};

    const state = store.getState();

    for (const k of Object.keys(state)) {
        const key = k as keyof typeof state;
        if (customSelectors?.[key]) {
            (store.use as any)[k] = () => store(customSelectors[key]!);
        } else {
            (store.use as any)[k] = () => store((s) => s[key]);
        }
    }

    return store;
}
