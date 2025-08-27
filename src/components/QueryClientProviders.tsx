'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import type { ReactNode } from 'react';

import { queryClient } from '@/configs/queryClient.js';

export function QueryClientProviders({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
            <ReactQueryDevtools client={queryClient} />
        </QueryClientProvider>
    );
}
