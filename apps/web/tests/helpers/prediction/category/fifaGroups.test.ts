import { describe, expect, it } from 'vitest';

import { formatFifaAdvancePercent } from '@/helpers/prediction/category/fifaGroups.js';

describe('formatFifaAdvancePercent', () => {
    it('formats percent values from percent or ratio inputs', () => {
        expect(formatFifaAdvancePercent({ advance_probability_percent: 56.5 })).toBe('56.5%');
        expect(formatFifaAdvancePercent({ advance_probability: 0.565 })).toBe('56.5%');
        expect(formatFifaAdvancePercent({ advance_probability: 56 })).toBe('56%');
    });

    it('returns a dash when probability is missing or invalid', () => {
        expect(formatFifaAdvancePercent({})).toBe('—');
        expect(formatFifaAdvancePercent({ advance_probability_percent: Number.NaN })).toBe('—');
    });
});
