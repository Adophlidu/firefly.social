// cspell:disable

import type { ClickOrigin, ProfilePageSource } from '@/constants/enum.js';

export enum VersionFilter {
    // the current working version
    Latest = 'latest',
    // the next version (disabled for the current version)
    Next = 'next',
}

export enum ProviderFilter {
    All = 'all',
    GA = 'google_analytics',
    Safary = 'safary',
}

export enum EventType {
    Debug = 'debug',
    Access = 'access',
    Exit = 'exit',
    Interact = 'interact',
}

export enum ExceptionType {
    Error = 'Error',
}

export enum EventId {
    DEBUG = 'debug',

    // account
    ACCOUNT_CREATE_SUCCESS = 'account_create_success',
    ACCOUNT_LOG_OUT_ALL_SUCCESS = 'account_log_out_all_success', // ✅
    ACCOUNT_CONFLICT = 'account_conflict', // ✅
    ACCOUNT_DELETE_SUCCESS = 'account_delete_success', // ✅

    // compose dialog
    COMPOSE_CROSS_POST_SEND_SUCCESS = 'cross_post_send_success', // ✅
    COMPOSE_SCHEDULED_POST_CREATE_SUCCESS = 'scheduled_post_create_success', // ✅
    COMPOSE_SCHEDULED_POST_UPDATE_SUCCESS = 'scheduled_post_update_success', // ✅
    COMPOSE_SCHEDULED_POST_DELETE_SUCCESS = 'scheduled_post_delete_success', // ✅
    COMPOSE_DRAFT_CREATE_SUCCESS = 'draft_create_success', // ✅
    COMPOSE_DRAFT_BUTTON_CLICK = 'draft_button_click', // ✅

    // mute
    MUTE_ALL_SUCCESS = 'mute_all_success', // ✅
    MUTE_SUCCESS = 'mute_success', // ✅
    UNMUTE_SUCCESS = 'unmute_success', // ✅

    // tips
    TIPS_SEND_SUCCESS = 'tips_send_success', // ✅

    // poll
    POLL_CREATE_SUCCESS = 'poll_create_success', // ✅

    // lucky drop
    LUCKY_DROP_CREATE_SUCCESS = 'lucky_drop_create_success', // ✅
    LUCKY_DROP_REFUND_SUCCESS = 'lucky_drop_refund_success', // ✅
    LUCKY_DROP_CLAIM_SUCCESS = 'lucky_drop_claim_success', // ✅

    // blink
    POST_BLINK_ACTION_SUCCESS = 'post_blink_action_success',
    SIGN_MESSAGE_BLINK_ACTION_SUCCESS = 'sign_message_blink_action_success',
    SHOW_BLINK_ACTION = 'show_blink_action',

    // frame
    POST_FRAME_ACTION_CLICK = 'post_mini_app_click', // ✅
    POST_FRAME_ACTION_SUCCESS = 'post_frame_action_success', // ✅

    // article
    ARTICLE_COLLECT_SUCCESS = 'article_collect_success', // ✅

    // snapshot
    SNAPSHOT_VOTE_SUCCESS = 'snapshot_vote_success', // ✅

    // mint
    MINT_NFT_SUCCESS = 'mint_nft_success', // ✅

    // profile
    PROFILE_EDIT_CLICK = 'account_edit_profile_click', // ✅
    PROFILE_EDIT_SUCCESS = 'account_edit_profile_success', // ✅
    PROFILE_CHANGE_ACCOUNT_CLICK = 'profile_change_account_click',

    // connect wallet
    CONNECT_WALLET_SUCCESS = 'connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_METAMASK = 'metamask_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_RABBY = 'rabby_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_WALLET_CONNECT = 'walletconnect_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_COINBASE = 'coinbase_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_PARTICLE = 'particle_generate_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_BINANCE = 'binancewallet_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_OKX = 'okxwallet_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_ZERION = 'zerion_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_RAINBOW = 'rainbow_connect_wallet_success', // ✅
    CONNECT_WALLET_SUCCESS_PHANTOM = 'phantom_connect_wallet_success', // ✅

