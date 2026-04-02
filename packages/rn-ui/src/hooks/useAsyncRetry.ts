import { type DependencyList, useCallback, useState } from 'react';

import { type AsyncState, useAsync } from '@/hooks/useAsync';

export type AsyncStateRetry<T> = AsyncState<T> & {
    retry(): void;
};

export const useAsyncRetry = <T>(fn: () => Promise<T>, deps: DependencyList = []) => {
    const [attempt, setAttempt] = useState<number>(0);
    const state = useAsync(fn, [...deps, attempt]);

    const stateLoading = state.loading;
    const retry = useCallback(() => {
        if (stateLoading) return;

        setAttempt((currentAttempt) => currentAttempt + 1);
    }, [...deps, stateLoading]);

    return { ...state, retry };
};
