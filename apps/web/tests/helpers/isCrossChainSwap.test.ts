import { describe, expect, test } from 'vitest';

import { isCrossChainSwap } from '@/helpers/isCrossChainSwap.js';

describe('isCrossChainSwap', () => {
    test('returns false when not flagged cross-chain', () => {
        expect(
            isCrossChainSwap({
                is_cross_chain: false,
                chain_id: 4663,
                to_chain_id: 42161,
            }),
        ).toBe(false);
    });

    test('returns false when flagged but to_chain_id is missing (the reported 4663 bug)', () => {
        expect(
            isCrossChainSwap({
                is_cross_chain: true,
                chain_id: 4663,
            }),
        ).toBe(false);
    });

    test('returns false when flagged but to_chain_id is 0', () => {
        expect(
            isCrossChainSwap({
                is_cross_chain: true,
                chain_id: 4663,
                to_chain_id: 0,
            }),
        ).toBe(false);
    });

    test('returns false when to_chain_id equals chain_id', () => {
        expect(
            isCrossChainSwap({
                is_cross_chain: true,
                chain_id: 4663,
                to_chain_id: 4663,
            }),
        ).toBe(false);
    });

    test('returns true when to_chain_id differs from chain_id', () => {
        expect(
            isCrossChainSwap({
                is_cross_chain: true,
                chain_id: 1,
                to_chain_id: 42161,
            }),
        ).toBe(true);
    });
});
