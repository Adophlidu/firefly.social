import type { SocialSource, Source, SourceInURL } from '@dimensiondev/enums';

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
    MysteryBox = '/mystery-box',
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

export type SocialDiscoverSource = Source.Farcaster | Source.Lens | Source.Bsky | Source.Twitter;
export type DiscoverSource = Source.Posts | Source.Activities | Source.Transactions | Source.Prediction;
export type BookmarkSource =
    | Source.Farcaster
    | Source.Lens
    | Source.Article
    | Source.DAOs
    | Source.Tokens
    | Source.Bsky
    | Source.Prediction;
export type FollowingSource = DiscoverSource | Source.Transactions | Source.Activities | Source.Prediction;

export type ExploreSource = Source.Farcaster | Source.Lens | Source.Bsky | Source.Twitter | TrendingType;
export type ExploreSourceInURL =
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Bsky
    | SourceInURL.Twitter
    | SourceInURL.X
    | TrendingType;

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
    | Source.NFTs
    | Source.Swap
    | Source.Wallet;

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

export enum SearchType {
    Profiles = 'users',
    Posts = 'posts',
    Channels = 'channels',
    Tokens = 'tokens',
    Clubs = 'clubs',
    Prediction = 'prediction',
}

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
    Prediction = 'prediction-list',
    BetsLeaderboard = 'prediction-leaderboard',
    DraftList = 'draft-list',
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

export enum SolanaNetworkType {
    Appkit = 'appkit',
    Privy = 'privy-solana',
}

export enum TokenType {
    Fungible = 'Fungible',
    NonFungible = 'NonFungible',
}

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

export enum TokenCategory {
    Transactions = 'transactions',
    Feeds = 'feeds',
    About = 'about',
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
    X = 'x',
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

export enum PredictionPlatform {
    Polymarket = 'polymarket',
    Opinion = 'opinion',
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

export enum RedpacketTxType {
    create = 'create',
    claim = 'claim',
}

export enum DraftPostType {
    LocalNormal = 'local_normal',
    LocalTemp = 'local_temp',
    Cloud = 'cloud',
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
