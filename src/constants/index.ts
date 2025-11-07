/* cspell:disable */
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
    NetworkType,
    NODE_ENV,
    type NotificationSource,
    ProfileEditableField,
    type ProfilePageSource,
    type RequestedLoginSource,
    SearchType,
    type SocialDiscoverSource,
    SocialProfileCategory,
    type SocialSource,
    Source,
    SourceInURL,
    STATUS,
    TokenCategory,
    TrendingType,
    VERCEL_NEV,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';
import type { Runtime } from '@/providers/types/Trending.js';
import { MediaSource } from '@/types/compose.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const EMPTY_LIST = Object.freeze([]) as never[];
export const EMPTY_OBJECT = Object.freeze({}) as Record<string, never>;

export const SITE_NAME = 'Firefly ✨ Everything App for Web3 Natives';
export const SITE_DESCRIPTION = "Firefly is a social app for exploring what's happening onchain.";
export const SITE_HOSTNAME = 'firefly.social';
export const SITE_LOGO =
    'data:image/png;base64,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' as const;

export const FIREFLY_S3_DOMAIN = 'https://media.firefly.land';
export const SITE_URL_OFFICIAL = 'https://firefly.social';
export const SITE_URL = env.external.NEXT_PUBLIC_SITE_URL ?? SITE_URL_OFFICIAL;
export const FARCASTER_REPLY_URL = 'https://relay.farcaster.xyz';
export const WARPCAST_ROOT_URL = 'https://api.warpcast.com';
export const WARPCAST_ROOT_URL_V1 = 'https://api.warpcast.com/v1';
export const WARPCAST_ROOT_URL_V2 = 'https://api.warpcast.com/v2';
export const FIREFLY_ROOT_URL = 'https://api.firefly.land';
export const FIREFLY_DEV_ROOT_URL = 'https://api-dev.firefly.land';
export const FIREFLY_STAMP_URL = 'https://stamp.firefly.land/avatar';
export const FIREFLY_STAMP_DEV_URL = 'https://stamp-dev.firefly.land/avatar';
export const HEY_IPFS_GW_URL = 'https://gw.ipfs-lens.dev/ipfs';
export const DSEARCH_BASE_URL = 'https://dsearch.mask.r2d2.to';
export const CORS_HOST = 'https://cors-next.r2d2.to';
export const FIREFLY_WORKER_HOST = 'https://firefly.r2d2.to';
export const COINGECKO_ROOT_URL = 'https://coingecko-agent.r2d2.to/api/v3';
export const GO_PLUS_LABS_ROOT_URL = 'https://gopluslabs.r2d2.to';
export const DEBANK_OPEN_API = 'https://debank-proxy.r2d2.to';
export const TWITTER_UPLOAD_MEDIA_URL = 'https://upload.twitter.com/1.1/media/upload.json';
export const SNAPSHOT_GRAPHQL_URL = 'https://hub.snapshot.org/graphql';
export const SNAPSHOT_SCORES_URL = 'https://score.snapshot.org';
export const SNAPSHOT_SEQ_URL = 'https://seq.snapshot.org';
export const SNAPSHOT_RELAY_URL = 'https://relayer.snapshot.org';
export const SNAPSHOT_IPFS_GATEWAY_URL = 'https://snapshot.4everland.link/ipfs/';
export const FIREFLY_TELEGRAM_URL = 'https://t.me/fireflyapp';
export const BSKY_VIDEO_ENDPOINT = 'https://video.bsky.app/xrpc';
export const NEYNAR_URL = 'https://neynar-proxy.r2d2.to';
export const FIREFLY_NITTER_URL = 'https://nitter.r2d2.to';
export const X3_PRO_AVATAR_URL = 'https://x3-media-pro-3.oss-cn-hongkong.aliyuncs.com';
export const ORB_API_URL = 'https://orbapi.xyz';
export const CALENDAR_BASE_URL = 'https://mask-network-dev.firefly.land/v1/calendar/';
export const ACCOUNT_CONFLICT_SOLUTION_URL =
    'https://mask.notion.site/Experience-a-login-conflict-2227d90fdc9b819cabffe6a98d87f901';
