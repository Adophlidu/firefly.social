import { solana } from '@dimensiondev/web3/chains';

import { getWalletAdapter, getWalletAdaptorConnected } from '@/providers/solana/getWalletAdapter.js';
import type { NetworkProvider } from '@/providers/types/Network.js';
import { SolanaExplorerResolver } from '@/web3-providers/solana/ResolverAPI.js';

class Provider implements NetworkProvider {
    async connect() {
        const adapter = getWalletAdapter();
        if (!adapter.publicKey) await adapter.connect();
    }

    async getAccount(): Promise<string> {
        await this.connect();

        const adapter = getWalletAdaptorConnected();
        return adapter.publicKey.toBase58();
    }

    getChainId(): number {
        return solana.id;
    }

    getAddressUrl(chainId: number, token: string): string | undefined {
        return SolanaExplorerResolver.addressLink(chainId, token);
    }

    getTransactionUrl(chainId: number, hash: string): string | undefined {
        return SolanaExplorerResolver.transactionLink(chainId, hash);
    }
}

export const SolanaNetwork = new Provider();
