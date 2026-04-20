import { isLessThan, minus } from '@dimensiondev/web3/numbers';
import type { Address } from 'viem';

import { getBalanceOf } from '@/helpers/getBalanceOf.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import { EthereumTransfer } from '@/providers/ethereum/Transfer.js';
import type { TransactionOptions } from '@/providers/types/Transfer.js';

export async function getAvailableBalance(options: TransactionOptions<number, Address>) {
    const { token } = options;
    const account = await EthereumNetwork.getAccount();
    const balance = await getBalanceOf(token.chainId, account, token.id);
    if (EthereumTransfer.isNativeToken(token)) {
        const { gas } = await getDefaultGas(options);
        const available = minus(balance.value.toString(), gas);
        return isLessThan(available, 0) ? '0' : available.toString();
    }
    return balance.value.toString();
}
