import { web3 } from '@coral-xyz/anchor';
import { envs, STATUS } from '@dimensiondev/envs';
import { createWagmiPublicClient } from '@dimensiondev/web3/actions';
import { getSolanaRPCUrl } from '@dimensiondev/web3/utils';
import { optimism } from 'viem/chains';

export async function getEthereumBlockHash(): Promise<string> {
    try {
        const publicClient = createWagmiPublicClient(optimism.id);
        const latestBlock = await publicClient.getBlock();
        return latestBlock.hash ?? '';
    } catch (error) {
        throw new Error(`Failed to get Ethereum block hash: ${error}`);
    }
}

export async function getSolanaBlockHash(): Promise<string> {
    try {
        const connection = new web3.Connection(
            getSolanaRPCUrl({
                useDevCluster: envs.external.NEXT_PUBLIC_SOLANA_DEV === STATUS.Enabled,
                httpUrl: envs.external.NEXT_PUBLIC_SOLANA_RPC_URL,
            }),
            'confirmed',
        );
        const latestBlockhash = await connection.getLatestBlockhash();
        return latestBlockhash.blockhash;
    } catch (error) {
        throw new Error(`Failed to get Solana block hash: ${error}`);
    }
}
