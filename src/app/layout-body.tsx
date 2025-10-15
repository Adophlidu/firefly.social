import { type ReactNode, Suspense } from 'react';

import { DynamicPrivyBridge } from '@/components/DynamicPrivyBridge.js';
import { IfPathname } from '@/components/IfPathname.js';
import { Providers } from '@/components/Providers.js';
import { RouteProgressBar } from '@/components/RouteProgressBar.js';
import { SideBar } from '@/components/SideBar/index.js';
import { Agent, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { dynamic } from '@/esm/dynamic.js';

const Modals = dynamic(() => import('@/modals/index.js').then((m) => m.Modals), { ssr: false });

const BeforeUnload = dynamic(() => import('@/components/Compose/BeforeUnload.js').then((m) => m.BeforeUnload), {
    ssr: false,
});

const IframeBridge = dynamic(() => import('@/components/IframeBridge.js').then((m) => m.IframeBridge), { ssr: false });

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

const EVENT_PATHS: Array<`/${string}`> = ['/event', '/events'];
const WHITEBOARD_PATHS: Array<`/${string}`> = ['/frame', '/login', '/redirect', '/telegram', '/signup'];

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
                                <IfPathname isNotOneOf={[...EVENT_PATHS, ...WHITEBOARD_PATHS]}>
                                    <SideBar />
                                </IfPathname>
                            ) : null}
                        </div>
                    </IfPathname>

                    <Modals />

                    {env.external.NEXT_PUBLIC_IFRAME_BRIDGE === STATUS.Enabled && agent !== Agent.FireflyApp ? (
                        <IfPathname isNotOneOf={WHITEBOARD_PATHS}>
                            <IframeBridge />
                        </IfPathname>
                    ) : null}

                    {env.external.NEXT_PUBLIC_FORCE_SIGNUP === STATUS.Enabled && agent !== Agent.FireflyApp ? (
                        <IfPathname isNotOneOf={WHITEBOARD_PATHS}>
                            <FireflyAccountChecker />
                        </IfPathname>
                    ) : null}
                </RouteProgressBar>

                {env.external.NEXT_PUBLIC_PRIVY === STATUS.Enabled && agent !== Agent.FireflyApp ? (
                    <IfPathname isNotOneOf={WHITEBOARD_PATHS}>
                        <DynamicPrivyBridge />
                    </IfPathname>
                ) : null}

                {/* delay render */}
                {agent !== Agent.FireflyApp ? (
                    <IfPathname isNotOneOf={WHITEBOARD_PATHS}>
                        <Suspense>
                            <NotificationListener />
                        </Suspense>
                    </IfPathname>
                ) : null}
            </Providers>
            <BeforeUnload />
        </>
    );
}
