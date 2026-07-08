import { describe, expect, it } from 'vitest';

import {
    isSportsEventScoreTied,
    sportsListHasTiedScore,
} from '@/helpers/prediction/category/sportsListHasTiedScore.js';
import type { PolymarketSportsEvent, PolymarketSportsListResponse } from '@/providers/types/Firefly.js';

function eventWithScore(home: number, away: number): PolymarketSportsEvent {
    return { score_show: [{ score: [home, away] }] } as PolymarketSportsEvent;
}

function baseResponse(overrides: Partial<PolymarketSportsListResponse> = {}): PolymarketSportsListResponse {
    return {
        timezone: 'UTC',
        live: [],
        today: [],
        tomorrow: [],
        afterTomorrow: [],
        closed: [],
        ...overrides,
    } as PolymarketSportsListResponse;
}

describe('isSportsEventScoreTied', () => {
    it('returns true when the latest score is level', () => {
        expect(isSportsEventScoreTied(eventWithScore(0, 0))).toBe(true);
        expect(isSportsEventScoreTied(eventWithScore(2, 2))).toBe(true);
    });

    it('returns false when one side leads', () => {
        expect(isSportsEventScoreTied(eventWithScore(1, 0))).toBe(false);
        expect(isSportsEventScoreTied(eventWithScore(3, 5))).toBe(false);
    });

    it('returns false when there is no usable score timeline (scheduled / not started)', () => {
        expect(isSportsEventScoreTied({} as PolymarketSportsEvent)).toBe(false);
        expect(isSportsEventScoreTied({ score_show: [] } as unknown as PolymarketSportsEvent)).toBe(false);
        expect(isSportsEventScoreTied({ score_show: [{}] } as unknown as PolymarketSportsEvent)).toBe(false);
        expect(isSportsEventScoreTied({ score_show: [{ score: [1] }] } as PolymarketSportsEvent)).toBe(false);
    });
});

describe('sportsListHasTiedScore', () => {
    it('returns false for undefined / all-decisive responses', () => {
        expect(sportsListHasTiedScore(undefined)).toBe(false);
        expect(sportsListHasTiedScore(baseResponse())).toBe(false);
        expect(
            sportsListHasTiedScore(baseResponse({ today: [eventWithScore(2, 0)], closed: [eventWithScore(1, 3)] })),
        ).toBe(false);
    });

    it('returns true when a finished draw sits in the closed bucket', () => {
        expect(sportsListHasTiedScore(baseResponse({ closed: [eventWithScore(1, 1)] }))).toBe(true);
    });

    it('returns true when a level match appears in any bucket', () => {
        expect(sportsListHasTiedScore(baseResponse({ live: [eventWithScore(0, 0)] }))).toBe(true);
        expect(sportsListHasTiedScore(baseResponse({ tomorrow: [eventWithScore(2, 2)] }))).toBe(true);
    });

    it('checks the optional afterThreeDays bucket', () => {
        expect(sportsListHasTiedScore(baseResponse({ afterThreeDays: [eventWithScore(0, 0)] }))).toBe(true);
    });
});
