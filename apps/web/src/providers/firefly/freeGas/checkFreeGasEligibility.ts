import urlcat from 'urlcat';

import type { FreeGasTxType } from '@/providers/firefly/freeGas/tryFreeGasTransaction.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { settings } from '@/settings/index.js';

interface FireflyResponse<T> {
    code: number;
    data?: T;
    error?: string[];
}

interface CheckFreeGasEligibilityParams {
    chainId: number;
    txType: FreeGasTxType;
    to: string;
}

export async function checkFreeGasEligibility({ chainId, txType, to }: CheckFreeGasEligibilityParams) {
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
