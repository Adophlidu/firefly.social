import { compact } from 'lodash-es';
import { hexToBytes, toHex } from 'viem';

import { Source, SourceInURL } from '@/constants/enum.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import type { AuthDataFromApp } from '@/services/loginWithAppScan.js';

interface AuthDataToUpload extends AuthDataFromApp {
    account_id?: string;
    account_uid?: string;
    display_name?: string | null;
    avatar?: string | null;
}

const APP_LOGIN_ENCRYPT_IV = '0x4f05c37c16c801c2516b0338a8fd0cf9';

async function encrypt(plainText: string, cryptoKey: string) {
    const iv = hexToBytes(APP_LOGIN_ENCRYPT_IV);

    const cryptoBytes = new TextEncoder().encode(cryptoKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', cryptoBytes);
    const aesKey = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-CBC' }, false, ['encrypt']);

    const plainBytes = new TextEncoder().encode(plainText);
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-CBC',
            iv,
        },
        aesKey,
        plainBytes,
    );

    return toHex(new Uint8Array(encryptedBuffer));
}

interface SocialAccountTwitter {
    type: SourceInURL.X;
    user_id: string;
    handle: string;
    consumerKey: string;
    consumerKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
}

interface SocialAccountFarcaster {
    type: SourceInURL.Farcaster;
    user_id: string;
    handle: string;
    token: string;
}

interface SourceAccountLens {
    type: SourceInURL.Lens;
    user_id: string; // address
    handle: string;
    idToken: string;
    accessToken: string;
    refreshToken: string;
}

interface SocialAccountBsky {
    type: SourceInURL.Bsky;
    user_id: string; // did
    handle: string;
    accessJwt: string;
    refreshJwt: string;
}

type SocialAccount = SocialAccountTwitter | SocialAccountFarcaster | SourceAccountLens | SocialAccountBsky;

/**
 * Encrypt login account payload for transmission to the app.
 * This function should be called on the client side.
 */
export async function encryptLoginAppAccountPayload(cryptoKey: string): Promise<string> {
    const fireflySession = getSessionFromStorage(SessionType.Firefly);
    if (!fireflySession?.token) throw new Error('Firefly session not found');

    const farcasterProfile = getCurrentProfileFromStorage(Source.Farcaster);
    const lensProfile = getCurrentProfileFromStorage(Source.Lens);
    const twitterProfile = getCurrentProfileFromStorage(Source.Twitter);
    const bskyProfile = getCurrentProfileFromStorage(Source.Bsky);

    const farcasterSession = getSessionFromStorage(SessionType.Farcaster);
    const lensSession = getSessionFromStorage(SessionType.Lens);
    const twitterSession = getSessionFromStorage(SessionType.Twitter);
    const bskySession = getSessionFromStorage(SessionType.Bsky);

    const socialAccounts = compact<SocialAccount>([
        farcasterProfile && farcasterSession
            ? ({
                  type: SourceInURL.Farcaster,
                  user_id: farcasterSession.profileId.toString(),
                  handle: farcasterProfile.handle || farcasterProfile.fullHandle || farcasterProfile.displayName || '',
                  token: farcasterSession?.token,
              } satisfies SocialAccountFarcaster)
            : null,
        lensProfile && lensSession
            ? ({
                  type: SourceInURL.Lens,
                  user_id: lensSession.profileId.toString(),
                  handle: lensProfile.handle || lensProfile.fullHandle || '',
                  idToken: lensSession.identityToken || '',
                  accessToken: lensSession.token,
                  refreshToken: lensSession.refreshToken || '',
              } satisfies SourceAccountLens)
            : null,
        twitterProfile && twitterSession
            ? ({
                  type: SourceInURL.X,
                  user_id: twitterSession.profileId.toString(),
                  handle: twitterProfile.handle || '',
                  consumerKey: twitterSession.payload?.consumerKey || '',
                  consumerKeySecret: twitterSession.payload?.consumerSecret || '',
                  accessToken: twitterSession.payload?.accessToken || '',
                  accessTokenSecret: twitterSession.payload?.accessTokenSecret || '',
              } satisfies SocialAccountTwitter)
            : null,
        bskyProfile && bskySession
            ? ({
                  type: SourceInURL.Bsky,
                  user_id: bskySession.profileId.toString(),
                  handle: bskyProfile.handle || '',
                  accessJwt: bskySession.sessionPayload?.accessJwt || '',
                  refreshJwt: bskySession.sessionPayload?.refreshJwt || '',
              } satisfies SocialAccountBsky)
            : null,
    ]);

    const payload = {
        firefly_account_token: fireflySession.token,
        social_accounts: socialAccounts,
        account_id: fireflySession?.payload?.accountId,
        account_uid: fireflySession?.payload?.uid,
        display_name: fireflySession?.payload?.displayName,
        avatar: fireflySession?.payload?.avatar,
    } satisfies AuthDataToUpload;

    const jsonString = JSON.stringify(payload);
    return encrypt(jsonString, cryptoKey);
}
