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

export type SocialSource = Source.Farcaster | Source.Lens | Source.Twitter | Source.Bsky;

export type SocialSourceInURL =
    | SourceInURL.Farcaster
    | SourceInURL.Lens
    | SourceInURL.Twitter
    | SourceInURL.Bsky
    | SourceInURL.X;

export type ProfilePageSource =
    | Source.Farcaster
    | Source.Lens
    | Source.Twitter
    | Source.Bsky
    | Source.Wallet
    | Source.WalletMix;

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

export type ProfileSourceInURL =
    | SocialSourceInURL
    | SourceInURL.Wallet
    | SourceInURL.WalletMix
    | SourceInURL.FarcasterV2
    | SourceInURL.X;

export const SORTED_SOCIAL_SOURCES = [Source.Farcaster, Source.Lens, Source.Twitter, Source.Bsky] as const;