    // farcaster
    FARCASTER_LOG_IN_SUCCESS = 'farcaster_log_in_success', // ✅
    FARCASTER_LOG_OUT_SUCCESS = 'farcaster_log_out_success', // ✅
    FARCASTER_ACCOUNT_DISCONNECT_SUCCESS = 'account_farcaster_disconnect_success',
    FARCASTER_POST_SEND_SUCCESS = 'farcaster_cast_send_success', // ✅
    FARCASTER_POST_LIKE_SUCCESS = 'farcaster_cast_like_success', // ✅
    FARCASTER_POST_UNLIKE_SUCCESS = 'farcaster_cast_unlike_success', // ✅
    FARCASTER_POST_REPLY_SUCCESS = 'farcaster_cast_reply_success', // ✅
    FARCASTER_POST_REPOST_SUCCESS = 'farcaster_cast_recast_success', // ✅
    FARCASTER_POST_UNDO_REPOST_SUCCESS = 'farcaster_cast_undo_recast_success', // ✅
    FARCASTER_POST_DELETE_SUCCESS = 'farcaster_cast_delete_success', // ✅
    FARCASTER_POST_QUOTE_SUCCESS = 'farcaster_cast_quote_success', // ✅
    FARCASTER_POST_SHARE_SUCCESS = 'farcaster_cast_share_success', // ✅
    FARCASTER_POST_BOOKMARK_SUCCESS = 'farcaster_cast_bookmark_success', // ✅
    FARCASTER_POST_UNBOOKMARK_SUCCESS = 'farcaster_cast_unbookmark_success', // ✅
    FARCASTER_POST_COLLECT_SUCCESS = 'farcaster_cast_collect_success', // ✅
    FARCASTER_PROFILE_FOLLOW_SUCCESS = 'farcaster_follow_success', // ✅
    FARCASTER_PROFILE_UNFOLLOW_SUCCESS = 'farcaster_unfollow_success', // ✅
    FARCASTER_PROFILE_SUPER_FOLLOW_SUCCESS = 'farcaster_superfollow_success', // ✅

    // lens
    LENS_ACCOUNT_LOG_IN_SUCCESS = 'lens_log_in_success', // ✅
    LENS_ACCOUNT_LOG_OUT_SUCCESS = 'lens_log_out_success', // ✅
    LENS_ACCOUNT_DISCONNECT_SUCCESS = 'account_lens_disconnect_success',
    LENS_POST_SEND_SUCCESS = 'lens_post_send_success', // ✅
    LENS_POST_LIKE_SUCCESS = 'lens_post_like_success', // ✅
    LENS_POST_UNLIKE_SUCCESS = 'lens_post_unlike_success', // ✅
    LENS_POST_REPLY_SUCCESS = 'lens_post_reply_success', // ✅
    LENS_POST_REPOST_SUCCESS = 'lens_post_repost_success', // ✅
    LENS_POST_UNDO_REPOST_SUCCESS = 'lens_post_unmirror_success', // ✅
    LENS_POST_DELETE_SUCCESS = 'lens_post_delete_success', // ✅
    LENS_POST_QUOTE_SUCCESS = 'lens_post_quote_success', // ✅
    LENS_POST_SHARE_SUCCESS = 'lens_post_share_success', // ✅
    LENS_POST_BOOKMARK_SUCCESS = 'lens_post_bookmark_success', // ✅
    LENS_POST_UNBOOKMARK_SUCCESS = 'lens_post_unbookmark_success', // ✅
    LENS_PROFILE_FOLLOW_SUCCESS = 'lens_follow_success', // ✅
    LENS_PROFILE_UNFOLLOW_SUCCESS = 'lens_unfollow_success', // ✅
    LENS_PROFILE_SUPER_FOLLOW_SUCCESS = 'lens_superfollow_success', // ✅

