'use client';

import { nativeBridgeProvider } from '@dimensiondev/native-bridge';
import { type PropsWithChildren } from 'react';

import { ActivityDesktopNavigationBar } from '@/components/Activity/ActivityDesktopNavigationBar.js';
import { ActivityMobileNavigationBar } from '@/components/Activity/ActivityMobileNavigationBar.js';
import { useFireflyBridgeLanguage } from '@/hooks/useFireflyBridgeLanguage.js';

export function ActivityNavigationBar({ children }: PropsWithChildren) {
    useFireflyBridgeLanguage();
    if (nativeBridgeProvider.supported) {
        return <ActivityMobileNavigationBar>{children}</ActivityMobileNavigationBar>;
    }
    return <ActivityDesktopNavigationBar>{children}</ActivityDesktopNavigationBar>;
}
