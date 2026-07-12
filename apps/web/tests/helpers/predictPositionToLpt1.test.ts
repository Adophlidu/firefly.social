import { describe, expect, test } from 'vitest';

import { buildLpt1PositionAttributes, readLpt1Position } from '@/helpers/lpt1.js';
import { mapPositionToLpt1Input, pickLargestPosition } from '@/helpers/prediction/predictPositionToLpt1.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

function makePosition(overrides: Partial<PredictionPositionDataForUI> = {}): PredictionPositionDataForUI {
    return {
        vote_status: 'ENG',
        event_slugs: [],
        marketSlug: 'eng-to-advance',
        Id: '0xcondition-eng',
        shares: 100,
        avg_price: 0.5,
        cur_price: 0.6,
        pnl: 10,
        pnl_rate: 0.2,
        total_buy: 50,
        IsClaim: false,
        is_closed: false,
        conditionId: '0xcondition-eng',
        ...overrides,
    };
}

describe('pickLargestPosition', () => {
    test('returns null for an empty list', () => {
        expect(pickLargestPosition([])).toBe(null);
    });

    test('returns the single eligible position', () => {
        const position = makePosition();
        expect(pickLargestPosition([position])).toBe(position);
    });

    test('picks the max by current_value', () => {
        const small = makePosition({ conditionId: 'a', current_value: 10 });
        const large = makePosition({ conditionId: 'b', current_value: 100 });
        expect(pickLargestPosition([small, large])).toBe(large);
    });

    test('falls back to shares × cur_price when current_value is missing', () => {
        // No current_value on either: size = shares × cur_price.
        // a: 100 × 0.6 = 60; b: 200 × 0.2 = 40 → a wins despite fewer shares.
        const a = makePosition({ conditionId: 'a', shares: 100, cur_price: 0.6 });
        const b = makePosition({ conditionId: 'b', shares: 200, cur_price: 0.2 });
        expect(pickLargestPosition([b, a])).toBe(a);
    });

    test('drops positions with shares < 0.01 (dust)', () => {
        const dust = makePosition({ conditionId: 'dust', shares: 0.001, current_value: 9999 });
        const real = makePosition({ conditionId: 'real', shares: 1, current_value: 1 });
        expect(pickLargestPosition([dust, real])).toBe(real);
    });

    test('returns null when every position is dust (< 0.01 shares)', () => {
        const dust = makePosition({ shares: 0.001, current_value: 9999 });
        expect(pickLargestPosition([dust])).toBe(null);
    });

    test('first wins on ties', () => {
        const firstPos = makePosition({ conditionId: 'first', current_value: 50 });
        const secondPos = makePosition({ conditionId: 'second', current_value: 50 });
        expect(pickLargestPosition([firstPos, secondPos])).toBe(firstPos);
    });
});

describe('mapPositionToLpt1Input', () => {
    test('maps all fields, defaulting outcomeIndex to 0', () => {
        const position = makePosition({
            conditionId: '0xcond',
            vote_status: 'ENG',
            shares: 100,
            avg_price: 0.5,
        });
        expect(mapPositionToLpt1Input(position)).toEqual({
            conditionId: '0xcond',
            outcome: 'ENG',
            outcomeIndex: 0,
            shares: 100,
            price: 0.5,
        });
    });

    test('preserves outcomeIndex when present', () => {
        const position = makePosition({ outcomeIndex: 1 });
        expect(mapPositionToLpt1Input(position).outcomeIndex).toBe(1);
    });

    test('leaves marketId undefined', () => {
        expect(mapPositionToLpt1Input(makePosition()).marketId).toBeUndefined();
    });

    test('uses vote_status as the outcome label, including team codes', () => {
        expect(mapPositionToLpt1Input(makePosition({ vote_status: 'ENG' })).outcome).toBe('ENG');
        expect(mapPositionToLpt1Input(makePosition({ vote_status: 'Over' })).outcome).toBe('Over');
    });

    test('round-trips through buildLpt1PositionAttributes → readLpt1Position', () => {
        const position = makePosition({ avg_price: 0.37, shares: 250, outcomeIndex: 1 });
        const input = mapPositionToLpt1Input(position);
        const recovered = readLpt1Position(buildLpt1PositionAttributes(input));
        expect(recovered).not.toBeNull();
        expect(recovered?.price).toBe(input.price);
        expect(recovered?.shares).toBe(input.shares);
        expect(recovered?.outcomeIndex).toBe(input.outcomeIndex);
        expect(recovered?.outcome).toBe(input.outcome);
        expect(recovered?.conditionId).toBe(input.conditionId);
    });
});
