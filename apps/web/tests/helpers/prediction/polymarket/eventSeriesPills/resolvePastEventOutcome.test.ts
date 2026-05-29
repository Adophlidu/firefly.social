import { describe, expect, it } from 'vitest';

import {
    resolveOutcomeFromUiEvent,
    resolvePastEventOutcome,
} from '@/helpers/prediction/polymarket/eventSeriesPills/toSeriesEventForPills.js';
import type { PastOutcome } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

function makeEvent(overrides: {
    slug: string;
    resolvedLabel?: string;
    resolvedOutcomeId?: string;
}): BetsEventDataForUI {
    const outcomeId = overrides.resolvedOutcomeId ?? 'o1';
    return {
        id: overrides.slug,
        slug: overrides.slug,
        platform: 'polymarket',
        markets: [
            {
                id: 'm1',
                resolvedOutcomeId: overrides.resolvedLabel ? outcomeId : undefined,
                outcomes: [
                    { id: 'o1', label: overrides.resolvedLabel ?? 'Up', price: '0.5' },
                    { id: 'o2', label: 'Down', price: '0.5' },
                ],
            },
        ],
    } as BetsEventDataForUI;
}

describe('resolvePastEventOutcome', () => {
    it('prefers outcomesBySlug over UI market', () => {
        const event = makeEvent({ slug: 'btc-updown-1', resolvedLabel: 'Down' });
        const map = new Map<string, PastOutcome>([['btc-updown-1', 'up']]);

        expect(resolvePastEventOutcome(event, map)).toBe('up');
        expect(resolveOutcomeFromUiEvent(event)).toBe('down');
    });

    it('maps Yes to up and No to down from UI', () => {
        const map = new Map<string, PastOutcome>();

        expect(resolvePastEventOutcome(makeEvent({ slug: 'a', resolvedLabel: 'Yes' }), map)).toBe('up');
        expect(resolvePastEventOutcome(makeEvent({ slug: 'b', resolvedLabel: 'No' }), map)).toBe('down');
    });

    it('returns null when unresolved', () => {
        const event = makeEvent({ slug: 'btc-updown-2' });
        expect(resolvePastEventOutcome(event, new Map())).toBeNull();
    });
});
