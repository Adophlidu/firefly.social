import type { ReactNode } from 'react';
import type { Address, Hex } from 'viem';

import {
    BetsPlatform,
    BookmarkType,
    ExploreSwitchType,
    FireflyPlatform,
    MintStatus,
    NetworkType,
    PolymarketBetType,
    S3ConvertStatus,
    type SocialSourceInURL,
    type Source,
    SourceInURL,
    SparksAccountStatus,
    TipsNotificationType,
    WalletSource,
} from '@/constants/enum.js';
import type { ErcType, EVM } from '@/providers/nft-scan/types.js';
import type { SnapshotActivity, SnapshotChoice, SnapshotProposal } from '@/providers/snapshot/type.js';
import type { Article as FormattedArticle, ArticlePlatform, ArticleType } from '@/providers/types/Article.js';
import type { CoinGeckoAsset } from '@/providers/types/CoinGecko.js';
import type { Token as DebankToken } from '@/providers/types/Debank.js';
import type { NFTFeedV3 } from '@/providers/types/NFTs.js';
import { NotificationType as SocialNotificationType } from '@/providers/types/SocialMedia.js';
import type { LiteralOrString } from '@/types/utility.js';

export enum EmbedMediaType {
    IMAGE = 'image',
    NFT = 'nft',
    AUDIO = 'audio',
    FONT = 'font',
    VIDEO = 'video',
    TEXT = 'text',
    FRAME = 'frame',
    CAST = 'cast',
    APPLICATION = 'application',
    UNKNOWN = 'unknown',
}

export enum TokenPlatformType {
    Cex = 'cex',
    Dex = 'dex',
}

export interface Cast {
    fid: string;
    hash: string;
    text: string;
    channel?: Channel;
    parent_hash?: string;
    parent_fid?: string;
    parent_url?: string;
    embeds: Array<{ url: string }>;
    embed_urls?: Array<{ url: string; type?: EmbedMediaType }>;
    mentions: string[];
    mentions_positions: number[];
    mentions_user: Array<{
        fid: string;
        handle: string;
    }>;
    created_at: string;
    /** example 2024-05-06T10:22:42.152Z */
    deleted_at: string | null;
    likeCount: number;
    recastCount: number;
    quotedCount: number;
    /** numeric string */
    replyCount: string;
    parentCast?: Cast;
    liked: boolean;
    recasted: boolean;
    bookmarked: boolean;
    author?: User;
    recastedBy?: User;
    timestamp?: string;
    rootParentCast?: Cast;
    root_parent_hash?: string;
    threads?: Cast[];
    quotedCast?: Cast;
    sendFrom?: {
        display_name: string;
        name: string;
        bio: string;
        fid: number;
        pfp: string;
    };
}

export interface User {
    pfp: string;
    username: string;
    display_name: string;
    bio?: string;
    following: number;
    followers: number;
    addresses: string[];
    solanaAddresses: string[];
    fid: string;
    isFollowing?: boolean;
    /** if followed by the user, no relation to whether you follow the user or not */
    isFollowedBack?: boolean;
    isPowerUser?: boolean;
    isProUser?: boolean;
}

export interface Profile {
    platform_id: string;
    platform: FireflyPlatform;
    handle: string;
    name: string;
    hit: boolean;
    score: number;
    avatar?: string;
    owner?: string;
    primary?: boolean;
    // wallet profile
    resolved_address?: string;
    primary_address?: string;
    registrant?: string;
    wrapped_owner?: string;
    // related social profiles
    related_profiles?: Profile[];
    special?: boolean;
    // firefly account uid
    uid?: string;
}

interface UsersData {
    list: User[];
    total: number;
    next_cursor: string;
}

export enum NotificationType {
    CastBeLiked = 1,
    CastBeRecasted = 2,
    CastBeReplied = 3,
    BeFollowed = 4,
    BeMentioned = 5,
    BeQuoted = 7,
}

export interface Notification {
    cast: Cast | null;
    notificationType: NotificationType;
    user: User | null;
    users: User[] | null;
    timestamp: string;
}

export interface ChannelProfile {
    active_status: LiteralOrString<'active'>;
    custody_address: string;
    display_name: string;
    fid: number;
    username: string;
    follower_count: number;
    following_count: number;
    isFollowedBack?: boolean;
    isFollowing?: boolean;
    pfp_url: string;
    power_badge: boolean;
    profile?: {
        bio?: {
            text: string;
            mentioned_profiles: Array<{
                username: string;
                pfp_url: string;
                fid: number;
                object: string;
                display_name: string;
                custody_address: string;
            }>;
            mentioned_channels: Array<{
                id: string;
                image_url: string;
                name: string;
                object: string;
            }>;
        };
    };
    verifications?: string[];
    verified_addresses?: Record<'eth_addresses' | 'sol_addresses', string[]>;
}

export interface Channel {
    id: string;
    image_url: string;
    name: string;
    // e.g., 1689888729
    createdAt?: number;
    created_at?: number;
    description: string;
    follower_count?: number;
    url: string;
    parent_url: string;
    lead?: ChannelProfile;
    hosts?: ChannelProfile[];
}

export interface ChannelProfileBrief {
    addresses: string[];
    bio: string;
    display_name: string;
    fid: number;
    followers: number;
    following: number;
    isFollowedBack: boolean;
    isFollowing: boolean;
    pfp: string;
    username: string;
}

export interface ChannelBrief {
    // e.g., 1710554170
    created_at?: number;
    // Different interfaces have different field names.
    createdAt?: number;
    description: string;
    id: string;
    image_url: string;
    name: string;
    parent_url: string;
    url: string;
    follower_count?: number;
    lead?: ChannelProfileBrief;
    hostFids?: number[];
}

interface MirrorArticleAuthorship {
    contributor: string;
    signingKey: string;
    signature: string;
    signingKeySignature: string;
    signingKeyMessage: string;
    algorithm: {
        name: string;
        hash: string;
    };
}

export interface Article {
    timestamp: string;
    hash: string;
    owner: Address;
    digest: string;
    type: ArticleType;
    platform: ArticlePlatform;
    content: {
        body: string;
        title: string;
    };
    contents: {
        body: string;
        title: string;
    };
    author: string;
    displayInfo: FireflyDisplayInfo;
    authorship:
        | {
              id: string;
              avatar: string;
              userName: string;
              displayName: string;
              info: {
                  ethAddress: string;
              };
          }
        | MirrorArticleAuthorship
        | null;
    related_urls: string[];
    article_id: string;
    cover_img_url: string | null;
    has_bookmarked?: boolean;
    followingSources: FollowingSource[];
    paragraph_raw_data?: {
        slug: string;
        staticHtml: string;
        json: string;
        contributors: string[];
    };
    is_like?: boolean;
    like_count?: number;
}

export interface FireflySnapshotActivity {
    id: string;
    timestamp: string;
    hash: string;
    owner: Address;
    is_like: boolean;
    like_count: number;
    // only support vote type
    type: 'vote';
    related_urls: string[];
    metadata: {
        proposal_id: string;
        choice: SnapshotChoice;
        proposal_title: string;
        proposal_body: string;
    };
    displayInfo: FireflyDisplayInfo;
    followingSources: FollowingSource[];
    has_bookmarked: boolean;
}

export type DiscoverSnapshotsResponse = Response<{
    cursor: number;
    result: FireflySnapshotActivity[];
}>;

