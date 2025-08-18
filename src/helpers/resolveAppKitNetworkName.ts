import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import type { ChainNamespace } from '@/types/utility.js';

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
