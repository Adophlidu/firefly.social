import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { ClientOnly } from '@dimensiondev/ssr';
import { ConnectionController as CoreConnectionController } from '@reown/appkit-controllers';
import { useQuery } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { memo, useEffect } from 'react';
import { useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi';

import { privySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { logger } from '@/lib/Logger.js';
import { evmWalletAddressAtom, solanaWalletAddressAtom } from '@/store/embeddedWallets.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { getPrivyWalletApi } from '@/store/privyWalletApiAtom.js';

const PrivyWalletAutomatorBase = memo(function PrivyWalletAutomator() {
    const token = useAtomValue(fireflySessionTokenAtom);
    const connectors = useConnectors();
    const { mutate: connect } = useConnect();
    const { isConnected, connector: activeConnector } = useConnection();
    const { mutate: disconnect } = useDisconnect();

    const [evmAddress, setEvmAddress] = useAtom(evmWalletAddressAtom);
    const [solanaAddress, setSolanaAddress] = useAtom(solanaWalletAddressAtom);

    useQuery({
        queryKey: ['privy', 'user', token],
        enabled: !!token,
        retry: 6,
        staleTime: 1000 * 60 * 60, // 1 hour
        queryFn: () => getPrivyWalletApi().getPrivyUser(),
        select: (data) => {
            if (!data) return null;

            const evmAccount = data.linked_accounts.find(
                (acc) => acc.type === 'wallet' && acc.connector_type === 'embedded' && acc.chain_type === 'ethereum',
            );
            const solanaAccount = data.linked_accounts.find(
                (acc) => acc.type === 'wallet' && acc.connector_type === 'embedded' && acc.chain_type === 'solana',
            );

            setEvmAddress(evmAccount?.address ?? null);
            setSolanaAddress(solanaAccount?.address ?? null);

            return {
                evmAddress: evmAccount?.address ?? null,
                solanaAddress: solanaAccount?.address ?? null,
            };
        },
    });

    // Evm wallet connection automator
    useEffect(() => {
        const backendConnector = connectors.find((c) => c.id === PRIVY_CONNECTOR_ID);

        if (isConnected && activeConnector && activeConnector.id !== PRIVY_CONNECTOR_ID) {
            logger.warn(
                `Connected to a non-Privy connector (${activeConnector.name}). Disconnecting to avoid conflicts...`,
            );
            disconnect();
            return;
        }

        if (evmAddress && !isConnected && backendConnector) {
            logger.info('Connecting to Privy EVM wallet...');
            connect({ connector: backendConnector });
        } else if (!evmAddress && isConnected && activeConnector?.id === PRIVY_CONNECTOR_ID) {
            logger.info('Disconnecting from Privy EVM wallet...');
            disconnect();
        }
    }, [evmAddress, isConnected, connectors, connect, disconnect, activeConnector]);

    // Solana wallet connection automator
    useEffect(() => {
        async function syncSolanaState() {
            const adapter = privySolanaProvider.adapter;
            if (solanaAddress && !adapter.connected && !adapter.connecting) {
                logger.info('Connecting to Privy Solana wallet...');

                try {
                    await CoreConnectionController.connectExternal(privySolanaProvider, privySolanaProvider.chain);
                } catch (error) {
                    logger.error('Failed to connect to Privy Solana wallet', error);
                }
            } else if (!solanaAddress && adapter.connected) {
                logger.info('Disconnecting from Privy Solana wallet...');

                try {
                    await CoreConnectionController.disconnectConnector({
                        id: PRIVY_CONNECTOR_ID,
                        namespace: 'solana',
                    });
                } catch (error) {
                    logger.error('Failed to disconnect from Privy Solana wallet', error);
                }
            }
        }

        syncSolanaState();
    }, [solanaAddress]);

    // Notify parent frame of wallet auth status
    useEffect(() => {
        // Keep legacy behavior: notify parent frame once auth session exists,
        // instead of requiring both embedded wallet addresses to be present.
        if (!token) return;

        const FAST_INTERVAL = 1_000;
        const SLOW_INTERVAL = 10_000;
        const FAST_PHASE_DURATION = 60_000;
        const startTime = Date.now();
        let timerId: ReturnType<typeof setTimeout>;

        const send = () => {
            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_AUTHORIZED, {}).catch(() => {});
        };

        const tick = () => {
            send();
            const elapsed = Date.now() - startTime;
            const interval = elapsed < FAST_PHASE_DURATION ? FAST_INTERVAL : SLOW_INTERVAL;
            timerId = setTimeout(tick, interval);
        };

        tick();

        return () => clearTimeout(timerId);
    }, [token]);

    return null;
});

export function PrivyWalletAutomator() {
    return (
        <ClientOnly>
            <PrivyWalletAutomatorBase />
        </ClientOnly>
    );
}