export const ACCOUNT_CONFLICT_SOLUTION_ZH_URL = 'https://mask.notion.site/2327d90fdc9b80c8aba6e217343b304b';
export const FARCASTER_POLL_MINI_APP_URL = 'https://polls-miniapps.firefly.social';
export const FARCASTER_POLL_MINI_APP_URL_DEV = 'https://polls-miniapps-staging.firefly.social';

export const ADVERTISEMENT_JSON_URL = `${FIREFLY_S3_DOMAIN}/advertisement/web.json`;

export const FARCASTER_REPLY_COUNTDOWN = 50; // in seconds
export const ORB_REPLY_COUNTDOWN = 60; // in seconds

export const RP_HASH_TAG = '#FireflyLuckyDrop';

export const HIDDEN_SECRET = '[HIDE_FROM_CLIENT]';
export const NOT_DEPEND_SECRET = '[TO_BE_REPLACED_LATER]';

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
    [Source.Twitter]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.TruthSocial,
    ],
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
    [Source.Twitter]: [
        SocialProfileCategory.Feed,
        SocialProfileCategory.Replies,
        SocialProfileCategory.Media,
        SocialProfileCategory.TruthSocial,
    ],
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
        WalletProfileCategory.Transactions,
        WalletProfileCategory.Bets,
        WalletProfileCategory.NFTs,
        WalletProfileCategory.Activities,
    ],
    [NetworkType.Solana]: [WalletProfileCategory.Transactions],
};
export const SORTED_ENGAGEMENT_TAB_TYPE: Record<SocialSource, EngagementType[]> = {
    [Source.Lens]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Mirrors],
    // TODO No API to fetch recasts for now.
    [Source.Farcaster]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Recasts],
    [Source.Twitter]: [EngagementType.Likes, EngagementType.Quotes],
    [Source.Bsky]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Mirrors],
};
export const SORTED_SEARCH_TYPE: Record<SocialSource, SearchType[]> = {
    [Source.Lens]: [SearchType.Posts, SearchType.Profiles, SearchType.Clubs],
    [Source.Farcaster]: [SearchType.Posts, SearchType.Profiles, SearchType.Clubs],
    [Source.Twitter]: [SearchType.Posts, SearchType.Profiles],
    [Source.Bsky]: [SearchType.Posts, SearchType.Profiles, SearchType.Clubs],
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
export const SORTED_TOKEN_FEEDS_SOURCES = [Source.Twitter, Source.X3Pro, Source.Farcaster, Source.Lens, Source.Bsky];
export const SORTED_CROSS_AT_SOCIAL_SOURCES = [Source.Twitter, Source.Farcaster, Source.Lens, Source.Bsky] as const;
export const SORTED_SCHEDULE_POST_SOURCES = [Source.Twitter, Source.Farcaster, Source.Lens, Source.Bsky] as const;
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
export const SORTED_CHANNEL_SOURCES: SocialSource[] = [Source.Farcaster];
export const SORTED_POLL_SOURCES: SocialSource[] = [Source.Farcaster, Source.Twitter, Source.Lens];
export const SORTED_MEDIA_SOURCES: MediaSource[] = [
    MediaSource.Twimg,
    MediaSource.S3,
    MediaSource.IPFS,
    MediaSource.Imgur,
    MediaSource.Giphy,
    MediaSource.Tenor,
    MediaSource.Local,
];
export const SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES = [Source.Farcaster];
export const NOTIFICATION_SOURCES = [Source.Notifications, Source.Farcaster, Source.Lens, Source.Bsky];

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

export const SUPPORTED_MULTIPLE_EMBED_SOURCES: SocialSource[] = [Source.Farcaster];
export const SUPPORTED_PREVIEW_MEDIA_TYPES: Array<Attachment['type']> = ['Image', 'AnimatedGif'];
export const SUPPORTED_FRAME_SOURCES: SocialSource[] = [Source.Farcaster];
export const SUPPORTED_VIDEO_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Twitter, Source.Bsky];
export const SUPPORTED_MEDIA_CORS_SOURCES: Source[] = [Source.Farcaster, Source.Lens, Source.Twitter];
export const SUPPORTED_CHANNEL_SOURCES: Source[] = [Source.Farcaster, Source.Lens];
export const SOCIAL_DISCOVER_SOURCE: SocialDiscoverSource[] = [Source.Farcaster, Source.Lens, Source.Bsky] as const;
export const SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED: SocialDiscoverSource[] = [Source.Twitter];
export const SOCIAL_DISCOVER_WHITELIST_SOURCE: SocialDiscoverSource[] = [Source.Twitter];
export const QUERY_MUTE_PROFILE_SOURCES = [Source.Bsky, Source.Twitter, Source.Lens];
export const DISCOVER_SOURCES: DiscoverSource[] = [Source.Posts, Source.Transactions, Source.Activities] as const;
export const FOLLOWING_SOURCES: FollowingSource[] = [
    Source.Posts,
    Source.Transactions,
    Source.Polymarket,
    Source.Activities,
] as const;
export const FOLLOWING_CATEGORY = [FollowCategory.Followers, FollowCategory.Mutuals, FollowCategory.Following] as const;
export const REQUIRE_LOGIN_FOLLOWING_CATEGORY = [FollowCategory.Mutuals];
export const REQUIRE_LOGIN_SOURCES: RequestedLoginSource[] =
    env.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [] : [Source.Twitter];
