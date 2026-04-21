import { waitForEthereumTransaction } from '@dimensiondev/web3/actions';
import type { Hash } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockWaitForTransactionReceipt = vi.fn();
const mockGetTransactionConfirmations = vi.fn();

vi.mock('wagmi/actions', () => ({
    waitForTransactionReceipt: (...args: unknown[]) => mockWaitForTransactionReceipt(...args),
    getTransactionConfirmations: (...args: unknown[]) => mockGetTransactionConfirmations(...args),
}));

const mockConfig = {} as Parameters<typeof waitForEthereumTransaction>[0];
const hash = '0xabc123' as Hash;
const chainId = 1;

describe('waitForEthereumTransaction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('happy path', () => {
        it('resolves when waitForTransactionReceipt succeeds', async () => {
            mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });

            await expect(waitForEthereumTransaction(mockConfig, chainId, hash)).resolves.toBeUndefined();

            expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith(
                mockConfig,
                expect.objectContaining({ hash, chainId }),
            );
            expect(mockGetTransactionConfirmations).not.toHaveBeenCalled();
        });
    });

    describe('fallback path (receipt error + confirmation check)', () => {
        const receiptError = new Error('timeout');

        it('resolves silently when receipt fails but ≥1 confirmations found', async () => {
            mockWaitForTransactionReceipt.mockRejectedValue(receiptError);
            mockGetTransactionConfirmations.mockResolvedValue(1n);

            await expect(waitForEthereumTransaction(mockConfig, chainId, hash)).resolves.toBeUndefined();
        });

        it('resolves silently when receipt fails and confirmations > 1', async () => {
            mockWaitForTransactionReceipt.mockRejectedValue(receiptError);
            mockGetTransactionConfirmations.mockResolvedValue(5n);

            await expect(waitForEthereumTransaction(mockConfig, chainId, hash)).resolves.toBeUndefined();
        });

        it('rethrows original error when receipt fails and confirmations < 1', async () => {
            mockWaitForTransactionReceipt.mockRejectedValue(receiptError);
            mockGetTransactionConfirmations.mockResolvedValue(0n);

            await expect(waitForEthereumTransaction(mockConfig, chainId, hash)).rejects.toThrow(receiptError);
        });

        it('rethrows original receipt error when getTransactionConfirmations also fails', async () => {
            mockWaitForTransactionReceipt.mockRejectedValue(receiptError);
            mockGetTransactionConfirmations.mockRejectedValue(new Error('rpc failure'));

            await expect(waitForEthereumTransaction(mockConfig, chainId, hash)).rejects.toThrow(receiptError);
        });
    });
});
