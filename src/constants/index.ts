/* cspell:disable */

import { chains } from '@lens-chain/sdk/viem';
import { evmAddress } from '@lens-protocol/client';

import {
    type BookmarkSource,
    ChannelTabType,
    type DiscoverSource,
    EngagementType,
    type ExploreSource,
    ExploreType,
    FileMimeType,
    FollowCategory,
    type FollowingSource,
    Locale,
    NetworkType,
    NODE_ENV,
    type NotificationSource,
    ProfileEditableField,
    type ProfilePageSource,
    type RequestedLoginSource,
    SearchType,
    type SocialDiscoverSource,
    type SocialNotificationSource,
    SocialProfileCategory,
    type SocialSource,
    Source,
    SourceInURL,
    STATUS,
    TrendingType,
    VERCEL_NEV,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';
import { MediaSource } from '@/types/compose.js';

export const EMPTY_LIST = Object.freeze([]) as never[];
export const EMPTY_OBJECT = Object.freeze({}) as Record<string, never>;

export const SITE_NAME = 'Firefly ✨ Everything App for Web3 Natives';
export const SITE_DESCRIPTION =
    'Firefly is a Web3 social app by Mask Network. Explore timelines from X, Farcaster, Lens & Bluesky, and track trends in DeFi, MEME, NFTs, and more.';
export const SITE_HOSTNAME = 'firefly.social';
export const CZ_ACTIVITY_HOSTNAME = 'cz.firefly.social';

export const SITE_URL_OFFICIAL = 'https://firefly.social';
export const SITE_URL = env.external.NEXT_PUBLIC_SITE_URL ?? SITE_URL_OFFICIAL;
export const FARCASTER_REPLY_URL = 'https://relay.farcaster.xyz';
export const WARPCAST_ROOT_URL = 'https://api.warpcast.com';
export const WARPCAST_ROOT_URL_V2 = 'https://api.warpcast.com/v2';
export const WARPCAST_CLIENT_URL = 'https://client.warpcast.com/v2';
export const FIREFLY_ROOT_URL = 'https://api.firefly.land';
export const FIREFLY_DEV_ROOT_URL = 'https://api-dev.firefly.land';
export const FIREFLY_STAMP_URL = 'https://stamp.firefly.land/avatar';
export const FIREFLY_STAMP_DEV_URL = 'https://stamp-dev.firefly.land/avatar';
export const HEY_IPFS_GW_URL = 'https://gw.ipfs-lens.dev/ipfs';
export const DSEARCH_BASE_URL = 'https://dsearch.mask.r2d2.to';
export const CORS_HOST = 'https://cors-next.r2d2.to';
export const COINGECKO_ROOT_URL = 'https://coingecko-agent.r2d2.to/api/v3';
export const GO_PLUS_LABS_ROOT_URL = 'https://gopluslabs.r2d2.to';
export const DEBANK_OPEN_API = 'https://debank-proxy.r2d2.to';
export const TWITTER_UPLOAD_MEDIA_URL = 'https://upload.twitter.com/1.1/media/upload.json';
export const SNAPSHOT_GRAPHQL_URL = 'https://hub.snapshot.org/graphql';
export const SNAPSHOT_SCORES_URL = 'https://score.snapshot.org';
export const SNAPSHOT_SEQ_URL = 'https://seq.snapshot.org';
export const SNAPSHOT_RELAY_URL = 'https://relayer.snapshot.org';
export const SNAPSHOT_IPFS_GATEWAY_URL = 'https://snapshot.4everland.link/ipfs/';
export const ORB_CLUB_URL = 'https://us-central1-orbapp.cloudfunctions.net';
export const FIREFLY_TELEGRAM_URL = 'https://t.me/fireflyapp';
export const BSKY_VIDEO_ENDPOINT = 'https://video.bsky.app/xrpc';
export const NEYNAR_URL = env.external.NEXT_PUBLIC_NEYNAR_URL;
export const FIREFLY_NITTER_URL = env.external.NEXT_PUBLIC_FIREFLY_NITTER_URL;
export const X3_PRO_API_URL = 'https://x3.pro/api/api'; // duplicate /api
export const X3_PRO_AVATAR_URL = 'https://x3-media-pro-1.oss-cn-hongkong.aliyuncs.com';
export const CHAINBASE_API_URL = 'https://chainbase-proxy.r2d2.to';
export const ENS_ROOT_URL = 'https://ens-reverse-lookup.r2d2.to/ens/';
export const THE_GRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';

export const ADVERTISEMENT_JSON_URL = 'https://media.firefly.land/advertisement/web.json';
export const ADVERTISEMENT_JSON_URL_DEV = 'https://media.firefly.land/advertisement/web-dev.json';

export const FIREFLY_APP_APP_STORE_URL = 'https://apps.apple.com/us/app/firefly-web3-nft-explorer/id1640183078';
export const FIREFLY_APP_GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=io.dimension.firefly';

export const FARCASTER_REPLY_COUNTDOWN = 50; // in seconds
export const FIREFLY_SCAN_QR_CODE_COUNTDOWN = 5 * 60; // in seconds

export const RP_HASH_TAG = '#FireflyLuckyDrop';

export const HIDDEN_SECRET = '[HIDE_FROM_CLIENT]';
export const NOT_DEPEND_SECRET = '[TO_BE_REPLACED_LATER]';

export const ORB_CLUB_TAG_PREFIX = 'orbcommunities';

export const SORTED_PROFILE_TAB_TYPE: Record<SocialSource, SocialProfileCategory[]> = {
    [Source.Lens]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.Collected,
    ],
    [Source.Farcaster]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Likes,
        SocialProfileCategory.Channels,
    ],
    [Source.Twitter]: [SocialProfileCategory.Feed, SocialProfileCategory.Replies, SocialProfileCategory.Media],
    [Source.Bsky]: [SocialProfileCategory.Feed, SocialProfileCategory.Replies, SocialProfileCategory.Media],
};
export const LOGIN_SORTED_PROFILE_TAB_TYPE: Record<SocialSource, SocialProfileCategory[]> = {
    [Source.Lens]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.Collected,
    ],
    [Source.Farcaster]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Likes,
        SocialProfileCategory.Channels,
    ],
    [Source.Twitter]: [SocialProfileCategory.Feed, SocialProfileCategory.Replies, SocialProfileCategory.Media],
    [Source.Bsky]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.Likes,
    ],
};

