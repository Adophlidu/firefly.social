import type { ReactNode } from 'react';

import { IfPathname } from '@/components/IfPathname.js';
import { Providers } from '@/components/Providers.js';
import { RouteProgressBar } from '@/components/RouteProgressBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { dynamic } from '@/esm/dynamic.js';
import { Script } from '@/esm/Script.js';

const Modals = dynamic(() => import('@/modals/index.js').then((m) => m.Modals), { ssr: false });
const BeforeUnload = dynamic(() => import('@/components/Compose/BeforeUnload.js').then((m) => m.BeforeUnload), {
    ssr: false,
});
const FireflyAccountChecker = dynamic(
    () => import('@/components/FireflyAccountChecker.js').then((m) => m.FireflyAccountChecker),
    {
        ssr: false,
    },
);

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

export function LayoutBody({ children }: { children: ReactNode }) {
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
                    <IfPathname isOneOf={['/signup']}>{children}</IfPathname>
                    <IfPathname isNotOneOf={['/signup']}>
                        <div className="m-auto flex w-full md:min-h-screen group-[.not-support]:md:min-h-[calc(100vh_-_38px)] lg:w-[1265px]">
                            {children}
                            <IfPathname
                                isNotOneOf={[
                                    '/login/desktop',
                                    '/activity/cz',
                                    '/event',
                                    '/events',
                                    '/frame',
                                    '/redirect',
                                    '/signup',
                                ]}
                            >
                                <SideBar />
                            </IfPathname>
                        </div>
                    </IfPathname>

                    <Modals />
                    {env.external.NEXT_PUBLIC_FORCE_SIGNUP === STATUS.Enabled ? <FireflyAccountChecker /> : null}
                    <Script>{REMOVE_LOADING_SCRIPT}</Script>
                </RouteProgressBar>
            </Providers>
            <BeforeUnload />
        </>
    );
}