    // x
    X_ACCOUNT_LOG_IN_SUCCESS = 'x_log_in_success', // ✅
    X_ACCOUNT_LOG_OUT_SUCCESS = 'x_log_out_success', // ✅
    X_ACCOUNT_DISCONNECT_SUCCESS = 'account_x_disconnect_success',
    X_POST_SEND_SUCCESS = 'x_post_send_success', // ✅
    X_POST_LIKE_SUCCESS = 'x_post_like_success', // ✅
    X_POST_UNLIKE_SUCCESS = 'x_post_unlike_success', // ✅
    X_POST_REPLY_SUCCESS = 'x_post_reply_success', // ✅
    X_POST_REPOST_SUCCESS = 'x_post_repost_success', // ✅
    X_POST_UNDO_REPOST_SUCCESS = 'x_post_undo_repost_success', // ✅
    X_POST_DELETE_SUCCESS = 'x_post_delete_success', // ✅
    X_POST_QUOTE_SUCCESS = 'x_post_quote_success', // ✅
    X_POST_SHARE_SUCCESS = 'x_post_share_success', // ✅
    X_POST_BOOKMARK_SUCCESS = 'x_post_bookmark_success', // ✅
    X_POST_UNBOOKMARK_SUCCESS = 'x_post_unbookmark_success', // ✅
    X_POST_COLLECT_SUCCESS = 'x_post_collect_success', // ✅
    X_PROFILE_FOLLOW_SUCCESS = 'x_follow_success', // ✅
    X_PROFILE_UNFOLLOW_SUCCESS = 'x_unfollow_success', // ✅
    X_PROFILE_SUPER_FOLLOW_SUCCESS = 'x_superfollow_success', // ✅

    // bsky
    BSKY_ACCOUNT_LOG_IN_SUCCESS = 'bsky_log_in_success', // ✅
    BSKY_ACCOUNT_LOG_OUT_SUCCESS = 'bsky_log_out_success', // ✅
    BSKY_ACCOUNT_DISCONNECT_SUCCESS = 'account_bsky_disconnect_success',
    BSKY_POST_SEND_SUCCESS = 'bsky_post_send_success', // ✅
    BSKY_POST_LIKE_SUCCESS = 'bsky_post_like_success', // ✅
    BSKY_POST_UNLIKE_SUCCESS = 'bsky_post_unlike_success', // ✅
    BSKY_POST_REPLY_SUCCESS = 'bsky_post_reply_success', // ✅
    BSKY_POST_REPOST_SUCCESS = 'bsky_post_repost_success', // ✅
    BSKY_POST_UNDO_REPOST_SUCCESS = 'bsky_post_undo_repost_success', // ✅
    BSKY_POST_DELETE_SUCCESS = 'bsky_post_delete_success', // ✅
    BSKY_POST_QUOTE_SUCCESS = 'bsky_post_quote_success', // ✅
    BSKY_POST_SHARE_SUCCESS = 'bsky_post_share_success', // ✅
    BSKY_POST_BOOKMARK_SUCCESS = 'bsky_post_bookmark_success', // ✅
    BSKY_POST_UNBOOKMARK_SUCCESS = 'bsky_post_unbookmark_success', // ✅
    BSKY_POST_COLLECT_SUCCESS = 'bsky_post_collect_success', // ✅
    BSKY_PROFILE_FOLLOW_SUCCESS = 'bsky_follow_success', // ✅
    BSKY_PROFILE_UNFOLLOW_SUCCESS = 'bsky_unfollow_success', // ✅
    BSKY_PROFILE_SUPER_FOLLOW_SUCCESS = 'bsky_superfollow_success', // ✅

    // wallet
    WALLET_FOLLOW_SUCCESS = 'follow_wallet_success',
    WALLET_UNFOLLOW_SUCCESS = 'unfollow_wallet_success',

    // apple
    APPLE_ACCOUNT_LOG_IN_SUCCESS = 'apple_log_in_success',
    APPLE_ACCOUNT_LOG_OUT_SUCCESS = 'apple_log_out_success',
    APPLE_ACCOUNT_DISCONNECT_SUCCESS = 'apple_disconnect_success',

    // google
    GOOGLE_ACCOUNT_LOG_IN_SUCCESS = 'google_log_in_success',
    GOOGLE_ACCOUNT_LOG_OUT_SUCCESS = 'google_log_out_success',
    GOOGLE_ACCOUNT_DISCONNECT_SUCCESS = 'google_disconnect_success',

