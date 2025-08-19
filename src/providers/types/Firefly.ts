import type { ReactNode } from 'react';
import type { Address, Hex } from 'viem';

import {
    BookmarkType,
    FireflyPlatform,
    MintStatus,
    NetworkType,
    PolymarketBetType,
    S3ConvertStatus,
    type SocialSourceInURL,
    type Source,
    SourceInURL,
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
import type { ComposeType } from '@/types/compose.js';

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
    // related social profiles
    related_profiles?: Profile[];
    special?: boolean;
    // firefly account uid
    uid?: string;
}

export interface UsersData {
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
    active_status: 'active' | Omit<string, 'active'>;
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
    author: string;
    displayInfo: FireflyDisplayInfo;
    authorship: {
        contributor: string;
    };
    related_urls: string[];
    article_id: string;
    cover_img_url: string | null;
    has_bookmarked?: boolean;
    followingSources: FollowingSource[];
    paragraph_raw_data?: {
        slug: string;
        staticHtml: string;
        json: string;
    };
}

export interface FireflySnapshotActivity {
    id: string;
    timestamp: string;
    hash: string;
    owner: Address;
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

export type Relationship = {
    id: string;
    address: string;
    snsId: string;
    snsPlatform: string;
};

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

export type SearchProfileListItem = Record<SocialSourceInURL | 'eth' | 'solana' | 'ens' | 'account', Profile[] | null>;

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

export type UploadMediaTokenResponse = Response<{
    bucket: string;
    cdnHost: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
}>;

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

export enum RelationPlatform {
    reddit = 'reddit',
    keybase = 'keybase',
    github = 'github',
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
    isDefault?: boolean;
    __origin__: WalletProfile | LensV3Profile | FarcasterProfile | TwitterProfile | BskyProfile | null;
}

export interface Relation {
    source: string[];
    identity: {
        uuid: string;
        identity: string;
        platform: RelationPlatform;
        displayName: string;
    };
}

export type RelationResponse = Response<Relation[]>;

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

export interface SchedulePostDisplayInfo {
    content: string;
    type: ComposeType;
}

export enum ScheduleTaskStatus {
    Pending = 'pending',
    Failed = 'fail',
    Success = 'success',
}

export type ScheduleRelation = {
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
};

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

export type GetLensSuggestedFollowUserResponse = Response<{
    suggestedFollowList: Array<[LensV3Profile]>;
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
    sources: WalletProfile['verifiedSources'];
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

export enum TwitterUserInfoLabelType {
    BusinessLabel = 'BusinessLabel',
}

export enum TwitterUserInfoLabelDisplayType {
    Badge = 'Badge',
}

export enum TwitterUserInfoLabelUrlType {
    DeepLink = 'DeepLink',
}

export enum TwitterUserInfoVerifiedType {
    Government = 'Government',
}

export interface TwitterUserInfoLabel {
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

export interface TwitterUserInfoEntities {
    display_url: string;
    expanded_url: string;
    url: string;
    indices: number[];
}

export enum TwitterUserInfoProfileImageShape {
    Square = 'Square',
    Circle = 'Circle',
}

export interface TwitterUserInfo {
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

export type VotingResultResponse = Response<{
    trump: number;
    harris: number;
    tokenIdCount: number;
}>;

export type PolymarketActivity = {
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
};

export type PolymarketActivityTimeline = Response<{
    result: PolymarketActivity[];
    cursor?: string;
}>;

export type Project = {
    eval: number;
    project_id: number;
    one_liner: string;
    logo: string;
    rank: number;
    token_symbol: string;
    project_name: string;
    tags: string[];
    rootdataurl: string;
};

export type SearchNFTResponse = Response<{
    list: EVM.Collection[];
}>;

export type SearchableToken = {
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
};

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

/** Results from /v2/token/search */
export type SearchTokenInfosResponse = Response<SearchTokenInfo[]>;

export interface DexCoinDetail {
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

export type LinkDigestResponse = Response<{
    link: string;
    type: string;
    nft?: NFTDetail;
    lensPost?: unknown;
    farcasterPost?: unknown;
    mirror?: unknown;
    paragraph?: unknown;
    snapshot?: unknown;
    twitter?: unknown;
    twitterXQT?: unknown;
    farcasterFrames?: unknown;
}>;

export type ProjectResponse = Response<Project[]>;

export type GetBookmarksResponse = Response<{
    list: Array<{
        has_book_marked: boolean;
        platform: string;
        platform_id: string;
        post_id: string;
        post_type: BookmarkType;
    }>;
}>;

export type SponsorMintOptions = {
    walletAddress: string;
    contractAddress: string;
    tokenId: string;
    chainId: number;
    buyCount: number;
    vectorId?: number;
    color?: string;
    collectionId?: string;
};

export type MintMetadata = {
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
};

type FreeMintResult = {
    status: boolean;
    hash: string;
    errormessage: string;
    gasStatus: boolean;
};

export type GetSponsorMintStatusResponse = Response<MintMetadata>;

export type MintBySponsorResponse = Response<FreeMintResult>;

export interface GetFollowingCountByNFTParams {
    collectionAddress: string;
    chainName: string;
}

export type GetFollowingCountByNFTResponse = Response<{
    count: number;
}>;

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

export type ParagraphMintMetadata = {
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
};

export type NFTMintingResponse = Response<ParagraphMintMetadata>;

export interface NotificationSettings {
    priority: boolean;
}

export type TakoExternalHostedData = Response<{
    content: string;
}>;

export type GetTokenOptions = {
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
};

export interface TokenWithMarketData {
    detail_platforms: unknown;
    id: string;
    image: Record<'small' | 'thumb' | 'large', string>;
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
    contract_address: string;
}

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

export interface SwapToken {
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

export type SwapActivity = {
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
    repost_count: number;
    displayInfo?: FireflyDisplayInfo;
    followingSources: FollowingSource[];
};

export type FireflyDisplayInfo = {
    ensHandle: string;
    avatarUrl: string;
    fireflyName: string;
    fireflyUid: string;
    fireflyAvatarUrl: string;
};

export type SwapActivityDetail = Response<SwapActivity[]>;

export type SwapActivityTimeline = Response<{
    result: SwapActivity[];
    cursor?: string;
}>;

export type FollowingTraderCountResponse = Response<{ total: number }>;

export type CollectionResponse = Response<EVM.Collection>;
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

export type NFTBookmarkContent = {
    nft_id: `${number}.${string}.${string}`;
    own_num: 0;
    following_own_num: 0;
};

export type LoginFarcasterWithWalletResponse = Response<{
    signerPublickey: Hex;
    signerPrivatekey: Hex;
    accessToken: string;
    accountId: string;
    fid: string;
    isNew: boolean;
    displayName: string;
    avatar: string;
    uid: string;
    createdAt: string;
}>;

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
          source: Source.Polymarket;
          data: PolymarketActivity;
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

export type TokenPriceStatsOptions = {
    coingecko_id?: string | null;
    chain_id?: number;
    address?: string;
    days: number | undefined;
};

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

type PostStateEntry = {
    post_id: string;
    state: boolean;
};

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

export type TipsNotification = {
    source: Source.Firefly;
    type: SocialNotificationType.Tips;
    data: TipsNotificationData;
    timestamp: number;
    notificationId: string;
};

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

export interface PrivyWallet {
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

export const enum TransactionHistoryCategory {
    TokenReceive = 'token_receive',
    TokenSend = 'token_send',
    TokenSwap = 'token_swap',
    TokenApprove = 'token_approve',
    TokenRevoke = 'token_revoke',
    NftReceive = 'nft_receive',
    NftSend = 'nft_send',
    NftMint = 'nft_mint',
    ContractInteraction = 'contract_interaction',
}

export const enum TransactionState {
    Success = 'success',
    Failed = 'fail',
}

export interface TransactionHistoryItem {
    chain_id: number;
    hash: string;
    block_number: number;
    tx_status: TransactionState;
    project_logo: string;
    project_name: string;
    timestamp: string;
    to_address: string;
    from_address: string;
    token_sends: TransactionHistoryTokenAction[];
    token_receives: TransactionHistoryTokenAction[];
    token_approve?: TransactionHistoryTokenApprove;
    nft_receives: TransactionHistoryNFTAction[];
    nft_sends: TransactionHistoryNFTAction[];
    category: TransactionHistoryCategory;
}

export interface TransactionHistoryNFTAction {
    nft: {
        address: string;
        symbol: string;
        name: string;
        token_id: string;
        logo: string;
    };
    amount: string;
    user_address: string;
    recipient: string;
    sender: string;
}

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
}

export type TrendingNFTsResponse = Response<TrendingNFT[]>;

export interface TransactionHistoryToken {
    address: string;
    symbol: string;
    name: string;
    logo: string;
    decimal: number;
    price: string;
}

export interface TransactionHistoryTokenApprove {
    token: TransactionHistoryToken;
    amount: string;
    spender_address: string;
}

export interface TransactionHistoryTokenAction {
    token: TransactionHistoryToken;
    amount: string;
    user_address: string;
    recipient: string;
    sender: string;
}

export type WalletHistoryTransactionsResponse = Response<{
    list: TransactionHistoryItem[];
    cursor?: string;
}>;

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

export type ScheduleNotificationData = {
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
};

export type ScheduleNotificationsResponse = Response<{
    notifications: ScheduleNotificationData[];
    cursor?: string;
}>;

export type ScheduleNotification = {
    source: Source.Firefly;
    type: SocialNotificationType.Schedule;
    data: ScheduleNotificationData;
    timestamp: number;
    notificationId: string;
    status: ScheduleTaskStatus;
};
