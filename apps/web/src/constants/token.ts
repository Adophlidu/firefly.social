import { EthereumChainId as ChainId } from '@/web3-shared/evm/types.js';

export const EVM_NATIVE_TOKEN_ADDRESS_MAP: Record<number, string> = {
    [ChainId.Celo]: '0x471ece3750da237f93b8e339c536989b8978a438',
};
