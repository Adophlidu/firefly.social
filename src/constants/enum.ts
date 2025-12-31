export enum NODE_ENV {
    Production = 'production',
    Development = 'development',
    Test = 'test',
}

export enum VERCEL_ENV {
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
    DiscoverPosts = '/posts',
    DiscoverTransactions = '/transactions',
    DiscoverActivities = '/activities',
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
    Channel = '/club/:source/:id/:type',
    Event = '/event/:name',
    SettingConnected = '/settings/connected',
    SettingsMutes = '/settings/mutes',
    Signup = '/signup',
    Sparks = '/sparks',
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
    Tokens = 'Tokens',
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
    X3Pro = 'X3Pro',
    Bets = 'Prediction',
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
    Tokens = 'tokens',
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
    Bets = 'bets',
}

export const enum CharTag {
    FIREFLY_RP = 'ff_rp',
    MENTION = 'mention_tag',
    FRAME = 'frame_tag',
    PROMOTE_LINK = 'promote_link',
    POST_LINK = 'post_link',
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
    Token = 'token',
    DAOs = 'snapshot',
    Polymarket = 'polymarket',
    Bets = 'bets',
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

export type SocialSourceInURL =
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Twitter
    | SourceInURL.Bsky
    | SourceInURL.X;
export type ProfilePageSource = SocialSource | Source.Wallet | Source.WalletMix;
export type ProfilePageSourceInURL = SocialSourceInURL | SourceInURL.Wallet | SourceInURL.WalletMix;
export type SocialDiscoverSource = Source.Farcaster | Source.Lens | Source.Bsky | Source.Twitter;
export type DiscoverSource = Source.Posts | Source.Activities | Source.Transactions | Source.Bets;
export type BookmarkSource =
    | Source.Farcaster
    | Source.Lens
    | Source.Article
    | Source.DAOs
    | Source.NFTs
    | Source.Tokens
    | Source.Bsky
    | Source.Bets;
export type FollowingSource = DiscoverSource | Source.Transactions | Source.Activities | Source.Bets;
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
    | Source.Bets
    | Source.Posts
    | Source.Notifications
    | Source.NFTs
    | Source.Swap
    | Source.Wallet;

export enum ExploreType {
    CryptoTrends = 'tokens',
    Projects = 'projects',
    TopProfiles = 'users',
    TopChannels = 'clubs',
    TruthSocial = 'truth-social',
    NFTs = 'nfts',
    Bets = 'bets',
}

export enum TrendingType {
    Trending = 'trending',
    Stocks = 'stocks',
    Newest = 'newest',
    TopSearches = 'top-searches',
}

export enum SearchType {
    Profiles = 'users',
    Posts = 'posts',
    Channels = 'channels',
    NFTs = 'nfts',
    Tokens = 'tokens',
    Clubs = 'clubs',
    Bets = 'bets',
}

/**
 * The prefix of the redis key
 *
 * For example, the prefix format is `/[version]/[name]`
 * The final redis key is alike: `/[version]/[name]:[sequence_id]`
 */
export enum KeyType {
    GetLensThreadByPostId = '/v2/getLensThreadByPostId',
    ConsumerSecret = '/v2/consumerSecret',
    GetTwitterAvatarById = '/v2/getTwitterAvatar',
    PostState = '/v2/post-state',
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
    NFTs = 'nfts',
    Activities = 'activities',
    Transactions = 'transactions',
    Bets = 'bets',
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
    RedPacketHistory = 'redpacket-history',
    TrendingFeeds = 'trending-feeds',
    Swap = 'swap-list',
    GroupMembers = 'group-members',
    GroupPosts = 'group-posts',
    ChannelMembers = 'channel-members',
    ChannelFollowers = 'channel-followers',
    Transactions = 'transactions-list',
    Activities = 'activities-list',
    Bets = 'bets-list',
    BetsLeaderboard = 'bets-leaderboard',
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

export enum OkxProviderType {
    EVM = 'EVM',
    SOLANA = 'SOLANA',
    WALLET_CONNECT = 'WALLET_CONNECT',
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
    Privy = 'privy',
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

export enum ExternalSiteDomain {
    Warpcast = 'warpcast.com',
    Farcaster = 'farcaster.xyz',
    Hey = 'hey.xyz',
    Twitter = 'twitter.com',
    X = 'x.com',
    Bsky = 'bsky.app',
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

export enum BetsLeaderboardTab {
    Global = 'global',
    Following = 'following',
}

export enum PolymarketRankPeriod {
    OneDay = '1d',
    OneWeek = '1w',
    OneMonth = '1m',
    OneYear = '1y',
    All = 'all',
}

export enum PolymarketRankOrder {
    Pnl = 'pnl',
    PnlRate = 'pnl_rate',
    Volume = 'volume',
}

export enum BskyEmbedType {
    Images = 'app.bsky.embed.images',
    Video = 'app.bsky.embed.video',
    External = 'app.bsky.embed.external',
    Record = 'app.bsky.embed.record',
    RecordWithMedia = 'app.bsky.embed.recordWithMedia',
}

export enum ProfileEditableField {
    DisplayName = 'displayName',
    Website = 'website',
    Location = 'location',
    Bio = 'Bio',
}

export enum ClubType {
    BskyFeed = 'bsky-feed',
    FarcasterChannel = 'farcaster-channel',
    LensGroup = 'lens-group',
}

export enum ClickOrigin {
    NavBar = 'nav_bar',
    Settings = 'settings',
    Others = 'others',
}

export enum SiteCookies {
    Locale = 'locale',
    FireflyRootAPI = 'firefly_root_api',
    FireflyRootClass = 'firefly_root_class',
}

export enum TokenCategory {
    Transactions = 'transactions',
    Feeds = 'feeds',
}

export enum ActivitiesPlatform {
    Snapshot = 'Snapshot',
    Mirror = 'Mirror',
    Paragraph = 'Paragraph',
    Limo = 'Limo',
    Matters = 'Matters',
}

export enum PlatformId {
    Mirror = 10096,
    Paragraph = 10097,
    Limo = 10098,
    Matters = 10099,
    Others = 0,
}

export enum PasswordStep {
    SetPassword = 'set_password',
    ConfirmPassword = 'confirm_password',
    ChangePassword = 'change_password',
    Success = 'success',
    VerifyPassword = 'verify_password',
}

export enum PasswordWorkflow {
    Set = 'set',
    Verify = 'verify',
    Change = 'change',
    Reset = 'reset',
}

export const PasswordWorkflowConfig: Record<PasswordWorkflow, PasswordStep[]> = {
    [PasswordWorkflow.Set]: [PasswordStep.SetPassword, PasswordStep.ConfirmPassword, PasswordStep.Success],
    [PasswordWorkflow.Verify]: [PasswordStep.VerifyPassword, PasswordStep.Success],
    [PasswordWorkflow.Change]: [
        PasswordStep.SetPassword,
        PasswordStep.ChangePassword,
        PasswordStep.ConfirmPassword,
        PasswordStep.Success,
    ],
    [PasswordWorkflow.Reset]: [PasswordStep.SetPassword, PasswordStep.ConfirmPassword, PasswordStep.Success],
};

export enum SignupStep {
    Welcome = 'welcome',
    LoginSocialPlatform = 'login_social_platform',
    CreateAccountForm = 'create_account_form',
    Success = 'success',
}

export enum TipsNotificationType {
    Tip = 'tip',
    Like = 'like',
}

export enum TipsDetailViewType {
    Sender = 'sender',
    Receiver = 'receiver',
}

export enum TxReactionType {
    LikeSwap = 'like_swap',
    LikeTip = 'like_token_tips',
    LikeMatters = 'like_matters',
    LikeMirror = 'like_mirror',
    LikeParagraph = 'like_paragraph',
    LikeLimo = 'like_limo',
    LikeDAO = 'like_dao',
    LikeNFT = 'like_nft',
    LikeBets = 'like_bets',
    ShareTip = 'repost_token_tips',
    ShareSwap = 'repost_swap',
}

export enum ScheduleTaskStatus {
    Pending = 'pending',
    Failed = 'fail',
    Success = 'success',
}

export enum LensSignType {
    Lens = 'lens',
    OrbScan = 'orb_scan',
}

export enum NotificationSourceType {
    Tips = 'tips',
    Schedule = 'schedule',
    Farcaster = 'farcaster',
    Lens = 'lens',
    Bsky = 'bsky',
}

export enum SparksAccountStatus {
    Activated = 1,
    HandleNotInList = 2,
    AccountNotExist = 3,
    AccountNotBindTwitterHandle = 4,
    NotActivated = 5,
}

export enum ExploreSwitchType {
    TrendingToken = 'trending_token',
    TrendingNFT = 'trending_nft',
    TruthSocial = 'trump_truth',
}

export enum MetadataAttributeType {
    BOOLEAN = 'Boolean',
    DATE = 'Date',
    NUMBER = 'Number',
    STRING = 'String',
    JSON = 'JSON',
}

export enum TimeRangeFilter {
    FiveMinutes = 'm5',
    OneHour = 'h1',
    SixHours = 'h6',
    OneDay = 'h24',
}

export enum ExtraLikeType {
    Tips = 'tips',
}

export enum ConnectionSource {
    Appkit = 'appkit',
    Privy = 'privy',
}

export enum SolanaNetworkType {
    Appkit = 'appkit',
    Privy = 'privy-solana',
}

export enum BetsPlatform {
    Polymarket = 'polymarket',
    Opinion = 'opinion',
}
