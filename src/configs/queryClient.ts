import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
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
});
