import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { IS_DEV_API } from '@dimensiondev/envs/wallet';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import {
    type NavigateFunc,
    PerpsAuthGate,
    PerpsBindingsProvider,
    type PerpsKlineChartUrlBuilder,
    Provider,
    type RnUiLocale,
    type ToastFn,
} from '@dimensiondev/rn-ui';
import { safeUnreachable } from '@dimensiondev/utils';
import { useLingui } from '@lingui/react';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { type PropsWithChildren, useCallback } from 'react';
import { toast } from 'sonner';
import { useConnectors, useWalletClient } from 'wagmi';

import { useComeback } from '@/components/useComeback.js';
import { ABOUT_URL, PRIVACY_URL, TERMS_URL } from '@/constants/hyperliquid.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { logger } from '@/lib/Logger.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';

const RN_UI_SUPPORTED_LOCALES: ReadonlySet<RnUiLocale> = new Set(['en', 'ko', 'ja', 'zh-Hans', 'zh-Hant']);

function toRnUiLocale(walletLocale: string): RnUiLocale {
    return RN_UI_SUPPORTED_LOCALES.has(walletLocale as RnUiLocale) ? (walletLocale as RnUiLocale) : 'en';
}

export function PerpsProvider({ children }: PropsWithChildren) {
    const authToken = useAtomValue(fireflySessionTokenAtom);
    const comeback = useComeback();
    const connectors = useConnectors();
    const navigate = useNavigate();
    const isDarkMode = useIsDarkMode();
    const { i18n } = useLingui();
    const locale = toRnUiLocale(i18n.locale);
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

    const buildPerpsKlineChartUrl: PerpsKlineChartUrlBuilder = useCallback((coin, walletAddress) => {
        const params = new URLSearchParams({ coin, interval: '1m' });
        if (walletAddress) params.set('address', walletAddress);

        return `/perp-kline-chart?${params.toString()}`;
    }, []);

    return (
        <Provider locale={locale} theme={isDarkMode ? 'dark' : 'light'}>
            <PerpsBindingsProvider
                token={authToken}
                apiMode={IS_DEV_API ? 'dev' : 'prod'}
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
