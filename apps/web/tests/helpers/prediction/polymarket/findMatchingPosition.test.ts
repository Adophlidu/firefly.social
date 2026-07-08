import { describe, expect, it } from 'vitest';

import { findMatchingPosition } from '@/helpers/prediction/polymarket/findMatchingPosition.js';
import type { PredictionPositionDataForUI } from '@/types/prediction.js';

function position(overrides: Partial<PredictionPositionDataForUI>): PredictionPositionDataForUI {
    return {
        Id: 'id',
        IsClaim: false,
        avg_price: 0.5,
        closed_time: null,
        conditionId: '0xabc',
        cur_price: 0.6,
        current_value: 60,
        event_slugs: ['evt'],
        image: '',
        is_closed: false,
        isClaimable: false,
        isWin: true,
        marketSlug: 'mkt',
        outcomeIndex: 0,
        pnl: 10,
        pnl_rate: 0.2,
        shares: 100,
        title: 'Market',
        total_buy: 100,
        vote_status: 'Yes',
        ...overrides,
    } as PredictionPositionDataForUI;
}

describe('findMatchingPosition', () => {
    it('matches by conditionId and outcomeIndex', () => {
        const positions = [
            position({ conditionId: '0xabc', outcomeIndex: 0 }),
            position({ conditionId: '0xabc', outcomeIndex: 1 }),
        ];
        expect(findMatchingPosition(positions, '0xabc', 1)?.outcomeIndex).toBe(1);
    });

    it('compares conditionId case-insensitively', () => {
        const positions = [position({ conditionId: '0xABC', outcomeIndex: 0 })];
        expect(findMatchingPosition(positions, '0xabc', 0)).not.toBeNull();
    });

    it('does not match when only conditionId matches but outcome differs', () => {
        const positions = [position({ conditionId: '0xabc', outcomeIndex: 0 })];
        expect(findMatchingPosition(positions, '0xabc', 1)).toBeNull();
    });

    it('returns null when nothing matches', () => {
        const positions = [position({ conditionId: '0xdef', outcomeIndex: 0 })];
        expect(findMatchingPosition(positions, '0xabc', 0)).toBeNull();
    });

    it('returns null for an empty conditionId', () => {
        const positions = [position({ conditionId: '0xabc', outcomeIndex: 0 })];
        expect(findMatchingPosition(positions, '', 0)).toBeNull();
    });

    it('returns null for an empty list', () => {
        expect(findMatchingPosition([], '0xabc', 0)).toBeNull();
    });
});
