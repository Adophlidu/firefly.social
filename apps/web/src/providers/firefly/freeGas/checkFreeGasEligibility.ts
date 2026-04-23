import { isFreeGasSupportedChain } from '@dimensiondev/web3/chains';
import urlcat from 'urlcat';

import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

interface FireflyResponse<T> {
    code: number;
    data?: T;
    error?: string[];
}

export type FreeGasTxType = 'token_approve' | 'polymarket_deposit' | 'redpacket_send' | 'token_transfer';

interface CheckFreeGasEligibilityParams {
    chainId: number;
    txType: FreeGasTxType;
    to: string;
}

export async function checkFreeGasEligibility({ chainId, txType, to }: CheckFreeGasEligibilityParams) {
    if (!isFreeGasSupportedChain(chainId)) return false;
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/privy/tx/free-gas/check');
    const result = await fireflySessionHolder.fetchWithSession<FireflyResponse<boolean>>(url, {
        method: 'POST',
        body: JSON.stringify({
            chainId,
            txType,
            tx: { to },
        }),
    });

    return result.data ?? false;
}
