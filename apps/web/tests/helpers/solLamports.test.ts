import { formatLamportsToSol, parseSolToLamports } from '@dimensiondev/web3/utils';
import { describe, expect, it } from 'vitest';

/** Semantics locked against the original `web3.LAMPORTS_PER_SOL` (1e9) based implementation. */
describe('parseSolToLamports', () => {
    it('converts whole and fractional SOL amounts', () => {
        expect(parseSolToLamports(1)).toBe(1_000_000_000n);
        expect(parseSolToLamports(0.5)).toBe(500_000_000n);
        expect(parseSolToLamports(2.123456789)).toBe(2_123_456_789n);
        expect(parseSolToLamports(0)).toBe(0n);
    });

    it('accepts string input', () => {
        expect(parseSolToLamports('0.000000001')).toBe(1n);
        expect(parseSolToLamports('1.5')).toBe(1_500_000_000n);
    });

    it('rounds half up on sub-lamport precision', () => {
        expect(parseSolToLamports('0.0000000015')).toBe(2n);
        expect(parseSolToLamports('0.0000000014')).toBe(1n);
    });
});

describe('formatLamportsToSol', () => {
    it('formats lamports with the default 9-digit precision', () => {
        expect(formatLamportsToSol(1_000_000_000)).toBe('1.000000000');
        expect(formatLamportsToSol(1_234_567_890)).toBe('1.234567890');
        expect(formatLamportsToSol(1)).toBe('0.000000001');
        expect(formatLamportsToSol(0)).toBe('0.000000000');
    });

    it('accepts string input and a custom precision', () => {
        expect(formatLamportsToSol('500000000')).toBe('0.500000000');
        expect(formatLamportsToSol(1_235_000_000, 2)).toBe('1.24');
        expect(formatLamportsToSol(1_234_000_000, 2)).toBe('1.23');
    });
});
