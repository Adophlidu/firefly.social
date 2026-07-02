import { multipliedBy } from '@dimensiondev/web3/numbers';
import { describe, expect, it } from 'vitest';

import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount';
import { formatTokenUSD } from '@/helpers/formatTokenUSD';

/**
 * FW-7840: the transfer "Transaction completed!" screen (SuccessView) previously
 * rendered the sent amount with `formatPrice` and the USD value with a raw
 * `multipliedBy(price, amount).toFormat()` — the latter had no decimal cap, so a
 * long/precise amount produced a very long string that overflowed the card.
 *
 * The row now uses the canonical, decimal-capped helpers. These cases document
 * the pathological inputs and assert the rendered strings stay bounded.
 */
describe('SuccessView amount formatting (FW-7840)', () => {
    const cases = [
        { symbol: 'ETH', amount: '1.5', price: '3200' },
        { symbol: 'MEME', amount: '1234567890.123456789', price: '0.0000000234' },
        { symbol: 'WBTC', amount: '0.00000012345', price: '68000' },
        { symbol: 'USDC', amount: '987654321.987654', price: '1.0001' },
    ];

    it('caps token amount and USD value length (no unbounded decimals)', () => {
        for (const { amount, price } of cases) {
            const amountText = formatTokenItemAmount(amount);
            const usdText = formatTokenUSD(multipliedBy(price, amount).toString());

            // Token amount: at most 8 fractional digits (ROUND_DOWN, trailing zeros stripped).
            const amountFraction = amountText.split('.')[1] ?? '';
            expect(amountFraction.length).toBeLessThanOrEqual(8);

            // USD value: at most 4 fractional digits.
            const usdFraction = usdText.replace('$', '').split('.')[1] ?? '';
            expect(usdFraction.length).toBeLessThanOrEqual(4);
        }
    });

    it('never emits the unbounded raw toFormat() USD string', () => {
        // Before the fix this produced "28.888488632028..." (13+ fractional digits).
        const raw = multipliedBy('0.0000000234', '1234567890.123456789').toFormat();
        expect((raw.split('.')[1] ?? '').length).toBeGreaterThan(6);

        const fixed = formatTokenUSD(multipliedBy('0.0000000234', '1234567890.123456789').toString());
        expect((fixed.replace('$', '').split('.')[1] ?? '').length).toBeLessThanOrEqual(4);
    });
});
