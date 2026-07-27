import { EVENT_ROUTES, INTERNAL_ROUTES, WHITEBOARD_ROUTES } from '@dimensiondev/constants/static';
import { Agent, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { type ReactNode, Suspense } from 'react';

import { useAgent } from '@/components/AgentProvider.js';
import { DirectMessagePanelHost } from '@/components/DirectMessages/DirectMessagePanelHost.js';
import { IfPathname } from '@/components/IfPathname.js';
import { IfWalletStackActive } from '@/components/IfWalletStackActive.js';
import { SessionUnauthorizedBoundaryTrigger } from '@/components/SessionUnauthorizedBoundaryTrigger.js';
import { AppProviders } from '@/compat/AppProviders.js';
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

/**
 * Global services mounted above every route (modals, bridges, listeners) plus
 * the provider tree. Layout frames are the route groups' business
 * (routes/(normal|event|settings|whiteboard|messages)/_layout.tsx) — nothing
 * here picks layouts by pathname.
 *
 * The IfPathname gates below are not layout selection: they toggle global
 * services off on pages that must stay isolated (whiteboard flows, iframe
 * embeds), matching the old layout-body's behavior.
 */
function GlobalServices() {
    const agent = useAgent();
    return (
        <>
            <Modals />
            <DirectMessagePanelHost />

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

            {/* delay render */}
            {agent !== Agent.FireflyApp ? (
                <IfPathname isNotOneOf={[...EVENT_ROUTES, ...WHITEBOARD_ROUTES]}>
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
        </>
    );
}

export function AppLayoutBody({ locale, children }: { locale?: string; children?: ReactNode }) {
    return (
        <>
            {/* Kept above <AppProviders> and {children} so an unauthorized throw bubbles
                straight to the root error boundary, past every segment-level boundary. */}
            <SessionUnauthorizedBoundaryTrigger />
            <AppProviders locale={locale}>
                {children}
                <GlobalServices />
            </AppProviders>
            <BeforeUnload />
        </>
    );
}
