/* cspell:disable */

import {
    FollowCategory,
    PredictionPlatform,
    type ProfilePageSource,
    SocialProfileCategory,
    type SocialSource,
    Source,
    SourceInURL,
    WalletProfileCategory,
} from '@dimensiondev/enums';
import { solana } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

import {
    type BookmarkSource,
    ChannelTabType,
    type DiscoverSource,
    EngagementType,
    type ExploreSource,
    ExploreType,
    FileMimeType,
    type FollowingSource,
    type NotificationSource,
    ProfileEditableField,
    SearchType,
    type SocialDiscoverSource,
    TokenCategory,
    TrendingType,
} from '@/constants/enum.js';
import { type Attachment, NotificationType } from '@/providers/types/SocialMedia.js';
import type { Runtime } from '@/providers/types/Trending.js';
import { MediaSource } from '@/types/compose.js';

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
        WalletProfileCategory.Prediction,
        WalletProfileCategory.Activities,
    ],
    [NetworkType.Solana]: [WalletProfileCategory.Transactions],
};
export const SORTED_ENGAGEMENT_TAB_TYPE: Record<SocialSource, EngagementType[]> = {
    [Source.Lens]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Mirrors],
    // TODO No API to fetch recasts for now.
    [Source.Farcaster]: [EngagementType.Likes, EngagementType.Quotes, EngagementType.Recasts],
    // Twitter/X API no longer provides likes data
    [Source.Twitter]: [EngagementType.Quotes, EngagementType.Mirrors],
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
    Source.Twitter,
    Source.Lens,
    Source.Farcaster,
    Source.Bsky,
    Source.Wallet,
    Source.WalletMix,
];
export const SORTED_PROFILE_SOURCES: ProfilePageSource[] = [
    Source.Twitter,
    Source.Lens,
    Source.Farcaster,
    Source.Bsky,
    Source.Wallet,
];
export const SORTED_SOCIAL_SOURCES = [Source.Twitter, Source.Lens, Source.Farcaster, Source.Bsky] as const;
export const SORTED_TOKEN_FEEDS_SOURCES = [Source.Twitter, Source.Lens, Source.Farcaster, Source.Bsky];
export const SORTED_CROSS_AT_SOCIAL_SOURCES = [Source.Twitter, Source.Lens, Source.Farcaster, Source.Bsky] as const;
export const SORTED_SCHEDULE_POST_SOURCES = [Source.Twitter, Source.Lens, Source.Farcaster, Source.Bsky] as const;
export const SORTED_LOGIN_SOCIAL_SOURCES = [Source.Twitter, Source.Lens, Source.Farcaster, Source.Bsky] as const;
export const SORTED_SOCIAL_ACCOUNT_AVATAR_SOURCE = [
    Source.Twitter,
    Source.Lens,
    Source.Farcaster,
    Source.Bsky,
] as const;
export const SORTED_THIRD_PARTY_SOURCES = [Source.Google, Source.Telegram, Source.Apple, Source.Email] as const;
export const NEXT_AUTH_SOURCES = [Source.Twitter, ...SORTED_THIRD_PARTY_SOURCES] as const;
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
export const NOTIFICATION_SOURCES = [Source.Notifications, Source.Lens, Source.Farcaster, Source.Bsky];

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
export const DEFAULT_BOOKMARK_SOURCE = Source.Lens;
export const DEFAULT_NOTIFICATION_SOURCE = Source.Notifications;
export const DEFAULT_EXPLORE_TYPE = ExploreType.Prediction;

export const SUPPORTED_MULTIPLE_EMBED_SOURCES: SocialSource[] = [Source.Farcaster];
export const SUPPORTED_PREVIEW_MEDIA_TYPES: Array<Attachment['type']> = ['Image', 'AnimatedGif'];
export const SUPPORTED_FRAME_SOURCES: SocialSource[] = [Source.Farcaster];
export const SUPPORTED_VIDEO_SOURCES: SocialSource[] = [Source.Farcaster, Source.Lens, Source.Twitter, Source.Bsky];
export const SUPPORTED_MEDIA_CORS_SOURCES: Source[] = [Source.Farcaster, Source.Lens, Source.Twitter];
export const SUPPORTED_CHANNEL_SOURCES: Source[] = [Source.Farcaster, Source.Lens];
export const SUPPORTED_FETCH_POST_PUBLISH_INFO_SOURCES: SocialSource[] = [Source.Bsky, Source.Twitter];
export const SOCIAL_DISCOVER_SOURCE: SocialDiscoverSource[] = [Source.Lens, Source.Farcaster, Source.Bsky] as const;
export const SOCIAL_DISCOVER_SOURCE_LOGIN_REQUIRED: SocialDiscoverSource[] = [Source.Twitter];
export const SOCIAL_DISCOVER_WHITELIST_SOURCE: SocialDiscoverSource[] = [Source.Twitter];
export const DISCOVER_SOURCES: DiscoverSource[] = [
    Source.Posts,
    Source.Transactions,
    Source.Prediction,
    Source.Activities,
] as const;
export const FOLLOWING_SOURCES: FollowingSource[] = [
    Source.Posts,
    Source.Transactions,
    Source.Prediction,
    Source.Activities,
] as const;
export const FOLLOWING_CATEGORY = [FollowCategory.Followers, FollowCategory.Mutuals, FollowCategory.Following] as const;
export const REQUIRE_LOGIN_FOLLOWING_CATEGORY = [FollowCategory.Mutuals];
export const SUPPORTED_ANONYMOUS_POST_SOURCES: SocialSource[] = [Source.Farcaster, Source.Twitter];

