import { I18nProvider } from '@lingui/react';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import { queryClient as defaultQueryClient } from '@/configs/queryClient';
import { type RnUiLocale, setupRnUiI18n } from '@/i18n';
import config from '@/tamagui.config';

export interface ProviderProps {
    children?: ReactNode;
    theme?: 'light' | 'dark' | 'system';
    /** When omitted, uses the package default client from `@/configs/queryClient`. */
    queryClient?: QueryClient;
    /**
     * Active locale for rn-ui's internal i18n. Defaults to `'en'`. Unknown
     * values fall back to `'en'` with a dev-mode warning. The locale is
     * applied to a fresh, instance-scoped Lingui `i18n` that lives behind
     * an inner `<I18nProvider>`; it does NOT register with the consumer
     * app's global Lingui singleton.
     */
    locale?: RnUiLocale;
}

/** React Query + Tamagui + i18n shell. Compose `PerpsBindingsProvider` and optionally `PerpsAuthGate` outside or inside as needed. */
export function Provider({ children, theme = 'system', queryClient: queryClientProp, locale = 'en' }: ProviderProps) {
    const colorScheme = useColorScheme();
    const resolvedTheme: 'light' | 'dark' =
        theme === 'light' || theme === 'dark' ? theme : colorScheme === 'dark' ? 'dark' : 'light';

    const qc = queryClientProp ?? defaultQueryClient;

    // Recreate the i18n instance whenever the consumer flips locale (A2a).
    // Identity change propagates through context so all rn-ui children re-render.
    const i18n = useMemo(() => setupRnUiI18n(locale), [locale]);

    return (
        <QueryClientProvider client={qc}>
            <I18nProvider i18n={i18n}>
                <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
                    {children}
                </TamaguiProvider>
            </I18nProvider>
        </QueryClientProvider>
    );
}
