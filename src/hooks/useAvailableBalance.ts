'use client';

import { unreachable } from '@dimensiondev/utils';
import { type Address } from 'viem';

import { NetworkType, RedpacketTxType } from '@/constants/enum.js';
import { SOLANA_REDPACKET_CLAIM_GAS, SOLANA_REDPACKET_CREATE_GAS } from '@/constants/rp.js';
import { type ChainContextOverrides } from '@/hooks/useChainContext.js';
import { useEVMAvailableBalance } from '@/hooks/useEVMAvailableBalance.js';
import { useSolanaAvailableBalance } from '@/hooks/useSolanaAvailableBalance.js';

export function useAvailableBalance(
    address: string,
    gas: number,
    overrides?: ChainContextOverrides,
    txType: RedpacketTxType = RedpacketTxType.create,
) {
    const networkType = overrides?.networkType ?? NetworkType.Ethereum;

    const evmResult = useEVMAvailableBalance(address as Address, gas, overrides, networkType === NetworkType.Ethereum);
    const solanaResult = useSolanaAvailableBalance(
        address,
        txType === RedpacketTxType.create ? SOLANA_REDPACKET_CREATE_GAS : SOLANA_REDPACKET_CLAIM_GAS,
        overrides,
        networkType === NetworkType.Solana,
    );

    switch (networkType) {
        case NetworkType.Solana:
            return solanaResult;
        case NetworkType.Ethereum:
            return evmResult;
        default:
            unreachable(networkType);
    }
}
