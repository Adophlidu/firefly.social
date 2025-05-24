export enum NODE_ENV {
    Production = 'production',
    Development = 'development',
    Test = 'test',
}

export enum VERCEL_NEV {
    Production = 'production',
    Preview = 'preview',
    Development = 'development',
}

export enum STATUS {
    Enabled = 'enabled',
    Disabled = 'disabled',
}

// The maskbook blockchain network plugin ID
export enum NetworkPluginID {
    PLUGIN_EVM = 'com.mask.evm',
    PLUGIN_SOLANA = 'com.mask.solana',
}

export enum PluginID {
    RedPacket = 'com.maskbook.red_packet',
}

export type ThemeMode = 'light' | 'dark' | 'default';

export enum Locale {
    en = 'en',
    zhHans = 'zh-Hans',
    zhHant = 'zh-Hant',
}

export enum PageRoute {
    Home = '/',
    Following = '/following/:source',
    FollowingPosts = '/following/posts',
    Discover = '/:source',
    Explore = '/explore',
    Notifications = '/notifications',
    Profile = '/profile',
    Bookmarks = '/bookmarks/:source',
    Settings = '/settings',
    Developers = '/developers',
    Search = '/search',
    PostDetail = '/post/:source/:id',
    Events = '/events',
    Token = '/token/:symbol',
    Article = '/article/:id',
    ProfileDetail = '/profile/:source/:id',
    Channel = '/community/:source/:id/:type',
    Event = '/event/:name',
    SettingConnected = '/settings/connected',
    SettingsMutes = '/settings/mutes',
}

export enum Source {
    Farcaster = 'Farcaster',
    Lens = 'Lens',
    Twitter = 'Twitter',
    Bsky = 'Bsky',
    Firefly = 'Firefly',
    Article = 'Article',
    Wallet = 'Wallet',
    WalletMix = 'Wallets',
    NFTs = 'NFTs',
    Polymarket = 'Polymarket',
    Telegram = 'Telegram',
    Google = 'Google',
    Apple = 'Apple',
    Email = 'Email',
    DAOs = 'DAOs',
    Posts = 'Posts',
    Notifications = 'Notifications',
    Swap = 'Swap',
    Transactions = 'Transactions',
    Activities = 'Activities',
}

export enum SourceInURL {
    Farcaster = 'farcaster',
    Lens = 'lens',
    Twitter = 'twitter',
    Bsky = 'bsky',
    Firefly = 'firefly',
    Article = 'article',
    Wallet = 'wallet',
    WalletMix = 'wallets',
    NFTs = 'nfts',
    Polymarket = 'polymarket',
    Telegram = 'telegram',
    Google = 'google',
    Apple = 'apple',
    Email = 'email',
    DAOs = 'daos',
    Posts = 'posts',
    Notifications = 'all',
    Swap = 'swap',
    FarcasterV2 = 'far',
    X = 'x',
    Transactions = 'transactions',
    Activities = 'activities',
}

export enum Agent {
    FarcasterFrame = 'farcaster_frame',
    FireflyApp = 'firefly_app',
    Browser = 'browser',
}

export enum FireflyPlatform {
    Farcaster = 'farcaster',
    Lens = 'lens',
    Twitter = 'twitter',
    Bsky = 'bsky',
    Firefly = 'firefly',
    Article = 'article',
    Wallet = 'wallet',
    NFTs = 'nfts',
    DAOs = 'snapshot',
    Polymarket = 'polymarket',
}

export enum ConnectionPlatform {
    Farcaster = 'farcaster',
    Lens = 'lens',
    Twitter = 'twitter',
    Bsky = 'bsky',
    Solana = 'solana',
    Wallet = 'wallet',
    Firefly = 'firefly',
    Telegram = 'telegram',
    Apple = 'apple',
    Google = 'google',
    Email = 'email',
}

export type SocialSource = Source.Farcaster | Source.Lens | Source.Twitter | Source.Bsky;

export type ThirdPartySource = Source.Telegram | Source.Apple | Source.Google | Source.Email;

// Strictly match the SessionType
export type ProfileSource =
    | Source.Farcaster
    | Source.Lens
    | Source.Twitter
    | Source.Bsky
    | Source.Firefly
    | Source.Telegram
    | Source.Apple
    | Source.Google
    | Source.Email;

