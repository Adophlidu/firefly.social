import { describe, expect, it } from 'vitest';

import { MIN_FIREFLY_WALLET_BALANCE_USD, shouldRouteToCryptoDeposit } from '@/hooks/bet/useOpenBetDeposit.js';

describe('shouldRouteToCryptoDeposit', () => {
    it('routes to crypto deposit when the balance is below the threshold', () => {
        expect(shouldRouteToCryptoDeposit('0.05')).toBe(true);
        expect(shouldRouteToCryptoDeposit('0')).toBe(true);
    });

    it('routes to crypto deposit when the balance is not yet loaded', () => {
        expect(shouldRouteToCryptoDeposit(undefined)).toBe(true);
    });

    it('does not route to crypto deposit at or above the threshold', () => {
        expect(shouldRouteToCryptoDeposit('0.1')).toBe(false);
        expect(shouldRouteToCryptoDeposit('100')).toBe(false);
    });

    it('treats the threshold as the exclusive lower bound', () => {
        expect(MIN_FIREFLY_WALLET_BALANCE_USD).toBe(0.1);
        // exactly at the threshold is NOT less-than, so it stays on the swap flow
        expect(shouldRouteToCryptoDeposit(String(MIN_FIREFLY_WALLET_BALANCE_USD))).toBe(false);
    });
});
