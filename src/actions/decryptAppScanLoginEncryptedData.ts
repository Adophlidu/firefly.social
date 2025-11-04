'use server';

import { parseJson, safeUnreachable } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import { type Hex, hexToBytes } from 'viem';

import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { SourceInURL } from '@/constants/enum.js';
import { HIDDEN_SECRET } from '@/constants/index.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { FAKE_SIGNER_REQUEST_TOKEN, FarcasterSession } from '@/providers/farcaster/Session.js';
import { getAllConnectionsFromAuthToken } from '@/providers/firefly/endpoints/getAllConnectionsFromAuthToken.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import { LensSession } from '@/providers/lens/Session.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { TwitterSessionPayload } from '@/providers/twitter/SessionPayload.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { type AuthDataFromApp } from '@/services/loginWithAppScan.js';

const APP_LOGIN_ENCRYPT_IV = '0x4f05c37c16c801c2516b0338a8fd0cf9';

async function decrypt(data: string, otp: string) {
    const iv = hexToBytes(APP_LOGIN_ENCRYPT_IV);
    const encryptedData = hexToBytes((data.startsWith('0x') ? data : `0x${data}`) as Hex);

    // Derive AES key using SHA-256 hash of OTP
    const otpBytes = new TextEncoder().encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', otpBytes);
    const aesKey = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-CBC' }, false, ['decrypt']);

    // Decrypt using AES-CBC
    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv,
        },
        aesKey,
        encryptedData,
    );

    return new TextDecoder().decode(decryptedBuffer);
}

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
    const fireflySession = new FireflySession(fireflyProfile.uid, authData.firefly_account_token, null, null, false, {
        ...fireflyProfile,
        isNew: false,
    });
    const sessions: Array<FarcasterSession | LensSession | TwitterSession | BskySession> = compact(
        authData.social_accounts.map((account) => {
            const source = account.type;
            switch (source) {
                case SourceInURL.Farcaster:
                    return new FarcasterSession(
                        account.user_id,
                        account.token.startsWith('0x') ? account.token : `0x${account.token}`,
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

    return {
        fireflySession: fireflySession.serialize(),
        sessions: sessions.map((s) => s.serialize()),
    };
}