export const SORTED_PROFILE_TAB_TYPE_REQUIRE_LOGIN: Record<SocialSource, SocialProfileCategory[]> = {
    [Source.Lens]: [],
    [Source.Farcaster]: [],
    [Source.Twitter]: [],
    [Source.Bsky]: [SocialProfileCategory.Likes],
};
export const WALLET_PROFILE_TAB_TYPES: Record<NetworkType, WalletProfileCategory[]> = {
    [NetworkType.Ethereum]: [
        WalletProfileCategory.Activities,
        WalletProfileCategory.Swap,
        WalletProfileCategory.Polymarket,
        WalletProfileCategory.POAPs,
        WalletProfileCategory.NFTs,
        WalletProfileCategory.Articles,
        WalletProfileCategory.DAOs,
    ],
    [NetworkType.Solana]: [WalletProfileCategory.Swap],
};
export const SORTED_ENGAGEMENT_TAB_TYPE: Record<SocialSource, EngagementType[]> = {
    [Source.Lens]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Mirrors],
    // TODO No API to fetch recasts for now.
    [Source.Farcaster]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Recasts],
    [Source.Twitter]: [EngagementType.Likes, EngagementType.Quotes],
    [Source.Bsky]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Mirrors],
};
export const SORTED_SEARCH_TYPE: Record<SocialSource, SearchType[]> = {
    [Source.Lens]: [SearchType.Posts, SearchType.Profiles, SearchType.Communities],
    [Source.Farcaster]: [SearchType.Posts, SearchType.Profiles, SearchType.Communities],
    [Source.Twitter]: [SearchType.Posts, SearchType.Profiles],
    [Source.Bsky]: [SearchType.Posts, SearchType.Profiles, SearchType.Communities],
};
export const CHANNEL_TAB_TYPE: Record<SocialSource, ChannelTabType[]> = {
    [Source.Farcaster]: [ChannelTabType.Posts, ChannelTabType.Followers, ChannelTabType.Members],
    [Source.Lens]: [ChannelTabType.Posts, ChannelTabType.Members],
    [Source.Twitter]: [],
    [Source.Bsky]: [ChannelTabType.Posts],
};
export const GIF_MEDIA_SOURCE_CONFIG: Record<SocialSource, MediaSource[]> = {
    [Source.Farcaster]: [MediaSource.Giphy, MediaSource.Tenor, MediaSource.Local],
    [Source.Lens]: [MediaSource.Giphy, MediaSource.Tenor, MediaSource.Local],
    [Source.Twitter]: [MediaSource.Giphy, MediaSource.Tenor, MediaSource.Local],
    [Source.Bsky]: [MediaSource.Tenor],
};

