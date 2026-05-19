import { EMPTY_LIST } from '@dimensiondev/constants';
import { asyncIteratorToArray } from '@dimensiondev/utils';
import { pageableToIterator, type PageIndicator } from '@dimensiondev/utils';
import type { EthereumSchemaType } from '@dimensiondev/web3/enums';
import { useQuery } from '@tanstack/react-query';

import { getUserCollections } from '@/providers/firefly/nft/getUserCollections.js';

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
