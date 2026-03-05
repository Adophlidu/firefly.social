import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { Outlet, useLocation, useRouter, useRouterState } from '@tanstack/react-router';

import { BackButton, CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';

export function RootView() {
    const router = useRouter();
    const { matches, location } = useRouterState();
    const { loading } = WalletConnectContext.useContainer();

    const isMain = location.pathname === '/main';
    const isAllWallets = location.pathname === '/all-wallets';
    const isFinalView = !!useLocation().search._FINAL_VIEW_;

    const contextTitle = [...matches].find((x) => x.context.title)?.context.title;

    const title = contextTitle ?? <Trans>Connect Wallet</Trans>;

    return (
        <div className="relative flex max-h-[70vh] w-[80vw] max-w-[400px] flex-col rounded-md bg-lightBottom text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom max-md:size-full max-md:max-h-screen max-md:max-w-[100vw] md:rounded-xl">
            <h3 className="relative h-14 shrink-0 pt-safe">
                {isMain || isFinalView ? (
                    <CloseButton onClick={() => WalletConnectModalRef.close()} className="absolute left-4 top-4" />
                ) : (
                    <BackButton
                        className="absolute left-4 top-4"
                        onClick={() => {
                            router.history.back();
                        }}
                    />
                )}
                <span className="flex size-full items-center justify-center text-lg font-bold text-main">{title}</span>
            </h3>
            <div
                className={classNames(
                    'no-scrollbar relative min-h-0 flex-1 overflow-y-auto pt-0 max-md:pt-2',
                    isAllWallets ? 'p-3' : 'p-6',
                )}
            >
                <Outlet />
                {loading ? (
                    <div className="absolute inset-0 flex min-h-10 items-center justify-center bg-lightBottom dark:bg-darkBottom">
                        <LoadingIcon />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
