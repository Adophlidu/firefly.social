import { ExchangeClient, SubscriptionClient, WebSocketTransport } from '@nktkas/hyperliquid';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { type ReactNode, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui';

import { LoginFallback } from '@/components/LoginFallback';
import { queryClient } from '@/configs/queryClient';
import { httpTransport } from '@/providers/client';
import { store } from '@/store';
import { navigateAtom, toastAtom } from '@/store/global';
import { apiModeAtom, sessionTokenAtom } from '@/store/session';
import { exchangeClientAtom, subscriptionClientAtom, walletClientAtom } from '@/store/wallet';
import config from '@/tamagui.config';
import type { NavigateFunc, ToastFn, WalletClient } from '@/types/ui';

interface ProviderProps extends TamaguiProviderProps {
    token: string | null;
    apiMode?: 'prod' | 'dev';
    children?: ReactNode;
    walletClient?: WalletClient;
    toast: ToastFn;
    navigate: NavigateFunc;
}
const wsTransport = new WebSocketTransport();

export function Provider({
    children,
    defaultTheme = 'light',
    token,
    apiMode,
    walletClient,
    toast,
    navigate,
    ...rest
}: ProviderProps) {
    const colorScheme = useColorScheme();
    const [authToken, setToken] = useAtom(sessionTokenAtom);
    const setApiMode = useSetAtom(apiModeAtom);
    const setExchangeClient = useSetAtom(exchangeClientAtom);
    const setWalletClient = useSetAtom(walletClientAtom);
    const setToast = useSetAtom(toastAtom);
    const setNavigate = useSetAtom(navigateAtom);
    const theme = defaultTheme || (colorScheme === 'dark' ? 'dark' : 'light');

    useEffect(() => {
        setToken(token ?? null);
        setApiMode(apiMode ?? 'prod');
    }, [token, apiMode, setApiMode, setToken, setExchangeClient]);
    useEffect(() => {
        if (!authToken || !walletClient) {
            setExchangeClient(null);
            setWalletClient(null);
            return;
        }
        const exchangeClient = new ExchangeClient({
            transport: httpTransport,
            wallet: walletClient,
        });
        setExchangeClient(exchangeClient);
        setWalletClient(walletClient);
    }, [authToken, walletClient, setExchangeClient, setWalletClient]);
    useEffect(() => {
        if (typeof toast === 'function') {
            setToast({ toast });
        }
    }, [toast, setToast]);
    useEffect(() => {
        if (typeof navigate === 'function') {
            setNavigate({ navigate });
        }
    }, [navigate, setNavigate]);
    useEffect(() => {
        store.set(subscriptionClientAtom, new SubscriptionClient({ transport: wsTransport }));
    }, []);

    return (
        <TamaguiProvider config={config} defaultTheme={theme} {...rest}>
            <QueryClientProvider client={queryClient}>{!authToken ? <LoginFallback /> : children}</QueryClientProvider>
        </TamaguiProvider>
    );
}