    // telegram
    TELEGRAM_ACCOUNT_LOG_IN_SUCCESS = 'telegram_log_in_success',
    TELEGRAM_ACCOUNT_LOG_OUT_SUCCESS = 'telegram_log_out_success',
    TELEGRAM_ACCOUNT_DISCONNECT_SUCCESS = 'telegram_disconnect_success',

    EMAIL_ACCOUNT_LOG_IN_SUCCESS = 'email_log_in_success',
    EMAIL_ACCOUNT_LOG_OUT_SUCCESS = 'email_log_out_success',
    EMAIL_ACCOUNT_DISCONNECT_SUCCESS = 'email_disconnect_success',

    // activity
    EVENT_SHARE_CLICK = 'event_share_click',
    EVENT_FARCASTER_LOG_IN_SUCCESS = 'event_far_log_in_success',
    EVENT_LENS_LOG_IN_SUCCESS = 'event_lens_log_in_success',
    EVENT_X_LOG_IN_SUCCESS = 'event_x_log_in_success',
    EVENT_BSKY_LOG_IN_SUCCESS = 'event_bsky_log_in_success',
    EVENT_CONNECT_WALLET_SUCCESS = 'event_connect_wallet_success',
    EVENT_CHANGE_WALLET_SUCCESS = 'event_change_wallet_success',
    EVENT_CLAIM_BASIC_SUCCESS = 'event_claim_basic_success',
    EVENT_CLAIM_PREMIUM_SUCCESS = 'event_claim_premium_success',

    // swap
    EVENT_FOLLOWING_SWAP_CLICK = 'following_swap_click',
    EVENT_LIKE_SWAP_CLICK = 'like_trade_success',
    EVENT_SWAP_DETAIL_CLICK = 'swap_detail_click',

    // channel
    CHANNEL_FOLLOW_ON_FARCASTER_SUCCESS = 'farcaster_follow_channel_success',
    CHANNEL_UNFOLLOW_ON_FARCASTER_SUCCESS = 'farcaster_unfollow_channel_success',
    CHANNEL_JOIN_ON_LENS_SUCCESS = 'lens_join_group_success',
    CHANNEL_LEAVE_ON_LENS_SUCCESS = 'lens_leave_group_success',
    CHANNEL_ADD_ON_BSKY_SUCCESS = 'bsky_add_feed_success',
    CHANNEL_REMOVE_ON_BSKY_SUCCESS = 'bsky_remove_feed_success',

    // filter tab
    POSTS_FILTER_CHANGE = 'tab_social_filter_click',
    CHAIN_FILTER_CHANGE = 'tab_chain_filter_click',
    ACTIVITIES_FILTER_CHANGE = 'tab_platform_filter_click',
}

export enum ExceptionId {
    BIND_OR_RESTORE_FIREFLY_SESSION = 'bind_or_restore_firefly_session',
    RESUME_LENS_SESSION = 'resume_lens_session',
    RESUME_BSKY_SESSION = 'resume_bsky_session',
}

export interface Event {
    type: EventType;
    // bypassing the type check
    parameters: {};
}

export interface Exception {
    type: ExceptionType;
    error: Error;
}

export type AccountPairs = Array<[string, string]>; // [id, handle]

export const enum FarcasterLoginType {
    Reconnect = 'Reconnect',
    NewConnect = 'NewConnect',
    Wallet = 'Wallet',
}

export type FrameActionType = 'click' | 'buy' | 'mint' | 'others';

export interface FarcasterEventParameters {
    source_firefly_account_id: string;
    source_farcaster_handle: string;
    source_farcaster_id: string;
    target_farcaster_id?: string;
    target_farcaster_handle?: string;
}

export interface FarcasterPostEventParameters extends FarcasterEventParameters {
    target_farcaster_cast_id: string;
}

export interface LensEventParameters {
    source_firefly_account_id: string;
    source_lens_id: string;
    source_lens_handle: string;
    target_lens_id: string;
    target_lens_handle: string;
}

export interface LensPostEventParameters extends LensEventParameters {
    target_lens_post_id: string;
}

