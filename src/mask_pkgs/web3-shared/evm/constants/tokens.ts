import { ChainId } from '../types/index.js';
import { createERC20Tokens } from '../helpers/token.js';
import { CHAIN_DESCRIPTORS } from './descriptors.js';

const getNativeCurrency = (chainId: ChainId) => {
    return CHAIN_DESCRIPTORS.find((x) => x.chainId === chainId)?.nativeCurrency;
};

export const WNATIVE = createERC20Tokens(
    'WNATIVE_ADDRESS',
    (chainId) => `Wrapped ${getNativeCurrency(chainId)?.name ?? 'Ether'}`,
    (chainId) => `W${getNativeCurrency(chainId)?.symbol ?? 'ETH'}`,
    18,
);
