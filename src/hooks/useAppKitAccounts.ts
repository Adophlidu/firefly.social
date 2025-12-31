import {
    CoreAssetUtil,
    CoreChainController,
    CoreConnectionController,
    CoreConnectionControllerUtil,
    CoreConnectorController,
} from '@reown/appkit';
import type { CaipAddress, Connection } from '@reown/appkit/react';
import { compact } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConnectionSource, NetworkType } from '@/constants/enum.js';
import { walletConnectIcon, walletConnectId } from '@/constants/reown.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { networkTypeToChainNamespace } from '@/helpers/networkTypeToChainNamespace.js';
import { usePrivyConnections } from '@/hooks/usePrivyConnections.js';
import type { ChainNamespace } from '@/types/utility.js';

export interface AppKitAccount {
    address: string;
    network: NetworkType;
    connected: boolean;
    namespace: ChainNamespace;
    source: ConnectionSource;
    connection?: Connection;
    walletIcon?: string;
    isLoading?: boolean;
    connectorId?: string;
}

function parseCaipAddress(caipAddress: CaipAddress) {
    const parts = caipAddress.split(':');
    if (parts.length !== 3) {
        throw new Error(`Invalid CAIP-10 address: ${caipAddress}`);
    }

    const [chainNamespace, chainId, address] = parts;
    if (!chainNamespace || !chainId || !address) {
        throw new Error(`Invalid CAIP-10 address: ${caipAddress}`);
    }

    return {
        chainNamespace: chainNamespace as ChainNamespace,
        chainId,
        address,
    };
}

function connectionToAccounts(connection: Connection, network: NetworkType) {
    return compact(
        connection.accounts.map((account) => {
            const connector = CoreConnectorController.getConnectorById(connection.connectorId);
            const connectorImage = CoreAssetUtil.getConnectorImage(connector);
            const namespace = networkTypeToChainNamespace(network);
            if (!namespace) return null;

            return {
                address: account.address,
                network,
                connected: false,
                isLoading: false,
                walletIcon: connectorImage,
                namespace,
                connection,
                connectorId: connector?.id,
                source: connector?.id === 'network.privy' ? ConnectionSource.Privy : ConnectionSource.Appkit,
            } satisfies AppKitAccount;
        }),
    );
}

function useAppKitAccountsByNetwork(network: NetworkType) {
    const [activeConnectorIds, setActiveConnectorIds] = useState(CoreConnectorController.state.activeConnectorIds);
    const [caipAddress, setCaipAddress] = useState<CaipAddress | undefined>();
    const [connections, setConnections] = useState<Connection[]>([]);

    const chainNamespace = networkTypeToChainNamespace(network);

    useEffect(() => {
        if (!chainNamespace) return;

        setCaipAddress(CoreChainController.getAccountData(chainNamespace)?.caipAddress);
        setConnections(CoreConnectionControllerUtil.getConnectionsData(chainNamespace).connections);

        const subscribers = [
            CoreConnectionController.subscribeKey('connections', () => {
                const { connections } = CoreConnectionControllerUtil.getConnectionsData(chainNamespace);
                setConnections(connections);
            }),
            CoreConnectorController.subscribeKey('activeConnectorIds', (ids) => {
                setActiveConnectorIds(ids);
            }),
            CoreChainController.subscribeChainProp('accountState', () => {
                setCaipAddress(CoreChainController.getAccountData(chainNamespace)?.caipAddress);
            }),
        ];

        return () => {
            subscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, [chainNamespace]);

    const getActiveConnections = useCallback(
        (namespace: ChainNamespace) => {
            const connectorId = activeConnectorIds[namespace];
            const { connections } = CoreConnectionControllerUtil.getConnectionsData(namespace);
            if (!connectorId) {
                return connections;
            }

            const [connectedConnection] = connections.filter(
                (connection) => connection.connectorId?.toLowerCase() === connectorId?.toLowerCase(),
            );

            const isBitcoin = namespace === 'bip122';

            const { address } = caipAddress ? parseCaipAddress(caipAddress) : {};

            let addresses = [...(address ? [address] : [])];

            if (isBitcoin && connectedConnection) {
                addresses = connectedConnection.accounts.map((account) => account.address) || EMPTY_LIST;
            }

            return CoreConnectionControllerUtil.excludeConnectorAddressFromConnections({
                connectorId,
                addresses,
                connections,
            });
        },
        [activeConnectorIds, caipAddress],
    );
    const hasAnyConnections = useMemo(() => {
        if (!chainNamespace) return false;

        const connections = getActiveConnections(chainNamespace);

        return !!caipAddress || connections.length > 0;
    }, [caipAddress, chainNamespace, getActiveConnections]);

    const currentAccount: AppKitAccount | null = useMemo(() => {
        if (!chainNamespace || !hasAnyConnections) return null;

        const connectorId = activeConnectorIds[chainNamespace];
        if (!connectorId) return null;

        const plainAddress = caipAddress?.split(':')[2];
        if (!plainAddress) return null;

        const connector = CoreConnectorController.getConnectorById(connectorId);
        const connection = connections.find((c) => c.connectorId?.toLowerCase() === connector?.id.toLowerCase());
        const connectorImage =
            connector?.id === walletConnectId ? walletConnectIcon : CoreAssetUtil.getConnectorImage(connector);

        return {
            address: plainAddress,
            network,
            connected: true,
            isLoading: false,
            connection,
            walletIcon: connectorImage,
            namespace: chainNamespace,
            connectorId: connector?.id,
            source: connector?.id === 'network.privy' ? ConnectionSource.Privy : ConnectionSource.Appkit,
        };
    }, [chainNamespace, activeConnectorIds, caipAddress, network, connections, hasAnyConnections]);

    const activeAccounts = useMemo<AppKitAccount[]>(() => {
        if (!chainNamespace || !hasAnyConnections) return EMPTY_LIST;

        const activeConnections = getActiveConnections(chainNamespace).filter((x) => x.accounts.length > 0);
        if (!activeConnections.length) return EMPTY_LIST;

        return activeConnections.flatMap((x) => connectionToAccounts(x, network));
    }, [chainNamespace, network, hasAnyConnections, getActiveConnections]);

    return compact([currentAccount, ...activeAccounts]);
}

export function useAppKitAccounts() {
    const evm = useAppKitAccountsByNetwork(NetworkType.Ethereum);
    const solana = useAppKitAccountsByNetwork(NetworkType.Solana);

    return [...evm, ...solana];
}

export function usePrivyAppKitAccounts(): {
    accounts: AppKitAccount[];
    isLoading: boolean;
} {
    const allAccounts = useAppKitAccounts();
    const { connections, isLoading } = usePrivyConnections();

    const privyEvm = connections.find((x) => getAddressType(x.address) === NetworkType.Ethereum);
    const privySolana = connections.find((x) => getAddressType(x.address) === NetworkType.Solana);

    const accounts = compact([
        privyEvm
            ? {
                  address: privyEvm.address,
                  network: NetworkType.Ethereum,
              }
            : null,
        privySolana
            ? {
                  address: privySolana.address,
                  network: NetworkType.Solana,
              }
            : null,
    ]).map((x) => {
        const account = allAccounts.find((a) => a.network === x.network && isSameAddress(x.address, a.address));
        if (account) return account;

        return {
            address: x.address,
            network: x.network,
            connected: false,
            namespace: networkTypeToChainNamespace(x.network)!,
            source: ConnectionSource.Privy,
        };
    });

    return { accounts, isLoading };
}
