import { AccountTransaction, EthereumMethodType, type Transaction } from '@masknet/web3-shared-evm';

import { ConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/Base/apis/ConnectionOptions.js';
import { EVMConnectionReadonlyAPI } from '@/mask_pkgs/web3-providers/Web3/EVM/apis/ConnectionReadonlyAPI.js';
import { EVMRequest } from '@/mask_pkgs/web3-providers/Web3/EVM/apis/RequestAPI.js';
import type { EVMConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/EVM/types/index.js';

class ConnectionAPI extends EVMConnectionReadonlyAPI {
    protected override Request = EVMRequest;

    async sendTransaction(transaction: Transaction, initial?: EVMConnectionOptions) {
        const options = ConnectionOptions.fill(initial);

        // send a transaction which will add into the internal transaction list and start to watch it for confirmation
        return this.Request.request<string>(
            {
                method: EthereumMethodType.ETH_SEND_TRANSACTION,
                params: [new AccountTransaction(transaction).fill(options.overrides)],
            },
            options,
        );
    }
}

export const EVMWeb3 = new ConnectionAPI();
