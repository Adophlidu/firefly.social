import { describe, expect, it } from 'vitest';

import { formatPerpsAccountBalance } from '@/components/Perps/formatPerpsAccountBalance.js';

describe('formatPerpsAccountBalance', () => {
    it('truncates balances to two decimal places', () => {
        expect(formatPerpsAccountBalance('8.849')).toBe('$8.84');
        expect(formatPerpsAccountBalance('1234567.899')).toBe('$1,234,567.89');
    });

    it('shows exactly two decimal places', () => {
        expect(formatPerpsAccountBalance('8')).toBe('$8.00');
    });

    it('handles an unavailable balance', () => {
        expect(formatPerpsAccountBalance()).toBe('$--');
    });
});
