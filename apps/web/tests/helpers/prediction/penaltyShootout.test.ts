import { describe, expect, it } from 'vitest';

import {
    buildPenaltyDots,
    getPenaltyDotVariant,
    getPenaltyScore,
    sanitizePenaltyKicks,
} from '@/helpers/prediction/penaltyShootout.js';

describe('getPenaltyDotVariant', () => {
    it('maps each outcome to its dot variant', () => {
        expect(getPenaltyDotVariant(0)).toBe('pending');
        expect(getPenaltyDotVariant(1)).toBe('scored');
        expect(getPenaltyDotVariant(2)).toBe('missed');
    });
});

describe('sanitizePenaltyKicks', () => {
    it('passes valid 0/1/2 kicks through untouched', () => {
        expect(sanitizePenaltyKicks([0, 1, 2, 1])).toEqual([0, 1, 2, 1]);
    });

    it('coerces out-of-range values to 0 (pending) so bad payloads never break rendering', () => {
        expect(sanitizePenaltyKicks([3, 9, -1])).toEqual([0, 0, 0]);
        expect(sanitizePenaltyKicks([1, 7, 2])).toEqual([1, 0, 2]);
    });

    it('returns an empty array for empty / undefined / null input', () => {
        expect(sanitizePenaltyKicks(undefined)).toEqual([]);
        expect(sanitizePenaltyKicks(null)).toEqual([]);
        expect(sanitizePenaltyKicks([])).toEqual([]);
    });
});

describe('buildPenaltyDots', () => {
    it('returns null when there are no kicks, so the UI renders nothing', () => {
        expect(buildPenaltyDots(undefined)).toBeNull();
        expect(buildPenaltyDots(null)).toBeNull();
        expect(buildPenaltyDots([])).toBeNull();
    });

    it('maps each kick to a descriptor with a stable index key', () => {
        expect(buildPenaltyDots([1, 2, 0])).toEqual([
            { key: 0, variant: 'scored' },
            { key: 1, variant: 'missed' },
            { key: 2, variant: 'pending' },
        ]);
    });

    it('grows beyond five kicks (no 5-cap)', () => {
        const seven = buildPenaltyDots([1, 1, 1, 1, 1, 1, 1]);
        expect(seven).toHaveLength(7);
        expect(seven?.[6]).toEqual({ key: 6, variant: 'scored' });
    });
});

describe('getPenaltyScore', () => {
    it('counts only scored kicks (1), ignoring missed (2) and pending (0)', () => {
        // NLD vs MAR shootout: home scored 2 (kicks 1, 3), away scored 3 (kicks 2, 3, 5).
        expect(getPenaltyScore([1, 2, 1, 2, 2])).toBe(2);
        expect(getPenaltyScore([2, 1, 1, 2, 1])).toBe(3);
    });

    it('counts every kick as scored in a perfect 5-for-5', () => {
        expect(getPenaltyScore([1, 1, 1, 1, 1])).toBe(5);
    });

    it('returns 0 when no kicks were scored (all missed/pending)', () => {
        expect(getPenaltyScore([2, 2, 0])).toBe(0);
    });

    it('returns 0 for empty / undefined / null so the UI renders no superscript', () => {
        expect(getPenaltyScore(undefined)).toBe(0);
        expect(getPenaltyScore(null)).toBe(0);
        expect(getPenaltyScore([])).toBe(0);
    });
});
