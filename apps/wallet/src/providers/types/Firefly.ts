import type {
    FireflyPlatform,
    NetworkType,
    RelatedWalletSource,
    SocialSourceInURL,
    Source,
    WalletProfileDataSource,
} from '@dimensiondev/enums';
import type { Address, Hex } from 'viem';

import type { EVM } from '@/providers/nftscan/types.js';

export interface TokenAsset {
    chainIndex: string;
    name: string;
    symbol: string;
    decimals: string;
    tokenLogoUrl: string;
    tokenAddress: string;
    address: string;
    balance: string;
    tokenPrice: string;
    tokenType: string;
    isRiskToken: boolean;
}

export interface Response<T> {
    code: number;
    data?: T;
    error?: string[];
}

export type GetMultiChainTokenListResponse = Response<Response<{ tokenAssets: TokenAsset[] }>>; // double layers from server response

export const enum TransactionHistoryCategory {
    TokenBridge = 'token_bridge',
    TokenReceive = 'token_receive',
    TokenSend = 'token_send',
    TokenSwap = 'token_swap',
    TokenApprove = 'token_approve',
    TokenRevoke = 'token_revoke',
    NftReceive = 'nft_receive',
    NftSend = 'nft_send',
    NftMint = 'nft_mint',
    ContractInteraction = 'contract_interaction',
}

export const enum TransactionState {
    Success = 'success',
    Failed = 'fail',
}

export interface TransactionHistoryToken {
    address: string;
    symbol: string;
    name: string;
    logo: string | null;
    decimal: number;
    price: string;
}

export interface TransactionHistoryTokenApprove {
    token: TransactionHistoryToken;
    amount: string;
    spender_address: string;
}

export interface TransactionHistoryTokenAction {
    token: TransactionHistoryToken;
    amount: string;
    user_address: string;
    recipient: string;
    sender: string;
}

export interface TransactionHistoryNFTAction {
    nft: {
        address: string;
        symbol: string;
        name: string;
        token_id: string;
        logo: string | null;
    };
    amount: string;
    user_address: string;
    recipient: string;
    sender: string;
}

export interface TransactionHistoryItem {
    chain_id: number;
    hash: string;
    block_number: number;
    tx_status: TransactionState;
    project_logo: string;
    project_name: string;
    timestamp: string;
    to_address: string;
    from_address: string;
    token_sends: TransactionHistoryTokenAction[];
    token_receives: TransactionHistoryTokenAction[];
    token_approve?: TransactionHistoryTokenApprove;
    nft_receives: TransactionHistoryNFTAction[];
    nft_sends: TransactionHistoryNFTAction[];
    category: TransactionHistoryCategory;
}

export interface WalletHistoryTransactionsResponseData {
    list: TransactionHistoryItem[];
    cursor?: string;
}

export type WalletHistoryTransactionsResponse = Response<WalletHistoryTransactionsResponseData>;

export interface Poap {
    event: {
        id: number;
        fancy_id: string;
        name: string;
        event_url: string;
        image_url: string;
        country: string;
        city: string;
        description: string;
        year: number;
        /** @example "18-Nov-2021" */
        start_date: string;
        /** @example "18-Nov-2021" */
        end_date: string;
        /** @example "18-Nov-2021" */
        expiry_date: string;
        supply: number;
    };
    tokenId: string;
    /** owner address */
    owner: string;
    chain: 'xdai';
    /** @example "2021-11-20 02:17:40" */
    created: string;
    /** extends at runtime */
    hasBookmarked?: boolean;
}

export type PoapResponse = Response<Poap[]>;

export interface NFTDetail extends EVM.Asset {
    collection: EVM.Collection;
}

export type CollectionsResponse = Response<{
    collections: EVM.Collection[];
    cursor: string;
}>;

export type NFTDetailsResponse = Response<{
    nfts: NFTDetail[];
    cursor: string;
}>;

export interface Profile {
    platform_id: string;
    platform: FireflyPlatform;
    handle: string;
    name: string;
    hit: boolean;
    score: number;
    avatar?: string;
    owner?: string;
    primary?: boolean;
    // wallet profile
    resolved_address?: string;
    primary_address?: string;
    registrant?: string;
    wrapped_owner?: string;
    owner_address?: string;
    // related social profiles
    related_profiles?: Profile[];
    special?: boolean;
    // firefly account uid
    uid?: string;
}

