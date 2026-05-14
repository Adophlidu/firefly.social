import { ExchangeClient, SubscriptionClient, WebSocketTransport } from '@nktkas/hyperliquid';
import { useAtomValue, useSetAtom } from 'jotai';
import { type ReactNode, useEffect } from 'react';

import { AcceptTermsSheet } from '@/components/Sheets/AcceptTermsSheet';
import { httpTransport } from '@/providers/client';
import { navigateAtom, perpsKlineChartUrlBuilderAtom, toastAtom } from '@/store/global';
import { apiModeAtom, sessionTokenAtom } from '@/store/session';
import { exchangeClientAtom, subscriptionClientAtom, walletClientAtom } from '@/store/wallet';
import type { NavigateFunc, PerpsKlineChartUrlBuilder, ToastFn, WalletClient } from '@/types/ui';

const wsTransport = new WebSocketTransport();

export interface PerpsBindingsProviderProps {
    token: string | null;
    apiMode?: 'prod' | 'dev';
    children?: ReactNode;
    walletClient?: WalletClient;
    toast: ToastFn;
    navigate: NavigateFunc;
    /**
     * Builds the URL `PerpsKline` should load in its iframe/WebView. The host owns
     * the chart route path so rn-ui stays decoupled from any app's base path. If
     * omitted, `PerpsKline` renders nothing.
     */
    buildPerpsKlineChartUrl?: PerpsKlineChartUrlBuilder;
}

export function PerpsBindingsProvider({ children, ...syncProps }: PerpsBindingsProviderProps) {
    return (
        <>
            <PerpsBindingsSync {...syncProps} />
            <AcceptTermsSheet />
            {children}
        </>
    );
}

/** Must stay a child of `JotaiProvider` so hooks use rn-ui’s store, not the host default. */
function PerpsBindingsSync({
    token,
    apiMode,
    walletClient,
    toast,
    navigate,
    buildPerpsKlineChartUrl,
}: Omit<PerpsBindingsProviderProps, 'children'>) {
    const authToken = useAtomValue(sessionTokenAtom);
    const setToken = useSetAtom(sessionTokenAtom);
    const setApiMode = useSetAtom(apiModeAtom);
    const setExchangeClient = useSetAtom(exchangeClientAtom);
    const setWalletClient = useSetAtom(walletClientAtom);
    const setToast = useSetAtom(toastAtom);
    const setNavigate = useSetAtom(navigateAtom);
    const setSubscriptionClient = useSetAtom(subscriptionClientAtom);
    const setPerpsKlineChartUrlBuilder = useSetAtom(perpsKlineChartUrlBuilderAtom);

    useEffect(() => {
        setToken(token ?? null);
        setApiMode(apiMode ?? 'prod');
    }, [token, apiMode, setApiMode, setToken]);

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
        setSubscriptionClient(new SubscriptionClient({ transport: wsTransport }));
    }, [setSubscriptionClient]);

    useEffect(() => {
        if (typeof buildPerpsKlineChartUrl === 'function') {
            setPerpsKlineChartUrlBuilder({ build: buildPerpsKlineChartUrl });
        }
    }, [buildPerpsKlineChartUrl, setPerpsKlineChartUrlBuilder]);

    return null;
}