export interface TwitterEventParameters {
    source_firefly_account_id: string;
    source_x_id: string;
    source_x_handle: string;
    target_x_id: string;
    target_x_handle: string;
}

export interface TwitterPostEventParameters extends TwitterEventParameters {
    target_x_post_id: string;
}

export interface BskyEventParameters {
    source_firefly_account_id: string;
    source_bsky_id: string;
    source_bsky_handle: string;
    target_bsky_id: string;
    target_bsky_handle: string;
}

export interface BskyPostEventParameters extends BskyEventParameters {
    target_bsky_post_id: string;
}

export interface WalletEventParameters {
    firefly_account_id: string;
    wallet_type: 'evm' | 'solana' | 'unknown';
    wallet_address: string;
    wallet_name: string;
}

export interface ActivityWalletEventParameters extends WalletEventParameters {
    activity: string;
}

export interface LuckyDropEventParameters extends WalletEventParameters {
    lucky_drop_id: string;
    amount: string;
    currency: string;
    amount_usd?: number;
    winners: number;
    distribution_rule: 'random' | 'equal';
    chain_id: string;
    chain_name: string;
    free_gas: boolean;
}

export interface ConnectWalletEventParameters extends WalletEventParameters {
    click_location: ClickOrigin;
    click_time: number;
    connect_success_time: number;
    connect_duration: number;
}

export interface ComposeEventParameters {
    firefly_account_id: string;

    // lens
    include_lens_post: boolean;
    lens_id?: string;
    lens_handle?: string;
    lens_post_ids?: string[];

    // farcaster
    include_farcaster_cast: boolean;
    farcaster_id?: string;
    farcaster_handle?: string;
    farcaster_cast_ids?: string[];

    // twitter
    include_x_post: boolean;
    x_id?: string;
    x_handle?: string;
    x_post_ids?: string[];

    include_bsky_post: boolean;
    bsky_id?: string;
    bsky_handle?: string;
    bsky_post_ids?: string[];

    // thread
    is_thread: boolean;

    // draft
    is_draft: boolean;
    draft_id?: string;

    // schedule
    is_scheduled: boolean;
    schedule_id?: string;

    // rp
    include_lucky_drop: boolean;
    lucky_drop_ids?: string[];

    // poll
    include_poll: boolean;
    poll_id?: string;

    include_x_poll: boolean;
    x_poll_id?: string;

    include_lens_poll: boolean;
    lens_poll_id?: string;

    include_farcaster_poll: boolean;
    farcaster_poll_id?: string;

    // flags
    include_image: boolean;
    include_video: boolean;
}

export interface Events extends Record<EventId, Event> {
    [EventId.DEBUG]: {
        type: EventType.Debug;
        parameters: {
            message: string;
        };
    };

