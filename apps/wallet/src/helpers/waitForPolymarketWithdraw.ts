import { InvalidResultError, retry } from '@dimensiondev/utils';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export async function waitForPolymarketWithdraw(hash: string, isBridge: boolean, isDepositAddress: boolean) {
    return retry(
        async () => {
            const result = await getFireflyEndpoint().getPolymarketWithdrawStatus(hash, isBridge, isDepositAddress);
            if (result.status === 'success') return true;
            if (result.status === 'fail') throw new Error('Polymarket withdraw failed');

            throw new InvalidResultError();
        },
        { times: 60, interval: 600 },
    );
}
