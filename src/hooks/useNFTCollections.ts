import { asyncIteratorToArray } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/index.js';
import { pageableToIterator, type PageIndicator } from '@/helpers/pageable.js';
import { getUserCollections } from '@/providers/firefly/nft/getUserCollections.js';
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
                    return getUserCollections(chainId, account, indicator);
                }),
            );
        },
    });
}
