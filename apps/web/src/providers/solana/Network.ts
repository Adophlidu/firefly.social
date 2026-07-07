import { solana } from '@dimensiondev/web3/chains';
import { SolanaExplorerResolver } from '@dimensiondev/web3/resolvers';

import type { NetworkProvider } from '@/providers/types/Network.js';

class Provider implements NetworkProvider {
    async connect() {
        // Loaded on demand: connecting requires the wallet stack, so the AppKit
        // controllers stay out of the chunks that render tips/wallet embeds.
        const { getWalletAdapter } = await import('@/providers/solana/getWalletAdapter.js');
        const adapter = getWalletAdapter();
        if (!adapter.publicKey) await adapter.connect();
    }

    async getAccount(): Promise<string> {
        await this.connect();

        const { getWalletAdaptorConnected } = await import('@/providers/solana/getWalletAdapter.js');
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
