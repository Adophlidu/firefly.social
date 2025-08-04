import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
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