export const SORTED_HOME_SOURCES = [Source.Farcaster, Source.Lens, Source.NFTs, Source.Article] as const;
export const PROFILE_PAGE_SOURCES = [
    Source.Farcaster,
    Source.Twitter,
    Source.Bsky,
    Source.Lens,
    Source.Wallet,
    Source.WalletMix,
];
export const SORTED_PROFILE_SOURCES: ProfilePageSource[] = [
    Source.Farcaster,
    Source.Twitter,
    Source.Bsky,
    Source.Lens,
    Source.Wallet,
];
export const SORTED_SOCIAL_SOURCES = [Source.Farcaster, Source.Lens, Source.Twitter, Source.Bsky] as const;
export const SORTED_LOGIN_SOCIAL_SOURCES = [Source.Twitter, Source.Farcaster, Source.Bsky, Source.Lens] as const;
export const SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE = [
    Source.Twitter,
    Source.Farcaster,
    Source.Lens,
    Source.Bsky,
] as const;
export const SORTED_THIRD_PARTY_SOURCES = [Source.Google, Source.Telegram, Source.Apple, Source.Email] as const;
export const SORTED_THIRD_PARTY_SOURCES_IN_URL = [
    SourceInURL.Google,
    SourceInURL.Telegram,
    SourceInURL.Apple,
    SourceInURL.Email,
] as const;
export const SORTED_BOOKMARK_SOURCES =
    env.shared.NODE_ENV === NODE_ENV.Development
        ? [Source.Farcaster, Source.Lens, Source.Twitter, Source.Article]
        : [Source.Farcaster, Source.Lens, Source.Article];
export const SORTED_CHANNEL_SOURCES: SocialSource[] = [Source.Farcaster];
export const SORTED_POLL_SOURCES: SocialSource[] = [Source.Twitter, Source.Farcaster];
export const SORTED_MEDIA_SOURCES: MediaSource[] = [
    MediaSource.Twimg,
    MediaSource.S3,
    MediaSource.IPFS,
    MediaSource.Imgur,
    MediaSource.Giphy,
    MediaSource.Tenor,
    MediaSource.Local,
];
export const SORTED_EXPLORE_SOURCES: ExploreSource[] = [Source.Farcaster, Source.Lens];
export const SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES = [Source.Farcaster];

export const ENABLED_SCHEDULE_POST_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Twitter];
export const ENABLED_REPLY_SOURCES = [Source.Farcaster, Source.Lens, Source.Bsky];
export const ENABLED_REPLY_SETTINGS_POST_SOURCES: SocialSource[] = [
    Source.Farcaster,
    Source.Lens,
    Source.Twitter,
    Source.Bsky,
];
export const ENABLED_FOLLOWING_LIST_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Bsky];
export const ENABLED_BOOKMARK_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Bsky];
export const ENABLED_DECRYPT_SOURCES = [Source.Lens];
export const ENABLED_RP_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Twitter];

export const DEFAULT_SOCIAL_SOURCE = Source.Posts;
export const DEFAULT_BOOKMARK_SOURCE = Source.Farcaster;
export const DEFAULT_NOTIFICATION_SOURCE = Source.Notifications;
export const DEFAULT_EXPLORE_TYPE = ExploreType.TopProfiles;
export const DEFAULT_LOCALE = Locale.en;

export const SUPPORTED_PREVIEW_MEDIA_TYPES: Array<Attachment['type']> = ['Image', 'AnimatedGif'];
export const SUPPORTED_FRAME_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens];
export const SUPPORTED_VIDEO_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Twitter, Source.Bsky];
export const SUPPORTED_MULTI_ACCOUNT_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens];
export const SUPPORTED_MEDIA_CORS_SOURCES: Source[] = [Source.Farcaster, Source.Lens, Source.Twitter];
export const SUPPORTED_CHANNEL_SOURCES: Source[] = [Source.Farcaster, Source.Lens];
export const SOCIAL_DISCOVER_SOURCE: SocialDiscoverSource[] = [Source.Farcaster, Source.Lens, Source.Bsky] as const;
export const SOCIAL_NOTIFICATION_SOURCE: SocialNotificationSource[] = [Source.Farcaster, Source.Lens, Source.Bsky];
export const DISCOVER_SOURCES: DiscoverSource[] = [Source.Posts, Source.NFTs, Source.Article, Source.DAOs] as const;
export const FOLLOWING_SOURCES: FollowingSource[] = [
    Source.Posts,
    Source.Swap,
    Source.Polymarket,
    Source.NFTs,
    Source.Article,
    Source.DAOs,
] as const;
export const FOLLOWING_CATEGORY = [FollowCategory.Followers, FollowCategory.Mutuals, FollowCategory.Following] as const;
export const REQUIRE_LOGIN_FOLLOWING_CATEGORY = [FollowCategory.Mutuals];
export const REQUIRE_LOGIN_SOURCES: RequestedLoginSource[] =
    env.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [] : [Source.Twitter];