    [EventId.ACCOUNT_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;

            // lens
            by_lens: boolean;
            lens_id?: string;
            lens_handle?: string;

            // farcaster
            by_farcaster: boolean;
            farcaster_id?: string;
            farcaster_handle?: string;

            // x
            by_x: boolean;
            x_id?: string;
            x_handle?: string;
        };
    };
    [EventId.ACCOUNT_LOG_OUT_ALL_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.PROFILE_EDIT_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.PROFILE_CHANGE_ACCOUNT_CLICK]: {
        type: EventType.Interact;
        parameters: {
            target_platform: ProfilePageSource;
            target_id: string;
        };
    };
    [EventId.PROFILE_EDIT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            change_avatar: boolean;
            change_nickname: boolean;
        };
    };
    [EventId.ACCOUNT_CONFLICT]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            conflict_firefly_account_id: string;
            continue_login: boolean;
        };
    };
    [EventId.ACCOUNT_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_accounts: AccountPairs;
            lens_accounts: AccountPairs;
            x_accounts: AccountPairs;
            bsky_accounts: AccountPairs;
        };
    };

    [EventId.CONNECT_WALLET_SUCCESS]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_METAMASK]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_RABBY]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_WALLET_CONNECT]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_COINBASE]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_PARTICLE]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_BINANCE]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_OKX]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_ZERION]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_RAINBOW]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };
    [EventId.CONNECT_WALLET_SUCCESS_PHANTOM]: {
        type: EventType.Interact;
        parameters: ConnectWalletEventParameters;
    };

    [EventId.COMPOSE_CROSS_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: ComposeEventParameters;
    };
    [EventId.COMPOSE_SCHEDULED_POST_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            schedule_id: string;
            schedule_time: number;
            scheduled_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        } & ComposeEventParameters;
    };
    [EventId.COMPOSE_SCHEDULED_POST_UPDATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            schedule_id: string;
            new_schedule_time: number;
            new_scheduled_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        };
    };
    [EventId.COMPOSE_SCHEDULED_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            schedule_id: string;
            schedule_time: number;
            scheduled_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        };
    };
    [EventId.COMPOSE_DRAFT_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            draft_id: string;
            draft_time: number;
            draft_time_utc: string; // mm-dd-yyyy hh:mm:ss(GMT+0)
        } & ComposeEventParameters;
    };
    [EventId.COMPOSE_DRAFT_BUTTON_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.MUTE_ALL_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.MUTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.UNMUTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.TIPS_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            target_wallet_address: string; // address all lowercased
            target_firefly_account_id?: string;
            amount: string;
            currency: string;
            amount_usd?: number;
            chain_id: number;
            chain_name: string;
        } & WalletEventParameters;
    };
    [EventId.LUCKY_DROP_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LuckyDropEventParameters;
    };
    [EventId.LUCKY_DROP_CLAIM_SUCCESS]: {
        type: EventType.Interact;
        parameters: LuckyDropEventParameters;
    };
    [EventId.LUCKY_DROP_REFUND_SUCCESS]: {
        type: EventType.Interact;
        parameters: WalletEventParameters;
    };
    [EventId.POLL_CREATE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            poll_id: string;
        };
    };
    [EventId.SNAPSHOT_VOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: WalletEventParameters;
    };
    [EventId.MINT_NFT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            chain_id: string;
            free_mint: boolean;
            nft_ca: string;
        } & WalletEventParameters;
    };
    [EventId.ARTICLE_COLLECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            article_id: string;
            free_mint: boolean;
        } & WalletEventParameters;
    };
    [EventId.POST_FRAME_ACTION_CLICK]: {
        type: EventType.Interact;
        parameters: {
            frame_action: FrameActionType;
            frame_version: string;
            frame_url: string;
        } & WalletEventParameters;
    };
    [EventId.POST_FRAME_ACTION_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            frame_action: FrameActionType;
            frame_version: string;
            frame_url: string;
        } & WalletEventParameters;
    };
    [EventId.POST_BLINK_ACTION_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            blink_action: 'buy' | 'mint' | 'others';
        } & WalletEventParameters;
    };
    [EventId.SIGN_MESSAGE_BLINK_ACTION_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            blink_action: 'buy' | 'mint' | 'others';
        } & WalletEventParameters;
    };
    [EventId.SHOW_BLINK_ACTION]: {
        type: EventType.Interact;
        parameters: {
            blink_url: string;
        };
    };

    // ----------------
    // farcaster
    // ----------------

    [EventId.FARCASTER_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            farcaster_accounts: AccountPairs;
            login_type: FarcasterLoginType;
        };
    };
    [EventId.FARCASTER_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_id: string;
            farcaster_handle: string;
        };
    };
    [EventId.FARCASTER_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_id: string;
            farcaster_handle: string;
        };
    };
    [EventId.FARCASTER_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            farcaster_cast_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.FARCASTER_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            farcaster_id: string;
            farcaster_handle: string;
            farcaster_cast_id: string;
        };
    };
    [EventId.FARCASTER_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterPostEventParameters;
    };
    [EventId.FARCASTER_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterEventParameters;
    };
    [EventId.FARCASTER_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterEventParameters;
    };
    [EventId.FARCASTER_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: FarcasterEventParameters & WalletEventParameters;
    };

    // ----------------
    // lens
    // ----------------

    [EventId.LENS_ACCOUNT_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            lens_accounts: AccountPairs;
        };
    };
    [EventId.LENS_ACCOUNT_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            lens_id: string;
            lens_handle: string;
        };
    };
    [EventId.LENS_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            lens_id: string;
            lens_handle: string;
        };
    };
    [EventId.LENS_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            lens_post_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.LENS_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            lens_id: string;
            lens_handle: string;
            lens_post_id: string;
        };
    };
    [EventId.LENS_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensPostEventParameters;
    };
    [EventId.LENS_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensEventParameters;
    };
    [EventId.LENS_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensEventParameters;
    };
    [EventId.LENS_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: LensEventParameters & WalletEventParameters;
    };

    // ----------------
    // x
    // ----------------

    [EventId.X_ACCOUNT_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            x_accounts: AccountPairs;
        };
    };
    [EventId.X_ACCOUNT_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            x_id: string;
            x_handle: string;
        };
    };
    [EventId.X_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            x_id: string;
            x_handle: string;
        };
    };
    [EventId.X_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            x_post_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.X_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            x_id: string;
            x_handle: string;
            x_post_id: string;
        };
    };
    [EventId.X_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterPostEventParameters;
    };
    [EventId.X_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterEventParameters;
    };
    [EventId.X_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterEventParameters;
    };
    [EventId.X_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: TwitterEventParameters & WalletEventParameters;
    };

    // ----------------
    // bsky
    // ----------------

    [EventId.BSKY_ACCOUNT_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            bsky_accounts: AccountPairs;
        };
    };
    [EventId.BSKY_ACCOUNT_LOG_OUT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            bsky_id: string;
            bsky_handle: string;
        };
    };
    [EventId.BSKY_ACCOUNT_DISCONNECT_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            bsky_id: string;
            bsky_handle: string;
        };
    };
    [EventId.BSKY_POST_SEND_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            bsky_post_ids?: string[];
        } & ComposeEventParameters;
    };
    [EventId.BSKY_POST_DELETE_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            bsky_id: string;
            bsky_handle: string;
            bsky_post_id: string;
        };
    };
    [EventId.BSKY_POST_REPLY_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_LIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_UNLIKE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_QUOTE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_UNDO_REPOST_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_SHARE_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_POST_BOOKMARK_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyPostEventParameters;
    };
    [EventId.BSKY_PROFILE_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyEventParameters;
    };
    [EventId.BSKY_PROFILE_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyEventParameters;
    };
    [EventId.BSKY_PROFILE_SUPER_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: BskyEventParameters & WalletEventParameters;
    };

    // Wallet
    [EventId.WALLET_FOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };
    [EventId.WALLET_UNFOLLOW_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
        };
    };

    // Activity
    [EventId.EVENT_X_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            x_accounts: AccountPairs;
        };
    };
    [EventId.EVENT_LENS_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            lens_accounts: AccountPairs;
        };
    };
    [EventId.EVENT_FARCASTER_LOG_IN_SUCCESS]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            is_token_sync: boolean;
            farcaster_accounts: AccountPairs;
        };
    };
    [EventId.EVENT_SHARE_CLICK]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            activity: string;
        };
    };
    [EventId.EVENT_CONNECT_WALLET_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.EVENT_CHANGE_WALLET_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.EVENT_CLAIM_BASIC_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.EVENT_CLAIM_PREMIUM_SUCCESS]: {
        type: EventType.Interact;
        parameters: ActivityWalletEventParameters;
    };
    [EventId.POSTS_FILTER_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            social_selected: string;
            page_source: string;
        };
    };

    [EventId.CHAIN_FILTER_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            chain_id: string;
            chain_name: string;
            page_source: string;
        };
    };

    [EventId.ACTIVITIES_FILTER_CHANGE]: {
        type: EventType.Interact;
        parameters: {
            firefly_account_id: string;
            platform_selected: string;
            page_source: string;
        };
    };
}

export abstract class Provider<
    Events extends Record<EventId, Event>,
    Exceptions extends Record<ExceptionId, Exception>,
> {
    abstract captureEvent<T extends EventId>(name: EventId, parameters: Events[T]['parameters']): Promise<void>;
    abstract captureException<T extends ExceptionId>(name: ExceptionId, error: Exceptions[T]['error']): Promise<void>;
}
