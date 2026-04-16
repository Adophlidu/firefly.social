import { isValidEnumValue } from '@dimensiondev/utils';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    blast,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    lens,
    linea,
    mainnet,
    mantle,
    metis,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';

import { SolanaChainId } from '@/constants/solana.js';

const ETHEREUM_CHAIN_IDS: readonly number[] = [
    mainnet.id,
    base.id,
    bsc.id,
    polygon.id,
    optimism.id,
    arbitrum.id,
    gnosis.id,
    avalanche.id,
    aurora.id,
    confluxESpace.id,
    fantom.id,
    xLayer.id,
    metis.id,
    mantle.id,
    zora.id,
    scroll.id,
    celo.id,
    lens.id,
    zkSync.id,
    linea.id,
    plasma.id,
    blast.id,
];

export function isValidChainIdEthereum(chainId?: number) {
    return !!chainId && ETHEREUM_CHAIN_IDS.includes(chainId);
}

export function isValidChainIdSolana(chainId?: SolanaChainId) {
    return !!chainId && isValidEnumValue(chainId, SolanaChainId);
}