export const REQUIRE_LOGIN_SOURCES_IN_SEARCH: SocialSource[] =
    env.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [Source.Bsky] : [Source.Twitter, Source.Bsky];
export const SOCIAL_SOURCE_WITH_ADDRESS: SocialSource[] = [Source.Farcaster, Source.Lens];
export const ENABLED_TIPS_POST_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Twitter];

export const EXPLORE_TYPES: ExploreType[] = [
    ExploreType.TopProfiles,
    ExploreType.Projects,
    ExploreType.CryptoTrends,
    ExploreType.TopChannels,
];

export const EXPLORE_SOURCES: Partial<Record<ExploreType, ExploreSource[]>> = {
    [ExploreType.TopProfiles]: [Source.Twitter, Source.Farcaster, Source.Lens, Source.Bsky],
    [ExploreType.CryptoTrends]: [
        TrendingType.TopGainers,
        TrendingType.TopLosers,
        TrendingType.Trending,
        TrendingType.Meme,
    ],
    [ExploreType.TopChannels]: [Source.Farcaster, Source.Bsky],
};

export const EXPLORE_DEFAULT_SOURCE: Record<ExploreType, ExploreSource | undefined> = {
    [ExploreType.TopProfiles]: Source.Farcaster,
    [ExploreType.Projects]: undefined,
    [ExploreType.CryptoTrends]: TrendingType.Trending,
    [ExploreType.TopChannels]: Source.Farcaster,
};

export const BOOKMARK_SOURCES: BookmarkSource[] = [
    Source.Farcaster,
    Source.Lens,
    Source.Bsky,
    Source.NFTs,
    Source.Article,
    Source.DAOs,
];

export const SORTED_NOTIFICATIONS_SOURCES: NotificationSource[] = [
    Source.Notifications,
    Source.Farcaster,
    Source.Bsky,
    Source.Lens,
];

export const TIPS_SUPPORT_NETWORKS = [NetworkType.Ethereum];

// Lens
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
export const ARWEAVE_GATEWAY = 'https://arweave.net/';
export const LENS_MEDIA_SNAPSHOT_URL = 'https://ik.imagekit.io/lens/media-snapshot';
export const HEY_URL = 'https://hey.xyz';
export const HEY_API_URL = 'https://api.hey.xyz';
export const HEY_IMAGEKIT_URL = 'https://ik.imagekit.io/lensterimg';
export const LENS_CHAIN_ID = chains.mainnet.id;
// TODO: create lens app for firefly
export const FIREFLY_LENS_V3_APP = evmAddress('0xaC19aa2402b3AC3f9Fe471D4783EC68595432465');
export const LENS_TOKEN_STORAGE_KEY = 'lens.mainnet.credentials';
export const LENS_API_URL = 'https://api.lens.xyz/graphql';

// Named transforms for ImageKit
export const IMAGE_KIT_AVATAR = 'tr:w-300,h-300';
export const IMAGE_KIT_COVER = 'tr:w-1500,h-500';
export const IMAGE_KIT_ATTACHMENT = 'tr:w-1000';

export const IS_PRODUCTION = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_NEV.Production;
export const IS_DEVELOPMENT = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_NEV.Development;
export const IS_PREVIEW = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_NEV.Preview;

export const EVER_API = 'https://endpoint.4everland.co';

// polls
export const FRAME_SERVER_URL = 'https://polls.firefly.social';
export const FRAME_DEV_SERVER_URL = 'https://polls-staging.firefly.social';

// S3 bucket
export const S3_BUCKET = {
    HEY_MEDIA: 'hey-media',
    FIREFLY_LENS_MEDIA: 'firefly-lens-media',
};

// HTTP Cache headers
export const CACHE_AGE_INDEFINITE_ON_DISK = 'public, s-maxage=31536000, max-age=31536000, must-revalidate';

// Search Bar
export const MAX_SEARCH_RECORD_SIZE = 5;
export const MAX_RECOMMEND_PROFILE_SIZE = 5;

// POST
export const MAX_FRAME_SIZE_PER_POST = 1;