export type SearchProfileListItem = Record<
    SocialSourceInURL | 'eth' | 'solana' | 'ens' | 'account' | 'base.eth' | 'sns' | 'skr',
    Profile[] | null
>;

export type SearchProfileResponse = Response<{
    list?: SearchProfileListItem[];
    cursor: number;
    size: number;
}>;

export interface VerifiedSource {
    source: RelatedWalletSource;
    provider: string;
    verifiedText: string;
}

export interface WalletProfileIdentity {
    handle: string;
    id: string;
    owner_address: string;
    expire_time?: number;
    is_primary?: boolean;
}

export interface WalletProfile {
    address: Address;
    ens?: string[];
    blockchain: NetworkType;
    is_connected: boolean;
    verifiedSources: VerifiedSource[];
    avatar?: string;
    primary_ens?: string | null;
    blocked?: boolean;
    hacked?: boolean;
    isDefault?: boolean;
    dataSource?: WalletProfileDataSource;
    baseEth?: WalletProfileIdentity[];
    sns?: WalletProfileIdentity[];
    seekerId?: WalletProfileIdentity[];
}

export interface LensV3Profile {
    id: string;
    ownedBy: string;
    nameSpace: string;
    localName: string;
    fullHandle: string;
    isDefault?: boolean;
}

export interface FarcasterProfile {
    avatar: {
        url: string;
        verified: boolean;
    };
    bio: string;
    followerCount: number;
    followingCount: number;
    fid: number;
    username: string;
    display_name: string;
    isPowerUser: boolean;
    isProUser?: boolean;
    raw_data: string;
    signer_address: string;
    addresses: string[];
    id: number;
    isDefault?: boolean;
    following?: boolean;
    followedBy?: boolean;
}

export interface TwitterProfile {
    twitter_id: string;
    handle: string;
    source: string;
    provider: string;
    isDefault?: boolean;
}

export interface BskyProfile {
    did: string;
    handle: string;
    isDefault?: boolean;
}

export interface FireflyAccountProfile {
    displayName: string | null;
    avatar: string | null;
    uid: string;
}

export interface WalletProfiles {
    walletProfiles: WalletProfile[];
    solanaWalletProfiles: WalletProfile[];
    lensProfilesV3: LensV3Profile[];
    farcasterProfiles: FarcasterProfile[];
    twitterProfiles: TwitterProfile[];
    fireflyAccountId?: string;
    bskyProfiles: BskyProfile[];
    account?: FireflyAccountProfile;
}

export interface FireflyIdentity {
    id: string;
    source: Source;
}

export type PlatformIdentityKey =
    | 'twitterId'
    | 'twitterHandle'
    | 'walletAddress'
    | 'lensHandle'
    | 'farcasterUsername'
    | 'fid'
    | 'lensProfileId'
    | 'ens'
    | 'solanaAddress'
    | 'bskyDid'
    | 'bskyHandle'
    | 'uid';

export type WalletProfileResponse = Response<WalletProfiles | null>;

/**
 * Response of `/v2/wallet/profileinfo/list`. Each requested wallet maps to a record keyed by the
 * resolved on-chain address, so a Polymarket-proxy lookup (`is_polymarketProxy = true`) returns the
 * owner's social profiles keyed by the proxy address. Mirrors apps/web's `WalletProfileInfoListResponse`.
 */
export type WalletProfileInfoListResponse = Response<{
    walletAddress: Array<Record<string, WalletProfiles>>;
}>;

export type SearchTokenResponse = Response<{
    coins?: Array<{ largeLogo?: string }>;
}>;

export type GetCollectionResponse = Response<EVM.Collection>;

export interface FireflyProfile {
    identity: FireflyIdentity;
    displayName: string;
    isDefault?: boolean;
    __origin__: WalletProfile | LensV3Profile | FarcasterProfile | TwitterProfile | BskyProfile | null;
}

export type PolymarketAccount = Response<{
    address: Address;
    proxyAddress: Address;
}>;

export type PolymarketUpgradeTaskResponse = Response<{
    is_approved: boolean;
    is_wrapped: boolean;
    is_upgraded: boolean;
    usdce_balance: number;
}>;

export type PolymarketUpgradeResponse = Response<{
    hash: string;
    status: string;
}>;

export enum ErrorCode {
    InvalidPolymarketAccount = 2600,
}

