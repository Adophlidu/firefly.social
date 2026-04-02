import { type DependencyList, useEffect } from 'react';

import { useAsyncFn } from '@/hooks/useAsyncFn';
import { type FunctionReturningPromise } from '@/types/async';

export { type AsyncFnReturn, type AsyncState, type FunctionReturningPromise } from '@/types/async';

export function useAsync<T extends FunctionReturningPromise>(fn: T, deps: DependencyList = []) {
    const [state, callback] = useAsyncFn(fn, deps, {
        loading: true,
    });

    useEffect(() => {
        callback();
    }, [callback]);

    return state;
}
