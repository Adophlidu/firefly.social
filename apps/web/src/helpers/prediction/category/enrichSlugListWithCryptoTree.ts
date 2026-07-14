import { CRYPTO_PRIMARY_SLUG } from '@/helpers/prediction/category/constants.js';
import { buildCryptoSlugTree } from '@/helpers/prediction/category/cryptoCategoryConfig.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

/**
 * Graft the frontend-defined Crypto tab tree onto the backend `crypto` node (whose `sub_slug` is
 * empty), returning a new list. Called in both the SSR data resolver and the client `context`
 * `useMemo` so server and client agree on the same tree — without it, `crypto/quick-buy/1h` etc.
 * would 404 because the backend never advertises those slugs.
 *
 * Non-crypto primaries are returned by reference (unchanged).
 */
export function enrichSlugListWithCryptoTree(slugList: PolymarketEventSlugListData[]): PolymarketEventSlugListData[] {
    return slugList.map((item) =>
        item.slug === CRYPTO_PRIMARY_SLUG ? { ...item, sub_slug: buildCryptoSlugTree() } : item,
    );
}
