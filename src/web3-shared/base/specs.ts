import { type CurrencyType, type NetworkPluginID, type TokenType } from '@/constants/enum.js';
import { type LiteralUnion } from '@/types/utility.js';

type Color =
    | `rgb(${number}, ${number}, ${number})`
    | `rgba(${number}, ${number}, ${number}, ${number})`
    | `#${string}${string}${string}${string}${string}${string}`
    | `#${string}${string}${string}`
    | `hsl(${number}, ${number}%, ${number}%)`;

enum OrderSide {
    Buy = 0,
    Sell = 1,
}

enum SourceType {
    // FT assets
    DeBank = 'DeBank',
    Zerion = 'Zerion',
    Solana = 'Solana',
    CoinGecko = 'CoinGecko',
    CoinMarketCap = 'CoinMarketCap',
    UniswapInfo = 'UniswapInfo',
    CF = 'CloudFlare',
    GoPlus = 'GoPlus',

    // NFT assets
    Rabby = 'Rabby',
    RSS3 = 'RSS3',
    Zora = 'zora',
    OpenSea = 'opensea',
    Rarible = 'rarible',
    NFTScan = 'NFTScan',
    Alchemy_FLOW = 'Alchemy_FLOW',
    Chainbase = 'Chainbase',
    Element = 'Element',
    Solsea = 'Solsea',
    Solanart = 'Solanart',
    OKX = 'OKX',
    Uniswap = 'Uniswap',
    NFTX = 'NFTX',
    Etherscan = 'Etherscan',
    CryptoPunks = 'CryptoPunks',

    // Rarity
    RaritySniper = 'RaritySniper',
    TraitSniper = 'TraitSniper',

    // Token List
    R2D2 = 'R2D2',

    Approval = 'Approval',
}

enum ActivityType {
    Transfer = 'Transfer',
    Mint = 'Mint',
    Sale = 'Sale',
    Offer = 'Offer',
    Burn = 'Burn',
    List = 'List',
    CancelOffer = 'CancelOffer',
}

interface Identity {
    address?: string;
    nickname?: string;
    avatarURL?: string;
    link?: string;
}

type Price = Partial<Record<CurrencyType, string>>;

export interface ChainDescriptor<ChainId, SchemaType, NetworkType> {
    ID: string;
    type: NetworkType;
    chainId: ChainId;
    coinMarketCapChainId?: string;
    coinGeckoChainId?: string;
    coinGeckoPlatformId?: string;
    name: string;
    color?: string;
    fullName?: string;
    shortName?: string;
    network: LiteralUnion<'mainnet' | 'testnet'>;
    nativeCurrency: FungibleToken<ChainId, SchemaType>;
    minGasLimit?: string;
    maxGasLimit?: string;
    defaultGasLimit?: string;
    rpcUrl: string;
    iconUrl?: string;
    // EIP3091
    explorerUrl: {
        url: string;
        parameters?: Record<string, string | number | boolean>;
    };
    features?: string[];
    // Indicate a built-in chain or customized one.
    isCustomized: boolean;
}

export interface NetworkDescriptor<ChainId, NetworkType> {
    /** An unique ID for each network */
    ID: string;
    /** The ID of the plugin that provides the functionality of the network. */
    networkSupporterPluginID: NetworkPluginID;
    /** The chain id */
    chainId: ChainId;
    /** The network type */
    type: NetworkType;
    /** The network icon */
    icon: string;
    /** The network icon in fixed color */
    iconColor: Color;
    /** The average time for mining a block (unit: seconds). */
    averageBlockDelay: number;
    /** The background gradient color for relative network bar */
    backgroundGradient?: string;
    /** The network name. e.g. Ethereum */
    name: string;
    /** The network short name. e.g. 'ETH' */
    shortName?: string;
    /** Is a mainnet network */
    isMainnet: boolean;
}

interface Token<ChainId, SchemaType> {
    /** For NFT, it could be `${chainId}.${contractAddress}.${tokenId}` */
    id: string;
    chainId: ChainId;
    type: TokenType;
    schema: SchemaType;
    address: string;
    /** NFT has tokenId */
    tokenId?: string;
    /** Added by user */
    isCustomToken?: boolean;
}

export interface FungibleToken<ChainId, SchemaType, Original = unknown> extends Token<ChainId, SchemaType> {
    name: string;
    symbol: string;
    decimals: number;
    logoURL?: string;
    // Sorted by market cap.
    rank?: number;
    __original__?: Original;
}

interface NonFungibleTokenRarity<ChainId> {
    chainId: ChainId;
    rank: number;
    url: string;
    status?: 'verified' | 'unverified';
    /** source type */
    source?: SourceType;
}

interface NonFungibleTokenContract<ChainId, SchemaType> {
    chainId: ChainId;
    name: string;
    symbol?: string;
    address: string;
    schema: SchemaType;
    owner?: string;
    balance?: number;
    logoURL?: string;
    iconURL?: string;
    /** @example 2.5% */
    creatorEarning?: string;
    /** source type */
    source?: SourceType;
}

interface NonFungibleTokenMetadata<ChainId> {
    chainId: ChainId;
    /** Might be the format `TheName #42` */
    name: string;
    tokenId?: string;
    symbol?: string | null;
    description?: string;
    /** image url */
    imageURL?: string;
    previewImageURL?: string;
    /** Useful for progress loading */
    blurhash?: string;
    /** source media url */
    mediaURL?: string;
    /** source media type */
    mediaType?: string;
    /** project url */
    projectURL?: string;
    /** source type */
    source?: SourceType;
    /** Poap Event Id */
    eventId?: number;
    video?: {
        properties: {
            audio_coding: string;
            duration: number;
            height: number;
            mime_type: string;
            size: number;
            video_coding: string | null;
            width: number;
        };
        url: string;
    };
}

