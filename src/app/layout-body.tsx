import { type ReactNode, Suspense } from 'react';

import { IfPathname } from '@/components/IfPathname.js';
import { Providers } from '@/components/Providers.js';
import { RouteProgressBar } from '@/components/RouteProgressBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { Agent, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { EVENT_ROUTES, INTERNAL_ROUTES, WHITEBOARD_ROUTES } from '@/constants/static.js';
import { dynamic } from '@/esm/dynamic.js';

const Modals = dynamic(() => import('@/modals/index.js').then((m) => m.Modals), { ssr: false });

const BeforeUnload = dynamic(() => import('@/components/Compose/BeforeUnload.js').then((m) => m.BeforeUnload), {
    ssr: false,
});

const IframeBridge = dynamic(() => import('@/components/IframeBridge.js').then((m) => m.IframeBridge), { ssr: false });

const FireflyWallet = dynamic(() => import('@/components/FireflyWallet.js').then((m) => m.FireflyWallet), {
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

const PerformanceDashboard = dynamic(
    () => import('@/components/PerformanceDashboard.js').then((m) => ({ default: m.PerformanceDashboard })),
    { ssr: false },
);

interface LayoutBodyProps {
    agent: Agent | null;
    children: ReactNode;
}

export function LayoutBody({ agent, children }: LayoutBodyProps) {
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
                            {agent !== Agent.FireflyApp ? (
                                <IfPathname isNotOneOf={[...EVENT_ROUTES, ...WHITEBOARD_ROUTES]}>
                                    <SideBar />
                                </IfPathname>
                            ) : null}
                        </div>
                    </IfPathname>

                    <Modals />

                    {env.external.NEXT_PUBLIC_IFRAME_BRIDGE === STATUS.Enabled && agent !== Agent.FireflyApp ? (
                        <IfPathname isNotOneOf={WHITEBOARD_ROUTES}>
                            <IframeBridge />
                        </IfPathname>
                    ) : null}

                    {env.external.NEXT_PUBLIC_FORCE_SIGNUP === STATUS.Enabled && agent !== Agent.FireflyApp ? (
                        <IfPathname isNotOneOf={INTERNAL_ROUTES}>
                            <FireflyAccountChecker />
                        </IfPathname>
                    ) : null}

                    {env.external.NEXT_PUBLIC_API_PERFORMANCE_PROFILING === STATUS.Enabled ? (
                        <PerformanceDashboard />
                    ) : null}
                </RouteProgressBar>

                {/* delay render */}
                {agent !== Agent.FireflyApp ? (
                    <IfPathname isNotOneOf={WHITEBOARD_ROUTES}>
                        <Suspense>
                            <NotificationListener />
                        </Suspense>
                        <Suspense>
                            <FireflyWallet />
                        </Suspense>
                    </IfPathname>
                ) : null}
            </Providers>
            <BeforeUnload />
        </>
    );
}
