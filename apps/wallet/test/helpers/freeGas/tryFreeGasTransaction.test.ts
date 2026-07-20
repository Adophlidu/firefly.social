import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tryFreeGasTransaction } from '@/helpers/freeGas/tryFreeGasTransaction.js';
import { FreeGasTxType } from '@/providers/types/FreeGas.js';

// The mock factory for the endpoint needs the same fn reference the tests drive,
// so create it in a hoisted scope that runs before vi.mock factories execute.
const { submitFreeGasTransaction } = vi.hoisted(() => ({
    submitFreeGasTransaction: vi.fn(),
}));

vi.mock('@/store/fireflyEndpoint.js', () => ({
    getFireflyEndpoint: () => ({ submitFreeGasTransaction }),
}));

// Bypass the pin-code workflow entirely; pass a fake code hash straight through.
vi.mock('@/helpers/withPinCodeCheck.js', () => ({
    withPinCodeCheck: <T>(callback: (pinCodeHash?: string) => Promise<T>) => callback('mock-pin'),
}));

vi.mock('@dimensiondev/web3/chains', () => ({
    isFreeGasSupportedChain: () => true,
}));

vi.mock('@dimensiondev/web3/utils', () => ({
    isSupportedStablecoin: () => true,
    resolvePublicRpcUrl: () => 'http://localhost:8545',
}));

vi.mock('@dimensiondev/web3/actions', () => ({
    createWagmiPublicClient: () => ({
        getTransactionCount: vi.fn().mockResolvedValue(0),
        estimateGas: vi.fn().mockResolvedValue(21000n),
        estimateFeesPerGas: vi.fn().mockResolvedValue({
            maxFeePerGas: 1_000_000_000n,
            maxPriorityFeePerGas: 1_000_000_000n,
        }),
        getGasPrice: vi.fn().mockResolvedValue(1_000_000_000n),
    }),
}));

const params = {
    chainId: 1,
    txType: FreeGasTxType.TokenTransfer,
    from: '0x0000000000000000000000000000000000000001',
    to: '0x0000000000000000000000000000000000000002',
    data: '0x',
    value: '0',
    tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
} as const;

describe('tryFreeGasTransaction', () => {
    beforeEach(() => {
        submitFreeGasTransaction.mockReset();
    });

    // FW-7393: the backend returns HTTP 200 with { canFreeGas: true, hash: '', failedReason }
    // on a free-gas timeout. This must surface as a rejection so callers can clear their
    // pending/loading state instead of hanging forever.
    it('rejects when the backend reports a timeout via failedReason', async () => {
        submitFreeGasTransaction.mockResolvedValue({
            canFreeGas: true,
            hash: '',
            failedReason: 'operation was aborted due to timeout',
        });

        await expect(tryFreeGasTransaction(params)).rejects.toThrow('operation was aborted due to timeout');
    });

    it('returns a free-gas result with the hash on success', async () => {
        submitFreeGasTransaction.mockResolvedValue({
            canFreeGas: true,
            hash: '0xabc',
            failedReason: '',
        });

        await expect(tryFreeGasTransaction(params)).resolves.toEqual({ type: 'free-gas', hash: '0xabc' });
    });

    it('returns fallback when the backend says the tx cannot be free-gas', async () => {
        submitFreeGasTransaction.mockResolvedValue({
            canFreeGas: false,
            hash: '',
            failedReason: '',
        });

        await expect(tryFreeGasTransaction(params)).resolves.toEqual({ type: 'fallback' });
    });

    // Behaviour contract: only an explicit failedReason propagates. Transient/network
    // errors stay swallowed and fall back to a paid tx, matching the existing catch block.
    it('returns fallback on transient/network errors rather than throwing', async () => {
        submitFreeGasTransaction.mockRejectedValue(new Error('network'));

        await expect(tryFreeGasTransaction(params)).resolves.toEqual({ type: 'fallback' });
    });
});
