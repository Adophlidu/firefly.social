import { Locale } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import {
    buildCryptoQuickBuyPeriodItems,
    buildCryptoSlugTree,
    CRYPTO_DEFAULT_PERIOD_SLUG,
    CRYPTO_QUICK_BUY_PERIODS,
    CRYPTO_QUICK_BUY_SLUG,
    CRYPTO_SECONDARY_CATEGORIES,
    getCryptoDefaultPeriod,
    getCryptoDefaultPeriodItem,
    getCryptoPeriod,
    getCryptoSecondaryCategory,
    resolveCryptoCategoryTitle,
} from '@/helpers/prediction/category/cryptoCategoryConfig.js';

describe('cryptoCategoryConfig', () => {
    describe('CRYPTO_SECONDARY_CATEGORIES', () => {
        it('lists Quick Buy first, then the 9 topic categories in nav order', () => {
            const slugs = CRYPTO_SECONDARY_CATEGORIES.map((item) => item.slug);
            expect(slugs).toEqual([
                'quick-buy',
                'all',
                'weekly',
                'monthly',
                'yearly',
                'targets',
                'pre-market',
                'institutions',
                'industry',
                'protocol-metrics',
            ]);
        });

        it('only quick-buy and all have a null tag slug (special-cased fetches)', () => {
            for (const item of CRYPTO_SECONDARY_CATEGORIES) {
                if (item.slug === 'quick-buy' || item.slug === 'all') {
                    expect(item.tagSlug).toBeNull();
                } else {
                    expect(typeof item.tagSlug).toBe('string');
                }
            }
        });
    });

    describe('CRYPTO_QUICK_BUY_PERIODS', () => {
        it('lists the 5 periods with default 1h in the middle', () => {
            expect(CRYPTO_QUICK_BUY_PERIODS.map((p) => p.slug)).toEqual(['5m', '15m', '1h', '4h', 'daily']);
            expect(CRYPTO_DEFAULT_PERIOD_SLUG).toBe('1h');
        });

        it('maps 1h to the confirmed hourly tag', () => {
            expect(getCryptoPeriod('1h')?.tagSlug).toBe('hourly');
            expect(getCryptoPeriod('5m')?.tagSlug).toBe('5m');
            expect(getCryptoPeriod('daily')?.tagSlug).toBe('daily');
        });
    });

    describe('getCryptoSecondaryCategory', () => {
        it('resolves a known secondary', () => {
            expect(getCryptoSecondaryCategory('weekly')?.label).toBe('Weekly');
        });

        it('returns undefined for an unknown secondary', () => {
            expect(getCryptoSecondaryCategory('nope')).toBeUndefined();
        });
    });

    describe('getCryptoPeriod', () => {
        it('returns undefined for an unknown period', () => {
            expect(getCryptoPeriod('99h')).toBeUndefined();
        });
    });

    describe('getCryptoDefaultPeriod(Item)', () => {
        it('returns the 1h period', () => {
            expect(getCryptoDefaultPeriod().slug).toBe('1h');
            expect(getCryptoDefaultPeriodItem().slug).toBe('1h');
        });
    });

    describe('buildCryptoSlugTree', () => {
        it('quick-buy leads and carries the 5 period children; every other secondary is a leaf', () => {
            const tree = buildCryptoSlugTree();
            expect(tree[0].slug).toBe(CRYPTO_QUICK_BUY_SLUG);
            expect(tree[0].sub_slug.map((p) => p.slug)).toEqual(['5m', '15m', '1h', '4h', 'daily']);

            for (const item of tree.slice(1)) {
                expect(item.sub_slug).toEqual([]);
            }
        });

        it('mirrors CRYPTO_SECONDARY_CATEGORIES order', () => {
            expect(buildCryptoSlugTree().map((item) => item.slug)).toEqual(
                CRYPTO_SECONDARY_CATEGORIES.map((item) => item.slug),
            );
        });
    });

    describe('buildCryptoQuickBuyPeriodItems', () => {
        it('returns slug-tree nodes for each period', () => {
            const items = buildCryptoQuickBuyPeriodItems();
            expect(items).toHaveLength(5);
            expect(items.map((item) => item.slug)).toEqual(['5m', '15m', '1h', '4h', 'daily']);
        });
    });

    describe('resolveCryptoCategoryTitle', () => {
        it('appends " Crypto" to the four period roll-ups (English)', () => {
            expect(resolveCryptoCategoryTitle(Locale.en, 'All', 'all')).toBe('All Crypto');
            expect(resolveCryptoCategoryTitle(Locale.en, 'Weekly', 'weekly')).toBe('Weekly Crypto');
            expect(resolveCryptoCategoryTitle(Locale.en, 'Monthly', 'monthly')).toBe('Monthly Crypto');
            expect(resolveCryptoCategoryTitle(Locale.en, 'Yearly', 'yearly')).toBe('Yearly Crypto');
        });

        it('returns the translated tab label for every other secondary', () => {
            expect(resolveCryptoCategoryTitle(Locale.en, 'Quick Buy', 'quick-buy')).toBe('Quick Buy');
            expect(resolveCryptoCategoryTitle(Locale.en, 'Targets', 'targets')).toBe('Targets');
            expect(resolveCryptoCategoryTitle(Locale.en, 'Pre-Market', 'pre-market')).toBe('Pre-Market');
            expect(resolveCryptoCategoryTitle(Locale.en, 'Protocol Metrics', 'protocol-metrics')).toBe(
                'Protocol Metrics',
            );
        });

        it('looks up the compound translation per locale for the period roll-ups', () => {
            expect(resolveCryptoCategoryTitle(Locale.zhHans, 'All', 'all')).toBe('全部加密货币');
            expect(resolveCryptoCategoryTitle(Locale.zhHans, 'Weekly', 'weekly')).toBe('每周加密货币');
            expect(resolveCryptoCategoryTitle(Locale.ja, 'Monthly', 'monthly')).toBe('月次の暗号資産');
            expect(resolveCryptoCategoryTitle(Locale.es, 'Yearly', 'yearly')).toBe('Cripto Anual');
        });

        it('matches the secondary-nav chip text for non-roll-up tabs', () => {
            // zh-Hans "Targets" chip and title must read identically.
            expect(resolveCryptoCategoryTitle(Locale.zhHans, 'Targets', 'targets')).toBe('目标价格');
        });

        it('falls back to the English compound for an unmapped locale', () => {
            expect(resolveCryptoCategoryTitle('fr', 'All', 'all')).toBe('All Crypto');
        });
    });
});
