'use client';

import { unreachable } from '@masknet/kit';
import type { Address } from 'viem';

import { NetworkType } from '@/constants/enum.js';
import { type ChainContextOverride } from '@/hooks/useChainContext.js';
import { useEVMAvailableBalance } from '@/hooks/useEVMAvailableBalance.js';
import { useSolanaAvailableBalance } from '@/hooks/useSolanaAvailableBalance.js';

export function useAvailableBalance(address: string, gas: number, overrides?: ChainContextOverride) {
    const networkType = overrides?.networkType ?? NetworkType.Ethereum;

    const evmResult = useEVMAvailableBalance(address as Address, gas, overrides, networkType === NetworkType.Ethereum);
    const solanaResult = useSolanaAvailableBalance(address, gas, overrides, networkType === NetworkType.Solana);

    switch (networkType) {
        case NetworkType.Solana:
            return solanaResult;
        case NetworkType.Ethereum:
            return evmResult;
        default:
            unreachable(networkType);
    }
}
