import { isFreeGasSupportedChain } from '@dimensiondev/web3/utils';

import { FreeGasTxType } from '@/providers/types/FreeGas.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export interface CheckFreeGasEligibilityParams {
    chainId: number;
    txType: FreeGasTxType;
    to: string;
}

export async function checkFreeGasEligibility({ chainId, txType, to }: CheckFreeGasEligibilityParams) {
    if (!isFreeGasSupportedChain(chainId)) return false;
    return getFireflyEndpoint().checkFreeGasEligibility({
        chainId,
        txType,
        tx: { to },
    });
}
