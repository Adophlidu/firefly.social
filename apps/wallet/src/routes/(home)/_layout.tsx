import type { ReactNode } from 'react';

import { FireflyWalletHomePage } from '@/components/FireflyWallet/FireflyWalletHomePage.js';

export default function HomeLayout({ children }: { children?: ReactNode }) {
    return (
        // min-height prevents scroll position from jumping when switching tabs
        <div className="flex min-h-[calc(100vh+324px)] w-full flex-1 flex-col items-center">
            <FireflyWalletHomePage>{children}</FireflyWalletHomePage>
        </div>
    );
}
