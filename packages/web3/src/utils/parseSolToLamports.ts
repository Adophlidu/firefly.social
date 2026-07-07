import { BigNumber } from 'bignumber.js';

import { LAMPORTS_PER_SOL } from '@/constants.js';

export function parseSolToLamports(sol: string | number) {
    return BigInt(BigNumber(sol).multipliedBy(LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_HALF_UP).toString());
}
