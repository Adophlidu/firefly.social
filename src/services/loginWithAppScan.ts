'use client';

import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { compact } from 'lodash-es';

import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { type SocialSource, SourceInURL } from '@/constants/enum.js';
import { decryptAppScanLoginEncryptedData } from '@/helpers/decryptAppScanLoginEncryptedData.js';
import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { parseJson } from '@/helpers/parseJson.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromSessionType } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { FireflySession } from '@/providers/firefly/Session.js';
import { LensSession } from '@/providers/lens/Session.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { Account } from '@/providers/types/Account.js';
import { DesktopLinkInfoStatus, type DesktopLinkInfoStatusData } from '@/providers/types/Firefly.js';
import { addAccounts } from '@/services/account.js';

export interface AuthDataFromApp {
    firefly_account_token: string;
    social_accounts: SocialAccount[];
}

export interface SocialAccountTwitter {
    type: SourceInURL.X;
    user_id: string;
    handle: string;
    consumerKey: string;
    consumerKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
}

export interface SocialAccountFarcaster {
    type: SourceInURL.Farcaster;
    user_id: string; // fid
    handle: string;
    token: string; // privateKey
}

export interface SourceAccountLens {
    type: SourceInURL.Lens;
    user_id: string; // address
    handle: string;
    idToken: string;
    accessToken: string; // accessToken
    refreshToken: string; // refreshToken
}

export interface SocialAccountBsky {
    type: SourceInURL.Bsky;
    user_id: string; // did
    handle: string;
    accessJwt: string; // accessJwt
    refreshJwt: string; // refreshJwt
}

type SocialAccount = SocialAccountTwitter | SocialAccountFarcaster | SourceAccountLens | SocialAccountBsky;

export class DecryptionFailed extends Error {}

export async function loginWithAppScan(data: DesktopLinkInfoStatusData, otp: string) {
    if (data.status !== DesktopLinkInfoStatus.Confirm) throw new DecryptionFailed(t`The encrypted data not found.`);
    if (!data.encryptedData) throw new DecryptionFailed(t`The encrypted data not found.`);
    const authData = await runInSafeAsync(async () => {
        const decryptedData = await decryptAppScanLoginEncryptedData(data.encryptedData, otp);
        return parseJson<AuthDataFromApp>(decryptedData);
    });
    if (!authData) throw new DecryptionFailed(t`Decryption failed.`);
    return resumeSessions(authData);
}

async function resumeSessions(authData: AuthDataFromApp) {
    const allConnectionsFromAuthToken = await FireflyEndpointProvider.getAllConnectionsFromAuthToken(
        authData.firefly_account_token,
    );
    const fireflyProfile = formatFireflyAccountProfileFromFireflyConnections(allConnectionsFromAuthToken.account);
    if (!fireflyProfile) throw new DecryptionFailed(`The firefly account not found.`);
    const fireflySession = new FireflySession(fireflyProfile.uid, authData.firefly_account_token, null, null, false, {
        ...fireflyProfile,
        isNew: false,
    });
    const sessions: Array<FarcasterSession | LensSession | TwitterSession | BskySession> = compact(
        authData.social_accounts.map((account) => {
            const source = account.type;
            switch (source) {
                case SourceInURL.Farcaster:
                    return new FarcasterSession(account.user_id, account.token, 0, 0);
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
    const promises = sessions.map(async (session) => {
        const profile = await resolveSocialMediaProvider(
            resolveSourceFromSessionType(session.type) as SocialSource,
        ).getProfileById(session.profileId);
        return {
            origin: 'sync',
            profile,
            fireflySession,
            session,
        } satisfies Account;
    });
    const settled = await Promise.allSettled(promises);
    const accounts = compact(settled.map((x) => (x.status === 'fulfilled' ? x.value : null)));
    await addAccounts(fireflySession, accounts);
}
