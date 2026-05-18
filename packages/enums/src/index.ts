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
    Prediction = 'Prediction',
    Polymarket = 'Polymarket',
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
    Transactions = 'trades',
    Activities = 'activities',
    Prediction = 'prediction',
    Polymarket = 'polymarket',
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
    NFTs = 'nfts',
    Activities = 'activities',
    Transactions = 'transactions',
    Bets = 'bets',
    Prediction = 'prediction',
}

export type ProfileCategory = FollowCategory | SocialProfileCategory | WalletProfileCategory;

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

export enum FrameProtocol {
    OpenFrame = 'of',
    Farcaster = 'fc',
}

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

export enum PredictionPlatform {
    Polymarket = 'polymarket',
    Opinion = 'opinion',
}

export enum SnapshotState {
    Active = 'active',
    Pending = 'pending',
    Passed = 'passed',
    Rejected = 'rejected',
    Executed = 'executed',
    Closed = 'closed',
}

export enum TipsNotificationType {
    Tip = 'tip',
    Like = 'like',
}

export enum TipsDetailViewType {
    Sender = 'sender',
    Receiver = 'receiver',
}
