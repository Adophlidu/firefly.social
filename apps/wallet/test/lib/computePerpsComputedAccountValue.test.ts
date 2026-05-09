import { describe, expect, it } from 'vitest';

import { computePerpsComputedAccountValue } from '@/lib/hyperliquid/computePerpsComputedAccountValue';

describe('computePerpsComputedAccountValue', () => {
    const spotMeta: [unknown, Array<{ coin: string; midPx?: string; markPx?: string }>] = [
        {},
        [{ coin: 'USDC', midPx: '1', markPx: '1' }],
    ];

    it('DEFAULT / unknown abstraction keeps clearinghouse values and marks derived loading', () => {
        const result = computePerpsComputedAccountValue({
            abstractionRaw: 'default',
            clearinghouse: { marginSummary: { accountValue: '100' }, withdrawable: '50' },
            spotClearinghouse: { balances: [] },
            spotMetaAndAssetCtxs: spotMeta,
        });
        expect(result.accountValue).toBe('100');
        expect(result.withdrawable).toBe('50');
        expect(result.isLoading).toBe(true);
    });

    it('UNIFIED_ACCOUNT uses spot USD total and USDC withdrawable (token 0)', () => {
        const result = computePerpsComputedAccountValue({
            abstractionRaw: 'unifiedAccount',
            clearinghouse: { marginSummary: { accountValue: '1' }, withdrawable: '1' },
            spotClearinghouse: {
                balances: [
                    { coin: 'USDC', token: 0, total: '200', hold: '40' },
                    { coin: 'FOO', token: 1, total: '2', hold: '0' },
                ],
            },
            spotMetaAndAssetCtxs: [
                {},
                [
                    { coin: 'USDC', midPx: '1' },
                    { coin: 'FOO', midPx: '10' },
                ],
            ],
        });
        expect(result.accountValue).toBe('220');
        expect(result.withdrawable).toBe('160');
        expect(result.isLoading).toBe(false);
    });

    it('DISABLED adds perps account value and spot USD total', () => {
        const result = computePerpsComputedAccountValue({
            abstractionRaw: 'disabled',
            clearinghouse: { marginSummary: { accountValue: '30' }, withdrawable: '10' },
            spotClearinghouse: {
                balances: [{ coin: 'USDC', token: 0, total: '70', hold: '0' }],
            },
            spotMetaAndAssetCtxs: spotMeta,
        });
        expect(result.accountValue).toBe('100');
        expect(result.withdrawable).toBe('10');
        expect(result.isLoading).toBe(false);
    });

    it('UNIFIED_ACCOUNT stays loading until spot total is available', () => {
        const result = computePerpsComputedAccountValue({
            abstractionRaw: 'unifiedAccount',
            clearinghouse: { marginSummary: { accountValue: '1' }, withdrawable: '1' },
            spotClearinghouse: { balances: [] },
            spotMetaAndAssetCtxs: spotMeta,
        });
        expect(result.accountValue).toBeUndefined();
        expect(result.withdrawable).toBeUndefined();
        expect(result.isLoading).toBe(true);
    });
});
