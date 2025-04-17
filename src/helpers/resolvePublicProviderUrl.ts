import { first } from 'lodash-es';
import { polygon } from 'viem/chains';

import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { getRPCConstant } from '#masknet/web3-shared-evm';

const resolve = createLookupTableResolver<number, string>(
    {
        [polygon.id]: 'https://polygon-rpc.com',
    },
    '',
);

export function resolvePublicProviderUrl(chainId: number) {
    return resolve(chainId) || first(getRPCConstant(chainId, 'RPC_URLS'));
}
