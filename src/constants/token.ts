import { EthereumChainId as ChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

export const EVM_NATIVE_TOKEN_ADDRESS_MAP: Record<number, string> = {
    [ChainId.Celo]: '0x471ece3750da237f93b8e339c536989b8978a438',
};
