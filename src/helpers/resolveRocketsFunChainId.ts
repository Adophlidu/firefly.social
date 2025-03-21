import { ChainId } from '@masknet/web3-shared-evm';

import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';

export const resolveRocketsFunChainId = createLookupTableResolver<string, ChainId>(
    {
        bnb: ChainId.BSC,
    },
    (chain) => {
        throw new Error(`Unknown rockets.fun chain: ${chain}`);
    },
);
