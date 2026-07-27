import type { ReactNode } from 'react';

import { SettingsHeader } from '@/app/[locale]/(settings)/components/SettingsHeader.js';
import { SettingsList } from '@/app/[locale]/(settings)/components/SettingsList.js';

export default function SettingsLayout({ children }: { children?: ReactNode }) {
    return (
        <main className="flex h-screen w-full flex-1 flex-col pl-0 md:pl-[235px] lg:flex-row lg:pl-[289px]">
            <SettingsHeader />
            {/* desktop */}
            <div className="no-scrollbar hidden shrink-0 overflow-y-auto lg:flex">
                <SettingsList />
            </div>
            <div className="md:no-scrollbar w-full min-w-0 md:overflow-y-auto">{children}</div>
        </main>
    );
}
