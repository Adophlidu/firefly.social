import { describe, expect, it } from 'vitest';

import {
    buildPolymarketEventShareUrl,
    buildPolymarketProfileShareUrl,
    getPositionShareImagePayload,
    getWinningsShareImagePayload,
} from '@/helpers/polymarketShareImage.js';
import type { PolymarketPosition } from '@/providers/types/Firefly.js';

function createPosition(overrides: Partial<PolymarketPosition> = {}): PolymarketPosition {
    return {
        is_closed: false,
        negRisk: false,
        isClaimable: false,
        isWin: false,
        event_slugs: ['will-x-happen'],
        cur_price: 0.6,
        title: 'Will X happen?',
        image: '',
        offset: 0,
        closed_time: 0,
        conditionId: '0x1',
        vote_status: 'Yes',
        resolvedResult: '',
        umaResolutionStatus: 'proposed',
        umaResolutionStatuses: [],
        wallet: '0x1234567890abcdef1234567890abcdef12345678',
        tokenId: '1',
        Id: '1',
        shares: 100,
        total_buy: 100,
        avg_price: 0.5,
        notfill_pnl: 0,
        fill_pnl: 0,
        pnl: 10,
        pnl_rate: 0.2,
        marketSlug: 'will-x-happen-market',
        ...overrides,
    };
}

describe('share links', () => {
    it('builds the event and profile links', () => {
        expect(buildPolymarketEventShareUrl('slug-a')).toBe('https://firefly.social/polymarket/event/slug-a');
        expect(buildPolymarketProfileShareUrl('0xabc')).toBe('https://firefly.social/polymarket/profile/0xabc');
    });
});

describe('getPositionShareImagePayload', () => {
    it('maps an active position (pnl_rate fraction -> percent)', () => {
        const payload = getPositionShareImagePayload(createPosition(), { displayName: 'tester' });
        expect(payload?.params.type).toBe('position');
        if (payload?.params.type !== 'position') return;
        expect(payload.params.status).toBe('active');
        expect(payload.params.pnlRate).toBe(20);
        expect(payload.params.totalCost).toBe(50);
    });

    it('maps a closed lost position with the pnl-based rate', () => {
        const payload = getPositionShareImagePayload(
            createPosition({ is_closed: true, pnl: -50, total_buy: 100, avg_price: 0.5 }),
            { displayName: 'tester' },
        );
        if (payload?.params.type !== 'position') throw new Error('expected position params');
        expect(payload.params.status).toBe('lost');
        expect(payload.params.pnlRate).toBe(-100);
    });

    it('returns null without an event slug', () => {
        expect(
            getPositionShareImagePayload(createPosition({ event_slugs: [], marketSlug: '' }), {
                displayName: 'tester',
            }),
        ).toBeNull();
    });
});

describe('getWinningsShareImagePayload', () => {
    it('renders a single winning as a closed position payload (AC-5)', () => {
        const payload = getWinningsShareImagePayload([createPosition({ pnl: 50 })], 50, '0xabc', {
            displayName: 'tester',
        });
        expect(payload?.params.type).toBe('position');
    });

    it('maps multiple winnings with the profile link', () => {
        const payload = getWinningsShareImagePayload(
            [createPosition({ pnl: 50 }), createPosition({ pnl: 30, title: 'Another market' })],
            80,
            '0xabc',
            { displayName: 'tester' },
        );
        if (payload?.params.type !== 'winnings') throw new Error('expected winnings params');
        expect(payload.params.items).toHaveLength(2);
        expect(payload.link).toBe('https://firefly.social/polymarket/profile/0xabc');
        // resolved winning shares pay out $1 each
        expect(payload.params.items[0].won).toBe(100);
        expect(payload.params.items[0].cost).toBe(50);
    });
});