export interface PolymarketProfilePnL {
    owner: Address;
    proxy_address: Address;
    pnl: number;
    rank: number;
    displayInfo: {
        ensHandle?: string;
        avatarUrl: string;
        fireflyName: string;
        fireflyUid: string;
        fireflyAvatarUrl: string;
    };
}

export type PolymarketProfilePnLResponse = Response<PolymarketProfilePnL>;

/** Polymarket profile (`/v1/polymarket/profile/info`) — only the identity fields the wallet consumes. */
export interface PolymarketProfileData {
    wallet: Address;
    proxy: Address;
    /** Polymarket pseudonym. */
    platform_name: string;
    /** Polymarket avatar URL. */
    platform_avatar: string;
}

export type PolymarketProfileResponse = Response<PolymarketProfileData>;

export interface PolymarketProfileListItem {
    wallet: Address;
    proxy: Address;
    pnl?: number;
    pnl_rate?: number;
    cash_balance?: number;
    notfill_balance?: number;
    /**
     * Total portfolio/balance in USD (as returned by backend).
     */
    balance?: number;
}

export type PolymarketProfileListResponse = Response<PolymarketProfileListItem[]>;

export type PolymarketWithdrawResponse = Response<{
    hash: Hex | '';
    status: 'success' | 'failed';
    is_deposit_address: boolean;
    error_message: string;
}>;

export type PreviewPolymarketWithdrawResponse = Response<{
    amount: number;
    amount_usd: number;
    fee: number;
}>;

export interface WithdrawSupportedToken {
    chain_id: number;
    chain_name: string;
    token_address: string;
    token_symbol: string;
    token_name: string;
    min_checkout_usd: number;
    token_icon: string;
    token_decimals: number;
}

export type WithdrawSupportedTokensResponse = Response<WithdrawSupportedToken[]>;

export interface DepositSupportedToken {
    token_address: string | null;
    chain_id: string | null;
    chain_name: string | null;
    token_decimals: string | null;
    token_symbol: string | null;
    token_name: string | null;
    token_icon: string | null;
    min_deposit_usd: number | null;
    min_checkout_usd: number | null;
}

export type DepositSupportedTokensResponse = Response<DepositSupportedToken[]>;

/** Per-chain deposit asset (from `deposit/supported_tokens/all`). */
export interface DepositAllSupportedTokenItem {
    token_symbol: string;
    token_name?: string;
    token_icon?: string;
    token_decimals?: number;
    token_address: string;
}

/** Deposit supported assets grouped by chain (from `deposit/supported_tokens/all`). */
export interface DepositAllSupportedTokensChain {
    chain_id: number;
    chain_name?: string;
    /** Deposit address family. `tron` uses the Tron relay; `evm`/`svm` use bridge addresses. */
    chain_type: 'evm' | 'svm' | 'tron';
    min_checkout_usd: number;
    tokens: DepositAllSupportedTokenItem[];
}

export type DepositAllSupportedTokensResponse = Response<DepositAllSupportedTokensChain[]>;

/** Bridge deposit addresses (from `deposit/address`). */
export interface PolymarketDepositAddresses {
    wallet_address?: string;
    tron: string | null;
    evm?: string | null;
    svm?: string | null;
    btc?: string | null;
}

export type PolymarketDepositAddressesResponse = Response<PolymarketDepositAddresses>;

/**
 * Per-transaction deposit status. The bridge emits these in UPPERCASE
 * (`DEPOSIT_DETECTED | PROCESSING | ORIGIN_TX_CONFIRMED | SUBMITTED | COMPLETED | FAILED`);
 * `useTronDepositStatusPolling` normalizes them to this lowercase union at the
 * feature boundary so the rest of the app can compare against stable values.
 */
export type TronDepositTransactionStatus =
    | 'deposit_detected'
    | 'processing'
    | 'origin_tx_confirmed'
    | 'submitted'
    | 'completed'
    | 'failed';

export interface TronDepositTransaction {
    from_chain_id: string | null;
    from_token_address: string | null;
    from_amount_base_unit: string | null;
    to_chain_id: string | null;
    to_token_address: string | null;
    status: TronDepositTransactionStatus;
    tx_hash: string | null;
    created_time_ms: number | null;
}

export interface TronDepositStatus {
    address: string | null;
    status: string | null;
    transactions: TronDepositTransaction[];
}

export type DepositStatusResponse = Response<TronDepositStatus>;

