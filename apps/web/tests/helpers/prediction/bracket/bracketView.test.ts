import { describe, expect, it } from 'vitest';

import { resolveRoundWindow, ROUND_SEQUENCE } from '@/helpers/prediction/category/bracket/bracketView.js';

describe('resolveRoundWindow', () => {
    it('pairs each column with the column it feeds into', () => {
        expect(resolveRoundWindow('r32')).toEqual({ left: 'r32', right: 'r16' });
        expect(resolveRoundWindow('sf')).toEqual({ left: 'sf', right: 'final' });
    });

    it('clamps the final and champion to show final -> champion', () => {
        expect(resolveRoundWindow('final')).toEqual({ left: 'final', right: 'champion' });
        expect(resolveRoundWindow('champion')).toEqual({ left: 'final', right: 'champion' });
    });

    it('exposes the canonical sequence including the champion column', () => {
        expect(ROUND_SEQUENCE).toEqual(['r32', 'r16', 'qf', 'sf', 'final', 'champion']);
    });
});
