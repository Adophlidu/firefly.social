import type { Hash } from 'viem';
import { getTransactionConfirmations, waitForTransactionReceipt } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';

export async function waitForEthereumTransaction(chainId: number, hash: Hash): Promise<void> {
    try {
        await waitForTransactionReceipt(wagmiConfig, {
            hash,
            chainId,
            retryCount: 15,
            timeout: 1000 * 60 * 2,
        });
    } catch (error) {
        const blocks = await getTransactionConfirmations(wagmiConfig, {
            hash,
            chainId,
        });
        if (blocks < 1) {
            throw error;
        }
    }
}
