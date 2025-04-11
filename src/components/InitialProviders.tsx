'use client';

import { useActionsRegistryInterval } from '@dialectlabs/blinks';
import { isServer } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { v4 as uuid } from 'uuid';

import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { useLocale } from '@/helpers/getCookie.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { setLocale } from '@/i18n/index.js';
import { recordUserThemeMode } from '@/services/recordUserThemeMode.js';
import { setupFirebaseFcmConnection } from '@/services/setupFirebaseFcmConnection.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { useLeafwatchPersistStore } from '@/store/useLeafwatchPersistStore.js';
import { useThemeModeStore } from '@/store/useThemeModeStore.js';

export const InitialProviders = memo(function Providers(props: { children: React.ReactNode }) {
    const isDarkMode = useIsDarkMode();
    const isMedium = useIsMedium();
    const isLogin = useIsLoginFirefly();
    useActionsRegistryInterval();

    const entryPathname = useRef('');
    const pathname = usePathname();
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

    const viewerId = useLeafwatchPersistStore.use.viewerId();
    const setViewerId = useLeafwatchPersistStore.use.setViewerId();

    const locale = useLocale();

    useEffect(() => {
        console.info('[i18n] set locale =', locale);
        setLocale(locale);
    }, [locale]);

    useEffectOnce(() => {
        if (!viewerId) setViewerId(uuid());

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(console.error);
        }
    });

    useEffect(() => {
        if (isLogin) {
            setupFirebaseFcmConnection();
        }
    }, [isLogin]);

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

    return (
        <SnackbarProvider
            maxSnack={30}
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
