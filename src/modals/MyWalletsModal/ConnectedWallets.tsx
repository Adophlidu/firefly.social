import { envs, STATUS } from '@dimensiondev/envs';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import { useConnection, useConnections } from 'wagmi';

import FireflyIcon from '@/assets/firefly.round.svg';
import PlusIcon from '@/assets/plus.svg';
import WalletIcon from '@/assets/wallet.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit } from '@/configs/appkit.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { ConnectionSource, NetworkType } from '@/constants/enum.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { type AppKitAccount, useAppKitAccounts, usePrivyAppKitAccounts } from '@/hooks/useAppKitAccounts.js';
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
    const currentWagmiConnection = useConnection();

    // Also show wagmi auto-connected wallets (e.g. OKX browser extension) that
    // AppKit may not know about due to a race condition during initialization.
    const wagmiConnections = useConnections();
    const knownAddresses = useMemo(() => new Set(appkitAccounts.map((a) => a.address.toLowerCase())), [appkitAccounts]);
    const wagmiOnlyAccounts = useMemo<AppKitAccount[]>(() => {
        if (!wagmiConnections.length) return [];
        return compact(
            wagmiConnections
                .filter((c) => c.connector.id !== PRIVY_CONNECTOR_ID)
                .flatMap((connection) =>
                    connection.accounts.map((address) => {
                        if (knownAddresses.has(address.toLowerCase())) return null;
                        return {
                            address,
                            network: NetworkType.Ethereum,
                            connected:
                                currentWagmiConnection.isConnected &&
                                isSameEthereumAddress(currentWagmiConnection.address, address),
                            namespace: 'eip155' as const,
                            source: ConnectionSource.Appkit,
                            connectorId: connection.connector.id,
                            walletIcon: connection.connector.icon,
                        } satisfies AppKitAccount;
                    }),
                ),
        );
    }, [wagmiConnections, knownAddresses, currentWagmiConnection.address, currentWagmiConnection.isConnected]);

    const allAccounts = useMemo(() => [...appkitAccounts, ...wagmiOnlyAccounts], [appkitAccounts, wagmiOnlyAccounts]);

    const [{ loading }, openWallets] = useAsyncFn(async () => {
        appkit.updateRemoteFeatures({ multiWallet: true });
        WalletConnectModalRef.open();
    }, []);

    return (
        <div>
            {envs.external.NEXT_PUBLIC_PRIVY === STATUS.Enabled ? (
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
                {!allAccounts.length ? (
                    <div className="flex h-20 items-center justify-center text-sm text-secondary">
                        <Trans>No connected wallet.</Trans>
                    </div>
                ) : (
                    allAccounts.map((walletAccount) => {
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
