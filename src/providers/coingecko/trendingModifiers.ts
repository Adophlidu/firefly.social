import { produce } from 'immer';

import type { Trending } from '@/providers/types/Trending.js';

/**
 * @internal
 * some custom modifiers
 */
export function trendingModifiers(trending: Trending) {
    if (trending.coin.id === 'avalanche-2') {
        return produce(trending, (draft) => {
            draft.contracts = [
                { address: '0x1ce0c2827e2ef14d5c4f29a091d735a204794041', chainId: 56, runtime: 'ethereum' },
                { address: '0x4792c1ecb969b036eb51330c63bd27899a13d84e', chainId: 1284, runtime: 'ethereum' },
            ];
        });
    } else if (trending.coin.id === 'mask-network') {
        return produce(trending, (draft) => {
            draft.contracts = draft.contracts?.filter((x) => x.runtime !== 'energi') ?? [];
        });
    }
    return trending;
}
