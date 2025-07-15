import { useSolanaWallets } from '@privy-io/react-auth';
import { CoreChainController } from '@reown/appkit';
import { useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { compact, first, uniqBy } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { type Connector, useConnections } from 'wagmi';

import { isSameAddress } from '@/helpers/isSameAddress.js';
import { parseJson } from '@/helpers/parseJson.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { restoreDisconnectMethod } from '@/modals/MyWalletsModal/rewriteDisconnectMethod.js';
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
    const { wallets: solanaWallets } = useSolanaWallets();

    const allConnections = useMemo<Connection[]>(() => {
        const currentConnectionId = getWagmiCurrentConnectionId();
        const privySolanaAddress = first(solanaWallets)?.address;
        const solanaWalletIcon = chainState.get('solana')?.accountState?.connectedWalletInfo?.icon;
        return uniqBy(
            compact([
                ...(ethereum.isConnected
                    ? connections.map((x) => {
                          return {
                              address: x.accounts[0],
                              namespace: 'eip155' as ChainNamespace,
                              connected: currentConnectionId
                                  ? currentConnectionId === x.connector.uid
                                  : x.accounts.some((address) => isSameAddress(address, ethereum.address)),
                              connector: x.connector,
                              chainId: x.chainId,
                              walletIcon: x.connector.icon,
                              source:
                                  x.connector?.id === 'network.privy'
                                      ? ConnectionSource.Privy
                                      : ConnectionSource.Appkit,
                          };
                      })
                    : []
                ).sort((a) => (a.connected ? -1 : 1)),
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
            ]),
            (x) => `${x.namespace}:${x.connector?.id}:${x.address}`,
        );
    }, [
        solanaWallets,
        chainState,
        ethereum.isConnected,
        ethereum.address,
        connections,
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
