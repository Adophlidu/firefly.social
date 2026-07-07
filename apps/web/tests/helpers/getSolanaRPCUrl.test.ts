import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';
import { describe, expect, it } from 'vitest';

/**
 * Semantics locked against the original `web3.clusterApiUrl('mainnet-beta')` fallback,
 * which returns the URL WITH a trailing slash.
 */
describe('getSolanaRPCUrl', () => {
    it('falls back to the mainnet-beta cluster URL (trailing slash preserved)', () => {
        expect(getSolanaRPCUrl()).toBe('https://api.mainnet-beta.solana.com/');
        expect(getSolanaRPCUrl({})).toBe('https://api.mainnet-beta.solana.com/');
        expect(getSolanaRPCUrl({ httpUrl: null })).toBe('https://api.mainnet-beta.solana.com/');
        expect(getSolanaRPCUrl({ httpUrl: '' })).toBe('https://api.mainnet-beta.solana.com/');
    });

    it('prefers the provided http url', () => {
        expect(getSolanaRPCUrl({ httpUrl: 'https://rpc.example.com' })).toBe('https://rpc.example.com');
    });

    it('returns the dev cluster url when useDevCluster is set', () => {
        expect(getSolanaRPCUrl({ useDevCluster: true, devHttpUrl: 'https://dev.example.com' })).toBe(
            'https://dev.example.com',
        );
        expect(getSolanaRPCUrl({ httpUrl: 'https://rpc.example.com', useDevCluster: true })).toBe(
            'https://chaotic-solemn-sound.solana-devnet.quiknode.pro/4fc40f8f7d6d57cdc6735ea81a39e07f1fdafc2e',
        );
    });
});
