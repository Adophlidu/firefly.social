import { unreachable } from '@dimensiondev/utils';
import { useConnection } from 'wagmi';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { NetworkType, SolanaNetworkType } from '@/constants/enum.js';
import { useSolanaAccount } from '@/hooks/useAccountByNetwork.js';

export function useIsPrivyWallet(networkType: NetworkType) {
    const { address, connector } = useConnection();
    const solanaAccount = useSolanaAccount();
    switch (networkType) {
        case NetworkType.Ethereum:
            return !!address && connector?.id === PRIVY_CONNECTOR_ID;
        case NetworkType.Solana:
            return solanaAccount.type === SolanaNetworkType.Privy;

        default:
            unreachable(networkType);
    }
}
