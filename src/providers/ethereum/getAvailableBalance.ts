import type { Address } from 'viem';
import { getBalance } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { isLessThan, minus } from '@/helpers/number.js';
import { getDefaultGas } from '@/providers/ethereum/getDefaultGas.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import { EthereumTransfer } from '@/providers/ethereum/Transfer.js';
import type { TransactionOptions } from '@/providers/types/Transfer.js';
import type { EthereumChainId } from '#masknet/web3-shared-evm';

export async function getAvailableBalance(options: TransactionOptions<EthereumChainId, Address>) {
    const { token } = options;
    const account = await EthereumNetwork.getAccount();
    const balance = await getBalance(wagmiConfig, {
        address: account,
        chainId: token.chainId,
        token: EthereumTransfer.isNativeToken(token) ? undefined : token.id,
    });
    if (EthereumTransfer.isNativeToken(token)) {
        const { gas } = await getDefaultGas(options);
        const available = minus(balance.value.toString(), gas);
        return isLessThan(available, 0) ? '0' : available.toString();
    }
    return balance.value.toString();
}
