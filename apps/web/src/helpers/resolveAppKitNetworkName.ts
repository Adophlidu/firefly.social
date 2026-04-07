import { createLookupTableResolver, safeUnreachable } from '@dimensiondev/utils';

import { type ChainNamespace } from '@/types/utility.js';

export const resolveAppKitNetworkName = createLookupTableResolver<ChainNamespace, string>(
    {
        eip155: 'EVM',
        solana: 'Solana',
        polkadot: 'Polkadot',
        bip122: 'Bitcoin',
        cosmos: 'Cosmos',
        sui: 'Sui',
        ton: 'Ton',
        stacks: 'Stacks',
        tron: 'Tron',
    },
    (namespace: ChainNamespace) => {
        safeUnreachable(namespace as never);
        return '';
    },
);
