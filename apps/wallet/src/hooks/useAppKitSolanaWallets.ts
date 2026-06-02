import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import type { Connection } from '@reown/appkit/react';
import {
    AssetUtil as CoreAssetUtil,
    ConnectionController as CoreConnectionController,
    ConnectionControllerUtil as CoreConnectionControllerUtil,
    ConnectorController as CoreConnectorController,
} from '@reown/appkit-controllers';
import { useEffect, useMemo, useState } from 'react';

export interface AppKitSolanaWallet {
    address: string;
    name: string;
    icon?: string;
    connected: boolean;
    connection: Connection;
}

export function useAppKitSolanaWallets(filterPrivy = true): AppKitSolanaWallet[] {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [, setTick] = useState(0);

    useEffect(() => {
        setConnections(CoreConnectionControllerUtil.getConnectionsData('solana').connections);

        const subscribers = [
            CoreConnectionController.subscribeKey('connections', () => {
                const { connections } = CoreConnectionControllerUtil.getConnectionsData('solana');
                setConnections(connections);
            }),
            CoreConnectorController.subscribeKey('activeConnectorIds', () => {
                setTick((t) => t + 1);
            }),
        ];

        return () => {
            subscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, []);

    return useMemo(() => {
        return connections
            .filter((conn) => (!filterPrivy || conn.connectorId !== PRIVY_CONNECTOR_ID) && conn.accounts.length > 0)
            .flatMap((conn) => {
                const connector = CoreConnectorController.getConnectorById(conn.connectorId);
                const connectorImage = CoreAssetUtil.getConnectorImage(connector);

                return conn.accounts.map((account) => ({
                    address: account.address,
                    name: connector?.name ?? conn.connectorId ?? 'Unknown',
                    icon: connectorImage,
                    connected: true,
                    connection: conn,
                }));
            });
    }, [connections, filterPrivy]);
}
