import type { Hash } from 'viem';
import type { Config } from 'wagmi';
import { getTransactionConfirmations, waitForTransactionReceipt } from 'wagmi/actions';

const ETHEREUM_TX_RETRY_COUNT = 15;
const ETHEREUM_TX_TIMEOUT_MS = 2 * 60 * 1000;

export async function waitForEthereumTransaction(config: Config, chainId: number, hash: Hash): Promise<void> {
    try {
        await waitForTransactionReceipt(config, {
            hash,
            chainId,
            retryCount: ETHEREUM_TX_RETRY_COUNT,
            timeout: ETHEREUM_TX_TIMEOUT_MS,
        });
    } catch (receiptError) {
        let blocks: bigint;
        try {
            blocks = await getTransactionConfirmations(config, { hash, chainId });
        } catch {
            throw receiptError;
        }

        if (blocks < 1n) throw receiptError;
    }
}
