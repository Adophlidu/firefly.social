import { isTrackedChain, robinhood } from '@dimensiondev/web3/chains';
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';
import { describe, expect, it } from 'vitest';

describe('isTrackedChain', () => {
    it('returns true for all tracked EVM chains', () => {
        expect(isTrackedChain(mainnet.id)).toBe(true);
        expect(isTrackedChain(base.id)).toBe(true);
        expect(isTrackedChain(polygon.id)).toBe(true);
        expect(isTrackedChain(bsc.id)).toBe(true);
        expect(isTrackedChain(arbitrum.id)).toBe(true);
        expect(isTrackedChain(optimism.id)).toBe(true);
        expect(isTrackedChain(robinhood.id)).toBe(true);
    });

    it('returns true for Solana (chain id 101)', () => {
        expect(isTrackedChain(101)).toBe(true);
    });

    it('returns false for untracked chains', () => {
        expect(isTrackedChain(999)).toBe(false);
        expect(isTrackedChain(0)).toBe(false);
    });

    it('returns false for null and undefined', () => {
        expect(isTrackedChain(null)).toBe(false);
        expect(isTrackedChain(undefined)).toBe(false);
    });
});
