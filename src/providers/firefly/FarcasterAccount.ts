import urlcat from 'urlcat';

import { FireflyPlatform } from '@/constants/enum.js';
import { getPlatformQueryKey } from '@/helpers/getPlatformQueryKey.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { getPublicKeyInHexFromPrivateKey } from '@/providers/farcaster/ed25519.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { block } from '@/providers/firefly/endpoints/block.js';
import { unblock } from '@/providers/firefly/endpoints/unblock.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { type LoginFarcasterWithWalletResponse, type Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

class FarcasterAccount {
    async blockProfileFor(source: FireflyPlatform, profileId: string): Promise<boolean> {
        return block(getPlatformQueryKey(resolveSourceFromUrl(source)), profileId);
    }

    async unblockProfileFor(source: FireflyPlatform, profileId: string): Promise<boolean> {
        return unblock(getPlatformQueryKey(resolveSourceFromUrl(source)), profileId);
    }

    async reportFarcasterSigner(session: FarcasterSession, signal?: AbortSignal) {
        // ensure session is available
        fireflySessionHolder.assertSession('[reportFarcasterSigner] firefly session required');

        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/upSignerConfig');

        await fireflySessionHolder.fetchWithSession(url, {
            method: 'POST',
            body: JSON.stringify({
                fid: session.profileId,
                signerPublickey: await getPublicKeyInHexFromPrivateKey(session.token),
                signerPrivatekey: session.token,
            }),
            signal,
        });
    }

    async checkCustodyWallet(fid: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/checkCustodyWallet', {
            fid,
        });
        const response = await fireflySessionHolder.fetchWithSession<Response<boolean>>(url);
        const data = resolveFireflyResponseData(response);
        return data;
    }

    async signMessageWithCustodyWallet(fid: string, message: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/signMessage');
        const response = await fireflySessionHolder.fetchWithSession<Response<{ signatureMessage: string }>>(url, {
            method: 'POST',
            body: JSON.stringify({
                fid: Number.parseInt(fid, 10),
                message,
            }),
        });
        const data = resolveFireflyResponseData(response);
        return data.signatureMessage;
    }

    async loginFarcasterWithWallet(
        sysAccount: string,
        originalMessage: string,
        signatureMessage: string,
        isForce: boolean,
    ) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/farcaster_account/login/fid/wallet');
        const body = {
            sysAccount,
            originalMessage,
            signatureMessage,
            isForce,
        };
        let response = await fireflySessionHolder.fetch<LoginFarcasterWithWalletResponse>(
            url,
            {
                method: 'POST',
                body: JSON.stringify(body),
            },
            {
                noStrictOK: true,
            },
        );
        if (response.code === 232) {
            response = await fireflySessionHolder.fetchWithoutSession<LoginFarcasterWithWalletResponse>(url, {
                method: 'POST',
                body: JSON.stringify(body),
            });
        }
        return resolveFireflyResponseData(response);
    }
}

export { FarcasterAccount };
export const farcasterAccountProvider = new FarcasterAccount();
