import FireflyIcon from '@dimensiondev/assets/firefly.round.svg';
import PlusIcon from '@dimensiondev/assets/plus.svg';
import WalletIcon from '@dimensiondev/assets/wallet.svg';
import { ConnectionSource, NetworkType } from '@dimensiondev/enums';
import { isSameAddress, isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import { useConnection, useConnections } from 'wagmi';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit } from '@/configs/appkit.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { openWalletConnectModal } from '@/controllers/openWalletConnectModal.js';
import { getEnsNameFromWalletProfile } from '@/helpers/getEnsNameFromWalletProfile.js';
import { type AppKitAccount, useAppKitAccounts, usePrivyAppKitAccounts } from '@/hooks/useAppKitAccounts.js';
import { useIsCreatedPrivyWallet } from '@/hooks/useIsCreatedPrivyWallet.js';
import { AppKitAccountItem } from '@/modals/MyWalletsModal/AppKitAccountItem.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface Props {
    onOpenWallets?: () => void;
}

const FireflyWalletPanel = memo<Props>(function FireflyWalletPanel({ onOpenWallets }) {
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
});

export const ConnectedWallets = memo(function ConnectedWallets({ onOpenWallets }: Props) {
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

    const { data, isLoading } = useQuery({
        queryKey: ['firefly-wallet-relation', allAccounts.map((a) => a.address)],
        staleTime: Infinity,
        enabled: allAccounts.length > 0,
        queryFn: () =>
            fireflyWalletProvider.getWalletRelationList(
                allAccounts.map((account) => ({
                    walletAddress: account.address,
                    walletType: account.network === NetworkType.Solana ? 'solana' : 'evm',
                })),
            ),
    });

    const allAccountsWithEns = useMemo(
        () =>
            allAccounts.map((account) => {
                const relation = data?.find((r) => isSameAddress(r.address, account.address));

                return {
                    ...account,
                    ensName: relation ? getEnsNameFromWalletProfile(relation) : undefined,
                };
            }),
        [allAccounts, data],
    );

    const [{ loading }, openWallets] = useAsyncFn(async () => {
        appkit.updateRemoteFeatures({ multiWallet: true });
        openWalletConnectModal();
    }, []);

    return (
        <div>
            <FireflyWalletPanel onOpenWallets={onOpenWallets} />
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
                    {loading || isLoading ? <LoadingIcon size={20} /> : <PlusIcon width={20} height={20} />}
                </ClickableButton>
                {!allAccountsWithEns.length ? (
                    <div className="flex h-20 items-center justify-center text-sm text-secondary">
                        <Trans>No connected wallet.</Trans>
                    </div>
                ) : (
                    allAccountsWithEns.map((walletAccount) => {
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