export type LoginSource = SocialSource | ThirdPartySource;
export type RequestedLoginSource = Source.Twitter;

export type ProfilePageSource =
    | Source.Farcaster
    | Source.Lens
    | Source.Twitter
    | Source.Bsky
    | Source.Wallet
    | Source.WalletMix;
export type SocialSourceInURL =
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Twitter
    | SourceInURL.Bsky
    | SourceInURL.X;
export type ProfileSourceInURL =
    | SocialSourceInURL
    | SourceInURL.Wallet
    | SourceInURL.WalletMix
    | SourceInURL.FarcasterV2
    | SourceInURL.X;
export type SocialDiscoverSource = Source.Farcaster | Source.Lens | Source.Bsky | Source.Twitter;
export type SocialNotificationSource = Source.Farcaster | Source.Lens | Source.Bsky;
export type DiscoverSource = Source.Posts | Source.Activities | Source.Transactions;
export type BookmarkSource = Source.Farcaster | Source.Lens | Source.Article | Source.DAOs | Source.NFTs | Source.Bsky;
export type FollowingSource = DiscoverSource | Source.Transactions | Source.Activities;
export type ExploreSource = Source.Farcaster | Source.Lens | Source.Bsky | Source.Twitter | TrendingType;
export type ExploreSourceInURL =
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Bsky
    | SourceInURL.Twitter
    | SourceInURL.X
    | TrendingType;
export type NotificationSource = Source.Notifications | Source.Farcaster | Source.Lens | Source.Bsky;
export type NotificationSourceInURL =
    | SourceInURL.Notifications
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Bsky;
export type LoginFallbackSource =
    | SocialSource
    | Source.Article
    | Source.DAOs
    | Source.Polymarket
    | Source.Posts
    | Source.Notifications
    | Source.NFTs
    | Source.Swap
    | Source.Wallet;

export enum ExploreType {
    CryptoTrends = 'tokens',
    Projects = 'projects',
    TopProfiles = 'users',
    TopChannels = 'communities',
    TruthSocial = 'truth-social',
}

export enum TrendingType {
    TopGainers = 'top-gainers',
    TopLosers = 'top-losers',
    Trending = 'trending',
    Meme = 'meme',
}

export enum SearchType {
    Profiles = 'users',
    Posts = 'posts',
    Channels = 'channels',
    NFTs = 'nfts',
    Tokens = 'tokens',
    Communities = 'communities',
}

/**
 * The prefix of the redis key
 *
 * For example, the prefix format is `/[version]/[name]`
 * The final redis key is alike: `/[version]/[name]:[sequence_id]`
 */
export enum KeyType {
    DigestOpenGraphLink = '/v2/digestOpenGraphLink',
    DigestFrameLink = '/v3/digestFrameLink',
    GetLensThreadByPostId = '/v2/getLensThreadByPostId',
    RefreshLensThreadLock = '/v2/RefreshLensThreadLock',
    GetFollowings = '/v2/getFollowings',
    ConsumerSecret = '/v2/consumerSecret',
    GetBlink = '/v2/getBlink',
    GetClassifyPostLinkWithRedis = 'getClassifyPostLinkWithRedis',

    CreateMetadataToken = '/v2/createMetadataToken',
    CreateMetadataSwap = '/v2/createMetadataSwap',
    CreateMetadataPostById = '/v2/createPageMetadataById',
    CreateMetadataArticleById = '/v2/createMetadataArticleById',
    CreateMetadataProfileById = '/v2/createMetadataProfileById',
    CreateMetadataChannelById = '/v2/createMetadataChannelById',
    CreateMetadataEvent = '/v2/createMetadataEvent',

    TwitterHandleToUid = 'twitterHandleToUid',
    TwitterUidToHandle = 'twitterUidToHandle',
    GetTwitterAvatarById = 'getTwitterAvatar',
}

export enum SocialProfileCategory {
    Feed = 'feed',
    Replies = 'replies',
    Likes = 'likes',
    Media = 'media',
    Collected = 'collected',
    Channels = 'channels',
    TruthSocial = 'truth-social',
}

export enum WalletProfileCategory {
    POAPs = 'poaps',
    NFTs = 'nfts',
    Activities = 'activities',
    Transactions = 'transactions',
}

