import type { BaseContract } from '@masknet/web3-contracts/types/types.js';
import type { ContractOptions } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';

import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import type { Web3 } from '@/mask_pkgs/web3-shared/evm/libs/Web3.js';

export function createContract<T extends BaseContract>(
    web3: Web3 | null,
    address: string | undefined,
    ABI: AbiItem[],
    options?: ContractOptions,
) {
    if (!isValidAddressEthereum(address) || !web3) return null;
    return new web3.eth.Contract(ABI, address, options) as unknown as T;
}
