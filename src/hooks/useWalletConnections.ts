import { CoreChainController } from '@reown/appkit';
import type { ChainAdapter } from '@reown/appkit/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { compact, first, uniqBy } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { type Connector, useAccount, useConnections, useConnectors } from 'wagmi';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { NetworkType, WalletSource } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveNamespace } from '@/helpers/resolveNamespace.js';
import { useSolanaAccount, useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import type { ChainNamespace } from '@/types/utility.js';

function useWagmiCurrentConnectionId() {
    const [wagmiStore] = useLocalStorage<{ state: { current: string } } | null>('wagmi.store', null);
    return wagmiStore?.state?.current;
}

function getWalletIcon(namespace: ChainNamespace, chainState: Map<ChainNamespace, ChainAdapter>) {
    return chainState.get(namespace)?.accountState?.connectedWalletInfo?.icon;
}

export enum ConnectionSource {
    Appkit = 'appkit',
    Privy = 'privy',
}

interface Connection {
    source: ConnectionSource;
    address: string;
    namespace: ChainNamespace;
    connected: boolean;
    connector?: Connector;
    chainId?: number;
    walletIcon?: string;
}

function useAppkitConnectedSolanaWalletIcon() {
    const [icon, setIcon] = useState(getWalletIcon('solana', CoreChainController.state.chains));
    useEffect(() => {
        return CoreChainController.subscribe(({ chains }) => {
            setIcon(getWalletIcon('solana', chains));
        });
    }, []);
    return icon;
}

export function useWalletConnections() {
    const connections = useConnections();
    const { ethereum } = useWalletAccountAll();
    const solanaWalletIcon = useAppkitConnectedSolanaWalletIcon();
    const { address: solanaAddress } = useAppKitAccount({ namespace: 'solana' });
    const solanaAccount = useSolanaAccount();
    const solanaWallets = useFireflyWalletStore((state) => state.wallets[NetworkType.Solana]);

    const account = useAccount();
    const wagmiCurrentConnectionId = useWagmiCurrentConnectionId();

    const { data: allFireflyConnections } = useAllConnections();
    const connectors = useConnectors();

    const allConnections = useMemo<Connection[]>(() => {
        const currentConnectionId = account.connector?.uid ?? wagmiCurrentConnectionId;
        const privySolanaAddress = first(solanaWallets)?.address;
        const fireflyConnectedAddress =
            allFireflyConnections?.connected.map((connection) => {
                if (connection.source !== WalletSource.Privy) return null;
                const networkType = getAddressType(connection.address);
                if (!networkType) return null;
                return {
                    address: connection.address,
                    namespace: resolveNamespace(networkType),
                    connector:
                        networkType === NetworkType.Ethereum
                            ? connectors.find((c) => c.id === PRIVY_CONNECTOR_ID)
                            : undefined,
                    connected: false,
                    walletIcon: networkType === NetworkType.Solana ? solanaWalletIcon : undefined,
                    source: ConnectionSource.Privy,
                };
            }) ?? [];
        return uniqBy(
            compact([
                ...connections.map((x) => {
                    return {
                        address: x.accounts[0],
                        namespace: 'eip155' as ChainNamespace,
                        connected: currentConnectionId
                            ? currentConnectionId === x.connector.uid
                            : x.accounts.some((address) => isSameAddress(address, ethereum.address)),
                        connector: x.connector,
                        chainId: x.chainId,
                        walletIcon: x.connector.icon,
                        source: x.connector?.id === 'network.privy' ? ConnectionSource.Privy : ConnectionSource.Appkit,
                    };
                }),
                solanaAddress
                    ? {
                          address: solanaAddress,
                          namespace: 'solana' as ChainNamespace,
                          connected: isSameAddress(solanaAddress, solanaAccount.address),
                          connector: undefined,
                          walletIcon: solanaWalletIcon,
                          source: ConnectionSource.Appkit,
                      }
                    : null,
                privySolanaAddress
                    ? {
                          address: privySolanaAddress,
                          namespace: 'solana' as ChainNamespace,
                          connected: isSameAddress(privySolanaAddress, solanaAccount.address),
                          connector: undefined,
                          walletIcon: solanaWalletIcon,
                          source: ConnectionSource.Privy,
                      }
                    : null,
                ...fireflyConnectedAddress,
            ]),
            (x) => `${x.namespace}:${x.namespace === 'eip155' ? x.address?.toLowerCase() : x.address}`,
        ).sort((a, b) => {
            if (a.namespace === 'eip155' && b.namespace !== 'eip155') return -1;
            if (a.namespace !== 'eip155' && b.namespace === 'eip155') return 1;
            return 0;
        });
    }, [
        account.connector?.uid,
        wagmiCurrentConnectionId,
        solanaWallets,
        allFireflyConnections?.connected,
        connections,
        solanaAddress,
        solanaAccount.address,
        solanaWalletIcon,
        connectors,
        ethereum.address,
    ]);

    return allConnections;
}
