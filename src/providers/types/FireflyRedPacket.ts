import type { Hex } from 'viem';

import type { NetworkType } from '@/constants/enum.js';
import type { FungibleToken } from '@/mask_pkgs/web3-shared/base/index.js';
import type { EthereumChainId, EthereumSchemaType } from '#masknet/web3-shared-evm';

type WithoutChainId<T> = Omit<T, 'chain_id'>;
type WithNumberChainId<T> = WithoutChainId<T> & { chain_id: number };

export enum RequirementType {
    Follow = 'Follow',
    Like = 'Like',
    Repost = 'Repost',
    Comment = 'Comment',
    NFTHolder = 'NFTHolder',
}

export enum RedPacketStatus {
    claimed = 'claimed',
    expired = 'expired',
    empty = 'empty',
    refunded = 'refunded',
}

interface RedPacketBasic {
    contract_address: string;
    rpid: string;
    txid: string;
    /** RedPacket created via Firefly app omits the password field */
    password?: string;
    shares: number;
    is_random: boolean;
    total: string;
    creation_time: number;
    duration: number;
    block_number?: number;
}

export interface RedPacketJSONPayload extends RedPacketBasic {
    contract_version: number;
    sender: {
        address: string;
        name: string;
        message: string;
    };
    chainId?: EthereumChainId;
    network?: string;
    token?: FungibleToken<EthereumChainId, EthereumSchemaType>;
    /**
     * For contract_version === 1, payload has no token but token_type
     */
    token_type?: 0 | number;
    total_remaining?: string;
    // For solana
    accountId?: string;
    tokenProgram?: string;
}

export namespace FireflyRedPacketAPI {
    export enum PlatformType {
        Lens = 'lens',
        Farcaster = 'farcaster',
        Twitter = 'twitter',
        Bsky = 'bsky',
    }

    export enum ActionType {
        Send = 'send',
        Claim = 'claim',
    }

    export enum SourceType {
        All = 'all',
        FireflyAPP = 'firefly_app',
        FireflyPC = 'firefly_pc',
        MaskNetwork = 'mask_network',
    }

    export enum RedPacketStatus {
        View = 'VIEW',
        Refunding = 'REFUNDING',
        Refund = 'REFUND',
        Expired = 'EXPIRED',
        Empty = 'EMPTY',
        Send = 'SEND',
    }

    export enum StrategyType {
        profileFollow = 'profileFollow',
        postReaction = 'postReaction',
        nftOwned = 'nftOwned',
        channel = 'channel',
        tokens = 'tokens',
    }

    export type ClaimStrategy =
        | {
              type: StrategyType.profileFollow;
              payload: ProfileFollowStrategyPayload[];
          }
        | {
              type: StrategyType.postReaction;
              payload: PostReactionStrategyPayload;
          }
        | {
              type: StrategyType.nftOwned;
              payload: NftOwnedStrategyPayload[];
          }
        | {
              type: StrategyType.tokens;
              payload: TokensStrategyPayload[];
          }
        | {
              type: StrategyType.channel;
              payload: ChannelStrategyPayload;
          };

    export interface ProfileFollowStrategyPayload {
        platform: PlatformType;
        profileId: string;
        /**
         * Depends on the platform which created the redpacket
         * for example, Firefly APP doesn't provide it, but Firefly Web does
         */
        handle?: string;
    }

    export interface PostReactionStrategyPayload {
        params?: Array<{
            platform: PlatformType;
            postId: string;
            handle?: string;
        }>;
        reactions: string[];
    }

    export interface NftOwnedStrategyPayload {
        /** instead of number, it's string */
        chainId: string;
        contractAddress: string;
        collectionName: string;
        icon?: string;
    }
    export interface TokensStrategyPayload {
        /** instead of number, it's string */
        chainId: string;
        contractAddress: string;
        name: string;
        symbol: string;
        decimals: number;
        amount: string;
        icon?: string;
    }

    export interface ChannelStrategyPayload {
        farcasterChannelId?: string;
        lensOrbClubHandle?: string;
    }

    export interface PostReaction {
        platform: PlatformType;
        postId: string;
    }

    export interface ProfileReaction {
        platform: PlatformType;
        profileId: string;
        lensToken?: string;
        farcasterSignature?: Hex;
        farcasterSigner?: Hex;
        farcasterMessage?: Hex;
    }

    export interface PostOn {
        platform: PlatformType;
        postId: string;
        handle: string;
    }

    export interface ClaimPlatform {
        platformName: PlatformType;
        platformId: string;
    }

    export interface RedPacketSentInfoItem {
        create_time: number;
        total_numbers: string;
        total_amounts: string;
        rp_msg: string;
        claim_numbers: string;
        claim_amounts: string;
        token_symbol: string;
        token_decimal: number;
        token_logo: string;
        redpacket_id: Hex;
        trans_hash: Hex;
        log_idx: number;
        chain_id: string;
        redpacket_status: RedPacketStatus;
        claim_strategy: ClaimStrategy[];
        theme_id: string;
        share_from: string;
        networkType?: NetworkType;
    }

    export interface RedPacketClaimedInfoItem {
        redpacket_id: Hex;
        received_time: string;
        rp_msg: string;
        token_amounts: string;
        token_symbol: string;
        token_decimal: number;
        token_logo: string;
        trans_hash: Hex;
        log_idx: string;
        creator: Hex;
        chain_id: string;
        redpacket_status: RedPacketStatus;
        ens_name: string;
        networkType?: NetworkType;
    }

