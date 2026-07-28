import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { NuqsAdapter } from '@/compat/NuqsAdapter.js';
import { InitialProviders } from '@/components/InitialProviders.js';
import { LinguiClientProvider } from '@/components/LinguiClientProvider.js';
import { WalletStackBoundary } from '@/components/WalletStackBoundary.js';
import { queryClient } from '@/configs/queryClient.js';

/**
 * Provider tree for the new SSR app, mirroring @/components/Providers.js but
 * without @tanstack/react-query-next-experimental (ReactQueryStreamedHydration
 * is Next-specific and unresolvable outside Next). QueryClientProvider alone
 * is enough: the library hydrates from its own payload, not react-query's.
 * NuqsAdapter is wired to the library's router (nuqs/adapters/next/app is
 * Next-only).
 */
export function AppProviders({ locale, children }: { locale?: string; children?: ReactNode }) {
    return (
        <LinguiClientProvider locale={locale}>
            <QueryClientProvider client={queryClient}>
                <InitialProviders>
                    <NuqsAdapter>
                        <WalletStackBoundary>{children}</WalletStackBoundary>
                    </NuqsAdapter>
                </InitialProviders>
            </QueryClientProvider>
        </LinguiClientProvider>
    );
}
