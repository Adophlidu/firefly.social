import type { Address } from 'viem';

import type { FireflyWalletConnection, Response } from '@/providers/types/Firefly.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export enum Level {
    Lv1 = 'lv1',
    Lv2 = 'lv2',
}

export interface X {
    twitterId: string;
    address: string;
    following: boolean;
    hasVerified: boolean;
    valid: boolean;
    level: Level;
    followingPudge?: boolean;
    followingTrump?: boolean;
}

export interface Farcaster {
    level: Level;
    alreadyClaimed: boolean;
    fid: string;
    isPowerUser: boolean;
    valid: boolean;
    isFollowing: boolean;
    isSupercast?: boolean;
    hasThirdpartSigner?: boolean;
    participationBlocked?: boolean;
}

export interface Firefly {
    isNew: boolean;
    valid: boolean;
    level: Level;
}

export interface Balance {
    address: string;
    balance: number;
    valid: boolean;
    level: Level;
}

export enum ActivityElex24VoteOption {
    Trump = 'trump',
    Harris = 'harris',
}

export interface Assets {
    alreadyClaimed: boolean;
    anonBalance: string;
    degenBalance: string;
    level: Level;
    valid: boolean;
}

export interface NFT {
    address: string;
    valid: boolean;
    level: Level;
    alreadyClaimed: boolean;
    ownPudgy: boolean;
    ownLil: boolean;
    ownTruePengu: boolean;
    ownPenguPins: boolean;
    participationBlocked: boolean;
}

export interface Lens {
    valid: boolean;
    level: Level;
    alreadyClaimed: boolean;
    lensId: string;
    handle: string;
    isActiveUser: boolean;
    isTopUser: boolean;
    participationBlocked?: boolean;
}

export type CheckResponse = Response<{
    alreadyClaimed: boolean;
    canClaim: boolean;
    x: X;
    nft?: NFT;
    participationBlocked?: boolean;
    farcaster: Farcaster | null;
    lens?: Lens;
    assets: Assets;
    balance: Balance;
    firefly: Firefly;
    address: string;
    claimCondition: [];
    ext?: {
        vote?: ActivityElex24VoteOption;
    };
}>;

export type MintActivitySBTResponse = Response<{
    status: boolean;
    hash: string;
    errormessage?: string;
    chainId: EthereumChainId | 'solana';
}>;

export enum TaskStatus {
    Pending = 'pending',
    Completed = 'completed',
}

export type TaskResponse = Response<{
    total_count: number;
    completed_count: number;
    tasks: Array<{
        id: number;
        name: string;
        status: TaskStatus;
        description: string;
    }>;
    has_inprogress_order: boolean;
    total_inventory: number;
}>;

export type ClaimTaskResponse = Response<{
    id: number;
    task_name: string;
    status: TaskStatus;
    description: string;
}>;

export type CheckPriceResponse = Response<{
    product_id: string;
    task_num: number;
    sku: string;
    attributes: Record<string, unknown>;
    price: number;
    cost_price: number;
    market_price: number;
    remainingLockSeconds: number;
} | null>;

export enum CommitOrderResponseStatus {
    Success = 1,
    TaskNotMeet = 2,
    OutOfStock = 3,
    WrongPose = 4,
    OrderExists = 5,
    SubmitException = 6,
    SystemBusy = 9,
}

export enum OrderStatus {
    Unpaid = 1,
    Paying = 2,
    Completed = 3,
    Shipped = 4,
    Cancelled = 5,
    Timeout = 6,
    AmountError = 7,
}

export type CommitOrderResponse = Response<{
    userId: number;
    productId: string;
    Sku: string;
    orderNo: string;
    amount: number;
    EvmWallet: Address;
    SolanaWallet: string;
    ChainID: number;
    Status: CommitOrderResponseStatus;
    OrderStatus: OrderStatus;
    Message: string;
    commitTime: number;
}>;

export interface OrderInfo {
    userId: number;
    productId: string;
    Sku: string;
    orderNo: string;
    amount: string;
    EvmWallet: string;
    SolanaWallet: string;
    ChainID: number;
    OrderStatus: OrderStatus;
    commitTime: number;
}

export type CheckOrderResponse = Response<{
    userId: number;
    productId: string;
    Sku: string;
    orderNo: string;
    amount: number;
    EvmWallet: string;
    SolanaWallet: string;
    ChainID: number;
    OrderStatus: OrderStatus;
    commitTime: number;
}>;

export enum CheckBuyStatus {
    Purchased = 1,
    NotPurchased = 2,
    PurchasedUnpaid = 3,
}

export type CheckBuyResponse = Response<{
    account_id: number;
    orderInfo: OrderInfo;
    status: CheckBuyStatus;
    Message: string;
}>;

export type SearchQrcodeResponse = Response<{
    data: {
        qrcode: {
            id: number;
            qrcode: string;
            validateTill: string;
            creatorUserId: number;
            creatorUsername: string;
            creatorFireflyId: string;
            creatorFireflyUsername: string;
            creatorPlatform: string;
            createdAt: string;
            redeemedAt: string | null;
            redeemedBy: string | null;
            redeemedShop: string | null;
            orderId: string | null;
        };
    };
}>;

export interface Provider {
    getAllConnections: () => Promise<{ connected: FireflyWalletConnection[]; related: FireflyWalletConnection[] }>;
}