export interface CreatePolymarketOrderResult {
    orderId: string;
    takingAmount: string;
    makingAmount: string;
    transactionsHashes?: string[];
    status: string;
}

export interface CreatePolymarketLimitOrderBody {
    tokenId: string;
    price: number;
    side: 'BUY' | 'SELL';
    amount: number;
}

export interface CreatePolymarketMarketOrderBody {
    tokenId: string;
    side: 'BUY' | 'SELL';
    amount: number;
}

export type CreatePolymarketLimitOrderResponse = Response<CreatePolymarketOrderResult>;
export type CreatePolymarketMarketOrderResponse = Response<CreatePolymarketOrderResult>;

export type GetPolymarketToWinAmountResponse = Response<{
    win_amount: number;
    avg_price: number;
}>;

export type CancelPolymarketOrderResponse = Response<{}>;

export interface PolymarketClaimResult {
    status: string;
    hash: string;
}

export type PolymarketClaimAmount = [string, string];

export interface PolymarketClaimV2Item {
    condition_id: string;
    negative_risk: boolean;
    amount?: PolymarketClaimAmount;
}

export interface PolymarketBatchClaimV2Body {
    items: PolymarketClaimV2Item[];
    original_message: string;
    signature_message: string;
}

export type PolymarketClaimV2Response = Response<PolymarketClaimResult>;

export interface PolymarketPosition {
    is_closed: boolean;
    negRisk: boolean;
    isClaimable: boolean;
    isWin: boolean;
    event_slugs: string[];
    cur_price: number;
    title: string;
    image: string;
    offset: number;
    closed_time: number;
    conditionId: string;
    vote_status: string;
    resolvedResult: string;
    umaResolutionStatus: 'resolved' | 'proposed' | 'disputed';
    umaResolutionStatuses: Array<'resolved' | 'proposed' | 'disputed'>;
    wallet: string;
    tokenId: string;
    Id: string;
    shares: number;
    total_buy: number;
    avg_price: number;
    current_value?: number;
    notfill_pnl: number;
    fill_pnl: number;
    pnl: number;
    pnl_rate: number;
    marketSlug: string;
    endDate?: string;
    endTime?: string;
}

export interface PolymarketPositionV2 {
    proxyWallet?: string;
    asset?: string;
    conditionId?: string;
    size?: number;
    avgPrice?: number;
    initialValue?: number;
    currentValue?: number;
    cashPnl?: number;
    percentPnl?: number;
    totalBought?: number;
    realizedPnl?: number;
    percentRealizedPnl?: number;
    curPrice?: number;
    redeemable?: boolean;
    mergeable?: boolean;
    title?: string;
    slug?: string;
    icon?: string;
    eventId?: string;
    eventSlug?: string;
    outcome?: string;
    outcomeIndex?: number;
    oppositeOutcome?: string;
    oppositeAsset?: string;
    endDate?: string;
    endTime?: string;
    negativeRisk?: boolean;
    timestamp?: number;
    resolvedResult?: string;
    umaResolutionStatus?: string;
    umaResolutionStatuses?: string[];
    topicId?: string;
    isMutil?: number;
}

export type PolymarketV2PositionSortBy = 'CURRENT' | 'TIMESTAMP' | 'REALIZEDPNL' | 'AVGPRICE' | 'TITLE';
export type PolymarketV2PositionSortDirection = 'ASC' | 'DESC';

