import type { Hash } from 'viem';
import type { Config } from 'wagmi';
import { getTransactionConfirmations, waitForTransactionReceipt } from 'wagmi/actions';

export async function waitForEthereumTransaction(config: Config, chainId: number, hash: Hash): Promise<void> {
    try {
        await waitForTransactionReceipt(config, {
            hash,
            chainId,
            retryCount: 15,
            timeout: 1000 * 60 * 2,
        });
    } catch (error) {
        const blocks = await getTransactionConfirmations(config, { hash, chainId });
        if (blocks < 1) throw error;
    }
}
