import { Trans } from '@lingui/react/macro';
import { CoreChainController } from '@reown/appkit';
import { mainnet } from '@reown/appkit/networks';
import { compact, uniqBy } from 'lodash-es';
import { type FunctionComponent, memo, type SVGAttributes, useEffect, useMemo, useState } from 'react';
import { useAsyncFn } from 'react-use';
import { type Connector, useConnections, useSwitchAccount } from 'wagmi';

import EvmIcon from '@/assets/evm.svg';
import PlusIcon from '@/assets/plus.svg';
import SolanaIcon from '@/assets/solana.svg';
import SwitchIcon from '@/assets/switch.svg';
import WalletIcon from '@/assets/wallet.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { appkit } from '@/configs/wagmiClient.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { parseJSON } from '@/helpers/parseJSON.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useEnsNameCached } from '@/hooks/useEnsNameCached.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import { restoreDisconnectMethod, rewriteDisconnectMethod } from '@/modals/MyWalletsModal/rewriteDisconnectMethod.js';
import { switchNetwork } from '@/modals/MyWalletsModal/switchNetwork.js';
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
    walletIconUrl?: string;
}

function ConnectedItem({
    namespace,
    address,
    connected,
    connector,
    chainId,
    walletIconUrl,
    ...rest
}: ConnectedItemProps) {
    const { switchAccountAsync } = useSwitchAccount();
    const { data: ensName } = useEnsNameCached(address, undefined, namespace === 'eip155');

    const Icon = IconMap[namespace] || WalletIcon;

    const [{ loading }, onConnectionClick] = useAsyncFn(async () => {
        if (!connected && connector) {
            await switchAccountAsync({ connector });
            return;
        }
        if (!connected) return;

        const targetNetwork = await switchNetwork(namespace, chainId);
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

function getWagmiCurrentConnectionId() {
    const storage = localStorage.getItem('wagmi.store');
    if (!storage) return;

    const wagmiStore = parseJSON<{ state: { current: string } }>(storage);

    return wagmiStore?.state?.current;
}

export const ConnectedWallets = memo(function ConnectedWallets() {
    const connections = useConnections();
    const { ethereum, solana } = useWalletAccountAll();
    const [chainState, setChainState] = useState(CoreChainController.state.chains);

    const solanaWalletIcon = chainState.get('solana')?.accountState?.connectedWalletInfo?.icon;
    const allConnections = useMemo<
        Array<{
            address: string;
            namespace: ChainNamespace;
            connected: boolean;
            connector?: Connector;
            chainId?: number;
            walletIcon?: string;
        }>
    >(() => {
        const currentConnectionId = getWagmiCurrentConnectionId();

        return uniqBy(
            compact([
                ...(ethereum.isConnected
                    ? connections.map((x) => ({
                          address: x.accounts[0],
                          namespace: 'eip155' as ChainNamespace,
                          connected: currentConnectionId
                              ? currentConnectionId === x.connector.uid
                              : x.accounts.some((address) => isSameAddress(address, ethereum.address)),
                          connector: x.connector,
                          chainId: x.chainId,
                          walletIcon: x.connector.icon,
                      }))
                    : []),
                solana.isConnected
                    ? {
                          address: solana.address,
                          namespace: 'solana' as ChainNamespace,
                          connected: true,
                          connector: undefined,
                          walletIcon: solanaWalletIcon,
                      }
                    : null,
            ]).sort((a) => (a.connected ? -1 : 1)),
            (x) => `${x.namespace}:${x.connector?.id}:${x.address}`,
        );
    }, [ethereum, solana, connections, solanaWalletIcon]);

    useEffect(() => {
        const unsubscribe = CoreChainController.subscribeKey('chains', (chains) => {
            setChainState(chains);
        });

        return () => {
            unsubscribe();
            restoreDisconnectMethod();
        };
    }, []);

    return (
        <div>
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
                {!allConnections.length ? (
                    <div className="flex h-10 items-center justify-center text-sm text-secondary">
                        <Trans>No connected wallet.</Trans>
                    </div>
                ) : null}
                {allConnections.map((connection) => {
                    return (
                        <ConnectedItem
                            key={`${connection.address}:${connection.connector?.id}:${connection.connected}`}
                            connected={connection.connected}
                            namespace={connection.namespace}
                            address={connection.address}
                            connector={connection.connector}
                            chainId={connection.chainId}
                            walletIconUrl={connection.walletIcon}
                        />
                    );
                })}
            </div>
        </div>
    );
});
