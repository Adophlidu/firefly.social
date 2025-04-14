import { SettingsList } from '@/app/(settings)/components/SettingsList.js';
import { NavigatorBar } from '@/components/NavigatorBar/index.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export default async function Layout({ children }: { children: React.ReactNode }) {
    await setupLocaleForSSR();

    return (
        <>
            <main className="flex min-h-full w-full flex-1 flex-col pl-0 md:min-h-screen md:flex-row md:pl-[235px] lg:pl-[289px]">
                {/* mobile */}
                <div className="sticky top-0 z-10 flex bg-primaryBottom md:hidden">
                    <NavigatorBar enableSearch={false} enableFixedBack />
                </div>
                {/* desktop */}
                <div className="hidden md:flex">
                    <SettingsList />
                </div>
                <div className="w-full min-w-0">{children}</div>
            </main>
        </>
    );
}
