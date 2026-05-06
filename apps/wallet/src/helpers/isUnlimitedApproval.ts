import { isGreaterThanOrEqualTo, toFixed } from '@dimensiondev/web3/numbers';

const MaxUint128 = toFixed('0xffffffffffffffffffffffffffffffff');

export function isUnlimitedApproval(amount: string) {
    return isGreaterThanOrEqualTo(amount, MaxUint128);
}
