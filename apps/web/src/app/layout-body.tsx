'use client';

import { EVENT_ROUTES, INTERNAL_ROUTES, WHITEBOARD_ROUTES } from '@dimensiondev/constants/static';
import { Agent, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { type ReactNode, Suspense } from 'react';

import { useAgent } from '@/components/AgentProvider.js';
import { IfPathname } from '@/components/IfPathname.js';
import { IfWalletStackActive } from '@/components/IfWalletStackActive.js';
import { Providers } from '@/components/Providers.js';
import { RouteProgressBar } from '@/components/RouteProgressBar.js';
import { SessionUnauthorizedBoundaryTrigger } from '@/components/SessionUnauthorizedBoundaryTrigger.js';
import { SideBar } from '@/components/SideBar/index.js';
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
            {/* Kept above <Providers> and {children} so an unauthorized throw bubbles
                straight to app/global-error.tsx, past every segment-level error.tsx. */}
            <SessionUnauthorizedBoundaryTrigger />
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
                        {/* FireflyWallet requires a Firefly login (which activates the
                            wallet stack at boot) and pulls AppKit controllers, so keep
                            it unmounted until the wallet stack is active. */}
                        <IfWalletStackActive>
                            <Suspense>
                                <FireflyWallet />
                            </Suspense>
                        </IfWalletStackActive>
                    </IfPathname>
                ) : null}
            </Providers>
            <BeforeUnload />
        </>
    );
}