export enum EngagementType {
    Mirrors = 'mirrors',
    Quotes = 'quotes',
    Recasts = 'recasts',
    Likes = 'likes',
}

export enum RestrictionType {
    Everyone = 0,
    OnlyPeopleYouFollow = 1,
    MentionedProfiles = 2,
    YouFollower = 4,
    Nobody = 3,
}

export enum ScrollListKey {
    Discover = 'discover-list',
    ForYou = 'for-you',
    Recent = 'recent',
    Following = 'following-list',
    Followers = 'followers-list',
    MutualFollowers = 'mutual-followers-list',
    Notification = 'notification-list',
    Search = 'search-list',
    TokenTrending = 'token-trending-list',
    Comment = 'comment-list',
    Channel = 'channel-post-list',
    Profile = 'profile-list',
    Bookmark = 'bookmark',
    Collected = 'profile-collected-list',
    Engagement = 'post-engagement',
    NFTList = 'nft-list',
    TopCollectors = 'top-collectors',
    SuggestedUsers = 'suggested-users',
    SchedulePosts = 'schedule-posts',
    SnapshotVotes = 'snapshot-votes',
    Activity = 'activity',
    Polymarket = 'polymarket-list',
    RedPacketHistory = 'redpacket-history',
    TrendingFeeds = 'trending-feeds',
    Swap = 'swap-list',
    GroupMembers = 'group-members',
    GroupPosts = 'group-posts',
    ChannelMembers = 'channel-members',
    ChannelFollowers = 'channel-followers',
    Transactions = 'transactions-list',
    Activities = 'activities-list',
}

export enum FarcasterSignType {
    // connect with warpcast
    GrantPermission = 'grant_permission',
    // reconnect with firefly
    RelayService = 'relay_service',
    // recovery phrase
    RecoveryPhrase = 'recovery_phrase',
    FireflySponsorship = 'firefly_sponsorship',
}
export enum BookmarkType {
    All = 'all',
    Text = 'text',
    Video = 'video',
    Audio = 'audio',
    Image = 'image',
}

export enum MuteType {
    Profile = 'profile',
    Channel = 'channel',
    Wallet = 'wallet',
}

export enum NetworkType {
    Ethereum = 'ethereum',
    Solana = 'solana',
}

export enum CryptoUsage {
    Encrypt = 'encrypt',
    Decrypt = 'decrypt',
}

export enum CurrencyType {
    NATIVE = 'native',
    BTC = 'btc',
    ETH = 'eth',
    USD = 'usd',
    CNY = 'cny',
    HKD = 'hkd',
    JPY = 'jpy',
    EUR = 'eur',
}

export enum TokenType {
    Fungible = 'Fungible',
    NonFungible = 'NonFungible',
}

export const enum FollowCategory {
    Following = 'following',
    Followers = 'followers',
    Mutuals = 'mutuals',
}

export type ProfileCategory = FollowCategory | SocialProfileCategory | WalletProfileCategory;

export enum ChannelTabType {
    Members = 'members',
    Followers = 'followers',
    Posts = 'posts',
}

// async store needs to sync data from the server
export enum AsyncStatus {
    Idle = 'idle',
    Pending = 'pending',
}

export enum GiphyTabType {
    Gifs = 'gifs',
    Stickers = 'stickers',
    Text = 'text',
    Emoji = 'emoji',
}

export enum WalletSource {
    Farcaster = 'farcaster',
    Lens = 'lens',
    Twitter = 'twitter',
    Firefly = 'firefly',
    Article = 'article',
    Wallet = 'wallet',
    NFTs = 'nfts',
    LensContract = 'lens_contract',
    Particle = 'particle',
}

export enum AdvertisementType {
    Link = 'link',
    Function = 'function',
}

export enum AdFunctionType {
    OpenScan = 'openScan',
}

export enum UploadMediaStatus {
    Pending = 'pending',
    Uploading = 'in_progress',
    Success = 'succeeded',
    Failed = 'failed',
}

