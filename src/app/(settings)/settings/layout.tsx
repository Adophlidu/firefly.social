import { type ReactNode } from 'react';

import { SettingsHeader } from '@/app/(settings)/components/SettingsHeader.js';
import { SettingsList } from '@/app/(settings)/components/SettingsList.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function Layout({ children }: { children: ReactNode }) {
    await setupLocaleForSSR();

    return (
        <>
            <main className="flex h-screen w-full flex-1 flex-col pl-0 md:pl-[235px] lg:flex-row lg:pl-[289px]">
                <SettingsHeader />
                {/* desktop */}
                <div className="no-scrollbar hidden shrink-0 overflow-y-auto lg:flex">
                    <SettingsList />
                </div>
                <div className="md:no-scrollbar w-full min-w-0 md:overflow-y-auto">{children}</div>
            </main>
        </>
    );
}
