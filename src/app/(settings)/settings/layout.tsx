import { SettingsList } from '@/app/(settings)/components/SettingsList.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function Layout({ children }: { children: React.ReactNode }) {
    await setupLocaleForSSR();

    return (
        <>
            <main className="flex h-screen w-full flex-1 flex-col pl-0 md:pl-[235px] lg:flex-row lg:pl-[289px]">
                {/* desktop */}
                <div className="no-scrollbar hidden overflow-y-auto lg:flex">
                    <SettingsList />
                </div>
                <div className="no-scrollbar w-full min-w-0 overflow-y-auto">{children}</div>
            </main>
        </>
    );
}
