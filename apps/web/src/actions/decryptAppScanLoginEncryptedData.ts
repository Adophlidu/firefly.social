'use server';

import { HIDDEN_SECRET } from '@dimensiondev/constants/static';
import { SessionType, SourceInURL } from '@dimensiondev/enums';
import { parseJson, runInSafeAsync, safeUnreachable } from '@dimensiondev/utils';
import { ensureHexPrefix } from '@dimensiondev/web3/utils';
import { compact } from 'lodash-es';

import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { decrypt } from '@/helpers/encodec.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { FAKE_SIGNER_REQUEST_TOKEN, FarcasterSession } from '@/providers/farcaster/Session.js';
import { getAllConnectionsFromAuthToken } from '@/providers/firefly/endpoint/getAllConnectionsFromAuthToken.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import { LensSession } from '@/providers/lens/Session.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';
import type { AuthDataFromApp } from '@/types/sync.js';

export async function decryptAppScanLoginEncryptedData(
    data: string,
    otp: string,
): Promise<
    | {
          error: string;
      }
    | {
          fireflySession: string;
          sessions: string[];
      }
> {
    const decryptedData = await decrypt(data, otp);
    const authData = parseJson<AuthDataFromApp>(decryptedData);
    if (!authData) return { error: 'Decryption failed.' };

    const allConnectionsFromAuthToken = await getAllConnectionsFromAuthToken(authData.firefly_account_token);
    const fireflyProfile = formatFireflyAccountProfileFromFireflyConnections(allConnectionsFromAuthToken.account);
    if (!fireflyProfile) return { error: 'The firefly account not found.' };

    const sessions: Array<FarcasterSession | LensSession | TwitterSession | BskySession> = compact(
        authData.social_accounts.map((account) => {
            const source = account.type;
            switch (source) {
                case SourceInURL.Farcaster:
                    return new FarcasterSession(
                        account.user_id,
                        ensureHexPrefix(account.token),
                        0,
                        0,
                        FAKE_SIGNER_REQUEST_TOKEN,
                    );
                case SourceInURL.Lens:
                    return new LensSession(
                        account.user_id,
                        account.accessToken,
                        0,
                        0,
                        account.refreshToken,
                        account.user_id,
                        account.idToken,
                    );
                case SourceInURL.Bsky:
                    return new BskySession(account.user_id, 0, 0, DEFAULT_SERVICE_URL, {
                        active: true,
                        did: account.user_id,
                        handle: account.handle,
                        accessJwt: account.accessJwt,
                        refreshJwt: account.refreshJwt,
                    });
                case SourceInURL.X:
                    return new TwitterSession(account.user_id, account.accessToken, 0, 0, {
                        clientId: account.user_id,
                        accessToken: account.accessToken,
                        accessTokenSecret: account.accessTokenSecret,
                        consumerKey: account.consumerKey,
                        consumerSecret: account.consumerKeySecret,
                    });
                default:
                    safeUnreachable(source);
                    return null;
            }
        }),
    );
    for (const session of sessions) {
        if (session.type === SessionType.Twitter) {
            const s = session as TwitterSession;
            await runInSafeAsync(() => TwitterSessionPayload.recordPayload(s.payload));
            s.payload.consumerSecret = HIDDEN_SECRET;
        }
    }

    const fireflySession = new FireflySession(fireflyProfile.uid, authData.firefly_account_token, null, null, false, {
        ...fireflyProfile,
        isNew: false,
    });

    return {
        fireflySession: fireflySession.serialize(),
        sessions: sessions.map((s) => s.serialize()),
    };
}
