import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';

import { FireflyWalletHomePage } from '@/components/FireflyWallet/FireflyWalletHomePage.js';
import { ModalType } from '@/configs/modalRoutes.js';

const homeSearchSchema = z
    .object({
        modal: z.nativeEnum(ModalType).optional(),
    })
    .passthrough();

export const Route = createFileRoute('/_home')({
    component: RootLayout,
    validateSearch: homeSearchSchema,
});

function RootLayout() {
    return (
        // min-height prevents scroll position from jumping when switching tabs
        <div className="flex min-h-[calc(100vh+324px)] w-full flex-1 flex-col items-center">
            <FireflyWalletHomePage>
                <Outlet />
            </FireflyWalletHomePage>
        </div>
    );
}