interface SocialLinks {
    website?: string;
    email?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    github?: string;
    instagram?: string;
    medium?: string;
}

export interface NonFungibleCollection<ChainId, SchemaType> {
    /** some providers define id, while others don't. For those don't, we will fallback to contract address */
    id?: string;
    chainId: ChainId;
    name: string;
    slug: string;
    symbol?: string | null;
    description?: string;
    address?: string;
    schema?: SchemaType;
    iconURL?: string | null;
    /** the balance of the current owner */
    balance?: number;
    /** the amount of holders */
    ownersTotal?: number;
    /** verified by provider */
    verified?: boolean;
    verifiedBy?: string[];
    isSpam?: boolean;
    /** unix timestamp */
    createdAt?: number;
    /** source type */
    source?: SourceType;
    assets?: Array<NonFungibleAsset<ChainId, SchemaType>>;
    socialLinks?: SocialLinks;
    floorPrices?: Array<{
        marketplace_id: LiteralUnion<'blur' | 'looksrare' | 'opensea' | 'x2y2'>;
        marketplace_name: LiteralUnion<'Blur' | 'LooksRare' | 'OpenSea' | 'X2Y2'>;
        value: number;
        payment_token: {
            payment_token_id: LiteralUnion<'ethereum.native'>;
            name: string;
            symbol: string;
            address: string | null;
            decimals: number;
        };
    }>;
}

interface NonFungibleToken<ChainId, SchemaType> extends Token<ChainId, SchemaType> {
    /** the token id */
    tokenId: string;
    /** the address or uid of the token owner */
    ownerId?: string;
    /** the contract info */
    contract?: NonFungibleTokenContract<ChainId, SchemaType>;
    /** the media metadata */
    metadata?: NonFungibleTokenMetadata<ChainId>;
    /** the collection info */
    collection?: NonFungibleCollection<ChainId, SchemaType>;
    traits?: NonFungibleTokenTrait[];
}

export interface NonFungibleTokenTrait {
    /** The type of trait. */
    type: string;
    /** The value of trait. */
    value: string;
    /** The rarity of trait in percentage. */
    rarity?: string;
    displayType?: LiteralUnion<'date' | 'string' | 'number'> | null;
}

interface NonFungibleTokenAuction<ChainId, SchemaType> {
    /** unix timestamp */
    startAt?: number;
    /** unix timestamp */
    endAt?: number;
    /** tokens available to make an order */
    orderTokens?: Array<FungibleToken<ChainId, SchemaType>>;
    /** tokens available to make an offer */
    offerTokens?: Array<FungibleToken<ChainId, SchemaType>>;
}

interface NonFungibleTokenOrder<ChainId, SchemaType> {
    id: string;
    /** chain Id */
    chainId: ChainId;
    /** permalink of asset */
    assetPermalink: string;
    /** token amount */
    quantity: string;
    /** transaction hash */
    hash?: string;
    /** buy or sell */
    side?: OrderSide;
    /** the account make the order */
    maker?: Identity;
    /** the account fullfil the order */
    taker?: Identity;
    /** unix timestamp */
    createdAt?: number;
    /** unix timestamp */
    expiredAt?: number;
    /** calculated current price */
    price?: Price;
    /** the payment token and corresponding price */
    priceInToken?: PriceInToken<ChainId, SchemaType>;
    /** source type */
    source?: SourceType;
}

interface NonFungibleTokenEvent<ChainId, SchemaType> {
    id: string;
    /** chain Id */
    chainId: ChainId;
    /** event type */
    type: ActivityType;
    /** permalink of asset */
    assetPermalink?: string;
    /** name of asset */
    assetName?: string;
    /** symbol of asset */
    assetSymbol?: string;
    /** token amount */
    quantity: string;
    /** transaction hash */
    hash?: string;
    /** the account make the order */
    from?: Identity;
    /** the account fullfil the order */
    to?: Identity;
    /** the account who send the token */
    send?: Identity;
    /** the account who receive the token */
    receive?: Identity;
    /** unix timestamp */
    timestamp: number;
    /** relate token price */
    price?: Price;
    /** the payment token and corresponding price */
    priceInToken?: PriceInToken<ChainId, SchemaType>;
    /** the payment token */
    paymentToken?: FungibleToken<ChainId, SchemaType>;
    /** source type */
    source?: SourceType;
}

interface PriceInToken<ChainId, SchemaType> {
    amount: string;
    token?: FungibleToken<ChainId, SchemaType>;
    tokenSymbol?: string | null;
}

/**
 * A non-fungible token but with more metadata
 */
export interface NonFungibleAsset<ChainId, SchemaType> extends NonFungibleToken<ChainId, SchemaType> {
    /** permalink */
    link?: string;
    /** the creator data */
    creator?: Identity;
    /** the owner data */
    owner?: Identity;
    /** estimated price */
    price?: Price;
    /** rarity */
    rarity?: Record<SourceType, NonFungibleTokenRarity<ChainId>>;
    /** traits of the digital asset */
    traits?: NonFungibleTokenTrait[];
    /** token on auction */
    auction?: NonFungibleTokenAuction<ChainId, SchemaType>;
    /** related orders */
    orders?: Array<NonFungibleTokenOrder<ChainId, SchemaType>>;
    /** related events */
    events?: Array<NonFungibleTokenEvent<ChainId, SchemaType>>;
    /** all payment tokens */
    paymentTokens?: Array<FungibleToken<ChainId, SchemaType>>;
    /** the payment token and corresponding price */
    priceInToken?: PriceInToken<ChainId, SchemaType>;
    /** source type */
    source?: SourceType;
    /** token count */
    tokenCount?: number | string;
}
