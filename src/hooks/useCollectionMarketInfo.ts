import { useQuery } from '@tanstack/react-query';

import { SimpleHashProvider } from '@/providers/simplehash/index.js';

export function useCollectionMarketInfo(collectionId: string | undefined) {
    return useQuery({
        queryKey: ['collection', 'market-info', collectionId],
        queryFn: async () => {
            if (!collectionId) return null;
            return SimpleHashProvider.getCollectionMarketInfo(collectionId);
        },
    });
}
