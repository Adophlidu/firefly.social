import { isSameSolanaAddress } from '@dimensiondev/web3/utils';
import { describe, expect, it } from 'vitest';

const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const WSOL = 'So11111111111111111111111111111111111111112';

/**
 * Semantics locked against the original
 * `new web3.PublicKey(a).equals(new web3.PublicKey(b))` (@coral-xyz/anchor) implementation.
 */
describe('isSameSolanaAddress', () => {
    it('matches identical valid addresses in strict mode', () => {
        expect(isSameSolanaAddress(USDC, USDC)).toBe(true);
        expect(isSameSolanaAddress(WSOL, WSOL)).toBe(true);
        expect(isSameSolanaAddress('1'.repeat(32), '1'.repeat(32))).toBe(true);
    });

    it('rejects different valid addresses', () => {
        expect(isSameSolanaAddress(USDC, WSOL)).toBe(false);
        expect(isSameSolanaAddress(USDC, WSOL, false)).toBe(false);
    });

    it('returns false when either side is invalid in strict mode', () => {
        expect(isSameSolanaAddress(USDC, USDC.toLowerCase())).toBe(false);
        expect(isSameSolanaAddress(USDC.toLowerCase(), USDC.toLowerCase())).toBe(false);
        expect(isSameSolanaAddress('z'.repeat(44), 'z'.repeat(44))).toBe(false);
        expect(isSameSolanaAddress(USDC, 'not-an-address')).toBe(false);
    });

    it('compares case-insensitively in non-strict mode', () => {
        expect(isSameSolanaAddress(USDC, USDC.toLowerCase(), false)).toBe(true);
        // both sides pass the loose charset check and match after lower-casing
        expect(isSameSolanaAddress(USDC.toLowerCase(), USDC.toUpperCase(), false)).toBe(true);
        expect(isSameSolanaAddress(USDC.toLowerCase(), USDC.toLowerCase(), false)).toBe(true);
    });

    it('returns false for nullish or empty input', () => {
        expect(isSameSolanaAddress(null, USDC)).toBe(false);
        expect(isSameSolanaAddress(USDC, undefined)).toBe(false);
        expect(isSameSolanaAddress('', '')).toBe(false);
        expect(isSameSolanaAddress(null, null, false)).toBe(false);
    });
});
