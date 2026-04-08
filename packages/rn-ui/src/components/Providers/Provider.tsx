import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui';

import { HyperliquidProvider } from '@/components/Providers/HyperliquidProvider';
import { SessionProvider } from '@/components/Providers/SessionProvider';
import { queryClient } from '@/configs/queryClient';
import { FIREFLY_ROOT_URL, FIREFLY_ROOT_URL_DEV } from '@/constants/static';
import { fireflySessionHolder } from '@/providers/fireflySessionHolder';
import config from '@/tamagui.config';

interface ProviderProps extends TamaguiProviderProps {
    token?: string;
    apiMode?: 'prod' | 'dev';
    children?: ReactNode;
    onLogin?: () => Promise<void>;
}

export function Provider({ children, defaultTheme = 'light', token, apiMode, onLogin, ...rest }: ProviderProps) {
    const colorScheme = useColorScheme();
    const theme = defaultTheme || (colorScheme === 'dark' ? 'dark' : 'light');

    useEffect(() => {
        fireflySessionHolder.setAuthToken(token ?? null);
        fireflySessionHolder.setBaseUrl(apiMode === 'dev' ? FIREFLY_ROOT_URL_DEV : FIREFLY_ROOT_URL);
    }, [token, apiMode]);

    return (
        <TamaguiProvider config={config} defaultTheme={theme} {...rest}>
            <QueryClientProvider client={queryClient}>
                <HyperliquidProvider>
                    <SessionProvider token={token} onLogin={onLogin}>
                        {children}
                    </SessionProvider>
                </HyperliquidProvider>
            </QueryClientProvider>
        </TamaguiProvider>
    );
}
