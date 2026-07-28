import { describe, expect, it } from 'vitest';

import { getPerpsDexes } from '@/components/Perps/getPerpsDexes.js';

describe('getPerpsDexes', () => {
    it('includes the default and discovered HIP-3 DEXes once', () => {
        expect(
            getPerpsDexes([
                { universe: [{ name: 'BTC' }, { name: 'ETH' }] },
                { universe: [{ name: 'xyz:XYZ100' }, { name: 'xyz:XYZ200' }] },
                { universe: [{ name: 'flx:FLX' }] },
            ]),
        ).toEqual(['', 'xyz', 'flx']);
    });
});
