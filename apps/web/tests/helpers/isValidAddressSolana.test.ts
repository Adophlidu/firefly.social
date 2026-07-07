import { isValidAddress, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { describe, expect, it } from 'vitest';

/**
 * Semantics locked against the original `new web3.PublicKey(address)` (@coral-xyz/anchor)
 * implementation: base58 decode (Bitcoin alphabet) must yield exactly 32 bytes.
 */
describe('isValidAddressSolana', () => {
    it('accepts valid mainnet addresses', () => {
        // random wallet-style address
        expect(isValidAddressSolana('4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T')).toBe(true);
        // USDC mint
        expect(isValidAddressSolana('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
        // wrapped SOL (leading zero bytes -> leading "1"s handling)
        expect(isValidAddressSolana('So11111111111111111111111111111111111111112')).toBe(true);
        // system program: 32 chars of "1" -> 32 zero bytes
        expect(isValidAddressSolana('1'.repeat(32))).toBe(true);
    });

    it('accepts a 43-char string that decodes to exactly 32 bytes', () => {
        expect(isValidAddressSolana('z'.repeat(43))).toBe(true);
    });

    it('rejects strings that decode to 31 or 33 bytes in strict mode', () => {
        // 31 chars of "1" -> 31 bytes, also fails the < 32 length pre-check
        expect(isValidAddressSolana('1'.repeat(31))).toBe(false);
        expect(isValidAddressSolana('1'.repeat(31), false)).toBe(false);
        // 33 chars of "1" -> 33 bytes
        expect(isValidAddressSolana('1'.repeat(33))).toBe(false);
        // 44 chars of "z" -> 33 bytes
        expect(isValidAddressSolana('z'.repeat(44))).toBe(false);
    });

    it('falls back to a loose charset check in non-strict mode when decode fails', () => {
        // decodes to 33 bytes, but matches /^[1-9a-zA-Z]+$/
        expect(isValidAddressSolana('1'.repeat(33), false)).toBe(true);
        expect(isValidAddressSolana('z'.repeat(44), false)).toBe(true);
        // all-lowercase (broken) address
        expect(isValidAddressSolana('4nd1mbqtrmjvyvfkf2pjy9nzuzdtasp7d4xwls4gdb4t')).toBe(false);
        expect(isValidAddressSolana('4nd1mbqtrmjvyvfkf2pjy9nzuzdtasp7d4xwls4gdb4t', false)).toBe(true);
        // "O", "I" and "l" are not base58 but pass the loose regex
        expect(isValidAddressSolana('O'.repeat(35))).toBe(false);
        expect(isValidAddressSolana('O'.repeat(35), false)).toBe(true);
        expect(isValidAddressSolana('Il'.repeat(17))).toBe(false);
        expect(isValidAddressSolana('Il'.repeat(17), false)).toBe(true);
        // "0" is rejected by both strict and loose checks
        expect(isValidAddressSolana('0'.repeat(35))).toBe(false);
        expect(isValidAddressSolana('0'.repeat(35), false)).toBe(false);
    });

    it('rejects empty and nullish input', () => {
        expect(isValidAddressSolana('')).toBe(false);
        expect(isValidAddressSolana('', false)).toBe(false);
        expect(isValidAddressSolana(null)).toBe(false);
        expect(isValidAddressSolana(undefined)).toBe(false);
    });

    it('rejects strings outside the 32-44 char window before decoding', () => {
        expect(isValidAddressSolana('abc')).toBe(false);
        expect(isValidAddressSolana('abc', false)).toBe(false);
        expect(isValidAddressSolana('z'.repeat(45))).toBe(false);
        expect(isValidAddressSolana('z'.repeat(45), false)).toBe(false);
    });

    it('rejects ethereum hex addresses', () => {
        expect(isValidAddressSolana('0x8ba1f109551bD432803012645Ac136ddd64DBA72')).toBe(false);
        expect(isValidAddressSolana('0x8ba1f109551bD432803012645Ac136ddd64DBA72', false)).toBe(false);
    });

    it('rejects strings with whitespace or other non-base58 characters', () => {
        expect(isValidAddressSolana(' 4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T'.trimEnd())).toBe(false);
        expect(isValidAddressSolana('4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4+')).toBe(false);
    });

    it('keeps the multi-chain isValidAddress entry point working', () => {
        expect(isValidAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
        expect(isValidAddress('0x8ba1f109551bD432803012645Ac136ddd64DBA72')).toBe(true);
        expect(isValidAddress('TKttnV3FSY1iEoAwB4N52WK2DxdV94KpSd')).toBe(true);
        expect(isValidAddress('not-an-address')).toBe(false);
    });
});
