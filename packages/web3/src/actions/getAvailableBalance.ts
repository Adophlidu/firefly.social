import type { Address } from 'viem';
import type { Config } from 'wagmi';

import { getBalanceOf } from '@/actions/getBalanceOf.js';
import { isLessThan, minus } from '@/numbers.js';
import { isNativeTokenAddress } from '@/utils/isZeroAddress.js';

export async function getAvailableBalance(
    config: Config,
    account: Address,
    token: { chainId: number; id: Address },
    gas?: BigNumber | string | number,
): Promise<string> {
    const balance = await getBalanceOf(config, token.chainId, account, token.id);
    if (isNativeTokenAddress(token.id) && gas !== undefined) {
        const available = minus(balance.value.toString(), gas);
        return isLessThan(available, 0) ? '0' : available.toString();
    }
    return balance.value.toString();
}
