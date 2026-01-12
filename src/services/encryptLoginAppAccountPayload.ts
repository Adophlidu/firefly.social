import { Source, SourceInURL } from '@/constants/enum.js';
import { encrypt } from '@/helpers/encodec.js';
import { getAccountsFromStorage } from '@/helpers/getAccountsFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { type BskySession } from '@/providers/bsky/Session.js';
import { type FarcasterSession } from '@/providers/farcaster/Session.js';
import { type LensSession } from '@/providers/lens/Session.js';
import { type TwitterSession } from '@/providers/twitter/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { type AuthDataFromApp } from '@/services/loginWithAppScan.js';

interface AuthDataToUpload extends AuthDataFromApp {
    account_id?: string;
    account_uid?: string;
    display_name?: string | null;
    avatar?: string | null;
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

    const farcasterAccounts = getAccountsFromStorage(Source.Farcaster);
    const lensAccounts = getAccountsFromStorage(Source.Lens);
    const twitterAccounts = getAccountsFromStorage(Source.Twitter);
    const bskyAccounts = getAccountsFromStorage(Source.Bsky);

    const farcasterSocialAccounts: SocialAccountFarcaster[] = farcasterAccounts.map(({ profile, session }) => ({
        type: SourceInURL.Farcaster,
        user_id: session.profileId.toString(),
        handle: profile.handle || profile.fullHandle || profile.displayName || '',
        token: (session as FarcasterSession).token,
    }));

    const lensSocialAccounts: SourceAccountLens[] = lensAccounts.map(({ profile, session }) => ({
        type: SourceInURL.Lens,
        user_id: session.profileId.toString(),
        handle: profile.handle || profile.fullHandle || '',
        idToken: (session as LensSession).identityToken || '',
        accessToken: session.token,
        refreshToken: (session as LensSession).refreshToken || '',
    }));

    const twitterSocialAccounts: SocialAccountTwitter[] = twitterAccounts.map(({ profile, session }) => ({
        type: SourceInURL.X,
        user_id: session.profileId.toString(),
        handle: profile.handle || '',
        consumerKey: (session as TwitterSession).payload?.consumerKey || '',
        consumerKeySecret: (session as TwitterSession).payload?.consumerSecret || '',
        accessToken: (session as TwitterSession).payload?.accessToken || '',
        accessTokenSecret: (session as TwitterSession).payload?.accessTokenSecret || '',
    }));

    const bskySocialAccounts: SocialAccountBsky[] = bskyAccounts.map(({ profile, session }) => ({
        type: SourceInURL.Bsky,
        user_id: session.profileId.toString(),
        handle: profile.handle || '',
        accessJwt: (session as BskySession).sessionPayload?.accessJwt || '',
        refreshJwt: (session as BskySession).sessionPayload?.refreshJwt || '',
    }));

    const socialAccounts: SocialAccount[] = [
        ...farcasterSocialAccounts,
        ...lensSocialAccounts,
        ...twitterSocialAccounts,
        ...bskySocialAccounts,
    ];

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
