'use client';

import { UserPlusIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { LoginStatusBar } from '@/components/Login/LoginStatusBar.js';
import { WalletConnectButton } from '@/components/WalletConnectButton.js';
import { classNames } from '@/helpers/classNames.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLogin, useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useMounted } from '@/hooks/useMounted.js';
import { LoginModalRef } from '@/modals/controls.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

interface FooterProps {
    collapsed?: boolean;
}

export function Footer({ collapsed = false }: FooterProps) {
    const mounted = useMounted();
    const isLogin = useIsLogin();
    const isLoginFirefly = useIsLoginFirefly();
    const isLoading = useAsyncStatusAll();

    if (!mounted) return;

    return (
        <footer className={classNames('absolute -left-2 -right-2 bottom-20')}>
            {isLogin ? (
                <>
                    <WalletConnectButton className="mb-6 ml-6" />
                    <div
                        className={classNames('flex text-center', {
                            'justify-start': isLogin,
                            'justify-center': !isLogin && isLoginFirefly,
                        })}
                    >
                        <LoginStatusBar collapsed={collapsed} />
                    </div>
                </>
            ) : (
                <div className="mb-4 flex justify-center">
                    {collapsed ? (
                        <ClickableButton
                            onClick={() => {
                                LoginModalRef.open();
                            }}
                            className="rounded-full bg-main p-1 text-primaryBottom"
                        >
                            <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
                        </ClickableButton>
                    ) : (
                        <ClickableButton
                            disabled={isLoading}
                            onClick={async () => {
                                useNavigatorState.getState().updateSidebarOpen(false);
                                await delay(300);
                                LoginModalRef.open();
                            }}
                            className={classNames(
                                'flex w-[200px] items-center justify-center rounded-2xl bg-main p-2 text-xl font-bold leading-6 text-primaryBottom',
                                {
                                    '!w-[175px]': !isLogin && isLoginFirefly,
                                },
                            )}
                        >
                            {isLoading ? <LoadingIcon className="mr-2" /> : <Trans>Login</Trans>}
                        </ClickableButton>
                    )}
                </div>
            )}
        </footer>
    );
}
