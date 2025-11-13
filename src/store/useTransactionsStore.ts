import { useMemo } from 'react';
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { NetworkType } from '@/constants/enum.js';
import { createSelectors } from '@/helpers/createSelector.js';

interface TransactionsState {
    hasOpenSwap: boolean;
    setHasOpenSwap: (hasOpenSwap: boolean) => void;
    selectedChainId: number | null;
    setSelectedChainId: (chainId: number | null) => void;
}

export const chainsList = [
    {
        id: mainnet.id,
        networkType: NetworkType.Ethereum,
        name: mainnet.name,
    },
    {
        id: 101,
        networkType: NetworkType.Solana,
        name: 'Solana',
    },
    {
        id: bsc.id,
        networkType: NetworkType.Ethereum,
        name: bsc.name,
    },
    {
        id: base.id,
        networkType: NetworkType.Ethereum,
        name: base.name,
    },
    {
        id: arbitrum.id,
        networkType: NetworkType.Ethereum,
        name: arbitrum.name,
    },
    {
        id: optimism.id,
        networkType: NetworkType.Ethereum,
        name: optimism.name,
    },
    {
        id: polygon.id,
        networkType: NetworkType.Ethereum,
        name: polygon.name,
    },
];

const useTransactionsStore = create<TransactionsState, [['zustand/persist', unknown], ['zustand/immer', unknown]]>(
    persist(
        immer((set) => ({
            hasOpenSwap: false,
            setHasOpenSwap: (hasOpenSwap) => set({ hasOpenSwap }),
            selectedChainId: null,
            setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),
        })),
        {
            name: 'firefly-transitions',
            version: 1,
            storage: createJSONStorage(() => localStorage),
            migrate(persistedState, version) {
                return persistedState;
            },
        },
    ),
);

const useTransactionsStateStoreBase = createSelectors(useTransactionsStore);

export function useTransactionsStateStore(networkType?: NetworkType | null) {
    const { selectedChainId, ...rest } = useTransactionsStateStoreBase();
    const validChains = useMemo(
        () => (networkType ? chainsList.filter((x) => x.networkType === networkType) : chainsList),
        [networkType],
    );

    return {
        ...rest,
        validChains,
        selectedChainId: selectedChainId && !validChains.some((x) => x.id === selectedChainId) ? null : selectedChainId,
    };
}