export type FollowingSnapshotActivity = SnapshotActivity & {
    proposal?: SnapshotProposal;
};

export interface Response<T> {
    code: number;
    data?: T;
    error?: string[];
}

interface Relationship {
    id: string;
    address: string;
    snsId: string;
    snsPlatform: string;
}

export type UsersResponse = Response<UsersData>;

export type MutualFollowersResponse = Response<{
    list: User[];
    total: number;
}>;

export type BlockedUsersResponse = Response<{
    page: number;
    nextPage: number;
    blocks: Relationship[];
}>;

export type BlockedChannelsResponse = Response<{
    blocks: Array<{
        channel_id: string;
        channel_url: string;
        create_at: string;
    }>;
    hasMore: boolean;
}>;

export type UserResponse = Response<User>;

export type ReactorsResponse = Response<{
    items: User[];
    nextCursor: string;
}>;

export type CastResponse = Response<Cast>;

export type CastsResponse = Response<{
    casts: Cast[];
    cursor: string;
}>;

export type SearchCastsResponse = Response<
    | Cast[]
    | {
          casts: Cast[];
          currentPage: number;
          pageSize: string;
      }
>;

type SearchProfileListItem = Record<SocialSourceInURL | 'eth' | 'solana' | 'ens' | 'account', Profile[] | null>;

export type SearchProfileResponse = Response<{
    list?: SearchProfileListItem[];
    cursor: number;
    size: number;
}>;

export type NotificationResponse = Response<{ notifications: Notification[]; cursor: string }>;

export type CommentsResponse = Response<{
    comments: Cast[];
    cursor: string;
}>;

export interface S3ConnectionConfig {
    bucket: string;
    cdnHost: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
}
export type UploadMediaTokenResponse = Response<S3ConnectionConfig>;

export type FriendshipResponse = Response<{
    isFollowing: boolean;
    isFollowedBack: boolean;
}>;

export type ThreadResponse = Response<{
    threads: Cast[];
}>;

export type LoginResponse = Response<{
    accessToken: string;
    accountId: string; // uuid
    farcaster_signer_public_key?: string;
    farcaster_signer_private_key?: string;
    isNew: boolean;
    fid?: number;
    uid?: string;
    avatar?: string;
    displayName?: string;
    telegram_username?: string;
    telegram_user_id?: string;
}>;

export type TelegramLoginBotResponse = Response<{
    url: string;
    tgUrl: string;
}>;

export type BindResponse = Response<{
    fid: number;
    farcaster_signer_public_key?: string;
    farcaster_signer_private_key?: string;
    account_id: string;
    account_raw_id: number;
    twitters: Array<{
        id: string;
        handle: string;
    }>;
    wallets: Array<{
        _id: number;
        id: string; // the wallet address as id
        createdAt: string;
        connectedAt: string;
        updatedAt: string;
        address: string;
        chain: string;
        ens: unknown;
    }>;
}>;

export type ChannelResponse = Response<{
    channel: ChannelBrief | null;
    blocked: boolean;
}>;

export type ChannelsResponse = Response<Channel[]>;

export type DiscoverChannelsResponse = Response<
    Array<{
        channel: Channel;
    }>
>;

export type DiscoverArticlesResponse = Response<{
    cursor: number;
    result: Article[];
}>;

export type GetArticleDetailResponse = Response<Article[]>;

export type GetFollowingArticlesResponse = Response<{
    cursor: number;
    result: Article[];
}>;

export type CastsOfChannelResponse = Response<{
    casts: Cast[];
    cursor: string;
    channel: Channel;
}>;

export type PostQuotesResponse = Response<{
    quotes: Cast[];
    cursor: string;
}>;

export type SearchChannelsResponse = Response<{
    channels: ChannelBrief[];
    cursor: string;
}>;

export enum RelatedWalletSource {
    firefly = 'firefly',
    cyber = 'cyber',
    hand_writing = 'hand_writing',
    opensea = 'opensea',
    pfp = 'pfp',
    rss3 = 'rss3',
    twitter_hexagon = 'twitter_hexagon',
    uniswap = 'uniswap',
    ethLeaderboard = 'web ens data',
    lens = 'lens',
    farcaster = 'farcaster',
    other = 'other',
    twitter = 'twitter',
    particle = 'particle',
}

export enum WatchType {
    Wallet = 'wallet',
    SolanaWallet = 'solana',
    MaskX = 'maskx',
    Twitter = 'twitter',
    Lens = 'lens',
    Farcaster = 'farcaster',
}

export interface FollowingSource {
    id?: string;
    handle?: string;
    name?: string;
    type: WatchType;
    socialId?: string;
    walletAddress?: Address;
}

export interface VerifiedSource {
    source: RelatedWalletSource;
    provider: string;
    verifiedText: string;
}

export const enum WalletProfileDataSource {
    Particle = 'particle',
    Privy = 'privy',
}

export interface WalletProfile {
    address: Address;
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
}

export type WalletRelationResponse = Response<{
    address: Address;
    wallet_type: 'evm' | 'solana';
    verifiedSources: VerifiedSource[];
    ens?: string[];
    blockchain: NetworkType;
    is_connected: boolean;
    avatar?: string;
    primary_ens?: string | null;
}>;

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

export interface FireflyFarcasterProfile {
    addresses: Address[];
    followers: number;
    following: number;
    isPowerUser: boolean;
    fid: number;
    username: string;
    display_name: string;
    bio: string;
    pfp: string;
    isFollowing: boolean;
    isFollowedBack: boolean;
    isProUser?: boolean;
}

export type FireflyFarcasterProfileResponse = Response<FireflyFarcasterProfile>;

interface TwitterProfile {
    twitter_id: string;
    handle: string;
    source: string;
    provider: string;
    isDefault?: boolean;
}

interface BskyProfile {
    did: string;
    handle: string;
    isDefault?: boolean;
}

