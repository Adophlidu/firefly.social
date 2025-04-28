import { DomainMigrationNotification } from '@/components/DomainMigrationNotification/index.js';
import { IfHostname } from '@/components/IfHostname.js';
import { IfPathname } from '@/components/IfPathname.js';
import { Providers } from '@/components/Providers.js';
import { RouteProgressBar } from '@/components/RouteProgressBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { CZ_ACTIVITY_HOSTNAME } from '@/constants/index.js';
import { dynamic } from '@/esm/dynamic.js';
import { Script } from '@/esm/Script.js';

const Modals = dynamic(() => import('@/modals/index.js').then((m) => m.Modals), { ssr: false });
const BeforeUnload = dynamic(() => import('@/components/Compose/BeforeUnload.js').then((m) => m.BeforeUnload), {
    ssr: false,
});

const REMOVE_LOADING_SCRIPT = `
    ;(function () {
        function delay(ms) {
            return new Promise(function (resolve) {
                setTimeout(resolve, ms);
            });
        }

        Promise.all([
            Promise.race([document.fonts.ready, delay(3000)]), // max for 3000ms
            delay(300), // min for 300ms
        ]).finally(() => {
            document.documentElement.classList.remove('font-loading');
        });
    })();
`;

export function LayoutBody({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Providers>
                <RouteProgressBar
                    height="2px"
                    color="var(--color-firefly-brand)"
                    options={{ showSpinner: false }}
                    shallowRouting
                    disableDifferentOrigin
                >
                    <div className="m-auto flex w-full md:min-h-screen group-[.not-support]:md:min-h-[calc(100vh_-_38px)] lg:w-[1265px]">
                        {children}
                        <IfHostname isNotOneOf={[CZ_ACTIVITY_HOSTNAME]}>
                            <IfPathname
                                isNotOneOf={[
                                    '/login/desktop',
                                    '/activity/cz',
                                    '/event',
                                    '/events',
                                    '/frame',
                                    '/redirect',
                                ]}
                            >
                                <SideBar />
                            </IfPathname>
                        </IfHostname>
                    </div>

                    <Modals />
                    <DomainMigrationNotification />
                    <Script>{REMOVE_LOADING_SCRIPT}</Script>
                </RouteProgressBar>
            </Providers>
            <BeforeUnload />
        </>
    );
}
