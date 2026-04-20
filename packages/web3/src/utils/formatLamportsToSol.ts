import { web3 } from '@coral-xyz/anchor';
import { BigNumber } from 'bignumber.js';

export function formatLamportsToSol(lamports: number | string, precision = 9): string {
    const lamportsBn = BigNumber(lamports.toString());
    const sol = lamportsBn.dividedBy(web3.LAMPORTS_PER_SOL);
    return sol.toFixed(precision);
}