/** Map v2 position to legacy PolymarketPosition for UI compatibility */
export function mapPolymarketV2ToLegacy(pos: PolymarketPositionV2, isClosed: boolean): PolymarketPosition {
    // current position
    const isCurrent = 'redeemable' in pos;
    const curPrice = pos.curPrice ?? 0;
    const size = (isClosed ? pos.totalBought : pos.size) ?? 0;
    const avgPrice = pos.avgPrice ?? 0;
    const totalBought = pos.totalBought ?? 0;
    const pnl = (isCurrent ? pos.cashPnl : pos.realizedPnl) || 0;
    const totalTrade = totalBought * avgPrice;
    const pnlRate =
        isCurrent && pos.percentPnl ? pos.percentPnl / 100 : totalTrade > 0 ? Math.max(pnl / totalTrade, -1) : 0;

    return {
        is_closed: isClosed,
        negRisk: pos.negativeRisk ?? false,
        isClaimable: pos.redeemable ?? false,
        isWin: pnl > 0,
        event_slugs: pos.eventSlug ? [pos.eventSlug] : [],
        cur_price: curPrice,
        current_value: isClosed ? totalTrade + pnl : (pos.currentValue ?? curPrice * size),
        title: pos.title ?? '',
        image: pos.icon ?? '',
        offset: pos.outcomeIndex ?? 0,
        closed_time: pos.timestamp ?? 0,
        conditionId: pos.conditionId ?? '',
        vote_status: pos.outcome ?? '',
        resolvedResult: pos.resolvedResult ?? '',
        umaResolutionStatus: (pos.umaResolutionStatus as PolymarketPosition['umaResolutionStatus']) ?? 'resolved',
        umaResolutionStatuses: [],
        wallet: pos.proxyWallet ?? '',
        tokenId: pos.asset ?? '',
        Id: pos.asset ?? pos.conditionId ?? '',
        shares: size,
        total_buy: pos.totalBought ?? 0,
        avg_price: pos.avgPrice ?? 0,
        notfill_pnl: pos.realizedPnl ?? 0,
        fill_pnl: 0,
        pnl,
        pnl_rate: pnlRate,
        marketSlug: pos.slug ?? '',
        endDate: pos.endDate,
        endTime: pos.endTime,
    };
}

export type GetPolymarketV2PositionsResponse = Response<PolymarketPositionV2[]>;

export enum PolymarketOrderSide {
    BUY = 'BUY',
    SELL = 'SELL',
}

export enum PolymarketOpenOrderStatus {
    LIVE = 'LIVE',
    MATCHED = 'MATCHED',
    DELAYED = 'DELAYED',
    UNMATCHED = 'UNMATCHED',
    CANCELED = 'CANCELED',
}

export enum PolymarketOrderType {
    GTC = 'GTC',
    FOK = 'FOK',
    IOC = 'IOC',
}

export interface PolymarketOpenOrderDetail {
    id: string;
    status: PolymarketOpenOrderStatus | string;
    owner: string;
    maker_address: string;
    market: string;
    asset_id: string;
    side: PolymarketOrderSide | string;
    title: string;
    icon: string;
    outcome_index: number;
    original_size: string;
    size_matched: string;
    price: string;
    outcome: string;
    expiration: string;
    order_type: PolymarketOrderType | string;
    associate_trades: string[];
    created_at: number;
}

export type GetPolymarketAccountOpenOrdersResponse = Response<{
    list: PolymarketOpenOrderDetail[];
    cursor: string | null;
}>;

export type GetPolymarketHistoryResponse = Response<{
    result: PolymarketTransaction[];
    cursor: string;
}>;

export type PolymarketActivityResponse = Response<{
    result: PolymarketActivityItem[];
    cursor: string | null;
}>;

/**
 * Reward record types returned by the backend for FIFA prediction campaigns.
 * `amount` is a USDC integer string with 6 decimals (1e6), same as deposit/withdraw.
 */
export type PolymarketRewardType =
    | 'fifa_camp_reward'
    | 'fifa_daily_reward'
    | 'fifa_rank_reward'
    | 'fifa_position_gift_reward'
    | 'fifa_volume_reward';

export type PolymarketActivityItem =
    | {
          type: 'trade';
          proxyWallet: string;
          timestamp: number; // seconds
          transactionHash: string;
          /**
           * Some backend rows may omit this field (still marked as `type: trade`).
           * UI should handle missing trade details gracefully.
           */
          trade?: PolymarketActivityMarketAction;
      }
    | {
          type: 'claim';
          proxyWallet: string;
          timestamp: number; // seconds
          transactionHash: string;
          /**
           * Some backend rows may omit this field.
           */
          claim?: PolymarketActivityMarketAction;
          /**
           * V2 API returns trade field for claim records.
           */
          trade?: PolymarketActivityMarketAction;
      }
    | {
          type: 'lost';
          proxyWallet: string;
          timestamp: number; // seconds
          transactionHash: string;
          trade?: PolymarketActivityMarketAction;
      }
    | {
          type: 'deposit';
          proxyWallet: string;
          timestamp: number; // seconds
          transactionHash: string;
          /**
           * Deposit metadata.
           *
           * `amount` is typically a USDC integer string with 6 decimals (1e6).
           */
          depositWithdraw?: {
              tx_type: 'deposit' | string;
              target_address?: string;
              amount?: string;
          };
      }
    | {
          type: 'withdraw';
          proxyWallet: string;
          timestamp: number; // seconds
          transactionHash: string;
          /**
           * Withdraw metadata.
           *
           * `amount` is typically a USDC integer string with 6 decimals (1e6).
           */
          depositWithdraw?: {
              tx_type: 'withdraw' | string;
              target_address?: string;
              amount?: string;
          };
      }
    | {
          type: PolymarketRewardType;
          proxyWallet: string;
          timestamp: number; // seconds (= tx-hash time, from backend event_time)
          transactionHash: string;
          /**
           * Reward metadata. Same shape as deposit/withdraw.
           *
           * `amount` is typically a USDC integer string with 6 decimals (1e6).
           */
          depositWithdraw?: {
              tx_type: string;
              target_address?: string;
              amount?: string;
          };
      };

