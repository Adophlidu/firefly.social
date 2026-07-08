import { describe, expect, it } from 'vitest';

import type { PolymarketShareImagePayload } from '@/hooks/prediction/usePolymarketShareImageActions.js';
import { resolvePolymarketShareParams } from '@/hooks/prediction/usePolymarketShareImageActions.js';

function timelinePayload(overrides: Partial<PolymarketShareImagePayload> = {}): PolymarketShareImagePayload {
    return {
        link: 'https://firefly.social/polymarket/event/x',
        params: {
            type: 'position',
            variant: 'timeline',
            title: 'Market',
            outcome: 'Yes',
            status: 'active',
            pnlRate: 10,
            totalCost: 100,
            avgPrice: 0.5,
            currentPnl: 10,
            identity: { displayName: '0x1234...abcd' },
        },
        ...overrides,
    };
}

describe('resolvePolymarketShareParams', () => {
    it('folds authoritative overrides (identity + PnL) over the computed timeline params', async () => {
        const payload = timelinePayload({
            resolveOverrides: async () => ({
                identity: { displayName: 'alice', avatarUrl: 'https://a/avatar.png' },
                status: 'won',
                pnlRate: 42,
                totalCost: 200,
                avgPrice: 0.6,
                currentPnl: 84,
            }),
        });

        const params = await resolvePolymarketShareParams(payload);
        expect(params.type).toBe('position');
        if (params.type !== 'position') return;
        expect(params.identity.displayName).toBe('alice');
        expect(params.pnlRate).toBe(42);
        expect(params.currentPnl).toBe(84);
        // untouched fields survive the merge
        expect(params.variant).toBe('timeline');
        expect(params.title).toBe('Market');
    });

    it('keeps the computed params when the override resolver throws', async () => {
        const payload = timelinePayload({
            resolveOverrides: async () => {
                throw new Error('network');
            },
        });

        const params = await resolvePolymarketShareParams(payload);
        if (params.type !== 'position') throw new Error('expected position');
        expect(params.identity.displayName).toBe('0x1234...abcd');
        expect(params.pnlRate).toBe(10);
    });

    it('returns the params unchanged when no resolver is attached', async () => {
        const params = await resolvePolymarketShareParams(timelinePayload());
        if (params.type !== 'position') throw new Error('expected position');
        expect(params.identity.displayName).toBe('0x1234...abcd');
        expect(params.pnlRate).toBe(10);
    });

    it('folds in the sports matchup when resolveSport resolves', async () => {
        const payload = timelinePayload({
            resolveSport: async () => ({
                home: { name: 'Home' },
                away: { name: 'Away' },
                predicted: { kind: 'team', team: { name: 'Home' } },
            }),
        });

        const params = await resolvePolymarketShareParams(payload);
        if (params.type !== 'position') throw new Error('expected position');
        expect(params.sport?.home.name).toBe('Home');
    });
});
