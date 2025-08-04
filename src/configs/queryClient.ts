import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 60_000,
        },
    },
};

export const queryClient = new QueryClient(queryClientConfig);
