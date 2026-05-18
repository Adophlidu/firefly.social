'use client';

import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { type ReactNode, Suspense } from 'react';

import { useAgent } from '@/components/AgentProvider.js';
import { IfPathname } from '@/components/IfPathname.js';
import { Providers } from '@/components/Providers.js';
import { RouteProgressBar } from '@/components/RouteProgressBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { Agent } from '@/constants/enum.js';
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

interface LayoutBodyProps {
    locale?: string;
    children: ReactNode;
}

export function LayoutBody({ locale, children }: LayoutBodyProps) {
    const agent = useAgent();
    return (
        <>
            <Providers locale={locale}>
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

                    {envs.external.NEXT_PUBLIC_IFRAME_BRIDGE === STATUS.Enabled && agent !== Agent.FireflyApp ? (
                        <IfPathname isNotOneOf={WHITEBOARD_ROUTES}>
                            <IframeBridge />
                        </IfPathname>
                    ) : null}

                    {envs.external.NEXT_PUBLIC_FORCE_SIGNUP === STATUS.Enabled && agent !== Agent.FireflyApp ? (
                        <IfPathname isNotOneOf={INTERNAL_ROUTES}>
                            <FireflyAccountChecker />
                        </IfPathname>
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
