import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import { MutationCache, QueryCache, QueryClient, type QueryClientConfig } from '@tanstack/react-query';

import { InvalidPolymarketAccountError } from '@/constants/error.js';

function shouldReportError(error: unknown): boolean {
    if (error instanceof DOMException && error.name === 'AbortError') return false;
    if (error instanceof InvalidPolymarketAccountError) return false;
    return true;
}

export const queryClientConfig: QueryClientConfig = {
    queryCache: new QueryCache({
        onError(error) {
            if (shouldReportError(error)) {
                captureException(ExceptionId.REACT_QUERY_ERROR, error, { handler: 'QueryCache' });
            }
        },
    }),
    mutationCache: new MutationCache({
        onError(error) {
            if (shouldReportError(error)) {
                captureException(ExceptionId.REACT_QUERY_ERROR, error, { handler: 'MutationCache' });
            }
        },
    }),
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: (query) => {
                const primaryScope = query.queryKey[0];
                if (primaryScope === 'firefly-profile' || primaryScope === 'profile') return 0;
                return 60_000;
            },
        },
    },
};

export const queryClient = new QueryClient(queryClientConfig);
