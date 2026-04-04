import { Trans } from '@lingui/react/macro';
import { Outlet, rootRouteId, useMatch, useRouter, useRouterState } from '@tanstack/react-router';

import { BackButton, CloseButton } from '@/components/IconButton.js';
import { type LoginModalOpenProps, LoginModalRef } from '@/modals/LoginModal/refs.js';

export function RootView() {
    const router = useRouter();
    const { matches, location } = useRouterState();
    const { context } = useMatch({ from: rootRouteId }) as {
        context: { props?: LoginModalOpenProps };
    };

    const isMain = location.pathname === '/main';
    const noBackButton = context?.props?.options?.noBackButton;

    const contextTitle = [...matches].reverse().find((x) => x.context.title)?.context.title;
    const title = contextTitle ?? <Trans>Login to Firefly</Trans>;

    return (
        <div className="bg-lightBottom dark:bg-darkBottom flex transform-gpu flex-col rounded-xl transition-all max-md:h-full max-md:rounded-none">
            <div className="flex items-center justify-center gap-2 rounded-t-lg p-4">
                {isMain || noBackButton ? (
                    <CloseButton
                        onClick={() => {
                            LoginModalRef.close();
                        }}
                    />
                ) : (
                    <BackButton
                        onClick={() => {
                            // history.back() is buggy, use .replace() instead.
                            router.history.replace('/main');
                        }}
                    />
                )}

                <div className="text-main h-6 shrink grow basis-0 text-center text-lg font-bold leading-snug">
                    {title}
                </div>
                <div className="relative size-6" />
            </div>
            <Outlet />
        </div>
    );
}
