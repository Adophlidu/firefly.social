import type { ReactNode } from 'react';

/**
 * SSR-only stubs for the client-only module group dynamically imported by
 * ClientProviders (Privy/wagmi/appkit). Those modules never load during SSR
 * (the effect that imports them is client-only), but bundlers still include
 * them in the worker artifact — several MB that blow the free-plan 3 MiB
 * limit. The ssr environment aliases the dynamic imports here instead.
 */

export function Providers({ children }: { children?: ReactNode }) {
    return children;
}

export function PrivyWalletAutomator() {
    return null;
}

export function FireflyWalletIframeBridge() {
    return null;
}
