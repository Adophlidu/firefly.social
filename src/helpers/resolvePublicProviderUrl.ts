import { first } from 'lodash-es';
import { monadTestnet, polygon } from 'viem/chains';

import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { getRPCConstant } from '@/web3-shared/evm/constants.js';

const resolve = createLookupTableResolver<number, string | null>(
    {
        [polygon.id]: 'https://polygon-rpc.com',
        [monadTestnet.id]: 'https://testnet-rpc.monad.xyz/',
    },
    null,
);

export function resolvePublicProviderUrl(chainId: number) {
    return resolve(chainId) || first(getRPCConstant(chainId, 'RPC_URLS'));
}
