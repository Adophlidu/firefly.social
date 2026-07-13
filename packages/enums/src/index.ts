// --- Environment & site ---

export type ThemeMode = 'light' | 'dark' | 'default';

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

export enum SiteCookies {
    Locale = 'locale',
    FireflyRootAPI = 'firefly_root_api',
    FireflyRootClass = 'firefly_root_class',
}

export enum Locale {
    en = 'en',
    es = 'es',
    ja = 'ja',
    ko = 'ko',
    zhHans = 'zh-Hans',
    zhHant = 'zh-Hant',
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

// --- Platform & source ---

export enum FireflyPlatform {
    Farcaster = 'farcaster',
    Lens = 'lens',
    Twitter = 'twitter',
    Bsky = 'bsky',
    Firefly = 'firefly',
    Article = 'article',
    Wallet = 'wallet',
    Token = 'token',
    DAOs = 'snapshot',
    Polymarket = 'polymarket',
    Prediction = 'bets',
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
    Prediction = 'Prediction',
    Polymarket = 'Polymarket',
    WorldCup = 'WorldCup',
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
    Transactions = 'trades',
    Activities = 'activities',
    Prediction = 'prediction',
    Polymarket = 'polymarket',
    WorldCup = 'world-cup-feed',
}

export type SocialSource = Source.Farcaster | Source.Lens | Source.Twitter | Source.Bsky;

export type SocialSourceInURL =
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Twitter
    | SourceInURL.Bsky
    | SourceInURL.X;

export type ProfilePageSource = SocialSource | Source.Wallet | Source.WalletMix;

export type ProfilePageSourceInURL = SocialSourceInURL | SourceInURL.Wallet | SourceInURL.WalletMix;

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

export type ProfileSourceInURL = ProfilePageSourceInURL | SourceInURL.FarcasterV2;

export type ThirdPartySource = Source.Telegram | Source.Apple | Source.Google | Source.Email;

export type LoginSource = SocialSource | ThirdPartySource;

export type RequestedLoginSource = Source.Twitter;

export type SocialDiscoverSource = Source.Farcaster | Source.Lens | Source.Bsky | Source.Twitter;

export type DiscoverSource =
    | Source.Posts
    | Source.Activities
    | Source.Transactions
    | Source.Prediction
    | Source.WorldCup;

export type BookmarkSource =
    | Source.Farcaster
    | Source.Lens
    | Source.Article
    | Source.DAOs
    | Source.Tokens
    | Source.Bsky
    | Source.Prediction;

export type FollowingSource = DiscoverSource | Source.Transactions | Source.Activities | Source.Prediction;

export type NotificationSource = Source.Notifications | Source.Twitter | Source.Lens | Source.Farcaster | Source.Bsky;

export type NotificationSourceInURL =
    | SourceInURL.Notifications
    | SourceInURL.X
    | SourceInURL.Lens
    | SourceInURL.Farcaster
    | SourceInURL.Bsky;

export type LoginFallbackSource =
    | SocialSource
    | Source.Article
    | Source.DAOs
    | Source.Prediction
    | Source.Tokens
    | Source.Posts
    | Source.Notifications
    | Source.Swap
    | Source.Wallet;

// --- Session & account ---

// Strictly match the ProfileSource
export enum SessionType {
    Apple = 'Apple',
    Email = 'Email',
    Google = 'Google',
    Telegram = 'Telegram',
    Twitter = 'Twitter',
    Lens = 'Lens',
    Farcaster = 'Farcaster',
    Firefly = 'Firefly',
    Bsky = 'Bsky',
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

export enum ConnectionSource {
    Appkit = 'appkit',
    Privy = 'privy',
}

export enum Agent {
    FarcasterFrame = 'farcaster_frame',
    FireflyApp = 'firefly_app',
    Browser = 'browser',
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

export enum FarcasterSignType {
    // connect with warpcast
    GrantPermission = 'grant_permission',
    // reconnect with firefly
    RelayService = 'relay_service',
    // recovery phrase
    RecoveryPhrase = 'recovery_phrase',
    FireflySponsorship = 'firefly_sponsorship',
}

export enum LensSignType {
    Lens = 'lens',
    OrbScan = 'orb_scan',
}

// --- Navigation & routing ---

export enum PageRoute {
    Home = '/',
    Following = '/following/:source',
    FollowingPosts = '/following/posts',
    Discover = '/:source',
    DiscoverPosts = '/posts',
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
    WorldCup = '/world-cup',
    WorldCupFeed = '/world-cup-feed',
    PredictionCategory = '/prediction/category',
}

export enum HomeTab {
    Discover = 'discover',
    Following = 'following',
}

export enum ClickOrigin {
    NavBar = 'nav_bar',
    Settings = 'settings',
    Others = 'others',
}

// --- Discover, explore & search ---

export enum ExploreType {
    CryptoTrends = 'tokens',
    Projects = 'projects',
    TopProfiles = 'users',
    TopChannels = 'clubs',
    TruthSocial = 'truth-social',
    Prediction = 'prediction',
}

export enum TrendingType {
    Trending = 'trending',
    Stocks = 'stocks',
    Newest = 'newest',
    TopSearches = 'top-searches',
}

export type ExploreSource = Source.Farcaster | Source.Lens | Source.Bsky | Source.Twitter | TrendingType;

export type ExploreSourceInURL =
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Bsky
    | SourceInURL.Twitter
    | SourceInURL.X
    | TrendingType;

export enum ExploreSwitchType {
    TrendingToken = 'trending_token',
    TruthSocial = 'trump_truth',
}

export enum SearchType {
    Profiles = 'users',
    Posts = 'posts',
    Channels = 'channels',
    Tokens = 'tokens',
    Clubs = 'clubs',
    Prediction = 'prediction',
}

export enum TimeRangeFilter {
    FiveMinutes = 'm5',
    OneHour = 'h1',
    SixHours = 'h6',
    OneDay = 'h24',
}

// --- Profile & social graph ---

export enum FollowCategory {
    Following = 'following',
    Followers = 'followers',
    Mutuals = 'mutuals',
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
    Activities = 'activities',
    Transactions = 'transactions',
    Bets = 'bets',
    Prediction = 'prediction',
}

export type ProfileCategory = FollowCategory | SocialProfileCategory | WalletProfileCategory;

export enum ProfileEditableField {
    DisplayName = 'displayName',
    Website = 'website',
    Location = 'location',
    Bio = 'Bio',
}

export enum ChannelTabType {
    Members = 'members',
    Followers = 'followers',
    Posts = 'posts',
}

export enum ClubType {
    BskyFeed = 'bsky-feed',
    FarcasterChannel = 'farcaster-channel',
    LensGroup = 'lens-group',
}

export enum MuteType {
    Profile = 'profile',
    Channel = 'channel',
    Wallet = 'wallet',
}

// --- Compose & post ---

export enum CharTag {
    FIREFLY_RP = 'ff_rp',
    MENTION = 'mention_tag',
    FRAME = 'frame_tag',
    PROMOTE_LINK = 'promote_link',
    POST_LINK = 'post_link',
}

export enum RestrictionType {
    Everyone = 0,
    OnlyPeopleYouFollow = 1,
    MentionedProfiles = 2,
    YouFollower = 4,
    Nobody = 3,
}

export enum EngagementType {
    Mirrors = 'mirrors',
    Quotes = 'quotes',
    Recasts = 'recasts',
    Likes = 'likes',
}

export enum ExtraLikeType {
    Tips = 'tips',
}

export enum AttachmentType {
    Image = 'Image',
    Video = 'Video',
    Audio = 'Audio',
    Poll = 'Poll',
    AnimatedGif = 'AnimatedGif',
    Unknown = 'Unknown',
}

export enum PostType {
    Post = 'Post',
    Comment = 'Comment',
    Quote = 'Quote',
    Mirror = 'Mirror',
}

export enum DraftPostType {
    LocalNormal = 'local_normal',
    LocalTemp = 'local_temp',
    Cloud = 'cloud',
}

export enum ScheduleTaskStatus {
    Pending = 'pending',
    Failed = 'fail',
    Success = 'success',
}

export enum TxReactionType {
    LikeSwap = 'like_swap',
    LikeTip = 'like_token_tips',
    LikeMatters = 'like_matters',
    LikeMirror = 'like_mirror',
    LikeParagraph = 'like_paragraph',
    LikeLimo = 'like_limo',
    LikeDAO = 'like_dao',
    LikeBets = 'like_bets',
    ShareTip = 'repost_token_tips',
    ShareSwap = 'repost_swap',
}

export enum ActionType {
    Post = 'post',
    PostRedirect = 'post_redirect',
    Link = 'link',
    Mint = 'mint',
    Transaction = 'tx',
}

export enum MetadataAttributeType {
    BOOLEAN = 'Boolean',
    DATE = 'Date',
    NUMBER = 'Number',
    STRING = 'String',
    JSON = 'JSON',
}

// async store needs to sync data from the server
export enum AsyncStatus {
    Idle = 'idle',
    Pending = 'pending',
}

// --- Media & upload ---

export enum MediaSource {
    Local = 'local',
    Twimg = 'Twimg',
    IPFS = 'ipfs',
    Imgur = 'imgur',
    S3 = 's3',
    Giphy = 'giphy',
    Tenor = 'tenor',
    Host = 'host',
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
    MS_VIDEO = 'video/x-msvideo',
    OGG = 'video/ogg',
    WEBM = 'video/webm',
    GPP = 'video/3gpp',
    GPP2 = 'video/3gpp2',
}

export enum UploadMediaStatus {
    Pending = 'pending',
    Uploading = 'in_progress',
    Success = 'succeeded',
    Failed = 'failed',
}

export enum S3ConvertStatus {
    Submitted = 'SUBMITTED',
    Progressing = 'PROGRESSING',
    Complete = 'COMPLETE',
    Canceled = 'CANCELED',
    Error = 'ERROR',
    StatusUpdate = 'STATUS_UPDATE',
}

export enum GiphyTabType {
    Gifs = 'gifs',
    Stickers = 'stickers',
    Text = 'text',
    Emoji = 'emoji',
}

export enum BskyEmbedType {
    Images = 'app.bsky.embed.images',
    Video = 'app.bsky.embed.video',
    External = 'app.bsky.embed.external',
    Record = 'app.bsky.embed.record',
    RecordWithMedia = 'app.bsky.embed.recordWithMedia',
}

// --- Lists & UI keys ---

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
    Prediction = 'prediction-list',
    BetsLeaderboard = 'prediction-leaderboard',
    DraftList = 'draft-list',
}

// --- Bookmarks & notifications ---

export enum BookmarkType {
    All = 'all',
    Text = 'text',
    Video = 'video',
    Audio = 'audio',
    Image = 'image',
}

export enum NotificationSourceType {
    Tips = 'tips',
    Schedule = 'schedule',
    Farcaster = 'farcaster',
    Lens = 'lens',
    Bsky = 'bsky',
    X = 'x',
}

export enum NotificationType {
    Reaction = 'reaction',
    Comment = 'comment',
    Mirror = 'mirror',
    Quote = 'quote',
    Follow = 'follow',
    Mention = 'mention',
    Act = 'act',
    Tips = 'tips',
    Schedule = 'schedule',
    LikeMatters = 'like_matters',
    LikeMirror = 'like_mirror',
    LikeParagraph = 'like_paragraph',
    LikeLimo = 'like_limo',
    LikeBets = 'like_bets',
    LikeDAO = 'like_dao',
    PredictionReward = 'prediction_reward',
}

// --- Wallet, tokens & swap ---

export enum NetworkType {
    Ethereum = 'ethereum',
    Solana = 'solana',
}

export enum WalletSource {
    Farcaster = 'farcaster',
    Lens = 'lens',
    Twitter = 'twitter',
    Firefly = 'firefly',
    Article = 'article',
    Wallet = 'wallet',
    LensContract = 'lens_contract',
    Particle = 'particle',
    Privy = 'privy',
}

export enum RelatedWalletSource {
    firefly = 'firefly',
    cyber = 'cyber',
    hand_writing = 'hand_writing',
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

export enum WalletProfileDataSource {
    Particle = 'particle',
    Privy = 'privy',
}

export enum WatchType {
    Wallet = 'wallet',
    SolanaWallet = 'solana',
    MaskX = 'maskx',
    Twitter = 'twitter',
    Lens = 'lens',
    Farcaster = 'farcaster',
}

export enum TokenType {
    Fungible = 'Fungible',
}

export enum TokenCategory {
    Transactions = 'transactions',
    Feeds = 'feeds',
    About = 'about',
}

export enum TokenPlatformType {
    Cex = 'cex',
    Dex = 'dex',
}

export enum CustomTokenType {
    ERC20 = 'ERC20',
}

export enum SwapAccessPath {
    TokenDetail = '1',
    WalletGUI = '2',
    CopyTrade = '3',
}

export enum SwapFromPage {
    Swap = 'swap',
    BetWithdraw = 'bet-withdraw',
    BetDeposit = 'bet-deposit',
    PerpsDeposit = 'perps-deposit',
}

export enum EnsNameSource {
    Eth = 'ens',
    Base = 'base.eth',
    Sns = 'sns',
    Skr = 'seekerid',
}

export enum DefiUnitedTier {
    Bronze = 1,
    Silver = 2,
    Gold = 3,
}

// --- NFT & on-chain activity ---

export enum ErcType {
    ERC721 = 'erc721',
    ERC1155 = 'erc1155',
}

export enum TransEventType {
    Sale = 'Sale',
    Mint = 'Mint',
    Transfer = 'Transfer',
    Burn = 'Burn',
    /** non-exist */
    Poap = 'Poap',
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

export enum ActivityStatus {
    Upcoming = 0,
    Active = 1,
    Ended = 2,
}

// --- Articles & DAOs ---

export enum ArticlePlatform {
    Mirror = 'mirror',
    Paragraph = 'paragraph',
    Limo = 'limo',
    Matters = 'matters',
}

export enum ArticleType {
    Post = 'post',
    Revise = 'revise',
}

export enum ArticlePlatformId {
    Mirror = 10096,
    Paragraph = 10097,
    Limo = 10098,
    Matters = 10099,
    Others = 0,
}

export enum ActivitiesPlatform {
    Snapshot = 'Snapshot',
    Mirror = 'Mirror',
    Paragraph = 'Paragraph',
    Limo = 'Limo',
    Matters = 'Matters',
}

export enum SnapshotState {
    Active = 'active',
    Pending = 'pending',
    Passed = 'passed',
    Rejected = 'rejected',
    Executed = 'executed',
    Closed = 'closed',
}

// --- Prediction & bets ---

export enum PredictionPlatform {
    Polymarket = 'polymarket',
    Opinion = 'opinion',
}

export enum PolymarketBetType {
    Buy = 'buy',
    Sell = 'sell',
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

export enum BetsPriceTimeRange {
    OneHour = 1,
    SixHours = 2,
    OneDay = 3,
    OneWeek = 4,
    OneMonth = 5,
    All = 6,
}

export enum BetsMarketResolveStatus {
    Proposed = 'proposed',
    Disputed = 'disputed',
    Resolved = 'resolved',
    NoDisputed = 'no_disputed',
    Review = 'review',
}

// --- Frame & external platforms ---

export enum FrameProtocol {
    OpenFrame = 'of',
    Farcaster = 'fc',
}

export enum FarcasterNetwork {
    NONE = 0,
    /** MAINNET - Public primary network */
    MAINNET = 1,
    /** TESTNET - Public test network */
    TESTNET = 2,
    /** DEVNET - Private test network */
    DEVNET = 3,
}

export enum ExternalSiteDomain {
    Warpcast = 'warpcast.com',
    Farcaster = 'farcaster.xyz',
    Hey = 'hey.xyz',
    Twitter = 'twitter.com',
    X = 'x.com',
    Bsky = 'bsky.app',
}

// --- Tips & red packet ---

export enum TipsNotificationType {
    Tip = 'tip',
    Like = 'like',
}

export enum TipsDetailViewType {
    Sender = 'sender',
    Receiver = 'receiver',
}

export enum RedpacketTxType {
    create = 'create',
    claim = 'claim',
}

// --- Advertisement ---

export enum AdvertisementType {
    Link = 'link',
    Function = 'function',
}

export enum AdFunctionType {
    OpenScan = 'openScan',
}

// --- Infrastructure ---

/**
 * The prefix of the redis key
 *
 * For example, the prefix format is `/[version]/[name]`
 * The final redis key is alike: `/[version]/[name]:[sequence_id]`
 */
export enum KeyType {
    GetLensThreadByPostId = '/v3/getLensThreadByPostId',
    ConsumerSecret = '/v2/consumerSecret',
    GetTwitterAvatarById = '/v2/getTwitterAvatar',
    PostState = '/v2/post-state',
    ShortLink = '/v1/shortLink',
}

export enum ServerErrorCodes {
    UNKNOWN = 40001,
}
