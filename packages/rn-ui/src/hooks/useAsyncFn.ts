import { type DependencyList, useCallback, useRef, useState } from 'react';

import useMountedState from '@/hooks/useMountedState';
import type { AsyncFnReturn, FunctionReturningPromise, StateFromFunctionReturningPromise } from '@/types/async';

export function useAsyncFn<T extends FunctionReturningPromise>(
    fn: T,
    deps: DependencyList = [],
    initialState: StateFromFunctionReturningPromise<T> = { loading: false },
): AsyncFnReturn<T> {
    const lastCallId = useRef(0);
    const isMounted = useMountedState();
    const [state, set] = useState<StateFromFunctionReturningPromise<T>>(initialState);

    const callback = useCallback((...args: Parameters<T>): ReturnType<T> => {
        lastCallId.current += 1;
        const callId = lastCallId.current;

        if (!state.loading) {
            set((prevState) => ({ ...prevState, loading: true }));
        }

        return fn(...args).then(
            (value) => {
                isMounted() && callId === lastCallId.current && set({ value, loading: false });

                return value;
            },
            (error) => {
                isMounted() && callId === lastCallId.current && set({ error, loading: false });

                return error;
            },
        ) as ReturnType<T>;
    }, deps);

    return [state, callback as unknown as T];
}
