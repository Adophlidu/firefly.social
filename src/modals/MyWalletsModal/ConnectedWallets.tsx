import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';
import { memo, useCallback } from 'react';
import { useAsyncFn } from 'react-use';

import FireflyIcon from '@/assets/firefly.round.svg';
import PlusIcon from '@/assets/plus.svg';
import WalletIcon from '@/assets/wallet.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit } from '@/configs/appkit.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveNamespace } from '@/helpers/resolveNamespace.js';
import { useAppKitAccounts } from '@/hooks/useAppKitAccounts.js';
import { useIsCreatedPrivyWallet } from '@/hooks/useIsCreatedPrivyWallet.js';
import { usePrivyConnections } from '@/hooks/usePrivyConnections.js';
import { ConnectionSource, useWalletConnections } from '@/hooks/useWalletConnections.js';
import { AppKitAccountItem } from '@/modals/MyWalletsModal/AppKitAccountItem.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { captureFireflyWalletEvent } from '@/providers/telemetry/captureFireflyWalletEvent.js';
import { WalletProfileDataSource } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

function FireflyWalletPanel({ onOpenWallets }: { onOpenWallets?: () => void }) {
    const walletAccounts = useAppKitAccounts();
    const allWalletConnections = useWalletConnections();
    const { isLoading: isLoadingAllConnections } = usePrivyConnections();
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
    const privyConnections = uniqBy(
        allWalletConnections.filter((x) => x.source === ConnectionSource.Privy),
        (x) => `${x.source}${x.namespace}`,
    );

    return (
        <div className="mb-2 h-[122px] overflow-hidden rounded-lg border border-secondaryLine">
            <button
                className="flex h-10 w-full items-center justify-between gap-2 border-b border-secondaryLine bg-lightBg px-2 text-main"
                onClick={() => {
                    captureFireflyWalletEvent(EventId.FIREFLY_WALLET_OPEN_SUCCESS, {
                        wallet_address: privyConnections[0].address,
                        MPC_type: WalletProfileDataSource.Privy,
                    });
                    updateFireflyWalletIsOpen(true);
                }}
            >
                <FireflyIcon width={20} height={20} />
                <span className="min-w-0 flex-1 truncate text-left text-sm">
                    <Trans>Firefly wallets</Trans>
                </span>
                {privyConnections?.length ? (
                    <span className="text-right text-sm">
                        <Trans>Open</Trans>
                    </span>
                ) : null}
            </button>
            {!privyConnections?.length ? (
                <div className="flex h-10 items-center justify-center text-sm text-secondary">
                    <Trans>No connected wallet.</Trans>
                </div>
            ) : (
                privyConnections.map((connection) => {
                    const walletConnection = allWalletConnections.find((x) =>
                        isSameAddress(x.address, connection.address),
                    );
                    const account = walletAccounts.find((x) => isSameAddress(x.address, walletConnection?.address));
                    const networkType = getAddressType(connection.address);
                    if (!networkType) return null;
                    return (
                        <AppKitAccountItem
                            key={`privy-${connection.namespace}-${connection.address}`}
                            {...account}
                            walletIcon={undefined}
                            isLoading={loading}
                            connected={!!connection?.connected}
                            namespace={resolveNamespace(networkType)}
                            address={connection.address}
                            source={ConnectionSource.Privy}
                            onOpenPrivy={onOpenPrivy}
                            network={networkType}
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
    const allWalletConnections = useWalletConnections().filter((x) => x.source === ConnectionSource.Appkit);

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
                {!allWalletConnections.length ? (
                    <div className="flex h-20 items-center justify-center text-sm text-secondary">
                        <Trans>No connected wallet.</Trans>
                    </div>
                ) : (
                    allWalletConnections.map((connection) => {
                        const walletAccount = walletAccounts.find((x) => isSameAddress(x.address, connection.address));
                        if (!walletAccount) return null;
                        return (
                            <AppKitAccountItem
                                key={`appkit-${walletAccount.network}-${walletAccount.address}`}
                                {...walletAccount}
                                connected={connection.connected}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
});
