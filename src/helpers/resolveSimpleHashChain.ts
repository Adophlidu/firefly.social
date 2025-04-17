/* cspell:disable */

import { first, memoize } from 'lodash-es';

import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';
import { SolanaChainId } from '#masknet/web3-shared-solana';

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

const EVM_CHAIN_ALIAS: Record<string, string> = {
    binance_smart_chain: 'bsc',
};

export function resolveSimpleHashChain(chain: number) {
    return isValidChainIdSolana(chain) ? SOLANA_CHAIN[chain] : EVM_CHAIN[chain];
}

function resolveInnerChainId<T extends number>(
    chains: Partial<Record<T, string>>,
    chain: string,
    chainAlias?: Record<string, string>,
) {
    const chainIdKey = first(Object.entries(chains).find(([, value]) => value === (chainAlias?.[chain] || chain)));
    return typeof chainIdKey === 'string' ? (Number.parseInt(chainIdKey, 10) as T) : undefined;
}

export const resolveSimpleHashChainId: (chainId: string) => number | undefined = memoize(function resolveChainId(
    chain: string,
): number | undefined {
    const evmChainId = resolveInnerChainId<EthereumChainId>(EVM_CHAIN, chain, EVM_CHAIN_ALIAS);
    if (evmChainId) return evmChainId;

    return resolveInnerChainId<SolanaChainId>(SOLANA_CHAIN, chain);
});
