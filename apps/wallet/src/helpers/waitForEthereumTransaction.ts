import type { Hash } from 'viem';
import { getTransactionConfirmations, waitForTransactionReceipt } from 'wagmi/actions';

import { config } from '@/configs/wagmi.js';
import type { EthereumChainId } from '@/constants/ethereum.js';

export async function waitForEthereumTransaction(chainId: EthereumChainId, hash: Hash): Promise<void> {
    try {
        await waitForTransactionReceipt(config, {
            hash,
            chainId: chainId as (typeof config)['chains'][number]['id'],
            retryCount: 15,
            timeout: 1000 * 60 * 2,
        });
    } catch (error) {
        const blocks = await getTransactionConfirmations(config, {
            hash,
            chainId: chainId as (typeof config)['chains'][number]['id'],
        });
        if (blocks < 1) {
            throw error;
        }
    }
}
