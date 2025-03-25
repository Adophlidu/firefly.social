import { useQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/index.js';
import { asyncIteratorToArray } from '@/helpers/asyncIteratorToArray.js';
import { pageableToIterator, type PageIndicator } from '@/helpers/pageable.js';
import type { SchemaType } from '@/mask_pkgs/web3-shared/evm/index.js';
import { SimpleHashProvider } from '@/providers/simplehash/index.js';

interface Options {
    account: string | undefined;
    chainId?: number;
    schemaType?: SchemaType;
}
export function useNFTCollections({ account: account, chainId, schemaType }: Options) {
    return useQuery({
        queryKey: ['nft-collections', account, chainId, schemaType],
        queryFn: () => {
            if (!account) return EMPTY_LIST;
            return asyncIteratorToArray(
                pageableToIterator(async (indicator?: PageIndicator) => {
                    return SimpleHashProvider.getCollectionsByOwner({
                        account,
                        chainId,
                        indicator,
                        schemaType,
                    });
                }),
            );
        },
    });
}
