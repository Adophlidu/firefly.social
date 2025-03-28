import { EthereumChainId } from '@masknet/web3-shared-evm';

import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';

export const resolveRocketsFunChainId = createLookupTableResolver<string, EthereumChainId>(
    {
        bnb: EthereumChainId.BSC,
    },
    (chain) => {
        throw new Error(`Unknown rockets.fun chain: ${chain}`);
    },
);
