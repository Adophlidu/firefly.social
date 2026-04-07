import { describe, expect, it } from 'vitest';

import { normalizeSwapToken } from '@/providers/swap/normalizeSwapToken.js';

describe('normalizeSwapToken', () => {
    it('normalizes polygon native token metadata to POL', () => {
        expect(
            normalizeSwapToken({
                address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                symbol: 'ETH',
                name: 'Ethereum',
                decimals: 18,
                chainId: 137,
            }),
        ).toMatchObject({
            address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            symbol: 'POL',
            name: 'POL',
            decimals: 18,
            chainId: 137,
        });
    });

    it('normalizes BNB chain native token metadata when the backend reports ETH', () => {
        expect(
            normalizeSwapToken({
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                name: 'ETH',
                decimals: 18,
                chainId: 56,
            }),
        ).toMatchObject({
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'BNB',
            name: 'BNB',
            decimals: 18,
            chainId: 56,
        });
    });

    it('leaves non-native tokens unchanged', () => {
        const token = {
            address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            chainId: 137,
        };

        expect(normalizeSwapToken(token)).toEqual(token);
    });
});
