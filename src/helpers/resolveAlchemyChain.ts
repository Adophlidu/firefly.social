/* cspell:disable */

import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/index.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/types.js';

const EVM_CHAIN: Record<number, string> = {
    [EthereumChainId.Mainnet]: 'ethereum',
    [EthereumChainId.Base]: 'base',
    [EthereumChainId.BSC]: 'bsc',
    [EthereumChainId.Polygon]: 'polygon',
    [EthereumChainId.Arbitrum]: 'arbitrum',
    [EthereumChainId.Optimism]: 'optimism',
    [EthereumChainId.Avalanche]: 'avalanche',
    [EthereumChainId.xDai]: 'gnosis',
    [EthereumChainId.Scroll]: 'scroll',
    [EthereumChainId.Zora]: 'zora',
};

const SOLANA_CHAIN: Record<number, string> = {
    [SolanaChainId.Mainnet]: 'solana',
};

export function resolveAlchemyChain(chain: number) {
    return isValidChainIdSolana(chain) ? SOLANA_CHAIN[chain] : EVM_CHAIN[chain];
}
