import { initGlobalErrorHandlers } from '@dimensiondev/exception-tracker';
import { type ComponentType, type ReactNode, useEffect, useState } from 'react';

import { DefaultPendingComponent } from '@/components/DefaultPendingComponent.js';
import { initExceptionTracker } from '@/configs/exceptionTracker.js';
import { isRunningInIframe } from '@/helpers/isRunningInIframe.js';

interface PrivyClientModules {
    Providers: ComponentType<{ children: ReactNode }>;
    PrivyWalletAutomator: ComponentType;
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
        // Only import Privy-dependent modules on the client side. PrivyWalletAutomator
        // pulls in wagmi + @reown/appkit-controllers, so it must stay in this group —
        // a static import here would drag WalletConnect/wagmi into the eager root chunk.
        Promise.all([
            import('@/components/Providers.js'),
            import('@/components/PrivyWalletAutomator.js'),
            import('@/components/FireflyWalletIframeBridge.js'),
        ]).then(([providersModule, privyWalletAutomatorModule, iframeBridgeModule]) => {
            setModules({
                Providers: providersModule.Providers,
                PrivyWalletAutomator: privyWalletAutomatorModule.PrivyWalletAutomator,
                FireflyWalletIframeBridge: iframeBridgeModule.FireflyWalletIframeBridge,
            });
        });
    }, []);

    // During SSR or while loading, show spinner
    if (!modules) {
        return <DefaultPendingComponent />;
    }

    const { Providers, PrivyWalletAutomator, FireflyWalletIframeBridge } = modules;

    return (
        <Providers>
            <PrivyWalletAutomator />
            {isRunningInIframe() ? <FireflyWalletIframeBridge /> : null}
            {children}
        </Providers>
    );
}
