import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { delay, runInSafeAsync } from '@dimensiondev/utils';
import urlcat from 'urlcat';
import { toHex } from 'viem';

import { LENS_CHAIN_ID } from '@/constants/static.js';
import { ensureCreatedFireflyWallet } from '@/helpers/ensureCreatedFireflyWallet.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type PrivySignMessageResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

async function signMessageWithNativePrivy(message: string) {
    const wallet = await ensureCreatedFireflyWallet();
    if (!wallet) throw new Error('Failed to ensure Firefly wallet');

    return iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_SIGN_MESSAGE, {
        chainId: toHex(LENS_CHAIN_ID),
        address: wallet.address,
        message,
    });
}

export async function signMessageWithPrivy(message: string, encoding = 'utf-8') {
    try {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/privy/eth/personal-sign');
        const response = await fireflySessionHolder.fetchWithSession<PrivySignMessageResponse>(url, {
            method: 'POST',
            body: JSON.stringify({
                message,
                encoding,
            }),
        });

        return resolveFireflyResponseData(response);
    } catch (error) {
        const signature = await runInSafeAsync(() =>
            Promise.race([signMessageWithNativePrivy(message), delay(1000 * 30)]),
        );
        if (signature) {
            return { signature, encoding };
        }

        throw error;
    }
}
