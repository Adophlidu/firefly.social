import { describe, expect, it } from 'vitest';

import { CryptoPriceVariant } from '@/providers/prediction/polymarket/constants.js';
import {
    classifyPolymarketCryptoSlug,
    getCryptoPriceVariantFromEvent,
    getCryptoUpDownIntervalFromEvent,
    getPolymarketEventSlug,
    getPredictionRecurrenceFromPolymarketEvent,
    type PolymarketEventLike,
    resolveCryptoUpDownFromEvent,
} from '@/providers/prediction/polymarket/resolveCryptoUpDownFromEvent.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';
import { PredictionRecurrence } from '@/types/prediction.js';

describe('resolveCryptoUpDownFromEvent', () => {
    it('detects 5m from event slug', () => {
        const event = { slug: 'btc-updown-5m-1716123456', markets: [] };
        expect(getCryptoUpDownIntervalFromEvent(event)).toBe('5m');
        expect(getCryptoPriceVariantFromEvent(event)).toBe(CryptoPriceVariant.FiveMinutes);

        const result = resolveCryptoUpDownFromEvent(event);
        expect(result).toEqual({
            kind: 'crypto-up-down-short',
            interval: '5m',
            recurrence: PredictionRecurrence.FiveMinutes,
            variant: CryptoPriceVariant.FiveMinutes,
            windowStartUnix: 1_716_123_456,
            slug: 'btc-updown-5m-1716123456',
        });
    });

    it('detects 15m with up-or-down variant', () => {
        const event = { slug: 'bitcoin-up-or-down-15m-1716123400', markets: [] };
        expect(getCryptoUpDownIntervalFromEvent(event)).toBe('15m');

        const result = resolveCryptoUpDownFromEvent(event);
        expect(result.kind).toBe('crypto-up-down-short');
        if (result.kind === 'crypto-up-down-short') {
            expect(result.interval).toBe('15m');
            expect(result.variant).toBe(CryptoPriceVariant.Fifteen);
        }
    });

    it('detects 4h before other patterns', () => {
        const event = { slug: 'eth-updown-4h-1716100000', markets: [] };
        expect(getCryptoUpDownIntervalFromEvent(event)).toBe('4h');
        expect(getCryptoPriceVariantFromEvent(event)).toBe(CryptoPriceVariant.FourHour);
    });

    it('falls back to market slug when event slug is empty', () => {
        const event = {
            slug: '',
            markets: [{ slug: 'sol-up-or-down-5m-1700000000' }],
        } as PolymarketEventLike;
        expect(getPolymarketEventSlug(event)).toBe('sol-up-or-down-5m-1700000000');
        expect(getCryptoUpDownIntervalFromEvent(event)).toBe('5m');
    });

    it('classifies multistrike-4h separately from updown-4h', () => {
        expect(classifyPolymarketCryptoSlug('btc-multistrike-4h').kind).toBe('multistrike-4h');
        expect(classifyPolymarketCryptoSlug('btc-updown-4h-1716100000').kind).toBe('crypto-up-down-short');
    });

    it('classifies hourly and daily up-down', () => {
        expect(classifyPolymarketCryptoSlug('bitcoin-up-or-down-january-15-2025-3pm-et').kind).toBe('hourly-up-down');
        expect(classifyPolymarketCryptoSlug('btc-up-or-down-on-january-15-2025').kind).toBe('daily-up-down');
    });

    it('returns null interval for non-short markets', () => {
        expect(getCryptoUpDownIntervalFromEvent({ slug: 'presidential-election-winner-2028', markets: [] })).toBeNull();
        expect(getCryptoUpDownIntervalFromEvent({ slug: 'btc-multistrike-4h', markets: [] })).toBeNull();
    });

    it('is case-insensitive on slug', () => {
        expect(getCryptoUpDownIntervalFromEvent({ slug: 'BTC-UPDOWN-5M-1716123456', markets: [] })).toBe('5m');
    });
});

function createMinimalEvent(overrides: Partial<PolymarketEvent>): PolymarketEvent {
    return {
        id: '1',
        slug: '',
        title: '',
        description: '',
        startDate: '',
        creationDate: '',
        endDate: '',
        image: '',
        icon: '',
        active: true,
        closed: false,
        archived: false,
        new: false,
        liquidity: '0',
        volume: '0',
        openInterest: '0',
        createdAt: '',
        updatedAt: '',
        negRisk: false,
        sortBy: '',
        markets: [],
        series: [],
        tags: [],
        ...overrides,
    };
}

describe('getPredictionRecurrenceFromPolymarketEvent', () => {
    it('returns recurrence for short-interval slugs', () => {
        expect(
            getPredictionRecurrenceFromPolymarketEvent(createMinimalEvent({ slug: 'btc-updown-5m-1716123456' })),
        ).toBe(PredictionRecurrence.FiveMinutes);

        expect(
            getPredictionRecurrenceFromPolymarketEvent(
                createMinimalEvent({ slug: 'bitcoin-up-or-down-15m-1716123400' }),
            ),
        ).toBe(PredictionRecurrence.FifteenMinutes);

        expect(
            getPredictionRecurrenceFromPolymarketEvent(createMinimalEvent({ slug: 'eth-updown-4h-1716100000' })),
        ).toBe(PredictionRecurrence.FourHours);
    });

    it('returns Daily for daily up-down slug', () => {
        expect(
            getPredictionRecurrenceFromPolymarketEvent(
                createMinimalEvent({ slug: 'btc-up-or-down-on-january-15-2025' }),
            ),
        ).toBe(PredictionRecurrence.Daily);
    });

    it('returns FourHours for multistrike-4h slug', () => {
        expect(getPredictionRecurrenceFromPolymarketEvent(createMinimalEvent({ slug: 'btc-multistrike-4h' }))).toBe(
            PredictionRecurrence.FourHours,
        );
    });

    it('falls back to series recurrence when slug is not recognized', () => {
        expect(
            getPredictionRecurrenceFromPolymarketEvent(
                createMinimalEvent({
                    slug: 'some-custom-event',
                    series: [
                        {
                            id: 's1',
                            slug: 'series',
                            title: '',
                            seriesType: '',
                            recurrence: PredictionRecurrence.FifteenMinutes,
                            image: '',
                            icon: '',
                            active: true,
                            closed: false,
                            archived: false,
                            new: false,
                            publishedAt: '',
                            createdAt: '',
                            updatedAt: '',
                            volume: '0',
                            liquidity: '0',
                            startDate: '',
                        },
                    ],
                }),
            ),
        ).toBe(PredictionRecurrence.FifteenMinutes);
    });

    it('returns Hour for hourly up-down slug', () => {
        expect(
            getPredictionRecurrenceFromPolymarketEvent(
                createMinimalEvent({ slug: 'bitcoin-up-or-down-january-15-2025-3pm-et' }),
            ),
        ).toBe(PredictionRecurrence.Hour);
    });

    it('returns undefined for unrelated events', () => {
        expect(
            getPredictionRecurrenceFromPolymarketEvent(
                createMinimalEvent({ slug: 'presidential-election-winner-2028' }),
            ),
        ).toBeUndefined();
    });
});
