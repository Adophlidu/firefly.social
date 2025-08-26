import { useQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/index.js';
import { asyncIteratorToArray } from '@/helpers/asyncIteratorToArray.js';
import { pageableToIterator, type PageIndicator } from '@/helpers/pageable.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { EthereumSchemaType } from '@/web3-shared/evm/types.js';

interface Options {
    account: string | undefined;
    chainId?: number;
    schemaType?: EthereumSchemaType;
}
export function useNFTCollections({ account, chainId, schemaType }: Options) {
    return useQuery({
        queryKey: ['nft-collections', account, chainId, schemaType],
        queryFn: () => {
            if (!account || !chainId) return EMPTY_LIST;
            return asyncIteratorToArray(
                pageableToIterator(async (indicator?: PageIndicator) => {
                    return FireflyEndpointProvider.getUserCollections(chainId, account, indicator);
                }),
            );
        },
    });
}
