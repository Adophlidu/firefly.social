import { NavigatorBar } from '@/app/(settings)/components/NavigatorBar.js';
import { SettingsList } from '@/app/(settings)/components/SettingsList.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function Layout({ children }: { children: React.ReactNode }) {
    await setupLocaleForSSR();

    return (
        <>
            <main className="flex min-h-full w-full flex-1 flex-col pl-0 md:pl-[235px] lg:min-h-screen lg:flex-row lg:pl-[289px]">
                {/* mobile */}
                <div className="sticky top-0 z-10 flex bg-primaryBottom lg:hidden">
                    <NavigatorBar />
                </div>
                {/* desktop */}
                <div className="hidden lg:flex">
                    <SettingsList />
                </div>
                <div className="w-full min-w-0">{children}</div>
            </main>
        </>
    );
}
