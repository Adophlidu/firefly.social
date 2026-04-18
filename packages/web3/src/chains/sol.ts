export const solana = {
    id: 101,
};

export const solanaTestnet = {
    id: 102,
};

export const solanaDevnet = {
    id: 103,
};

export const solanaChains = [solana, solanaTestnet, solanaDevnet] as const;

export const SOLANA_CHAIN_IDS = solanaChains.map((chain) => chain.id);

export const solanaVisibleChains = [solana] as const satisfies ReadonlyArray<(typeof solanaChains)[number]>;

export type SolanaChainId = (typeof solanaChains)[number]['id'];
