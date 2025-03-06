import { Trans } from '@lingui/react/macro';
import { mainnet, solana } from '@reown/appkit/networks';
import { compact } from 'lodash-es';
import { type FunctionComponent, memo, type SVGAttributes, useEffect, useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { type Connector, useConnections, useEnsName, useSwitchAccount } from 'wagmi';

import EvmIcon from '@/assets/evm.svg';
import PlusIcon from '@/assets/plus.svg';
import SolanaIcon from '@/assets/solana.svg';
import SwitchIcon from '@/assets/switch.svg';
import WalletIcon from '@/assets/wallet.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit, networks } from '@/configs/wagmiClient.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { ConnectModalRef } from '@/modals/controls.js';
import { restoreDisconnectMethod, rewriteDisconnectMethod } from '@/modals/MyWalletsModal/rewriteDisconnectMethod.js';
import { syncWalletIdentity } from '@/modals/MyWalletsModal/syncWalletIdentity.js';
import type { ChainNamespace } from '@/types/index.js';

const IconMap: Record<ChainNamespace, FunctionComponent<SVGAttributes<SVGElement>>> = {
    eip155: EvmIcon,
    solana: SolanaIcon,
    bip122: WalletIcon,
    polkadot: WalletIcon,
};

interface ConnectedItemProps extends ClickableButtonProps {
    namespace: ChainNamespace;
    address: string;
    connected: boolean;
    connector?: Connector;
    chainId?: number;
}

function ConnectedItem({ namespace, address, connected, connector, chainId, ...rest }: ConnectedItemProps) {
    const { switchAccountAsync } = useSwitchAccount();
    const { data: ensName } = useEnsName({
        address: address as Address,
        query: { enabled: namespace === 'eip155' },
    });

    const Icon = IconMap[namespace] || WalletIcon;

    const [{ loading }, onConnectionClick] = useAsyncFn(async () => {
        if (!connected && connector) {
            await switchAccountAsync({ connector });
            return;
        }
        if (!connected) return;

        const targetNetwork =
            namespace === 'eip155'
                ? chainId
                    ? networks.find((x) => x.id === chainId) || mainnet
                    : mainnet
                : namespace === 'solana'
                  ? solana
                  : undefined;
        if (targetNetwork) {
            appkit.switchNetwork(targetNetwork);
        }
        if (namespace === 'eip155') {
            appkit.setCaipAddress(`eip155:${targetNetwork?.id || mainnet.id}:${address}`, namespace);
        }
        rewriteDisconnectMethod(namespace, connector?.id);
        await syncWalletIdentity({ address, namespace });
        await appkit.open({ view: 'Account' });
    }, [connected, connector, namespace, address, chainId, switchAccountAsync]);

    return (
        <ClickableButton
            key={address}
            className="flex h-10 w-full items-center justify-between gap-2 px-2 text-main"
            onClick={onConnectionClick}
            disabled={loading}
            {...rest}
        >
            <Icon className="shrink-0" width={20} height={20} />
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

export const ConnectedWallets = memo(function ConnectedWallets() {
    const connections = useConnections();
    const { ethereum, solana } = useWalletAccountAll();

    const allConnections = useMemo<
        Array<{
            address: string;
            namespace: ChainNamespace;
            connected: boolean;
            connector?: Connector;
            chainId?: number;
        }>
    >(() => {
        return compact([
            ethereum.isConnected
                ? {
                      address: ethereum.address,
                      namespace: 'eip155' as ChainNamespace,
                      connected: true,
                      connector: undefined,
                  }
                : null,
            solana.isConnected
                ? {
                      address: solana.address,
                      namespace: 'solana' as ChainNamespace,
                      connected: true,
                      connector: undefined,
                  }
                : null,
            ...connections
                .filter(({ accounts }) => !accounts.some((x) => isSameAddress(x, ethereum.address)))
                .map((x) => ({
                    address: x.accounts[0],
                    namespace: 'eip155' as ChainNamespace,
                    connected: false,
                    connector: x.connector,
                    chainId: x.chainId,
                })),
        ]);
    }, [ethereum, solana, connections]);

    useEffect(() => restoreDisconnectMethod, []);

    return (
        <div>
            <div className="overflow-hidden rounded-lg border border-secondaryLine">
                <ClickableButton
                    className="flex h-10 w-full items-center justify-between gap-2 border-b border-secondaryLine bg-lightBg px-2 text-main"
                    onClick={() => {
                        ConnectModalRef.open();
                    }}
                >
                    <WalletIcon width={20} height={20} />
                    <span className="min-w-0 flex-1 truncate text-left text-sm">
                        <Trans>Connecting wallets</Trans>
                    </span>
                    <PlusIcon width={20} height={20} />
                </ClickableButton>
                {!allConnections.length ? (
                    <div className="flex h-10 items-center justify-center text-sm text-secondary">
                        <Trans>No connected wallet.</Trans>
                    </div>
                ) : null}
                {allConnections.map((connection) => {
                    return (
                        <ConnectedItem
                            key={connection.address}
                            connected={connection.connected}
                            namespace={connection.namespace}
                            address={connection.address}
                            connector={connection.connector}
                            chainId={connection.chainId}
                        />
                    );
                })}
            </div>
        </div>
    );
});
