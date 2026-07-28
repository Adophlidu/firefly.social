import type { ReactNode } from 'react';

import { SideBar } from '@/components/SideBar/index.js';
import { SettingsHeader } from '@/legacy/[locale]/(settings)/components/SettingsHeader.js';
import { SettingsList } from '@/legacy/[locale]/(settings)/components/SettingsList.js';

/**
 * Settings group frame: left nav sidebar + settings shell (header, section
 * list, content column). The old (settings)/settings/layout.tsx plus the
 * site chrome layout-body used to add around it.
 */
export default function SettingsGroupLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="m-auto flex w-full md:min-h-screen lg:w-[1265px]">
            <main className="flex h-screen w-full flex-1 flex-col pl-0 md:pl-[235px] lg:flex-row lg:pl-[289px]">
                <SettingsHeader />
                {/* desktop */}
                <div className="no-scrollbar hidden shrink-0 overflow-y-auto lg:flex">
                    <SettingsList />
                </div>
                <div className="md:no-scrollbar w-full min-w-0 md:overflow-y-auto">{children}</div>
            </main>
            <SideBar />
        </div>
    );
}
