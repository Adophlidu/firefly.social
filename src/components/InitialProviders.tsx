'use client';

import { classNames } from '@dimensiondev/utils';
import { isServer } from '@tanstack/react-query';
import { memo, type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';
import { useEffectOnce } from 'react-use';

import { SnackbarProvider } from '@/components/Snackbar.js';
import { sentryClient } from '@/configs/sentryClient.js';
import { usePathname } from '@/esm/navigation.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { logger } from '@/libs/Logger.js';
import { recordUserThemeMode } from '@/services/recordUserThemeMode.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useLeafwatchPersistStore } from '@/store/useLeafwatchPersistStore.js';
import { useThemeModeStore } from '@/store/useThemeModeStore.js';

export const InitialProviders = memo(function Providers(props: { children: ReactNode }) {
    const isDarkMode = useIsDarkMode();
    const themeMode = useThemeModeStore.use.themeMode();
    useLayoutEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);

        if (themeMode === 'light') {
            document.documentElement.classList.toggle('light', true);
        }
        const meta = document.querySelector('meta[name="theme-color"]');
        meta?.setAttribute('content', isDarkMode ? '#030303' : '#ffffff');

        if (!isServer) recordUserThemeMode(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode, themeMode]);

    useLayoutEffect(() => {
        sentryClient.init();
    });

    const viewerId = useLeafwatchPersistStore.use.viewerId();
    const setViewerId = useLeafwatchPersistStore.use.setViewerId();
    useEffectOnce(() => {
        if (!viewerId) setViewerId(crypto.randomUUID());

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .catch((error) => logger.error('Failed to register service worker', error));
        }
    });

    const isLogin = useIsLoginFirefly();
    useEffect(() => {
        if (isLogin) setupFirebaseFcmConnection();
    }, [isLogin]);

    const entryPathname = useRef('');
    const pathname = usePathname();
    useEffect(() => {
        if (!entryPathname.current || pathname === entryPathname.current) {
            entryPathname.current = pathname;
            return;
        }

        useGlobalState.setState((state) => {
            return {
                ...state,
                routeChanged: true,
            };
        });
    }, [pathname]);

    const isMedium = useIsMedium();

    return (
        <SnackbarProvider
            maxSnack={10}
            anchorOrigin={{ vertical: 'top', horizontal: isMedium ? 'right' : 'center' }}
            autoHideDuration={3000}
            classes={{
                containerAnchorOriginTopCenter: isMedium ? undefined : 'px-2',
                variantInfo: classNames('!bg-warn'),
            }}
        >
            {props.children}
        </SnackbarProvider>
    );
});
