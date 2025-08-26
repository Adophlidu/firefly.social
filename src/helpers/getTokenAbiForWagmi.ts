import { type Address, erc20Abi } from 'viem';

import { USDT_ABI } from '@/abis/USDT.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';

export function getTokenAbiForWagmi(chainId: number, tokenAddress: Address) {
    // https://github.com/wevm/wagmi/issues/2749
    if (chainId === EthereumChainId.Mainnet && isSameEthereumAddress(tokenAddress, usdtAddress)) {
        return USDT_ABI;
    }

    return erc20Abi;
}