export interface FireflyAccountProfile {
    displayName: string | null;
    avatar: string | null;
    uid: string;
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

export type WalletProfileResponse = Response<WalletProfiles | null>;

export interface FireflyProfile {
    identity: FireflyIdentity;
    displayName: string;
    handle: string;
    isDefault?: boolean;
    __origin__: WalletProfile | LensV3Profile | FarcasterProfile | TwitterProfile | BskyProfile | null;
}

export interface FireflyTipsProfile extends FireflyProfile {
    address: string;
    networkType: NetworkType;
    avatar?: string;
    ens?: string;
}

export type BookmarkResponse<T> = Response<{
    cursor: number;
    list: Array<{
        account_id: string;
        /** e.g. twitter, lens, farcaster, article */
        platform: string;
        platform_id: string;
        post_id: string;
        post_content?: T;
    }>;
}>;

export type DigestResponse = Response<{
    type: string;
    paragraph?: {
        id: string;
    };
}>;

export type BlockFields = 'twitterId' | 'lensId' | 'fid' | 'address';
export type BlockUserResponse = Response<Relationship[]>;

export type BlockChannelResponse = Response<{
    identifiers: Array<{ channel_id: string; account_id: string }>;
    generatedMaps: Array<{ create_at: string; update_at: string }>;
    raw: Array<{ create_at: string; update_at: string }>;
}>;

export type BlockRelationResponse = Response<
    Array<{
        snsId: string;
        snsPlatform: FireflyPlatform;
        blocked: boolean;
    }>
>;

export type ReportCrossPostResponse = Response<void>;

export type WalletsFollowStatusResponse = Response<
    Array<{
        address: string;
        is_followed: boolean;
    }>
>;

export type EmptyResponse = Response<void>;

export type HexResponse = Response<Hex>;

export type DebankTokensResponse = Response<{
    list: DebankToken[];
}>;

export enum PostMediaType {
    Text = 'text',
    Image = 'image',
    Video = 'video',
    Audio = 'audio',
    Vote = 'vote',
    Redpacket = 'redpacket',
    Other = 'other',
}
export interface SchedulePostPayload {
    platform: SocialSourceInURL;
    platformUserId: string;
    payload: string;
}

export enum ScheduleTaskStatus {
    Pending = 'pending',
    Failed = 'fail',
    Success = 'success',
}

interface ScheduleRelation {
    content: string;
    error?: string;
    platform: SocialSourceInURL;
    platform_id: string;
    post_id: string | null;
    relation_id: string;
    status: ScheduleTaskStatus;
    task_uuid: string;
    updated_at: string;
    media_type?: PostMediaType[];
}

export interface ScheduleTask {
    task_uuid: string;
    schedule_at: string;
    relation_id: string;
    relation: ScheduleRelation[];
}

export type ScheduleTasksResponse = Response<{
    posts: ScheduleTask[];
    cursor: string | null;
}>;

export type BindWalletResponse = Response<{
    id: string;
    address: Address;
    ens: string;
    is_connected: boolean;
    blockchain: NetworkType;
    signMessage: string;
    signature: string;
}>;

export type IsMutedAllResponse = Response<{
    isBlockAll: boolean;
}>;

export type MuteAllResponse = Response<Relationship[]>;

export interface FarcasterSuggestedFollowUser {
    pfp: string;
    display_name: string;
    bio: string;
    username: string;
    following: number;
    followers: number;
    addresses: string[];
    fid: number;
    isFollowing: boolean;
    isFollowedBack: boolean;
    solanaAddresses: string[];
}

export type GetFarcasterSuggestedFollowUserResponse = Response<{
    suggestedFollowList: FarcasterSuggestedFollowUser[];
    cursor: number;
}>;

export interface LensConnection extends LensV3Profile {
    connectedAt?: string;
    ownedBy: string;
}

export interface FarcasterConnection {
    bio: string;
    connectedAddresses: string[];
    display_name: string;
    fid: number;
    pfp: string;
    username: string;
    connectedAt?: string;
    isDefault?: boolean;
    url: string;
    id: number;
}

export interface TwitterConnection {
    handle: string;
    connectedAt?: string;
    id: string;
    isDefault?: false;
    name: string;
    platform: 'twitter';
}

interface TwitterConnectionDisconnected {
    address: string;
    isDefault: boolean;
    twitters: TwitterConnection[];
}

export interface BskyConnection {
    connected: boolean;
    id: string;
    isDefault?: boolean;
    name: string;
    platform: 'bsky';
}

export interface WalletConnection {
    address: string;
    avatar: string;
    canReport: boolean;
    ens: string[];
    platform: 'eth' | 'solana';
    provider: string;
    source: WalletSource;
    sources?: WalletProfile['verifiedSources'];
    twitterId: string;
    isDefault?: boolean;
    isConnected?: boolean;
}

export interface FireflyIdentity {
    id: string;
    source: Source;
}

export type FireflyWalletConnection = WalletConnection & {
    identities: FireflyIdentity[];
};

interface GoogleConnection {
    connected?: boolean;
    email: string;
    id: string;
    name: string;
    platform: string;
}

type AppleConnection = GoogleConnection;

interface TelegramConnection {
    connected?: boolean;
    handle: string;
    id: string;
    name: string;
    platform: string;
    provider: string;
    source: string;
    sources: VerifiedSource[];
}

interface EmailConnection {
    email: string;
    id: string;
    name: string;
    platform: string;
    connected?: boolean;
}

export interface FireflyConnection {
    account_id: { high: number; low: number };
    id: string;
    name: string;
    platform: string;
    connected?: boolean;
    uid?: string;
    avatar?: string;
    displayName?: string;
}

interface FireflyBaseConnections {
    account: FireflyConnection[];
    farcaster: Record<'connected' | 'unconnected', FarcasterConnection[]>;
    lens: Record<
        'connected' | 'unconnected',
        Array<{
            address: string;
            lens: LensConnection[];
        }>
    >;
    bsky: Record<'connected' | 'unconnected', BskyConnection[]>;
    wallet: Record<
        'connected' | 'unconnected' | 'connectedEVM' | 'connectedSolana' | 'unconnectedSolana' | 'unconnectedEVM',
        WalletConnection[]
    >;
    google: Record<'connected' | 'unconnected', GoogleConnection[]>;
    telegram: Record<'connected' | 'unconnected', TelegramConnection[]>;
    apple: Record<'connected' | 'unconnected', AppleConnection[]>;
    email: Record<'connected' | 'unconnected', EmailConnection[]>;
}

export type AllConnections = FireflyBaseConnections & {
    twitter: Record<'connected' | 'unconnected', TwitterConnection[]>;
};

export type GetAllConnectionsResponse = Response<
    FireflyBaseConnections & {
        twitter: {
            connected: TwitterConnection[];
            unconnected: TwitterConnectionDisconnected[];
        };
    }
>;

export type ConvertM3u8Response = Response<{
    m3u8Url: string;
    jobId: string;
}>;

export type ConvertM3u8StatusResponse = Response<{
    code: boolean;
    jobId: string;
    status: S3ConvertStatus;
}>;

export enum ActivityStatus {
    Upcoming = 0,
    Active = 1,
    Ended = 2,
}

export interface ActivityListItem {
    id: number;
    name: string;
    title: string;
    sub_title: string;
    description: string;
    url: string;
    banner_url: string;
    cover_url: string;
    icon_url: string;
    ext: string;
    start_time: string;
    end_time: string;
    status: ActivityStatus;
}

export type ActivityListResponse = Response<{
    list: ActivityListItem[];
    cursor: number;
    size: number;
}>;

enum TwitterUserInfoLabelType {
    BusinessLabel = 'BusinessLabel',
}

enum TwitterUserInfoLabelDisplayType {
    Badge = 'Badge',
}

enum TwitterUserInfoLabelUrlType {
    DeepLink = 'DeepLink',
}

export enum TwitterUserInfoVerifiedType {
    Government = 'Government',
}

interface TwitterUserInfoLabel {
    url: {
        url: string;
        urlType: TwitterUserInfoLabelUrlType;
    };
    badge: {
        url: string;
    };
    description: string;
    userLabelType: TwitterUserInfoLabelType;
    userLabelDisplayType: TwitterUserInfoLabelDisplayType;
}

interface TwitterUserInfoEntities {
    display_url: string;
    expanded_url: string;
    url: string;
    indices: number[];
}

export enum TwitterUserInfoProfileImageShape {
    Square = 'Square',
    Circle = 'Circle',
}

interface TwitterUserInfo {
    __typename: string;
    id: string;
    rest_id: string;
    affiliates_highlighted_label: {
        label?: TwitterUserInfoLabel;
    };
    has_graduated_access: boolean;
    is_blue_verified: boolean;
    profile_image_shape: TwitterUserInfoProfileImageShape;
    legacy: {
        following: boolean;
        can_dm: boolean;
        can_media_tag: boolean;
        created_at: string;
        default_profile: boolean;
        default_profile_image: boolean;
        description: string;
        entities: {
            description: {
                urls: TwitterUserInfoEntities[];
            };
            url: {
                urls: TwitterUserInfoEntities[];
            };
        };
        fast_followers_count: number;
        favourites_count: number;
        followers_count: number;
        friends_count: number;
        has_custom_timelines: boolean;
        is_translator: boolean;
        listed_count: number;
        location: string;
        media_count: number;
        name: string;
        normal_followers_count: number;
        pinned_tweet_ids_str: string[];
        possibly_sensitive: boolean;
        profile_banner_url: string;
        profile_image_url_https: string;
        profile_interstitial_type: string;
        screen_name: string;
        statuses_count: number;
        translator_type: string;
        url: string;
        verified: boolean;
        verified_type?: TwitterUserInfoVerifiedType;
        want_retweets: boolean;
    };
    professional: {
        rest_id: string;
        professional_type: string;
        category: Array<{
            id: number;
            name: string;
            icon_name: string;
        }>;
    };
    tipjar_settings: {
        is_enabled: boolean;
        bitcoin_handle: string;
        ethereum_handle: string;
    };
    smart_blocked_by: boolean;
    smart_blocking: boolean;
    legacy_extended_profile: {
        birthdate: {
            year: number;
            visibility: string;
            year_visibility: string;
        };
    };
    is_profile_translatable: boolean;
    has_hidden_subscriptions_on_profile: boolean;
    verification_info: {
        is_identity_verified: boolean;
        reason: {
            description: {
                text: string;
                entities: Array<{
                    from_index: number;
                    to_index: number;
                    ref: {
                        url: string;
                        url_type: string;
                    };
                }>;
            };
            verified_since_msec: string;
        };
    };
    highlights_info: {
        can_highlight_tweets: boolean;
        highlighted_tweets: string;
    };
    user_seed_tweet_count: number;
    business_account: {};
    creator_subscriptions_count: number;
}

export type TwitterUserInfoResponse = Response<{
    data: {
        user: {
            result: TwitterUserInfo;
        };
    };
}>;

export interface UserV2 {
    id: string;
    name: string;
    username: string;
    created_at?: string;
    protected?: boolean;
    withheld?: {
        country_codes?: string[];
        scope?: 'user';
    };
    location?: string;
    url?: string;
    description?: string;
    verified?: boolean;
    verified_type?: 'none' | 'blue' | 'business' | 'government';
    entities?: {
        url?: {
            urls: unknown[];
        };
        description: {
            urls?: unknown[];
            hashtags?: unknown[];
            cashtags?: unknown[];
            mentions?: unknown[];
        };
    };
    profile_image_url?: string;
    public_metrics?: {
        followers_count?: number;
        following_count?: number;
        tweet_count?: number;
        listed_count?: number;
        like_count?: number;
    };
    pinned_tweet_id?: string;
    connection_status?: string[];
}

export type TwitterUserV2Response = Response<UserV2>;

export type ActivityInfoResponse = Response<{
    id: number;
    name: string;
    title: string;
    sort: number;
    is_offline: number;
    sub_title: string;
    description: string;
    url: string;
    banner_url: string;
    cover_url: string;
    icon_url: string;
    ext: string;
    start_time: string;
    end_time: string;
    open_graph_url: string;
    status: ActivityStatus;
}>;

export interface BetsActivity {
    asset: string;
    blockNumber: number;
    blockNumberSort: number;
    conditionId: string;
    conditionOutcomePrices: string[];
    conditionOutcomes: string[];
    conditionRawData: {};
    displayInfo: FireflyDisplayInfo;
    endDate: string;
    eventSlug: string;
    followingSources: FollowingSource[];
    icon: string;
    image: string;
    outcome: string;
    outcomeIndex: number;
    owner: string;
    price: string;
    proxyWallet: string;
    side: PolymarketBetType;
    size: string;
    slug: string;
    timestamp: number;
    title: string;
    transactionHash: string;
    umaResolutionStatus: string;
    usdcSize: string;
    volume: string;
    wallet: string;
    avgPrice: string;
    position: string;
    hasBookmarked: boolean;
    isLiked: boolean;
    likeCount: number;
    platform: BetsPlatform;
    parent_title: string;
    is_like: boolean;
    like_count: number;
    has_bookmarked: boolean;
    url: string;
}

export interface Project {
    eval: number;
    project_id: number;
    one_liner: string;
    logo: string;
    rank: number;
    token_symbol: string;
    project_name: string;
    tags: string[];
    rootdataurl: string;
}

export interface RootdataPeople {
    people_id: number;
    /**
     * Hot Index / Influence Index
     * @example '86'
     */
    score: string;
    /** url */
    head_img: string;
    /** One sentence introduction */
    one_liner: string;
    people_name: string;
    people_detail: {
        /** numeric string */
        heat: string;
        introduce: string;
        head_image: string;
        one_liner: string;
        linkedin: string;
        investment: string[];
        /** numeric string */
        influence: string;
        people_id: number;
        top_followers: number;
        followers: number;
        education_experience: unknown[];
        following: number;
        x: string;
        heat_rank: number;
        people_name: string;
        influence_rank: number;
        people_x_handle: string;
        x_id: string;
    } | null;
}

export type SearchNFTResponse = Response<{
    list: EVM.Collection[];
}>;

export interface SearchableToken {
    /** only search by keyword has platform_type */
    platform_type?: TokenPlatformType;
    api_symbol: string;
    /** coin id or address */
    id: string;
    chainId?: number;
    address?: string;
    largeLogo: string;
    market_cap_rank?: number;
    name: string;
    symbol: string;
    thumbnail: string;
    fdv?: number;
}

export type SearchTokenResponse = Response<{
    coins: SearchableToken[];
}>;

/** Results from /v2/token/search */
export interface SearchTokenInfo extends Omit<TokenWithMarketData, 'id'> {
    id: string | null;
    platform_type: TokenPlatformType;
    /** coingecko chian id */
    chain: string;
    chain_id: number;
    contract_address: string;
    web_slug: string;
    platforms: {
        [platform: string]: Address;
    };
    platform_info: Array<{
        chain_name: string;
        token_address: Address;
        decimals: number;
        swap: number;
        chain_id: number;
    }>;
}

export type SearchTokenInfosResponse = Response<SearchTokenInfo[]>;

export interface TrendingToken {
    market_cap_usd: string;
    volume_usd: {
        m5: string;
        m15: string;
        m30: string;
        h1: string;
        h6: string;
        h24: string;
    };
    token_price: string;
    deploy_platform?: string;
    deploy_platform_logo?: string;
    price_change?: {
        m5: string;
        m15: string;
        m30: string;
        h1: string;
        h6: string;
        h24: string;
    };
    token_symbol: string;
    token_name: string;
    token_icon: string;
    token_address: string;
    id: string;
    chain_id: string;
    chain_id_num?: number;
    chain_name: string;
}

export type TrendingTokensResponse = Response<TrendingToken[]>;

interface DexCoinDetail {
    symbol: string;
    name: string;
    decimals: number;
    contract_address: string;
    chain_id: string;
    pool_address: string;
    pool_created_at: string;
    holders: number;
    liquidity: string;
    image: {
        thumb: string;
        small: string;
        large: string;
    };
    links: {
        homepage: string[];
        twitter_handle: string;
        discord_url: string;
        telegram_handle: string;
    };
    market_data: {
        token_price_usd: string;
        price_change_percentage_24h: string;
        market_cap_usd: string;
        fdv_usd: string;
        volume_usd_24h: string;
    };
}

export type DexCoinDetailResponse = Response<DexCoinDetail>;

export type GenerateFarcasterSignatureResponse = Response<{
    sponsorSignature: Hex;
    signedKeyRequestSignature: Hex;
    requestFid: number;
}>;

export enum NotificationPushType {
    All = 'all',
    Follows = 'follows',
    Recasts = 'recasts',
    Likes = 'likes',
    Mention = 'mention',
    Reply = 'reply',
    Lens = 'lens',
    Farcaster = 'farcaster',
    Priority = 'priority',
    OnChainLike = 'like',
    OnChainTips = 'tips',
    // cspell: disable-next-line
    OnChainSwap = 'limitday',
    // cspell: disable-next-line
    HideSmallPrice = 'tokenprice',
}

export enum NotificationPlatform {
    Priority = 'priority',
    Lens = 'lens',
    All = 'all',
    OnChain = 'onchain',
    Tips = 'tips',
}

export enum NotificationTitle {
    NotificationsMode = 'Notifications mode',
    Farcaster = 'Farcaster',
    Lens = 'Lens',
    OnChain = 'Swaps',
    Tips = 'Tips',
}

export interface NotificationConfig {
    label: ReactNode;
    description: ReactNode;
    platform: NotificationPlatform;
    pushType: NotificationPushType;
    value: boolean;
    children?: NotificationConfig[];
}

export type NotificationConfigsResponse = Response<{
    push_switch: boolean;
    list: Array<{
        title: string;
        list: Array<{
            state: boolean;
            push_type: NotificationPushType;
            title: string;
            description?: string;
            platform: NotificationPlatform;
            disabled: boolean;
            sub_type?: NotificationPushType[];
        }>;
    }>;
}>;

export type NotificationPushSwitchResponse = Response<{
    push_switch: boolean;
    list: Array<{
        title: NotificationTitle;
        device_id?: string;
        list: Array<{
            account_id: string;
            platform: NotificationPlatform;
            push_type: NotificationPushType;
            title: string;
            state: boolean;
        }>;
    }>;
}>;

export interface SetNotificationPushSwitchParams {
    list: Array<{
        device_id?: string;
        token?: string;
        platform: NotificationPlatform;
        push_type: NotificationPushType;
        state: boolean;
    }>;
}

/** With collection */
export interface NFTDetail extends EVM.Asset {
    collection: EVM.Collection;
}

export type ProjectResponse = Response<Project[]>;

export type RootdataPeopleResponse = Response<{ total: number; items: RootdataPeople[] }>;

export type GetBookmarksResponse = Response<{
    list: Array<{
        has_book_marked: boolean;
        platform: string;
        platform_id: string;
        post_id: string;
        post_type: BookmarkType;
    }>;
}>;

export interface SponsorMintOptions {
    walletAddress: string;
    contractAddress: string;
    tokenId: string;
    chainId: number;
    buyCount: number;
    vectorId?: number;
    color?: string;
    collectionId?: string;
}

export interface MintMetadata {
    mintStatus: MintStatus;
    mintPrice: string;
    platformFee: string;
    txData: {
        gasLimit: string;
        inputData: string;
        to: string;
        value: string;
    };
    mintCount: number;
    perLimitCount: number;
    chainId: number;
    gasStatus: boolean;
    tokenPrice: unknown;
    nativePrice: number;
}

interface FreeMintResult {
    status: boolean;
    hash: string;
    errormessage: string;
    gasStatus: boolean;
}

export type GetSponsorMintStatusResponse = Response<MintMetadata>;

export type MintBySponsorResponse = Response<FreeMintResult>;

export type GetCollectStatusResponse = Response<MintMetadata>;

export type CollectArticleResponse = Response<FreeMintResult>;

export interface DetectedAddress {
    type: 'eth' | 'solana';
    chain: string;
    chain_id: string;
    address_type: 'eoa' | 'soa' | 'contract';
    contract_type: 'ERC20' | 'ERC721' | 'ERC1155' | 'token' | 'nft' | 'program' | 'unknown';
    /** To detect collection, use v1/nft/detect API instead */
    contract_info?: CoinGeckoAsset;
}

export type DetectAddressResponse = Response<{
    list: DetectedAddress[];
}>;

export interface ParagraphMintMetadata {
    blogId: string;
    noteId: string;
    createdAt: number;
    type: string;
    status: string;
    version: number;
    text: string;
    position: any;
    costEth: string;
    supply: string;
    txHash: string;
    chain: string;
    collectorWallet: string;
}

export type NFTMintingResponse = Response<ParagraphMintMetadata>;

export interface NotificationSettings {
    priority: boolean;
}

export type TakoExternalHostedData = Response<{
    content: string;
}>;

export interface GetTokenOptions {
    coingecko_id?: string | null;
    network?: string;
    chain_id?: number;
    address?: string;
    token_symbol?: string;
    localization?: boolean | 'usd' | string;
    tickers?: boolean | 1;
    market_data?: boolean;
    community_data?: boolean;
    developer_data?: boolean;
    sparkline?: boolean;
}

export interface TokenWithMarketData {
    detail_platforms: unknown;
    id: string;
    image: Record<'small' | 'thumb' | 'large', string>;
    platform_type?: TokenPlatformType;
    links: {
        homepage: string[];
        twitter_handle: string;
    };
    market_data?: {
        fully_diluted_valuation: number;
        high_24h_usd: number;
        low_24h_usd: number;
        market_cap_usd: number;
        price_change_percentage_24h: number | null;
        token_price_usd: number;
        volume_usd_24h: number;
    };
    name: string;
    platforms: unknown;
    support_swap_platform: Array<{
        chainIndex: string;
        decimals: string;
        tokenContractAddress: string;
        tokenLogoUrl: string;
        tokenName: string;
        tokenSymbol: string;
    }>;
    platform_info: Array<{
        chain_name: string;
        token_address: string;
        decimals: number;
        swap: number;
        chain_id: number;
    }>;
    symbol: string;
    web_slug: string;
    chain_id: number;
    contract_address: string;
    market_cap_rank: number;
}

export type Bookmarkable<T> = T & {
    /** extends at runtime */
    is_bookmarked: boolean;
};

export type WalletsStatusResponse = Response<
    Array<{
        address: string;
        is_hack: false;
    }>
>;

export type GenerateOTPResponse = Response<string>;

export interface FireflyProfileUpdateParams {
    displayName?: string;
    avatar?: string;
}

interface SwapToken {
    logo: string;
    symbol: string;
    amount_usd: string;
    /** ui amount */
    amount_num: string;
    amount_str: string;
    name: string;
    decimal: number;
    price: string;
    address: string;
}

export interface SwapActivity {
    owner: string;
    chain_id: number;
    tx_status: string;
    error_msg: string;
    hash: string;
    router_address: string;
    dex_name: string;
    dex_logo: string;
    /** timestamp in seconds */
    timestamp: string;
    block_number: string;
    from_token: SwapToken | null;
    to_token: SwapToken | null;
    source: string;
    like_count: number;
    is_like: boolean;
    is_repost: boolean;
    is_cross_chain: boolean;
    repost_count: number;
    to_chain_id?: number;
    to_chain_hash?: string;
    displayInfo?: FireflyDisplayInfo;
    followingSources: FollowingSource[];
}

export interface FireflyDisplayInfo {
    ensHandle: string;
    avatarUrl: string;
    fireflyName: string;
    fireflyUid: string;
    fireflyAvatarUrl: string;
}

export type SwapActivityDetail = Response<SwapActivity[]>;

export type SwapActivityTimeline = Response<{
    result: SwapActivity[];
    cursor?: string;
}>;

export type FollowingTraderCountResponse = Response<{ total: number }>;

export type CollectionResponse = Response<EVM.Collection | null>;
export type CollectionsResponse = Response<{ collections: EVM.Collection[]; cursor: string }>;

export type NFTDetailsResponse = Response<{
    nfts: NFTDetail[];
    cursor: string;
}>;

export interface CollectionHolder {
    address: string;
    value: number;
    /** @example 10% */
    proportion: string;
}

export type HoldersResponse = Response<CollectionHolder[]>;

export type CollectionItemsResponse = Response<{
    content: EVM.Asset[];
    next: string;
    total: number;
}>;

export type CollectionStatisticsResponse = Response<{
    contract_address: string;
    contract_name: string;
    erc_type: ErcType;
    logo_url: string;
    items_total: number;
    owners_total: number;
    lowest_price_24h: number;
    lowest_price_1d: number;
    lowest_price_7d: number;
    lowest_price_30d: number;
    average_price_24h: number;
    volume_24h: number;
    sales_24h: number;
    sales: number;
    sales_1d: number;
    sales_7d: number;
    sales_30d: number;
    highest_price: number;
    volume_1d: number;
    volume_7d: number;
    volume_30d: number;
    total_volume: number;
    volume_change_1d: string;
    volume_change_7d: string;
    volume_change_30d: string;
    market_cap: number;
    average_price_change_1d: string;
    average_price_change_7d: string;
    average_price_change_30d: string;
    floor_price: number;
    sales_1h: number;
    sales_6h: number;
    volume_1h: number;
    volume_6h: number;
    volume_change_1h: string;
    volume_change_6h: string;
}>;

export interface NFTBookmarkContent {
    nft_id: `${number}.${string}.${string}`;
    own_num: 0;
    following_own_num: 0;
}

type Stat = [number, number];

export type TokenPriceStatsResponse = Response<{
    market_caps: Stat[];
    prices: Stat[];
    total_volumes: Stat[];
}>;

export type TransactionsItem = {
    timestamp: number;
    id: string;
} & (
    | {
          source: Source.Swap;
          data: SwapActivity;
      }
    | {
          source: Source.Bets;
          data: BetsActivity;
      }
    | {
          source: Source.NFTs;
          data: NFTFeedV3;
      }
);

export type ActivitiesItem = {
    timestamp: number;
    id: string;
} & (
    | {
          source: Source.Article;
          data: FormattedArticle;
      }
    | {
          source: Source.DAOs;
          data: FollowingSnapshotActivity;
      }
);

export interface TruthSocialPost {
    account: {
        id: string;
        handle: string;
        avatar: string;
        display_name: string;
    };
    truth_id: string;
    content: string;
    post_time: string;
    url: string;
    has_reblog?: boolean;
    media_attachments: Array<{
        id: string;
        url: string;
        meta: Record<
            'small' | 'original',
            {
                size: string;
                width: number;
                aspect: number;
                height: number;
            }
        >;
        type: 'image' | 'video';
        blurhash: string;
        text_url: null | string;
        processing: 'complete';
        remote_url: null | string;
        description: null | string;
        preview_url: null | string;
        external_video_id: null | string;
        preview_remote_url: null | string;
    }>;
}

export type TrumpTruthSocialPostsResponse = Response<{
    result: TruthSocialPost[];
    cursor?: string;
}>;

export type TruthSocialPostResponse = Response<TruthSocialPost>;

export interface TokenPriceStatsOptions {
    coingecko_id?: string | null;
    chain_id?: number;
    address?: string;
    days: number | undefined;
}

export type DesktopLinkInfoResponse = Response<{
    link: string;
    session: string;
    expiresAt: string;
}>;

export const enum DesktopLinkInfoStatus {
    Expired = 'expired',
    Pending = 'pending',
    Confirm = 'confirm',
    Cancel = 'cancel',
}

export type DesktopLinkInfoStatusData =
    | {
          status: Exclude<DesktopLinkInfoStatus, DesktopLinkInfoStatus.Confirm>;
      }
    | {
          status: DesktopLinkInfoStatus.Confirm;
          encryptedData: string;
      };

export type DesktopLinkInfoStatusResponse = Response<DesktopLinkInfoStatusData>;

export type MetricsStatusResponse = Response<{
    metricsCount: number;
    remainTryCount: number;
    retryTimes: number;
    hasSetPasscode?: boolean;
}>;

export type MetricsDownloadResponse = Response<{
    remainTryCount: number;
    metrics: Array<{
        identity: string;
        ciphertext: string;
        metaInfo: MetricsMetaInfo;
    }>;
}>;

export type MetricsDownloadMetaInfoResponse = Response<{
    metrics: Array<{
        identity: string;
        metaInfo: MetricsMetaInfo;
    }>;
}>;

export interface MetricsMetaInfo {
    platform: Exclude<SocialSourceInURL, SourceInURL.Bsky> | 'bluesky';
    profileId: string;
    profileHandle: string;
    loginTime: string;
    name: string;
    avatar: string;
}

export interface CommonMetricsData {
    platform: Exclude<SocialSourceInURL, SourceInURL.Bsky> | 'bluesky';
    profile_id: string;
    login_time: string;
}

export type FarcasterMetricsData = CommonMetricsData & {
    signer_private_key: string;
    signer_public_key: string;
    fid: number;
};

export type TwitterMetricsData = CommonMetricsData & {
    client_id: string;
    access_token: string;
    access_token_secret: string;
    consumer_key: string;
    consumer_secret: string;
};

export type LensMetricsData = CommonMetricsData & {
    token: string;
    refresh_token: string;
    identity_token: string;
    address: string;
};

export interface MetricsItemToUpload {
    ciphertext: string;
    metaInfo: MetricsMetaInfo;
}

interface PostStateEntry {
    post_id: string;
    state: boolean;
}

export type PostState = Response<PostStateEntry>;

export type PostListState = Response<PostStateEntry[]>;

interface TipsNotificationAccountInfo {
    account_uid: string;
    avatar: string | null;
    createdAt: string;
    createdPlatform: 'maskx';
    deletedAt: string | null;
    displayName: string | null;
    id: string;
    lastLoginAt: string;
    privyUserid: string | null;
    status: 'active';
    updatedAt: string;
    _id: number;
}

export interface TipsNotificationData {
    notification_type: TipsNotificationType;
    tx_hash: string;
    timestamp: string;
    from_account_info?: TipsNotificationAccountInfo;
    to_account_info?: TipsNotificationAccountInfo;
    liker_account_info?: TipsNotificationAccountInfo;
    amount: string;
    token_symbol: string;
    token_icon: string;
    chain_id: number;
    has_liked: boolean;
    has_reposted: boolean;
    token_address: string;
    fromAddress: string;
    toAddress: string;
    tokenPrice: string;
    tokenName: string;
}

export interface TipsNotification {
    source: Source.Firefly;
    type: SocialNotificationType.Tips;
    data: TipsNotificationData;
    timestamp: number;
    notificationId: string;
}

export type TipsNotificationsResponse = Response<{
    data: TipsNotificationData[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}>;

export interface TipsAccountInfo {
    firefly_uid: string;
    firefly_uuid: string;
    firefly_avatar: string;
    firefly_name: string;
}

export interface TipsDetail {
    status: 'success';
    notification_type: TipsNotificationType;
    chain_id: number;
    tx_hash: string;
    height: number;
    timestamp: number;
    from_address: string;
    to_address: string;
    amount: string;
    token_price: string;
    token_symbol: string;
    token_name: string;
    token_icon: string;
    token_address: string;
    token_type: string;
    tips_memos: string;
    has_liked: boolean;
    has_reposted: boolean;
    from_account?: TipsAccountInfo;
    to_account?: TipsAccountInfo;
}

export type TipsDetailResponse = Response<TipsDetail | null>;

export interface TipsLikeStatusData {
    txHash: string;
    chainId: number;
    fromAddress: string;
    isLiked: boolean;
    likeCount?: number;
}

interface PrivyWallet {
    accountId: string;
    userId: string;
    createAt: number;
    wallets: [
        {
            publicAddress: Address;
            chain: NetworkType.Ethereum;
            verified_at: number;
        },
        {
            publicAddress: string;
            chain: NetworkType.Solana;
            verified_at: number;
        },
    ];
}

export type PrivyWalletResponse = Response<PrivyWallet>;

export interface TrendingNFT {
    contract_address: string;
    contract_name: string;
    symbol: string;
    logo_url: string;
    banner_url: string;
    items_total: number;
    owners_total: number;
    verified: boolean;
    opensea_verified: boolean;
    sales_1d: number;
    sales_7d: number;
    sales_30d: number;
    sales_total: number;
    sales_change_1d: string;
    sales_change_7d: string;
    sales_change_30d: string;
    volume_1d: number;
    volume_7d: number;
    volume_30d: number;
    volume_total: number;
    floor_price: number;
    average_price_1d: number;
    average_price_7d: number;
    average_price_30d: number;
    average_price_total: number;
    average_price_change_1d: string;
    average_price_change_7d: string;
    average_price_change_30d: string;
    volume_change_1d: string;
    volume_change_7d: string;
    volume_change_30d: string;
    market_cap: number;
    chain_id: number;
    price_symbol: string;
    /** NFTScan collection */
    collection: EVM.Collection;
}

export type TrendingNFTsResponse = Response<TrendingNFT[]>;

export interface TokenAsset {
    chainIndex: string;
    name: string;
    symbol: string;
    decimals: string;
    tokenLogoUrl: string;
    tokenAddress: string;
    address: string;
    balance: string;
    tokenPrice: string;
    tokenType: string;
    isRiskToken: boolean;
}

export type GetMultiChainTokenListResponse = Response<Response<{ tokenAssets: TokenAsset[] }>>; // double layers from server response

export type PostByAnonymousRateLimitsResponse = Response<{
    anon_post_x_blue: boolean;
    can_post: boolean;
    daily_limit: string;
    daily_remaining: number;
    is_blue_x_user: boolean;
    limit_type: null;
    wait_minutes: number;
    wait_seconds: number;
    copyToAnoncast: boolean;
    copyToTwitter: boolean;
}>;

export interface CreateAnonymousPostOptions {
    text: string;
    embeds: string[];
    // cast hash for farcaster, full url for twitter
    quote: string | null;
    // cast hash for farcaster, full url for twitter
    parent: string | null;
    postToTwitter: boolean;
    /**
     * @deprecated
     */
    channel: string | null;
}

export type CreateAnonymousPostResponse = Response<{
    daily_limit: string;
    daily_remaining: number;
    message: string;
    post_id: string;
    success: boolean;
}>;

export type GetAnonymousPostResponse = Response<{
    uuid: string;
    accountId: string;
    accountRawId: string;
    text: string;
    embeds: string[];
    quote: string | null;
    channel: string | null;
    parent: string | null;
    status: 'queued' | 'generating_proof' | 'proof_failed' | 'sent' | 'failed';
    error?: string;
    createdAt: string;
    updatedAt: string;
    cast_hashs: Array<{
        community: string;
        hash: string;
        tweetId?: string;
    }>;
    postToTwitter: boolean;
}>;

export type GetProfilesResponse = Response<FarcasterProfile[]>;

export interface ScheduleNotificationData {
    task_uuid: string;
    display_info: {
        content: string;
        media_type: PostMediaType[];
    };
    posts: Array<{
        account_id: number;
        avatar_url: string;
        credential: string;
        display_info: {
            content: string;
            media_type?: PostMediaType[];
        } | null;
        platform: SocialSourceInURL;
        post_id: string;
        publish_timestamp: string;
        status: ScheduleTaskStatus;
        task_uuid: string;
        uuid: string;
        error?: string;
    }>;
}

export type ScheduleNotificationsResponse = Response<{
    notifications: ScheduleNotificationData[];
    cursor?: string;
}>;

export interface ScheduleNotification {
    source: Source.Firefly;
    type: SocialNotificationType.Schedule;
    data: ScheduleNotificationData;
    timestamp: number;
    notificationId: string;
    status: ScheduleTaskStatus;
}

export interface UnifiedNotificationData {
    type: string;
    data: {
        [key: string]: any;
    };
    created_at: string;
}

export interface UnifiedNotification {
    source: Source.Firefly;
    type: SocialNotificationType;
    data: UnifiedNotificationData['data'];
    timestamp: number;
    notificationId: string;
}

export type AllNotificationsResponse = Response<{
    notifications: UnifiedNotificationData[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;

export interface SparksAccountInfo {
    account_id: string;
    handle: string;
    platform: SourceInURL;
    platform_id: string;
    status: SparksAccountStatus;
}
export type GenesisSparksAccountsResponse = Response<{
    infoList: SparksAccountInfo[];
} | null>;

export type GetExploreSwitchConfigResponse = Response<{
    explore_switch: boolean;
    list: Array<{
        title: 'Explore';
        list: Array<{
            account_id: number;
            disabled: boolean;
            explore_type: ExploreSwitchType;
            state: boolean;
            title: string;
        }>;
    }>;
}>;

interface OgUser {
    platform: string;
    platform_id: string;
    handle: string;
    IsClaim: boolean;
    IsActive: boolean;
}

export enum OgStatus {
    isOgActive = 1,
    isOgInactive = 2,
    isNotOg = 3,
    isNotBoundX = 4,
}

export enum FansStatus {
    isFansActive = 1,
    isFansInactive = 2,
    isNotFans = 3,
    isNotBoundX = 4,
}

export type SparksAccountResponse = Response<{
    account_id: number;
    account_uuid: string;
    fansActive: boolean;
    name: string;
    ogActive: boolean;
    rank: string;
    uid: string;
    avatar: string;
    isFans: FansStatus;
    isOg: OgStatus;
    OgList?: OgUser[];
    FansList?: OgUser[];
}>;

export interface PolymarketProfileData {
    balance: number;
    buy_count: number;
    cash_balance: number;
    gains: number;
    join1year: string;
    join_time: number;
    losses: number;
    notfill_balance: number;
    notfill_pnl: number;
    pnl: number;
    pnl1m: string;
    pnl100: string;
    pnl_rate: number;
    position_traded: number;
    proxy: string;
    sell_count: number;
    shares: number;
    total_count: number;
    wallet: string;
    win_rate: number;
    win_rate67: string;
    platform_avatar: string;
    platform_name: string;
}

export interface BetPortfolioItem {
    platform: BetsPlatform;
    wallet: string;
    proxy: string;
    /** url */
    platform_avatar: string;
    platform_name: string;
    pnl: number;
    cash_balance: number;
    balance: number;
    notfill_balance: number;
    volume?: number;
}

export interface PolymarketEventSlugListData {
    slug: string;
    label: string;
    sub_slug: Array<{
        slug: string;
        label: string;
    }>;
}

export enum PolymarketUmaResolutionStatus {
    Resolved = 'resolved',
    Disputed = 'disputed',
    Settled = 'settled',
    Proposed = 'proposed',
    Requested = 'requested',
}

export interface PolymarketEventListData {
    id: string;
    ticker: string;
    slug: string;
    title: string;
    description: string;
    resolutionSource: string;
    startDate: string;
    creationDate: string;
    endDate: string;
    image: string;
    icon: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    featured: boolean;
    restricted: boolean;
    liquidity: number;
    volume: number;
    openInterest: number;
    createdAt: string;
    updatedAt: string;
    competitive: number;
    volume24hr: number;
    volume1wk: number;
    volume1mo: number;
    volume1yr: number;
    enableOrderBook: boolean;
    liquidityClob: number;
    negRisk: boolean;
    negRiskMarketID: string;
    commentCount: number;
    markets: PolymarketMarketData[];
    tags: PolymarketTagData[];
    cyom: boolean;
    showAllOutcomes: boolean;
    showMarketImages: boolean;
    enableNegRisk: boolean;
    automaticallyActive: boolean;
    gmpChartMode: string;
    negRiskAugmented: boolean;
    featuredOrder: number;
    pendingDeployment: boolean;
    deploying: boolean;
    deployingTimestamp: string;
    requiresTranslation: boolean;
    is_ff_activity: boolean;
    series?: PolymarketSeriesData[] | null;
}

export interface PolymarketSeriesData {
    id: string;
    ticker: string;
    slug: string;
    title: string;
    active: boolean;
    archived: boolean;
    closed: boolean;
    commentCount: number;
    createdAt: string;
    featured: boolean;
    icon: string;
    image: string;
    liquidity: number;
    recurrence: string;
    requiresTranslation: boolean;
    restricted: boolean;
    seriesType: string;
    updatedAt: string;
    volume: number;
}

export interface PolymarketMarketData {
    id: string;
    question: string;
    conditionId: string;
    slug: string;
    resolutionSource: string;
    endDate: string;
    liquidity: string;
    startDate: string;
    image: string;
    icon: string;
    description: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    active: boolean;
    closed: boolean;
    marketMakerAddress: string;
    createdAt: string;
    updatedAt: string;
    new: boolean;
    featured: boolean;
    submitted_by: string;
    archived: boolean;
    resolvedBy: string;
    restricted: boolean;
    groupItemTitle: string;
    groupItemThreshold: string;
    questionID: string;
    enableOrderBook: boolean;
    orderPriceMinTickSize: number;
    orderMinSize: number;
    volumeNum: number;
    liquidityNum: number;
    endDateIso: string;
    startDateIso: string;
    hasReviewedDates: boolean;
    volume24hr: number;
    volume1wk: number;
    volume1mo: number;
    volume1yr: number;
    clobTokenIds: string;
    umaBond: string;
    umaReward: string;
    volume24hrClob: number;
    volume1wkClob: number;
    volume1moClob: number;
    volume1yrClob: number;
    volumeClob: number;
    liquidityClob: number;
    customLiveness: number;
    acceptingOrders: boolean;
    negRisk: boolean;
    negRiskMarketID: string;
    negRiskRequestID: string;
    ready: boolean;
    funded: boolean;
    acceptingOrdersTimestamp: string;
    cyom: boolean;
    competitive: number;
    pagerDutyNotificationEnabled: boolean;
    approved: boolean;
    clobRewards: PolymarketClobRewardData[];
    rewardsMinSize: number;
    rewardsMaxSpread: number;
    spread: number;
    oneDayPriceChange: number;
    oneHourPriceChange: number;
    oneWeekPriceChange: number;
    lastTradePrice: number;
    bestBid: number;
    bestAsk: number;
    automaticallyActive: boolean;
    clearBookOnStart: boolean;
    seriesColor: string;
    showGmpSeries: boolean;
    showGmpOutcome: boolean;
    manualActivation: boolean;
    negRiskOther: boolean;
    umaResolutionStatuses: string;
    pendingDeployment: boolean;
    deploying: boolean;
    deployingTimestamp: string;
    rfqEnabled: boolean;
    holdingRewardsEnabled: boolean;
    feesEnabled: boolean;
    requiresTranslation: boolean;
    umaResolutionStatus?: PolymarketUmaResolutionStatus;
}

export interface PolymarketClobRewardData {
    id: string;
    conditionId: string;
    assetAddress: string;
    rewardsAmount: number;
    rewardsDailyRate: number;
    startDate: string;
    endDate: string;
}

export interface PolymarketTagData {
    id: string;
    label: string;
    slug: string;
    forceShow: boolean;
    publishedAt?: string;
    updatedBy?: number;
    createdAt: string;
    updatedAt: string;
    forceHide?: boolean;
    requiresTranslation: boolean;
    isCarousel?: boolean;
}

export interface PolymarketPositionData {
    Id: string;
    IsClaim: boolean;
    avg_price: number;
    closed_time: number | null;
    conditionId: string;
    cur_price: number;
    event_slugs: string[];
    image?: string;
    is_closed: boolean;
    negRisk: boolean;
    notfill_pnl: number;
    offset: number;
    pnl: number;
    pnl_rate: number;
    shares: number;
    title?: string;
    tokenId: string;
    total_buy: number;
    vote_status: string;
    wallet: string;
}

export type PrivySignMessageResponse = Response<{
    signature: string;
    encoding: string;
}>;

export type RegisterFarcasterResponse = Response<{
    success: boolean;
    message: string;
    status: 'success' | 'account_existed' | 'parameter_error' | 'expired' | 'used' | 'username_taken';
    userInfo?: string;
    fid?: number;
    data?: unknown;
    error?: string[];
}>;

export type ReportLensResponse = Response<{
    ProfileId: string;
    IsSave: boolean;
    UpdateAt?: string;
}>;

export interface FarcasterAccountInfo {
    user_name: string;
    avatar: string;
    signer_publickey: string;
    signer_privatekey: string;
    display_name: string;
    account_id: string;
    bio: string;
    fid: string;
    account_raw_id: string;
}

export type FarcasterAccountInfoResponse = Response<FarcasterAccountInfo[]>;
export type EncryptedAccountInfoResponse = Response<{ data: string }>;

export type CheckBatchCustodyWalletResponse = Response<{ [key: string]: boolean }>;
export type GetMnemonicPhraseByFidResponse = Response<{ data: string }>;

export interface BetsPosition {
    wallet: string;
    conditionId: string;
    tokenId: string;
    topicId: number;
    is_mutil: 0 | 1; // 1 means multi-event, 0 means single-event
    vote_status: string;
    parent_title: string;
    title: string;
    image: string;
    shares: number;
    notfill_pnl: number;
    pnl_rate: number;
    avg_price: number;
    cur_price: number;
    closed_time: number;
    offset: 0 | 1; // 0-left 1-right
}
