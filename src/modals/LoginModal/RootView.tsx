import { Trans } from '@lingui/react/macro';
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { useRouter as useNextRouter } from 'next/navigation.js';

import SettingsIcon from '@/assets/setting.svg';
import { BackButton } from '@/components/BackButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { LoginModalRef } from '@/modals/controls.js';

export function RootView() {
    const isMedium = useIsMedium();
    const router = useRouter();
    const pageRouter = useNextRouter();
    const isLoginFirefly = useIsLoginFirefly();
    const { matches, location } = useRouterState();

    const isMain = location.pathname === '/main';

    const contextTitle = [...matches].reverse().find((x) => x.context.title)?.context.title;
    const title = contextTitle ?? <Trans>Login to Firefly</Trans>;

    return (
        <div className="transform rounded-[12px] bg-primaryBottom transition-all max-md:h-full">
            <div className="flex items-center justify-center gap-2 rounded-t-[12px] p-4">
                {isMain ? (
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

                <div className="shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">{title}</div>
                <div className="relative size-6">
                    {isMain && isLoginFirefly ? (
                        <SettingsIcon
                            className="size-6 cursor-pointer"
                            onClick={() => {
                                LoginModalRef.close();
                                pageRouter.push('/settings/connected');
                            }}
                        />
                    ) : null}
                </div>
            </div>
            <Outlet />
        </div>
    );
}