    export interface RedPacketClaimedInfo extends WithNumberChainId<RedPacketClaimedInfoItem> {}
    export interface RedPacketSentInfo extends WithNumberChainId<RedPacketSentInfoItem> {}
    export interface RedPacketClaimListInfo extends WithNumberChainId<RedPacketClaimListInfoItem> {}

    export interface ClaimList {
        creator: string;
        claim_platform: Platform[];
        token_amounts: string;
        token_symbol: string;
        token_decimal: number;
    }

    export interface Platform {
        platformName: PlatformType;
        platformId: string;
        platform_handle: string;
        platform: PlatformType;
        platform_id: string;
    }

    export interface RedPacketClaimListInfoItem {
        list: ClaimList[];
        creator: string;
        create_time: number;
        rp_msg: string;
        claim_numbers: string;
        claim_amounts: string;
        total_numbers: string;
        total_amounts: string;
        token_symbol: string;
        token_decimal: number;
        token_logo: string;
        chain_id: string;
        cursor: string;
        size: string;
        ens_name: string;
    }

    export interface Theme {
        themeId: string;
        payloadUrl: string;
        coverUrl: string;
    }

    export type ThemeSettings = {
        [key in 'title1' | 'title2' | 'title3' | 'title4' | 'title_symbol']: {
            color: '#F1D590';
            font_size: 55;
            font_family: 'Inter';
            font_weight: 700;
            line_height: 63.25;
        };
    } & {
        bg_color: string;
        bg_image: string;
        logo_image: string;
    };

    export interface ThemeGroupSettings {
        /** theme id */
        tid: string;
        cover: ThemeSettings;
        normal: ThemeSettings;
        /** RedPacket without theme settings preset, current ones are default */
        is_default?: boolean;
    }

    export interface Response<T> {
        code: number;
        data: T;
    }

    export type PublicKeyResponse = Response<{
        publicKey: Hex;
    }>;

    export type ClaimResponse = Response<{
        signedMessage: Hex;
    }>;

    export type HistoryResponse = Response<{
        cursor: number;
        size: number;
        list: RedPacketSentInfo[] | RedPacketClaimedInfo[];
    }>;

    export type ClaimHistoryResponse = Response<RedPacketClaimListInfo>;

    export interface ParseOptions {
        text?: string;
        image?: {
            imageUrl: string;
        };
        walletAddress?: string;
        platform?: PlatformType;
        profileId?: string;
    }
    export interface ParseResult {
        content: string;
        /** only `text` for now */
        type: string;
        /** only 1 for now */
        version: number;
        serializable: true;
        meta: object;
        redpacket: {
            /** the same as meta */
            payload: object;
            canClaim: boolean;
            canRefund: boolean;
            canSend: boolean;
            isPasswordValid: boolean;
            isClaimed: boolean;
            isFireflyClaimed: boolean;
            isEmpty: boolean;
            isExpired: boolean;
            isRefunded: boolean;
            isBlacklist: boolean;
            claimedNumber: number;
            claimedAmount: string;
        } | null;
    }
    export type ParseResponse = Response<ParseResult>;

    export type CheckClaimStrategyStatusOptions = {
        rpid: string;
        profile: {
            needLensAndFarcasterHandle?: boolean;
            platform: PlatformType;
            profileId?: string;
            handle?: string;
            lensToken?: string;
            farcasterSignature?: Hex;
            farcasterSigner?: Hex;
            farcasterMessage?: Hex;
        };
        wallet: {
            address: string;
        };
    };
    export type PostReactionKind = 'like' | 'repost' | 'quote' | 'comment' | 'collect';

    export type ClaimStrategyStatus =
        | {
              type: StrategyType.profileFollow;
              payload: Array<{ platform: PlatformType; profileId: string; handle: string }>;
              result: boolean;
          }
        | {
              type: StrategyType.postReaction;
              payload: {
                  reactions: PostReactionKind[];
                  params: Array<{
                      platform: PlatformType;
                      postId: string;
                  }>;
              };
              result:
                  | {
                        conditions: Array<{ key: PostReactionKind; value: boolean }>;
                        hasPassed: boolean;
                    }
                  | boolean;
          }
        | {
              type: StrategyType.nftOwned;
              payload: NftOwnedStrategyPayload[];
              result: {
                  hasPassed: boolean;
                  nfts: {
                      /** instead of number, it's string */
                      chainId: string;
                      contractAddress: Hex;
                      tokenIds: string[];
                  };
              };
          }
        | {
              type: StrategyType.tokens;
              payload: TokensStrategyPayload[];
              result: {
                  hasPassed: boolean;
                  tokens: {
                      hasPassed: boolean;
                      /** instead of number, it's string */
                      chainId: string;
                      contractAddress: Hex;
                      decimals: number;
                      amount: string;
                  };
              };
          }
        | {
              type: StrategyType.channel;
              payload: ChannelStrategyPayload;
              result: boolean;
          };

    export type CheckClaimStrategyStatusResponse = Response<{
        claimStrategyStatus: ClaimStrategyStatus[];
        canClaim: boolean;
    }>;

    export type ThemeListResponse = Response<{
        list: ThemeGroupSettings[];
    }>;

    export type ThemeByIdOptions = { rpid: string } | { themeId: string };
    export type ThemeByIdResponse = Response<ThemeGroupSettings>;
    export type CreateThemeOptions = {
        font_color: string;
        /** image url */
        image: string;
    };
    export type CreateThemeResponse = Response<{ tid: string }>;
}
