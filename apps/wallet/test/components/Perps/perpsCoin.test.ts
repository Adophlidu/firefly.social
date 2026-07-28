import { describe, expect, it } from 'vitest';

import { toPerpsCoinDisplayName, toPerpsMarketDisplayName, toRawPerpsCoin } from '@/components/Perps/perpsCoin.js';

describe('perps coin presentation', () => {
    it('keeps the DEX prefix in raw names and hides it in display names', () => {
        expect(toRawPerpsCoin('xyz:SNDK-USDC')).toBe('xyz:SNDK');
        expect(toPerpsCoinDisplayName('xyz:SNDK-USDC')).toBe('SNDK');
        expect(toPerpsMarketDisplayName('xyz:SNDK')).toBe('SNDK-USDC');
        expect(toPerpsMarketDisplayName('BTC-USDC')).toBe('BTC-USDC');
    });
});
