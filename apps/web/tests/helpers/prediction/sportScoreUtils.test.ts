import { describe, expect, it } from 'vitest';

import { getLoser, getPenaltyShootoutLoser, isPenaltyPeriod } from '@/helpers/prediction/sportScoreUtils.js';

describe('isPenaltyPeriod', () => {
    it('matches explicit penalty / shootout labels regardless of case', () => {
        expect(isPenaltyPeriod('Penalty Shootout')).toBe(true);
        expect(isPenaltyPeriod('PENALTY')).toBe(true);
        expect(isPenaltyPeriod('penalty')).toBe(true);
        expect(isPenaltyPeriod('Shootout')).toBe(true);
        expect(isPenaltyPeriod('Second half - penalty')).toBe(true);
    });

    it('is false for ordinary period / clock labels', () => {
        expect(isPenaltyPeriod('2nd Half')).toBe(false);
        expect(isPenaltyPeriod('Q4 - 3:20')).toBe(false);
        expect(isPenaltyPeriod('Final')).toBe(false);
        expect(isPenaltyPeriod('Live')).toBe(false);
    });

    it('is false for undefined and empty strings', () => {
        expect(isPenaltyPeriod(undefined)).toBe(false);
        expect(isPenaltyPeriod('')).toBe(false);
    });
});

describe('getPenaltyShootoutLoser', () => {
    it('returns undefined when there is no shootout', () => {
        expect(getPenaltyShootoutLoser(undefined)).toBeUndefined();
    });

    it('mutes the side that scored fewer kicks (1 = scored)', () => {
        // NLD vs MAR: home scored 2, away scored 3 → home (NLD) lost.
        expect(
            getPenaltyShootoutLoser({
                home: [1, 2, 1, 2, 2],
                away: [2, 1, 1, 2, 1],
            }),
        ).toBe('home');
    });

    it('handles >5 kicks per side (6-each shootout decided in sudden death)', () => {
        expect(
            getPenaltyShootoutLoser({
                home: [1, 1, 1, 1, 1, 2],
                away: [1, 1, 1, 1, 1, 1],
            }),
        ).toBe('home');
    });

    it('returns undefined when both sides scored equally (not yet decided)', () => {
        expect(getPenaltyShootoutLoser({ home: [1, 1], away: [1, 1] })).toBeUndefined();
    });
});

describe('getLoser', () => {
    const drawnScores = [{ score: [1, 1] }];

    it('prefers an explicit non-draw winResult over scores/penalties', () => {
        expect(getLoser(0, [{ score: [1, 2] }], { home: [1], away: [1, 1] })).toBe('away');
        expect(getLoser(2, [{ score: [2, 1] }], { home: [1, 1], away: [1] })).toBe('home');
    });

    it('falls back to penalty kicks when winResult is a draw (1)', () => {
        expect(getLoser(1, drawnScores, { home: [1, 2, 1, 2, 2], away: [2, 1, 1, 2, 1] })).toBe('home');
    });

    it('falls back to penalty kicks when regulation scores are tied and winResult is unset', () => {
        expect(getLoser(undefined, drawnScores, { home: [1, 1], away: [1, 1, 1] })).toBe('home');
    });

    it('mutes nobody for a drawn league match with no shootout', () => {
        expect(getLoser(1, drawnScores, undefined)).toBeUndefined();
        expect(getLoser(undefined, drawnScores, undefined)).toBeUndefined();
    });
});
