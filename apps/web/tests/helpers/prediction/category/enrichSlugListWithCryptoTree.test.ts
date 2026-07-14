import { describe, expect, it } from 'vitest';

import { CRYPTO_QUICK_BUY_SLUG } from '@/helpers/prediction/category/cryptoCategoryConfig.js';
import { enrichSlugListWithCryptoTree } from '@/helpers/prediction/category/enrichSlugListWithCryptoTree.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

function slugItem(slug: string, sub_slug: PolymarketEventSlugListData[] = []): PolymarketEventSlugListData {
    return { slug, label: slug, sub_slug };
}

describe('enrichSlugListWithCryptoTree', () => {
    it('grafts the crypto tree onto the crypto node, leaving other primaries untouched', () => {
        const sports = slugItem('sports', [slugItem('nba')]);
        const crypto = slugItem('crypto');
        const result = enrichSlugListWithCryptoTree([sports, crypto]);

        expect(result).toHaveLength(2);
        // Non-crypto primaries returned by reference (unchanged).
        expect(result[0]).toBe(sports);
        // Crypto gets a synthetic sub_slug tree with quick-buy leading.
        expect(result[1]).not.toBe(crypto);
        expect(result[1].slug).toBe('crypto');
        expect(result[1].sub_slug[0].slug).toBe(CRYPTO_QUICK_BUY_SLUG);
        expect(result[1].sub_slug[0].sub_slug.map((p) => p.slug)).toEqual(['5m', '15m', '1h', '4h', 'daily']);
    });

    it('preserves the original crypto label', () => {
        const crypto = slugItem('crypto');
        crypto.label = 'Crypto';
        expect(enrichSlugListWithCryptoTree([crypto])[0].label).toBe('Crypto');
    });

    it('does not crash when crypto is absent', () => {
        const result = enrichSlugListWithCryptoTree([slugItem('sports')]);
        expect(result).toHaveLength(1);
        expect(result[0].slug).toBe('sports');
    });
});