export const MAX_POST_SIZE_PER_THREAD = env.shared.NODE_ENV === NODE_ENV.Development ? 10 : 25;
export const MIN_POST_SIZE_PER_THREAD = 3;

// Contracts
export const LENS_HUB_PROXY_ADDRESS = '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d';
export const POAP_CONTRACT_ADDRESS = '0x22C1f6050E56d2876009903609a2cC3fEf83B415';
export const ELEX24_NFT_CONTRACT_ADDRESS = '0x70553bBeC6F7d2C5e6E1Bc02f821F6863546D11e';

export const PUDGY_PENGUINS_NFT_ADDRESS = '0xbd3531da5cf5857e7cfaa92426877b022e612cf8';
export const LIL_PUDGY_NFT_ADDRESS = '0x524cab2ec69124574082676e6f654a18df49a048';
export const TRUE_PENGU_NFT_ADDRESS = '0x1f63796fd993c0ade182ec018f60ae6b74e6966c';
export const PENGU_PINS_NFT_ADDRESS = '0x1d8305e851182e3ca4df42d2ca8f3e441141aa8f';

export const ALLOWED_IMAGES_MIMES = [
    FileMimeType.PNG,
    FileMimeType.JPEG,
    FileMimeType.GIF,
    FileMimeType.WEBP,
    FileMimeType.BMP,
] as const;

export const ALLOWED_COVER_MIMES = [FileMimeType.PNG, FileMimeType.JPEG] as const;

export const ALLOWED_VIDEO_MIMES = [FileMimeType.MP4, FileMimeType.MOV] as const;

export const ALLOWED_MEDIA_MIMES = [...ALLOWED_IMAGES_MIMES, ...ALLOWED_VIDEO_MIMES] as const;

export const SUFFIX_NAMES: Record<FileMimeType, string> = {
    [FileMimeType.PNG]: 'png',
    [FileMimeType.JPEG]: 'jpg',
    [FileMimeType.GIF]: 'gif',
    [FileMimeType.BMP]: 'bmp',
    [FileMimeType.WEBP]: 'webp',
    [FileMimeType.MP4]: 'mp4',
    [FileMimeType.MPEG]: 'mpeg',
    [FileMimeType.MS_VIDEO]: 'avi',
    [FileMimeType.OGG]: 'ogv',
    [FileMimeType.GPP]: '3gp',
    [FileMimeType.GPP2]: '3g2',
    [FileMimeType.WEBM]: 'webm',
    [FileMimeType.MOV]: 'mov',
};

export const SOLANA_WALLET_CACHE_KEY = 'walletName';
export const NOTIFICATION_PERMISSION_KEY = 'notification-permission';

// https://support.mirror.xyz/hc/en-us/articles/13729399363220-Platform-fees
// 0.00069 ETH
export const MIRROR_COLLECT_FEE = 690000000000000n;
// 1 matic
export const MIRROR_COLLECT_FEE_IN_POLYGON = 1000000000000000000n;

// https://docs.paragraph.xyz/docs/advanced/referral-program
// 0.000777 ETH
export const PARAGRAPH_COLLECT_FEE = 777000000000000n;
// 2 matic
export const PARAGRAPH_COLLECT_FEE_IN_POLYGON = 2000000000000000000n;

export const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;
export const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

export const MAX_SIZE_PER_CHUNK = 2 * 1024 * 1024; // 2MB

export const VITALIK_ADDRESS = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

export const MIRROR_OLD_FACTOR_ADDRESSES = [
    '0x302f746eE2fDC10DDff63188f71639094717a766',
    '0x2d4b7Ec9923b9cf22d87Ced721e69E1f8eD96a0A',
];

export const EDIT_PROFILE_FIELDS: Record<SocialSource, ProfileEditableField[]> = {
    [Source.Farcaster]: [ProfileEditableField.DisplayName, ProfileEditableField.Bio],
    [Source.Lens]: [
        ProfileEditableField.DisplayName,
        ProfileEditableField.Website,
        ProfileEditableField.Location,
        ProfileEditableField.Bio,
    ],
    [Source.Twitter]: [
        ProfileEditableField.DisplayName,
        ProfileEditableField.Website,
        ProfileEditableField.Location,
        ProfileEditableField.Bio,
    ],
    [Source.Bsky]: [ProfileEditableField.DisplayName, ProfileEditableField.Bio],
};

export const BSKY_LOGIN_REQUIRED_FEEDS = [
    'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends',
    'at://did:plc:tenurhgjptubkk5zf5qhi3og/app.bsky.feed.generator/mutuals',
];
