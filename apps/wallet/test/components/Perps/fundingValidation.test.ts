import { describe, expect, it } from 'vitest';

import { validatePerpsFunding } from '@/components/Perps/validatePerpsFunding.js';

const validWithdrawal = {
    kind: 'withdraw' as const,
    amount: '10',
    minimumAmount: '5',
    availableBalance: '20',
    gasBalance: '1',
    requiredGas: '0.1',
};

describe('Perpetuals funding validation contract', () => {
    it('accepts a withdrawal when amount, balance, and gas satisfy the supplied limits', () => {
        expect(validatePerpsFunding(validWithdrawal)).toEqual({ ok: true }); // ASSERTION (frozen)
    });

    it.each([
        [{ amount: '4' }, 'below-minimum'],
        [{ amount: '21' }, 'insufficient-balance'],
        [{ gasBalance: '0.01' }, 'insufficient-gas'],
    ] as const)('returns a stable validation code for %j', (override, code) => {
        expect(validatePerpsFunding({ ...validWithdrawal, ...override })).toMatchObject({
            ok: false,
            issues: [{ code }],
        }); // ASSERTION (frozen)
    });
});
