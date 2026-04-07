import { web3 } from '@coral-xyz/anchor';
import { BigNumber } from 'bignumber.js';

export function parseSolToLamports(sol: string | number) {
    return BigInt(BigNumber(sol).multipliedBy(web3.LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_HALF_UP).toString());
}
