import { Trans } from '@lingui/react/macro';
import { mainnet } from '@reown/appkit/networks';
import { uniqBy } from 'lodash-es';
import { type FunctionComponent, memo, type SVGAttributes } from 'react';
import { useAsyncFn } from 'react-use';
import { type Connector, useSwitchAccount } from 'wagmi';

import EvmIcon from '@/assets/evm.svg';
import FireflyIcon from '@/assets/firefly.round.svg';
import PlusIcon from '@/assets/plus.svg';
import SolanaIcon from '@/assets/solana.svg';
import SwitchIcon from '@/assets/switch.svg';
import WalletIcon from '@/assets/wallet.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit } from '@/configs/appkit.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveNamespace } from '@/helpers/resolveNamespace.js';
import { useEnsNameCached } from '@/hooks/useEnsNameCached.js';
import { useIsCreatedPrivyWallet } from '@/hooks/useIsCreatedPrivyWallet.js';
import { usePrivyConnections } from '@/hooks/usePrivyConnections.js';
import { ConnectionSource, useWalletConnections } from '@/hooks/useWalletConnections.js';
import { rewriteDisconnectMethod } from '@/modals/MyWalletsModal/rewriteDisconnectMethod.js';
import { switchNetwork } from '@/modals/MyWalletsModal/switchNetwork.js';
import { syncWalletIdentity } from '@/modals/MyWalletsModal/syncWalletIdentity.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { captureFireflyWalletEvent } from '@/providers/telemetry/captureFireflyWalletEvent.js';
import { WalletProfileDataSource } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';
import type { ChainNamespace } from '@/types/utility.js';

const IconMap: Record<ChainNamespace, FunctionComponent<SVGAttributes<SVGElement>>> = {
    eip155: EvmIcon,
    solana: SolanaIcon,
    bip122: WalletIcon,
    polkadot: WalletIcon,
    cosmos: WalletIcon,
};

interface ConnectedItemProps extends Omit<ClickableButtonProps, 'onClick'> {
    namespace: ChainNamespace;
    address: string;
    connected: boolean;
    connector?: Connector;
    chainId?: number;
    walletIconUrl?: string;
    source?: ConnectionSource;
    onOpenPrivy?: () => void;
    loading?: boolean;
}

function ConnectedItem({
    namespace,
    address,
    connected,
    connector,
    chainId,
    walletIconUrl,
    source,
    onOpenPrivy,
    loading: isLoading,
    ...rest
}: ConnectedItemProps) {
    const { switchAccountAsync } = useSwitchAccount();
    const { data: ensName } = useEnsNameCached(address, undefined, namespace === 'eip155');
    const setActiveNetwork = useSolanaActiveNetworkStore((s) => s.setActiveNetwork);

    const Icon = IconMap[namespace] || WalletIcon;

    const [{ loading: isConnecting }, onConnectionClick] = useAsyncFn(async () => {
        if (namespace === 'solana') {
            setActiveNetwork(source === ConnectionSource.Privy ? SolanaNetworkType.Privy : SolanaNetworkType.Appkit);
        }
        if (!connected && connector) {
            await connector.connect();
            await switchAccountAsync({ connector });
            return;
        }
        if (!connected) return;
        if (source === ConnectionSource.Privy) {
            onOpenPrivy?.();
            return;
        }

        const targetNetwork = await switchNetwork(namespace, chainId);
        if (namespace === 'eip155') {
            appkit.setCaipAddress(`eip155:${targetNetwork?.id || mainnet.id}:${address}`, namespace);
        }
        rewriteDisconnectMethod(namespace, connector?.id);
        await syncWalletIdentity({ address, namespace });
        await appkit.open({ view: 'Account' });
    }, [onOpenPrivy, namespace, connected, connector, source, chainId, address, setActiveNetwork, switchAccountAsync]);

    const loading = isConnecting || isLoading;

    return (
        <ClickableButton
            key={address}
            className="flex h-10 w-full items-center justify-between gap-2 px-2 text-main"
            onClick={onConnectionClick}
            disabled={loading}
            {...rest}
        >
            <Icon className="shrink-0" width={20} height={20} />
            {walletIconUrl ? (
                <Image src={walletIconUrl.trim()} alt="" className="size-5 shrink-0" width={20} height={20} />
            ) : null}
            <span className="min-w-0 flex-1 truncate text-left">{ensName || formatAddress(address, 4)}</span>
            {loading ? (
                <LoadingIcon size={20} />
            ) : connected ? (
                <CircleCheckboxIcon size={20} checked />
            ) : (
                <SwitchIcon width={20} height={20} />
            )}
        </ClickableButton>
    );
}

function FireflyWalletPanel({ onOpenWallets }: { onOpenWallets?: () => void }) {
    const allWalletConnections = useWalletConnections();
    const { isLoading: isLoadingAllConnections } = usePrivyConnections();
    const { isCreatedPrivyWallet } = useIsCreatedPrivyWallet();
    const isAuthorized = useFireflyWalletStore((state) => state.isAuthorized);
    const loading = !isAuthorized;

    if (isLoadingAllConnections) return <div className="mb-2 h-[122px] w-full animate-pulse rounded-lg bg-bg" />;
    if (!isCreatedPrivyWallet) return null;
    const privyConnections = uniqBy(
        allWalletConnections.filter((x) => x.source === 'privy'),
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
                    useGlobalState.getState().updateFireflyWalletIsOpen(true);
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
                    const networkType = getAddressType(connection.address);
                    if (!networkType) return null;
                    return (
                        <ConnectedItem
                            key={connection.address}
                            connected={!!walletConnection?.connected}
                            namespace={resolveNamespace(networkType)}
                            address={connection.address}
                            connector={walletConnection?.connector}
                            chainId={walletConnection?.chainId}
                            source={ConnectionSource.Privy}
                            onOpenPrivy={() => {
                                useGlobalState.getState().updateFireflyWalletIsOpen(true);
                                onOpenWallets?.();
                            }}
                            loading={loading}
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
    const allConnections = useWalletConnections();
    const connections = allConnections.filter((x) => x.source === ConnectionSource.Appkit);

    return (
        <div>
            {env.external.NEXT_PUBLIC_PRIVY === STATUS.Enabled ? (
                <FireflyWalletPanel onOpenWallets={onOpenWallets} />
            ) : null}
            <div className="overflow-hidden rounded-lg border border-secondaryLine">
                <ClickableButton
                    className="flex h-10 w-full items-center justify-between gap-2 border-b border-secondaryLine bg-lightBg px-2 text-main"
                    onClick={() => {
                        WalletConnectModalRef.open();
                    }}
                >
                    <WalletIcon width={20} height={20} />
                    <span className="min-w-0 flex-1 truncate text-left text-sm">
                        <Trans>Connecting wallets</Trans>
                    </span>
                    <PlusIcon width={20} height={20} />
                </ClickableButton>
                {!connections.length ? (
                    <div className="flex h-20 items-center justify-center text-sm text-secondary">
                        <Trans>No connected wallet.</Trans>
                    </div>
                ) : (
                    connections.map((connection) => {
                        return (
                            <ConnectedItem
                                key={`${connection.address}:${connection.connector?.id}:${connection.connected}`}
                                connected={connection.connected}
                                namespace={connection.namespace}
                                address={connection.address}
                                connector={connection.connector}
                                chainId={connection.chainId}
                                walletIconUrl={connection.walletIcon}
                                source={connection.source}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
});
