import { CHAIN_DESCRIPTORS } from '@/mask_pkgs/web3-shared/evm/constants/descriptors.js';
import { createERC20Tokens } from '@/mask_pkgs/web3-shared/evm/helpers/token.js';
import { ChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

const getNativeCurrency = (chainId: ChainId) => {
    return CHAIN_DESCRIPTORS.find((x) => x.chainId === chainId)?.nativeCurrency;
};

export const WNATIVE = createERC20Tokens(
    'WNATIVE_ADDRESS',
    (chainId) => `Wrapped ${getNativeCurrency(chainId)?.name ?? 'Ether'}`,
    (chainId) => `W${getNativeCurrency(chainId)?.symbol ?? 'ETH'}`,
    18,
);