export interface PolymarketActivityMarketAction {
    side: 'buy' | 'sell' | '';
    size: string;
    usdcSize: string;
    price: string;
    asset: string;
    outcome?: string;
    outcomeIndex: number;
    title: string;
    slug: string;
    icon: string;
    eventSlug: string;
    eventId: number;
}

export interface PolymarketTransaction {
    owner: string;
    wallet: string;
    platform: 'polymarket';
    proxyWallet: string;
    timestamp: number;
    blockNumber: number;
    blockNumberSort: number;
    chain_id: number;
    size: string; // string number
    usdcSize: string; // string usdc amount
    transactionHash: string;
    price: string;
    asset: string;
    side: 'buy' | 'sell';
    outcome: 'Yes' | 'No' | string;
    outcomeIndex: number;
    conditionId: string;
    conditionOutcomes: string[];
    conditionOutcomePrices: string[];
    parent_title: string;
    title: string;
    url: string;
    topicId: string;
    isMutil: number;
    image: string;
    volume: string;
    umaResolutionStatus: string;
    resolvedResult: number;
    endDate: string; // ISO Date String
    rawData: MarketRawData;
    displayInfo: UserDisplayInfo;
    followingSources: any[];
    has_bookmarked: boolean;
    like_count: number;
    is_like: boolean;
}

export interface MarketRawData {
    acceptingOrders: boolean;
    acceptingOrdersTimestamp: string;
    active: boolean;
    approved: boolean;
    archived: boolean;
    automaticallyActive: boolean;
    automaticallyResolved?: boolean;
    bestAsk?: number;
    bestBid?: number;
    clearBookOnStart: boolean;
    clobTokenIds: string; // JSON string
    closed: boolean;
    closedTime?: string;
    conditionId: string;
    createdAt: string;
    customLiveness: number;
    cyom: boolean;
    deploying: boolean;
    deployingTimestamp: string;
    description: string;
    enableOrderBook: boolean;
    endDate: string;
    endDateIso: string;
    events: MarketEvent[];
    featured: boolean;
    feesEnabled: boolean;
    funded: boolean;
    groupItemThreshold: string;
    groupItemTitle: string;
    hasReviewedDates: boolean;
    holdingRewardsEnabled: boolean;
    icon: string;
    id: string;
    image: string;
    lastTradePrice: number;
    manualActivation: boolean;
    marketMakerAddress: string;
    negRisk: boolean;
    new: boolean;
    oneDayPriceChange: number;
    oneHourPriceChange?: number;
    oneMonthPriceChange: number;
    oneWeekPriceChange: number;
    orderMinSize: number;
    orderPriceMinTickSize: number;
    outcomePrices: string; // JSON string
    outcomes: string; // JSON string
    pagerDutyNotificationEnabled: boolean;
    pendingDeployment: boolean;
    question: string;
    questionID: string;
    ready: boolean;
    requiresTranslation: boolean;
    resolutionSource: string;
    resolvedBy?: string;
    restricted: boolean;
    rewardsMaxSpread: number;
    rewardsMinSize: number;
    rfqEnabled: boolean;
    slug: string;
    startDate: string;
    startDateIso: string;
    submitted_by: string;
    tags: MarketTag[];
    umaBond: string;
    umaEndDate?: string;
    umaResolutionStatus: string;
    umaResolutionStatuses?: string;
    umaReward: string;
    updatedAt: string;
    volume: string;
    volumeNum: number;

    volume1mo: number;
    volume1wk: number;
    volume1yr: number;
    volume24hr?: number;
}

