'use client';

import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';

import DoubleUser from '@/assets/double-user.svg';
import { AccountConnectButton } from '@/components/AccountConnectButton.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { WalletConnectButton } from '@/components/WalletConnectButton.js';
import { SignupStep } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { isPathnameForceRedirect, openLoginModal } from '@/helpers/openLoginModal.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLogin, useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useMounted } from '@/hooks/useMounted.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

export function Footer() {
    const mounted = useMounted();
    const isLogin = useIsLogin();
    const isLoginFirefly = useIsLoginFirefly();
    const isLoading = useAsyncStatusAll();
    const pathname = usePathname();

    const isForceRedirect = isPathnameForceRedirect(pathname);

    if (!mounted) return;

    return (
        <footer className={classNames('absolute inset-x-0 bottom-20 pl-2 md:pl-6')}>
            {isLoginFirefly || isLogin ? (
                <>
                    <WalletConnectButton className="mb-6" />
                    <AccountConnectButton
                        onClick={async () => {
                            useNavigatorState.getState().updateSidebarOpen(false);
                            await delay(300);
                            openLoginModal();
                        }}
                    />
                </>
            ) : (
                <div className="mb-4 flex justify-start">
                    <ClickableButton
                        disabled={isLoading}
                        className="mr-2 flex min-w-[120px] items-center justify-center rounded-lg bg-lightMain px-4 py-2 text-lg leading-6 text-primaryBottom"
                        onClick={async () => {
                            useNavigatorState.getState().updateSidebarOpen(false);
                            await delay(300);
                            if (isForceRedirect) {
                                openLoginModal();
                            } else {
                                location.href = RouteResolver.signup(SignupStep.LoginSocialPlatform);
                            }
                        }}
                    >
                        {isLoading ? (
                            <LoadingIcon />
                        ) : (
                            <>
                                <DoubleUser className="size-5" />
                                <Trans>Sign In</Trans>
                            </>
                        )}
                    </ClickableButton>
                </div>
            )}
        </footer>
    );
}
