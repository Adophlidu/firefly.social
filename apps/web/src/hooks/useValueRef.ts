import { use, useSyncExternalStore } from 'react';

import type { ValueRef, ValueRefWithReady } from '@/libs/ValueRef.js';

function getServerSnapshot() {
    return null;
}

export function useValueRef<T>(ref: ValueRef<T>): T | null {
    if ('readyPromise' in ref) {
        const ref2 = ref as ValueRefWithReady<T>;
        if (!ref2.ready) use(ref2.readyPromise);
    }
    return useSyncExternalStore(
        (f) => ref.addListener(f),
        () => ref.value,
        getServerSnapshot,
    );
}
