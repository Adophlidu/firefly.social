import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import {
    type NavigateFunc,
    PerpsAuthGate,
    PerpsBindingsProvider,
    type PerpsKlineChartUrlBuilder,
    Provider,
    type ToastFn,
} from '@dimensiondev/rn-ui';
import { safeUnreachable } from '@dimensiondev/utils';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { type PropsWithChildren, useCallback } from 'react';
import { toast } from 'sonner';
import { useConnectors, useWalletClient } from 'wagmi';

import { useComeback } from '@/components/useComeback.js';
import { env } from '@/constants/env.js';
import { ABOUT_URL, PRIVACY_URL, TERMS_URL } from '@/constants/hyperliquid.js';
import { KLINE_BASE_URL, PRIVY_CONNECTOR_ID } from '@/constants/static.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { logger } from '@/lib/Logger.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';

export function PerpsProvider({ children }: PropsWithChildren) {
    const token = useAtomValue(fireflySessionTokenAtom);
    const comeback = useComeback();
    const connectors = useConnectors();
    const navigate = useNavigate();
    const isDarkMode = useIsDarkMode();
    const { data } = useWalletClient({
        connector: connectors.find((c) => c.id === PRIVY_CONNECTOR_ID),
    });

    const toastFn: ToastFn = useCallback(({ message, type, error }) => {
        switch (type) {
            case 'success':
                return toast.success(message);
            case 'error':
                if (error) {
                    logger.error('[Perps Error]: ', error);
                }
                return toast.error(message);
            case 'info':
                return toast.info(message);
            default:
                safeUnreachable(type);
                return toast(message);
        }
    }, []);
    const navigateFn: NavigateFunc = useCallback(
        (to, options) => {
            logger.info(`[Navigate]: to ${to} with options: `, options);

            switch (to) {
                case 'details': {
                    const token = 'coin' in options ? options?.coin : undefined;
                    return navigate({ to: `/perps/token?token=${token || ''}` });
                }
                case 'trade': {
                    const token = 'coin' in options ? options?.coin : undefined;
                    return navigate({ to: `/perps/?token=${token || ''}` });
                }
                case 'addFunds':
                    return navigate({ to: '/perps/deposit' });
                case 'withdraw':
                    return;
                case 'history':
                    return navigate({ to: '/perps/history' });
                case 'perps-website':
                    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                        path: ABOUT_URL,
                        external: true,
                    });
                    return;
                case '__parent__':
                    comeback();
                    return;
                case 'perps-privacy':
                    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                        path: PRIVACY_URL,
                        external: true,
                    });
                    return;
                case 'perps-terms':
                    iframeBridgeProvider.request(IframeBridgeMethod.NAVIGATE, {
                        path: TERMS_URL,
                        external: true,
                    });
                    return;
                default:
                    safeUnreachable(to);
                    return;
            }
        },
        [navigate, comeback],
    );

    const isDevApi = env.external.NEXT_PUBLIC_FIREFLY_ROOT_URL.startsWith('https://api-dev.firefly.land');

    const buildPerpsKlineChartUrl: PerpsKlineChartUrlBuilder = useCallback((coin, walletAddress) => {
        const params = new URLSearchParams({ coin, interval: '1m' });
        if (walletAddress) params.set('address', walletAddress);

        return `${KLINE_BASE_URL}/perp-kline-chart?${params.toString()}`;
    }, []);

    return (
        <Provider theme={isDarkMode ? 'dark' : 'light'}>
            <PerpsBindingsProvider
                token={token}
                apiMode={isDevApi ? 'dev' : 'prod'}
                walletClient={data}
                toast={toastFn}
                navigate={navigateFn}
                buildPerpsKlineChartUrl={buildPerpsKlineChartUrl}
            >
                <PerpsAuthGate>
                    <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
                </PerpsAuthGate>
            </PerpsBindingsProvider>
        </Provider>
    );
}
