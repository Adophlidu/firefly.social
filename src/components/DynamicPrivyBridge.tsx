'use client';

import { useEffect, useState } from 'react';
import { type Connection, useConnections, useConnectors, useDisconnect } from 'wagmi';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { useIsCreatedPrivyWallet } from '@/hooks/useIsCreatedPrivyWallet.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { usePollingSetupPrivyWallet } from '@/hooks/usePollingSetupPrivyWallet.js';

export function DynamicPrivyBridge() {
    const [isSetup, setIsSetup] = useState(false);
    const isLogin = useIsLoginFirefly();
    const { isCreatedPrivyWallet } = useIsCreatedPrivyWallet();
    useEffect(() => {
        if (!isLogin || !isCreatedPrivyWallet) return;
        import('@/components/PrivyBridge.js').then(() => {
            setIsSetup(true);
        });
    }, [isCreatedPrivyWallet, isLogin]);

    const connectors = useConnectors();
    const connections = useConnections();
    const { disconnect } = useDisconnect();

    // When logging out, switch to a connector that is not privy
    useEffect(() => {
        if (isLogin) return;
        const connector = connectors.find((c) => c.id === PRIVY_CONNECTOR_ID);
        if (!connector) return;
        disconnect({ connector });
    }, [connectors, disconnect, isLogin]);

    useEffect(() => {
        if (!isLogin) return;
        const connector = connectors.find((connector) => connector.id === PRIVY_CONNECTOR_ID);
        if (!connector) return;
        if (!connections.some((c) => c.connector.id === PRIVY_CONNECTOR_ID)) {
            connector.connect().then(({ chainId, accounts }) => {
                wagmiConfig.state.connections.set(connector.uid, { connector, chainId, accounts } as Connection);
            });
        }
    }, [connections, connectors, isLogin]);

    usePollingSetupPrivyWallet();

    return isSetup ? <privy-bridge /> : null;
}
