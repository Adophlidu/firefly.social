import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import { queryClient as defaultQueryClient } from '@/configs/queryClient';
import config from '@/tamagui.config';

export interface ProviderProps {
    children?: ReactNode;
    theme?: 'light' | 'dark' | 'system';
    /** When omitted, uses the package default client from `@/configs/queryClient`. */
    queryClient?: QueryClient;
}

/** React Query + Tamagui shell only. Compose `PerpsBindingsProvider` and optionally `PerpsAuthGate` outside or inside as needed. */
export function Provider({ children, theme = 'system', queryClient: queryClientProp }: ProviderProps) {
    const colorScheme = useColorScheme();
    const resolvedTheme: 'light' | 'dark' =
        theme === 'light' || theme === 'dark' ? theme : colorScheme === 'dark' ? 'dark' : 'light';

    const qc = queryClientProp ?? defaultQueryClient;

    return (
        <QueryClientProvider client={qc}>
            <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
                {children}
            </TamaguiProvider>
        </QueryClientProvider>
    );
}