export enum FileMimeType {
    JPEG = 'image/jpeg',
    MP4 = 'video/mp4',
    MOV = 'video/quicktime',
    GIF = 'image/gif',
    PNG = 'image/png',
    WEBP = 'image/webp',
    BMP = 'image/bmp',
    MPEG = 'video/mpeg',
    // cspell: disable-next-line
    MS_VIDEO = 'video/x-msvideo',
    OGG = 'video/ogg',
    WEBM = 'video/webm',
    GPP = 'video/3gpp',
    GPP2 = 'video/3gpp2',
}

export enum FrameProtocol {
    OpenFrame = 'of',
    Farcaster = 'fc',
}

export enum S3ConvertStatus {
    Submitted = 'SUBMITTED',
    Progressing = 'PROGRESSING',
    Complete = 'COMPLETE',
    Canceled = 'CANCELED',
    Error = 'ERROR',
    StatusUpdate = 'STATUS_UPDATE',
}

export enum SimulateStatus {
    Pending = 'pending',
    Unverified = 'unverified',
    Unsafe = 'unsafe',
    Success = 'success',
    Error = 'error',
}

export enum SimulateType {
    Swap = 'swap',
    Send = 'send',
    Approve = 'approve',
    Receive = 'receive',
    Signature = 'signature',
    Unknown = 'unknown',
}

export enum ExternalSiteDomain {
    Warpcast = 'warpcast.com',
    Hey = 'hey.xyz',
    Twitter = 'twitter.com',
    X = 'x.com',
}

export enum SnapshotState {
    Active = 'active',
    Pending = 'pending',
    Passed = 'passed',
    Rejected = 'rejected',
    Executed = 'executed',
    Closed = 'closed',
}

export enum PolymarketBetType {
    Buy = 'buy',
    Sell = 'sell',
}

export enum LinkDigestType {
    NFT = 'nft',
    LensPost = 'lensPost',
    FarcasterPost = 'farcasterPost',
    Mirror = 'mirror',
    Paragraph = 'paragraph',
    Snapshot = 'snapshot',
    Twitter = 'twitter',
    TwitterXQT = 'twitterXQT',
    FarcasterFrames = 'farcasterFrames',
}

export enum NFTMarketplace {
    Opensea = 'opensea',
    Magiceden = 'magiceden',
    Tensor = 'tensor',
    Trove = 'trove',
}

export enum MintStatus {
    NotSupported = 0,
    Mintable = 1,
    MintAgain = 2,
    NotStarted = 3,
    Ended = 4,
    Minted = 5,
    SoldOut = 6,
}

export enum HomeTab {
    Discover = 'discover',
    Following = 'following',
}

export enum SolanaWalletName {
    Phantom = 'Phantom',
    Particle = 'Firefly Wallet',
    Okx = 'OKX Wallet',
    Solflare = 'Solflare',
}

export enum BskyEmbedType {
    Images = 'app.bsky.embed.images',
    Video = 'app.bsky.embed.video',
    External = 'app.bsky.embed.external',
    Record = 'app.bsky.embed.record',
    RecordWithMedia = 'app.bsky.embed.recordWithMedia',
}

export enum BskyFacetType {
    Link = 'app.bsky.richtext.facet#link',
}

export enum ProfileEditableField {
    DisplayName = 'displayName',
    Website = 'website',
    Location = 'location',
    Bio = 'Bio',
}

export enum ChainRuntime {
    Ethereum = 'ethereum',
    Solana = 'solana',
}

export enum GroupTabType {
    Members = 'members',
    Posts = 'posts',
}

export enum CommunityType {
    FarcasterChannel = 'farcaster-channel',
    BskyFeed = 'bsky-feed',
    LensGroup = 'lens-group',
}

export enum ClickOrigin {
    NavBar = 'nav_bar',
    Settings = 'settings',
    Others = 'others',
}

export enum SiteCookies {
    Agent = 'agent',
    Locale = 'locale',
    FireflyRootAPI = 'firefly_root_api',
    FireflyRootClass = 'firefly_root_class',
}

export enum NameServiceID {
    ENS = 'ENS',
}

export enum TokenCategory {
    Transactions = 'transactions',
    Feeds = 'feeds',
    Overview = 'overview',
}

export enum ActivitiesPlatform {
    Snapshot = 'Snapshot',
    Mirror = 'Mirror',
    Paragraph = 'Paragraph',
    Limo = 'Limo',
}
