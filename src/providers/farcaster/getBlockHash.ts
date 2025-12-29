import { web3 } from '@coral-xyz/anchor';

import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { getSolanaRPCUrl } from '@/helpers/getSolanaRPCUrl.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export async function getEthereumBlockHash(): Promise<string> {
    try {
        const publicClient = createWagmiPublicClient(EthereumChainId.Optimism);
        const latestBlock = await publicClient.getBlock();
        return latestBlock.hash ?? '';
    } catch (error) {
        throw new Error(`Failed to get Ethereum block hash: ${error}`);
    }
}

export async function getSolanaBlockHash(): Promise<string> {
    try {
        const connection = new web3.Connection(getSolanaRPCUrl(), 'confirmed');
        const latestBlockhash = await connection.getLatestBlockhash();
        return latestBlockhash.blockhash;
    } catch (error) {
        throw new Error(`Failed to get Solana block hash: ${error}`);
    }
}
