import { MutationCache, QueryCache, QueryClient, type QueryClientConfig } from '@tanstack/react-query';

const queryCache = new QueryCache();
const mutationCache = new MutationCache();

export const queryClientConfig: QueryClientConfig = {
    queryCache,
    mutationCache,
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 60_000, // 1 minute
        },
    },
};

export const queryClient = new QueryClient(queryClientConfig);
