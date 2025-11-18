import { type Address, type Hash } from 'viem';
import { getAccount, getChainId } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { NotImplementedError } from '@/constants/error.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import type { NetworkProvider } from '@/providers/types/Network.js';
import { EVMExplorerResolver } from '@/web3-providers/evm/ResolverAPI.js';
import type { EthereumChainId } from '@/web3-shared/evm/types.js';

class Provider implements NetworkProvider<EthereumChainId, Address, Hash> {
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

    getChainId(): EthereumChainId {
        return getChainId(wagmiConfig);
    }

    getAddressUrl(chainId: EthereumChainId, address: Address): string | undefined {
        return BlockScanExplorerResolver.addressLink(chainId, address);
    }

    getTransactionUrl(chainId: EthereumChainId, hash: Hash): string | undefined {
        return EVMExplorerResolver.transactionLink(chainId, hash);
    }
}

export const EthereumNetwork = new Provider();
