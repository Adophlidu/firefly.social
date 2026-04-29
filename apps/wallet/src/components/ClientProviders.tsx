import { initGlobalErrorHandlers } from '@dimensiondev/exception-tracker';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';

import { DefaultPendingComponent } from '@/components/DefaultPendingComponent.js';
import { PrivyWalletAutomator } from '@/components/PrivyWalletAutomator.js';
import { initExceptionTracker } from '@/configs/exceptionTracker.js';
import { isRunningInIframe } from '@/helpers/isRunningInIframe.js';

interface PrivyClientModules {
    Providers: ComponentType<{ children: ReactNode }>;
    FireflyWalletIframeBridge: ComponentType;
}

interface ClientProvidersProps {
    children: ReactNode;
}

initExceptionTracker();
initGlobalErrorHandlers();

export function ClientProviders({ children }: ClientProvidersProps) {
    const [modules, setModules] = useState<PrivyClientModules | null>(null);

    useEffect(() => {
        // Only import Privy-dependent modules on the client side
        Promise.all([import('./Providers.js'), import('./FireflyWalletIframeBridge.js')]).then(
            ([providersModule, iframeBridgeModule]) => {
                setModules({
                    Providers: providersModule.Providers,
                    FireflyWalletIframeBridge: iframeBridgeModule.FireflyWalletIframeBridge,
                });
            },
        );
    }, []);

    // During SSR or while loading, show spinner
    if (!modules) {
        return <DefaultPendingComponent />;
    }

    const { Providers, FireflyWalletIframeBridge } = modules;

    return (
        <Providers>
            <PrivyWalletAutomator />
            {isRunningInIframe() ? <FireflyWalletIframeBridge /> : null}
            {children}
        </Providers>
    );
}
