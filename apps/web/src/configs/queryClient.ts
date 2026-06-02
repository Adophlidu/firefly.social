import { captureException, ExceptionId } from '@dimensiondev/exception-tracker';
import { MutationCache, QueryCache, QueryClient, type QueryClientConfig } from '@tanstack/react-query';

/**
 * Error types that should be ignored (handled elsewhere or expected)
 */
const IGNORED_ERROR_NAMES = [
    'AbortError', // User-cancelled requests
    'ForbiddenError', // Handled by AuthGuard
    'FireflyUnauthorizedError', // Handled by the signed-out screen (global-error boundary)
    'SessionExpiredError', // Handled by session management
    'AccountSuspendedError', // Handled by SuspendedAccountFallback
];

/**
 * Checks if error should be reported to exception tracker
 */
function shouldReportQueryError(error: unknown): boolean {
    if (!(error instanceof Error)) return true;

    // Skip ignored error types
    if (IGNORED_ERROR_NAMES.includes(error.name)) {
        return false;
    }

    // Skip user-cancelled operations
    if (error.message.includes('aborted') || error.message.includes('cancelled')) {
        return false;
    }

    return true;
}

const queryCache = new QueryCache({
    onError: (error, query) => {
        // Only report errors after initial success (reduces noise from expected failures)
        // If query has never succeeded, it might be a permission/auth issue that's expected
        if (query.state.dataUpdateCount === 0) {
            return;
        }

        if (!shouldReportQueryError(error)) {
            return;
        }

        captureException(ExceptionId.REACT_QUERY_ERROR, error, {
            queryKey: JSON.stringify(query.queryKey).substring(0, 200),
            handler: 'QueryCache.onError',
            errorType: 'query',
        });
    },
});

const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
        if (!shouldReportQueryError(error)) {
            return;
        }

        captureException(ExceptionId.REACT_QUERY_ERROR, error, {
            mutationKey: mutation.options.mutationKey
                ? JSON.stringify(mutation.options.mutationKey).substring(0, 200)
                : 'unknown',
            handler: 'MutationCache.onError',
            errorType: 'mutation',
        });
    },
});

export const queryClientConfig: QueryClientConfig = {
    queryCache,
    mutationCache,
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

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    Object.defineProperty(window, '__TANSTACK_QUERY_CLIENT__', {
        value: queryClient,
        configurable: true,
    });
}