export const ANONYMOUS_HANDLE_BY_SOURCE: Record<SocialSource, string | null> = {
    [Source.Farcaster]: 'anoncast',
    [Source.Twitter]: 'anoncast_',
    [Source.Bsky]: null,
    [Source.Lens]: null,
};

export const EXPLORE_TYPES: ExploreType[] = [
    ExploreType.Prediction,
    ExploreType.TopProfiles,
    ExploreType.TruthSocial,
    ExploreType.CryptoTrends,
    ExploreType.TopChannels,
    ExploreType.Projects,
];

export const EXPLORE_SOURCES: Partial<Record<ExploreType, ExploreSource[]>> = {
    [ExploreType.TopProfiles]: [Source.Twitter, Source.Farcaster, Source.Bsky],
    [ExploreType.CryptoTrends]: [
        TrendingType.Trending,
        TrendingType.Stocks,
        TrendingType.Newest,
        TrendingType.TopSearches,
    ],
    [ExploreType.TopChannels]: [Source.Lens, Source.Farcaster, Source.Bsky],
};

export const EXPLORE_DEFAULT_SOURCE: Record<ExploreType, ExploreSource | undefined> = {
    [ExploreType.TopProfiles]: Source.Twitter,
    [ExploreType.Projects]: undefined,
    [ExploreType.TruthSocial]: undefined,
    [ExploreType.CryptoTrends]: TrendingType.Trending,
    [ExploreType.TopChannels]: Source.Lens,
    [ExploreType.Prediction]: undefined,
};

export const BOOKMARK_SOURCES: BookmarkSource[] = [
    Source.Lens,
    Source.Farcaster,
    Source.Bsky,
    Source.Tokens,
    Source.Prediction,
    Source.Article,
    Source.DAOs,
];

export const SORTED_NOTIFICATIONS_SOURCES: NotificationSource[] = [
    Source.Notifications,
    Source.Twitter,
    Source.Lens,
    Source.Farcaster,
    Source.Bsky,
];

export const TIPS_SUPPORT_NETWORKS = [NetworkType.Ethereum, NetworkType.Solana];

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

export const TOKEN_CATEGORIES: TokenCategory[] = [TokenCategory.Transactions, TokenCategory.Feeds];

export const TRACING_CHAINS = [mainnet.id, base.id, polygon.id, bsc.id, arbitrum.id, optimism.id, solana.id] as const;
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

export const ARTICLE_LIKE_NOTIFICATION_TYPES: NotificationType[] = [
    NotificationType.LikeMatters,
    NotificationType.LikeMirror,
    NotificationType.LikeParagraph,
    NotificationType.LikeLimo,
];

export const UNIFIED_NOTIFICATION_TYPES: NotificationType[] = [
    ...ARTICLE_LIKE_NOTIFICATION_TYPES,
    NotificationType.LikeBets,
    NotificationType.LikeDAO,
    NotificationType.LikeNFT,
];

export const SOCIAL_NOTIFICATION_TYPES: NotificationType[] = [
    NotificationType.Reaction,
    NotificationType.Comment,
    NotificationType.Mirror,
    NotificationType.Quote,
    NotificationType.Follow,
    NotificationType.Mention,
    NotificationType.Act,
];

export const SORTED_BETS_PLATFORM: PredictionPlatform[] = [PredictionPlatform.Polymarket, PredictionPlatform.Opinion];

export const X_WEBHOOK_WHITELIST_CLIENT_IDS = [
    '1642807673610715136', // neoding555
    '295218901', // vk
    '635682749', // suji
];