export const REQUIRE_LOGIN_SOURCES_IN_SEARCH: SocialSource[] =
    env.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [Source.Bsky] : [Source.Twitter, Source.Bsky];
export const SUPPORTED_ANONYMOUS_POST_SOURCES: SocialSource[] = [Source.Farcaster, Source.Twitter];

export const EXPLORE_TYPES: ExploreType[] = [
    ExploreType.TopProfiles,
    ExploreType.TruthSocial,
    ExploreType.CryptoTrends,
    ExploreType.NFTs,
    ExploreType.TopChannels,
    ExploreType.Projects,
];

export const EXPLORE_SOURCES: Partial<Record<ExploreType, ExploreSource[]>> = {
    [ExploreType.TopProfiles]: [Source.Twitter, Source.Farcaster, Source.Lens, Source.Bsky],
    [ExploreType.CryptoTrends]: [
        TrendingType.TopGainers,
        TrendingType.TopLosers,
        TrendingType.Trending,
        TrendingType.Meme,
    ],
    [ExploreType.TopChannels]: [Source.Bsky],
};

export const EXPLORE_DEFAULT_SOURCE: Record<ExploreType, ExploreSource | undefined> = {
    [ExploreType.TopProfiles]: Source.Twitter,
    [ExploreType.Projects]: undefined,
    [ExploreType.TruthSocial]: undefined,
    [ExploreType.CryptoTrends]: TrendingType.Trending,
    [ExploreType.TopChannels]: Source.Bsky,
    [ExploreType.NFTs]: TrendingType.Trending,
};

