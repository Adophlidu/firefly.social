import type { SourceInURL } from '@/constants/enum.js';

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

export interface SocialAccountLens {
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

export type SocialAccount = SocialAccountTwitter | SocialAccountFarcaster | SocialAccountLens | SocialAccountBsky;

export interface AuthDataFromApp {
    firefly_account_token: string;
    social_accounts: SocialAccount[];
}

export interface AuthDataToUpload extends AuthDataFromApp {
    account_id?: string;
    account_uid?: string;
    display_name?: string | null;
    avatar?: string | null;
}

export interface DesktopSyncPayload {
    twitterAccounts: SocialAccountTwitter[];
    farcasterAccounts: SocialAccountFarcaster[];
    lensAccounts: SocialAccountLens[];
    bskyAccounts: SocialAccountBsky[];
    fireflyAccountData: Omit<AuthDataToUpload, 'social_accounts'>;
}
