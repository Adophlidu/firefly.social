import { NotImplementedError } from '@dimensiondev/utils';
import type { Address, Hash } from 'viem';
import { getAccount, getChainId } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import type { NetworkProvider } from '@/providers/types/Network.js';
import { EthExplorerResolver } from '@/web3-providers/evm/ResolverAPI.js';

class Provider implements NetworkProvider<number, Address, Hash> {
    async connect(): Promise<void> {
        throw new NotImplementedError();
    }

    async getAccount(): Promise<Address> {
        const account = getAccount(wagmiConfig);
        if (!account.address) {
            throw new Error('Wallet not connected');
        }
        return account.address;
    }

    getChainId(): number {
        return getChainId(wagmiConfig);
    }

    getAddressUrl(chainId: number, address: Address): string | undefined {
        return BlockScanExplorerResolver.addressLink(chainId, address);
    }

    getTransactionUrl(chainId: number, hash: Hash): string | undefined {
        return EthExplorerResolver.transactionLink(chainId, hash);
    }
}

export const EthereumNetwork = new Provider();
