import { safeUnreachable } from '@masknet/kit';

import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import type { ChainNamespace } from '@/types/index.js';

export const resolveAppKitNetworkName = createLookupTableResolver<ChainNamespace, string>(
    {
        eip155: 'EVM',
        solana: 'Solana',
        polkadot: 'Polkadot',
        bip122: 'Bitcoin',
        cosmos: 'Cosmos',
    },
    (namespace: ChainNamespace) => {
        safeUnreachable(namespace as never);
        return '';
    },
);
