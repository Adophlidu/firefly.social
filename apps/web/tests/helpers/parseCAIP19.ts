import { parseCAIP19 } from '@dimensiondev/web3/utils';
import { describe, expect, it, test } from 'vitest';

// Skip tests for unsupported networks.
describe('parseCAIP19', () => {
    test('should parse valid asset type format (2 parts)', () => {
        const result = parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
        expect(result).toEqual({
            chainNamespace: 'eip155',
            chainReference: '1',
            namespace: 'erc20',
            reference: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        });
    });

    test('should parse valid asset ID format (3 parts)', () => {
        const result = parseCAIP19('eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/771769');
        expect(result).toEqual({
            chainNamespace: 'eip155',
            chainReference: '1',
            namespace: 'erc721',
            reference: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
            tokenId: '771769',
        });
    });

    test('should parse native token format without colon separator and set zero address for eip155', () => {
        const result = parseCAIP19('eip155:8453/native');
        expect(result).toEqual({
            chainNamespace: 'eip155',
            chainReference: '8453',
            namespace: 'native',
            reference: '0x0000000000000000000000000000000000000000',
        });
    });

    it.skip('should parse Bitcoin asset format', () => {
        const result = parseCAIP19('bip122:000000000019d6689c085ae165831e93/slip44:0');
        expect(result).toEqual({
            chainNamespace: 'bip122',
            chainReference: '000000000019d6689c085ae165831e93',
            namespace: 'slip44',
            reference: '0',
        });
    });

    test('should parse Solana native asset format', () => {
        const result = parseCAIP19('solana:mainnet/slip44:501');
        expect(result).toEqual({
            chainNamespace: 'solana',
            chainReference: 'mainnet',
            namespace: 'slip44',
            reference: '501',
        });
    });

    it.skip('should parse Hedera token format', () => {
        const result = parseCAIP19('hedera:mainnet/token:0.0.720');
        expect(result).toEqual({
            chainNamespace: 'hedera',
            chainReference: 'mainnet',
            namespace: 'token',
            reference: '0.0.720',
        });
    });

    it.skip('should parse Hedera NFT format', () => {
        const result = parseCAIP19('hedera:mainnet/nft:0.0.55492/12');
        expect(result).toEqual({
            chainNamespace: 'hedera',
            chainReference: 'mainnet',
            namespace: 'nft',
            reference: '0.0.55492',
            tokenId: '12',
        });
    });

    test('should handle lowercase and uppercase references', () => {
        const result = parseCAIP19('eip155:1/erc20:0xabc123ABC456');
        expect(result).toEqual({
            chainNamespace: 'eip155',
            chainReference: '1',
            namespace: 'erc20',
            reference: '0xabc123ABC456',
        });
    });

    test('should throw error for empty string', () => {
        expect(() => parseCAIP19('')).toThrow('Invalid assetId: must be a non-empty string');
    });

    test('should throw error for non-string input', () => {
        expect(() => parseCAIP19(null as any)).toThrow('Invalid assetId: must be a non-empty string');
        expect(() => parseCAIP19(undefined as any)).toThrow('Invalid assetId: must be a non-empty string');
        expect(() => parseCAIP19(123 as any)).toThrow('Invalid assetId: must be a non-empty string');
    });

    test('should throw error for invalid format - single part', () => {
        expect(() => parseCAIP19('eip155:1')).toThrow('Invalid CAIP-19 format: must have 2 or 3 parts separated by /');
    });

    test('should throw error for invalid format - too many parts', () => {
        expect(() => parseCAIP19('eip155:1/erc20:0x123/extra/part')).toThrow(
            'Invalid CAIP-19 format: must have 2 or 3 parts separated by /',
        );
    });

    test('should throw error for missing chain namespace', () => {
        expect(() => parseCAIP19(':1/erc20:0x123')).toThrow(
            'Invalid chainId format: namespace and reference are required',
        );
    });

    test('should throw error for missing chain reference', () => {
        expect(() => parseCAIP19('eip155:/erc20:0x123')).toThrow(
            'Invalid chainId format: namespace and reference are required',
        );
    });

    test('should handle complex asset references with special characters', () => {
        const result = parseCAIP19('eip155:137/erc20:0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');
        expect(result).toEqual({
            chainNamespace: 'eip155',
            chainReference: '137',
            namespace: 'erc20',
            reference: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        });
    });

    test('should handle numeric token IDs', () => {
        const result = parseCAIP19('eip155:1/erc1155:0x495f947276749Ce646f68AC8c248420045cb7b5e/123456789');
        expect(result).toEqual({
            chainNamespace: 'eip155',
            chainReference: '1',
            namespace: 'erc1155',
            reference: '0x495f947276749Ce646f68AC8c248420045cb7b5e',
            tokenId: '123456789',
        });
    });

    test('should handle native token with token ID (edge case)', () => {
        const result = parseCAIP19('eip155:8453/native/123');
        expect(result).toEqual({
            chainNamespace: 'eip155',
            chainReference: '8453',
            namespace: 'native',
            reference: '0x0000000000000000000000000000000000000000',
            tokenId: '123',
        });
    });

    test('should not set zero address for native tokens on non-eip155 chains', () => {
        const result = parseCAIP19('solana:mainnet/native');
        expect(result).toEqual({
            chainNamespace: 'solana',
            chainReference: 'mainnet',
            namespace: 'native',
            reference: 'So11111111111111111111111111111111111111112',
        });
    });
});
