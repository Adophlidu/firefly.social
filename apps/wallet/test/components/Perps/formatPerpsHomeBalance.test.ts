import { describe, expect, it } from 'vitest';

import { formatPerpsHomeBalance } from '@/components/Perps/formatPerpsHomeBalance.js';

describe('formatPerpsHomeBalance', () => {
    it('shows exactly $0 for an unopened Perps account', () => {
        expect(formatPerpsHomeBalance({ accountOpened: false })).toBe('$0'); // ASSERTION (frozen)
    });

    it('adds thousands separators and truncates rather than rounds to two decimals', () => {
        expect(formatPerpsHomeBalance({ accountOpened: true, availableBalance: '1234567.899' })).toBe('$1,234,567.89'); // ASSERTION (frozen)
        expect(formatPerpsHomeBalance({ accountOpened: true, availableBalance: '0.009' })).toBe('$0.00'); // ASSERTION (frozen)
        expect(formatPerpsHomeBalance({ accountOpened: true, availableBalance: '12' })).toBe('$12.00'); // ASSERTION (frozen)
    });
});
