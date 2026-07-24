'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { getQueryClient } from '@/configs/queryClient.js';

export function QueryClientProviders({ children }: { children: ReactNode }) {
    // `useState(getQueryClient)` runs the initializer once: a fresh isolated QueryClient per
    // server request (so the cache can't leak across ISR regenerations → no hydration #418),
    // and the shared singleton once per browser session. See getQueryClient for details.
    const [client] = useState(getQueryClient);
    return (
        <QueryClientProvider client={client}>
            <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
        </QueryClientProvider>
    );
}
