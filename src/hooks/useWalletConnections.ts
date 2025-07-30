import { CoreChainController } from '@reown/appkit';
import { useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { compact, first, uniqBy } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { type Connector, useConnections } from 'wagmi';

import { NetworkType, WalletSource } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { parseJson } from '@/helpers/parseJson.js';
import { resolveNamespace } from '@/helpers/resolveNamespace.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { restoreDisconnectMethod } from '@/modals/MyWalletsModal/rewriteDisconnectMethod.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';
import type { ChainNamespace } from '@/types/index.js';

function getWagmiCurrentConnectionId() {
    const storage = localStorage.getItem('wagmi.store');
    if (!storage) return;

    const wagmiStore = parseJson<{ state: { current: string } }>(storage);

    return wagmiStore?.state?.current;
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

export function useWalletConnections() {
    const connections = useConnections();
    const { ethereum } = useWalletAccountAll();
    const [chainState, setChainState] = useState(CoreChainController.state.chains);
    const { walletProvider } = useAppKitProvider<Provider | undefined>('solana');
    const solanaAddress = walletProvider?.publicKey?.toBase58();
    const activeSolanaNetwork = useSolanaActiveNetworkStore((s) => s.activeNetwork);
    const solanaWallets = usePrivyWalletStore((state) => state.wallets[NetworkType.Solana]);

    const { data: allFireflyConnections } = useAllConnections();

    const allConnections = useMemo<Connection[]>(() => {
        const currentConnectionId = getWagmiCurrentConnectionId();
        const privySolanaAddress = first(solanaWallets)?.address;
        const solanaWalletIcon = chainState.get('solana')?.accountState?.connectedWalletInfo?.icon;
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
                          connected: activeSolanaNetwork === SolanaNetworkType.Appkit,
                          connector: undefined,
                          walletIcon: solanaWalletIcon,
                          source: ConnectionSource.Appkit,
                      }
                    : null,
                privySolanaAddress
                    ? {
                          address: privySolanaAddress,
                          namespace: 'solana' as ChainNamespace,
                          connected: activeSolanaNetwork === SolanaNetworkType.Privy,
                          connector: undefined,
                          walletIcon: solanaWalletIcon,
                          source: ConnectionSource.Privy,
                      }
                    : null,
                ...(allFireflyConnections?.connected.map((connection) => {
                    if (connection.source !== WalletSource.Privy) return null;
                    const networkType = getAddressType(connection.address);
                    if (!networkType) return null;
                    return {
                        address: connection.address,
                        namespace: resolveNamespace(networkType),
                        connector: undefined,
                        connected: false,
                        walletIcon: networkType === NetworkType.Solana ? solanaWalletIcon : undefined,
                        source: ConnectionSource.Privy,
                    };
                }) ?? []),
            ]),
            (x) => `${x.namespace}:${x.namespace === 'eip155' ? x.address?.toLowerCase() : x.address}`,
        );
    }, [
        solanaWallets,
        chainState,
        ethereum.address,
        connections,
        allFireflyConnections?.connected,
        solanaAddress,
        activeSolanaNetwork,
    ]);

    useEffect(() => {
        const unsubscribe = CoreChainController.subscribeKey('chains', (chains) => {
            setChainState(chains);
        });

        return () => {
            unsubscribe();
            restoreDisconnectMethod();
        };
    }, []);

    return allConnections;
}
