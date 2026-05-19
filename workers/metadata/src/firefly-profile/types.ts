import type { NetworkType, RelatedWalletSource, WalletProfileDataSource } from '@dimensiondev/enums';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

export interface VerifiedSource {
    source: RelatedWalletSource;
    provider: string;
    verifiedText: string;
}

export interface LensV3Profile {
    id: string;
    ownedBy: string;
    nameSpace: string;
    localName: string;
    fullHandle: string;
    isDefault?: boolean;
}

export interface FarcasterProfile {
    avatar: {
        url: string;
        verified: boolean;
    };
    bio: string;
    followerCount: number;
    followingCount: number;
    fid: number;
    username: string;
    display_name: string;
    isPowerUser: boolean;
    isProUser?: boolean;
    raw_data: string;
    signer_address: string;
    addresses: string[];
    id: number;
    isDefault?: boolean;
    following?: boolean;
    followedBy?: boolean;
}

export interface TwitterProfile {
    twitter_id: string;
    handle: string;
    source: string;
    provider: string;
    isDefault?: boolean;
}

export interface BskyProfile {
    did: string;
    handle: string;
    isDefault?: boolean;
}

export interface FireflyAccountProfile {
    displayName: string | null;
    avatar: string | null;
    uid: string;
}

export interface WalletProfileIdentity {
    handle: string;
    id: string;
    owner_address: string;
    expire_time?: number;
    is_primary?: boolean;
}

export interface WalletProfile {
    address: `0x${string}`;
    ens?: string[];
    blockchain: NetworkType;
    is_connected: boolean;
    verifiedSources: VerifiedSource[];
    avatar?: string;
    primary_ens?: string | null;
    blocked?: boolean;
    hacked?: boolean;
    isDefault?: boolean;
    dataSource?: WalletProfileDataSource;
    baseEth?: WalletProfileIdentity[];
    sns?: WalletProfileIdentity[];
    seekerId?: WalletProfileIdentity[];
}

export interface WalletProfiles {
    walletProfiles: WalletProfile[];
    solanaWalletProfiles: WalletProfile[];
    lensProfilesV3: LensV3Profile[];
    farcasterProfiles: FarcasterProfile[];
    twitterProfiles: TwitterProfile[];
    fireflyAccountId?: string;
    bskyProfiles: BskyProfile[];
    account?: FireflyAccountProfile;
}

export type WalletsStatusResponse = FireflyResponse<
    Array<{
        address: string;
        is_hack: false;
    }>
>;

export type WalletProfileResponse = FireflyResponse<WalletProfiles | null>;

export type PlatformIdentityKey =
    | 'twitterId'
    | 'twitterHandle'
    | 'walletAddress'
    | 'lensHandle'
    | 'farcasterUsername'
    | 'fid'
    | 'lensProfileId'
    | 'ens'
    | 'solanaAddress'
    | 'bskyDid'
    | 'bskyHandle'
    | 'uid';
