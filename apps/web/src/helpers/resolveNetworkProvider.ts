import { NetworkType } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';
import type { NetworkProvider } from '@/providers/types/Network.js';

/**
 * Split from `helpers/resolveTokenTransfer.ts` so read-only consumers (e.g.
 * AddressLink inside wallet embed cards on feed pages) do not pull the transfer
 * providers — and their wallet/anchor dependencies — into their chunk.
 */
export const resolveNetworkProvider = createLookupTableResolver<NetworkType, NetworkProvider>(
    {
        [NetworkType.Ethereum]: EthereumNetwork,
        [NetworkType.Solana]: SolanaNetwork,
    } as Record<NetworkType, NetworkProvider>,
    (network: NetworkType) => {
        throw new UnreachableError('network', network);
    },
);
