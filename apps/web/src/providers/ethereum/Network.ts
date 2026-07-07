import { NotImplementedError } from '@dimensiondev/utils';
import { EthExplorerResolver } from '@dimensiondev/web3/resolvers';
import type { Address, Hash } from 'viem';
import { getAccount, getChainId } from 'wagmi/actions';

import { getWagmiConfig } from '@/configs/wagmiConfigHolder.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import type { NetworkProvider } from '@/providers/types/Network.js';

class Provider implements NetworkProvider<number, Address, Hash> {
    async connect(): Promise<void> {
        throw new NotImplementedError();
    }

    async getAccount(): Promise<Address> {
        const account = getAccount(getWagmiConfig());
        if (!account.address) {
            throw new Error('Wallet not connected');
        }
        return account.address;
    }

    getChainId(): number {
        return getChainId(getWagmiConfig());
    }

    getAddressUrl(chainId: number, address: Address): string | undefined {
        return BlockScanExplorerResolver.addressLink(chainId, address);
    }

    getTransactionUrl(chainId: number, hash: Hash): string | undefined {
        return EthExplorerResolver.transactionLink(chainId, hash);
    }
}

export const EthereumNetwork = new Provider();