export const BOOKMARK_SOURCES: BookmarkSource[] = [
    Source.Farcaster,
    Source.Lens,
    Source.Bsky,
    Source.Tokens,
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

export const TIPS_SUPPORT_NETWORKS = [NetworkType.Ethereum, NetworkType.Solana];

// Lens
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
export const ARWEAVE_GATEWAY = 'https://arweave.net/';
export const LENS_MEDIA_SNAPSHOT_URL = 'https://ik.imagekit.io/lens/media-snapshot';
export const HEY_URL = 'https://hey.xyz';
export const HEY_API_URL = 'https://api.hey.xyz';
export const HEY_IMAGEKIT_URL = 'https://ik.imagekit.io/lensterimg';
export const LENS_CHAIN_ID = 232;
// TODO: create lens app for firefly
export const FIREFLY_LENS_V3_APP = '0xaC19aa2402b3AC3f9Fe471D4783EC68595432465';
export const LENS_TOKEN_STORAGE_KEY = 'lens.mainnet.credentials';
export const LENS_API_URL = 'https://api.lens.xyz/graphql';

// Named transforms for ImageKit
export const IMAGE_KIT_AVATAR = 'tr:w-300,h-300';
export const IMAGE_KIT_COVER = 'tr:w-1500,h-500';
export const IMAGE_KIT_ATTACHMENT = 'tr:w-1000';

export const IS_PRODUCTION = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_NEV.Production;
export const IS_DEVELOPMENT = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_NEV.Development;
export const IS_PREVIEW = env.external.NEXT_PUBLIC_VERCEL_ENV === VERCEL_NEV.Preview;

// polls
export const FRAME_SERVER_URL = 'https://polls.firefly.social';
export const FRAME_DEV_SERVER_URL = 'https://polls-staging.firefly.social';

// HTTP Cache headers
export const CACHE_AGE_INDEFINITE_ON_DISK = 'public, s-maxage=31536000, max-age=31536000, must-revalidate';

// Search Bar
export const MAX_SEARCH_RECORD_SIZE = 5;
export const MAX_RECOMMEND_PROFILE_SIZE = 5;

// POST
export const MAX_FRAME_SIZE_PER_POST = 1;
export const MIN_CHAR_LENGTH_TO_TRANSLATE = 3;

export const MAX_POST_SIZE_PER_THREAD = env.shared.NODE_ENV === NODE_ENV.Development ? 10 : 25;
export const MIN_POST_SIZE_PER_THREAD = 3;

// Contracts
export const LENS_HUB_PROXY_ADDRESS = '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d';
export const POAP_CONTRACT_ADDRESS = '0x22C1f6050E56d2876009903609a2cC3fEf83B415';

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

export const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

export const MAX_SIZE_PER_CHUNK = 2 * 1024 * 1024; // 2MB

export const METRICS_PASSWORD_LENGTH = 6;

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

export const TOKEN_CATEGORIES: TokenCategory[] = [TokenCategory.Transactions, TokenCategory.Feeds];

/** coingecko coin ids that are not solana or ethereum */
export const NO_TRACING_COINS = [
    'bitcoin',
    'bitcoin-cash',
    'bittensor',
    'dogecoin',
    'tron',
    'cardano',
    'sui',
    'polkadot',
    'hyperliquid',
    'litecoin',
    'stellar',
    'ripple', // xrp
    'hedera-hashgraph',
    'gxchain',
    'thala-apt',
];
export const TRACING_CHAINS = [
    EthereumChainId.Mainnet,
    EthereumChainId.Base,
    EthereumChainId.Polygon,
    EthereumChainId.BSC,
    EthereumChainId.Arbitrum,
    EthereumChainId.Optimism,
    SolanaChainId.Mainnet,
] as const;
/** TRACING_CHAINS to coingecko chain runtime ids */
export const TRACING_RUNTIME_LIST: Runtime[] = [
    'ethereum',
    'base',
    'polygon-pos',
    'binance-smart-chain',
    'arbitrum-one',
    'optimistic-ethereum',
    'solana',
] as const;
export const COINGECKO_SOL_COIN_ID = 'solana';
export const SWAP_SOL_NATIVE_ADDRESS = '11111111111111111111111111111111';

export const X3_PRO_CHAIN_IDS = [EthereumChainId.BSC, EthereumChainId.Base, SolanaChainId.Mainnet];

export const SESSION_PASSWORD_INPUT_ID = 'session-password-input';
export const SIGNUP_AUDIO_ID = 'signup-audio';

export const EIP6963_PROVIDER_DESCRIPTION = {
    name: SITE_NAME,
    icon: SITE_LOGO,
    rdns: 'social.firefly.frameHost',
    uuid: 'a2ed942a-3e45-4bef-907d-22700a5315d6',
};

export const EVENT_ROUTES: Array<`/${string}`> = ['/event', '/events'];
export const WHITEBOARD_ROUTES: Array<`/${string}`> = ['/frame', '/login', '/redirect', '/telegram', '/signup'];
