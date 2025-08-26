import { getWalletAdapter, getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';
import type { NetworkProvider } from '@/providers/types/Network.js';
import { SolanaExplorerResolver } from '@/web3-providers/Web3/Solana/apis/ResolverAPI.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

class Provider implements NetworkProvider<SolanaChainId> {
    async connect() {
        const adapter = getWalletAdapter();
        if (!adapter.publicKey) await adapter.connect();
    }

    async getAccount(): Promise<string> {
        await this.connect();

        const adapter = getWalletAdaptorConnected();
        return adapter.publicKey.toBase58();
    }

    getChainId(): SolanaChainId {
        return SolanaChainId.Mainnet;
    }

    getAddressUrl(chainId: SolanaChainId, token: string): string | undefined {
        return SolanaExplorerResolver.addressLink(chainId, token);
    }

    getTransactionUrl(chainId: SolanaChainId, hash: string): string | undefined {
        return SolanaExplorerResolver.transactionLink(chainId, hash);
    }
}

export const SolanaNetwork = new Provider();
