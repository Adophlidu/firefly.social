import { type Hash } from 'viem';
import { getTransactionConfirmations, waitForTransactionReceipt } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import type { EthereumChainId } from '#masknet/web3-shared-evm';

export async function waitForEthereumTransaction(chainId: EthereumChainId, hash: Hash): Promise<void> {
    try {
        await waitForTransactionReceipt(config, {
            hash,
            chainId,
            retryCount: 15,
            timeout: 1000 * 60 * 2,
        });
    } catch (error) {
        const blocks = await getTransactionConfirmations(config, {
            hash,
            chainId,
        });
        if (blocks < 1) {
            throw error;
        }
    }
}
