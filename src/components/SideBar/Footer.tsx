'use client';

import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';

import DoubleUser from '@/assets/double-user.svg';
import { AccountConnectButton } from '@/components/AccountConnectButton.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { WalletConnectButton } from '@/components/WalletConnectButton.js';
import { classNames } from '@/helpers/classNames.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLogin, useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useMounted } from '@/hooks/useMounted.js';
import { LoginModalRef } from '@/modals/controls.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

interface FooterProps {}

export function Footer(props: FooterProps) {
    const mounted = useMounted();
    const isLogin = useIsLogin();
    const isLoginFirefly = useIsLoginFirefly();
    const isLoading = useAsyncStatusAll();

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
                            LoginModalRef.open();
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
                            LoginModalRef.open();
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
