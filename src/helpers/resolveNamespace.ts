import { createLookupTableResolver } from '@dimensiondev/utils';

import { NetworkType } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import type { ChainNamespace } from '@/types/utility.js';

export const resolveNamespace = createLookupTableResolver<NetworkType, ChainNamespace>(
    {
        [NetworkType.Ethereum]: 'eip155',
        [NetworkType.Solana]: 'solana',
    },
    (networkType) => {
        throw new UnreachableError('networkType)', networkType);
    },
);
