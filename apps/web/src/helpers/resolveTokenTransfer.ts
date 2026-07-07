import { NetworkType } from '@dimensiondev/enums';
import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { EthereumTransfer } from '@/providers/ethereum/Transfer.js';
import { SolanaTransfer } from '@/providers/solana/Transfer.js';
import type { TransferProvider } from '@/providers/types/Transfer.js';

// `resolveNetworkProvider` lives in helpers/resolveNetworkProvider.ts so
// read-only consumers do not pull the transfer providers into their chunk.
export const resolveTransferProvider = createLookupTableResolver<NetworkType, TransferProvider>(
    {
        [NetworkType.Ethereum]: EthereumTransfer,
        [NetworkType.Solana]: SolanaTransfer,
    } as Record<NetworkType, TransferProvider>,
    (network: NetworkType) => {
        throw new UnreachableError('network', network);
    },
);
