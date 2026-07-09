/* cspell:disable */
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    lens,
    linea,
    mainnet,
    metis,
    optimism,
    plasma,
    polygon,
    scroll,
    zkSync,
} from 'viem/chains';

import { robinhood } from '@/chains/robinhood.js';

const DEBANK_CHAIN_TO_CHAIN_ID_MAP: Record<string, number> = {
    arb: arbitrum.id,
    aurora: aurora.id,
    avax: avalanche.id,
    bsc: bsc.id,
    cfx: confluxESpace.id,
    eth: mainnet.id,
    ftm: fantom.id,
    matic: polygon.id,
    metis: metis.id,
    op: optimism.id,
    xdai: gnosis.id,
    base: base.id,
    scrl: scroll.id,
    lens: lens.id,
    linea: linea.id,
    era: zkSync.id,
    celo: celo.id,
    plasma: plasma.id,
    // Debank chain slug is "hood" (network_id 4663) — confirmed via Debank /chain/list.
    hood: robinhood.id,
};

export function resolveDebankChainId(chain: string): number | undefined {
    return DEBANK_CHAIN_TO_CHAIN_ID_MAP[chain];
}
