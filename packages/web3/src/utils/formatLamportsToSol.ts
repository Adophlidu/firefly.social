import { BigNumber } from 'bignumber.js';

import { LAMPORTS_PER_SOL } from '@/constants.js';

export function formatLamportsToSol(lamports: number | string, precision = 9): string {
    const lamportsBn = BigNumber(lamports.toString());
    const sol = lamportsBn.dividedBy(LAMPORTS_PER_SOL);
    return sol.toFixed(precision);
}
