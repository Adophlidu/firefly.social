import { type ReactNode, Suspense } from 'react';

import { DynamicPrivyBridge } from '@/components/DynamicPrivyBridge.js';
import { IfPathname } from '@/components/IfPathname.js';
import { Providers } from '@/components/Providers.js';
import { RouteProgressBar } from '@/components/RouteProgressBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { dynamic } from '@/esm/dynamic.js';

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
const NotificationListener = dynamic(
    () => import('@/components/NotificationListener.js').then((m) => m.NotificationListener),
    { ssr: false },
);

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
                        <div className="m-auto flex w-full md:min-h-screen lg:w-[1265px]">
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
                </RouteProgressBar>
                {env.external.NEXT_PUBLIC_PRIVY === STATUS.Enabled ? <DynamicPrivyBridge /> : null}
                {/* delay render */}
                <Suspense>
                    <NotificationListener />
                </Suspense>
            </Providers>
            <BeforeUnload />
        </>
    );
}
