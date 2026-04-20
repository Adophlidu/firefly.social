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

export type ThemeMode = 'light' | 'dark' | 'default';

export enum Locale {
    en = 'en',
    zhHans = 'zh-Hans',
    zhHant = 'zh-Hant',
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
    Tokens = 'tokens',
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

export const enum FollowCategory {
    Following = 'following',
    Followers = 'followers',
    Mutuals = 'mutuals',
}

export type ProfileCategory = FollowCategory | SocialProfileCategory | WalletProfileCategory;

export enum SiteCookies {
    Locale = 'locale',
    FireflyRootAPI = 'firefly_root_api',
    FireflyRootClass = 'firefly_root_class',
}

export enum SwapFromPage {
    Swap = 'swap',
    BetWithdraw = 'bet-withdraw',
    BetDeposit = 'bet-deposit',
}