export interface MarketEvent {
    id: string;
    title: string;
    ticker: string;
    slug: string;
    description: string;
    active: boolean;
    closed: boolean;
    volume: number;
    createdAt: string;
    endDate: string;
    image: string;
    icon: string;
    restricted: boolean;
}

export interface MarketTag {
    id: string;
    label: string;
    slug: string;
    createdAt?: string;
    forceShow?: boolean;
    updatedAt?: string;
}

export interface UserDisplayInfo {
    ensHandle: string | null;
    avatarUrl: string;
    fireflyName: string;
    fireflyUid: string;
    fireflyAvatarUrl: string;
}

export interface PolymarketOrderBookData {
    market: string;
    asset_id: string;
    timestamp: string;
    hash: string;
    bids: Array<{
        price: string;
        size: string;
    }>;
    asks: Array<{
        price: string;
        size: string;
    }>;
    min_order_size: string;
    tick_size: string;
    neg_risk: boolean;
}

export interface PolymarketTeam {
    id?: number;
    name?: string;
    league?: string;
    logo?: string;
    abbreviation?: string;
    color?: string;
    record?: string;
    alias?: string;
}

export interface PolymarketMarket {
    id: string;
    question: string;
    conditionId: string;
    slug: string;
    startDate?: string;
    endDate: string;
    createdAt: string;
    liquidity: string;
    image: string;
    icon: string;
    description: string;
    outcomes: string;
    outcomePrices: string;
    volume: string;
    active: boolean;
    closed: boolean;
    new: boolean;
    negRisk: boolean;
    umaResolutionStatus: string;
    umaResolutionStatuses: string;
    groupItemTitle: string;
    groupItemThreshold: string;
    clobTokenIds: string;
    oneDayPriceChange: string;
    oneWeekPriceChange: string;
    events: PolymarketEvent[];
    orderPriceMinTickSize: string;
    bestAsk?: number;
    bestBid?: number;
    eventStartTime?: string;
    /** Sport fields */
    gameId?: number;
    sportsMarketType?: string;
    line?: number;
    teamAID?: number;
    teamBID?: number;
    teams?: PolymarketTeam[];
    /** Draw games: 0 home, 1 draw, 2 away (set by backend). */
    groupTypeFF?: number;
    groupItemRange?: string;
    feesEnabled?: boolean;
    feeSchedule?: {
        exponent: number;
        rate: number;
        rebateRate: number;
        takerOnly: boolean;
    };
}

export interface PolymarketEvent {
    id: string;
    slug: string;
    title: string;
    description: string;
    startDate: string;
    creationDate: string;
    endDate: string;
    image: string;
    icon: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    liquidity: string;
    volume: string;
    openInterest: string;
    createdAt: string;
    updatedAt: string;
    negRisk: boolean;
    sortBy: string;
    markets: PolymarketMarket[];
    series: unknown[];
    seriesSlug?: string;
    tags: MarketTag[];
    startTime?: string;
    eventMetadata?: {
        priceToBeat?: number;
        finalPrice?: number;
    };
    /** Sport fields */
    live?: boolean;
    ended?: boolean;
    gameId?: number;
    score?: string;
    period?: string;
    elapsed?: string;
    gameStatus?: string;
    finishedTimestamp?: string;
    spreadsMainLine?: number;
    totalsMainLine?: number;
    score_show?: unknown[];
    score_type?: unknown;
    period_show?: string;
    drawTeams?: PolymarketTeam[];
    isDraw?: boolean;
    winResult?: number;
    leagueName?: string;
    leagueId?: string;
    sportId?: string;
    livestream_info?: unknown;
}

export interface PolymarketProfileBalance {
    wallet: string;
    balance: number; // total balance
    cash_balance: number; // available balance for trading
    position_balance: number; // position value
}

export interface PolymarketProfileBalance {
    wallet: string;
    balance: number; // total balance
    cash_balance: number; // available balance for trading
    position_balance: number; // position value
}

export interface GeoblockCountryItem {
    country_code: string;
    country_name: string;
}

export interface GeoblockItem {
    blocked: boolean;
    type: 'bets' | 'swap' | 'perps';
    block_country_list: GeoblockCountryItem[];
}

export interface GeoblockResponse {
    ip: string;
    country: string;
    city: string;
    region: string;
    items: GeoblockItem[];
}

export type GeoblockResponseWrapper = Response<GeoblockResponse>;
