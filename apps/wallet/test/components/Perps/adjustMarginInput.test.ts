import { describe, expect, it } from 'vitest';

import { getAdjustMarginInputState, getMaxRemovableMargin } from '@/components/Perps/adjustMarginInput.js';

const base = {
    withdrawable: '20',
    currentMargin: '100.02',
    positionValue: '500',
    leverage: 10,
    canRemove: true,
};

describe('adjust margin input', () => {
    it('calculates an added margin total', () => {
        expect(getAdjustMarginInputState({ ...base, amount: '10.19', mode: 'add' })).toMatchObject({
            error: undefined,
            isValid: true,
            newTotal: '110.21',
            submitAmount: '10.19',
        });
    });

    it('uses the stricter of selected leverage and the 10% transfer floor when removing', () => {
        expect(getMaxRemovableMargin(base).toFixed()).toBe('50.02');
        expect(getMaxRemovableMargin({ ...base, leverage: 20 }).toFixed()).toBe('50.02');
        expect(getMaxRemovableMargin({ ...base, leverage: 5 }).toFixed()).toBe('0.02');
    });

    it('subtracts a valid removal from the current margin', () => {
        expect(getAdjustMarginInputState({ ...base, amount: '25', mode: 'remove' })).toMatchObject({
            error: undefined,
            isValid: true,
            newTotal: '75.02',
            submitAmount: '25.00',
        });
    });

    it('blocks removal for strict-isolated markets', () => {
        expect(getAdjustMarginInputState({ ...base, amount: '1', mode: 'remove', canRemove: false })).toMatchObject({
            error: 'remove-disabled',
            isValid: false,
        });
    });

    it('blocks values below the minimum or above the available balance', () => {
        expect(getAdjustMarginInputState({ ...base, amount: '0.001', mode: 'add' })).toMatchObject({
            error: 'below-minimum',
            isValid: false,
        });
        expect(getAdjustMarginInputState({ ...base, amount: '20.01', mode: 'add' })).toMatchObject({
            error: 'exceeds-available',
            isValid: false,
        });
        expect(getAdjustMarginInputState({ ...base, amount: '50.03', mode: 'remove' })).toMatchObject({
            error: 'exceeds-available',
            isValid: false,
        });
    });
});
