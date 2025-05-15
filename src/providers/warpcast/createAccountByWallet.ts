import dayjs from 'dayjs';
import { signMessage } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { getWalletClientRequired } from '@/helpers/getWalletClientRequired.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import type { Account } from '@/providers/types/Account.js';
import { signedKeyRequests } from '@/providers/warpcast/signedKeyRequests.js';
import { signin } from '@/providers/warpcast/signin.js';

export async function createAccountByWallet(signal?: AbortSignal) {
    const { account } = await getWalletClientRequired(config);
    const originalMessage = `firefly sign message ${dayjs().unix()}`;
    const signatureMessage = await signMessage(config, {
        message: originalMessage,
        account: account.address,
    });
    const res = await FireflyEndpointProvider.loginFarcasterWithWallet(
        account.address,
        originalMessage,
        signatureMessage,
        true,
    );
    const response = await signin(res.signerPublickey, signal);
    const keyResponse = await signedKeyRequests(response.data.body, signal);
    const session = new FarcasterSession(
        res.fid,
        res.signerPrivatekey,
        response.data.timestamp,
        response.data.expiresAt,
        keyResponse.result.signedKeyRequest.token,
        undefined,
        undefined,
        account.address,
    );
    const fireflySession = new FireflySession(res.uid, res.accessToken, session, null, res.isNew, res);
    const profile = await FarcasterSocialMediaProvider.getProfileById(session.profileId);
    return {
        session,
        profile,
        fireflySession,
    } satisfies Account;
}
