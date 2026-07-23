import { describe, expect, it } from 'vitest';

import { getPerpsAccountTab } from '@/components/Perps/perpsAccountTab.js';

describe('getPerpsAccountTab', () => {
    it('opens order cancellation intents on Open Orders', () => {
        expect(getPerpsAccountTab({ kind: 'cancel-all' })).toBe('orders');
        expect(getPerpsAccountTab({ kind: 'cancel-order', coin: 'BTC-USDC', orderId: '1' })).toBe('orders');
        expect(
            getPerpsAccountTab({
                kind: 'modify-order',
                coin: 'BTC-USDC',
                orderId: '1',
                field: 'size',
                value: '0.1',
            }),
        ).toBe('orders');
    });

    it('opens close-all on Positions', () => {
        expect(getPerpsAccountTab({ kind: 'close-all' })).toBe('positions');
    });
});
