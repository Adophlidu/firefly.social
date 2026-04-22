import { type Address, erc20Abi } from 'viem';
import { mainnet } from 'viem/chains';

import { USDT_ABI } from '@/abi.js';
import { isSameEthereumAddress } from '@/utils/isSameAddress.js';

const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';

export function getTokenAbiForWagmi(chainId: number, tokenAddress: Address) {
    // https://github.com/wevm/wagmi/issues/2749
    if (chainId === mainnet.id && isSameEthereumAddress(tokenAddress, USDT_ADDRESS)) {
        return USDT_ABI;
    }
    return erc20Abi;
}
