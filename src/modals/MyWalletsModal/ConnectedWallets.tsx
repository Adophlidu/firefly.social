import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';
import { useAsyncFn } from 'react-use';

import FireflyIcon from '@/assets/firefly.round.svg';
import PlusIcon from '@/assets/plus.svg';
import WalletIcon from '@/assets/wallet.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit } from '@/configs/appkit.js';
import { ConnectionSource, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { useAppKitAccounts, usePrivyAppKitAccounts } from '@/hooks/useAppKitAccounts.js';
import { useIsCreatedPrivyWallet } from '@/hooks/useIsCreatedPrivyWallet.js';
import { AppKitAccountItem } from '@/modals/MyWalletsModal/AppKitAccountItem.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { captureFireflyWalletEvent } from '@/providers/telemetry/captureFireflyWalletEvent.js';
import { WalletProfileDataSource } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

function FireflyWalletPanel({ onOpenWallets }: { onOpenWallets?: () => void }) {
    const { accounts: privyAccounts, isLoading: isLoadingAllConnections } = usePrivyAppKitAccounts();
    const { isCreatedPrivyWallet } = useIsCreatedPrivyWallet();
    const isAuthorized = useFireflyWalletStore((state) => state.isAuthorized);
    const loading = !isAuthorized;

    const { updateFireflyWalletIsOpen } = useGlobalState();
    const onOpenPrivy = useCallback(() => {
        updateFireflyWalletIsOpen(true);
        onOpenWallets?.();
    }, [onOpenWallets, updateFireflyWalletIsOpen]);

    if (isLoadingAllConnections) return <div className="mb-2 h-[122px] w-full animate-pulse rounded-lg bg-bg" />;
    if (!isCreatedPrivyWallet) return null;

    return (
        <div className="mb-2 h-[122px] overflow-hidden rounded-lg border border-secondaryLine">
            <button
                className="flex h-10 w-full items-center justify-between gap-2 border-b border-secondaryLine bg-lightBg px-2 text-main"
                onClick={() => {
                    captureFireflyWalletEvent(EventId.FIREFLY_WALLET_OPEN_SUCCESS, {
                        wallet_address: privyAccounts[0]?.address,
                        MPC_type: WalletProfileDataSource.Privy,
                    });
                    updateFireflyWalletIsOpen(true);
                }}
            >
                <FireflyIcon width={20} height={20} />
                <span className="min-w-0 flex-1 truncate text-left text-sm">
                    <Trans>Firefly wallets</Trans>
                </span>
                {privyAccounts?.length ? (
                    <span className="text-right text-sm">
                        <Trans>Open</Trans>
                    </span>
                ) : null}
            </button>
            {!privyAccounts?.length ? (
                <div className="flex h-10 items-center justify-center text-sm text-secondary">
                    <Trans>No connected wallet.</Trans>
                </div>
            ) : (
                privyAccounts.map((appkitAccount) => {
                    return (
                        <AppKitAccountItem
                            key={`privy-${appkitAccount.namespace}-${appkitAccount.address}`}
                            {...appkitAccount}
                            walletIcon={undefined}
                            isLoading={loading}
                            source={ConnectionSource.Privy}
                            onOpenPrivy={onOpenPrivy}
                        />
                    );
                })
            )}
        </div>
    );
}

interface ConnectedWalletsProps {
    onOpenWallets?: () => void;
}

export const ConnectedWallets = memo(function ConnectedWallets({ onOpenWallets }: ConnectedWalletsProps) {
    const walletAccounts = useAppKitAccounts();
    const appkitAccounts = walletAccounts.filter((x) => x.source === ConnectionSource.Appkit);

    const [{ loading }, openWallets] = useAsyncFn(async () => {
        appkit.updateRemoteFeatures({ multiWallet: true });
        WalletConnectModalRef.open();
    }, []);

    return (
        <div>
            {env.external.NEXT_PUBLIC_PRIVY === STATUS.Enabled ? (
                <FireflyWalletPanel onOpenWallets={onOpenWallets} />
            ) : null}
            <div className="overflow-hidden rounded-lg border border-secondaryLine">
                <ClickableButton
                    className="flex h-10 w-full items-center justify-between gap-2 border-b border-secondaryLine bg-lightBg px-2 text-main"
                    disabled={loading}
                    onClick={openWallets}
                    aria-label="Open connecting wallets"
                >
                    <WalletIcon width={20} height={20} />
                    <span className="min-w-0 flex-1 truncate text-left text-sm">
                        <Trans>Connecting wallets</Trans>
                    </span>
                    {loading ? <LoadingIcon size={20} /> : <PlusIcon width={20} height={20} />}
                </ClickableButton>
                {!appkitAccounts.length ? (
                    <div className="flex h-20 items-center justify-center text-sm text-secondary">
                        <Trans>No connected wallet.</Trans>
                    </div>
                ) : (
                    appkitAccounts.map((walletAccount) => {
                        return (
                            <AppKitAccountItem
                                key={`appkit-${walletAccount.network}-${walletAccount.address}`}
                                {...walletAccount}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
});
